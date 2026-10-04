/**
 * Dev-only blob seeder — `src/pages/api/dev/seed-book.ts` (T14a)
 *
 * Uploads a PDF from `private/books/` (gitignored) to the local Netlify Blobs
 * store so the protected PDF endpoint can be tried under `astro dev`.
 * Returns 404 outside dev; production uploads use `netlify blobs:set`.
 *
 *   POST { "file": "aprendiendo-git.pdf", "key": "2026/1.pdf" }
 */
import type { APIRoute } from 'astro';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { getStore } from '@netlify/blobs';
import { BOOKS_STORE } from '../../../lib/books';

const BOOKS_DIR = path.resolve('private', 'books');
const KEY_PATTERN = /^\d{4}\/\d+\.pdf$/;

export interface SeedInput {
  file: string;
  key: string;
}

/** Validate the request body: bare filename only, `YYYY/N.pdf` key. */
export function parseSeedInput(input: unknown): SeedInput | null {
  if (!input || typeof input !== 'object') return null;
  const { file, key } = input as { file?: unknown; key?: unknown };
  if (typeof file !== 'string' || typeof key !== 'string') return null;
  if (!file || file.includes('..') || /[\\/]/.test(file)) return null;
  if (!KEY_PATTERN.test(key)) return null;
  return { file, key };
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const POST: APIRoute = async ({ request }) => {
  if (!import.meta.env.DEV) return new Response('Not found', { status: 404 });

  const input = parseSeedInput(await request.json().catch(() => null));
  if (!input) return json({ error: 'Expected { file: "<name>.pdf", key: "YYYY/N.pdf" }' }, 400);

  const bytes = await readFile(path.join(BOOKS_DIR, input.file));
  const data = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  await getStore(BOOKS_STORE).set(input.key, data);

  return json({ key: input.key, bytes: bytes.byteLength });
};
