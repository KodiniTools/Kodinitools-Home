/**
 * Hintergrund-Muster (Admin > Hintergrund > Muster): Seite (content.ts) und
 * Admin-Vorschau (model-site.js) erzeugen identisches CSS, Server und Admin
 * kennen dieselben Arten, und alles bleibt reines CSS (keine Bilder/url()).
 */
import { describe, expect, it } from 'vitest';
import { validateMedia } from '../../server/admin/content.mjs';
import {
  SITE_PATTERNS as ADMIN_PATTERNS,
  normSite,
  sitePatternLayers as adminLayers,
} from '../../server/admin/public/model-site.js';
import { SITE_PATTERNS, sitePatternLayers } from '../../src/content/content';

const NEW = ['cross', 'diagonal', 'diamond', 'triangles', 'waves', 'blueprint'];

describe('Hintergrund-Muster', () => {
  it('Seite und Admin kennen dieselben Arten inkl. der neuen', () => {
    expect([...SITE_PATTERNS]).toEqual(ADMIN_PATTERNS);
    for (const p of NEW) expect(SITE_PATTERNS).toContain(p);
  });

  it.each(NEW)('Server und Admin übernehmen %s für Hell und Dunkel', (p) => {
    const site = { bgPattern: p, bgPatternDark: p };
    expect(validateMedia({ site, de: {}, en: {} }).site).toMatchObject(site);
    expect(normSite(site)).toMatchObject(site);
  });

  it('unbekannte Art fällt auf kein Muster zurück', () => {
    expect(normSite({ bgPattern: 'hexagon' }).bgPattern).toBe('none');
    expect(sitePatternLayers('hexagon', '#014f99', 24, 1, 12)).toEqual([]);
  });

  const cases = SITE_PATTERNS.flatMap((p) =>
    [
      [4, 1, 0],
      [24, 1, 12],
      [80, 2, 10],
      [77, 3, 33],
      [200, 6, 100],
    ].map(([sp, t, op]) => [p, sp, t, op] as const),
  );
  it.each(cases)(
    '%s (Abstand %i, Stärke %i, Deckkraft %i): Seite = Admin, reines CSS',
    (p, sp, t, op) => {
      const site = sitePatternLayers(p, '#e8a945', sp, t, op);
      const admin = adminLayers({
        pattern: p,
        patternColor: '#e8a945',
        patternSpacing: sp,
        patternThickness: t,
        patternOpacity: op,
      });
      expect(site).toEqual(admin);
      if (p === 'none') return expect(site).toEqual([]);
      expect(site.length).toBeGreaterThan(0);
      for (const layer of site) {
        expect(layer).not.toMatch(/url\(|NaN|undefined|Infinity/);
        expect(layer).toMatch(/ repeat$/);
      }
    },
  );

  it('Punktraster und Gitter bleiben unverändert (kein Regress)', () => {
    expect(sitePatternLayers('dots', '#014f99', 24, 1, 12)).toEqual([
      'radial-gradient(circle, rgba(1, 79, 153, 0.12) 1px, transparent 1.5px) 0 0 / 24px 24px repeat',
    ]);
    expect(sitePatternLayers('grid', '#014f99', 80, 2, 10)).toEqual([
      'linear-gradient(rgba(1, 79, 153, 0.1) 2px, transparent 2px) 0 0 / 80px 80px repeat',
      'linear-gradient(90deg, rgba(1, 79, 153, 0.1) 2px, transparent 2px) 0 0 / 80px 80px repeat',
    ]);
  });
});
