/**
 * Startseiten-Layout (Admin > Layout > Seiten-Layout „Klassisch / Kompakt"):
 * Server-Validierung und Admin-Modell normalisieren gleich, und das Kompakt-CSS
 * greift nur bei aktivem Schalter (alle Regeln unter #app[data-home-layout]).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateMedia } from '../../server/admin/content.mjs';
import { normSite } from '../../server/admin/public/model-site.js';

const SCOPE = "#app[data-home-layout='compact']";

describe.each([
  ['Server (content.mjs)', (site: unknown) => validateMedia({ site, de: {}, en: {} }).site],
  ['Admin (model-site.js)', (site: unknown) => normSite(site)],
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

  it('enthält Regeln', () => {
    expect(selectors.length).toBeGreaterThan(10);
  });

  it('beschränkt jede Regel auf das Kompakt-Layout', () => {
    // Ausnahme: html/body nur, solange die Seite das Kompakt-Layout trägt.
    const root = (sel: string) => sel === `html:has(${SCOPE})` || sel === `body:has(${SCOPE})`;
    for (const sel of selectors) expect(sel.startsWith(SCOPE) || root(sel), sel).toBe(true);
  });
});
