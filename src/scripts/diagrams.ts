// Draws ```mermaid diagrams (emitted as <pre class="mermaid"> source by astro.config.mjs)
// only as they come within reach of the viewport, so opening an article never stalls on
// diagrams further down. Mermaid itself is loaded on first use.
import type { MermaidConfig } from "mermaid";

// Diagrams live in the reading column: wrap long messages and keep spacing tight so they
// fit instead of scrolling sideways. Colours come from the site tokens (global.css).
const CONFIG: MermaidConfig = {
  startOnLoad: false,
  fontFamily: "JetBrains Mono, ui-monospace, monospace",
  fontSize: 13,
  flowchart: { diagramPadding: 4, nodeSpacing: 22, rankSpacing: 32, padding: 8, wrappingWidth: 200, htmlLabels: true },
  sequence: {
    wrap: false,
    width: 100,
    actorMargin: 16,
    diagramMarginX: 4,
    diagramMarginY: 8,
    actorFontSize: 13,
    messageFontSize: 13,
    noteFontSize: 13,
    messageMargin: 32,
    boxMargin: 6,
    noteMargin: 8,
    mirrorActors: false,
  },
};

type Mermaid = (typeof import("mermaid"))["default"];
let loading: Promise<Mermaid> | null = null;
const loadMermaid = () => (loading ??= import("mermaid").then((m) => m.default));

// mermaid.render is not re-entrant, so diagrams are drawn one after another.
let queue: Promise<void> = Promise.resolve();
let renderId = 0;

function draw(pre: HTMLElement) {
  pre.dataset.diagram ??= pre.textContent ?? "";
  queue = queue
    .then(async () => {
      if (!pre.isConnected) return;
      const mermaid = await loadMermaid();
      mermaid.initialize({ ...CONFIG, theme: document.documentElement.dataset.theme === "light" ? "default" : "dark" });
      try {
        const { svg } = await mermaid.render(`diagram-${++renderId}`, pre.dataset.diagram!);
        pre.innerHTML = svg;
      } catch (error) {
        // Leave the readable source in place rather than an error box.
        pre.textContent = pre.dataset.diagram!;
        console.error("[diagrams]", error);
      }
      pre.dataset.processed = "true";
    })
    // One failure (e.g. Mermaid failing to load) must not stall the diagrams queued after it.
    .catch((error) => console.error("[diagrams]", error));
}

let observer: IntersectionObserver | null = null;

function watch() {
  observer?.disconnect();
  const pending = [...document.querySelectorAll<HTMLElement>("pre.mermaid:not([data-processed])")];
  if (!pending.length) return;
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer!.unobserve(entry.target);
        draw(entry.target as HTMLElement);
      }
    },
    { rootMargin: "1200px 0px" }
  );
  for (const pre of pending) {
    pre.dataset.diagram ??= pre.textContent ?? "";
    observer.observe(pre);
  }
}

document.addEventListener("astro:page-load", watch);

// Mermaid bakes some colours into the SVG, so redraw what's already drawn when the theme flips.
new MutationObserver(() => {
  document.querySelectorAll<HTMLElement>("pre.mermaid[data-processed]").forEach((pre) => {
    delete pre.dataset.processed;
    draw(pre);
  });
}).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
