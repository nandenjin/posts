const { description } = require("../package");
import markdownItFootnote from "markdown-it-footnote";
import { defineConfig } from "vitepress";

const GTAG_ID = "G-8238NS9X3Y";

export default defineConfig({
  title: "Kazumi Inada",

  description,

  head: [
    ["meta", { name: "theme-color", content: "#3eaf7c" }],
    ["meta", { name: "apple-mobile-web-app-capable", content: "yes" }],
    [
      "meta",
      { name: "apple-mobile-web-app-status-bar-style", content: "black" },
    ],
    [
      "script",
      {
        id: "gtag",
        async: true,
        src: "https://www.googletagmanager.com/gtag/js?id=" + GTAG_ID,
      },
    ],
    [
      "script",
      {
        id: "gtag-init",
      },
      `
      window.dataLayer = window.dataLayer || [];
      function gtag() {
        dataLayer.push(arguments);
      }
      gtag("js", new Date());
      gtag("config", "G-8238NS9X3Y");`,
    ],
  ],

  sitemap: {
    hostname: "https://posts.nandenjin.com",
  },

  markdown: {
    theme: "github-dark",
    config: (md) => {
      md.use(markdownItFootnote);
    },
  },
});