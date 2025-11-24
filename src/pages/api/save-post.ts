/**
 * @file src/pages/api/save-post.ts
 * @description API endpoint to save changes to a post.
 * @returns {Response} - A JSON response with a success or error message.
 */
import type { APIRoute } from 'astro';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const id = formData.get('id') as string;
    const title = formData.get('title') as string;
    const summary = formData.get('summary') as string;
    const body = formData.get('body') as string;

    if (!id) {
      return new Response(JSON.stringify({ error: 'ID requerido' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Construir ruta del archivo
    const filePath = path.join(process.cwd(), 'src', 'content', 'posts', `${id}.md`);

    if (!fs.existsSync(filePath)) {
      return new Response(JSON.stringify({ error: 'Post no encontrado' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Leer el archivo existente para preservar todo el frontmatter
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data: frontmatter } = matter(fileContent);

    // Actualizar solo los campos editados
    frontmatter.title = title;
    frontmatter.summary = summary;
    frontmatter.updatedDate = new Date().toISOString();

    // Reconstruir el archivo con frontmatter actualizado
    const newContent = matter.stringify(body, frontmatter);

    // Guardar
    fs.writeFileSync(filePath, newContent, 'utf8');

    return new Response(JSON.stringify({ success: true, message: 'Post guardado' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error guardando post:', error);
    return new Response(JSON.stringify({ 
      error: 'Error al guardar', 
      details: error instanceof Error ? error.message : String(error)
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
