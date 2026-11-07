// @ts-check
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";
import { satteri } from "@astrojs/markdown-satteri";
import sitemap from "@astrojs/sitemap";

const el = (tagName, properties, children) => ({ type: "element", tagName, properties, children });
const text = (value) => ({ type: "text", value });

/** Wraps every highlighted block in a header bar with the language (or title) and a copy button. */
const codeChrome = {
  name: "code-chrome",
  root(root) {
    const lang = this.options.lang;
    // ```text title="directory tree"``` overrides the label.
    const title = this.options.meta?.__raw?.match(/title="([^"]+)"/)?.[1];
    const label = title ?? (!lang || lang === "plaintext" || lang === "txt" ? "text" : lang);
    root.children = [
      el("div", { className: ["code-block"] }, [
        el("div", { className: ["code-block-bar"] }, [
          el("span", {}, [text(label)]),
          el("div", { className: ["code-actions"] }, [
            el("button", { type: "button", "data-copy": "", "aria-label": "Copy code" }, [text("copy")]),
          ]),
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

/** Darkens/lightens the few github-light/github-dark token colours that miss 4.5:1 on the site's code backgrounds. */
const READABLE = {
  light: { "#D73A49": "#C13442", "#6A737D": "#626A73", "#22863A": "#1F7934", "#E36209": "#AF4B07" },
  dark: { "#6A737D": "#7D858E" },
};
const readableTokens = {
  name: "readable-tokens",
  span(node) {
    const style = node.properties?.style;
    if (typeof style !== "string") return;
    node.properties.style = style.replace(
      /--shiki-(light|dark):(#[0-9a-fA-F]{6})/g,
      (m, theme, hex) => `--shiki-${theme}:${READABLE[theme][hex.toUpperCase()] ?? hex}`
    );
  },
};

/** ```mermaid blocks become <pre class="mermaid"> source; src/scripts/diagrams.ts draws them as they near the viewport. */
const escapeHtml = (text) =>
  text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const mermaidBlocks = {
  name: "mermaid-blocks",
  code(node) {
    if (node.lang !== "mermaid") return;
    return { type: "html", value: `<pre class="mermaid">${escapeHtml(node.value)}</pre>` };
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
    processor: satteri({ mdastPlugins: [mermaidBlocks] }),
    shikiConfig: {
      themes: { light: "github-light", dark: "github-dark" },
      defaultColor: false,
      wrap: false,
      transformers: [readableTokens, highlightLines, codeChrome],
    },
  },
  integrations: [
    sitemap(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
