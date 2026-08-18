import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().default("Nithissh"),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

const cves = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/cves" }),
  schema: z.object({
    cveId: z.string(),
    title: z.string(),
    severity: z.enum(["Critical", "High", "Medium", "Low", "Informational"]),
    cvssScore: z.number().min(0).max(10).optional(),
    affectedProduct: z.string(),
    vendor: z.string().optional(),
    pubDate: z.coerce.date(),
    status: z
      .enum(["Published", "Reserved", "Rejected", "Disputed"])
      .default("Published"),
    references: z.array(z.string()).optional(),
    description: z.string(),
    draft: z.boolean().default(false),
  }),
});

const certifications = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/certifications" }),
  schema: z.object({
    name: z.string(),
    issuer: z.string(),
    dateEarned: z.coerce.date(),
    expiryDate: z.coerce.date().optional().nullable(),
    credentialId: z.string().optional(),
    credentialUrl: z.string().url().optional(),
    badgeUrl: z.string().optional(),
    description: z.string(),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { blog, cves, certifications };
