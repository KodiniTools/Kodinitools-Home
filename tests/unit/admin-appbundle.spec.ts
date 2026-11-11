/**
 * Auslieferung der Vue-Teile unter /admin/app/ (nur innerhalb von dist) und
 * Erkennung, wann die Vorschau sie nach einem Code-Update neu bauen muss.
 */
import { describe, expect, it } from 'vitest';
import { isAppPath, resolveAppFile } from '../../server/admin/src/appbundle.js';
import { needsAdminBuild } from '../../server/admin/src/codeupdate.js';

const DIST = '/srv/repo/server/admin/dist';

describe('appbundle', () => {
  it('erkennt nur /app und /app/…', () => {
    expect(isAppPath('/app')).toBe(true);
    expect(isAppPath('/app/main.js')).toBe(true);
    expect(isAppPath('/apps/main.js')).toBe(false);
    expect(isAppPath('/admin.js')).toBe(false);
  });

  it('löst Dateien innerhalb von dist auf', () => {
    expect(resolveAppFile('/app/main.js', DIST)).toBe(`${DIST}/main.js`);
    expect(resolveAppFile('/app/chunks/a-1.js', DIST)).toBe(`${DIST}/chunks/a-1.js`);
  });

  it('verweigert Verzeichnis und kaputte Kodierung', () => {
    expect(resolveAppFile('/app', DIST)).toBeNull();
    expect(resolveAppFile('/app/', DIST)).toBeNull();
    expect(resolveAppFile('/app/%E0%A4%A', DIST)).toBeNull();
  });

  it('Traversal bleibt in dist (wird auf dist geklemmt, nie darüber hinaus)', () => {
    for (const p of ['/app/../index.mjs', '/app/%2e%2e/%2e%2e/config.mjs', '/app/..%2f..%2fx']) {
      const r = resolveAppFile(p, DIST);
      expect(r === null || r.startsWith(DIST + '/')).toBe(true);
    }
  });
});

describe('needsAdminBuild', () => {
  it('baut bei Frontend-Quellen, Vite-Config und Abhängigkeiten neu', () => {
    expect(needsAdminBuild('server/admin/app/main.ts')).toBe(true);
    expect(needsAdminBuild('vite.admin.config.ts')).toBe(true);
    expect(needsAdminBuild('package-lock.json')).toBe(true);
    expect(needsAdminBuild('server/admin/public/model-core.ts')).toBe(true);
    expect(needsAdminBuild('server/admin/public/design.js')).toBe(true);
    expect(needsAdminBuild('server/admin/public/index.html')).toBe(true);
    expect(needsAdminBuild('server/admin/index.mjs')).toBe(false);
    expect(needsAdminBuild('src/pages/index.astro')).toBe(false);
  });
});
