export const SITE_TITLE = "realnits";
export const SITE_AUTHOR = "Nithissh";
export const SITE_DESCRIPTION =
  "Breaking down security, technical challenges, and code.";
export const SITE_TAGLINE =
  "Security architect by day, bug bounty hunter by night. I break things, then write down how.";

export const SOCIAL_LINKS = [
  { label: "github", href: "https://github.com/nithissh7" },
  { label: "linkedin", href: "https://linkedin.com/in/nithisshs" },
  { label: "email", href: "mailto:realnits@gmail.com" },
  { label: "rss", href: "/rss.xml" },
];

// Frontmatter dates are written as IST midnight (e.g. 2023-10-02T18:30Z), so format in IST.
const TZ = "Asia/Kolkata";

export function formatDate(date: Date, style: "short" | "iso" | "long" = "iso"): string {
  if (style === "long") {
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: TZ });
  }
  const iso = date.toLocaleDateString("en-CA", { timeZone: TZ }); // YYYY-MM-DD
  return style === "short" ? iso.slice(5) : iso;
}

export function yearOf(date: Date): number {
  return Number(formatDate(date).slice(0, 4));
}
