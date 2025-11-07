import { getPublishedPosts } from '../lib/posts';
import { defaultLocale, getTranslations } from '../lib/i18n';
import { createLocaleHref } from '../lib/routes';

const SITE_TITLE = 'Plocos';
const SITE_DESCRIPTION = 'Arte, ideas y narrativas desde Plocos.';

export async function GET() {
  const locale = defaultLocale;
  const translations = getTranslations(locale);
  const posts = await getPublishedPosts({ locale });

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
