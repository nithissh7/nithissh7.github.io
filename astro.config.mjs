// @ts-check
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";
import mermaid from "astro-mermaid";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://nithissh7.github.io",
  compressHTML: true,
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "viewport",
  },
  integrations: [
    mermaid({
      theme: "neutral",
      autoTheme: false,
      enableLog: false,
    }),
    sitemap(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
