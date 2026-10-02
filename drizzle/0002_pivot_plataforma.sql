-- 0002_pivot_plataforma.sql
-- Pivot from Comments-based moderation to NQLV subscription platform
-- Replaces the legacy Comments table with 8 tables backing the subscription
-- book platform. Run manually against the Turso DB via libsql client or
-- `pnpm exec drizzle-kit push` (do NOT auto-run on every build).
DROP TABLE IF EXISTS Comments;

CREATE TABLE users (
  clerkUserId TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  displayName TEXT,
  role TEXT NOT NULL DEFAULT 'lector',
  habeasScriptumAcceptedAt INTEGER,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

CREATE TABLE subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId TEXT NOT NULL REFERENCES users(clerkUserId),
  provider TEXT NOT NULL,
  providerSubscriptionId TEXT NOT NULL,
  plan TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  currentPeriodStart INTEGER,
  currentPeriodEnd INTEGER,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

CREATE TABLE iterations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  year INTEGER NOT NULL,
  cycleNum INTEGER NOT NULL,
  startsAt INTEGER NOT NULL,
  endsAt INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  pdfUrl TEXT,
  createdAt INTEGER NOT NULL,
  UNIQUE(year, cycleNum)
);

CREATE TABLE bookChapters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  iterationId INTEGER NOT NULL REFERENCES iterations(id),
  chapterNum INTEGER NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  createdAt INTEGER NOT NULL
);

CREATE TABLE bookParagraphs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chapterId INTEGER NOT NULL REFERENCES bookChapters(id),
  paragraphNum INTEGER NOT NULL,
  anchorId TEXT NOT NULL,
  createdAt INTEGER NOT NULL
);

CREATE TABLE bookAnnotations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  paragraphId INTEGER NOT NULL REFERENCES bookParagraphs(id),
  userId TEXT NOT NULL REFERENCES users(clerkUserId),
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  triajeLevel INTEGER,
  triajeReasoning TEXT,
  approvedAt INTEGER,
  approvalReason TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

CREATE TABLE auditorProfiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId TEXT NOT NULL UNIQUE REFERENCES users(clerkUserId),
  publicVisible INTEGER NOT NULL DEFAULT 0,
  bio TEXT,
  photoUrl TEXT,
  ascentionCount INTEGER NOT NULL DEFAULT 0,
  lastAscentionYear INTEGER,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

CREATE TABLE notificationQueue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId TEXT REFERENCES users(clerkUserId),
  emailType TEXT NOT NULL,
  payload TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  scheduledFor INTEGER NOT NULL,
  sentAt INTEGER,
  createdAt INTEGER NOT NULL
);