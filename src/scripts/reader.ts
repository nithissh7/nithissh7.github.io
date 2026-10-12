// Reader features for article pages (and a few site-wide ones).
// Listeners on `document` are registered once and survive ClientRouter swaps;
// per-page setup runs on every `astro:page-load`.

const store = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
    } catch {}
  },
};

/* ---------------- Toast ---------------- */

let toastTimer = 0;
function toast(message: string) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = message;
  el.dataset.show = "";
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => delete el.dataset.show, 1800);
}

async function copy(text: string, message: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast(message);
  } catch {
    toast("Couldn't copy — your browser blocked clipboard access");
  }
}

const prose = () => document.querySelector<HTMLElement>(".prose[data-reading-body]");
const sections = () => [...(prose()?.querySelectorAll<HTMLElement>("h2[id]:not(.sr-only), h3[id]") ?? [])];

/* ---------------- 1. Current-section bar ---------------- */

function currentHeading(): HTMLElement | undefined {
  let current: HTMLElement | undefined;
  for (const h of sections()) if (h.getBoundingClientRect().top < 140) current = h;
  return current;
}

function sectionNumber(h: HTMLElement): string {
  // h2s are numbered by CSS counter; mirror that for the bar label.
  const h2s = [...(prose()?.querySelectorAll("h2[id]:not(.sr-only)") ?? [])];
  const parent = h.tagName === "H2" ? h : findPrevH2(h);
  const n = parent ? h2s.indexOf(parent) + 1 : 0;
  return n > 0 ? String(n).padStart(2, "0") : "";
}
function findPrevH2(el: Element): Element | null {
  let node: Element | null = el.previousElementSibling;
  while (node && node.tagName !== "H2") node = node.previousElementSibling;
  return node;
}
function headingText(h: HTMLElement): string {
  const clone = h.cloneNode(true) as HTMLElement;
  clone.querySelector(".anchor")?.remove();
  return (clone.textContent ?? "").trim();
}

function updateSectionBar() {
  const bar = document.querySelector<HTMLElement>("[data-section-bar]");
  const body = prose();
  if (!bar || !body) return;
  const toc = document.querySelector(".toc-box");
  const pastToc = (toc ?? body).getBoundingClientRect().bottom < 60;
  const beforeEnd = body.getBoundingClientRect().bottom > window.innerHeight * 0.4;
  const show = pastToc && beforeEnd;
  bar.toggleAttribute("data-show", show);
  if (!show) closeSectionMenu();
  const h = currentHeading();
  const label = bar.querySelector("[data-section-label]");
  if (label) {
    const num = h ? sectionNumber(h) : "";
    label.innerHTML = h ? `${num ? `<span class="accent">${num}</span> · ` : ""}${escapeHtml(headingText(h))}` : "Contents";
  }
}
function closeSectionMenu() {
  const menu = document.querySelector<HTMLElement>("[data-section-menu]");
  if (menu && !menu.hidden) {
    menu.hidden = true;
    document.querySelector("[data-section-toggle]")?.setAttribute("aria-expanded", "false");
  }
}
const escapeHtml = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/* ---------------- 2. Footnote pop-ups ---------------- */

function closeFootnote() {
  document.querySelector(".fn-pop")?.remove();
}
function openFootnote(ref: HTMLAnchorElement) {
  closeFootnote();
  const target = document.getElementById(decodeURIComponent(ref.hash.slice(1)));
  if (!target) return;
  const clone = target.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("[data-footnote-backref]").forEach((a) => a.remove());
  const pop = document.createElement("div");
  pop.className = "fn-pop";
  pop.setAttribute("role", "note");
  pop.innerHTML = `<span class="fn-pop-label">Note ${escapeHtml(ref.textContent ?? "")}</span>${clone.innerHTML}`;
  document.body.append(pop);
  const r = ref.getBoundingClientRect();
  const w = Math.min(360, window.innerWidth - 32);
  pop.style.width = `${w}px`;
  pop.style.left = `${Math.max(16, Math.min(r.left + r.width / 2 - w / 2, window.innerWidth - w - 16)) + scrollX}px`;
  const below = r.bottom + 10 + pop.offsetHeight < window.innerHeight;
  pop.style.top = `${(below ? r.bottom + 10 : r.top - pop.offsetHeight - 10) + scrollY}px`;
}

