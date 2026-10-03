import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(__dirname, '..');

function repoPath(relativePath: string): string {
  return path.join(repoRoot, relativePath);
}

function listSourceFiles(root: string): string[] {
  const collected: string[] = [];
  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop() as string;
    let entries: string[];
    try {
      entries = readdirSync(current);
    } catch {
      continue;
    }
    for (const entry of entries) {
      const full = path.join(current, entry);
      let stat;
      try {
        stat = statSync(full);
      } catch {
        continue;
      }
      if (stat.isDirectory()) {
        stack.push(full);
        continue;
      }
      if (stat.isFile()) {
        const ext = path.extname(full).toLowerCase();
        if (
          ext === '.astro' ||
          ext === '.ts' ||
          ext === '.tsx' ||
          ext === '.js' ||
          ext === '.jsx' ||
          ext === '.vue' ||
          ext === '.mjs'
        ) {
          collected.push(full);
        }
      }
    }
  }
  return collected;
}

describe('T01 — Remove legacy routes and historical content', () => {
  it('removes src/pages/blog/index.astro', () => {
    expect(existsSync(repoPath('src/pages/blog/index.astro'))).toBe(false);
  });

  it('removes src/pages/admin/index.astro', () => {
    expect(existsSync(repoPath('src/pages/admin/index.astro'))).toBe(false);
  });

  it('empties src/content/posts/', () => {
    const postsPath = repoPath('src/content/posts');
    const exists = existsSync(postsPath);
    if (exists) {
      const entries = readdirSync(postsPath);
      expect(entries.length).toBe(0);
    } else {
      expect(exists).toBe(false);
    }
  });

  it('keeps only nomas-que-la-vida.md under src/content/categories/', () => {
    const entries = readdirSync(repoPath('src/content/categories'));
    expect(entries).toEqual(['nomas-que-la-vida.md']);
  });

  it('removes src/components/Search.vue', () => {
    expect(existsSync(repoPath('src/components/Search.vue'))).toBe(false);
  });

  it('removes src/components/CommentSection.astro', () => {
    expect(existsSync(repoPath('src/components/CommentSection.astro'))).toBe(false);
  });

  it('removes src/components/admin directory', () => {
    expect(existsSync(repoPath('src/components/admin'))).toBe(false);
  });

  it('removes src/lib/categories.ts', () => {
    expect(existsSync(repoPath('src/lib/categories.ts'))).toBe(false);
  });

  it('removes src/lib/algoliasearch.js', () => {
    expect(existsSync(repoPath('src/lib/algoliasearch.js'))).toBe(false);
  });

  it('drops algoliasearch dependency from package.json', () => {
    const pkg = JSON.parse(readFileSync(repoPath('package.json'), 'utf8')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const allDeps = {
      ...(pkg.dependencies ?? {}),
      ...(pkg.devDependencies ?? {}),
    };
    expect('algoliasearch' in allDeps).toBe(false);
  });

  it('removes every reference to getCollection(\'posts\') under src/', () => {
    const srcRoot = repoPath('src');
    const offenders: string[] = [];
    for (const file of listSourceFiles(srcRoot)) {
      const content = readFileSync(file, 'utf8');
      if (/getCollection\(['"]posts['"]\)/.test(content)) {
        offenders.push(path.relative(repoRoot, file));
      }
    }
    expect(offenders).toEqual([]);
  });
});