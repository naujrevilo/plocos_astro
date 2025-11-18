import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';

const FEED_URL = 'https://www.plocos.com/feeds/posts/default?alt=json&max-results=500';
const ROOT = resolve('src/content/posts');

function slugFromUrl(urlString) {
  try {
    const url = new URL(urlString);
    const segments = url.pathname.split('/').filter(Boolean);
    if (!segments.length) {
      return { slug: url.hostname.replace(/[^a-z0-9-]+/gi, '-'), year: null };
    }
    const last = segments[segments.length - 1].replace(/\.html?$/i, '');
    const year = segments.find((segment) => /^\d{4}$/.test(segment)) ?? null;
    const clean = last
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();
    return { slug: clean || 'post', year };
  } catch {
    return { slug: null, year: null };
  }
}

function walk(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(full));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      results.push(full);
    }
  }
  return results;
}

async function fetchFeedMap() {
  const response = await fetch(FEED_URL);
  if (!response.ok) {
    throw new Error(`No se pudo obtener el feed (${response.status})`);
  }
  const json = await response.json();
  const entries = json?.feed?.entry ?? [];
  const map = new Map();
  for (const entry of entries) {
    const link = entry?.link?.find?.((l) => l.rel === 'alternate')?.href;
    const { slug, year } = slugFromUrl(link ?? '');
    if (!slug || !year) continue;
    const publishedRaw = entry?.published?.$t ?? entry?.updated?.$t;
    if (!publishedRaw) continue;
    const published = new Date(publishedRaw);
    if (Number.isNaN(published.getTime())) continue;
    const key = `${year}/${slug}`;
    map.set(key, published.toISOString());
  }
  return map;
}

function updateFrontmatter(content, newDateIso) {
  return content.replace(/^(---[\s\S]*?\n)pubDate:\s*.*$/m, (_, start) => `${start}pubDate: ${newDateIso}`);
}

async function run() {
  const feedMap = await fetchFeedMap();
  console.log(`Entradas en feed: ${feedMap.size}`);
  const files = walk(ROOT);
  let updatedCount = 0;
  const missing = [];
  for (const file of files) {
    const rel = relative(ROOT, file).replace(/\\/g, '/');
  const key = rel.replace(/\.md$/, '');
    const expected = feedMap.get(key);
    if (!expected) {
      missing.push(rel);
      continue;
    }
    const raw = readFileSync(file, 'utf8');
    const match = raw.match(/^---\n([\s\S]*?)\n---/);
    if (!match) continue;
    const frontmatter = match[1];
    const currentMatch = frontmatter.match(/^pubDate:\s*(.+)$/m);
    const current = currentMatch ? currentMatch[1].trim() : null;
    if (current === expected) continue;
    const newContent = updateFrontmatter(raw, expected);
    if (newContent !== raw) {
      writeFileSync(file, newContent, 'utf8');
      updatedCount += 1;
      console.log(`✔ Actualizado ${rel} -> ${expected}`);
    }
  }
  console.log(`Total archivos actualizados: ${updatedCount}`);
  if (missing.length) {
    console.warn('No se encontró correspondencia en el feed para:');
    for (const item of missing) {
      console.warn(`  - ${item}`);
    }
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
