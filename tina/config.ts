import { defineConfig } from "tinacms";

// Configuración mínima de TinaCMS para el flujo local actual. Mantenerla
// alineada con el esquema de Astro (`src/content/config.ts`) cuando se
// introduzcan nuevos campos en el frontmatter.

export default defineConfig({
  branch: process.env.TINA_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || "main",
  client: { skip: true },
  build: {
    outputFolder: "admin",
    publicFolder: "public",
  },
  media: {
    tina: {
      // Los assets nuevos del panel se almacenan bajo /public/uploads para
      // separarlos de las imágenes históricas migradas.
      mediaRoot: "public/uploads",
      publicFolder: "public",
    },
  },
  schema: {
    collections: [
      {
        name: "posts",
        label: "Publicaciones",
        path: "src/content/posts/",
        format: "md",
        fields: [
          { type: "string", name: "title", label: "Título", required: true },
          { type: "datetime", name: "pubDate", label: "Fecha de publicación", required: true },
          { type: "datetime", name: "updatedDate", label: "Fecha de actualización" },
          { type: "string", name: "language", label: "Idioma" },
          { type: "string", name: "summary", label: "Resumen" },
          { type: "string", name: "author", label: "Autor" },
          { type: "string", name: "label", label: "Etiquetas", list: true },
          { type: "string", name: "categories", label: "Categorías", list: true },
          { type: "image", name: "heroImage", label: "Imagen destacada" },
          { type: "boolean", name: "draft", label: "Borrador" },
          { type: "string", name: "translationKey", label: "Clave de traducción" },
          { type: "string", name: "originalUrl", label: "URL original" },
          { type: "string", name: "body", label: "Contenido", isBody: true },
        ],
      },
      {
        name: "categories",
        label: "Categorías",
        path: "src/content/categories",
        format: "md",
        fields: [
          { type: "string", name: "title", label: "Nombre" },
          { type: "string", name: "description", label: "Descripción" },
          { type: "string", name: "color", label: "Color" },
          { type: "boolean", name: "featured", label: "Destacado" },
          { type: "string", name: "body", label: "Contenido" },
        ],
      },
      {
        name: "authors",
        label: "Autores",
        path: "src/content/authors",
        format: "md",
        fields: [
          { type: "string", name: "title", label: "Nombre" },
          { type: "string", name: "role", label: "Rol" },
          { type: "string", name: "bio", label: "Biografía" },
          { type: "string", name: "portrait", label: "Retrato" },
          { type: "string", name: "body", label: "Contenido" },
        ],
      },
    ],
  },
});
