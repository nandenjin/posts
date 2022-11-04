# openFrameworks を Emscripten でビルドするメモ

[こちらの展示](https://note.com/nandenjin/n/n65fb5722aa07)をするにあたって、openFrameworks で作ったアプリケーションを iPad で簡易に動作させるために、Emscripten によるビルドを試しました。ドキュメントどおりに動かなかったことや、そもそもドキュメントされていないことが多かったのでメモを残します。

[[toc]]

この記事の内容は 2022 年 10 月現在のもので、環境は以下のとおりです。

```yaml
- device: Macbook Air (M1, 2020)
- os: macOS Monterey 12.6
- openFrameworks: v0.11.2
```

## `error: undefined symbol: _ZN24ofxEmscriptenSoundStreamC1Ev`

**TL;DR: oF 公式のドキュメントの通りにセットアップしても動作しない。emsdk 1.40.0 を使用する。Apple Sillicon（arm64）の場合は、Docker コンテナで emsdk を利用する。**

[openFrameworks 公式の emScripten セットアップ手順](https://openframeworks.cc/ja/setup/emscripten/)（[ソース `9f835a`](https://github.com/openframeworks/ofSite/blob/9f835af9bfb53caf9f761d9ac63cb91cb9b45926/content/setup/emscripten.ja.md)）に従いビルドすると、以下のようなエラーになりました。

```sh
# 利用可能なツール群の最新のレジストリをフェッチする
./emsdk update

# 最新のSDKをインストールする
./emsdk install latest

# "latest"のSDKを有効にする
./emsdk activate latest

# 任意のexampleへ移動
cd examples/3d/3DPrimitivesExample

# ビルドを実行
emmake make
```

```
error: undefined symbol: _ZN24ofxEmscriptenSoundStreamC1Ev (referenced by top-level compiled C/C++ code)
warning: Link with `-sLLD_REPORT_UNDEFINED` to get more information on undefined symbols
warning: To disable errors for undefined symbols use `-sERROR_ON_UNDEFINED_SYMBOLS=0`
warning: __ZN24ofxEmscriptenSoundStreamC1Ev may need to be added to EXPORTED_FUNCTIONS if it arrives from a system library
error: undefined symbol: tessDeleteTess (referenced by top-level compiled C/C++ code)
warning: _tessDeleteTess may need to be added to EXPORTED_FUNCTIONS if it arrives from a system library
error: undefined symbol: tessNewTess (referenced by top-level compiled C/C++ code)
warning: _tessNewTess may need to be added to EXPORTED_FUNCTIONS if it arrives from a system library
Error: Aborting compilation due to previous errors
```

これは emsdk のバージョンを落とすことで解決しました。実は[上記ページの英語版](https://openframeworks.cc/setup/emscripten/)（[ソース `9f835a`](https://github.com/openframeworks/ofSite/blob/9f835af9bfb53caf9f761d9ac63cb91cb9b45926/content/setup/emscripten.md)）では emsdk の`latest`ではなく`1.40.0`を入れるように指示していますがが、日本語版では訳が追いついていないようです。これより先に気づくかもしれませんが、SDK のインストール方法も日本語版のものは古くなっており、インストーラをダウンロードするものは廃止されています。

```sh
# 注: Apple Silliconはこの方法ではうまくいかない

git clone https://github.com/emscripten-core/emsdk
cd emsdk
./emsdk install sdk-1.40.0-64bit
./emsdk activate sdk-1.40.0-64bit
source ./emsdk_env.sh
```

しかし[Emscripten 1.40.0 のリリースは 2020 年 7 月](https://github.com/emscripten-core/emscripten/blob/main/ChangeLog.md#1400-07302020)であり、当時 Apple Sillicon は存在しなかったため、arm64 向けのビルド済みファイルがリリースされておらず、インストールが失敗します。

あれこれ探しましたが、これを最も手軽に解決できるのは Docker コンテナを使うことのようです。

- [Docker: `emscripten/emsdk`](https://hub.docker.com/r/emscripten/emsdk)

これにボリューム接続と workdir の設定を加え、以下のような呪文にしてビルドを実行することでようやく成功しました。

```sh
# Apple Silliconプロセッサの場合

# PROJECT_ROOTで
# - Ex: cd /examples/3d/3DPrimitivesExample
docker run --rm -v $(realpath ./../../../):/src -u $(id -u):$(id -g) \
	--workdir=/src/$(realpath --relative-to=$(realpath ./../../../) .) \
	emscripten/emsdk:1.40.0 emmake make
```

なお最初のエラーにあるように`-sERROR_ON_UNDEFINED_SYMBOLS=0`を使えばよいのかもしれませんが、未検証です。

## `RuntimeError: abort(OOM)`

ブラウザで起動すると WASM から投げられるエラーです。`OOM` = Out of memory であり、ビルド時に設定する割当てメモリ量が不足していました。なお oF が設定するデフォルトのメモリ量は 128MiB のようです[^1]。

[^1]: [`/libs/openFrameworksCompiled/project/emscripten/config.emscripten.default.mk#L81`](https://github.com/openframeworks/openFrameworks/blob/0.11.2/libs/openFrameworksCompiled/project/emscripten/config.emscripten.default.mk#L81) に記述されている

Emscipten のビルドコマンドに、次のうち少なくとも 1 つのオプションを渡す必要があります。

- `-s TOTAL_MEMORY=xxxxxxx`: メモリ量を増やす
- `-s ALLOW_MEMORY_GROWTH=1`: メモリの動的な割当増を許可する

このうち前者のメモリ割当量を増やす方法が、 `PROJECT_ROOT/config.make` 内に以下を記述することで簡単に実現できました。

```makefile
# PROJECT_ROOT/config.make
 # メモリ上限の設定。64KiB = 64 * 1024の整数倍となる必要がある
 PROJECT_EMSCRIPTEN_TOTAL_MEMORY = 536870912
```

メモリは 1 ページ 64KB で確保されるので、指定値は`64 * 1024`byte の整数倍となる必要があります。例えば 500MB は `536870912` です。また、設定ファイルの位置から分かるように、この設定は app ごとに固有で設定できます。

ただし、この値は Release ビルドのみに適用され、Debug ビルドでは適用されないようです[^2]。

[^2]: [`/libs/openFrameworksCompiled/project/emscripten/config.emscripten.default.mk#L103-L105`](https://github.com/openframeworks/openFrameworks/blob/0.11.2/libs/openFrameworksCompiled/project/emscripten/config.emscripten.default.mk#L103-L105) | oF のセットアップガイドを読む限り、Emscripten ビルドはオンラインに Demo を置くための機能といった位置づけのようで、Web 上のページに数百 MB もメモリを使うものを置かないように作るべきと考えれば合理的かもしれない。もっとうまく説明できる人がいれば聞きたいです

後者の `-s ALLOW_MEMORY_GROWTH=1` の指定方法は次項で詳述します。

## Emscripten に渡すオプションを調整する

**TL;DR: `config.make` （app 単位）または `config.emscripten.default.mk` に記述する。**

上述のように app 単位のビルド設定は `PROJECT_ROOT/config.make` に記述できました。Emscripten 関連でここに記述できるのは以下の 3 項目のようです。

- `PROJECT_EMSCRIPTEN_TOTAL_MEMORY`: 前項参照。`-s TOTAL_MEMORY` を指定する。default = `134217728`（128MiB）
- `USE_CCACHE`: ビルドコマンドで ccache を使用するようになる。
- `PROJECT_EMSCRIPTEN_TEMPLATE`: `--shell-file` = 生成された実行ファイルが埋め込まれる HTML テンプレートファイルを指定する。次項で詳述。

これらのパラメータについてさらに詳細な挙動を参照する、あるいはこれらで実現できない設定を書くには、`/libs/openFrameworksCompiled/project/emscripten/config.emscripten.default.mk`（[GitHub](https://github.com/openframeworks/openFrameworks/blob/0.11.2/libs/openFrameworksCompiled/project/emscripten/config.emscripten.default.mk)）を使用しました。こちらのファイルの内容は、この oF ライブラリを使うすべてのプロジェクトが影響を受けます。

```makefile
################################################################################
# LOW LEVEL CONFIGURATION BELOW
#   The following sections should only rarely be modified.  They are meant for
#   developers who need fine control when, for instance, creating a platform
#   specific makefile for a new openFrameworks platform, such as raspberry pi.
################################################################################
```

例えば前項の`-s ALLOW_MEMORY_GROWTH=1`を追加するにはこのようにできます。

```makefile
PLATFORM_LDFLAGS += -s ALLOW_MEMORY_GROWTH=1
```

またこれも前述の、Release / Debug で異なるオプションが入る実装もここにあります（[GitHub](https://github.com/openframeworks/openFrameworks/blob/0.11.2/libs/openFrameworksCompiled/project/emscripten/config.emscripten.default.mk#L103-L105)）。

```makefile
PLATFORM_OPTIMIZATION_LDFLAGS_RELEASE = -O3 -s TOTAL_MEMORY=$(PLATFORM_EMSCRIPTEN_TOTAL_MEMORY) --memory-init-file 1

PLATFORM_OPTIMIZATION_LDFLAGS_DEBUG = -g3 -s TOTAL_MEMORY=134217728 --memory-init-file 1  -s DEMANGLE_SUPPORT=1 -s ASSERTIONS=2
```

## HTML テンプレート（Shell file）を編集する

**TL;DR: `PROJECT_ROOT/config.make` で `PROJECT_EMSCRIPTEN_TEMPLATE` を指定することで、カスタムのテンプレートを使用できる。**

ビルドで出力される HTML は、デフォルトでは oF が内蔵するテンプレートが使用され、oF のロゴや標準出力のフィールドが入ったものになります。テンプレートは Emscripten では"Shell file"と呼ばれており、ビルド時に渡されます。

`PROJECT_ROOT/config.make` に `PROJECT_EMSCRIPTEN_TEMPLATE` を記述することで、 app ごとに独自の Shell file を指定できました。Emscripten は JS で`Module`というオブジェクトを作成しますが、そのための`<script>`タグを、Shell file 内のプレースホルダを置き換えて挿入します。これよりも前に`Module`オブジェクトを定義し、出力のためのメソッドなどを定義しておけば、Emscripten のコードとうまく連携ができる仕組みです。

```makefile
# config.make
PROJECT_EMSCRIPTEN_TEMPLATE = $(PROJECT_ROOT)/bin/data/template.html
```

```html
<!DOCTYPE html>
<!-- https://github.com/emscripten-core/emscripten/blob/1.40.0/src/shell_minimal.html -->
<html lang="en-us">
  <head>
    <!-- ... -->
  </head>
  <body>
    <!-- ... -->
    <script type="text/javascript">
      var statusElement = document.getElementById("status");
      var progressElement = document.getElementById("progress");
      var spinnerElement = document.getElementById("spinner");

      var Module = {
        preRun: [],
        postRun: [],
        print: (function () {
          // ...
        })(),
        // ...
      };
      Module.setStatus("Downloading...");
      window.onerror = function () {
        Module.setStatus("Exception thrown, see JavaScript console");
        spinnerElement.style.display = "none";
        Module.setStatus = function (text) {
          if (text) Module.printErr("[post-exception status] " + text);
        };
      };
    </script>
    {{{ SCRIPT }}}
  </body>
</html>
```

Emscripten のリポジトリには Shell file の最小限の実装例がある（上記 Snippet は一部。oF のテンプレもこれをベースにしている模様）のでこちらを元にカスタマイズすればよいはずですが、実装がかなりレガシーな雰囲気なので、中身を理解した上で自分で書き直すほうが楽かもしれません。

- [Emscripten の Minimal shell file](https://github.com/emscripten-core/emscripten/blob/1.40.0/src/shell_minimal.html)
- [oF の内蔵する Shell file](https://github.com/openframeworks/openFrameworks/blob/0.11.2/libs/openFrameworksCompiled/project/emscripten/template.html)
- [Emscripten の`Module`オブジェクトの Reference](https://emscripten.org/docs/api_reference/module.html)

ちなみに今回[個人的に書き直した Shell file はこちら](https://gist.github.com/nandenjin/12e5aec866cf9be638a85d39e6e153a6#file-template-html)。展示の目的で作っているので、キャンバスを全画面にし、標準出力は用意していません。

（しっかり検証できていませんが、試した限り、たとえサンプルそのままのファイルでも progress update が 1 回も発火しなかったり、oF 版のテンプレートは実装が間違っているように見える箇所[^3]があったりと、なにか混沌とした雰囲気を感じます……）

[^3]: [`/libs/openFrameworksCompiled/project/emscripten/template.html#L183-184`](https://github.com/openframeworks/openFrameworks/blob/0.11.2/libs/openFrameworksCompiled/project/emscripten/template.html#L183-L184) : 30ms より近い間隔で発火したものを無視したいと思われるが、意味のない比較をしているように見える。 [Emscripten の実装](https://github.com/emscripten-core/emscripten/blob/1.40.0/src/shell_minimal.html#L114-L115) は正しいように思える

## 疑義・指摘

本記事は[GitHub にソースがあります](https://github.com/nandenjin/posts/tree/dev/2022/of-emscripten)。Issue や PR でのご指摘をお待ちしています。
