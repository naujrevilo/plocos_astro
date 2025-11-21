import { defineConfig } from "tinacms";
import CategoryMultiSelect from "./components/CategoryMultiSelect";

const branch =
  process.env.TINA_BRANCH ||
  process.env.HEAD ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.GITHUB_REF_NAME ||
  "main";

// Las credenciales de Tina Cloud llegan en tiempo de build vía variables de entorno.
// `clientId` puede ser público, pero `token` debe quedarse en almacenes seguros.
const clientId = process.env.TINA_PUBLIC_CLIENT_ID || "";
const token = process.env.TINA_TOKEN || "";

const slugifyValue = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/_/g, "-")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();

const datePrefix = (input: unknown) => {
  if (!input) return null;
  const date =
    input instanceof Date ? input : typeof input === "string" ? new Date(input) : null;
  if (!date || Number.isNaN(date.getTime())) return null;
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

type PostFormValues = {
  title?: string | null;
  pubDate?: string | Date | null;
} & Record<string, unknown>;


// Configuración mínima de TinaCMS para el flujo local actual. Mantenerla
// alineada con el esquema de Astro (`src/content/config.ts`) cuando se
// introduzcan nuevos campos en el frontmatter.

export default defineConfig({
  branch,
  clientId,
  token,
  build: {
    outputFolder: "tina-admin",
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
        defaultItem: () => {
          const now = new Date().toISOString();
          return {
            pubDate: now,
            language: "es",
            draft: false,
            labels: [] as string[],
            categories: [] as string[],
            author: "Michel Saer",
          };
        },
        ui: {
          filename: {
            readonly: true,
            slugify: (values: PostFormValues) => {
              const date = datePrefix(values?.pubDate) ?? datePrefix(new Date());
              const titleSlug = slugifyValue(String(values?.title ?? "entrada"));
              return `${date ?? "0000-00-00"}-${titleSlug}`;
            },
          },
        },
        fields: [
          { type: "string", name: "title", label: "Título", required: true },
          { type: "datetime", name: "pubDate", label: "Fecha de publicación", required: true },
          { type: "datetime", name: "updatedDate", label: "Fecha de actualización" },
          { type: "string", name: "language", label: "Idioma" },
          { type: "string", name: "summary", label: "Resumen" },
          { type: "string", name: "author", label: "Autor" },
          { type: "string", name: "labels", label: "Etiquetas", list: true },
          {
            type: "string",
            name: "categories",
            label: "Categorías",
            list: true,
            ui: {
              // Usa un componente custom para listar categorías desde la API de Tina y mantener slugs en frontmatter.
              component: CategoryMultiSelect as any,
            } as any,
          },
          { type: "image", name: "heroImage", label: "Imagen destacada" },
          {
            type: "string",
            name: "heroImageAlt",
            label: "Texto alternativo de la imagen",
            ui: {
              component: "textarea",
            },
          },
          { type: "boolean", name: "draft", label: "Borrador" },
          { type: "string", name: "translationKey", label: "Clave de traducción" },
          { type: "string", name: "originalUrl", label: "URL original" },
          { type: "rich-text", name: "body", label: "Contenido", isBody: true },
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
      {
        name: "comments",
        label: "Comentarios",
        path: "src/content/comments",
        format: "json",
        defaultItem: () => ({
          approved: false,
          createdAt: new Date().toISOString(),
        }),
        fields: [
          {
            type: "string",
            name: "postSlug",
            label: "Slug de la publicación",
            required: true,
            description: "Coincide con el slug del archivo en src/content/posts.",
          },
          {
            type: "string",
            name: "locale",
            label: "Idioma",
            required: true,
            options: [
              { value: "es", label: "Español" },
              { value: "en", label: "English" },
            ],
          },
          { type: "string", name: "name", label: "Nombre", required: true },
          {
            type: "string",
            name: "email",
            label: "Correo de contacto",
            required: false,
            description: "Visible solo para el equipo editorial.",
          },
          {
            type: "string",
            name: "message",
            label: "Comentario",
            ui: { component: "textarea" },
            required: true,
          },
          {
            type: "datetime",
            name: "createdAt",
            label: "Fecha de envío",
            required: true,
          },
          {
            type: "boolean",
            name: "approved",
            label: "Aprobado para publicación",
            description: "Solo los comentarios aprobados se muestran en el sitio.",
            required: true,
          },
        ],
      },
    ],
  },
});
