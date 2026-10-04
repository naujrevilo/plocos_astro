/**
 * @module db
 * @description Drizzle ORM over libSQL (Turso).
 *
 * - `createDb(client)` wraps any libSQL client with the app schema. Tests use
 *   it with an in-memory client (`createClient({ url: ':memory:' })`).
 * - `getDb()` / `db` expose the app database, built lazily on first use from
 *   `ASTRO_DB_REMOTE_URL` + `ASTRO_DB_APP_TOKEN`, so importing this module
 *   never throws when the env vars are absent (e.g. under vitest).
 *
 * Foreign keys: libSQL (both the local engine and Turso) enables
 * `PRAGMA foreign_keys` by default, which the `ON DELETE cascade` FKs to
 * `users` rely on. `tests/t27-db.test.ts` asserts it on every run.
 */
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql';
import { createClient, type Client } from '@libsql/client';
import * as schema from './db/schema';

export type Database = LibSQLDatabase<typeof schema>;

/** Wrap a libSQL client with the app schema. */
export function createDb(client: Client): Database {
  return drizzle(client, { schema });
}

let appDb: Database | undefined;

/** The app database, created on first call from the environment. */
export function getDb(): Database {
  if (!appDb) {
    const url = import.meta.env.ASTRO_DB_REMOTE_URL;
    const authToken = import.meta.env.ASTRO_DB_APP_TOKEN;
    if (!url) {
      throw new Error('ASTRO_DB_REMOTE_URL is not set');
    }
    appDb = createDb(createClient({ url, authToken }));
  }
  return appDb;
}

/**
 * Lazy proxy to `getDb()`: `db.select()...` works as before, but the client
 * is only created (and the env checked) when a property is first accessed.
 */
export const db: Database = new Proxy({} as Database, {
  get(_target, prop) {
    const real = getDb();
    const value = Reflect.get(real, prop, real);
    return typeof value === 'function' ? value.bind(real) : value;
  },
});
