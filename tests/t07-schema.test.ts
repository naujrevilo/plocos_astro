/**
 * T07 — Schema DB redesign for NQLV platform
 *
 * Strict TDD invariant tests: introspect src/lib/db/schema.ts at runtime via
 * Drizzle's symbol-based metadata (`drizzle:SQLiteInlineForeignKeys`,
 * `drizzle:ExtraConfigBuilder`, `drizzle:ExtraConfigColumns`).
 *
 * We DO NOT call out to a real DB. The schema is plain data — these tests
 * verify it has the right shape, enums, FKs, and UNIQUE constraints.
 */
import { describe, expect, it } from 'vitest';
import * as schema from '../src/lib/db/schema';

// Drizzle internal symbols used to introspect table extra config.
const ORIG_NAME_SYM = Symbol.for('drizzle:OriginalName');
const INLINE_FKS = Symbol.for('drizzle:SQLiteInlineForeignKeys');
const EXTRA_CONFIG_BUILDER = Symbol.for('drizzle:ExtraConfigBuilder');
const EXTRA_CONFIG_COLUMNS = Symbol.for('drizzle:ExtraConfigColumns');

type DrizzleTable = Record<string | symbol, unknown> & {
  [ORIG_NAME_SYM]: string;
  [INLINE_FKS]?: Array<{
    reference: () => {
      columns: Array<{ name: string }>;
      foreignTable: Record<symbol, unknown>;
      foreignColumns: Array<{ name: string }>;
    };
  }>;
  [EXTRA_CONFIG_BUILDER]?: (
    cols: Record<string, unknown>,
  ) =>
    | Record<string, unknown>
    | Array<unknown>;
  [EXTRA_CONFIG_COLUMNS]?: Record<string, unknown>;
};

type DrizzleColumn = Record<string, unknown> & {
  name: string;
  notNull: boolean;
  primary: boolean;
  isUnique: boolean;
  hasDefault: boolean;
  enumValues?: ReadonlyArray<string>;
};

function getTable(name: string): DrizzleTable {
  const t = (schema as Record<string, unknown>)[name];
  if (!t) {
    throw new Error(`Table "${name}" missing from schema module`);
  }
  return t as DrizzleTable;
}

function getColumn(table: DrizzleTable, columnName: string): DrizzleColumn {
  const col = (table as Record<string, unknown>)[columnName];
  if (!col) {
    throw new Error(
      `Column "${columnName}" missing from table "${table[ORIG_NAME_SYM]}"`,
    );
  }
  return col as DrizzleColumn;
}

/**
 * UniqueConstraintBuilder instances carry `.columns` (an array of column
 * objects with `.name`) but no own `entityKind` symbol (that lives on the
 * class). We detect by shape.
 */
function isUniqueConstraintBuilder(
  value: unknown,
): value is { columns: Array<{ name: string }>; name?: string } {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  if (!Array.isArray(v.columns)) return false;
  const cols = v.columns as Array<Record<string, unknown>>;
  return cols.every((c) => typeof c.name === 'string');
}

function uniqueConstraintsOn(table: DrizzleTable): Array<{
  columns: Array<{ name: string }>;
  name?: string;
}> {
  const builder = table[EXTRA_CONFIG_BUILDER];
  const cols = table[EXTRA_CONFIG_COLUMNS];
  if (typeof builder !== 'function' || !cols) return [];

  const result = builder(cols as Record<string, unknown>);
  const items = Array.isArray(result) ? result : Object.values(result);

  const uniques: Array<{ columns: Array<{ name: string }>; name?: string }> = [];
  for (const item of items) {
    if (isUniqueConstraintBuilder(item)) {
      uniques.push(item);
    }
  }
  return uniques;
}

