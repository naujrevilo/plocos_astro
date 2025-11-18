import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('src/content/posts');

const datePattern = /^pubDate:\s*(.+)$/m;
const updatedPattern = /^updatedDate:\s*(.+)$/m;

function walk(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      results.push(fullPath);
    }
  }
  return results;
}

function parseDate(value) {
  const cleaned = value.trim().replace(/^['"]|['"]$/g, '');
  const date = new Date(cleaned);
  return Number.isNaN(date.getTime()) ? null : date;
}

const files = walk(ROOT);
const problems = [];
const stats = files.map((file) => {
  const raw = readFileSync(file, 'utf8');
  const pubMatch = raw.match(datePattern);
  if (!pubMatch) {
    problems.push({ file, type: 'missing pubDate' });
    return null;
  }
  const pubDate = parseDate(pubMatch[1]);
  if (!pubDate) {
    problems.push({ file, type: 'invalid pubDate', value: pubMatch[1].trim() });
  }
  const updatedMatch = raw.match(updatedPattern);
  const updatedDate = updatedMatch ? parseDate(updatedMatch[1]) : null;
  if (updatedMatch && !updatedDate) {
    problems.push({ file, type: 'invalid updatedDate', value: updatedMatch[1].trim() });
  }
  return {
    file: path.relative(ROOT, file),
    pubDate,
    hasUpdatedDate: Boolean(updatedDate),
  };
}).filter(Boolean);

stats.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

console.log(`Total posts: ${stats.length}`);
console.log('Más recientes (pubDate descendente):');
for (const entry of stats.slice(0, 10)) {
  console.log(`  ${entry.file} -> ${entry.pubDate.toISOString()}`);
}

if (problems.length > 0) {
  console.log('\nProblemas detectados:');
  for (const issue of problems) {
    console.log(`  ${issue.type} en ${path.relative(ROOT, issue.file)}${issue.value ? ` (${issue.value})` : ''}`);
  }
  process.exitCode = 1;
}
