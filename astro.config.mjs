// @ts-check
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import tailwind from '@astrojs/tailwind';


import vue from '@astrojs/vue';
import db from '@astrojs/db';
import react from '@astrojs/react';


// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: netlify(),

  integrations: [
      tailwind({
          applyBaseStyles: false,
      }),
      db(),
      vue(),
      react(),
      
  ],

  

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