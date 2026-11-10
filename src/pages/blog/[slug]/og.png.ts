import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { renderOgImage } from "../../../lib/og-image";
import { KINDS, kindOf } from "../../../lib/posts";
import { formatDate, tagLabel } from "../../../consts";

export async function getStaticPaths() {
  const posts = await getCollection("blog", ({ data }) => !data.draft);
  return posts.map((post) => ({
    params: { slug: post.id },
    props: { post },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const { post } = props as any;
  const png = await renderOgImage({
    eyebrow: KINDS[kindOf(post)].label,
    title: post.data.title,
    meta: formatDate(post.data.pubDate, "medium"),
    tags: post.data.tags.map(tagLabel),
  });

  return new Response(png, {
    headers: { "Content-Type": "image/png" },
  });
};
