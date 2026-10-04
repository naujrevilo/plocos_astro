/**
 * @module books
 * @description Canon archive: iterations of "No más que la Vida" (T14a).
 *
 * Each iteration row (`iterations` table) may carry a `pdfUrl`, which is the
 * key of the PDF inside the Netlify Blobs store `plocos-books` (not a URL).
 * Subscribers never see that key: they download through the role-gated
 * endpoint returned by `getBookPdfPath`.
 *
 * Every query takes an optional `Database` so tests can pass an in-memory one.
 */
import { and, eq } from 'drizzle-orm';
import { db as appDb, type Database } from './db';
import { iterations, type IterationStatus } from './db/schema';

/** Netlify Blobs store holding the iteration PDFs. */
export const BOOKS_STORE = 'plocos-books';

export type IterationRow = typeof iterations.$inferSelect;

/** Iteration fields the archive UI renders. */
export interface ArchiveIteration {
  year: number;
  cycleNum: number;
  status: IterationStatus;
  startsAt: Date;
  endsAt: Date;
  hasPdf: boolean;
  /** The current version of the Canon (highest year, then highest cycle). */
  isLatest: boolean;
}

export interface ArchiveYear {
  year: number;
  iterations: ArchiveIteration[];
}

/**
 * Group iterations by year for the archive: years descending, cycles
 * ascending inside a year, and exactly one iteration flagged `isLatest`
 * (none when there are no rows).
 */
export function groupIterationsByYear(
  rows: ReadonlyArray<
    Pick<IterationRow, 'year' | 'cycleNum' | 'status' | 'startsAt' | 'endsAt' | 'pdfUrl'>
  >,
): ArchiveYear[] {
  const sorted = [...rows].sort((a, b) => b.year - a.year || a.cycleNum - b.cycleNum);
  const latest = sorted.reduce<(typeof sorted)[number] | undefined>(
    (best, r) =>
      !best || r.year > best.year || (r.year === best.year && r.cycleNum > best.cycleNum)
        ? r
        : best,
    undefined,
  );

  const groups: ArchiveYear[] = [];
  for (const r of sorted) {
    let group = groups[groups.length - 1];
    if (!group || group.year !== r.year) {
      group = { year: r.year, iterations: [] };
      groups.push(group);
    }
    group.iterations.push({
      year: r.year,
      cycleNum: r.cycleNum,
      status: r.status,
      startsAt: r.startsAt,
      endsAt: r.endsAt,
      hasPdf: Boolean(r.pdfUrl),
      isLatest: r === latest,
    });
  }
  return groups;
}

/** Every iteration, unordered (the UI orders via `groupIterationsByYear`). */
export async function listIterations(database: Database = appDb): Promise<IterationRow[]> {
  return database.select().from(iterations);
}

/** One iteration by year and cycle number, or null. */
export async function getIteration(
  year: number,
  cycleNum: number,
  database: Database = appDb,
): Promise<IterationRow | null> {
  const rows = await database
    .select()
    .from(iterations)
    .where(and(eq(iterations.year, year), eq(iterations.cycleNum, cycleNum)))
    .limit(1);
  return rows[0] ?? null;
}

/** Path of the role-gated PDF endpoint for an iteration. */
export function getBookPdfPath(year: number, cycleNum: number): string {
  return `/api/books/${year}/${cycleNum}.pdf`;
}
