import "dotenv/config";
import * as algoliasearch from "algoliasearch";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

/**
 * Busca recursivamente todos los archivos dentro de un directorio y sus subdirectorios.
 * @param {string} dirPath - La ruta del directorio a explorar.
 * @param {string[]} [arrayOfFiles] - Un arreglo opcional para acumular las rutas de los archivos.
 * @returns {string[]} Un arreglo con las rutas completas de todos los archivos encontrados.
 */
function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(path.join(dirPath, file)).isDirectory()) {
      arrayOfFiles = getAllFiles(path.join(dirPath, file), arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, file));
    }
  });

  return arrayOfFiles;
}

/**
 * Lee todas las publicaciones del blog desde el directorio /src/content/posts,
 * extrae el frontmatter y las devuelve como un arreglo de objetos para Algolia.
 * @returns {Promise<object[]>} Una promesa que se resuelve con un arreglo de objetos de las publicaciones.
 */
async function getAllPosts() {
  const postsDirectory = path.join(process.cwd(), "src/content/posts");
  const filenames = getAllFiles(postsDirectory, []);

  const posts = filenames.map((filename) => {
    const fileContents = fs.readFileSync(filename, "utf8");
    const { data } = matter(fileContents);

    // Limpia los datos: elimina campos vacíos o nulos.
    for (const key in data) {
      if (data[key] === "" || data[key] === null) {
        delete data[key];
      }
    }

    // Genera el slug a partir del nombre del archivo.
    const slug = path.basename(filename).replace(/\.mdx?$/, "");

    return {
      objectID: slug,
      slug: slug,
      ...data,
    };
  });

  return posts;
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