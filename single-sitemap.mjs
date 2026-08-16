// single-sitemap.mjs — Eigene Astro-Integration, die EINE flache sitemap.xml
// erzeugt (statt des von @astrojs/sitemap erzwungenen Paars
// sitemap-index.xml + sitemap-0.xml).
//
// Warum eine eigene Integration?
//   @astrojs/sitemap schreibt technisch immer eine Index-Datei plus eine oder
//   mehrere sitemap-N.xml-Chunks. Die Aufteilung ist erst ab 50.000 URLs bzw.
//   50 MB pro Datei vorgeschrieben — bei dieser Seite (rund 40 URLs) also
//   unnötig. Eine einzelne sitemap.xml ist gültig, einfacher zu pflegen und
//   leichter in der robots.txt zu referenzieren.
//
// Diese Integration bildet das bisherige Verhalten 1:1 nach:
//   - alle von Astro gebauten Seiten (ohne 404),
//   - plus die eigenständigen Tool-Apps (extraPages, aus de.json),
//   - plus hreflang-Alternates (de/en) für Seiten mit identischem Pfad in
//     beiden Sprachen (/, /blog/, /faq/). Blog-Artikel mit abweichenden
//     Slugs bekommen — wie zuvor — keine Alternates.

import { fileURLToPath } from 'node:url';
import { writeFile, rm } from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_LOCALE = 'de';
const LOCALE_ORDER = ['de', 'en'];

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Pfad -> { locale, key }. Der "key" ist der sprachneutrale Pfad, über den
// de/en-Gegenstücke einander zugeordnet werden.
function classify(pathname) {
  if (pathname === 'en/' || pathname.startsWith('en/')) {
    return { locale: 'en', key: pathname.slice('en/'.length) };
  }
  return { locale: DEFAULT_LOCALE, key: pathname };
}

export default function singleSitemap({ extraPages = [] } = {}) {
  let site;

  return {
    name: 'single-sitemap',
    hooks: {
      'astro:config:done': ({ config }) => {
        site = config.site;
      },

      'astro:build:done': async ({ pages, dir, logger }) => {
        if (!site) {
          logger?.warn('Kein `site` gesetzt — sitemap.xml wird übersprungen.');
          return;
        }
        const origin = site.replace(/\/$/, '');
        const toUrl = (pathname) => `${origin}/${pathname}`;

        // 1) Von Astro gebaute Seiten (404 raus), nach key/locale gruppieren.
        const built = pages.map((p) => p.pathname).filter((pathname) => pathname !== '404/');

        const groups = new Map(); // key -> Map<locale, url>
        for (const pathname of built) {
          const { locale, key } = classify(pathname);
          if (!groups.has(key)) groups.set(key, new Map());
          groups.get(key).set(locale, toUrl(pathname));
        }

        // 2) Alle URL-Einträge sammeln: { loc, alternates: [{hreflang, href}] }.
        const entries = [];
        for (const localeMap of groups.values()) {
          // Alternates nur, wenn der Pfad in mehreren Sprachen existiert.
          const alternates =
            localeMap.size > 1
              ? LOCALE_ORDER.filter((l) => localeMap.has(l)).map((l) => ({
                  hreflang: l,
                  href: localeMap.get(l),
                }))
              : [];
          for (const loc of localeMap.values()) {
            entries.push({ loc, alternates });
          }
        }

        // 3) Eigenständige Tool-Apps (feste Einzel-URLs, keine Alternates).
        for (const loc of extraPages) {
          entries.push({ loc: loc.replace(/\/$/, '/'), alternates: [] });
        }

        // Deduplizieren und stabil (alphabetisch) sortieren.
        const seen = new Set();
        const unique = entries.filter((e) => {
          if (seen.has(e.loc)) return false;
          seen.add(e.loc);
          return true;
        });
        unique.sort((a, b) => a.loc.localeCompare(b.loc));

        // 4) XML rendern.
        const body = unique
          .map((e) => {
            const alts = e.alternates
              .map(
                (a) =>
                  `    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${xmlEscape(a.href)}" />`,
              )
              .join('\n');
            return `  <url>\n    <loc>${xmlEscape(e.loc)}</loc>${alts ? '\n' + alts : ''}\n  </url>`;
          })
          .join('\n');

        const xml =
          `<?xml version="1.0" encoding="UTF-8"?>\n` +
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
          `${body}\n` +
          `</urlset>\n`;

        const outDir = fileURLToPath(dir);
        await writeFile(path.join(outDir, 'sitemap.xml'), xml, 'utf-8');

        // Falls noch alte Index-/Chunk-Dateien im Build-Ausgabeverzeichnis
        // liegen (z.B. aus einem früheren Build), entfernen — damit nur die
        // eine sitemap.xml ausgeliefert wird.
        await Promise.allSettled([
          rm(path.join(outDir, 'sitemap-index.xml'), { force: true }),
          rm(path.join(outDir, 'sitemap-0.xml'), { force: true }),
        ]);

        logger?.info(`sitemap.xml mit ${unique.length} URLs geschrieben.`);
      },
    },
  };
}
