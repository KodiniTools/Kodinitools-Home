/**
 * Typisiertes Admin-Datenmodell (server/admin/types.ts + @ts-check in model-*.js):
 * Laufzeitverhalten der typisierten Helfer bleibt unverändert, und die
 * abgeleiteten Typen passen zu dem, was die Normalisierung liefert.
 */
import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  state,
  normTicker,
  emptyTicker,
  normalizeMedia,
  defaultMedia,
  getMediaVal,
  setMediaVal,
  defMediaVal,
  getPath,
  setPath,
  delPath,
  normHexOrEmpty,
  rgbaFromHex,
  clampSpacing,
  MEDIA_KEYS,
  SUBTABS,
  normHeroLayout,
  normTextPos,
  normPosPct,
  normSite,
  normToolCardText,
  normHeroDesign,
  allImageSlots,
  navLang,
  isLangSection,
  normGridSlideshow,
} from '../../server/admin/public/model.js';
import type {
  AdminState,
  Lang,
  MediaKey,
  MediaState,
  SubtabKey,
  TickerConfig,
} from '../../server/admin/types.ts';

describe('Admin-Modell: Typen', () => {
  it('state ist als AdminState typisiert und nach dem Laden von model.js gefüllt', () => {
    expectTypeOf(state).toEqualTypeOf<AdminState>();
    expect(state.ticker.de).toEqual(emptyTicker());
    expect(state.media.de.heroMode).toBe('banner');
    expect(state.nav).toEqual({ section: 'de', sub: 'ticker' });
  });

  it('normTicker liefert TickerConfig mit eingeschränktem Tempo', () => {
    expectTypeOf(normTicker).returns.toEqualTypeOf<TickerConfig>();
    expectTypeOf<TickerConfig['speed']>().toEqualTypeOf<'slow' | 'normal' | 'fast'>();
    const t = normTicker({ enabled: true, speed: 'turbo', items: [{ id: 3, text: 'Hi' }] });
    expect(t.speed).toBe('normal');
    expect(t.items).toEqual([{ id: '3', text: 'Hi', link: '' }]);
  });

  it('normalizeMedia liefert MediaState mit Literal-Typen für Modus und Einpassung', () => {
    expectTypeOf(normalizeMedia).returns.toEqualTypeOf<MediaState>();
    expectTypeOf<MediaState['de']['heroMode']>().toEqualTypeOf<'banner' | 'grid'>();
    expectTypeOf<MediaState['de']['heroGridFit']>().toEqualTypeOf<'cover' | 'contain'>();
    const m = normalizeMedia({ de: { heroMode: 'grid', heroGridFit: 'x' } });
    expect(m.de.heroMode).toBe('grid');
    expect(m.de.heroGridFit).toBe('cover');
    expect(m.en.heroMode).toBe('banner');
  });

  it('Konstanten tragen Union-Typen', () => {
    expectTypeOf(MEDIA_KEYS).toEqualTypeOf<MediaKey[]>();
    expectTypeOf(SUBTABS[0]!.key).toEqualTypeOf<SubtabKey>();
    expect(SUBTABS.map((t) => t.key)).toEqual([
      'ticker',
      'texts',
      'media',
      'layout',
      'design',
      'background',
      'cards',
      'files',
      'icons',
      'advanced',
    ]);
  });
});

describe('Admin-Modell: Verhalten unverändert', () => {
  it('Medien-Slots lesen/schreiben je Sprache', () => {
    state.media = defaultMedia();
    const lang: Lang = 'en';
    setMediaVal(lang, 'grid2', '/uploads/en/a.webp');
    setMediaVal(lang, 'heroBanner', '/uploads/en/b.webp');
    setMediaVal(lang, 'audio', '/videos/x.mp4');
    expect(getMediaVal('en', 'grid2')).toBe('/uploads/en/a.webp');
    expect(getMediaVal('en', 'heroBanner')).toBe('/uploads/en/b.webp');
    expect(getMediaVal('en', 'audio')).toBe('/videos/x.mp4');
    expect(getMediaVal('de', 'audio')).toBe('/videos/audio-tools.mp4');
    expect(defMediaVal('image')).toBe('/videos/image-tools.mp4');
    expect(defMediaVal('grid0')).toBe('');
  });

  it('Pfad-Helfer legen an, lesen und räumen leere Eltern auf', () => {
    const o: Record<string, unknown> = {};
    setPath(o, ['hero', 'title'], 'X');
    expect(getPath(o, ['hero', 'title'])).toBe('X');
    expect(getPath(o, ['hero', 'missing', 'deep'])).toBeUndefined();
    delPath(o, ['hero', 'title']);
    expect(o).toEqual({});
  });

  it('Farb- und Abstands-Helfer', () => {
    expect(normHexOrEmpty('#abc')).toBe('#abc');
    expect(normHexOrEmpty('red')).toBe('');
    expect(rgbaFromHex('#ff0000', 50)).toBe('rgba(255, 0, 0, 0.5)');
    expect(rgbaFromHex('nope', 50)).toBe('nope');
    expect(clampSpacing('3.3', 0)).toBe(3.5);
    expect(clampSpacing('x', 1)).toBe(1);
  });
});

