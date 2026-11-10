// Site-wide behaviour: search, theme, copy buttons, image lightbox, heading anchors,
// diagram frames, back-to-top. Listeners on `document` are registered once and survive
// ClientRouter swaps; per-page setup runs on every `astro:page-load`.
import { navigate } from "astro:transitions/client";

/* ---------------- Clicks ---------------- */

document.addEventListener("click", async (event) => {
  const target = event.target as HTMLElement;

  // Any button carrying the text to copy: "Copy link", "Copy" next to a CVE ID.
  const copyText = target.closest<HTMLButtonElement>("[data-copy-text]");
  if (copyText) {
    const label = copyText.dataset.label ?? (copyText.dataset.label = copyText.textContent ?? "copy");
    try {
      await navigator.clipboard.writeText(copyText.dataset.copyText ?? "");
      copyText.textContent = "copied ✓";
    } catch {
      copyText.textContent = "failed";
    }
    setTimeout(() => (copyText.textContent = label), 1500);
    return;
  }

  const copyBtn = target.closest<HTMLButtonElement>("[data-copy]");
  if (copyBtn) {
    const code = copyBtn.closest(".code-block")?.querySelector("pre")?.innerText ?? "";
    try {
      await navigator.clipboard.writeText(code.replace(/\n$/, ""));
      copyBtn.textContent = "copied ✓";
      const announcer = document.getElementById("announcer");
      if (announcer) announcer.textContent = "Code copied to clipboard";
    } catch {
      copyBtn.textContent = "failed";
    }
    setTimeout(() => (copyBtn.textContent = "copy"), 1500);
    return;
  }

  const zoomable = target.closest<HTMLImageElement>(".prose img");
  if (zoomable && !target.closest("a")) {
    const box = document.getElementById("lightbox") as HTMLDialogElement | null;
    if (box) {
      const img = box.querySelector("img")!;
      img.src = zoomable.currentSrc || zoomable.src;
      img.alt = zoomable.alt;
      box.querySelector("p")!.textContent = zoomable.alt;
      box.showModal();
    }
    return;
  }
  if (target.closest("#lightbox")) {
    (document.getElementById("lightbox") as HTMLDialogElement).close();
    return;
  }

  if (target.closest("[data-to-top]")) {
    window.scrollTo({ top: 0 });
    return;
  }

  if (target.closest("[data-search-open]")) {
    if (!openSearch()) navigate("/search/");
    return;
  }

  const dialog = target.closest("dialog");
  if (dialog && target === dialog) {
    (dialog as HTMLDialogElement).close(); // click on the backdrop
    return;
  }

  if (target.closest("[data-theme-toggle]")) {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {}
  }
});

/* ---------------- Search ---------------- */

function openSearch(): boolean {
  const pageInput = document.getElementById("search-input") as HTMLInputElement | null;
  if (pageInput) {
    pageInput.focus();
    return true;
  }
  const dialog = document.getElementById("search-dialog") as HTMLDialogElement | null;
  if (!dialog) return false;
  if (!dialog.open) dialog.showModal();
  dialog.querySelector<HTMLInputElement>("[data-search-input]")?.focus();
  return true;
}
document.addEventListener("astro:before-swap", () => {
  (document.getElementById("search-dialog") as HTMLDialogElement | null)?.close();
  (document.getElementById("lightbox") as HTMLDialogElement | null)?.close();
});

// ⌘K / Ctrl+K / "/" open search from anywhere.
document.addEventListener("keydown", (event) => {
  const el = event.target instanceof Element ? event.target : null;
  const typing = el?.closest("input, textarea, [contenteditable]");
  const combo = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
  if (combo || (event.key === "/" && !typing)) {
    event.preventDefault();
    if (!openSearch()) navigate("/search/");
  }
});

/* ---------------- Articles: anchors, figures, section highlight ---------------- */

let tocTargets: { a: HTMLAnchorElement; el: HTMLElement }[] = [];

function enhancePost() {
  tocTargets = [];
  const prose = document.querySelector(".prose");
  if (!prose) return;

  prose.querySelectorAll<HTMLHeadingElement>("h2[id], h3[id]").forEach((heading) => {
    if (heading.querySelector(".anchor")) return;
    const anchor = document.createElement("a");
    anchor.href = `#${heading.id}`;
    anchor.className = "anchor";
    anchor.setAttribute("aria-label", "Link to this section");
    anchor.textContent = "#";
    heading.append(anchor);
  });

  // A paragraph holding only an image becomes a figure captioned with its alt text.
  prose.querySelectorAll<HTMLImageElement>("p > img").forEach((img) => {
    const p = img.parentElement!;
    if (p.childElementCount !== 1 || p.textContent!.trim()) return;
    const figure = document.createElement("figure");
    figure.append(img);
    if (img.alt) {
      const caption = document.createElement("figcaption");
      caption.textContent = img.alt;
      figure.append(caption);
    }
    p.replaceWith(figure);
  });

  const links = [...document.querySelectorAll<HTMLAnchorElement>(".toc a")];
  tocTargets = links
    .map((a) => ({ a, el: document.getElementById(decodeURIComponent(a.hash.slice(1))) }))
    .filter((t): t is { a: HTMLAnchorElement; el: HTMLElement } => !!t.el);
  updateToc();
}

