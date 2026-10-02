import astroConsent from "astro-consent";
// @ts-check
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';




// https://astro.build/config
export default defineConfig({
  site: 'https://plocos.netlify.app',
  output: 'server',
  adapter: netlify(),

  integrations: [
// astro-consent:start
    astroConsent({
      siteName: "Plocos",
      cookiePolicyUrl: "/politica-de-cookies",
      privacyPolicyUrl: "/privacidad",
      displayUntilIdle: true,
      displayIdleDelayMs: 1000,
      consent: {
        days: 30,
        storageKey: "astro-consent"
      }
    }),
    // astro-consent:end

      tailwind({
          applyBaseStyles: false,
      }),
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