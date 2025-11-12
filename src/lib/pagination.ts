export interface PaginationResult<T> {
  pageItems: T[];
  totalItems: number;
  totalPages: number;
  pageSize: number;
  currentPage: number;
  isPageValid: boolean;
}

function sanitizePage(page: number): number {
  if (!Number.isFinite(page)) {
    return 1;
  }

  const truncated = Math.trunc(page);
  return Number.isNaN(truncated) ? 1 : truncated;
}

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
