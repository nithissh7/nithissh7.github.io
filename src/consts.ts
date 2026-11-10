export const SITE_TITLE = "realnits";
export const SITE_AUTHOR = "Nithissh";
export const SITE_DESCRIPTION =
  "Breaking down security, technical challenges, and code.";
export const SITE_TAGLINE =
  "Security architect by day, bug bounty hunter by night. I write about vulnerability research, the CVEs I find, and the challenges I solve.";

export const NAV_LINKS = [
  { href: "/blog/", label: "Writing" },
  { href: "/cves/", label: "CVEs" },
  { href: "/about/", label: "About" },
];

export const SOCIAL_LINKS = [
  { label: "GitHub", href: "https://github.com/nithissh7" },
  { label: "LinkedIn", href: "https://linkedin.com/in/nithisshs" },
  { label: "Email", href: "mailto:realnits@gmail.com" },
  { label: "RSS", href: "/rss.xml" },
];

// Frontmatter dates are written as IST midnight (e.g. 2023-10-02T18:30Z), so format in IST.
const TZ = "Asia/Kolkata";

export function formatDate(date: Date, style: "short" | "iso" | "long" | "medium" | "day" = "iso"): string {
  if (style === "medium") {
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: TZ });
  }
  if (style === "long") {
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: TZ });
  }
  // "Oct 1" — for lists already grouped under a year heading.
  if (style === "day") {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: TZ });
  }
  const iso = date.toLocaleDateString("en-CA", { timeZone: TZ }); // YYYY-MM-DD
  return style === "short" ? iso.slice(5) : iso;
}

// Splits a title so CVE IDs can be kept on one line: odd indexes are the IDs.
export function titleParts(title: string): string[] {
  return title.split(/(CVE-\d{4}-\d+)/);
}

export function yearOf(date: Date): number {
  return Number(formatDate(date).slice(0, 4));
}

// Tags are written as slugs in frontmatter; this is how they read on the page.
const TAG_LABELS: Record<string, string> = {
  bugbounty: "Bug bounty",
  cloudsecurity: "Cloud security",
  ctf: "CTF",
  cve: "CVE",
  devsecops: "DevSecOps",
  learning: "Learning",
  nodejs: "Node.js",
  rce: "RCE",
  "reverse-engineering": "Reverse engineering",
  "supply-chain": "Supply chain",
  "vulnerability-research": "Vulnerability research",
  web: "Web",
  xss: "XSS",
};
export function tagLabel(tag: string): string {
  if (TAG_LABELS[tag]) return TAG_LABELS[tag];
  const words = tag.replace(/-/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

// Comments via giscus (GitHub Discussions). Stays hidden until `categoryId` is set:
// enable Discussions on the repo, install https://github.com/apps/giscus, then copy
// the category ID from https://giscus.app.
export const GISCUS = {
  repo: "nithissh7/nithissh7.github.io",
  repoId: "R_kgDOT8b9DQ",
  category: "Comments",
  categoryId: "",
};
