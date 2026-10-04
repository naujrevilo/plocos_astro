import type { Config } from 'drizzle-kit';

// `drizzle-kit generate` only diffs schema.ts against drizzle/meta and needs
// no connection, so missing credentials must not break it. Commands that do
// connect (migrate, push, studio) fail loudly inside drizzle-kit when the URL
// is empty.
export default {
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'turso',
  dbCredentials: {
    url: process.env.ASTRO_DB_REMOTE_URL ?? '',
    authToken: process.env.ASTRO_DB_APP_TOKEN,
  },
} satisfies Config;
