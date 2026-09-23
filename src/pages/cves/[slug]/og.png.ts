import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { renderOgImage } from "../../../lib/og-image";

export async function getStaticPaths() {
  const cves = await getCollection("cves", ({ data }) => !data.draft);
  return cves.map((cve) => ({
    params: { slug: cve.id },
    props: { cve },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const { cve } = props as any;
  const png = await renderOgImage({
    eyebrow: `${cve.data.cveId} · ${cve.data.severity.toLowerCase()}`,
    title: cve.data.title,
    meta: cve.data.affectedProduct,
  });

  return new Response(png, {
    headers: { "Content-Type": "image/png" },
  });
};
