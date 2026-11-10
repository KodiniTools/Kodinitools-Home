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
