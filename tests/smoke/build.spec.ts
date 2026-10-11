/**
 * Smoke-Tests gegen die Build-Ausgabe (dist/).
 *
 * Sie sichern ab, was bei Umbauten (Content Collections, i18n-Routing, …) nicht
 * kaputtgehen darf: dieselben URLs, korrekte Sprache, Canonical, hreflang-Paare
 * und eine vollständige Sitemap. Vorher muss `npm run build` gelaufen sein –
 * `npm run test:smoke` erledigt beides.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import expectedFiles from '../fixtures/build-files.json';
import mediaJson from '../../src/content/media.json';

const SITE = 'https://kodinitools.com';
const DIST = join(process.cwd(), 'dist');

if (!existsSync(join(DIST, 'index.html'))) {
  throw new Error('dist/ fehlt – zuerst `npm run build` ausführen (oder `npm run test:smoke`).');
}

/** Alle Dateien unter dist/ als Pfade relativ zu dist/ mit „/“. */
function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory()
      ? listFiles(full)
      : [relative(DIST, full).split(sep).join('/')];
  });
}

const allFiles = listFiles(DIST);
const buildFiles = allFiles
  .filter((f) => /\.(html|xml|json)$/.test(f))
  .filter((f) => !f.startsWith('fontawesome/') && !f.startsWith('partials/'))
  .sort();

/** Inhaltsseiten = alle index.html-Dateien (ohne 404 und SSI-Partials). */
const pages = buildFiles.filter((f) => f === 'index.html' || f.endsWith('/index.html'));

/** dist-Pfad → öffentliche URL, z. B. „blog/x/index.html“ → „https://kodinitools.com/blog/x/“. */
const urlOf = (file: string) => `${SITE}/${file.replace(/index\.html$/, '')}`;
/** Öffentliche URL → dist-Pfad. */
const fileOf = (url: string) => `${url.slice(SITE.length + 1)}index.html`;

const read = (file: string) => readFileSync(join(DIST, file), 'utf-8');

function attr(html: string, pattern: RegExp): string[] {
  return [...html.matchAll(pattern)].map((m) => m[1] ?? '');
}

function head(file: string) {
  const html = read(file);
  const alternates = Object.fromEntries(
    [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map((m) => [
      m[1],
      m[2],
    ]),
  ) as Record<string, string>;
  return {
    lang: attr(html, /<html[^>]*\slang="([^"]+)"/g)[0],
    canonicals: attr(html, /<link rel="canonical" href="([^"]+)"/g),
    title: attr(html, /<title>([^<]*)<\/title>/g)[0]?.trim() ?? '',
    description: attr(html, /<meta name="description" content="([^"]*)"/g)[0] ?? '',
    alternates,
  };
}

describe('Build-Ausgabe', () => {
  it('erzeugt genau die erwarteten Seiten und Dateien (URL-Stabilität)', () => {
    // Bei gewollten neuen/entfernten Seiten tests/fixtures/build-files.json anpassen.
    expect(buildFiles).toEqual(expectedFiles);
  });

  it('enthält die 404-Seite', () => {
    expect(allFiles).toContain('404.html');
  });
});

describe.each(pages)('Seite %s', (file) => {
  const meta = head(file);
  const expectedLang = file.startsWith('en/') ? 'en' : 'de';

  it(`hat <html lang="${expectedLang}">`, () => {
    expect(meta.lang).toBe(expectedLang);
  });

  it('hat genau einen Canonical auf die eigene URL', () => {
    expect(meta.canonicals).toEqual([urlOf(file)]);
  });

  it('hat Titel und Meta-Description', () => {
    expect(meta.title.length).toBeGreaterThan(0);
    expect(meta.description.length).toBeGreaterThan(0);
  });

  it('hat wechselseitige hreflang-Paare (de/en/x-default)', () => {
    const { de, en } = meta.alternates;
    expect(de, 'hreflang="de" fehlt').toBeTruthy();
    expect(en, 'hreflang="en" fehlt').toBeTruthy();
    expect(meta.alternates['x-default']).toBe(de);
    expect(meta.alternates[expectedLang]).toBe(urlOf(file));

    const other = expectedLang === 'de' ? en : de;
    expect(pages, `Gegenstück ${other} nicht gebaut`).toContain(fileOf(other));
    expect(head(fileOf(other)).alternates[expectedLang]).toBe(urlOf(file));
  });
});

