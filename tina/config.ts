import { defineConfig } from "tinacms"; 
 import { CategoryMultiSelect } from "./components/CategoryMultiSelect"; 
 
 const branch = 
   process.env.TINA_BRANCH || 
   process.env.HEAD || 
   process.env.GITHUB_REF_NAME || 
   "main"; 
 
 const clientId = process.env.TINA_PUBLIC_CLIENT_ID || ""; 
 const token = process.env.TINA_TOKEN || ""; 
 
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
       mediaRoot: "uploads", 
       publicFolder: "public", 
     }, 
   }, 
   schema: { 
     collections: [ 
       { 
         name: "posts", 
         label: "Publicaciones", 
         path: "src/content/posts", 
         format: "md", 
         fields: [ 
           { type: "string", name: "title", label: "Título", required: true }, 
           { type: "datetime", name: "pubDate", label: "Fecha de publicación", required: true }, 
           { type: "datetime", name: "updatedDate", label: "Fecha de actualización" }, 
           { 
           type: "string", 
           name: "category", 
           label: "Categoría", 
           list: true, 
           ui: { 
            // @ts-ignore
             component: CategoryMultiSelect, 
           }, 
         }, 
           { type: "string", name: "author", label: "Autor" }, 
           { type: "string", name: "language", label: "Idioma", options: ["es", "en"] }, 
           { type: "string", name: "translationKey", label: "Clave de traducción" }, 
           { type: "string", name: "summary", label: "Resumen", ui: { component: "textarea" } }, 
           { type: "string", name: "heroImage", label: "Imagen destacada" }, 
           { type: "string", name: "heroImageAlt", label: "Texto alternativo de la imagen" }, 
           { type: "string", name: "originalUrl", label: "URL original" }, 
           { type: "boolean", name: "draft", label: "Borrador" }, 
           { type: "string", name: "labels", label: "Etiquetas", list: true }, 
           { type: "rich-text", name: "body", label: "Contenido", isBody: true }, 
         ], 
       }, 
       { 
         name: "authors", 
         label: "Autores", 
         path: "src/content/authors", 
         format: "md", 
         fields: [ 
           { type: "string", name: "name", label: "Nombre" }, 
           { type: "string", name: "avatar", label: "Avatar" }, 
         ], 
       }, 
       { 
         name: "categories", 
         label: "Categorías", 
         path: "src/content/categories", 
         format: "md", 
         fields: [ 
           { type: "string", name: "title", label: "Título" }, 
           { type: "string", name: "description", label: "Descripción" }, 
           { type: "rich-text", name: "body", label: "Contenido", isBody: true }, 
         ], 
       }, 
     ], 
   }, 
 });

