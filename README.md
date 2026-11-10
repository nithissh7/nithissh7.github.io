# realnits

Source for [nithissh7.github.io](https://nithissh7.github.io): security research write-ups and a ledger of disclosed CVEs. Built with [Astro](https://docs.astro.build), deployed to GitHub Pages on every push to `main` (`.github/workflows/deploy.yml`).

## Commands

| Command | What it does |
| :-- | :-- |
| `npm install` | Install dependencies |
| `npx astro dev --background` | Dev server at `localhost:4321` (`astro dev stop` / `status` / `logs` to manage it) |
| `npm run build` | Build to `dist/` and index it for search (Pagefind) |
| `npm run preview` | Serve the build locally. Search only works here or in production, not in dev |

After changing how Markdown is rendered (`astro.config.mjs`), restart the dev server with `--force` so cached posts are re-rendered.

## Writing a post

Add `src/content/blog/<slug>.md`. The file name is the URL: `/blog/<slug>/`.

```yaml
---
title: "endsWith Considered Harmful: Reversing CVE-2026-49869 in Kestra"
description: "One or two sentences. Shown under the title, in lists, in search results and link previews."
pubDate: 2026-10-01T00:00:00.000Z
category: research        # research | challenge | tooling | notes
tags:                     # topic slugs; display names live in TAG_LABELS (src/consts.ts)
  - vulnerability-research
  - cve
featured: true            # optional: listed under "Start here" on /about/ and suggested on the 404 page
series: "Intigriti XSS challenges"   # optional: posts sharing a name get "Part n of m" navigation
updatedDate: 2026-10-05   # optional
draft: true               # optional: keeps the post out of the build
---
```

`category` is what the post is, and drives the label on every list plus the filter on `/blog/`:

| Category | Use it for |
| :-- | :-- |
| `research` | Bugs you found and CVEs you took apart |
| `challenge` | CTF and challenge solutions |
| `tooling` | Building or fixing security tools |
| `notes` | Anything else |

### Conventions in the body

- **Headings** start at `##`. Every `##` appears in "On this page" and in the reading bar's section menu; `###` appears in the menu only. Headings are not numbered automatically, so number them yourself when a post is a sequence of steps.
- **Code** always gets a language. Extras go after it on the fence line:
  - `title="directory tree"` puts a caption bar on the block (use it for file names, URLs, "request" / "response").
  - `{3,5-7}` highlights those lines.
  - Blocks longer than 40 lines fold, with a button to show the rest.
- **Diagrams** are fenced `mermaid` blocks, drawn in the browser as they scroll into view. They must fit the reading column: break long labels with `<br/>`. `class A,B bug` marks nodes on the vulnerable path, `class C ok` the safe or fixed one.
- **Callouts** are blockquotes that open in bold: `> **Note:** …`.
- **Images** go in `src/content/blog/images/<slug>/` and are referenced relatively (`./images/<slug>/01.png`). The alt text becomes the caption; clicking an image zooms it.
- **Footnotes** (`[^1]`) open in place when clicked.

## Adding a CVE

Add `src/content/cves/cve-YYYY-NNNNN.md`:

```yaml
---
cveId: "CVE-2026-118504"
title: "Gitea <= 28.2.0 - API Issue Mutation Archive Restriction Bypass"   # "Product and versions - Vulnerability"
severity: "Medium"        # Critical | High | Medium | Low | Informational
cvssScore: 6.5            # optional
cvssVector: "CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:H/A:N"   # optional; drawn as the metric breakdown
cvssSource: "GitHub"      # optional: who assigned the score
affectedProduct: "Gitea"
vendor: "Gitea"           # optional
pubDate: 2026-11-01T00:00:00.000Z
references:
  - "https://nvd.nist.gov/vuln/detail/CVE-2026-118504"
description: "One sentence. Used for search engines and link previews."
---

A short note: how it was reported, what was fixed and where.
```

The title is split at `" - "`: the part after it is the headline, the part before it the product line. When a vendor publishes no score, use `externalCvss: { score, source }` and `vendorRating` instead of `cvssScore`.

## Where things are

```text
src/
├── content/            posts, CVEs, certifications (schemas in content.config.ts)
├── pages/              one file per route
├── layouts/BaseLayout  <head>, header, footer, dialogs
├── components/         EntryList and PostList (post lists), SeverityBar, Search, ReaderSettings…
├── lib/posts.ts        sorted collections, post kinds, tag and severity counts
├── scripts/            site.ts (search, theme, copy, diagrams' frames), reader.ts (reading bar,
│                       resume, settings, shortcuts), diagrams.ts (lazy Mermaid)
├── styles/global.css   all design tokens and component styles
└── consts.ts           site title, nav, social links, tag display names, date formatting
```

## Design rules

- Everything is set in JetBrains Mono. Hierarchy comes from weight, size, case and three text tones.
- Two columns: `--site` (68rem) for indexes, `--measure` (48rem, 80 characters of body text) for articles. Nothing breaks out of its column.
- One cool accent for links and actions. Red, orange, yellow and green are reserved for severity.
- Dates are written and shown in IST.
