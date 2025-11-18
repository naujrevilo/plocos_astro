import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';

const ROOT = path.resolve('src/content/posts');

async function allMarkdown(dir){
  const entries = await readdir(dir, { withFileTypes: true });
  const files=[];
  for(const e of entries){
    const full=path.join(dir, e.name);
    if(e.isDirectory()) files.push(...await allMarkdown(full));
    else if(e.isFile() && e.name.endsWith('.md')) files.push(full);
  }
  return files;
}

function sanitizeSummary(summary){
  if(summary == null) return '';
  let s = String(summary).trim();
  // Remove surrounding escaped quotes like \" ... \"
  s = s.replace(/^\\"/, '"').replace(/\\"$/,'"');
  // Remove leading and trailing raw quotes duplicated
  s = s.replace(/^"\"+/, '"').replace(/\"+"$/,'"');
  // Collapse whitespace
  s = s.replace(/\s+/g,' ').trim();
  // Remove trailing unmatched escape sequences
  s = s.replace(/\\$/,'');
  // If it starts and ends with the same single quote and contains internal quotes, drop outer single quotes
  if(/^'[^']*'$/.test(s) && s.includes('"')) s = s.slice(1,-1);
  // Ensure we don't leave lingering escaped quotes
  s = s.replace(/\\"/g,'"');
  // Replace fancy quotes we commonly used with plain equivalents (optional)
  // but keep them if already balanced.
  return s;
}

async function processFile(file){
  const raw = await readFile(file,'utf8');
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/);
  if(!fmMatch) return;
  try {
    const parsed = matter(raw);
    let changed = false;
    // Check summary problems by heuristic
    let summary = parsed.data.summary;
    const original = summary;
    summary = sanitizeSummary(summary);
    // Very long or contains unbalanced quotes -> rewrap
    const doubleQuotes = (summary.match(/"/g)||[]).length;
    if(doubleQuotes %2 ===1){
      // remove stray quotes
      summary = summary.replace(/"/g,'');
    }
    // Remove starting and ending fancy quotes duplicates
    summary = summary.replace(/^“(.*)”$/,'$1').trim();
    // Truncate extremely long (> 300 chars) to 300 preserving whole words
    if(summary.length>300){
      summary = summary.slice(0,300).replace(/\s+\S*$/,'') + '…';
    }
    if(original !== summary){
      parsed.data.summary = summary;
      changed = true;
    }
    // Ensure body separator exists after frontmatter block
    if(!/^---\n/.test(raw) || !/\n---\n/.test(raw)){ /* skip */ }
    if(changed){
      const newRaw = matter.stringify(parsed.content, parsed.data);
      await writeFile(file,newRaw,'utf8');
      console.log('Sanitized:', file);
    }
  } catch (e){
    // Fallback: try simplistic regex replacement on summary line
  const fixed = raw.replace(/^(summary:)(.*)$/m, (_match,p,rest)=>{
      let inner = rest.trim();
      inner = inner.replace(/^['"]+/,'').replace(/['"]+$/,'').replace(/\\"/g,'"');
      inner = inner.replace(/\s+/g,' ').slice(0,300);
      return `${p} "${inner}"`;
    });
    if(fixed !== raw){
      await writeFile(file,fixed,'utf8');
      console.log('Fallback sanitized:', file);
    }
  }
}

(async ()=>{
  const files = await allMarkdown(ROOT);
  for(const f of files){
    await processFile(f);
  }
})();
