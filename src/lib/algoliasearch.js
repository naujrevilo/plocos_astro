import * as dotenv from 'dotenv';
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

import { algoliasearch } from 'algoliasearch';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// 1. Use the named import and initialize the client
const client = algoliasearch(process.env.ALGOLIA_APP_ID, process.env.ALGOLIA_ADMIN_KEY);

const postsDirectory = path.join(process.cwd(), 'src/content/posts');

function getPostSlugs() {
  return fs.readdirSync(postsDirectory);
}

function getPostBySlug(slug) {
  const realSlug = slug.replace(/\.md$/, '');
  const fullPath = path.join(postsDirectory, `${realSlug}.md`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  return { slug: realSlug, frontmatter: data, content };
}

function getAllPosts() {
  const slugs = getPostSlugs();
  const posts = slugs.reduce((acc, slug) => {
    try {
      const post = getPostBySlug(slug);
      acc.push(post);
    } catch (e) {
      // Silently ignore files that fail to parse.
    }
    return acc;
  }, []);
  return posts;
}

function extractImageUrl(content) {\n  const match = content.match(/!\\\[.*?\\]\\((.*?)\\)/);\n  return match ? match[1] : null;\n}\n\nasync function syncWithAlgolia() {
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
