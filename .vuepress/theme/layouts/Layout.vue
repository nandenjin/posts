<template>
  <div>
    <SiteHeader />
    <div class="theme-content">
      <Content />
    </div>
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
