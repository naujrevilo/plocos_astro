
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// Función para slugify usando la lógica de labelToSlug
function slugify(text) {
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .trim();
}

const __dirname = path.dirname(new URL(import.meta.url).pathname.replace(/^\/+([A-Za-z]:)/, '$1'));
const postsDir = path.join(__dirname, '../src/content/posts');
const outputFile = path.join(__dirname, '../public/api/posts.json');

const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'));
const posts = [];

for (const file of files) {
  const filePath = path.join(postsDir, file);
  const raw = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(raw);
  if (data.draft) continue;
  const slug = slugify(data.title || file.replace(/\.md$/, ''));
  const excerpt = content.split('\n').find(line => line.trim().length > 0) || '';
  posts.push({
    slug,
    title: data.title || '',
    summary: data.summary || '',
    excerpt,
    pubDate: data.pubDate || '',
    labels: data.labels || [],
    keywords: data.keywords || '',
    heroImage: data.heroImage || '',
    heroImageAlt: data.heroImageAlt || ''
  });
}

fs.writeFileSync(outputFile, JSON.stringify(posts, null, 2));
console.log(`Generado ${posts.length} posts en posts.json`);