describe('@ts-check der übrigen Datenmodelle (Verhalten unverändert)', () => {
  it('Listenwerte: Ungültiges (auch Nicht-Strings) fällt auf den Standard zurück', () => {
    expect(normHeroLayout(0)).toBe('grid3');
    expect(normHeroLayout('mosaic')).toBe('mosaic');
    expect(normTextPos('top')).toBe('top');
    expect(normTextPos(1)).toBe('center');
    expect(normPosPct(undefined, 'bottom', 50)).toBe(90);
    expect(normPosPct(undefined, undefined, 40)).toBe(40);
    const site = normSite({ cardWidth: 3, mediaPosDesktop: 'top', bgPattern: ['dots'] });
    expect(site.cardWidth).toBe('medium');
    expect(site.mediaPosDesktop).toBe('top');
    expect(site.bgPattern).toBe('none');
    expect(normToolCardText({ titleTransform: 7, align: 'center' })).toMatchObject({
      titleTransform: '',
      align: 'center',
    });
  });

  it('Hero-Seiten haben alle Bildfelder (Standardwerte aus HERO_IMG_FIELDS)', () => {
    const hd = normHeroDesign(null);
    expect(hd.light).toMatchObject({
      bgImage: '',
      bgImageOpacity: 100,
      bgImageDarken: 0,
      bgImageBlur: 0,
      bgImageSaturate: 100,
      bgSlides: [],
    });
    expectTypeOf(hd.dark.bgImageSaturate).toEqualTypeOf<number>();
  });

  it('Bild-Plätze haben get/set und gültige Wurzeln', () => {
    state.media = normalizeMedia({ de: { heroBannerSlides: ['/uploads/de/a.webp'] } });
    const slots = allImageSlots();
    expect(slots.length).toBeGreaterThan(0);
    for (const s of slots) {
      expect(['site', 'de', 'en']).toContain(s.root);
      expect(typeof s.get()).toBe('string');
    }
    const slide = slots.find((s) => s.path.join('.') === 'heroBannerSlides.0')!;
    expect(slide.get()).toBe('/uploads/de/a.webp');
    slide.set('  /uploads/de/b.webp ');
    expect(state.media.de.heroBannerSlides[0]).toBe('/uploads/de/b.webp');
  });
});

describe('Navigations-Helfer (PR B)', () => {
  it('navLang liefert nur de/en – auch im Veröffentlichen-Bereich', () => {
    const prev = state.nav.section;
    state.nav.section = 'en';
    expect(navLang()).toBe('en');
    state.nav.section = 'publish';
    expect(navLang()).toBe('de');
    state.nav.section = 'de';
    expect(navLang()).toBe('de');
    state.nav.section = prev;
    expectTypeOf(navLang()).toEqualTypeOf<Lang>();
  });

  it('isLangSection erkennt nur Sprachbereiche', () => {
    expect(isLangSection('de')).toBe(true);
    expect(isLangSection('en')).toBe(true);
    expect(isLangSection('publish')).toBe(false);
    expect(isLangSection(undefined)).toBe(false);
  });

  it('normGridSlideshow setzt stagger immer als boolean', () => {
    expect(typeof normGridSlideshow(undefined).stagger).toBe('boolean');
    expect(typeof normGridSlideshow({ stagger: 'x' }).stagger).toBe('boolean');
  });
});
