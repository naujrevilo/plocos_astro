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

function cleanSummary(summary) {
  if (!summary) return summary;
  
  // Remove escaped quotes and normalize
  let cleaned = summary
    .replace(/\\"/g, '"')  // Remove escape sequences
    .replace(/\s+/g, ' ')  // Normalize whitespace
    .trim();
  
  // If it has internal quotes, use single quotes for outer
  if (cleaned.includes('"')) {
    // Escape any single quotes that might exist
    cleaned = cleaned.replace(/'/g, "\\'");
    return `'${cleaned}'`;
  }
  
  return `"${cleaned}"`;
}

async function processFile(filePath) {
  const raw = await readFile(filePath, 'utf8');
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    return false;
  }

  let frontmatter = match[1];
  const body = match[2];
  
  // Fix summary field
  const summaryMatch = frontmatter.match(/^summary:\s*(.+?)$/m);
  if (summaryMatch) {
    const oldSummary = summaryMatch[1];
    let summaryValue = oldSummary;
    
    // Remove outer quotes if present
    if ((summaryValue.startsWith('"') && summaryValue.endsWith('"')) ||
        (summaryValue.startsWith("'") && summaryValue.endsWith("'"))) {
      summaryValue = summaryValue.slice(1, -1);
    }
    
    const newSummary = cleanSummary(summaryValue);
    
    if (oldSummary !== newSummary) {
      frontmatter = frontmatter.replace(
        /^summary:\s*.+$/m,
        `summary: ${newSummary}`
      );
      
      const output = `---\n${frontmatter}\n---\n${body}`;
      await writeFile(filePath, output, 'utf8');
      console.log(`✓ ${path.basename(filePath)}`);
      return true;
    }
  }
  
  return false;
}

async function run() {
  const files = await getMarkdownFiles(POSTS_ROOT);
  let count = 0;
  
  for (const file of files) {
    try {
      if (await processFile(file)) {
        count++;
      }
    } catch (error) {
      console.error(`✗ ${path.basename(file)}: ${error.message}`);
    }
  }
  
  console.log(`\n${count} summaries cleaned`);
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
