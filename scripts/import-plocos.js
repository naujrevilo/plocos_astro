import { mkdir, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import TurndownService from 'turndown';
import he from 'he';

const FEED_URL = 'https://www.plocos.com/feeds/posts/default?alt=json&max-results=500';
const CONTENT_ROOT = path.resolve('src/content/posts');
const IMAGES_ROOT = path.resolve('public/images/posts');

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
});

turndown.addRule('lineBreak', {
  filter: 'br',
  replacement: () => '  \n',
});

turndown.keep(['iframe']);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function ensureDir(dirPath) {
  await mkdir(dirPath, { recursive: true });
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function sanitizeFileName(input) {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'image';
}

function slugFromUrl(urlString) {
  try {
    const url = new URL(urlString);
    const segments = url.pathname.split('/').filter(Boolean);
    if (!segments.length) return { slug: sanitizeFileName(url.hostname), year: 'misc' };
    const lastSegment = segments[segments.length - 1].replace(/\.html?$/i, '');
    const yearSegment = segments.find((segment) => /^\d{4}$/.test(segment));
    return {
      slug: sanitizeFileName(lastSegment),
      year: yearSegment ?? (new Date().getFullYear()).toString(),
      segments,
    };
  } catch {
    return { slug: 'post', year: (new Date().getFullYear()).toString() };
  }
}

function buildSummary(html) {
  const decoded = he.decode(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!decoded) return '';
  const maxLength = 280;
  if (decoded.length <= maxLength) return decoded;
  return `${decoded.slice(0, maxLength - 1).trim()}…`;
}

function buildFrontmatter({ title, pubDate, updatedDate, labels, summary, heroImage, originalUrl }) {
  const lines = ['---'];
  lines.push(`title: ${JSON.stringify(title)}`);
  lines.push(`pubDate: ${JSON.stringify(pubDate)}`);
  if (updatedDate && updatedDate !== pubDate) {
    lines.push(`updatedDate: ${JSON.stringify(updatedDate)}`);
  }
  if (labels && labels.length) {
    lines.push('labels:');
    for (const label of labels) {
      lines.push(`  - ${JSON.stringify(label)}`);
    }
  } else {
    lines.push('labels: []');
  }
  if (heroImage) {
    lines.push(`heroImage: ${JSON.stringify(heroImage)}`);
  }
  if (originalUrl) {
    lines.push(`originalUrl: ${JSON.stringify(originalUrl)}`);
  }
  lines.push(`summary: ${JSON.stringify(summary)}`);
  lines.push('draft: false');
  lines.push('---', '');
  return lines.join('\n');
}

async function downloadImage(imageUrl, destinationDir, slug, index) {
  let resolvedUrl;
  try {
    resolvedUrl = new URL(imageUrl);
  } catch {
    return null;
  }

  const extension = path.extname(resolvedUrl.pathname) || '.jpg';
  const fileName = sanitizeFileName(`${slug}-${index}${extension}`);
  const destinationPath = path.join(destinationDir, fileName);

  if (!(await fileExists(destinationPath))) {
    const response = await fetch(resolvedUrl, { redirect: 'follow' });
    if (!response.ok) {
      console.warn(`⚠️  Failed to download ${imageUrl} -> ${response.status}`);
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    await writeFile(destinationPath, Buffer.from(arrayBuffer));
    await sleep(100);
  }

  const publicPath = destinationPath.replace(path.resolve('public'), '').replace(/\\/g, '/');
  return publicPath.startsWith('/') ? publicPath : `/${publicPath}`;
}

async function importFeed() {
  await ensureDir(CONTENT_ROOT);
  await ensureDir(IMAGES_ROOT);

  const response = await fetch(FEED_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch feed: ${response.status}`);
  }

  const feed = await response.json();
  const entries = feed?.feed?.entry ?? [];
  console.log(`Found ${entries.length} entries`);

  for (const entry of entries) {
    const title = he.decode(entry?.title?.$t ?? 'Sin título');
    const publishedRaw = entry?.published?.$t ?? entry?.updated?.$t;
    const updatedRaw = entry?.updated?.$t ?? publishedRaw;
    const publishedDate = publishedRaw ? new Date(publishedRaw) : new Date();
    const updatedDate = updatedRaw ? new Date(updatedRaw) : publishedDate;
    const alternateLink = entry?.link?.find?.((link) => link.rel === 'alternate')?.href;
    const { slug, year } = slugFromUrl(alternateLink ?? title);

    const contentDir = path.join(CONTENT_ROOT, year);
    await ensureDir(contentDir);

    const postPath = path.join(contentDir, `${slug}.md`);

    const labels = (entry?.category ?? [])
      .map((category) => category?.term)
      .filter(Boolean)
      .map((label) => he.decode(label));

    const rawHtml = entry?.content?.$t ?? entry?.summary?.$t ?? '';
    const decodedHtml = he.decode(rawHtml);

    const imageMatches = Array.from(decodedHtml.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi));
    const imageDir = path.join(IMAGES_ROOT, year, slug);
    let heroImage = null;
    let processedHtml = decodedHtml;

    if (imageMatches.length) {
      await ensureDir(imageDir);
      for (const [index, match] of imageMatches.entries()) {
        const originalSrc = match[1];
        const localPath = await downloadImage(originalSrc, imageDir, slug, index + 1);
        if (localPath) {
          processedHtml = processedHtml.replace(new RegExp(originalSrc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), localPath);
          if (!heroImage) {
            heroImage = localPath;
          }
        }
      }
    }

    const markdown = turndown.turndown(processedHtml)
      .split('\n')
      .map((line) => line.replace(/\s+$/g, ''))
      .join('\n')
      .trim();

    const summary = buildSummary(rawHtml);

    const frontmatter = buildFrontmatter({
      title,
      pubDate: publishedDate.toISOString(),
      updatedDate: updatedDate.toISOString(),
      labels,
      summary,
      heroImage,
      originalUrl: alternateLink,
    });

    const fileContents = `${frontmatter}${markdown}\n`;
    await writeFile(postPath, fileContents, 'utf8');
    console.log(`✓ Imported ${year}/${slug}`);
  }

  console.log('Import completed.');
}

importFeed().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
