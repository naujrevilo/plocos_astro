import { defineCollection, z } from 'astro:content';

const ISO_DATE_REGEX =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|z|[+-]\d{2}:\d{2}|[+-]\d{4})$/;

const parseFrontmatterDate = (value: string): Date => {
  const needsColon = /[+-]\d{4}$/.test(value);
  const normalized = (needsColon
    ? value.replace(/([+-]\d{2})(\d{2})$/, '$1:$2')
    : value
  ).replace(/z$/, 'Z');
  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date value: ${value}`);
  }

  return parsed;
};

const frontmatterStringDate = z
  .string()
  .regex(
    ISO_DATE_REGEX,
    'Expected ISO-8601 date with timezone, e.g. 2020-01-01T06:15:00-0500',
  )
  .transform(parseFrontmatterDate);

const frontmatterDate = z.union([frontmatterStringDate, z.date()]);

const postsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    pubDate: frontmatterDate,
    updatedDate: frontmatterDate.optional(),
    labels: z.array(z.string()).default([]),
    categories: z.array(z.string()).default([]),
    author: z.string().max(120).default('MSD'),
    language: z.enum(['es', 'en']).default('es'),
    translationKey: z.string().max(120).optional(),
    summary: z.string().max(1000).optional(),
    heroImage: z.string().optional(),
    heroImageAlt: z.string().max(200).optional(),
    originalUrl: z.string().url().optional(),
    draft: z.boolean().default(false),
  }),
});

const categoriesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().max(500).optional(),
    color: z.string().optional(),
    featured: z.boolean().default(false),
    labels: z.array(z.string()).default([]),
  }),
});

const authorsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    role: z.string().optional(),
    bio: z.string().max(1000).optional(),
    portrait: z.string().optional(),
    body: z.string().optional(),
  }),
});

export const collections = {
  posts: postsCollection,
  categories: categoriesCollection,
  authors: authorsCollection,
};
