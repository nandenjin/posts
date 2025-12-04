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
    width: 200px;
    height: 30px;
    background: url("../assets/kazumi-inada.svg") center/contain no-repeat;
    text-indent: -100vw;
  }
}
</style>
