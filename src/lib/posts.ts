import { getCollection, type CollectionEntry } from 'astro:content';
import { defaultLocale, type Locale } from './i18n';

export type PostEntry = CollectionEntry<'posts'>;

interface GetPostsOptions {
  locale?: Locale;
  includeDrafts?: boolean;
}

export async function getPublishedPosts(options: GetPostsOptions = {}): Promise<PostEntry[]> {
  const { locale, includeDrafts = false } = options;
  const posts = await getCollection('posts', (entry: PostEntry) => {
    if (!includeDrafts && entry.data.draft) {
      return false;
    }
    if (locale && entry.data.language !== locale) {
      return false;
    }
    return true;
  });
  return posts.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}

const localeMap: Record<Locale, string> = {
  es: 'es-CO',
  en: 'en-US',
};

export function getPostLocale(post: PostEntry): Locale {
  return (post.data.language ?? defaultLocale) as Locale;
}

export function formatDate(date: Date, locale: Locale = defaultLocale): string {
  const formatterLocale = localeMap[locale] ?? localeMap[defaultLocale];
  return new Intl.DateTimeFormat(formatterLocale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function groupPostsByLabel(posts: PostEntry[]) {
  const labelMap = new Map<string, { label: string; count: number }>();

  for (const post of posts) {
    for (const label of post.data.labels ?? []) {
      if (!labelMap.has(label)) {
        labelMap.set(label, { label, count: 0 });
      }
      labelMap.get(label)!.count += 1;
    }
  }

  return Array.from(labelMap.values()).sort((a, b) => a.label.localeCompare(b.label));
}
