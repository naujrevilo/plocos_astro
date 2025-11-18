import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';

const FEED_URL = 'https://www.plocos.com/feeds/posts/default?alt=json&max-results=500';
const ROOT = resolve('src/content/posts');

const sanitize = (input) =>
  input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();

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
    if (!link) continue;
    const match = link.match(/https?:\/\/[^/]+\/(\d{4})\/(\d{2})\/([^/]+)\.html/);
    if (!match) continue;
    const [, year, month, slug] = match;
    const publishedRaw = entry?.published?.$t;
    const published = publishedRaw ? new Date(publishedRaw) : null;
    if (!published || Number.isNaN(published.getTime())) continue;
    map.set(`${year}/${sanitize(slug)}`, {
      originalYear: Number(year),
      originalMonth: Number(month),
      published,
    });
  }
  return map;
}

function updatePubDate(content, isoString) {
  return content.replace(/^(pubDate:\s*).+$/m, `$1${isoString}`);
}

async function run() {
  const feedMap = await fetchFeedMap();
  const files = walk(ROOT);
  let updated = 0;
  const missing = [];

  for (const file of files) {
    const rel = relative(ROOT, file).replace(/\\/g, '/');
    const currentYear = Number(rel.split('/')[0]);
    const slug = rel.replace(/\.md$/, '');
    const feedEntry = feedMap.get(slug);
    if (!feedEntry) {
      missing.push(rel);
      continue;
    }
    if (currentYear >= 2025) {
      continue;
    }
    const raw = readFileSync(file, 'utf8');
    const match = raw.match(/^pubDate:\s*(.+)$/m);
    if (!match) continue;
    const currentDate = new Date(match[1].trim());
    if (!Number.isNaN(currentDate.getTime()) && currentDate.getUTCFullYear() <= feedEntry.originalYear) {
      // Ya está alineado o es anterior
      continue;
    }
    const { originalYear, originalMonth, published } = feedEntry;
    const target = new Date(Date.UTC(originalYear, originalMonth - 1, published.getUTCDate(), published.getUTCHours(), published.getUTCMinutes(), published.getUTCSeconds(), published.getUTCMilliseconds()));
    const iso = target.toISOString();
    const nextContent = updatePubDate(raw, iso);
    if (nextContent !== raw) {
      writeFileSync(file, nextContent, 'utf8');
      updated += 1;
      console.log(`✔ ${rel} -> ${iso}`);
    }
  }

  console.log(`Total actualizados: ${updated}`);
  if (missing.length) {
    console.warn('Sin correspondencia en feed:');
    for (const item of missing) {
      console.warn(`  - ${item}`);
    }
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
