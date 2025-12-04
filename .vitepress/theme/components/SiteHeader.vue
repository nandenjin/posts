<template>
  <header class="site-header" role="banner">
    <a href="https://www.nandenjin.com" class="logo">Kazumi Inada</a>
  </header>
</template>

<style scoped>
.site-header {
  display: grid;
  margin: 50px auto;
  width: calc(100vw - 100px);

  .logo {
    display: inline-block;
    aspect-ratio: 300 / 26;
    height: 18px;
    background: url("../assets/kazumi-inada.svg") center/contain no-repeat;
    text-indent: -100vw;
  }

  @media screen and (max-width: 750px) {
    margin: 40px auto;
    width: calc(100vw - 40px);

    .logo {
      height: 15px;
    }
  }
}
</style>