describe('sitemap.xml', () => {
  const xml = read('sitemap.xml');
  const locs = attr(xml, /<loc>([^<]+)<\/loc>/g);

  it('enthält jede Inhaltsseite', () => {
    for (const file of pages) expect(locs).toContain(urlOf(file));
  });

  it('enthält keine doppelten URLs', () => {
    expect(new Set(locs).size).toBe(locs.length);
  });

  it('enthält nur absolute URLs der Domain', () => {
    for (const loc of locs) expect(loc.startsWith(`${SITE}/`)).toBe(true);
  });
});

// Die Einbindung in alle HTML-Seiten übernimmt nginx (sub_filter vor </body>).
it('liefert /kt-heartbeat.js aus', () => {
  expect(allFiles).toContain('kt-heartbeat.js');
});

it('bindet /kt-heartbeat.js nicht selbst ein (sonst doppelt neben nginx)', () => {
  for (const file of pages) expect(read(file), file).not.toContain('/kt-heartbeat.js');
});

describe.each(['blog/index.html', 'en/blog/index.html'])('Blog-Übersicht %s', (file) => {
  it('hebt keinen Beitrag separat hervor, alle stehen in der Liste', () => {
    const html = read(file);
    expect(html).not.toMatch(/class="blog-featured-card"/);
    const listStart = html.indexOf('class="blog-grid');
    expect(listStart).toBeGreaterThan(-1);
    expect(html.indexOf('data-slug=')).toBeGreaterThan(listStart);
  });
});

describe.each(['blog/search-index.json', 'en/blog/search-index.json'])('%s', (file) => {
  it('ist gültiges JSON und verweist nur auf gebaute Blogartikel', () => {
    const index = JSON.parse(read(file)) as Record<string, string>;
    const urls = Object.keys(index);
    expect(urls.length).toBeGreaterThan(0);
    for (const path of urls) expect(pages).toContain(fileOf(`${SITE}${path}`));
  });
});

describe.each(pages)('Bild-URLs in %s', (file) => {
  it('og:image, twitter:image und JSON-LD-Bilder zeigen auf gebaute Dateien', () => {
    const html = read(file);
    const urls = [
      ...attr(html, /<meta (?:property|name)="(?:og:image|twitter:image)" content="([^"]+)"/g),
      ...[
        ...html.matchAll(
          /"(?:url|image)":"(https:\/\/kodinitools\.com\/[^"]+\.(?:png|jpe?g|webp))"/g,
        ),
      ].map((m) => m[1] ?? ''),
    ];
    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls) {
      expect(url.startsWith(`${SITE}/`), url).toBe(true);
      expect(allFiles, url).toContain(url.slice(SITE.length + 1));
    }
  });

  it('nutzt die einheitliche theme-color', () => {
    expect(attr(read(file), /<meta name="theme-color" content="([^"]+)"/g)).toEqual(['#014f99']);
  });
});

describe('Barrierearme Variante', () => {
  it.each([...pages, '404.html'])('%s setzt class="kt-a11y" auf <html>', (file) => {
    expect(read(file)).toMatch(/<html[^>]*\sclass="kt-a11y"/);
  });
});

describe('JavaScript-Budget (Vue-Islands)', () => {
  const jsFiles = allFiles.filter((f) => f.startsWith('_astro/') && f.endsWith('.js'));
  const gzipSize = (file: string) => gzipSync(readFileSync(join(DIST, file))).length;

  it('alle Island-Bundles zusammen ≤ 40 KB gzip', () => {
    const total = jsFiles.reduce((sum, f) => sum + gzipSize(f), 0);
    expect(total).toBeLessThanOrEqual(40 * 1024);
  });

  it('Vue wird nur auf Seiten mit Island geladen (Startseiten)', () => {
    const withIslands = pages.filter((file) => read(file).includes('<astro-island'));
    expect(withIslands.sort()).toEqual(['en/index.html', 'index.html']);
  });
});

