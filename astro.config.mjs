// @ts-check
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

import db from '@astrojs/db';

// https://astro.build/config
export default defineConfig({
    integrations: [
        tailwind({
            applyBaseStyles: false,
        }),
        db(),
    ],
    vite: {
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url)),
            },
        },
    },
    i18n: {
        locales: ['es', 'en'],
        defaultLocale: 'es',
        fallback: {
            en: 'es',
        },
        routing: {
            fallbackType: 'rewrite',
        },
    },
});