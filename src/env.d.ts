/// <reference path="../.astro/db-types.d.ts" />

/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
	readonly PUBLIC_SITE_URL: string;
	// Agrega aquí otras variables públicas si las tienes
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

// Clerk session token claims (T26). Customize session token in the Clerk
// Dashboard with `{"metadata": "{{user.public_metadata}}"}`.
interface CustomJwtSessionClaims {
	metadata?: {
		role?: string;
	};
}
