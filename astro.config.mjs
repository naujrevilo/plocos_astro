import astroConsent from "astro-consent";
// @ts-check
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';


import vue from '@astrojs/vue';
import react from '@astrojs/react';




// https://astro.build/config
export default defineConfig({
  site: 'https://plocos.netlify.app',
  output: 'server',
  adapter: netlify(),

  integrations: [
    // astro-consent:start
    astroConsent({
      siteName: "My Website",
      headline: "Manage cookie preferences for My Website",
      description: "We use cookies to improve site performance, measure traffic, and support marketing.",
      acceptLabel: "Accept all",
      rejectLabel: "Reject all",
      manageLabel: "Manage preferences",
      cookiePolicyUrl: "/cookie-policy",
      privacyPolicyUrl: "/privacy",
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