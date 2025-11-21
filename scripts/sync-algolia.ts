import "dotenv/config";
import * as algoliasearch from "algoliasearch";
import { getCollection } from 'astro:content';



/**
 * Obtiene todas las publicaciones de la colección 'blog' de Astro,
 * las transforma al formato requerido por Algolia y las devuelve.
 * @returns {Promise<object[]>} Una promesa que se resuelve con un arreglo de objetos para Algolia.
 */
async function getAllPosts() {
  const posts = await getCollection('blog', ({ data }) => {
    // Filtra los borradores para no incluirlos en el índice de búsqueda.
    return data.draft === false;
  });

  const algoliaRecords = posts.map(post => {
    return {
      objectID: post.slug,
      slug: post.slug,
      ...post.data,
      // Asegura que la fecha sea un formato serializable (ISO string).
      pubDate: post.data.pubDate.toISOString(),
      // Incluye el cuerpo del post para una búsqueda de contenido completo.
      content: post.body,
    };
  });

  return algoliaRecords;
}

/**
 * Función principal que se encarga de sincronizar las publicaciones con Algolia.
 */
async function main() {
  const posts = await getAllPosts();

  // Imprime el estado de las variables de entorno de Algolia para depuración.
  console.log("--- Debugging Algolia Env Vars ---");
  console.log("ALGOLIA_APP_ID:", process.env.PUBLIC_ALGOLIA_APP_ID ? "Loaded" : "NOT LOADED");
  console.log("ALGOLIA_ADMIN_API_KEY:", process.env.ALGOLIA_ADMIN_API_KEY ? "Loaded" : "NOT LOADED");
  console.log("ALGOLIA_INDEX_NAME:", process.env.PUBLIC_ALGOLIA_INDEX_NAME ? "Loaded" : "NOT LOADED");
  console.log("------------------------------------");

  // Verifica que las variables de entorno de Algolia estén definidas.
  if (!process.env.PUBLIC_ALGOLIA_APP_ID || !process.env.ALGOLIA_ADMIN_API_KEY || !process.env.PUBLIC_ALGOLIA_INDEX_NAME) {
    console.error("Error: Missing Algolia environment variables. Please check your .env file.");
    process.exit(1);
  }

  // Inicializa el cliente de Algolia.
  const client = algoliasearch.algoliasearch(
    process.env.PUBLIC_ALGOLIA_APP_ID,
    process.env.ALGOLIA_ADMIN_API_KEY
  );

  try {
    // Envía los objetos de las publicaciones al índice de Algolia.
    const responses = await client.saveObjects({
        indexName: process.env.PUBLIC_ALGOLIA_INDEX_NAME,
        objects: posts,
      });
    const objectIDs = responses.flatMap(response => response.objectIDs);
    console.log(`Successfully indexed ${objectIDs.length} posts to Algolia.`);
  } catch (error) {
    console.error("Error indexing posts to Algolia:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("An unexpected error occurred:", error);
  process.exit(1);
});