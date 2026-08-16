import { defineConfig } from 'astro/config';
import { readFileSync } from 'node:fs';
import vue from '@astrojs/vue';
import singleSitemap from './single-sitemap.mjs';

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
  // Standard-Deploy: base '/', Ausgabe nach dist/. Der Admin-Vorschau-Build
  // überschreibt beides per Umgebungsvariable (base /admin/preview/, eigenes
  // Ausgabeverzeichnis), damit die Vorschau die Live-Auslieferung nicht berührt.
  base: process.env.ASTRO_BASE || '/',
  outDir: process.env.ASTRO_OUT_DIR || './dist',
  integrations: [
    vue({
      appEntrypoint: '/src/pages/_app',
    }),
    // Eigene Integration: erzeugt EINE flache sitemap.xml statt des von
    // @astrojs/sitemap erzwungenen Paars sitemap-index.xml + sitemap-0.xml.
    // Die Tool-Apps (toolPages) und die hreflang-Alternates (de/en) bleiben
    // erhalten. Siehe single-sitemap.mjs.
    singleSitemap({ extraPages: toolPages }),
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
