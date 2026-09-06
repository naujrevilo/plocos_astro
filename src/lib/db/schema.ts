import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const COMMENT_STATUSES = ['pending', 'approved', 'rejected', 'spam'] as const;
export type CommentStatus = (typeof COMMENT_STATUSES)[number];

export const Comments = sqliteTable('Comments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  postSlug: text('postSlug').notNull(),
  locale: text('locale').notNull(),
  name: text('name').notNull(),
  email: text('email'),
  message: text('message').notNull(),
  // ISO 8601 string (YYYY-MM-DDTHH:MM:SS.sssZ). Stored as TEXT so lexicographic
  // ORDER BY matches chronological order. App code formats/parses with native Date.
  // Do NOT use `text('col', { mode: 'timestamp' })` here — it caused inconsistent
  // epoch-seconds-vs-milliseconds storage in drizzle 0.45 (Engram #128).
  createdAt: text('createdAt').notNull(),
  status: text('status', { enum: COMMENT_STATUSES }).notNull().default('pending'),
  rejectionReason: text('rejectionReason'),
  notifyAuthor: integer('notifyAuthor').notNull().default(0),
});
