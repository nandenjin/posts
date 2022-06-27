/**
 * Client app enhancement file.
 *
 * https://v1.vuepress.vuejs.org/guide/basic-config.html#app-level-enhancements
 */

export default ({
  Vue, // the version of Vue being used in the VuePress app
  options, // the options for the root Vue instance
  router, // the router instance for the app
  siteData, // site metadata
}) => {
  if (process.env.NODE_ENV === "production" && typeof window !== "undefined") {
    const script = document.createElement("script");
    script.setAttribute(
      src,
      "https://www.googletagmanager.com/gtag/js?id=G-8238NS9X3Y"
    );
    script.setAttribute("async", "async");
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag() {
      dataLayer.push(arguments);
    }
    gtag("js", new Date());
    gtag("config", "G-8238NS9X3Y");
  }
};
