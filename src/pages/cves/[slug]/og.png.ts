import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { renderOgImage } from "../../../lib/og-image";

const severityAccent: Record<string, { bg: string; ink: string }> = {
  Critical: { bg: "#fbe9f0", ink: "#be185d" },
  High: { bg: "#e6f4f1", ink: "#0f766e" },
  Medium: { bg: "#eef0fb", ink: "#4338ca" },
  Low: { bg: "#f0ede5", ink: "#55534d" },
  Informational: { bg: "#f0ede5", ink: "#55534d" },
};

export async function getStaticPaths() {
  const cves = await getCollection("cves", ({ data }) => !data.draft);
  return cves.map((cve) => ({
    params: { slug: cve.id },
    props: { cve },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const { cve } = props as any;
  const accent = severityAccent[cve.data.severity] ?? severityAccent.Informational;

  const png = await renderOgImage({
    eyebrow: `${cve.data.cveId} · ${cve.data.severity}`,
    title: cve.data.title,
    meta: cve.data.affectedProduct,
    accentBg: accent.bg,
    accentInk: accent.ink,
  });

  return new Response(png, {
    headers: { "Content-Type": "image/png" },
  });
};
