<template>
  <header class="site-header">
    <a href="https://www.nandenjin.com" class="logo">Kazumi Inada</a>
    <div class="back">
      <a href="https://www.nandenjin.com">Back to Portfolio</a>
    </div>
  </header>
</template>

<style lang="scss" scoped>
@use "../styles/media.scss";

.site-header {
  display: grid;
  grid-template-columns: 200px auto;
  margin: 50px auto;
  width: calc(100vw - 100px);
  font-family: "Questrial", sans-serif;

  @include media.mq {
    margin: 50px auto;
    width: calc(100vw - 40px);
  }

  .logo {
    display: inline-block;
    width: 200px;
    height: 30px;
    background: url("../assets/kazumi-inada.svg") center/contain no-repeat;
    text-indent: -100vw;
  }

  .back {
    text-align: right;

    a {
      color: inherit;
      text-decoration: none;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-size: 0.9rem;
    }

    @include media.mq {
      display: none;
    }
  }
}
</style>
