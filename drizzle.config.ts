import type { Config } from 'drizzle-kit';

export default {
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  driver: 'turso',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.ASTRO_DB_REMOTE_URL!,
    authToken: process.env.ASTRO_DB_APP_TOKEN!,
  },
} satisfies Config;