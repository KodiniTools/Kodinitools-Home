import { defineConfig } from 'astro/config';
import { readFileSync } from 'node:fs';
import vue from '@astrojs/vue';
import sitemap from '@astrojs/sitemap';

// Tool pages live as standalone apps in sub-directories (e.g. /audiokonverter/),
// so Astro does not build them and they are missing from the generated sitemap.
// Pull their canonical URLs from the DE locale (single source of truth) and feed
// them to the sitemap so Google can discover and index them.
const de = JSON.parse(readFileSync('./src/locales/de.json', 'utf-8'));
const toolPages = ['tools', 'imageTools', 'diverseTools'].flatMap((group) =>
  Object.values(de[group] ?? {})
    .filter((entry) => entry && typeof entry === 'object' && 'link' in entry)
    .map((entry) => entry.link),
);

export default defineConfig({
  site: 'https://kodinitools.com',
  base: '/',
  integrations: [
    vue({
      appEntrypoint: '/src/pages/_app',
    }),
    sitemap({
      customPages: toolPages,
      i18n: {
        defaultLocale: 'de',
        // Generic language codes to match the in-page hreflang tags and reach all
        // German/English speakers (not just CH/US regional variants).
        locales: {
          de: 'de',
          en: 'en',
        },
      },
    }),
  ],
  vite: {
    define: {
      __VUE_PROD_DEVTOOLS__: JSON.stringify(false),
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: JSON.stringify(false),
    },
    ssr: {
      noExternal: ['vue-i18n'],
    },
  },
});
