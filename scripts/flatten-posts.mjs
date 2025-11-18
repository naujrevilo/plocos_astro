// Flatten posts from year folders into a single folder src/content/posts
// Safe by default: dry-run unless --write is passed
// Usage:
//   node scripts/flatten-posts.mjs --dry   # default, preview changes
//   node scripts/flatten-posts.mjs --write # perform moves

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const ROOT = path.resolve('.');
const POSTS_DIR = path.join(ROOT, 'src', 'content', 'posts');

const args = new Set(process.argv.slice(2));
const WRITE = args.has('--write') || args.has('-w');

function walk(dir) {
  const out = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (e.isFile() && p.endsWith('.md')) out.push(p);
  }
  return out;
}

function slugify(str) {
  return (str || '')
    .toString()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // accents
    .replace(/[^a-zA-Z0-9\s-_]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

function ymd(dateStr) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  } catch { return null; }
}

function uniquePath(baseDir, filename) {
  let p = path.join(baseDir, filename);
  if (!fs.existsSync(p)) return p;
  const ext = path.extname(filename);
  const name = path.basename(filename, ext);
  let i = 2;
  while (true) {
    p = path.join(baseDir, `${name}-${i}${ext}`);
    if (!fs.existsSync(p)) return p;
    i++;
  }
}

function main() {
  const files = walk(POSTS_DIR).filter(p => path.dirname(p) !== POSTS_DIR);
  if (files.length === 0) {
    console.log('No se encontraron publicaciones en subcarpetas. Nada que hacer.');
    return;
  }
  console.log(`Encontrados ${files.length} archivos en subcarpetas.`);
  const plan = [];

  for (const file of files) {
    const raw = fs.readFileSync(file, 'utf8');
    const fm = matter(raw);
    const date = ymd(fm.data.pubDate) || path.basename(path.dirname(file));
    const titleSlug = slugify(fm.data.title || path.basename(file, '.md'));
    const baseName = date ? `${date}-${titleSlug}.md` : `${titleSlug}.md`;
    const target = uniquePath(POSTS_DIR, baseName);

    plan.push({ from: file, to: target, fm });
  }

  // Preview
  for (const { from, to } of plan) {
    console.log(`${path.relative(ROOT, from)} -> ${path.relative(ROOT, to)}`);
  }

  if (!WRITE) {
    console.log('\nModo prueba (dry-run). Usa --write para aplicar cambios.');
    return;
  }

  // Apply
  for (const { from, to, fm } of plan) {
    // ensure target dir exists
    fs.mkdirSync(path.dirname(to), { recursive: true });
    // annotate original path una sola vez
    if (!fm.data.originalPath) {
      fm.data.originalPath = path.relative(POSTS_DIR, from).replaceAll('\\', '/');
    }
    // write temp then move
    const tmp = to + '.tmp';
    fs.writeFileSync(tmp, matter.stringify(fm.content, fm.data), 'utf8');
    fs.renameSync(tmp, to);
    fs.rmSync(from);
  }
  console.log(`\nMovidos ${plan.length} archivos al directorio plano: src/content/posts`);
}

main();