describe('Ladeverhalten (PageSpeed)', () => {
  it.each(pages)('%s lädt keine render-blockierenden Stylesheets', (file) => {
    expect(read(file)).not.toMatch(/<link[^>]+rel="stylesheet"[^>]+href="[^"]*\/_astro\//);
  });

  it.each(['index.html', 'en/index.html'])('%s lädt keine Videos sofort (nur lazy)', (file) => {
    const videos = read(file).match(/<video[^>]*>/g) ?? [];
    for (const video of videos) {
      expect(video).toContain('preload="none"');
      expect(video).not.toContain('autoplay');
    }
  });

  it.each(['index.html', 'en/index.html'])('%s hydriert Islands erst im Leerlauf', (file) => {
    for (const island of read(file).match(/<astro-island[^>]*>/g) ?? []) {
      expect(island).toContain('client="idle"');
    }
  });
});

describe('Hero-Titel (LCP)', () => {
  it.each(['index.html', 'en/index.html'])('%s rendert den Titel vollständig im HTML', (file) => {
    const html = read(file);
    const title = /<h1 class="hero-title"[^>]*>([^<]+)<\/h1>/.exec(html)?.[1]?.trim() ?? '';
    expect(title.length).toBeGreaterThan(10);
    expect(html).not.toContain('id="typedText"');
  });
});

describe('Navigation (Tablet-Breite)', () => {
  // Die volle Leiste braucht etwa 1020px; darunter muss das Hamburger-Menü greifen,
  // sonst liegen Hell/Dunkel und DE/EN ausserhalb des Bildschirms.
  it.each(['index.html', 'en/index.html', 'blog/index.html', 'en/faq/index.html'])(
    '%s schaltet erst ab 1024px auf die volle Leiste um',
    (file) => {
      const html = read(file);
      const rule = /@media\s*\(max-width:\s*(\d+)px\)\s*\{[^@]*?\.global-nav-hamburger\[[^\]]*\]\{display:flex\}/.exec(html);
      expect(rule, 'Media-Query des Hamburger-Menüs').not.toBeNull();
      expect(Number(rule?.[1])).toBeGreaterThanOrEqual(1024);
    },
  );
});

describe('Verkleinerte Bildfassungen (srcset)', () => {
  it.each(['index.html', 'en/index.html'])('%s: jede srcset-Fassung liegt im Build', (file) => {
    const html = read(file);
    const urls = [...html.matchAll(/\/(_astro\/rsz\/[^\s",]+)/g)].map((m) => m[1]);
    for (const u of urls) expect(existsSync(join(DIST, u)), u).toBe(true);
  });
});

describe('Seiten-Layout (Admin > Layout)', () => {
  // Folgt der Einstellung in media.json: Klassisch = HTML ohne Attribut und ohne
  // Kompakt-CSS, Kompakt = Attribut an #app und die Regeln inline.
  const site = (mediaJson as { site?: { homeLayout?: string; catBar?: boolean } }).site;
  const compact = site?.homeLayout === 'compact';
  const catBar = compact && site?.catBar !== false;
  it.each(['index.html', 'en/index.html'])(`%s entspricht dem Layout aus media.json`, (file) => {
    const html = read(file);
    if (compact) {
      expect(html).toContain('<div id="app" data-home-layout="compact"');
      expect(html).toContain("#app[data-home-layout='compact'] .hero-content");
    } else {
      expect(html).not.toContain('data-home-layout');
      expect(html).not.toContain('data-hero-media');
      expect(html).not.toContain('data-media-pos');
      expect(html).not.toContain('id="image-tools"');
    }
    // Kategorie-Leiste: Sprunglinks zeigen auf vorhandene Sektionen.
    if (catBar) {
      for (const id of ['audio-tools', 'image-tools', 'diverse-tools']) {
        expect(html).toContain(`href="#${id}"`);
        expect(html).toContain(`id="${id}"`);
      }
    } else {
      expect(html).not.toContain('class="cat-bar"');
    }
  });
});
