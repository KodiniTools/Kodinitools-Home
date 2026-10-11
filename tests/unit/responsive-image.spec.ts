/**
 * Verkleinerte Bildfassungen (srcset): Seite und Build-Integration müssen dieselben
 * URLs verwenden, sonst zeigt srcset auf fehlende Dateien.
 */
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { uploadSrcset } from '../../src/content/responsiveImage';
import { collectRszJobs } from '../../rsz-integration.mjs';

const pub = mkdtempSync(join(tmpdir(), 'rsz-'));
mkdirSync(join(pub, 'uploads/de'), { recursive: true });
writeFileSync(join(pub, 'uploads/de/banner-ab12.webp'), 'x');

describe('uploadSrcset', () => {
  it('listet kleinere Fassungen und das Original', () => {
    expect(uploadSrcset('/uploads/de/banner-ab12.webp', 1000, '/', pub)).toBe(
      '/_astro/rsz/480/uploads/de/banner-ab12.webp.webp 480w, ' +
        '/_astro/rsz/640/uploads/de/banner-ab12.webp.webp 640w, ' +
        '/_astro/rsz/960/uploads/de/banner-ab12.webp.webp 960w, ' +
        '/uploads/de/banner-ab12.webp 1000w',
    );
  });

  it('beachtet den Base-Pfad der Vorschau', () => {
    expect(uploadSrcset('/uploads/de/banner-ab12.webp', 600, '/admin/preview/', pub)).toBe(
      '/admin/preview/_astro/rsz/480/uploads/de/banner-ab12.webp.webp 480w, /uploads/de/banner-ab12.webp 600w',
    );
  });

  it('nichts bei kleinem Bild, fehlender Datei, Video oder fremdem Pfad', () => {
    expect(uploadSrcset('/uploads/de/banner-ab12.webp', 400, '/', pub)).toBeUndefined();
    expect(uploadSrcset('/uploads/de/fehlt.webp', 1800, '/', pub)).toBeUndefined();
    expect(uploadSrcset('/uploads/de/clip.mp4', 1800, '/', pub)).toBeUndefined();
    expect(uploadSrcset('/images/logo.png', 1800, '/', pub)).toBeUndefined();
    expect(uploadSrcset('/uploads/../secret.png', 1800, '/', pub)).toBeUndefined();
    expect(uploadSrcset(undefined, 1800, '/', pub)).toBeUndefined();
  });
});

describe('collectRszJobs', () => {
  it('findet genau die Fassungen, die uploadSrcset ausgibt', () => {
    const srcset = uploadSrcset('/uploads/de/banner-ab12.webp', 1000, '/admin/preview/', pub);
    const jobs = collectRszJobs(`<img srcset="${srcset}">`);
    expect(jobs).toEqual([
      { width: 480, rel: 'uploads/de/banner-ab12.webp' },
      { width: 640, rel: 'uploads/de/banner-ab12.webp' },
      { width: 960, rel: 'uploads/de/banner-ab12.webp' },
    ]);
  });

  it('ignoriert Pfade mit ..', () => {
    expect(collectRszJobs('_astro/rsz/480/uploads/../x.webp.webp')).toEqual([]);
  });
});
