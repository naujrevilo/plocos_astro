import { getCollection, type CollectionEntry } from 'astro:content';
import { labelToSlug } from './taxonomy';
import type { PostEntry } from './posts';

export type CategoryEntry = CollectionEntry<'categories'>;

export async function getCategories(): Promise<CategoryEntry[]> {
  const categories = await getCollection('categories');
  return categories.sort((a, b) => a.data.title.localeCompare(b.data.title));
}

export function getCategorySlug(category: CategoryEntry): string {
  return category.slug;
}

export function filterPostsByCategory(category: CategoryEntry, posts: PostEntry[]): PostEntry[] {
  if (!category.data.labels || category.data.labels.length === 0) {
    return posts;
  }

  const labelSlugs = new Set(category.data.labels.map((label) => labelToSlug(label)));
  return posts.filter((post) => {
    const postLabels = post.data.labels ?? [];
    return postLabels.some((label) => labelSlugs.has(labelToSlug(label)));
  });
}
