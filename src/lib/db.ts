
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import type { AstroGlobal } from 'astro';

// Re-export all table schemas
export * from 'astro:db';

function createDbClient(locals: AstroGlobal['locals']) {
  const {
    ASTRO_DB_REMOTE_URL: url,
    ASTRO_DB_APP_TOKEN: authToken,
  } = locals.runtime.env;

  if (!url || !authToken) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Database credentials are not configured.');
    }
    // En desarrollo, astro:db se encarga de esto.
    // Devolvemos un objeto vacío para evitar errores de construcción.
    return { db: {}, tables: {} };
  }

  const client = createClient({ url, authToken });
  return drizzle(client);
}

export function getDb(locals: AstroGlobal['locals']) {
  const isNetlifyProduction = locals.runtime.env.NETLIFY && locals.runtime.env.CONTEXT === 'production';

  if (isNetlifyProduction) {
    return createDbClient(locals);
  }

  // En desarrollo, usamos la instancia de astro:db
  // Esto es un poco un hack, pero nos permite usar la misma API
  // en ambos entornos.
  const { db } = locals as any;
  return db;
}
