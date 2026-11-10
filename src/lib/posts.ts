import { getCollection, type CollectionEntry } from "astro:content";
import { getReadingTime } from "./reading-time";

export type Post = CollectionEntry<"blog">;
export type Cve = CollectionEntry<"cves">;

/** Published posts, newest first. */
export async function getPosts(): Promise<Post[]> {
  return (await getCollection("blog", ({ data }) => !data.draft)).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  );
}

/** Published CVEs, newest first; same-day entries by score, then ID. One order for lists and prev/next. */
export async function getCves(): Promise<Cve[]> {
  return (await getCollection("cves", ({ data }) => !data.draft)).sort(
    (a, b) =>
      b.data.pubDate.valueOf() - a.data.pubDate.valueOf() ||
      (b.data.cvssScore ?? 0) - (a.data.cvssScore ?? 0) ||
      a.data.cveId.localeCompare(b.data.cveId)
  );
}

// What a post is, as a reader would ask for it. Set `category` in frontmatter;
// untagged posts fall back to a guess from their tags.
export const KINDS = {
  research: { label: "Research", plural: "Research", blurb: "Bugs found and CVEs taken apart" },
  challenge: { label: "Challenge", plural: "Challenges", blurb: "CTF and challenge solutions" },
  tooling: { label: "Tooling", plural: "Tooling", blurb: "Building and fixing security tools" },
  notes: { label: "Notes", plural: "Notes", blurb: "Everything else" },
} as const;
export type Kind = keyof typeof KINDS;

export function kindOf(post: Post): Kind {
  if (post.data.category) return post.data.category;
  const tags = post.data.tags;
  if (tags.includes("ctf")) return "challenge";
  if (tags.includes("vulnerability-research")) return "research";
  return "notes";
}

/** Kinds that have at least one post, in display order, with counts. */
export function kindCounts(posts: Post[]): { kind: Kind; n: number }[] {
  return (Object.keys(KINDS) as Kind[])
    .map((kind) => ({ kind, n: posts.filter((p) => kindOf(p) === kind).length }))
    .filter((k) => k.n > 0);
}

/** "14 min" */
export function minutes(post: Post): string {
  return getReadingTime(post.body ?? "").replace(" read", "");
}

/** Tags by how often they are used, then alphabetically. */
export function tagCounts(posts: Post[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const post of posts) for (const tag of post.data.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

const SEVERITIES = ["Critical", "High", "Medium", "Low", "Informational"] as const;
/** Severity levels that occur, most severe first, with counts. */
export function severityCounts(cves: Cve[]): { severity: (typeof SEVERITIES)[number]; n: number }[] {
  return SEVERITIES.map((severity) => ({ severity, n: cves.filter((c) => c.data.severity === severity).length })).filter(
    (s) => s.n > 0
  );
}
