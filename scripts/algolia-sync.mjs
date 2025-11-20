import 'dotenv/config';
import algoliasearch from 'algoliasearch';
import { getCollection } from 'astro:content';

async function getAllPosts() {
  const posts = await getCollection('posts');

  const formattedPosts = posts.map((post) => {
    const { data } = post;

    for (const key in data) {
      if (data[key] === '' || data[key] === null) {
        delete data[key];
      }
    }

    return {
      objectID: post.slug,
      slug: post.slug,
      ...data,
    };
  });

  return formattedPosts;
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

  const client = algoliasearch(
    process.env.ALGOLIA_APP_ID,
    process.env.ALGOLIA_ADMIN_API_KEY
  );

  const responses = await client.saveObjects({
    indexName: process.env.ALGOLIA_INDEX_NAME,
    objects: posts,
    autoGenerateObjectIDIfNotExist: true,
  });

  const objectIDs = responses.flatMap(response => response.objectIDs);

  console.log(`Successfully indexed ${objectIDs.length} posts to Algolia.`);
}

main().catch((error) => {
  console.error('An unexpected error occurred:', error);
  process.exit(1);
});