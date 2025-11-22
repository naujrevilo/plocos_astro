import { getCollection } from 'astro:content';
import type { Locale } from '../../lib/i18n';

export const prerender = true;

export async function GET({ request }: { request: Request }) {
  const url = new URL(request.url);
  const localeParam = url.searchParams.get('locale');
  const locale = (localeParam === 'en' || localeParam === 'es' ? localeParam : undefined) as Locale | undefined;

    const posts = await getCollection('posts', ({ data }) => {
    if (data.draft) return false;
    if (locale && data.language !== locale) return false;
    return true;
  });

  const normalise = (value: string) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  const cleanMarkdown = (markdown: string) =>
    markdown
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/!\[[^\]]*\]\([^\)]+\)/g, ' ')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      .replace(/\[\^\d+\]:?/g, ' ')
      .replace(/[`*_>#~|{}\[\]\\-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const payload = posts.map((post) => {
    const body = cleanMarkdown(post.body ?? '');
    const summary = post.data.summary?.trim();
    const source = summary && summary.length > 0 ? summary : body;
    const excerpt = source ? (source.length > 240 ? `${source.slice(0, 240).trimEnd()}…` : source) : '';
    const combined = [post.data.title, summary ?? '', body, ...(post.data.labels ?? [])].join(' ');

    return {
      title: post.data.title,
      summary: post.data.summary ?? '',
      slug: post.slug,
      labels: post.data.labels ?? [],
      pubDate: post.data.pubDate.toISOString(),
      language: post.data.language,

      excerpt,
      keywords: normalise(combined),
    };
  });

  return new Response(JSON.stringify(payload), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=600',
    },
  });
}
