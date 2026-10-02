import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';

// ============================================================================
// NQLV (No Más Que La Vida) platform schema
// ============================================================================
// Pivot from Comments-based moderation to a subscription book platform.
//
// Tables:
//   - users:            mirror of Clerk; webhook sync
//   - subscriptions:    PayPal + Wompi dual
//   - iterations:       60-day cycles (6 per year)
//   - bookChapters:     book content per iteration
//   - bookParagraphs:   topographic anchors for PDF deep-linking
//   - bookAnnotations:  annotations linked to paragraphs + users
//   - auditorProfiles:  honorific rank profiles
//   - notificationQueue: transactional email queue
//
// Design notes:
//   - All timestamps are `integer({ mode: 'timestamp' })` (epoch seconds).
//     The legacy Comments table stored createdAt as `text({...})` to dodge a
//     drizzle 0.45 epoch-units bug; integer-mode-timestamp is fine here
//     because we own the whole schema (no mixed migration data).
//   - Enums are stored as TEXT with an `enum:` constraint on the column.
//   - FKs are inline via `.references(() => ...)`. They are introspectable at
//     runtime via the `drizzle:SQLiteInlineForeignKeys` symbol on the table.
//   - UNIQUE constraints use the third arg of `sqliteTable()` (array API).
// ============================================================================

// ----------------------------------------------------------------------------
// Helpers (REFACTOR)
// ----------------------------------------------------------------------------

/** An autoincrement `id` primary-key column (INTEGER). */
const autoIncrementId = () => integer('id').primaryKey({ autoIncrement: true });

/** A `createdAt` column: epoch-seconds timestamp, NOT NULL. */
const createdAtColumn = () =>
  integer('createdAt', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`);

/** An `updatedAt` column: epoch-seconds timestamp, NOT NULL. */
const updatedAtColumn = () =>
  integer('updatedAt', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`);

// ----------------------------------------------------------------------------
// Enums (exported for app-level reuse)
// ----------------------------------------------------------------------------

