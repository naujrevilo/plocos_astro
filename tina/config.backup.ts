// Backup of tina/config.ts before reinitializing Tina
// Created on rollback troubleshooting

import { defineConfig } from "tinacms";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

// Helpers para opciones dinámicas en selects
const rootDir = path.resolve(process.cwd());
const postsDir = path.join(rootDir, "src", "content", "posts");
const categoriesDir = path.join(rootDir, "src", "content", "categories");
const authorsDir = path.join(rootDir, "src", "content", "authors");

function readMarkdownSlugs(dir: string): string[] {
	try {
		return fs
			.readdirSync(dir)
			.filter((f) => f.endsWith(".md"))
			.map((f) => path.basename(f, ".md"))
			.sort((a, b) => a.localeCompare(b));
	} catch {
		return [];
	}
}

function walkDir(dir: string, out: string[] = []): string[] {
	try {
		const entries = fs.readdirSync(dir, { withFileTypes: true });
		for (const e of entries) {
			const p = path.join(dir, e.name);
			if (e.isDirectory()) walkDir(p, out);
			else if (e.isFile() && e.name.endsWith(".md")) out.push(p);
		}
	} catch {}
	return out;
}

function collectFromPosts(fieldName: string): string[] {
	const files = walkDir(postsDir);
	const set = new Set<string>();
	for (const file of files) {
		try {
			const src = fs.readFileSync(file, "utf8");
			const fm = matter(src).data as Record<string, unknown>;
			const v = fm[fieldName];
			if (Array.isArray(v)) v.forEach((x) => typeof x === "string" && set.add(x));
			else if (typeof v === "string") set.add(v);
		} catch {}
	}
	return Array.from(set).sort((a, b) => a.localeCompare(b));
}

const categoryOptions = readMarkdownSlugs(categoriesDir).map((s) => ({ label: s, value: s }));
const authorOptions = readMarkdownSlugs(authorsDir).map((s) => ({ label: s, value: s }));
const labelOptions = collectFromPosts("labels").map((s) => ({ label: s, value: s }));

export default defineConfig({
	client: { skip: true },
	branch: process.env.TINA_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || "main",

	build: {
		outputFolder: "tina",
		publicFolder: "public",
	},
	media: {
		tina: {
			// Directorio raíz para subidas desde el gestor multimedia
			mediaRoot: "images/uploads",
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
				match: { include: "**/*.md" },
				ui: {
					// Generar automáticamente el nombre de archivo: YYYY-MM-DD-titulo
					filename: {
						slugify: (values) => {
							const safeTitle = String(values?.title || "nuevo-articulo")
								.toLowerCase()
								.normalize("NFD").replace(/\p{Diacritic}/gu, "")
								.replace(/[^a-z0-9\-\s_]/g, "")
								.trim()
								.replace(/\s+/g, "-");
							const date = String(values?.pubDate || new Date().toISOString()).slice(0, 10);
							return `${date}-${safeTitle}`;
						},
					},
				},
				// Valores iniciales al crear un nuevo documento
				defaultItem: () => ({
					title: "",
					pubDate: new Date().toISOString(),
					updatedDate: undefined,
					language: "es",
					summary: "",
					author: undefined,
					labels: [],
					categories: [],
					heroImage: "",
					draft: false,
					translationKey: "",
					originalUrl: "",
					body: ""
				}),
				fields: [
					{ type: "string", name: "title", label: "Título", required: true },
					{ type: "datetime", name: "pubDate", label: "Fecha de publicación", required: true, ui: { dateFormat: "yyyy-MM-dd", timeFormat: "HH:mm" } },
					{ type: "datetime", name: "updatedDate", label: "Fecha de actualización", required: false, ui: { dateFormat: "yyyy-MM-dd", timeFormat: "HH:mm" } },
					{ type: "string", name: "language", label: "Idioma", options: ["es", "en"], required: true, ui: { component: "select" } },
					{ type: "string", name: "summary", label: "Resumen", ui: { component: 'textarea' }, required: false },
					{ type: "string", name: "author", label: "Autor", required: true, ui: { component: "select" }, options: authorOptions },
					{ type: "string", name: "labels", label: "Etiquetas", list: true, required: false, ui: { component: "select" }, options: labelOptions },
					{ type: "string", name: "categories", label: "Categorías", list: true, required: false, ui: { component: "select" }, options: categoryOptions },
					{ type: "image", name: "heroImage", label: "Imagen destacada", required: false, description: "Ruta bajo /public, ej.: /images/posts/... o sube a /images/uploads" },
					{ type: "boolean", name: "draft", label: "Borrador", required: false },
					{ type: "string", name: "translationKey", label: "Clave de traducción", required: false, description: "ID común para agrupar versiones del mismo artículo en distintos idiomas. Déjalo vacío si no aplica." },
					{ type: "string", name: "originalUrl", label: "URL original", required: false },
					{ type: "string", name: "body", label: "Contenido", isBody: true, ui: { component: 'textarea' } },
				],
			},
			{
				name: "categories",
				label: "Categorías",
				path: "src/content/categories",
				format: "md",
				fields: [
					{ type: "string", name: "title", label: "Nombre" },
					{ type: "string", name: "description", label: "Descripción", required: false },
					{ type: "string", name: "color", label: "Color", required: false },
					{ type: "boolean", name: "featured", label: "Destacado", required: false },
					{ type: "string", name: "body", label: "Contenido", required: false, ui: { component: 'textarea' } },
				],
			},
			{
				name: "authors",
				label: "Autores",
				path: "src/content/authors",
				format: "md",
				fields: [
					{ type: "string", name: "title", label: "Nombre" },
					{ type: "string", name: "role", label: "Rol", required: false },
					{ type: "string", name: "bio", label: "Biografía", required: false },
					{ type: "string", name: "portrait", label: "Retrato", required: false },
					// Igual que en categorías, evitamos isBody
					{ type: "string", name: "body", label: "Contenido", required: false, ui: { component: 'textarea' } },
				],
			},
		],
	},
});

