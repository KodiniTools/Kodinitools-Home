import { defineConfig } from 'astro/config';
import { readFileSync } from 'node:fs';
import vue from '@astrojs/vue';
import singleSitemap, { langAlternatePages } from './single-sitemap';
import rszIntegration from './rsz-integration';

// Tool pages live as standalone apps in sub-directories (e.g. /audiokonverter/),
// so Astro does not build them and they are missing from the generated sitemap.
// Pull their canonical URLs from the DE locale (single source of truth) and feed
// them to the sitemap so Google can discover and index them.
const de = JSON.parse(readFileSync('./src/locales/de.json', 'utf-8'));
const toolPages = ['tools', 'imageTools', 'diverseTools'].flatMap((group) =>
  Object.values(de[group] ?? {})
    .filter(
      (entry): entry is { link: string } => !!entry && typeof entry === 'object' && 'link' in entry,
    )
    .map((entry) => entry.link),
);
// Unterseiten von Tool-Apps und verlinkte Seiten, die nicht als eigener
// Eintrag in de.json stehen (Liste mit tests/smoke/build.spec.ts abgleichen).
const EXTRA_SITEMAP_PAGES = [
  'https://kodinitools.com/kodini-color-extractor/generator',
  'https://kodinitools.com/equaliser19/faq',
  'https://kodinitools.com/playlistkonverter/faq.html',
  'https://kodinitools.com/playlistkonverter/funktion.html',
  'https://kodinitools.com/bildergalerie/',
  'https://kodinitools.com/datenschutz/',
  // Steht nur in overrides.*.json (Admin-Karten), nicht in de.json
  'https://kodinitools.com/favicon-tool/',
  // Unterseiten der Tool-Apps (früher in eigenen Tool-Sitemaps; diese Sitemap ist
  // jetzt die einzige). Nur indexierbare Seiten mit englischer Fassung (?lang=en).
  'https://kodinitools.com/audionormalisierer/anleitung',
  'https://kodinitools.com/audionormalisierer/app',
  'https://kodinitools.com/bilderseriebearbeiten/app',
  'https://kodinitools.com/bilderseriebearbeiten/artikel',
  'https://kodinitools.com/bilderseriebearbeiten/blog',
  'https://kodinitools.com/bilderseriebearbeiten/faq',
  'https://kodinitools.com/bildkonverter/about',
  'https://kodinitools.com/bildkonverter/batch',
  'https://kodinitools.com/bildkonverter/editor',
  'https://kodinitools.com/bildkonverter/gallery',
  'https://kodinitools.com/bildkonverter/guide',
  'https://kodinitools.com/bildkonverter/konvertieren/bmp-zu-webp',
  'https://kodinitools.com/bildkonverter/konvertieren/gif-zu-webp',
  'https://kodinitools.com/bildkonverter/konvertieren/heic-zu-jpg',
  'https://kodinitools.com/bildkonverter/konvertieren/heic-zu-png',
  'https://kodinitools.com/bildkonverter/konvertieren/jpg-zu-pdf',
  'https://kodinitools.com/bildkonverter/konvertieren/jpg-zu-png',
  'https://kodinitools.com/bildkonverter/konvertieren/jpg-zu-webp',
  'https://kodinitools.com/bildkonverter/konvertieren/png-zu-jpg',
  'https://kodinitools.com/bildkonverter/konvertieren/png-zu-svg',
  'https://kodinitools.com/bildkonverter/konvertieren/png-zu-webp',
  'https://kodinitools.com/bildkonverter/konvertieren/svg-zu-png',
  'https://kodinitools.com/bildkonverter/konvertieren/tiff-zu-jpg',
  'https://kodinitools.com/bildkonverter/konvertieren/webp-zu-jpg',
  'https://kodinitools.com/bildkonverter/konvertieren/webp-zu-png',
  'https://kodinitools.com/collagemaker/artikel',
  'https://kodinitools.com/collagemaker/blog',
  'https://kodinitools.com/collagemaker/editor',
  'https://kodinitools.com/collagemaker/faq',
  'https://kodinitools.com/equaliser19/app',
  'https://kodinitools.com/kodini-color-extractor/app',
  'https://kodinitools.com/kodini-color-extractor/faq',
  'https://kodinitools.com/playlist_generator/app',
  'https://kodinitools.com/playlist_generator/blog',
  'https://kodinitools.com/playlist_generator/faq',
  'https://kodinitools.com/texteditor/blog',
  'https://kodinitools.com/texteditor/funktionen',
  'https://kodinitools.com/videokonverter/converter.html',
  'https://kodinitools.com/visualizer/blog',
];
toolPages.push(...EXTRA_SITEMAP_PAGES);

export default defineConfig({
  site: 'https://kodinitools.com',
  // Standard-Deploy: base '/', Ausgabe nach dist/. Der Admin-Vorschau-Build
  // überschreibt beides per Umgebungsvariable (base /admin/preview/, eigenes
  // Ausgabeverzeichnis), damit die Vorschau die Live-Auslieferung nicht berührt.
  base: process.env.ASTRO_BASE || '/',
  outDir: process.env.ASTRO_OUT_DIR || './dist',
  // CSS direkt ins HTML einbetten: keine render-blockierenden Stylesheet-Requests
  // (PageSpeed: „Anfragen zum Blockieren des Renderings"). Die Seiten-CSS ist klein (~15 KB).
  build: { inlineStylesheets: 'always' },
  integrations: [
    // Eigene Integration: erzeugt EINE flache sitemap.xml statt des von
    // @astrojs/sitemap erzwungenen Paars sitemap-index.xml + sitemap-0.xml.
    // Die Tool-Apps (toolPages) stehen je mit deutscher URL und englischer
    // Fassung (?lang=en) samt hreflang de/en/x-default drin. Siehe single-sitemap.ts.
    singleSitemap({ extraPages: langAlternatePages(toolPages) }),
    // Vue 3 für interaktive Islands (src/islands/), nur dort im Browser geladen.
    vue(),
    // Verkleinerte Fassungen hochgeladener Bilder für srcset (Hero-Banner).
    rszIntegration(),
  ],
});