/* ---------------- 3. Resume where you left off ---------------- */

const readKey = (path = location.pathname) => `read:${path}`;
type ReadState = { id?: string; pct: number; done?: boolean };
function readState(path?: string): ReadState | null {
  try {
    return JSON.parse(store.get(readKey(path)) ?? "null");
  } catch {
    return null;
  }
}
function progress(): number {
  const body = prose();
  if (!body) return 0;
  const rect = body.getBoundingClientRect();
  return Math.min(1, Math.max(0, -rect.top / Math.max(rect.height - window.innerHeight * 0.6, 1)));
}
let saveTimer = 0;
function saveProgress() {
  if (!prose()) return;
  clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    const pct = progress();
    const prev = readState();
    const done = prev?.done || pct > 0.95;
    if (pct < 0.03 && !prev) return;
    store.set(readKey(), JSON.stringify({ id: currentHeading()?.id, pct: Math.round(pct * 100) / 100, done }));
  }, 400);
}
function offerResume() {
  const prompt = document.querySelector<HTMLElement>("[data-resume]");
  const state = readState();
  if (!prompt || !state || location.hash || state.pct < 0.05 || state.pct > 0.95 || !state.id) return;
  const h = document.getElementById(state.id);
  if (!h) return;
  const num = sectionNumber(h);
  prompt.querySelector("[data-resume-label]")!.textContent = `${num ? num + " · " : ""}${headingText(h)}`;
  prompt.dataset.target = state.id;
  prompt.hidden = false;
}

// Blog lists: mark posts already read (or in progress).
function markReadPosts() {
  document.querySelectorAll<HTMLAnchorElement>("a[data-post-link]").forEach((a) => {
    if (a.querySelector(".read-mark")) return;
    const state = readState(new URL(a.href).pathname);
    if (!state) return;
    const mark = document.createElement("span");
    mark.className = "read-mark";
    mark.textContent = state.done ? "✓ read" : `${Math.round(state.pct * 100)}% read`;
    a.querySelector("[data-read-slot]")?.append(mark);
  });
}

/* ---------------- 4. Reader settings ---------------- */

function syncSettingsUI() {
  const root = document.documentElement;
  document.querySelectorAll<HTMLButtonElement>("[data-setting]").forEach((b) => {
    const [key, value] = b.dataset.setting!.split(":");
    const current = key === "size" ? root.dataset.textSize ?? "m" : root.dataset.measure ?? "normal";
    b.setAttribute("aria-pressed", String(current === value));
  });
}
function applySetting(key: string, value: string) {
  const root = document.documentElement;
  if (key === "size") {
    root.dataset.textSize = value;
    store.set("reader:size", value);
  } else {
    root.dataset.measure = value;
    store.set("reader:measure", value);
  }
  syncSettingsUI();
  // Diagrams were sized for the old column; let them re-measure.
  document.querySelectorAll<SVGSVGElement>(".prose .mermaid svg").forEach((svg) => {
    delete svg.dataset.sized;
    svg.closest(".mermaid")?.append(document.createComment("resize"));
  });
}

/* ---------------- 5 & 6. Long code: collapse + wrap ---------------- */

