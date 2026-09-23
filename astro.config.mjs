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
          el("button", { type: "button", "data-copy": "", "aria-label": "Copy code" }, [text("copy")]),
        ]),
        ...root.children,
      ]),
    ];
  },
};

/** Highlights lines listed in the fence meta, e.g. ```js {3,5-7}. */
const highlightLines = {
  name: "highlight-lines",
  line(node, line) {
    const raw = this.options.meta?.__raw ?? "";
    const spec = raw.match(/\{([\d,\s-]+)\}/)?.[1];
    if (!spec) return;
    const hit = spec.split(",").some((part) => {
      const [a, b] = part.trim().split("-").map(Number);
      return b ? line >= a && line <= b : line === a;
    });
    if (hit) this.addClassToHast(node, "highlighted");
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
      transformers: [highlightLines, codeChrome],
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
