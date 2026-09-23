export const SITE_TITLE = "realnits";
export const SITE_AUTHOR = "Nithissh";
export const SITE_DESCRIPTION =
  "Breaking down security, technical challenges, and code.";
export const SITE_TAGLINE =
  "Security architect by day, bug bounty hunter by night. I write about vulnerability research, the CVEs I find, and the challenges I solve.";

export const SOCIAL_LINKS = [
  { label: "GitHub", href: "https://github.com/nithissh7" },
  { label: "LinkedIn", href: "https://linkedin.com/in/nithisshs" },
  { label: "Email", href: "mailto:realnits@gmail.com" },
  { label: "RSS", href: "/rss.xml" },
];

// Frontmatter dates are written as IST midnight (e.g. 2023-10-02T18:30Z), so format in IST.
const TZ = "Asia/Kolkata";

export function formatDate(date: Date, style: "short" | "iso" | "long" | "medium" = "iso"): string {
  if (style === "medium") {
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: TZ });
  }
  if (style === "long") {
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: TZ });
  }
  const iso = date.toLocaleDateString("en-CA", { timeZone: TZ }); // YYYY-MM-DD
  return style === "short" ? iso.slice(5) : iso;
}

export function yearOf(date: Date): number {
  return Number(formatDate(date).slice(0, 4));
}

// Notion "select" colours; each tag always maps to the same one.
const TAG_COLORS = ["gray", "brown", "orange", "yellow", "green", "blue", "purple", "pink", "red"] as const;
export function tagColor(tag: string): string {
  let h = 0;
  for (const ch of tag) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return TAG_COLORS[h % TAG_COLORS.length];
}
