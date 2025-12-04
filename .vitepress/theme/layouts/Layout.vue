<template>
  <div>
    <SiteHeader />
    <main class="theme-content" role="main">
      <Content />
    </main>
    <SiteFooter />
  </div>
</template>

<script>
import SiteHeader from "../components/SiteHeader.vue";
import SiteFooter from "../components/SiteFooter.vue";
export default {
  name: "Layout",
  components: {
    SiteHeader,
    SiteFooter,
  },
};
</script>

<style>
@import "../styles/index.css";
</style>
