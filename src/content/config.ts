import { defineCollection, z } from 'astro:content';



const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    pubDate: z.date(),
    author: z.string().default('Michel Saer'),
    language: z.enum(['es', 'en']).default('es'),
    translationKey: z.string().optional(),
    summary: z.string().optional(),
    heroImage: z.string().optional(),
    heroImageAlt: z.string().optional(),
    originalUrl: z.string().url().optional(),
    draft: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
  }),
});



export const collections = {
  blog: blogCollection,
};
