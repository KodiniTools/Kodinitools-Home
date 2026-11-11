/**
 * Server-Module des Admins (server/admin/*.mjs, per @ts-check typisiert):
 * Die Typisierung darf das Laufzeitverhalten der Validierung und der
 * Authentifizierung nicht ändern.
 */
import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword, verifySessionToken } from '../../server/admin/auth.mjs';
import { validateTicker, validateMedia, validateOverrides } from '../../server/admin/content.mjs';
import { needsAdminBuild } from '../../server/admin/codeupdate.mjs';
import { isAppPath } from '../../server/admin/appbundle.mjs';

describe('auth.mjs', () => {
  it('hashPassword/verifyPassword: richtig vs. falsch', async () => {
    const h = await hashPassword('geheim123');
    expect(h).toMatch(/^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
    expect(await verifyPassword('geheim123', h)).toBe(true);
    expect(await verifyPassword('falsch!!', h)).toBe(false);
    expect(await verifyPassword('geheim123', 'kaputt')).toBe(false);
  });

  it('verifySessionToken lehnt Nicht-Strings und Fälschungen ab', () => {
    expect(verifySessionToken(undefined)).toBe(false);
    expect(verifySessionToken(42)).toBe(false);
    expect(verifySessionToken('abc.def')).toBe(false);
  });
});

describe('content.mjs', () => {
  it('validateTicker normalisiert Einträge und verwirft unsichere Links', () => {
    const t = validateTicker({
      enabled: true,
      speed: 'turbo',
      items: [
        { text: 'Hallo', link: '/tools' },
        { id: 'x', text: 'Welt' },
      ],
    });
    expect(t.enabled).toBe(true);
    expect(t.speed).toBe('normal');
    expect(t.items).toEqual([
      { id: '1', text: 'Hallo', link: '/tools' },
      { id: 'x', text: 'Welt' },
    ]);
    expect(() => validateTicker({ items: [{ text: 'x', link: 'javascript:alert(1)' }] })).toThrow(
      /muss \/ oder http/,
    );
    expect(() => validateTicker(null)).toThrow();
  });

  it('validateMedia: alte flache Struktur gilt für beide Sprachen', () => {
    const m = validateMedia({ sectionVideos: { audio: '/videos/a.mp4' } });
    expect(m.de.sectionVideos.audio).toBe('/videos/a.mp4');
    expect(m.en.sectionVideos.audio).toBe('/videos/a.mp4');
    expect(() => validateMedia({ de: { sectionVideos: { audio: 'java script' } } })).toThrow(
      /ungültig/,
    );
  });

  it('validateOverrides verlangt ein Objekt', () => {
    expect(() => validateOverrides([])).toThrow();
    expect(validateOverrides({ a: 1 })).toEqual({ a: 1 });
  });
});

describe('codeupdate.mjs / appbundle.mjs', () => {
  it('needsAdminBuild erkennt Vue-relevante Dateien', () => {
    expect(needsAdminBuild('server/admin/app/main.ts')).toBe(true);
    expect(needsAdminBuild('server/admin/public/model-core.js')).toBe(true);
    expect(needsAdminBuild('server/admin/public/publish.js')).toBe(false);
  });

  it('isAppPath', () => {
    expect(isAppPath('/app')).toBe(true);
    expect(isAppPath('/app/main.js')).toBe(true);
    expect(isAppPath('/apple')).toBe(false);
  });
});
