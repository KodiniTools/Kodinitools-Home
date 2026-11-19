/** Alt-Texte hochgeladener Bilder: Seite (imageAltFor), Admin-Modell und Server-Prüfung. */
import { beforeEach, describe, expect, it } from 'vitest';
import {
  imageAltFor,
  getMedia,
  IMAGE_ALT_DECORATIVE,
  type MediaConfig,
} from '../../src/content/content';
import { IMAGE_ALT_DECORATIVE as ADMIN_TAB_DECORATIVE } from '../../server/admin/app/tabs/files/filesData';
import { validateMedia } from '../../server/admin/src/content';
import {
  normImageAlt,
  IMAGE_ALT_DECORATIVE as ADMIN_MODEL_DECORATIVE,
  getImageAlt,
  setImageAlt,
  updateMediaUrlEverywhere,
  defaultMediaLocale,
} from '../../server/admin/public/model-media';
import { state } from '../../server/admin/public/model-state';

describe('imageAltFor (Seite)', () => {
  const media = { imageAlt: { '/uploads/de/a.webp': '  Ein Logo ' } } as unknown as MediaConfig;
  it('nimmt den Admin-Text, sonst den Standard', () => {
    expect(imageAltFor(media, '/uploads/de/a.webp', 'Bild 1')).toBe('  Ein Logo ');
    expect(imageAltFor(media, '/uploads/de/b.webp', 'Bild 1')).toBe('Bild 1');
    expect(imageAltFor(media, '', 'x')).toBe('x');
    expect(imageAltFor({} as MediaConfig, '/a', 'x')).toBe('x');
  });
  it('dekorativ: bewusst leeres alt, kein Standardtext', () => {
    const m = { imageAlt: { '/a.png': IMAGE_ALT_DECORATIVE } } as unknown as MediaConfig;
    expect(imageAltFor(m, '/a.png', 'Bild 1')).toBe('');
  });
  it('Markierung ist in Seite, Admin-Modell und Tab gleich', () => {
    expect(ADMIN_MODEL_DECORATIVE).toBe(IMAGE_ALT_DECORATIVE);
    expect(ADMIN_TAB_DECORATIVE).toBe(IMAGE_ALT_DECORATIVE);
  });
  it('Standard-Medien haben keine Alt-Texte', () => {
    expect(getMedia('de').imageAlt).toEqual({});
    expect(getMedia('en').imageAlt).toEqual({});
  });
});

describe('Admin-Modell', () => {
  beforeEach(() => {
    state.media = {
      site: {},
      de: defaultMediaLocale(),
      en: defaultMediaLocale(),
    } as unknown as typeof state.media;
  });

  it('normImageAlt: nur /-Schlüssel mit Text, getrimmt', () => {
    expect(
      normImageAlt({ '/u/a.png': ' Hallo ', 'x.png': 'nein', '/u/b.png': '', '/u/c': 5 }),
    ).toEqual({
      '/u/a.png': 'Hallo',
    });
    expect(normImageAlt(null)).toEqual({});
    expect(normImageAlt([])).toEqual({});
  });

  it('setImageAlt/getImageAlt je Sprache, leer entfernt, Länge begrenzt', () => {
    setImageAlt('de', '/uploads/de/a.png', ' Logo ');
    setImageAlt('en', '/uploads/de/a.png', 'x'.repeat(300));
    expect(getImageAlt('de', '/uploads/de/a.png')).toBe('Logo');
    expect(getImageAlt('en', '/uploads/de/a.png')).toHaveLength(200);
    setImageAlt('de', '/uploads/de/a.png', '');
    expect(getImageAlt('de', '/uploads/de/a.png')).toBe('');
    expect(state.media.de.imageAlt).toEqual({});
  });

  it('Alt-Texte ziehen beim Verschieben der Datei mit', () => {
    setImageAlt('de', '/uploads/a.png', 'Logo');
    updateMediaUrlEverywhere('/uploads/a.png', '/uploads/de/a.png');
    expect(getImageAlt('de', '/uploads/a.png')).toBe('');
    expect(getImageAlt('de', '/uploads/de/a.png')).toBe('Logo');
  });
});

describe('Server-Prüfung (validateMedia)', () => {
  it('normalisiert imageAlt, verwirft leere, lehnt Unsinn ab', () => {
    const m = validateMedia({
      de: { imageAlt: { '/uploads/de/a.png': ' Logo ', '/uploads/de/b.png': '  ' } },
      en: {},
    });
    expect(m.de.imageAlt).toEqual({ '/uploads/de/a.png': 'Logo' });
    expect(m.en.imageAlt).toEqual({});
    expect(() => validateMedia({ de: { imageAlt: { 'a.png': 'x' } } })).toThrow(/Schlüssel/);
    expect(() => validateMedia({ de: { imageAlt: { '/a.png': 'x'.repeat(201) } } })).toThrow(
      /zu lang/,
    );
    expect(() => validateMedia({ de: { imageAlt: 'x' } })).toThrow(/Objekt/);
  });
});
