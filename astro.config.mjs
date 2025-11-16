// @ts-check
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import pagefind from 'astro-pagefind';

import db from '@astrojs/db';

import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  output: 'server',

  integrations: [
      tailwind({
          applyBaseStyles: false,
      }),
      db(),
      pagefind(),
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

  adapter: netlify(),
});