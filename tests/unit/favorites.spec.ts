import { describe, expect, it } from 'vitest';
import {
  parseFavorites,
  serializeFavorites,
  toggleFavorite,
  type FavoriteItem,
} from '../../src/islands/favorites/favorites';

const item = (key: string): FavoriteItem => ({
  key,
  title: key,
  description: '',
  link: `/${key}/`,
  badge: '',
  svg: '',
});

describe('parseFavorites', () => {
  it('liest gespeicherte Einträge', () => {
    const raw = serializeFavorites([item('tools.a'), item('tools.b')]);
    expect(parseFavorites(raw, new Set()).map((f) => f.key)).toEqual(['tools.a', 'tools.b']);
  });

  it('ignoriert Altformat, ungültige und ausgeblendete Einträge', () => {
    const raw = JSON.stringify([
      'tools.x',
      null,
      42,
      { title: 'ohne key' },
      item('tools.a'),
      item('tools.hidden'),
    ]);
    expect(parseFavorites(raw, new Set(['tools.hidden'])).map((f) => f.key)).toEqual(['tools.a']);
  });

  it('ergänzt fehlende Felder mit sicheren Standardwerten', () => {
    expect(parseFavorites(JSON.stringify([{ key: 'tools.a' }]), new Set())).toEqual([
      { key: 'tools.a', title: '', description: '', link: '#', badge: '', svg: '' },
    ]);
  });

  it.each([null, '', 'kein json', '{"key":"x"}', '"text"'])('liefert [] für %j', (raw) => {
    expect(parseFavorites(raw, new Set())).toEqual([]);
  });
});

describe('toggleFavorite', () => {
  it('fügt hinzu und entfernt, ohne die Eingabe zu verändern', () => {
    const start = [item('tools.a')];
    const added = toggleFavorite(start, item('tools.b'));
    expect(added.map((f) => f.key)).toEqual(['tools.a', 'tools.b']);
    expect(start).toHaveLength(1);
    expect(toggleFavorite(added, item('tools.a')).map((f) => f.key)).toEqual(['tools.b']);
  });
});