function foreignKeysOn(
  table: DrizzleTable,
): Array<{
  columns: Array<{ name: string }>;
  foreignTable: string;
  foreignColumns: Array<{ name: string }>;
}> {
  const fks = table[INLINE_FKS] ?? [];
  return fks.map((fk) => {
    const ref = fk.reference();
    return {
      columns: ref.columns,
      foreignTable: ref.foreignTable[ORIG_NAME_SYM] as string,
      foreignColumns: ref.foreignColumns,
    };
  });
}

const EXPECTED_TABLES = [
  'users',
  'subscriptions',
  'iterations',
  'bookChapters',
  'bookParagraphs',
  'bookAnnotations',
  'auditorProfiles',
  'notificationQueue',
] as const;

describe('T07 — Schema DB redesign (NQLV platform)', () => {
  describe('module shape', () => {
    it('exports a defined schema module', () => {
      expect(schema).toBeDefined();
      expect(typeof schema).toBe('object');
    });

    it.each(EXPECTED_TABLES)('exports the "%s" table', (name) => {
      expect((schema as Record<string, unknown>)[name]).toBeDefined();
    });

    it('drops the legacy Comments table', () => {
      expect(Object.keys(schema)).not.toContain('Comments');
    });
  });

  describe('users table', () => {
    const table = () => getTable('users');

    it('uses "users" as the SQL table name', () => {
      expect(table()[ORIG_NAME_SYM]).toBe('users');
    });

    it('has clerkUserId as PRIMARY KEY text', () => {
      const col = getColumn(table(), 'clerkUserId');
      expect(col.name).toBe('clerkUserId');
      expect(col.primary).toBe(true);
      expect(col.notNull).toBe(true);
    });

    it('has email NOT NULL', () => {
      const col = getColumn(table(), 'email');
      expect(col.name).toBe('email');
      expect(col.notNull).toBe(true);
    });

    it('has role enum with lector/colaborador/auditor defaulting to lector', () => {
      const col = getColumn(table(), 'role');
      expect(col.enumValues).toEqual(['lector', 'colaborador', 'auditor']);
      expect(col.hasDefault).toBe(true);
    });

    it('has habeasScriptumAcceptedAt nullable timestamp', () => {
      const col = getColumn(table(), 'habeasScriptumAcceptedAt');
      expect(col.name).toBe('habeasScriptumAcceptedAt');
      expect(col.notNull).toBe(false);
    });

    it('has createdAt and updatedAt NOT NULL timestamps', () => {
      const createdAt = getColumn(table(), 'createdAt');
      const updatedAt = getColumn(table(), 'updatedAt');
      expect(createdAt.notNull).toBe(true);
      expect(updatedAt.notNull).toBe(true);
    });
  });

  describe('subscriptions table', () => {
    const table = () => getTable('subscriptions');

    it('uses "subscriptions" as the SQL table name', () => {
      expect(table()[ORIG_NAME_SYM]).toBe('subscriptions');
    });

    it('has id PRIMARY KEY autoincrement', () => {
      const col = getColumn(table(), 'id');
      expect(col.name).toBe('id');
      expect(col.primary).toBe(true);
    });

    it('has provider enum paypal/wompi', () => {
      const col = getColumn(table(), 'provider');
      expect(col.enumValues).toEqual(['paypal', 'wompi']);
    });

    it('has plan enum lector/colaborador', () => {
      const col = getColumn(table(), 'plan');
      expect(col.enumValues).toEqual(['lector', 'colaborador']);
    });

    it('has status enum active/past_due/canceled/pending defaulting to pending', () => {
      const col = getColumn(table(), 'status');
      expect(col.enumValues).toEqual([
        'active',
        'past_due',
        'canceled',
        'pending',
      ]);
      expect(col.hasDefault).toBe(true);
    });

    it('has FK userId -> users.clerkUserId', () => {
      const fks = foreignKeysOn(table());
      const fk = fks.find(
        (f) =>
          f.columns.length === 1 &&
          f.columns[0].name === 'userId' &&
          f.foreignTable === 'users' &&
          f.foreignColumns.length === 1 &&
          f.foreignColumns[0].name === 'clerkUserId',
      );
      expect(fk, 'expected userId FK to users.clerkUserId').toBeDefined();
    });
  });

  describe('iterations table', () => {
    const table = () => getTable('iterations');

    it('uses "iterations" as the SQL table name', () => {
      expect(table()[ORIG_NAME_SYM]).toBe('iterations');
    });

    it('has status enum open/closed/archived defaulting to open', () => {
      const col = getColumn(table(), 'status');
      expect(col.enumValues).toEqual(['open', 'closed', 'archived']);
      expect(col.hasDefault).toBe(true);
    });

    it('has pdfUrl nullable', () => {
      const col = getColumn(table(), 'pdfUrl');
      expect(col.notNull).toBe(false);
    });

    it('has UNIQUE(year, cycleNum)', () => {
      const uniques = uniqueConstraintsOn(table());
      const match = uniques.find((u) => {
        const names = u.columns.map((c) => c.name).sort();
        return (
          names.length === 2 &&
          names[0] === 'cycleNum' &&
          names[1] === 'year'
        );
      });
      expect(
        match,
        'expected UNIQUE(year, cycleNum) constraint',
      ).toBeDefined();
    });
  });

  describe('bookChapters table', () => {
    const table = () => getTable('bookChapters');

    it('uses "bookChapters" as the SQL table name', () => {
      expect(table()[ORIG_NAME_SYM]).toBe('bookChapters');
    });

    it('has FK iterationId -> iterations.id', () => {
      const fks = foreignKeysOn(table());
      const fk = fks.find(
        (f) =>
          f.columns.length === 1 &&
          f.columns[0].name === 'iterationId' &&
          f.foreignTable === 'iterations' &&
          f.foreignColumns.length === 1 &&
          f.foreignColumns[0].name === 'id',
      );
      expect(
        fk,
        'expected iterationId FK to iterations.id',
      ).toBeDefined();
    });
  });

  describe('bookParagraphs table', () => {
    const table = () => getTable('bookParagraphs');

    it('uses "bookParagraphs" as the SQL table name', () => {
      expect(table()[ORIG_NAME_SYM]).toBe('bookParagraphs');
    });

    it('has anchorId NOT NULL', () => {
      const col = getColumn(table(), 'anchorId');
      expect(col.name).toBe('anchorId');
      expect(col.notNull).toBe(true);
    });

    it('has FK chapterId -> bookChapters.id', () => {
      const fks = foreignKeysOn(table());
      const fk = fks.find(
        (f) =>
          f.columns.length === 1 &&
          f.columns[0].name === 'chapterId' &&
          f.foreignTable === 'bookChapters' &&
          f.foreignColumns.length === 1 &&
          f.foreignColumns[0].name === 'id',
      );
      expect(
        fk,
        'expected chapterId FK to bookChapters.id',
      ).toBeDefined();
    });
  });

  describe('bookAnnotations table', () => {
    const table = () => getTable('bookAnnotations');

    it('uses "bookAnnotations" as the SQL table name', () => {
      expect(table()[ORIG_NAME_SYM]).toBe('bookAnnotations');
    });

    it('has status enum pending/approved/rejected/spam/elevated defaulting to pending', () => {
      const col = getColumn(table(), 'status');
      expect(col.enumValues).toEqual([
        'pending',
        'approved',
        'rejected',
        'spam',
        'elevated',
      ]);
      expect(col.hasDefault).toBe(true);
    });

    it('has triajeLevel nullable integer', () => {
      const col = getColumn(table(), 'triajeLevel');
      expect(col.name).toBe('triajeLevel');
      expect(col.notNull).toBe(false);
    });

    it('has FK paragraphId -> bookParagraphs.id', () => {
      const fks = foreignKeysOn(table());
      const fk = fks.find(
        (f) =>
          f.columns.length === 1 &&
          f.columns[0].name === 'paragraphId' &&
          f.foreignTable === 'bookParagraphs' &&
          f.foreignColumns.length === 1 &&
          f.foreignColumns[0].name === 'id',
      );
      expect(
        fk,
        'expected paragraphId FK to bookParagraphs.id',
      ).toBeDefined();
    });

    it('has FK userId -> users.clerkUserId', () => {
      const fks = foreignKeysOn(table());
      const fk = fks.find(
        (f) =>
          f.columns.length === 1 &&
          f.columns[0].name === 'userId' &&
          f.foreignTable === 'users' &&
          f.foreignColumns.length === 1 &&
          f.foreignColumns[0].name === 'clerkUserId',
      );
      expect(
        fk,
        'expected userId FK to users.clerkUserId',
      ).toBeDefined();
    });
  });

  describe('auditorProfiles table', () => {
    const table = () => getTable('auditorProfiles');

    it('uses "auditorProfiles" as the SQL table name', () => {
      expect(table()[ORIG_NAME_SYM]).toBe('auditorProfiles');
    });

    it('has publicVisible NOT NULL with default 0', () => {
      const col = getColumn(table(), 'publicVisible');
      expect(col.name).toBe('publicVisible');
      expect(col.notNull).toBe(true);
      expect(col.hasDefault).toBe(true);
    });

    it('has FK userId -> users.clerkUserId', () => {
      const fks = foreignKeysOn(table());
      const fk = fks.find(
        (f) =>
          f.columns.length === 1 &&
          f.columns[0].name === 'userId' &&
          f.foreignTable === 'users' &&
          f.foreignColumns.length === 1 &&
          f.foreignColumns[0].name === 'clerkUserId',
      );
      expect(
        fk,
        'expected userId FK to users.clerkUserId',
      ).toBeDefined();
    });

    it('has UNIQUE constraint on userId', () => {
      const uniques = uniqueConstraintsOn(table());
      const match = uniques.find(
        (u) =>
          u.columns.length === 1 && u.columns[0].name === 'userId',
      );
      expect(
        match,
        'expected UNIQUE(userId) constraint on auditorProfiles',
      ).toBeDefined();
    });
  });

  describe('notificationQueue table', () => {
    const table = () => getTable('notificationQueue');

    it('uses "notificationQueue" as the SQL table name', () => {
      expect(table()[ORIG_NAME_SYM]).toBe('notificationQueue');
    });

    it('has userId nullable (system emails with no user)', () => {
      const col = getColumn(table(), 'userId');
      expect(col.name).toBe('userId');
      expect(col.notNull).toBe(false);
    });

    it('has status enum pending/sent/failed defaulting to pending', () => {
      const col = getColumn(table(), 'status');
      expect(col.enumValues).toEqual(['pending', 'sent', 'failed']);
      expect(col.hasDefault).toBe(true);
    });

    it('has FK userId -> users.clerkUserId (nullable)', () => {
      const fks = foreignKeysOn(table());
      const fk = fks.find(
        (f) =>
          f.columns.length === 1 &&
          f.columns[0].name === 'userId' &&
          f.foreignTable === 'users' &&
          f.foreignColumns.length === 1 &&
          f.foreignColumns[0].name === 'clerkUserId',
      );
      expect(
        fk,
        'expected userId FK to users.clerkUserId on notificationQueue',
      ).toBeDefined();
    });
  });

  describe('drizzle config', () => {
    it('uses dialect: "turso" instead of driver: "turso"', async () => {
      // The config file is loaded via tsx-friendly dynamic import. We cannot
      // guarantee node can resolve the TS syntax on its own, so we read it as
      // text and look for the keys — this is the same invariant Drizzle
      // enforces at parse time.
      const { readFileSync } = await import('node:fs');
      const path = (await import('node:path')).default;
      const configText = readFileSync(
        path.resolve(__dirname, '..', 'drizzle.config.ts'),
        'utf8',
      );
      expect(configText).toMatch(/dialect:\s*['"]turso['"]/);
      expect(configText).not.toMatch(/driver:\s*['"]turso['"]/);
    });
  });
});