export const USER_ROLES = ['lector', 'colaborador', 'auditor'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const PAYMENT_PROVIDERS = ['paypal', 'wompi'] as const;
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

export const SUBSCRIPTION_PLANS = ['lector', 'colaborador'] as const;
export type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[number];

export const SUBSCRIPTION_STATUSES = [
  'active',
  'past_due',
  'canceled',
  'pending',
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const ITERATION_STATUSES = ['open', 'closed', 'archived'] as const;
export type IterationStatus = (typeof ITERATION_STATUSES)[number];

export const ANNOTATION_STATUSES = [
  'pending',
  'approved',
  'rejected',
  'spam',
  'elevated',
] as const;
export type AnnotationStatus = (typeof ANNOTATION_STATUSES)[number];

export const NOTIFICATION_STATUSES = ['pending', 'sent', 'failed'] as const;
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

// ----------------------------------------------------------------------------
// Tables
// ----------------------------------------------------------------------------

export const users = sqliteTable('users', {
  clerkUserId: text('clerkUserId').primaryKey(),
  email: text('email').notNull(),
  displayName: text('displayName'),
  role: text('role', { enum: USER_ROLES }).notNull().default('lector'),
  habeasScriptumAcceptedAt: integer('habeasScriptumAcceptedAt', {
    mode: 'timestamp',
  }),
  createdAt: createdAtColumn(),
  updatedAt: updatedAtColumn(),
});

export const subscriptions = sqliteTable('subscriptions', {
  id: autoIncrementId(),
  userId: text('userId')
    .notNull()
    .references(() => users.clerkUserId),
  provider: text('provider', { enum: PAYMENT_PROVIDERS }).notNull(),
  providerSubscriptionId: text('providerSubscriptionId').notNull(),
  plan: text('plan', { enum: SUBSCRIPTION_PLANS }).notNull(),
  status: text('status', { enum: SUBSCRIPTION_STATUSES })
    .notNull()
    .default('pending'),
  currentPeriodStart: integer('currentPeriodStart', { mode: 'timestamp' }),
  currentPeriodEnd: integer('currentPeriodEnd', { mode: 'timestamp' }),
  createdAt: createdAtColumn(),
  updatedAt: updatedAtColumn(),
});

export const iterations = sqliteTable(
  'iterations',
  {
    id: autoIncrementId(),
    year: integer('year').notNull(),
    cycleNum: integer('cycleNum').notNull(),
    startsAt: integer('startsAt', { mode: 'timestamp' }).notNull(),
    endsAt: integer('endsAt', { mode: 'timestamp' }).notNull(),
    status: text('status', { enum: ITERATION_STATUSES })
      .notNull()
      .default('open'),
    pdfUrl: text('pdfUrl'),
    createdAt: createdAtColumn(),
  },
  (t) => [unique('iterations_year_cycleNum_unique').on(t.year, t.cycleNum)],
);

export const bookChapters = sqliteTable('bookChapters', {
  id: autoIncrementId(),
  iterationId: integer('iterationId')
    .notNull()
    .references(() => iterations.id),
  chapterNum: integer('chapterNum').notNull(),
  title: text('title').notNull(),
  slug: text('slug').notNull(),
  createdAt: createdAtColumn(),
});

export const bookParagraphs = sqliteTable('bookParagraphs', {
  id: autoIncrementId(),
  chapterId: integer('chapterId')
    .notNull()
    .references(() => bookChapters.id),
  paragraphNum: integer('paragraphNum').notNull(),
  anchorId: text('anchorId').notNull(),
  createdAt: createdAtColumn(),
});

export const bookAnnotations = sqliteTable('bookAnnotations', {
  id: autoIncrementId(),
  paragraphId: integer('paragraphId')
    .notNull()
    .references(() => bookParagraphs.id),
  userId: text('userId')
    .notNull()
    .references(() => users.clerkUserId),
  content: text('content').notNull(),
  status: text('status', { enum: ANNOTATION_STATUSES })
    .notNull()
    .default('pending'),
  triajeLevel: integer('triajeLevel'),
  triajeReasoning: text('triajeReasoning'),
  approvedAt: integer('approvedAt', { mode: 'timestamp' }),
  approvalReason: text('approvalReason'),
  createdAt: createdAtColumn(),
  updatedAt: updatedAtColumn(),
});

export const auditorProfiles = sqliteTable(
  'auditorProfiles',
  {
    id: autoIncrementId(),
    userId: text('userId')
      .notNull()
      .references(() => users.clerkUserId),
    publicVisible: integer('publicVisible', { mode: 'boolean' })
      .notNull()
      .default(false),
    bio: text('bio'),
    photoUrl: text('photoUrl'),
    ascentionCount: integer('ascentionCount').notNull().default(0),
    lastAscentionYear: integer('lastAscentionYear'),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (t) => [unique('auditorProfiles_userId_unique').on(t.userId)],
);

export const notificationQueue = sqliteTable('notificationQueue', {
  id: autoIncrementId(),
  userId: text('userId').references(() => users.clerkUserId),
  emailType: text('emailType').notNull(),
  payload: text('payload').notNull(),
  status: text('status', { enum: NOTIFICATION_STATUSES })
    .notNull()
    .default('pending'),
  scheduledFor: integer('scheduledFor', { mode: 'timestamp' }).notNull(),
  sentAt: integer('sentAt', { mode: 'timestamp' }),
  createdAt: createdAtColumn(),
});

// ----------------------------------------------------------------------------
// Inferred types (for app-level reuse)
// ----------------------------------------------------------------------------

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type Iteration = typeof iterations.$inferSelect;
export type NewIteration = typeof iterations.$inferInsert;
export type BookChapter = typeof bookChapters.$inferSelect;
export type NewBookChapter = typeof bookChapters.$inferInsert;
export type BookParagraph = typeof bookParagraphs.$inferSelect;
export type NewBookParagraph = typeof bookParagraphs.$inferInsert;
export type BookAnnotation = typeof bookAnnotations.$inferSelect;
export type NewBookAnnotation = typeof bookAnnotations.$inferInsert;
export type AuditorProfile = typeof auditorProfiles.$inferSelect;
export type NewAuditorProfile = typeof auditorProfiles.$inferInsert;
export type Notification = typeof notificationQueue.$inferSelect;
export type NewNotification = typeof notificationQueue.$inferInsert;