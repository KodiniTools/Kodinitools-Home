/**
 * Startseite im modernen Design: Hilfen aus src/content/modernHome.ts und die
 * neuen DE/EN-Texte (src/i18n/home-ui.ts, Abschnitt `modern`).
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  featureIconId,
  modernCatOf,
  modernIconOf,
  MODERN_ICONS,
  PARTICLE_ICONS,
  TILE_LAYERS,
  splitAccent,
  stripAccent,
} from '../../src/content/modernHome';
import { HOME_UI } from '../../src/i18n/home-ui';

describe('splitAccent / stripAccent', () => {
  it('ohne Sternchen: ein Teil ohne Akzent', () => {
    expect(splitAccent('Kostenlose Tools')).toEqual([{ text: 'Kostenlose Tools', accent: false }]);
    expect(splitAccent('')).toEqual([]);
  });
  it('Text zwischen *…* wird Akzent', () => {
    expect(splitAccent('Tools für *Audio, Bild* und Text')).toEqual([
      { text: 'Tools für ', accent: false },
      { text: 'Audio, Bild', accent: true },
      { text: ' und Text', accent: false },
    ]);
  });
  it('einzelnes Sternchen bleibt als Zeichen stehen', () => {
    expect(splitAccent('5* Tool')).toEqual([{ text: '5* Tool', accent: false }]);
    expect(splitAccent('*A* und *B')).toEqual([
      { text: 'A', accent: true },
      { text: ' und *B', accent: false },
    ]);
  });
  it('stripAccent entfernt nur paarige Sternchen', () => {
    expect(stripAccent('Tools für *Audio* und Text')).toBe('Tools für Audio und Text');
    expect(stripAccent('5* Tool')).toBe('5* Tool');
  });
});

describe('Reiter und Icons', () => {
  it('ordnet Karten den vier Reitern zu', () => {
    expect(modernCatOf('tools.audioConverter')).toBe('audio');
    expect(modernCatOf('imageTools.imageConverter')).toBe('image');
    expect(modernCatOf('diverseTools.colorExtractor')).toBe('image');
    expect(modernCatOf('diverseTools.videoConverter')).toBe('video');
    expect(modernCatOf('diverseTools.textEditor')).toBe('text');
  });
  it('jedes Icon existiert im Sprite', () => {
    for (const key of ['tools.audioConverter', 'tools.unbekannt', 'diverseTools.textEditor']) {
      expect(MODERN_ICONS).toHaveProperty(modernIconOf(key));
    }
    expect(featureIconId('free')).toBe('f-free');
    expect(featureIconId('gibtsnicht')).toBe('f-check');
  });
});

describe('3D-Kachel', () => {
  it('hat 30 Bild-Ebenen von hinten nach vorn, vorne die helle Kante', () => {
    expect(TILE_LAYERS.map((l) => l.depth)).toEqual(Array.from({ length: 30 }, (_, i) => 30 - i));
    expect(TILE_LAYERS.at(-1)?.src).toBe('/image/home/tile/tile-layer-5.webp');
    expect(TILE_LAYERS[0].src).toBe('/image/home/tile/tile-layer-4.webp');
    for (const l of TILE_LAYERS) expect(existsSync(join('public', l.src)), l.src).toBe(true);
    // Handy: jede dritte Ebene und die Kante (10 Ebenen, gleiche Dicke).
    expect(TILE_LAYERS.filter((l) => !l.fine).map((l) => l.depth)).toEqual([
      30, 27, 24, 21, 18, 15, 12, 9, 6, 1,
    ]);
  });
  it('aufsteigende Icons existieren im Sprite', () => {
    for (const id of PARTICLE_ICONS) expect(MODERN_ICONS).toHaveProperty(id);
  });
});

describe('Texte DE/EN (Abschnitt modern)', () => {
  it('beide Sprachen haben dieselben, nicht leeren Schlüssel', () => {
    const de = HOME_UI.de.modern as unknown as Record<string, unknown>;
    const en = HOME_UI.en.modern as unknown as Record<string, unknown>;
    const flat = (o: Record<string, unknown>, pre = ''): [string, unknown][] =>
      Object.entries(o).flatMap(([k, v]) =>
        v && typeof v === 'object'
          ? flat(v as Record<string, unknown>, `${pre}${k}.`)
          : [[`${pre}${k}`, v]],
      );
    const deFlat = flat(de);
    expect(deFlat.map(([k]) => k)).toEqual(flat(en).map(([k]) => k));
    for (const [k, v] of [...deFlat, ...flat(en)]) {
      expect(typeof v === 'string' && v.trim() !== '', k).toBe(true);
    }
  });
});
