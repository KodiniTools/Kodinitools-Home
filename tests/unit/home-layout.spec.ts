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
  });
});
