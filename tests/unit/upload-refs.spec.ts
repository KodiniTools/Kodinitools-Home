/**
 * /uploads-Verweise in media.json:
 * - collectUploadRefs (Admin-Veröffentlichen) findet Verweise in allen Feldern,
 *   auch Seiten-Hintergrundbilder (site.bgImage/bgImageDark), damit sie in Git
 *   nachgesichert werden.
 * - Jedes referenzierte Bild liegt in public/uploads, sonst meldet Lighthouse
 *   einen 404-Konsolenfehler (Best Practices).
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { collectUploadRefs } from '../../server/admin/src/publish.js';
import mediaJson from '../../src/content/media.json';

describe('collectUploadRefs', () => {
  it('sammelt verschachtelte Verweise aus Objekten und Arrays', () => {
    const refs = collectUploadRefs({
      site: {
        bgImage: '/uploads/a.webp',
        bgImageDark: '/uploads/b.webp',
        sections: { audio: { light: { image: '/uploads/de/c.webp' } } },
      },
      de: { heroBanner: '/uploads/de/d.webp', heroGrid: ['/uploads/de/e.webp', ''] },
      en: { heroDesign: { light: { bgSlides: ['/uploads/en/f.webp'] } } },
    });
    expect([...refs].sort()).toEqual([
      '/uploads/a.webp',
      '/uploads/b.webp',
      '/uploads/de/c.webp',
      '/uploads/de/d.webp',
      '/uploads/de/e.webp',
      '/uploads/en/f.webp',
    ]);
  });

  it('ignoriert leere Werte, externe URLs und Nicht-Strings', () => {
    const refs = collectUploadRefs({
      a: '',
      b: 'https://example.com/uploads/x.webp',
      c: '/images/y.webp',
      d: 42,
      e: null,
      f: [true, undefined],
    });
    expect(refs.size).toBe(0);
  });
});

describe('media.json', () => {
  it('verweist nur auf Bilder, die in public/uploads liegen', () => {
    const images = [...collectUploadRefs(mediaJson)].filter((u) =>
      /\.(png|jpe?g|webp|avif|gif|svg)$/i.test(u),
    );
    const missing = images.filter((u) => !existsSync(join(process.cwd(), 'public', u)));
    expect(missing).toEqual([]);
  });
});
