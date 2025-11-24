/**
 * @file src/pages/rss.xml.js
 * @description Generates an RSS feed for the blog posts.
 * This endpoint fetches the 50 most recent, non-draft posts for the default locale,
 * and constructs an RSS 2.0 XML feed. The feed includes the post title, link,
 * publication date, and summary.
 *
 * @see getCollection - Used to fetch all published posts for the default locale.
 * @see getTranslations - Used to get localized path segments.
 * @see createLocaleHref - Used to construct the full URL for each post.
 */
import { getCollection } from 'astro:content';
import { defaultLocale, getTranslations } from '../lib/i18n';
import { createLocaleHref } from '../lib/routes';

const SITE_TITLE = 'Plocos';
const SITE_DESCRIPTION = 'Arte, ideas y narrativas desde Plocos.';

export async function GET() {
  const locale = defaultLocale;
  const translations = getTranslations(locale);
  const allPosts = await getCollection('posts', ({ data }) => {
    if (data.draft) return false;
    const postLanguage = data.language || defaultLocale;
    return postLanguage === locale;
  });
  const posts = allPosts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  const items = posts
    .slice(0, 50)
    .map((post) => {
      const path = `${translations.paths.posts}/${post.slug}`;
      const url = createLocaleHref(locale, path);
      return `<item>
        <title><![CDATA[${post.data.title}]]></title>
        <link>${url}</link>
        <guid>${url}</guid>
        <pubDate>${post.data.pubDate.toUTCString()}</pubDate>
        ${post.data.summary ? `<description><![CDATA[${post.data.summary}]]></description>` : ''}
      </item>`;
    })
    .join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8" ?>
  <rss version="2.0">
    <channel>
      <title>${SITE_TITLE}</title>
      <description>${SITE_DESCRIPTION}</description>
      <link>/</link>
      ${items}
    </channel>
  </rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  });
}
