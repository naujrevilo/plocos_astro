// @ts-check
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';


import vue from '@astrojs/vue';
import db from '@astrojs/db';
import react from '@astrojs/react';


const isNetlifyProduction = process.env.NETLIFY && process.env.CONTEXT === 'production';

// https://astro.build/config
export default defineConfig({
  site: 'https://plocos.netlify.app',
  output: 'server',
  adapter: netlify(),

  integrations: [
      tailwind({
          applyBaseStyles: false,
      }),
      !isNetlifyProduction && db(),
      vue(),
      react(),
      sitemap(),
      
  ].filter(Boolean),

  

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