import { describe, expect, it } from 'vitest';
import {
  parseFavoriteKeys,
  parseRecent,
  pushRecent,
  RECENT_MAX,
} from '../../src/islands/palette/recent';

describe('Zuletzt genutzt', () => {
  it('liest nur gültige, eindeutige Schlüssel', () => {
    expect(parseRecent('["a","b","a",1,null,""]')).toEqual(['a', 'b']);
    expect(parseRecent('kaputt')).toEqual([]);
    expect(parseRecent('{"a":1}')).toEqual([]);
    expect(parseRecent(null)).toEqual([]);
  });

  it('pushRecent setzt nach vorn, ohne Doppelte, höchstens RECENT_MAX', () => {
    expect(pushRecent(['a', 'b', 'c'], 'b')).toEqual(['b', 'a', 'c']);
    const full = ['1', '2', '3', '4', '5'];
    const next = pushRecent(full, 'neu');
    expect(next).toHaveLength(RECENT_MAX);
    expect(next[0]).toBe('neu');
    expect(next).not.toContain('5');
  });

  it('Favoriten-Schlüssel aus dem gespeicherten Format, auch bei ungültigem JSON', () => {
    expect(parseFavoriteKeys('[{"key":"tools.x","title":"X"},{"key":""},"alt",{"foo":1}]')).toEqual(
      ['tools.x'],
    );
    expect(parseFavoriteKeys('{')).toEqual([]);
    expect(parseFavoriteKeys(null)).toEqual([]);
  });
});
