/**
 * Startseiten-Layout (Admin > Layout > Seiten-Layout „Klassisch / Kompakt"):
 * Server-Validierung und Admin-Modell normalisieren gleich, und das Kompakt-CSS
 * greift nur bei aktivem Schalter (alle Regeln unter #app[data-home-layout]).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateMedia } from '../../server/admin/src/content.js';
import { normSite } from '../../server/admin/public/model-site';

const SCOPE = "#app[data-home-layout='compact']";

describe.each([
  ['Server (content.mjs)', (site: unknown) => validateMedia({ site, de: {}, en: {} }).site],
  ['Admin (model-site.ts)', (site: unknown) => normSite(site)],
])('Seiten-Layout %s', (_name, norm) => {
  it('Standard ist Klassisch mit Medien auf dem Handy', () => {
    expect(norm({})).toMatchObject({ homeLayout: 'classic', heroMediaMobile: true });
  });

  it('übernimmt Kompakt und ausgeblendete Medien', () => {
    expect(norm({ homeLayout: 'compact', heroMediaMobile: false })).toMatchObject({
      homeLayout: 'compact',
      heroMediaMobile: false,
    });
  });

  it('Karten: Standard Liste und mittel, übernimmt Kachel und breit', () => {
    expect(norm({})).toMatchObject({ cardForm: 'list', cardWidth: 'medium' });
    expect(norm({ cardForm: 'tile', cardWidth: 'wide' })).toMatchObject({
      cardForm: 'tile',
      cardWidth: 'wide',
    });
    expect(norm({ cardForm: 'raster', cardWidth: 'xl' })).toMatchObject({
      cardForm: 'list',
      cardWidth: 'medium',
    });
  });

  it('Leiste und Sektionsmedien: Standard an, seitlich bzw. unten; übernimmt gültige Werte', () => {
    expect(norm({})).toMatchObject({
      catBar: true,
      catSearch: true,
      mediaPosDesktop: 'side',
      mediaPosMobile: 'bottom',
    });
    expect(
      norm({ catBar: false, catSearch: false, mediaPosDesktop: 'off', mediaPosMobile: 'top' }),
    ).toMatchObject({
      catBar: false,
      catSearch: false,
      mediaPosDesktop: 'off',
      mediaPosMobile: 'top',
    });
    // „seitlich" gibt es nur auf dem Desktop.
    expect(norm({ mediaPosDesktop: 'left', mediaPosMobile: 'side' })).toMatchObject({
      mediaPosDesktop: 'side',
      mediaPosMobile: 'bottom',
    });
  });

  it('Verarbeitung der Tools: Plakette und Filter sind anfangs aus, nur true schaltet ein', () => {
    expect(norm({})).toMatchObject({ toolBadge: false, toolFilter: false });
    expect(norm({ toolBadge: true, toolFilter: true })).toMatchObject({
      toolBadge: true,
      toolFilter: true,
    });
    expect(norm({ toolBadge: 'ja', toolFilter: 1 })).toMatchObject({
      toolBadge: false,
      toolFilter: false,
    });
  });

  it('Workflows: anfangs aus, nur true schaltet ein', () => {
    expect(norm({})).toMatchObject({ workflows: false });
    expect(norm({ workflows: true })).toMatchObject({ workflows: true });
    expect(norm({ workflows: 1 })).toMatchObject({ workflows: false });
  });

  it('Suche Strg+K: anfangs aus, nur true schaltet ein', () => {
    expect(norm({})).toMatchObject({ cmdPalette: false });
    expect(norm({ cmdPalette: true })).toMatchObject({ cmdPalette: true });
    expect(norm({ cmdPalette: 'ja' })).toMatchObject({ cmdPalette: false });
  });

  it('Modernes Design: anfangs aus, nur true schaltet ein', () => {
    expect(norm({})).toMatchObject({ modernDesign: false });
    expect(norm({ modernDesign: true })).toMatchObject({ modernDesign: true });
    expect(norm({ modernDesign: 'ja' })).toMatchObject({ modernDesign: false });
  });

  it('fällt bei unbekanntem Wert auf Klassisch zurück', () => {
    expect(norm({ homeLayout: 'grid', heroMediaMobile: 'nein' })).toMatchObject({
      homeLayout: 'classic',
      heroMediaMobile: true,
    });
  });
});

describe('home-compact.css', () => {
  const css = readFileSync(
    join(process.cwd(), 'src/styles/parts/home-compact.css'),
    'utf-8',
  ).replace(/\/\*[\s\S]*?\*\//g, '');
  // Selektor-Listen vor „{", ohne @media-Zeilen.
  const selectors = [...css.matchAll(/([^{}]+)\{/g)]
    .map((m) => m[1].trim())
    .filter((s) => s && !s.startsWith('@'))
    .flatMap((s) => s.split(',').map((p) => p.trim()));

  it('ausgeblendete Hero-Teile nehmen im Kompakt-Layout keinen Platz ein', () => {
    expect(css).toMatch(
      /#app\[data-home-layout='compact'\] \.hero \.hero-hidden \{\s*display: none;/,
    );
  });

  it('enthält Regeln', () => {
    expect(selectors.length).toBeGreaterThan(10);
  });

  it('beschränkt jede Regel auf das Kompakt-Layout', () => {
    // Ausnahme: html/body nur, solange die Seite das Kompakt-Layout trägt.
    const root = (sel: string) => sel === `html:has(${SCOPE})` || sel === `body:has(${SCOPE})`;
    for (const sel of selectors) expect(sel.startsWith(SCOPE) || root(sel), sel).toBe(true);
  });
});

describe('home-modern.css', () => {
  const MODERN = "#app[data-design='modern']";
  const css = readFileSync(
    join(process.cwd(), 'src/styles/parts/home-modern.css'),
    'utf-8',
  ).replace(/\/\*[\s\S]*?\*\//g, '');
  const selectors = [...css.matchAll(/([^{}]+)\{/g)]
    .map((m) => m[1].trim())
    .filter((s) => s && !s.startsWith('@'))
    .flatMap((s) => s.split(',').map((p) => p.trim()));

  it('enthält Regeln', () => {
    expect(selectors.length).toBeGreaterThan(10);
  });

  it('beschränkt jede Regel auf das moderne Design', () => {
    // Erlaubt: #app[data-design] mit Theme-Präfix und body:has(...) für den Seitenhintergrund.
    for (const sel of selectors) expect(sel.includes(MODERN), sel).toBe(true);
  });

  it('kostet mobil keine Paint-Zeit: keine Animation, kein Blur, kein Web-Font-Import', () => {
    expect(css).not.toMatch(/@keyframes|animation:(?!\s*none)/);
    expect(css).not.toMatch(/filter:\s*blur|backdrop-filter:(?!\s*none)/);
    expect(css).not.toMatch(/@import|fonts\.googleapis/);
    // Fester Hintergrund erzwingt Neuzeichnen beim Scrollen (mobil ~300 ms TBT).
    expect(css).not.toMatch(/\bfixed\b/);
  });
});

describe('home-modern-motion.css', () => {
  const MODERN = "#app[data-design='modern']";
  const css = readFileSync(
    join(process.cwd(), 'src/styles/parts/home-modern-motion.css'),
    'utf-8',
  ).replace(/\/\*[\s\S]*?\*\//g, '');
  // Oberste Ebene: nur @media-Blöcke, deren Inhalt bis zur passenden Klammer reicht.
  const blocks: { query: string; body: string }[] = [];
  let rest = css.trim();
  while (rest) {
    const m = /^@media([^{]+)\{/.exec(rest);
    expect(m, `nur @media auf oberster Ebene: ${rest.slice(0, 60)}`).not.toBeNull();
    let depth = 0;
    let i = m![0].length - 1;
    for (; i < rest.length; i++) {
      if (rest[i] === '{') depth++;
      if (rest[i] === '}' && --depth === 0) break;
    }
    blocks.push({ query: m![1].trim(), body: rest.slice(m![0].length, i) });
    rest = rest.slice(i + 1).trim();
  }

  it('bewegt nur ohne „Bewegung reduzieren"', () => {
    expect(blocks.length).toBeGreaterThan(0);
    for (const b of blocks) expect(b.query).toContain('prefers-reduced-motion: no-preference');
  });

  it('Logo-Kachel und Umgebung ohne Animation, nirgends Blur', () => {
    for (const b of blocks) {
      expect(b.body).not.toMatch(/mh-tile|mh-tp/);
      expect(b.body).not.toMatch(/filter:\s*blur|backdrop-filter/);
    }
    const css = readFileSync(join(__dirname, '../../src/styles/parts/home-modern.css'), 'utf8');
    expect(css).not.toMatch(/mh-tile[^{]*\{[^}]*animation/);
  });

  it('beschränkt jede Regel auf das moderne Design', () => {
    for (const b of blocks) {
      const sels = [
        ...b.body
          .replace(/@keyframes[^{]+\{([^{}]*\{[^{}]*\})*[^{}]*\}/g, '')
          .matchAll(/([^{}]+)\{/g),
      ]
        .map((m) => m[1].trim())
        .flatMap((x) => x.split(',').map((p) => p.trim()));
      expect(sels.length).toBeGreaterThan(0);
      for (const sel of sels) expect(sel.includes(MODERN), sel).toBe(true);
    }
  });
});
