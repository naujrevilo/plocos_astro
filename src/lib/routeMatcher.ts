/**
 * @module lib/routeMatcher
 * @description Tiny route-pattern matcher for the Clerk middleware.
 *
 * Why this exists: the @clerk/nextjs/server package exposes
 * `createRouteMatcher`, but @clerk/astro does NOT. Rather than reaching
 * into @clerk/shared (where the matcher lives but is deprecated and may
 * disappear), we keep a minimal implementation locally. The patterns
 * follow the same `(.*)` wildcard convention as the Next.js helper.
 *
 * Semantics:
 *   - '/'              → exact match for the root path
 *   - '/foo'           → exact match for '/foo'
 *   - '/foo(.*)'       → match '/foo' AND '/foo/anything-else'
 *   - '/foo/:lang'     → exact match for '/foo/:lang' (literal colon)
 *
 * Anything else (regex, param objects, etc.) is not supported on purpose.
 * If we need richer matching later, swap this module out — the call
 * sites only depend on the `(pathname: string) => boolean` shape.
 */

export type RoutePattern = string;
export type RouteMatcher = (pathname: string) => boolean;

/**
 * Build a matcher that returns true if `pathname` matches any of the
 * supplied patterns.
 */
export function createRouteMatcher(
  patterns: RoutePattern[],
): RouteMatcher {
  const compiled = patterns.map((pattern) => compile(pattern));
  return (pathname: string): boolean => {
    const normalised = normalisePathname(pathname);
    return compiled.some((re) => re.test(normalised));
  };
}

/**
 * Compile a single pattern into a RegExp. Public so the matcher can be
 * unit-tested without spinning up Astro.
 */
export function compile(pattern: string): RegExp {
  // Escape regex metacharacters except for the `(.*)` wildcard we
  // explicitly support. We translate `(.*)` first to a sentinel so the
  // escape pass leaves it alone.
  const WILDCARD = '\u0000WILDCARD\u0000';
  let working = pattern.replace(/\(\.\*\)/g, WILDCARD);

  // Escape regex metacharacters.
  working = working.replace(/[\\^$+?.|{}[\]]/g, '\\$&');

  // Restore the wildcard as `.*` and anchor the whole pattern.
  working = working.replace(new RegExp(WILDCARD, 'g'), '.*');

  return new RegExp(`^${working}$`);
}

/**
 * Strip query string / hash, collapse repeated slashes, drop the trailing
 * slash (except for the bare '/').
 */
function normalisePathname(pathname: string): string {
  let p = pathname;
  const q = p.indexOf('?');
  if (q !== -1) p = p.slice(0, q);
  const h = p.indexOf('#');
  if (h !== -1) p = p.slice(0, h);
  p = p.replace(/\/{2,}/g, '/');
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  return p;
}