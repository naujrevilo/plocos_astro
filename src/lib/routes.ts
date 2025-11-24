import { getRelativeLocaleUrl } from 'astro:i18n';
import { defaultLocale, type Locale } from './i18n';

const ensureTrailingSlash = (value: string) => {
  if (value === '/') {
    return '/';
  }
  return value.endsWith('/') ? value : `${value}/`;
};

const stripSlashes = (value: string) => value.replace(/^\/+/, '').replace(/\/+$/, '');

export function createLocaleHref(locale: Locale, path = ''): string {
  const cleanedPath = stripSlashes(path);
  const raw = cleanedPath ? getRelativeLocaleUrl(locale, cleanedPath) : getRelativeLocaleUrl(locale);
  const withSlash = ensureTrailingSlash(raw || '/');
  if (locale !== defaultLocale) {
    return withSlash;
  }
  const pattern = new RegExp(`^/${defaultLocale}(?=/|$)`);
  const normalized = withSlash.replace(pattern, '') || '/';
  return normalized === '' ? '/' : normalized;
}
