import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const Comments = sqliteTable('Comments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  postSlug: text('postSlug').notNull(),
  locale: text('locale').notNull(),
  name: text('name').notNull(),
  email: text('email'),
  message: text('message').notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  approved: integer('approved').notNull().default(0),
});