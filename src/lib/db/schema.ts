/**
 * @module db/schema
 * @description Define el esquema de la base de datos para la aplicación utilizando Drizzle ORM.
 * Actualmente, solo define la tabla de comentarios.
 */

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

/**
 * @table Comments
 * @description Define la tabla `Comments` en la base de datos.
 * Almacena los comentarios enviados por los usuarios en los posts del blog.
 */
export const Comments = sqliteTable('Comments', {
  /** @column {number} id - El identificador único del comentario. */
  id: integer('id').primaryKey({ autoIncrement: true }),
  /** @column {string} postSlug - El slug del post al que pertenece el comentario. */
  postSlug: text('postSlug').notNull(),
  /** @column {string} locale - El idioma del post en el que se hizo el comentario. */
  locale: text('locale').notNull(),
  /** @column {string} name - El nombre del autor del comentario. */
  name: text('name').notNull(),
  /** @column {string} email - El correo electrónico del autor del comentario (opcional). */
  email: text('email'),
  /** @column {string} message - El contenido del comentario. */
  message: text('message').notNull(),
  /** @column {Date} createdAt - La fecha y hora en que se creó el comentario. */
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  /** @column {number} approved - Indica si el comentario ha sido aprobado (1) o no (0). */
  approved: integer('approved').notNull().default(0),
});