const COLLAPSE_AT = 28;
function enhanceCode() {
  prose()
    ?.querySelectorAll<HTMLElement>(".code-block")
    .forEach((block) => {
      if (block.dataset.enhanced) return;
      block.dataset.enhanced = "";
      const pre = block.querySelector("pre");
      const copyBtn = block.querySelector(".code-block-bar [data-copy]");
      if (!pre || !copyBtn) return;
      let actions = block.querySelector(".code-actions");
      if (!actions) {
        actions = document.createElement("div");
        actions.className = "code-actions";
        copyBtn.replaceWith(actions);
        actions.append(copyBtn);
      }
      const lines = pre.querySelectorAll(".line").length;
      const isArt = /[┌│└├]/.test(pre.textContent ?? "");

      if (pre.scrollWidth > pre.clientWidth + 1) {
        const wrap = document.createElement("button");
        wrap.type = "button";
        wrap.dataset.wrap = "";
        wrap.textContent = "wrap";
        wrap.setAttribute("aria-pressed", "false");
        actions.prepend(wrap);
      }
      if (lines > COLLAPSE_AT && !isArt) {
        block.dataset.collapsed = "";
        const more = document.createElement("button");
        more.type = "button";
        more.className = "code-more";
        more.dataset.expand = "";
        more.textContent = `show all ${lines} lines ↓`;
        block.append(more);
      }
    });
}

/* ---------------- 7. Diagram viewer ---------------- */

const viewer = { scale: 1, natural: 0, x: 0, y: 0 };
function openDiagram(svg: SVGSVGElement) {
  const dialog = document.getElementById("diagram-viewer") as HTMLDialogElement | null;
  const stage = dialog?.querySelector<HTMLElement>("[data-dv-stage]");
  if (!dialog || !stage) return;
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.removeAttribute("style");
  const holder = document.createElement("div");
  holder.className = "mermaid dv-canvas";
  holder.append(clone);
  stage.replaceChildren(holder);
  viewer.natural = svg.viewBox.baseVal.width || svg.getBoundingClientRect().width;
  dialog.showModal();
  fitDiagram();
}
function fitDiagram() {
  const stage = document.querySelector<HTMLElement>("[data-dv-stage]");
  if (!stage) return;
  viewer.scale = Math.min(1.5, (stage.clientWidth - 32) / viewer.natural);
  viewer.x = 0;
  viewer.y = 0;
  renderDiagram();
}
function zoomDiagram(factor: number) {
  viewer.scale = Math.min(4, Math.max(0.25, viewer.scale * factor));
  renderDiagram();
}
function renderDiagram() {
  const canvas = document.querySelector<HTMLElement>(".dv-canvas");
  const svg = canvas?.querySelector("svg");
  if (!canvas || !svg) return;
  svg.style.width = `${viewer.natural * viewer.scale}px`;
  svg.style.height = "auto";
  canvas.style.transform = `translate(${viewer.x}px, ${viewer.y}px)`;
}
let drag: { x: number; y: number; ox: number; oy: number } | null = null;
document.addEventListener("pointerdown", (e) => {
  const stage = (e.target as Element).closest("[data-dv-stage]");
  if (!stage) return;
  drag = { x: e.clientX, y: e.clientY, ox: viewer.x, oy: viewer.y };
  (stage as HTMLElement).setPointerCapture(e.pointerId);
});
document.addEventListener("pointermove", (e) => {
  if (!drag) return;
  viewer.x = drag.ox + e.clientX - drag.x;
  viewer.y = drag.oy + e.clientY - drag.y;
  renderDiagram();
});
document.addEventListener("pointerup", () => (drag = null));
document.addEventListener(
  "wheel",
  (e) => {
    if (!(e.target as Element).closest?.("[data-dv-stage]")) return;
    e.preventDefault();
    zoomDiagram(e.deltaY < 0 ? 1.1 : 1 / 1.1);
  },
  { passive: false }
);

/* ---------------- 11. Share a selected passage ---------------- */

