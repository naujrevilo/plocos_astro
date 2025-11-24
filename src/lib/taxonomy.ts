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
