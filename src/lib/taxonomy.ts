/**
 * @module taxonomy
 * @description Proporciona funciones de utilidad para la gestión de taxonomías, como la conversión entre etiquetas y slugs.
 */

/**
 * Convierte una etiqueta en un slug.
 * Normaliza la cadena, la convierte a minúsculas, reemplaza los caracteres no alfanuméricos con guiones y recorta los guiones de los extremos.
 * @param {string} label - La etiqueta a convertir.
 * @returns {string} El slug resultante.
 */
export function labelToSlug(label: string): string {
  return label
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .trim();
}

/**
 * Convierte un slug en una etiqueta.
 * Divide el slug por guiones, capitaliza la primera letra de cada palabra y las une con espacios.
 * @param {string} slug - El slug a convertir.
 * @param {string} [fallback] - Un valor de respaldo para devolver si el slug está vacío.
 * @returns {string} La etiqueta resultante.
 */
export function slugToLabel(slug: string, fallback?: string): string {
  if (!slug) {
    return fallback ?? '';
  }

  const words = slug
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1));

  const label = words.join(' ');
  return label || fallback || slug;
}
