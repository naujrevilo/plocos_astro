/**
 * @module db
 * @description Este módulo inicializa y exporta la conexión a la base de datos utilizando Drizzle ORM y libSQL.
 * Lee la URL de la base de datos y el token de autenticación de las variables de entorno.
 */
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './db/schema';

const url = import.meta.env.ASTRO_DB_REMOTE_URL;
const authToken = import.meta.env.ASTRO_DB_APP_TOKEN;

if (!url) {
  throw new Error('ASTRO_DB_REMOTE_URL is not set');
}

const client = createClient({ url, authToken });

export const db = drizzle(client, { schema });