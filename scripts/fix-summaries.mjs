import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const POSTS_ROOT = path.resolve('src/content/posts');

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

async function fixSummary(filePath) {
  const raw = await readFile(filePath, 'utf8');
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return;

  let [, frontmatter, body] = match;

  // Normalize empty or null summaries to empty string
  frontmatter = frontmatter
    // summary: null -> summary: ""
    .replace(/^summary:\s*null\s*$/gim, 'summary: ""')
    // summary: (empty) -> summary: ""
    .replace(/^summary:\s*$/gim, 'summary: ""');

  // Fix multiline summary values
  frontmatter = frontmatter.replace(
    /^summary:\s*(['"]?)([^\n]+(?:\n\s+[^\n]+)*)\1$/gm,
    (_, _quote, value) => {
      const cleaned = value
        .split('\n')
        .map(line => line.trim())
        .join(' ')
        .replace(/\s+/g, ' ')
        .replace(/"+$/g, '') // Remove trailing quotes
        .trim()
        .replace(/"/g, '\\"'); // Escape internal quotes
      return `summary: "${cleaned}"`;
    }
  );

  const output = `---\n${frontmatter}\n---\n${body}`;
  if (output !== raw) {
    await writeFile(filePath, output, 'utf8');
    console.log(`Fixed: ${filePath}`);
  }
}

async function run() {
  const files = await getMarkdownFiles(POSTS_ROOT);
  for (const file of files) {
    try {
      await fixSummary(file);
    } catch (error) {
      console.error(`Error fixing ${file}:`, error.message);
    }
  }
}

run().catch(console.error);
