// @ts-check
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";
import mermaid from "astro-mermaid";
import sitemap from "@astrojs/sitemap";

const el = (tagName, properties, children) => ({ type: "element", tagName, properties, children });
const text = (value) => ({ type: "text", value });

/** Wraps every highlighted block in a header bar with the language and a copy button. */
const codeChrome = {
  name: "code-chrome",
  root(root) {
    const lang = this.options.lang;
    const label = !lang || lang === "plaintext" || lang === "txt" ? "text" : lang;
    root.children = [
      el("div", { className: ["code-block"] }, [
        el("div", { className: ["code-block-bar"] }, [
          el("span", {}, [text(label)]),
          el("button", { type: "button", className: ["btn-bracket"], "data-copy": "", "aria-label": "Copy code" }, [text("copy")]),
        ]),
        ...root.children,
      ]),
    ];
  },
};

// https://astro.build/config
export default defineConfig({
  site: "https://nithissh7.github.io",
  compressHTML: true,
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "viewport",
  },
  markdown: {
    shikiConfig: {
      themes: { light: "github-light", dark: "github-dark" },
      defaultColor: false,
      wrap: false,
      transformers: [codeChrome],
    },
  },
  integrations: [
    mermaid({
      theme: "neutral",
      autoTheme: true,
      enableLog: false,
    }),
    sitemap(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
