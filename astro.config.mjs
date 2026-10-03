import astroConsent from "astro-consent";
// @ts-check
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import clerk from '@clerk/astro';



// https://astro.build/config
export default defineConfig({
  site: 'https://plocos.netlify.app',
  output: 'server',
  adapter: netlify({
    // El proyecto no define edge functions propias: el middleware de Clerk
    // corre dentro de la SSR function. La emulación local de edge functions
    // (Deno) fallaba al iniciar y emitía un unhandled rejection en cada
    // arranque del dev server. La desactivamos en dev; en producción Netlify
    // sigue aplicando la política normal.
    devFeatures: {
      edgeFunctions: false,
    },
  }),

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

      sitemap(),
      clerk({
        signInUrl: '/sign-in',
        signUpUrl: '/sign-up',
        profileUrl: '/cuenta',
      }),

  ],

  vite: {
    plugins: [tailwindcss()],
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