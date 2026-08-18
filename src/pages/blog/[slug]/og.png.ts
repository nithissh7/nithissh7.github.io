import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { renderOgImage } from "../../../lib/og-image";

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
    eyebrow: "Blog",
    title: post.data.title,
    meta: post.data.pubDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
    tags: post.data.tags,
  });

  return new Response(png, {
    headers: { "Content-Type": "image/png" },
  });
};
