import typography from '@tailwindcss/typography';
import defaultTheme from 'tailwindcss/defaultTheme.js';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}',
    './public/**/*.html',
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    fontFamily: {
      sans: ['"Noto Sans"', ...defaultTheme.fontFamily.sans],
      serif: [...defaultTheme.fontFamily.serif],
      mono: [...defaultTheme.fontFamily.mono],
      heading: ['"Sarala"', '"Noto Sans"', ...defaultTheme.fontFamily.sans],
    },
    extend: {
      colors: {
        surface: {
          base: 'var(--surface-base)',
          muted: 'var(--surface-muted)',
          elevated: 'var(--surface-elevated)',
          overlay: 'var(--surface-overlay)',
        },
        border: {
          subtle: 'var(--border-subtle)',
          strong: 'var(--border-strong)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          accent: 'var(--text-accent)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          soft: 'var(--accent-soft)',
          muted: 'var(--accent-muted)',
        },
      },
      boxShadow: {
        contemplation: '0 28px 80px var(--shadow-soft)',
        outline: '0 0 0 1px var(--border-subtle)',
      },
      typography: {
        DEFAULT: {
          css: {
            '--tw-prose-body': 'var(--prose-body)',
            '--tw-prose-headings': 'var(--prose-headings)',
            '--tw-prose-links': 'var(--prose-links)',
            '--tw-prose-bold': 'var(--prose-bold)',
            '--tw-prose-quotes': 'var(--prose-quotes)',
          },
        },
      },
    },
  },
  plugins: [typography],
};

