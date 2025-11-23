import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './db/schema';

const url = process.env.ASTRO_DB_REMOTE_URL;
const authToken = process.env.ASTRO_DB_APP_TOKEN;

if (!url) {
  throw new Error('ASTRO_DB_REMOTE_URL is not set');
}

const client = createClient({ url, authToken });

export const db = drizzle(client, { schema });