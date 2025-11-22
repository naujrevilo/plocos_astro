import { defineCollection, z } from 'astro:content';

const postsCollection = defineCollection({
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    pubDate: z.union([z.date(), z.string()]).transform((val) => new Date(val)),
    updatedDate: z.union([z.date(), z.string()]).optional().transform((val) => val ? new Date(val) : undefined),
    heroImage: z.string().optional(),
    heroImageAlt: z.string().optional(),
    draft: z.boolean().optional(),
    labels: z.array(z.string()).optional(),
    language: z.string().optional(),
    author: z.string().optional(),
    category: z.union([z.array(z.string()), z.string()]).optional(),
    originalUrl: z.string().optional(),
  }),
});

const categoriesCollection = defineCollection({
  schema: z.object({
    title: z.string(),
    title_en: z.string(),
    description: z.string(),
    description_en: z.string(),
    body_en: z.string(),
    color: z.string(),
    featured: z.boolean(),
    labels: z.array(z.string()),
  }),
});

const authorsCollection = defineCollection({
  schema: z.object({
    name: z.string().optional(),
    title: z.string().optional(),
    role: z.string().optional(),
    bio: z.string().optional(),
  }),
});

export const collections = {
  'posts': postsCollection,
  'categories': categoriesCollection,
  'authors': authorsCollection,
};