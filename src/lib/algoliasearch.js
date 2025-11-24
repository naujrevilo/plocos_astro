import * as dotenv from 'dotenv';
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

import { algoliasearch } from 'algoliasearch';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// Inicializa el cliente de Algolia con las credenciales de entorno.
const client = algoliasearch(process.env.ALGOLIA_APP_ID, process.env.ALGOLIA_ADMIN_KEY);

// Define el directorio donde se encuentran los posts.
const postsDirectory = path.join(process.cwd(), 'src/content/posts');

/**
 * Obtiene los slugs (nombres de archivo) de todos los posts.
 * @returns {string[]} Un array de slugs de posts.
 */
function getPostSlugs() {
  return fs.readdirSync(postsDirectory);
}

/**
 * Obtiene el contenido de un post por su slug.
 * @param {string} slug - El slug del post.
 * @returns {{slug: string, frontmatter: object, content: string}} El post con su slug, frontmatter y contenido.
 */
function getPostBySlug(slug) {
  const realSlug = slug.replace(/\.md$/, '');
  const fullPath = path.join(postsDirectory, `${realSlug}.md`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  return { slug: realSlug, frontmatter: data, content };
}

/**
 * Obtiene todos los posts.
 * @returns {Array<object>} Un array de todos los posts.
 */
function getAllPosts() {
  const slugs = getPostSlugs();
  const posts = slugs.reduce((acc, slug) => {
    try {
      const post = getPostBySlug(slug);
      acc.push(post);
    } catch (e) {
      // Ignora silenciosamente los archivos que no se pueden parsear.
    }
    return acc;
  }, []);
  return posts;
}

/**
 * Extrae la URL de la primera imagen de un contenido en formato Markdown.
 * @param {string} content - El contenido del post en Markdown.
 * @returns {string|null} La URL de la imagen o null si no se encuentra.
 */
function extractImageUrl(content) {
  const match = content.match(/!\[.*?\]\((.*?)\)/);
  return match ? match[1] : null;
}

/**
 * Sincroniza todos los posts con Algolia.
 * Borra los objetos existentes, sube los nuevos y configura los atributos de búsqueda.
 */
async function syncWithAlgolia() {
  const posts = getAllPosts();

  const records = posts.map(post => ({
    objectID: post.slug,
    image: extractImageUrl(post.content),
    title: post.frontmatter.title,
    description: post.frontmatter.description,
    pubDate: post.frontmatter.pubDate,
    content: post.content.substring(0, 8000),
  }));

  try {
    await client.clearObjects({ indexName: process.env.ALGOLIA_INDEX_NAME });
    
    const response = await client.saveObjects({
      indexName: process.env.ALGOLIA_INDEX_NAME,
      objects: records,
    });
    console.log(`Successfully indexed ${response[0].objectIDs.length} posts to Algolia.`);

    await client.setSettings({
      indexName: process.env.ALGOLIA_INDEX_NAME,
      indexSettings: {
        searchableAttributes: [
          'title',
          'description',
          'content'
        ]
      }
    });
    console.log('Successfully set searchableAttributes.');

  } catch (error) {
    console.error('Error syncing with Algolia:', error);
  }
}

syncWithAlgolia();