// Highlight the section being read: the last heading scrolled past the reading bar.
function updateToc() {
  if (!tocTargets.length) return;
  let current = tocTargets[0];
  for (const t of tocTargets) if (t.el.getBoundingClientRect().top < 96) current = t;
  tocTargets.forEach((t) => t.a.setAttribute("aria-current", String(t.el === current.el)));
}

/* ---------------- Diagrams: frame and fit ---------------- */

// Mermaid renders client-side (and re-renders on theme change), so size every
// SVG it inserts: never below MIN_SCALE of natural size; scroll sideways instead.
const MIN_SCALE = 0.72;

// The frame goes in before the diagram is drawn, so nothing shifts when it arrives.
function frameDiagram(pre: HTMLElement): HTMLElement {
  let wrap = pre.closest<HTMLElement>(".diagram");
  if (!wrap) {
    wrap = document.createElement("figure");
    wrap.className = "diagram";
    const bar = document.createElement("div");
    bar.className = "diagram-bar";
    bar.innerHTML = `<span>diagram</span><button type="button" data-diagram-open>Zoom ⤢</button>`;
    pre.replaceWith(wrap);
    wrap.append(bar, pre);
  }
  return wrap;
}

function sizeDiagram(pre: HTMLElement) {
  const svg = pre.querySelector("svg");
  if (!svg || svg.dataset.sized) return;
  svg.dataset.sized = "true";
  const wrap = frameDiagram(pre);

  const natural = svg.viewBox.baseVal?.width || svg.getBoundingClientRect().width;
  const pad = 24;
  const available = pre.clientWidth - pad;
  const width = Math.min(natural, Math.max(available, natural * MIN_SCALE));
  // Mermaid sets its own max-width on the SVG; an inline !important wins.
  svg.style.setProperty("max-width", "none", "important");
  svg.style.setProperty("width", `${Math.round(width)}px`, "important");
  svg.style.setProperty("height", "auto", "important");

  const overflows = pre.scrollWidth > pre.clientWidth + 1;
  wrap.querySelector(".diagram-bar span")!.textContent = overflows ? "diagram · scroll →" : "diagram";
  // A sideways-scrolling diagram must be reachable by keyboard.
  if (overflows) {
    pre.tabIndex = 0;
    pre.setAttribute("role", "region");
    const n = [...document.querySelectorAll(".prose .diagram")].indexOf(wrap) + 1;
    pre.setAttribute("aria-label", `Diagram ${n} (scrolls sideways)`);
  } else {
    pre.removeAttribute("tabindex");
    pre.removeAttribute("role");
    pre.removeAttribute("aria-label");
  }
}

function watchDiagrams() {
  document.querySelectorAll<HTMLElement>(".prose .mermaid").forEach((pre) => {
    if (pre.dataset.watched) return;
    pre.dataset.watched = "true";
    frameDiagram(pre);
    sizeDiagram(pre);
    new MutationObserver(() => sizeDiagram(pre)).observe(pre, { childList: true, subtree: true });
  });
}

/* ---------------- Scroll ---------------- */

// "Back to top" shows only while scrolling up, so it never sits on text being read.
// On articles the reading bar's bottom edge tracks how far through the text the reader is.
let lastY = window.scrollY;
function onScroll() {
  const y = window.scrollY;
  const toTop = document.querySelector("[data-to-top]");
  if (y < 900) toTop?.removeAttribute("data-visible");
  else if (Math.abs(y - lastY) > 6) toTop?.toggleAttribute("data-visible", y < lastY);
  lastY = y;

  const bar = document.querySelector<HTMLElement>("[data-progress]");
  const body = document.querySelector<HTMLElement>("[data-reading-body]");
  if (bar && body) {
    const rect = body.getBoundingClientRect();
    const total = rect.height - window.innerHeight * 0.6;
    const done = Math.min(1, Math.max(0, -rect.top / Math.max(total, 1)));
    bar.style.transform = `scaleX(${done})`;
  }
  updateToc();
}

let ticking = false;
window.addEventListener(
  "scroll",
  () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      onScroll();
      ticking = false;
    });
  },
  { passive: true }
);

document.addEventListener("astro:page-load", () => {
  enhancePost();
  watchDiagrams();
  onScroll();
});
