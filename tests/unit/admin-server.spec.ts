/**
 * Server-Module des Admins (server/admin/src/*.ts):
 * Die Typisierung darf das Laufzeitverhalten der Validierung und der
 * Authentifizierung nicht ändern.
 */
import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword, verifySessionToken } from '../../server/admin/src/auth.js';
import {
  validateTicker,
  validateMedia,
  validateOverrides,
} from '../../server/admin/src/content.js';
import { needsAdminBuild, needsServerBuild } from '../../server/admin/src/codeupdate.js';
import { isAppPath } from '../../server/admin/src/appbundle.js';

describe('auth.ts', () => {
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

describe('content.ts', () => {
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

describe('codeupdate.ts / appbundle.ts', () => {
  it('needsAdminBuild erkennt gebündelte Frontend-Dateien', () => {
    expect(needsAdminBuild('server/admin/app/main.ts')).toBe(true);
    expect(needsAdminBuild('server/admin/public/model-core.ts')).toBe(true);
    expect(needsAdminBuild('server/admin/public/publish')).toBe(true);
    expect(needsAdminBuild('server/admin/types.ts')).toBe(true);
    expect(needsAdminBuild('server/admin/src/content.ts')).toBe(false);
  });

  it('needsServerBuild erkennt Server-Quellen und das Build-Skript', () => {
    expect(needsServerBuild('server/admin/src/content.ts')).toBe(true);
    expect(needsServerBuild('server/admin/build-server.mjs')).toBe(true);
    expect(needsServerBuild('server/admin/index.mjs')).toBe(false);
    expect(needsServerBuild('server/admin/public/core')).toBe(false);
  });

  it('isAppPath', () => {
    expect(isAppPath('/app')).toBe(true);
    expect(isAppPath('/app/main.js')).toBe(true);
    expect(isAppPath('/apple')).toBe(false);
  });
});
