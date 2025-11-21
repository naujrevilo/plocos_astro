/// <reference path="../.astro/integrations/astro_db/db.d.ts" />

/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
	readonly PUBLIC_SITE_URL: string;
	// Agrega aquí otras variables públicas si las tienes
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
