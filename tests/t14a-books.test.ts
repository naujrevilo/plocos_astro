/**
 * T14a — Canon archive + protected PDF
 *
 * - `groupIterationsByYear`: pure grouping for the /libro archive section.
 * - `listIterations` / `getIteration`: drizzle queries against an in-memory
 *   libsql database with the generated migrations (same setup as T27).
 * - `GET /api/books/[year]/[cycle].pdf`: role gate, 404s and streaming, with
 *   `@netlify/blobs`, the books module and the locale router mocked.
 * - Dev seed route: input validation only (it never runs outside `astro dev`).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createClient } from '@libsql/client';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { createDb, type Database } from '../src/lib/db';
import { iterations } from '../src/lib/db/schema';

vi.mock('@netlify/blobs', () => ({ getStore: vi.fn() }));

vi.mock('../src/lib/books', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/lib/books')>();
  return { ...actual, getIteration: vi.fn() };
});

// `createLocaleHref` depends on the `astro:i18n` virtual module; mirror its
// output shape (ES default without prefix, trailing slash).
vi.mock('../src/lib/routes', () => ({
  createLocaleHref: (locale: string, path: string) =>
    locale === 'es' ? `/${path}/` : `/${locale}/${path}/`,
}));

type Books = typeof import('../src/lib/books');
const actualBooks = () => vi.importActual<Books>('../src/lib/books');

const day = (iso: string) => new Date(`${iso}T00:00:00Z`);

function row(year: number, cycleNum: number, pdfUrl: string | null = null) {
  return {
    id: year * 10 + cycleNum,
    year,
    cycleNum,
    startsAt: day(`${year}-01-01`),
    endsAt: day(`${year}-03-01`),
    status: 'open' as const,
    pdfUrl,
    createdAt: day(`${year}-01-01`),
  };
}

describe('T14a — groupIterationsByYear', () => {
  it('orders years descending and cycles ascending', async () => {
    const { groupIterationsByYear } = await actualBooks();
    const groups = groupIterationsByYear([row(2025, 6), row(2026, 2), row(2025, 1), row(2026, 1)]);

    expect(groups.map((g) => g.year)).toEqual([2026, 2025]);
    expect(groups[0]?.iterations.map((i) => i.cycleNum)).toEqual([1, 2]);
    expect(groups[1]?.iterations.map((i) => i.cycleNum)).toEqual([1, 6]);
  });

  it('flags exactly one iteration as latest: highest year, then highest cycle', async () => {
    const { groupIterationsByYear } = await actualBooks();
    const groups = groupIterationsByYear([row(2025, 6), row(2026, 2), row(2026, 1)]);
    const flagged = groups.flatMap((g) => g.iterations).filter((i) => i.isLatest);

    expect(flagged).toHaveLength(1);
    expect(flagged[0]).toMatchObject({ year: 2026, cycleNum: 2 });
  });

  it('returns an empty array for no rows', async () => {
    const { groupIterationsByYear } = await actualBooks();
    expect(groupIterationsByYear([])).toEqual([]);
  });

  it('exposes hasPdf and only the fields the UI needs', async () => {
    const { groupIterationsByYear } = await actualBooks();
    const [group] = groupIterationsByYear([row(2026, 1, '2026/1.pdf'), row(2026, 2)]);

    expect(group?.iterations[0]).toEqual({
      year: 2026,
      cycleNum: 1,
      status: 'open',
      startsAt: day('2026-01-01'),
      endsAt: day('2026-03-01'),
      hasPdf: true,
      isLatest: false,
    });
    expect(group?.iterations[1]?.hasPdf).toBe(false);
    expect(group?.iterations[1]).not.toHaveProperty('pdfUrl');
  });
});

describe('T14a — getBookPdfPath', () => {
  it('builds the protected endpoint path', async () => {
    const { getBookPdfPath } = await actualBooks();
    expect(getBookPdfPath(2026, 1)).toBe('/api/books/2026/1.pdf');
  });
});

describe('T14a — listIterations / getIteration (in-memory libsql)', () => {
  let db: Database;

  beforeEach(async () => {
    db = createDb(createClient({ url: ':memory:' }));
    await migrate(db, { migrationsFolder: 'drizzle' });
    await db.insert(iterations).values([
      { year: 2026, cycleNum: 1, startsAt: day('2026-01-01'), endsAt: day('2026-03-01'), pdfUrl: '2026/1.pdf' },
      { year: 2025, cycleNum: 6, startsAt: day('2025-11-01'), endsAt: day('2025-12-31') },
    ]);
  });

  it('lists every iteration', async () => {
    const { listIterations } = await actualBooks();
    const rows = await listIterations(db);
    expect(rows.map((r) => `${r.year}/${r.cycleNum}`).sort()).toEqual(['2025/6', '2026/1']);
  });

  it('fetches one iteration by year and cycle', async () => {
    const { getIteration } = await actualBooks();
    const found = await getIteration(2026, 1, db);
    expect(found?.pdfUrl).toBe('2026/1.pdf');
    expect(found?.startsAt).toEqual(day('2026-01-01'));
  });

  it('returns null for a missing iteration', async () => {
    const { getIteration } = await actualBooks();
    expect(await getIteration(2026, 2, db)).toBeNull();
  });
});

describe('T14a — GET /api/books/[year]/[cycle].pdf', () => {
  const PDF_BYTES = new TextEncoder().encode('%PDF-1.7 test');

  function streamOf(bytes: Uint8Array): ReadableStream<Uint8Array> {
    return new ReadableStream({
      start(controller) {
        controller.enqueue(bytes);
        controller.close();
      },
    });
  }

  function context(opts: {
    year?: string;
    cycle?: string;
    role?: string | null;
    locale?: string;
  }) {
    const { year = '2026', cycle = '1', role = 'lector', locale } = opts;
    const url = new URL(`http://localhost/api/books/${year}/${cycle}.pdf`);
    if (locale) url.searchParams.set('locale', locale);
    return {
      params: { year, cycle },
      url,
      locals: {
        auth: () => ({ sessionClaims: role ? { metadata: { role } } : {} }),
      },
      redirect: (location: string, status = 302) =>
        new Response(null, { status, headers: { Location: location } }),
    };
  }

  async function callGet(ctx: ReturnType<typeof context>): Promise<Response> {
    const { GET } = await import('../src/pages/api/books/[year]/[cycle].pdf');
    return (await GET(ctx as never)) as Response;
  }

  async function mocks() {
    const blobs = await import('@netlify/blobs');
    const books = await import('../src/lib/books');
    return {
      getStore: vi.mocked(blobs.getStore),
      getIteration: vi.mocked(books.getIteration),
    };
  }

  function stubStore(getStore: ReturnType<typeof vi.fn>, value: unknown) {
    const get = vi.fn().mockResolvedValue(value);
    getStore.mockReturnValue({ get } as never);
    return get;
  }

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('redirects a user without role to the ES subscription page', async () => {
    const { getIteration } = await mocks();
    const res = await callGet(context({ role: null }));
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toBe('/suscripcion/');
    expect(getIteration).not.toHaveBeenCalled();
  });

  it('redirects to the EN subscription page when locale=en', async () => {
    const res = await callGet(context({ role: null, locale: 'en' }));
    expect(res.headers.get('Location')).toBe('/en/subscription/');
  });

  it.each([
    ['abc', '1'],
    ['2026', '0'],
    ['2026', '-1'],
    ['2026', '1.5'],
    ['0', '1'],
  ])('returns 404 for invalid params year=%s cycle=%s', async (year, cycle) => {
    const { getIteration } = await mocks();
    const res = await callGet(context({ year, cycle }));
    expect(res.status).toBe(404);
    expect(getIteration).not.toHaveBeenCalled();
  });

  it('returns 404 when the iteration does not exist', async () => {
    const { getIteration } = await mocks();
    getIteration.mockResolvedValue(null);
    const res = await callGet(context({}));
    expect(res.status).toBe(404);
    expect(getIteration).toHaveBeenCalledWith(2026, 1);
  });

  it('returns 404 when the iteration has no pdfUrl', async () => {
    const { getIteration } = await mocks();
    getIteration.mockResolvedValue({ ...row(2026, 1), pdfUrl: null });
    const res = await callGet(context({}));
    expect(res.status).toBe(404);
  });

  it('returns 404 when the blob is missing', async () => {
    const { getIteration, getStore } = await mocks();
    getIteration.mockResolvedValue(row(2026, 1, '2026/1.pdf'));
    stubStore(getStore, null);
    const res = await callGet(context({}));
    expect(res.status).toBe(404);
  });

  it('streams the PDF inline with private, no-store caching', async () => {
    const { getIteration, getStore } = await mocks();
    getIteration.mockResolvedValue(row(2026, 1, '2026/1.pdf'));
    const get = stubStore(getStore, streamOf(PDF_BYTES));

    const res = await callGet(context({ role: 'auditor' }));

    expect(getStore).toHaveBeenCalledWith('plocos-books');
    expect(get).toHaveBeenCalledWith('2026/1.pdf', { type: 'stream' });
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/pdf');
    expect(res.headers.get('Content-Disposition')).toBe(
      'inline; filename="nomas-que-la-vida-2026-1.pdf"',
    );
    expect(res.headers.get('Cache-Control')).toBe('private, no-store');
    expect(res.body).toBeInstanceOf(ReadableStream);
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(PDF_BYTES);
  });
});

describe('T14a — dev seed route validation', () => {
  async function parse(input: unknown) {
    const { parseSeedInput } = await import('../src/pages/api/dev/seed-book');
    return parseSeedInput(input);
  }

  it('accepts a bare filename and a year/cycle key', async () => {
    expect(await parse({ file: 'aprendiendo-git.pdf', key: '2026/1.pdf' })).toEqual({
      file: 'aprendiendo-git.pdf',
      key: '2026/1.pdf',
    });
  });

  it.each([
    [{ file: '../x.pdf', key: '2026/1.pdf' }],
    [{ file: '..', key: '2026/1.pdf' }],
    [{ file: 'sub/x.pdf', key: '2026/1.pdf' }],
    [{ file: 'sub\\x.pdf', key: '2026/1.pdf' }],
    [{ file: '', key: '2026/1.pdf' }],
    [{ file: 'x.pdf', key: '26/1.pdf' }],
    [{ file: 'x.pdf', key: '2026/1.txt' }],
    [{ file: 'x.pdf', key: '../2026/1.pdf' }],
    [{ file: 'x.pdf' }],
    [null],
  ])('rejects %j', async (input) => {
    expect(await parse(input)).toBeNull();
  });
});
