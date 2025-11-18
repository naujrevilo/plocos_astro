// Genera un slug solo a partir del título
function slugifyTitle(title) {
  return title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const POSTS_ROOT = path.resolve('src/content/posts');
const TARGET_OFFSET_MINUTES = -5 * 60; // UTC-05:00

async function getMarkdownFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await getMarkdownFiles(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  return files;
}

function stripOuterFormatting(value) {
  let result = value.trim();
  if (result.startsWith('_')) {
    result = result.slice(1).trim();
  }
  if (result.endsWith('_')) {
    result = result.slice(0, -1).trim();
  }
  return result;
}

function convertFootnotes(body) {
  let updated = body.replace(/\\\[/g, '[').replace(/\\\]/g, ']');

  const definitionPatterns = [
    /^_?\*\*\[(\d+)\]\*\*_?\s*(.*)$/gm,
    /^\[\[(\d+)\]\](?:\([^\)]+\))?\s*(.*)$/gm,
    /^\[(\d+)\]\s*(.*)$/gm,
  ];

  for (const pattern of definitionPatterns) {
    updated = updated.replace(pattern, (_, num, rest = '') => {
      const cleaned = stripOuterFormatting(rest ?? '');
      return cleaned ? `[^${num}]: ${cleaned}` : `[^${num}]:`;
    });
  }

  const referencePatterns = [
    /\[\*\*\[(\d+)\]\*\*\]\([^\)]+\)/g,
    /\[\[(\d+)\]\]\([^\)]+\)/g,
    /\*\*\[(\d+)\]\*\*/g,
  ];

  for (const pattern of referencePatterns) {
    updated = updated.replace(pattern, (_, num) => `[^${num}]`);
  }

  return updated;
}

function ensureLanguage(frontmatter) {
  const languagePattern = /^language:\s*(.+)$/m;
  if (languagePattern.test(frontmatter)) {
    return frontmatter.replace(languagePattern, 'language: es');
  }

  const updatedIndex = frontmatter.search(/^updatedDate:.*$/m);
  if (updatedIndex !== -1) {
    return frontmatter.replace(/^(updatedDate:.*)$/m, '$1\nlanguage: es');
  }

  const pubIndex = frontmatter.search(/^pubDate:.*$/m);
  if (pubIndex !== -1) {
    return frontmatter.replace(/^(pubDate:.*)$/m, '$1\nlanguage: es');
  }

  const titleIndex = frontmatter.search(/^title:.*$/m);
  if (titleIndex !== -1) {
    return frontmatter.replace(/^(title:.*)$/m, '$1\nlanguage: es');
  }

  return `language: es\n${frontmatter}`;
}

function clearOriginalUrl(frontmatter) {
  return frontmatter
    .replace(/\noriginalUrl:\s*"[^"]*"/g, '')
    .replace(/\noriginalUrl:\s*'[^']*'/g, '')
    .replace(/\noriginalUrl:\s*[^\n]+/g, '');
}

function removeAuthorLabel(frontmatter) {
  let updated = frontmatter
    .replace(/\n\s*-\s*"Michel Saer(?: \(MSD\))?"/g, '')
    .replace(/\n\s*-\s*'Michel Saer(?: \(MSD\))?'/g, '')
    .replace(/\n\s*-\s*Michel Saer(?: \(MSD\))?(?=\s|$)/g, '')
    .replace(/\n\s*-\s*Michel\s+Saer\s*\(MSD\)(?=\s|$)/g, '')
    .replace(/\n\s*-\s*"michelsaer"/gi, '')
    .replace(/\n\s*-\s*'michelsaer'/gi, '')
    .replace(/\n\s*-\s*michelsaer(?=\s|$)/gi, '')
    .replace(/\n\s*-\s*"michel-saer"/gi, '')
    .replace(/\n\s*-\s*'michel-saer'/gi, '')
    .replace(/\n\s*-\s*michel-saer(?=\s|$)/gi, '');

  const labelsBlock = updated.match(/labels:\s*\n((?:\s*-\s*[^\n]+\n?)*)/);
  if (labelsBlock) {
    const blockContent = labelsBlock[1].trim();
    if (!blockContent) {
      updated = updated.replace(/labels:\s*\n((?:\s*-\s*[^\n]+\n?)*)/, 'labels: []\n');
    }
  }

  return updated;
}