function quoteLink(text: string): string {
  const words = text.trim().replace(/\s+/g, " ").split(" ");
  const enc = (s: string) => encodeURIComponent(s).replace(/-/g, "%2D");
  const fragment =
    words.length <= 8 ? enc(words.join(" ")) : `${enc(words.slice(0, 4).join(" "))},${enc(words.slice(-4).join(" "))}`;
  return `${location.origin}${location.pathname}#:~:text=${fragment}`;
}
function updateQuoteButton() {
  const btn = document.querySelector<HTMLElement>("[data-quote-btn]");
  if (!btn) return;
  const sel = window.getSelection();
  const text = sel?.toString().trim() ?? "";
  const anchor = sel?.anchorNode?.parentElement;
  const valid =
    sel && !sel.isCollapsed && text.length >= 8 && text.length <= 400 && anchor?.closest(".prose") && !anchor.closest("pre, .mermaid");
  if (!valid) {
    btn.hidden = true;
    return;
  }
  const rect = sel.getRangeAt(0).getBoundingClientRect();
  btn.hidden = false;
  btn.dataset.text = text;
  const left = Math.max(12, Math.min(rect.left + rect.width / 2 - btn.offsetWidth / 2, window.innerWidth - btn.offsetWidth - 12));
  btn.style.left = `${left + scrollX}px`;
  btn.style.top = `${rect.top + scrollY - btn.offsetHeight - 8}px`;
}

/* ---------------- 14. Comments theme sync ---------------- */

function syncGiscusTheme() {
  const frame = document.querySelector<HTMLIFrameElement>("iframe.giscus-frame");
  const theme = document.documentElement.dataset.theme === "light" ? "light" : "dark_dimmed";
  frame?.contentWindow?.postMessage({ giscus: { setConfig: { theme } } }, "https://giscus.app");
}
new MutationObserver(syncGiscusTheme).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

/* ---------------- Delegated clicks ---------------- */

document.addEventListener("click", (event) => {
  const t = event.target as HTMLElement;

  // 8. Heading anchors copy their link.
  const anchor = t.closest<HTMLAnchorElement>(".prose a.anchor");
  if (anchor) {
    event.preventDefault();
    history.replaceState(history.state, "", anchor.hash);
    anchor.parentElement?.scrollIntoView({ behavior: "smooth" });
    copy(anchor.href, "Link to section copied");
    return;
  }

  // 2. Footnotes.
  const ref = t.closest<HTMLAnchorElement>("a[data-footnote-ref]");
  if (ref) {
    event.preventDefault();
    openFootnote(ref);
    return;
  }
  if (!t.closest(".fn-pop")) closeFootnote();

  // 1. Section bar menu.
  if (t.closest("[data-section-toggle]")) {
    const menu = document.querySelector<HTMLElement>("[data-section-menu]");
    if (menu) {
      menu.hidden = !menu.hidden;
      t.closest("[data-section-toggle]")!.setAttribute("aria-expanded", String(!menu.hidden));
      menu.querySelector("[aria-current='true']")?.scrollIntoView({ block: "center" });
    }
    return;
  }
  if (t.closest("[data-section-menu] a")) closeSectionMenu();
  else if (!t.closest("[data-section-menu]")) closeSectionMenu();

  // 3. Resume prompt.
  const resume = t.closest<HTMLElement>("[data-resume]");
  if (resume) {
    if (t.closest("[data-resume-go]")) document.getElementById(resume.dataset.target!)?.scrollIntoView();
    if (t.closest("[data-resume-go], [data-resume-dismiss]")) resume.hidden = true;
    return;
  }

  // 4. Reader settings.
  const settingsToggle = t.closest("[data-settings-toggle]");
  if (settingsToggle) {
    const panel = settingsToggle.parentElement?.querySelector<HTMLElement>("[data-settings-panel]");
    if (panel) {
      document.querySelectorAll<HTMLElement>("[data-settings-panel]").forEach((p) => p !== panel && (p.hidden = true));
      panel.hidden = !panel.hidden;
      settingsToggle.setAttribute("aria-expanded", String(!panel.hidden));
      syncSettingsUI();
    }
    return;
  }
  const setting = t.closest<HTMLButtonElement>("[data-setting]");
  if (setting) {
    const [key, value] = setting.dataset.setting!.split(":");
    applySetting(key, value);
    return;
  }
  if (!t.closest("[data-settings-panel]")) document.querySelectorAll<HTMLElement>("[data-settings-panel]").forEach((p) => (p.hidden = true));

  // 5. Expand long code.
  const expand = t.closest<HTMLElement>("[data-expand]");
  if (expand) {
    const block = expand.closest<HTMLElement>(".code-block")!;
    const collapsed = "collapsed" in block.dataset;
    if (collapsed) delete block.dataset.collapsed;
    else {
      block.dataset.collapsed = "";
      block.scrollIntoView({ block: "nearest" });
    }
    expand.textContent = collapsed ? "collapse ↑" : `show all ${block.querySelectorAll("pre .line").length} lines ↓`;
    return;
  }

  // 6. Wrap long lines.
  const wrap = t.closest<HTMLButtonElement>("[data-wrap]");
  if (wrap) {
    const block = wrap.closest<HTMLElement>(".code-block")!;
    const on = !("wrapped" in block.dataset);
    if (on) block.dataset.wrapped = "";
    else delete block.dataset.wrapped;
    wrap.setAttribute("aria-pressed", String(on));
    return;
  }

  // 7. Diagram viewer.
  const open = t.closest("[data-diagram-open]");
  if (open) {
    const svg = open.closest(".diagram")?.querySelector<SVGSVGElement>("svg");
    if (svg) openDiagram(svg);
    return;
  }
  const dv = t.closest<HTMLButtonElement>("[data-dv]");
  if (dv) {
    const action = dv.dataset.dv;
    if (action === "in") zoomDiagram(1.25);
    else if (action === "out") zoomDiagram(0.8);
    else if (action === "fit") fitDiagram();
    else (document.getElementById("diagram-viewer") as HTMLDialogElement).close();
    return;
  }

  // 11. Copy link to quote.
  const quote = t.closest<HTMLElement>("[data-quote-btn]");
  if (quote) {
    copy(quoteLink(quote.dataset.text ?? ""), "Link to this quote copied");
    quote.hidden = true;
    window.getSelection()?.removeAllRanges();
  }
});

