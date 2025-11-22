import { defineCollection, z } from 'astro:content';

const authorsCollection = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    avatar: z.string().optional(),
  }),
});

const categoriesCollection = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    description: z.string().optional(),
  }),
});

// Date to distinguish between old and new posts
const newPostsCutoffDate = new Date('2025-11-21T00:00:00Z');

const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    pubDate: z.string().transform(str => new Date(str)),
    updatedDate: z.string().transform(str => new Date(str)).optional(),
    category: z.string().optional(),
    author: z.string().default('Michel Saer'),
    language: z.enum(['es', 'en']).default('es'),
    translationKey: z.string().optional(),
    summary: z.string().optional(),
    heroImage: z.string().optional(),
    heroImageAlt: z.string().optional(),
    originalUrl: z.string().url().optional(),
    draft: z.boolean().default(false),
    labels: z.array(z.string()).default([]),
  }).superRefine((data, ctx) => {
    // For new posts, the category is required.
    if (data.pubDate > newPostsCutoffDate) {
      if (!data.category || data.category.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['category'],
          message: 'La categoría es obligatoria para las nuevas publicaciones.',
        });
      }
    }
  }),
});

export const collections = {
  blog: blogCollection,
  authors: authorsCollection,
  categories: categoriesCollection,
};
