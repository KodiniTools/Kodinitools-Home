/**
 * Hero-Design-Vorschau (Admin): zeigt das Banner der Startseite und folgt dem
 * Seiten-Layout (Klassisch / Kompakt), damit Vorschau und Seite übereinstimmen.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { state as adminState } from '../../server/admin/public/model.js';
import {
  heroPreviewMedia,
  heroPreviewMediaStyle,
  HERO_PREVIEW_LAYOUT_CSS,
} from '../../server/admin/public/hero-preview.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const state = adminState as unknown as { media: any };

describe('heroPreviewMedia', () => {
  it('liefert das Einzelbanner (Bild und Video)', () => {
    expect(heroPreviewMedia({ heroMode: 'banner', heroBanner: '/uploads/de/logo.png' })).toEqual({
      src: '/uploads/de/logo.png',
      isVid: false,
    });
    expect(heroPreviewMedia({ heroBanner: '/uploads/de/clip.mp4?v=2' })).toEqual({
      src: '/uploads/de/clip.mp4?v=2',
      isVid: true,
    });
  });

  it('nichts bei Raster, ausgeblendetem oder leerem Banner', () => {
    expect(heroPreviewMedia({ heroMode: 'grid', heroBanner: '/a.png' })).toBeNull();
    expect(heroPreviewMedia({ heroBannerShow: false, heroBanner: '/a.png' })).toBeNull();
    expect(heroPreviewMedia({ heroBanner: '  ' })).toBeNull();
    expect(heroPreviewMedia(undefined)).toBeNull();
  });

  it('löst gestagte Uploads über den Callback auf', () => {
    const r = heroPreviewMedia({ heroBanner: 'staged:abc' }, (id: string) =>
      id === 'abc' ? { src: 'blob:x', isVid: true } : null,
    );
    expect(r).toEqual({ src: 'blob:x', isVid: true });
    expect(heroPreviewMedia({ heroBanner: 'staged:fehlt' }, () => null)).toBeNull();
  });
});

describe('heroPreviewMediaStyle', () => {
  beforeEach(() => {
    state.media = {
      de: {
        heroBannerStyle: {
          light: { borderWidth: 0, shadow: false },
          dark: { borderWidth: 2, borderColor: '#a3b2cb', shadow: true },
        },
      },
    };
  });

  it('Größe je Layout wie auf der Seite', () => {
    expect(heroPreviewMediaStyle('de', 'light', false)).toContain('max-height:240px');
    const c = heroPreviewMediaStyle('de', 'light', true);
    expect(c).toContain('max-height:340px');
    expect(c).toContain('max-width:500px');
  });

  it('Banner-Design je Modus: ohne Rahmen/Schatten bzw. mit', () => {
    const light = heroPreviewMediaStyle('de', 'light', true);
    expect(light).toContain('border:0');
    expect(light).toContain('box-shadow:none');
    const dark = heroPreviewMediaStyle('de', 'dark', true);
    expect(dark).toContain('border:2px solid #a3b2cb');
    expect(dark).not.toContain('box-shadow:none');
  });
});

it('Kompakt-CSS gilt nur mit data-hdlayout="compact"', () => {
  const rules = HERO_PREVIEW_LAYOUT_CSS.split('\n').filter(Boolean);
  expect(rules.length).toBeGreaterThan(0);
  for (const r of rules) expect(r.startsWith('[data-hdbox][data-hdlayout="compact"]')).toBe(true);
});