document.addEventListener("selectionchange", () => {
  clearTimeout(selTimer);
  selTimer = window.setTimeout(updateQuoteButton, 150);
});
let selTimer = 0;

/* ---------------- 9. Keyboard shortcuts ---------------- */

let lastG = 0;
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeFootnote();
    closeSectionMenu();
    document.querySelectorAll<HTMLElement>("[data-settings-panel]").forEach((p) => (p.hidden = true));
  }
  const el = e.target instanceof Element ? e.target : null;
  if (e.metaKey || e.ctrlKey || e.altKey || el?.closest("input, textarea, select, [contenteditable]")) return;
  if (document.querySelector("dialog[open]") && e.key !== "?") return;

  const heads = sections().filter((h) => h.tagName === "H2");
  if ((e.key === "j" || e.key === "k") && heads.length) {
    const tops = heads.map((h) => h.getBoundingClientRect().top);
    const target = e.key === "j" ? heads[tops.findIndex((top) => top > 100)] : heads[tops.findLastIndex((top) => top < -10)];
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth" });
    }
  } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
    const nav = document.querySelector<HTMLElement>("[data-post-nav]");
    const href = e.key === "ArrowLeft" ? nav?.dataset.prev : nav?.dataset.next;
    if (href) location.assign(href);
  } else if (e.key === "t") {
    document.querySelector<HTMLButtonElement>("[data-theme-toggle]")?.click();
  } else if (e.key === "g") {
    if (Date.now() - lastG < 500) window.scrollTo({ top: 0, behavior: "smooth" });
    lastG = Date.now();
  } else if (e.key === "?") {
    const d = document.getElementById("shortcuts") as HTMLDialogElement | null;
    if (d?.open) d.close();
    else d?.showModal();
  }
});

/* ---------------- Scroll + page lifecycle ---------------- */

let ticking = false;
window.addEventListener(
  "scroll",
  () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateSectionBar();
      saveProgress();
      ticking = false;
    });
  },
  { passive: true }
);

document.addEventListener("astro:page-load", () => {
  closeFootnote();
  enhanceCode();
  offerResume();
  markReadPosts();
  syncSettingsUI();
  updateSectionBar();
});
