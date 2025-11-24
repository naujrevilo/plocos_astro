/**
 * @module routes
 * @description Proporciona funciones de utilidad para la gestión de rutas, especialmente para la localización.
 * Se utiliza para crear URLs localizadas y manejar las barras diagonales (slashes) en las rutas.
 */

import { getRelativeLocaleUrl } from 'astro:i18n';
import { defaultLocale, type Locale } from './i18n';

/**
 * Asegura que una ruta termine con una barra diagonal.
 * @param {string} value - La ruta a procesar.
 * @returns {string} La ruta con una barra diagonal al final.
 */
const ensureTrailingSlash = (value: string) => {
  if (value === '/') {
    return '/';
  }
  return value.endsWith('/') ? value : `${value}/`;
};

/**
 * Elimina las barras diagonales al principio y al final de una ruta.
 * @param {string} value - La ruta a procesar.
 * @returns {string} La ruta sin barras diagonales al principio o al final.
 */
const stripSlashes = (value: string) => value.replace(/^\/+/, '').replace(/\/+$/, '');

/**
 * Crea una URL localizada para una ruta, anteponiendo el prefijo del idioma si no es el idioma por defecto.
 * También se asegura de que la URL tenga el formato correcto con respecto a las barras diagonales.
 * @param {Locale} locale - El idioma de destino.
 * @param {string} [path=''] - La ruta a localizar.
 * @returns {string} La URL localizada.
 */
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
