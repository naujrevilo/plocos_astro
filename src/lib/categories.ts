/**
 * @module categories
 * @description Funciones de utilidad para gestionar las categorías, incluyendo la obtención,
 * filtrado y obtención de traducciones de las mismas.
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import { labelToSlug } from './taxonomy';
type PostEntry = CollectionEntry<'posts'>;
import type { Locale } from './i18n';

export type CategoryEntry = CollectionEntry<'categories'>;

/**
 * Obtiene todas las categorías de la colección de contenido y las ordena alfabéticamente por título.
 * @returns {Promise<CategoryEntry[]>} Una promesa que se resuelve en un array de entradas de categoría.
 */
export async function getCategories(): Promise<CategoryEntry[]> {
  const categories = await getCollection('categories');
  return categories.sort((a, b) => a.data.title.localeCompare(b.data.title));
}

/**
 * Obtiene el slug de una entrada de categoría.
 * @param {CategoryEntry} category - La entrada de la categoría.
 * @returns {string} El slug de la categoría.
 */
export function getCategorySlug(category: CategoryEntry): string {
  return category.slug;
}

/**
 * Filtra una lista de posts para devolver solo aquellos que pertenecen a una categoría específica.
 * La pertenencia se determina si el post tiene alguna de las etiquetas asociadas a la categoría.
 * @param {CategoryEntry} category - La categoría por la que filtrar.
 * @param {PostEntry[]} posts - La lista de posts a filtrar.
 * @returns {PostEntry[]} Un array de posts que pertenecen a la categoría.
 */
export function filterPostsByCategory(category: CategoryEntry, posts: PostEntry[]): PostEntry[] {
  if (!category.data.labels || category.data.labels.length === 0) {
    return posts;
  }

  const labelSlugs = new Set(category.data.labels.map((label) => labelToSlug(label)));
  return posts.filter((post) => {
    const postLabels = post.data.labels ?? [];
    return postLabels.some((label: string) => labelSlugs.has(labelToSlug(label)));
  });
}

/**
 * Obtiene el título de una categoría para un idioma específico.
 * Si la traducción para el idioma no está disponible, devuelve el título por defecto.
 * @param {CategoryEntry} category - La entrada de la categoría.
 * @param {Locale} locale - El idioma para el que obtener el título.
 * @returns {string} El título de la categoría.
 */
export function getCategoryTitle(category: CategoryEntry, locale: Locale): string {
  if (locale === 'en') {
    return category.data.title_en ?? category.data.title;
  }
  return category.data.title;
}

/**
 * Obtiene la descripción de una categoría para un idioma específico.
 * Si la traducción para el idioma no está disponible, devuelve la descripción por defecto.
 * @param {CategoryEntry} category - La entrada de la categoría.
 * @param {Locale} locale - El idioma para el que obtener la descripción.
 * @returns {string | undefined} La descripción de la categoría, o undefined si no existe.
 */
export function getCategoryDescription(
  category: CategoryEntry,
  locale: Locale,
): string | undefined {
  if (locale === 'en') {
    return category.data.description_en ?? category.data.description;
  }
  return category.data.description;
}

/**
 * Obtiene el cuerpo (contenido) de una categoría para un idioma específico.
 * Actualmente, solo devuelve el cuerpo para el idioma inglés.
 * @param {CategoryEntry} category - La entrada de la categoría.
 * @param {Locale} locale - El idioma para el que obtener el cuerpo.
 * @returns {string | undefined} El cuerpo de la categoría en inglés, o undefined si no es el idioma inglés.
 */
export function getCategoryBody(category: CategoryEntry, locale: Locale): string | undefined {
  if (locale === 'en') {
    return category.data.body_en;
  }
  return undefined;
}