function ensureAuthor(frontmatter) {
  const authorPattern = /^author:\s*(.+)$/m;
  if (authorPattern.test(frontmatter)) {
    return frontmatter.replace(authorPattern, 'author: "MSD"');
  }

  const labelsIndex = frontmatter.search(/^labels:\s*/m);
  if (labelsIndex !== -1) {
    return frontmatter.replace(/^(labels:\s*)/m, 'author: "MSD"\n$1');
  }

  const summaryIndex = frontmatter.search(/^summary:\s*/m);
  if (summaryIndex !== -1) {
    return frontmatter.replace(/^(summary:\s*)/m, 'author: "MSD"\n$1');
  }

  const languageIndex = frontmatter.search(/^language:\s*/m);
  if (languageIndex !== -1) {
    return frontmatter.replace(/^(language:\s*)/m, '$1\nauthor: "MSD"\n');
  }

  const pubIndex = frontmatter.search(/^pubDate:\s*/m);
  if (pubIndex !== -1) {
    return frontmatter.replace(/^(pubDate:\s*.*)$/m, '$1\nauthor: "MSD"');
  }

  const titleIndex = frontmatter.search(/^title:\s*/m);
  if (titleIndex !== -1) {
    return frontmatter.replace(/^(title:\s*.*)$/m, '$1\nauthor: "MSD"');
  }

  return `author: "MSD"\n${frontmatter}`;
}

function pad(number, length = 2) {
  return number.toString().padStart(length, '0');
}

function formatOffset(minutes) {
  const sign = minutes >= 0 ? '+' : '-';
  const absMinutes = Math.abs(minutes);
  const hours = pad(Math.floor(absMinutes / 60));
  const mins = pad(absMinutes % 60);
  return `${sign}${hours}:${mins}`;
}

function formatDateWithOffset(date, offsetMinutes) {
  const offsetMillis = offsetMinutes * 60_000;
  const shifted = new Date(date.getTime() + offsetMillis);
  const year = shifted.getUTCFullYear();
  const month = pad(shifted.getUTCMonth() + 1);
  const day = pad(shifted.getUTCDate());
  const hours = pad(shifted.getUTCHours());
  const minutes = pad(shifted.getUTCMinutes());
  const seconds = pad(shifted.getUTCSeconds());
  const millis = shifted.getUTCMilliseconds();

  const base = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  const frac = millis ? `.${pad(millis, 3)}` : '';
  return `${base}${frac}${formatOffset(offsetMinutes)}`;
}

function normalizeDateLine(frontmatter, field) {
  const pattern = new RegExp(`^${field}:\s*(.+)$`, 'm');
  const match = frontmatter.match(pattern);
  if (!match) {
    return frontmatter;
  }

  const rawValue = match[1].trim();
  const unquoted = rawValue.replace(/^['"]|['"]$/g, '');
  const parsed = new Date(unquoted);

  if (Number.isNaN(parsed.getTime())) {
    return frontmatter;
  }

  const formatted = formatDateWithOffset(parsed, TARGET_OFFSET_MINUTES);
  return frontmatter.replace(pattern, `${field}: ${formatted}`);
}

async function processFile(filePath) {
  const raw = await readFile(filePath, 'utf8');
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    return;
  }

  let frontmatter = match[1];
  let body = match[2];

  frontmatter = clearOriginalUrl(frontmatter);
  frontmatter = ensureLanguage(frontmatter);
  frontmatter = removeAuthorLabel(frontmatter);
  frontmatter = ensureAuthor(frontmatter);
  frontmatter = normalizeDateLine(frontmatter, 'pubDate');
  frontmatter = normalizeDateLine(frontmatter, 'updatedDate');
  body = convertFootnotes(body);

  const cleanedFrontmatter = frontmatter
    .split('\n')
    .filter((line, index, arr) => !(line.trim() === '' && arr[index - 1]?.trim() === ''))
    .join('\n')
    .trimEnd();

  const output = `---\n${cleanedFrontmatter}\n---\n${body}`;
  if (output !== raw) {
    await writeFile(filePath, output, 'utf8');
  }
}

async function run() {
  const files = await getMarkdownFiles(POSTS_ROOT);
  await Promise.all(files.map((file) => processFile(file)));
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
