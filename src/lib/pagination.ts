/**
 * @module pagination
 * @description Proporciona una función de utilidad para paginar una lista de elementos.
 * Se utiliza para dividir grandes conjuntos de datos en páginas más pequeñas y manejables.
 */

/**
 * @interface PaginationResult
 * @description Define la estructura del objeto de resultado de la paginación.
 * @template T - El tipo de los elementos en la lista paginada.
 */
export interface PaginationResult<T> {
  /** @type {T[]} - Los elementos de la página actual. */
  pageItems: T[];
  /** @type {number} - El número total de elementos en todas las páginas. */
  totalItems: number;
  /** @type {number} - El número total de páginas. */
  totalPages: number;
  /** @type {number} - El número de elementos por página. */
  pageSize: number;
  /** @type {number} - El número de la página actual. */
  currentPage: number;
  /** @type {boolean} - Indica si la página solicitada es válida. */
  isPageValid: boolean;
}

/**
 * Sanitiza un número de página para asegurar que sea un entero válido.
 * Si el número no es finito o es NaN, devuelve 1.
 * @param {number} page - El número de página a sanitizar.
 * @returns {number} El número de página sanitizado.
 */
function sanitizePage(page: number): number {
  if (!Number.isFinite(page)) {
    return 1;
  }

  const truncated = Math.trunc(page);
  return Number.isNaN(truncated) ? 1 : truncated;
}

/**
 * Pagina una lista de elementos.
 * @template T - El tipo de los elementos en la lista.
 * @param {T[]} items - La lista de elementos a paginar.
 * @param {number} page - El número de página solicitado.
 * @param {number} pageSize - El número de elementos por página.
 * @returns {PaginationResult<T>} Un objeto con los resultados de la paginación.
 */
export function paginate<T>(items: T[], page: number, pageSize: number): PaginationResult<T> {
  const effectivePageSize = Math.max(1, Math.trunc(pageSize) || 1);
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / effectivePageSize));
  const requestedPage = sanitizePage(page);
  const currentPage = Math.min(Math.max(requestedPage, 1), totalPages);
  const startIndex = (currentPage - 1) * effectivePageSize;
  const pageItems = items.slice(startIndex, startIndex + effectivePageSize);
  const isPageValid = requestedPage >= 1 && requestedPage <= totalPages;

  return {
    pageItems,
    totalItems,
    totalPages,
    pageSize: effectivePageSize,
    currentPage,
    isPageValid,
  };
}
