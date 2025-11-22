// @ts-check
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';


import vue from '@astrojs/vue';
import db from '@astrojs/db';
import react from '@astrojs/react';


// https://astro.build/config
export default defineConfig({
  site: 'https://plocos.netlify.app',
  output: 'server',
  adapter: netlify({ edgeMiddleware: true }),

  integrations: [
      tailwind({
          applyBaseStyles: false,
      }),
      db(),
      vue(),
      react(),
      sitemap(),
      
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