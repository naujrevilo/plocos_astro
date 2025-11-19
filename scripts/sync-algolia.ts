import 'dotenv/config';
import * as algoliasearch from 'algoliasearch';

import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

// This function reads all the blog posts from the /src/content/posts directory,
// parses the frontmatter, and returns them as an array of objects.
async function getAllPosts() {
  const postsDirectory = path.join(process.cwd(), 'src/content/posts');
  const filenames = await fs.readdir(postsDirectory);

  const posts = await Promise.all(
    filenames.map(async (filename) => {
      const filePath = path.join(postsDirectory, filename);
      const fileContents = await fs.readFile(filePath, 'utf8');
      const { data, content } = matter(fileContents);

      // Sanitize data: remove empty or null fields
      for (const key in data) {
        if (data[key] === '' || data[key] === null) {
          delete data[key];
        }
      }

      return {
        objectID: filename.replace(/\.md$/, ''),
        slug: filename.replace(/\.md$/, ''),
        ...data,
        content,
      };
    })
  );

  return posts;
}

async function main() {
  const posts = await getAllPosts();

  console.log('--- Debugging Algolia Env Vars ---');
  console.log('ALGOLIA_APP_ID:', process.env.ALGOLIA_APP_ID ? 'Loaded' : 'NOT LOADED');
  console.log('ALGOLIA_ADMIN_API_KEY:', process.env.ALGOLIA_ADMIN_API_KEY ? 'Loaded' : 'NOT LOADED');
  console.log('ALGOLIA_INDEX_NAME:', process.env.ALGOLIA_INDEX_NAME ? 'Loaded' : 'NOT LOADED');
  console.log('------------------------------------');




  if (!process.env.ALGOLIA_APP_ID || !process.env.ALGOLIA_ADMIN_API_KEY || !process.env.ALGOLIA_INDEX_NAME) {
    console.error('Error: Missing Algolia environment variables. Please check your .env file.');
    process.exit(1);
  }

  const client = algoliasearch.algoliasearch(
    process.env.ALGOLIA_APP_ID,
    process.env.ALGOLIA_ADMIN_API_KEY
  );



  const { objectIDs } = await client.saveObjects({
    indexName: process.env.ALGOLIA_INDEX_NAME,
    objects: posts,
    autoGenerateObjectIDIfNotExist: true,
  });

  console.log(`Successfully indexed ${objectIDs.length} posts to Algolia.`);
}

main().catch((error) => {
  console.error('An unexpected error occurred:', error);
  process.exit(1);
});