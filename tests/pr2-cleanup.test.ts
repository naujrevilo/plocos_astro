/**
 * PR 2 audit cleanup — invariants for the post-pivot surface.
 *
 * Covers: locale-aware legal links in the footer, the Clerk public-route
 * allow-list (EN auth pages, no stale comments API), the sign-in redirect
 * target per locale, i18n path registry vs. real pages, removal of blog-era
 * i18n blocks, and deletion of Algolia / blog tooling leftovers.
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { createRouteMatcher, getSignInPath } from '../src/lib/routeMatcher';
import { translations, locales } from '../src/lib/i18n';

const ROOT = path.resolve(__dirname, '..');
const read = (rel: string) => readFileSync(path.join(ROOT, rel), 'utf8');
const exists = (rel: string) => existsSync(path.join(ROOT, rel));

function publicMatcherFromMiddleware() {
  const src = read('src/middleware.ts');
  const call = src.match(/createRouteMatcher\(\[([\s\S]*?)\]\)/);
  if (!call) throw new Error('createRouteMatcher([...]) call not found');
  const patterns = [...call[1].matchAll(/['"]([^'"]+)['"]/g)].map((m) => m[1]);
  return { patterns, isPublic: createRouteMatcher(patterns) };
}

function pageExists(locale: string, segment: string): boolean {
  const base = locale === 'es' ? 'src/pages' : `src/pages/${locale}`;
  if (!segment) return exists(`${base}/index.astro`);
  return exists(`${base}/${segment}.astro`) || exists(`${base}/${segment}/index.astro`);
}

describe('PR 2 cleanup — footer legal links', () => {
  it('does not hardcode the ES "terminos/" segment for sub-pages', () => {
    expect(read('src/components/SiteFooter.astro')).not.toMatch(/['"`]terminos\//);
  });

  it('every legal sub-page exists under the locale terms path', () => {
    for (const locale of locales) {
      const termsSeg = translations[locale].paths.terms;
      for (const sub of ['habeas-scriptum', 'auditoria', 'simbiosis-algoritmica']) {
        expect(pageExists(locale, `${termsSeg}/${sub}`), `${locale}:${termsSeg}/${sub}`).toBe(true);
      }
    }
  });
});

describe('PR 2 cleanup — middleware public routes', () => {
  const { patterns, isPublic } = publicMatcherFromMiddleware();

  it('treats EN sign-in / sign-up (and their sub-routes) as public', () => {
    expect(isPublic('/en/sign-in')).toBe(true);
    expect(isPublic('/en/sign-in/factor-one')).toBe(true);
    expect(isPublic('/en/sign-up')).toBe(true);
    expect(isPublic('/en/sign-up/verify-email-address')).toBe(true);
  });

  it('no longer lists the removed comments API', () => {
    expect(patterns.some((p) => p.includes('/api/comments'))).toBe(false);
    expect(read('src/middleware.ts')).not.toMatch(/api\/comments/);
  });

  it('keeps the account dashboards protected', () => {
    expect(isPublic('/cuenta')).toBe(false);
    expect(isPublic('/en/account')).toBe(false);
  });

  it('redirects to the sign-in page matching the request locale', () => {
    expect(getSignInPath('/cuenta')).toBe('/sign-in');
    expect(getSignInPath('/api/anything')).toBe('/sign-in');
    expect(getSignInPath('/en/account')).toBe('/en/sign-in');
    expect(getSignInPath('/en')).toBe('/en/sign-in');
    expect(getSignInPath('/english-page')).toBe('/sign-in');
    expect(read('src/middleware.ts')).toMatch(/getSignInPath\(/);
  });
});

describe('PR 2 cleanup — i18n registry', () => {
  it('registers the account page so the language switcher can map it', () => {
    expect(translations.es.paths).toHaveProperty('account', 'cuenta');
    expect(translations.en.paths).toHaveProperty('account', 'account');
  });

  it('every registered path resolves to a real page in each locale', () => {
    for (const locale of locales) {
      for (const [key, segment] of Object.entries(translations[locale].paths)) {
        expect(pageExists(locale, segment), `${locale}.paths.${key} -> ${segment}`).toBe(true);
      }
    }
  });

  it('navigation ids belong to the product sections', () => {
    const allowed = ['home', 'book', 'auditores', 'repositorio', 'contact'];
    for (const locale of locales) {
      for (const item of translations[locale].navigation) {
        expect(allowed).toContain(item.id);
      }
    }
  });

  it('drops blog-era translation blocks from both locales', () => {
    const removed = [
      'blog', 'about', 'categories', 'labelsList', 'labelsDetail', 'posts',
      'av', 'editor', 'search', 'home', 'contact',
    ];
    for (const locale of locales) {
      const t = translations[locale] as unknown as Record<string, unknown>;
      for (const key of removed) {
        expect(t, `${locale}.${key}`).not.toHaveProperty(key);
      }
      expect(translations[locale].footer).not.toHaveProperty('rss');
    }
  });

  it('describes the platform, not the old archive', () => {
    expect(translations.es.site.description).not.toMatch(/Colecci[oó]n digital de arte/i);
    expect(translations.en.site.description).not.toMatch(/Digital collection of Plocos/i);
    expect(translations.es.consent.description).not.toMatch(/archivo/);
    expect(translations.en.consent.description).not.toMatch(/archive/);
  });
});

describe('PR 2 cleanup — legacy files and tooling removed', () => {
  const removedFiles = [
    'src/pages/about/index.astro',
    'src/content/config.ts',
    'src/content.config.ts',
    'src/content/authors',
    'src/test.html',
    'public/public',
    'public/algolia.html',
    'public/api/posts.json',
    'scripts/algolia-sync.mjs',
    'docs/algolia-setup.md',
    'docs/guia-cliente-moderacion.md',
    'scripts/import-plocos.js',
    'scripts/flatten-posts.mjs',
    'scripts/generate-posts-json.mjs',
    'scripts/sanitize-frontmatter.mjs',
    'scripts/sync-post-pubdates.mjs',
    'scripts/recover-original-pubdates.mjs',
    'scripts/inspect-post-dates.mjs',
    'scripts/bulk-normalize-posts.mjs',
    'scripts/clean-summaries.mjs',
    'scripts/fix-summaries.mjs',
    'scripts/test-ts.ts',
  ];

  it.each(removedFiles)('removes %s', (rel) => {
    expect(exists(rel)).toBe(false);
  });

  it('drops blog npm scripts and unused dependencies', () => {
    const pkg = JSON.parse(read('package.json')) as {
      scripts: Record<string, string>;
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    for (const script of ['import:plocos', 'flatten:posts', 'flatten:posts:write']) {
      expect(pkg.scripts).not.toHaveProperty(script);
    }
    const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
    for (const dep of [
      '@astrojs/starlight-docsearch', 'all', 'remove-markdown', 'slugify', 'preact',
      'fs-extra', 'yup', 'ts-node', 'instantsearch.css', 'gray-matter', 'he', 'turndown',
    ]) {
      expect(deps, dep).not.toHaveProperty(dep);
    }
  });

  it('BaseLayout no longer loads Algolia CSS or Flowbite from node_modules', () => {
    const layout = read('src/layouts/BaseLayout.astro');
    expect(layout).not.toMatch(/instantsearch/);
    expect(layout).not.toMatch(/\/node_modules\//);
  });
});
