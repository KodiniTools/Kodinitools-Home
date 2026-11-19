/**
 * Suche der Command-Palette: findet Tools nach Aufgabe, Format und Titel in beiden
 * Sprachen, mit echten Titeln und Beschreibungen aus den Locales und den
 * Suchbegriffen aus dem Tool-Katalog.
 */
import { describe, expect, it } from 'vitest';
import { getContent } from '../../src/content/content';
import { TOOL_CATALOG } from '../../src/content/toolCatalog';
import { normalize, searchTools, tokens, type SearchItem } from '../../src/islands/palette/search';

const SECTIONS = ['tools', 'imageTools', 'diverseTools'] as const;

function items(lang: 'de' | 'en'): SearchItem[] {
  const content = (lang === 'en' ? getContent('en') : getContent('de')) as unknown as Record<
    string,
    Record<string, { title?: string; description?: string; link?: string }>
  >;
  const out: SearchItem[] = [];
  for (const section of SECTIONS) {
    for (const [k, v] of Object.entries(content[section] ?? {})) {
      const entry = TOOL_CATALOG[`${section}.${k}`];
      if (!entry || !v || typeof v !== 'object' || !('link' in v)) continue;
      out.push({
        key: `${section}.${k}`,
        title: v.title ?? '',
        description: v.description ?? '',
        keywords: entry.keywords[lang],
        formats: entry.formats,
      });
    }
  }
  return out;
}

const first = (lang: 'de' | 'en', q: string) => searchTools(items(lang), q)[0]?.key;

describe('Palette-Suche – Hilfsfunktionen', () => {
  it('normalize entfernt Akzente, Umlaute und Satzzeichen', () => {
    expect(normalize('Höhen & Bässe – Größe!')).toBe('hohen basse grosse');
  });

  it('tokens ignoriert Füllwörter, außer die Eingabe besteht nur daraus', () => {
    expect(tokens('HEIC in JPG')).toEqual(['heic', 'jpg']);
    expect(tokens('in')).toEqual(['in']);
    expect(tokens('   ')).toEqual([]);
  });

  it('leere Eingabe liefert keine Treffer', () => {
    expect(searchTools(items('de'), '  ')).toEqual([]);
  });
});

describe('Palette-Suche – Deutsch', () => {
  it.each([
    ['lauter machen', 'tools.audioNormalizer'],
    ['schneiden', 'tools.audioCutter'],
    ['HEX', 'diverseTools.colorExtractor'],
    ['Collage', 'imageTools.photoCollage'],
    ['heic in jpg', 'imageTools.imageConverter'],
    ['wecker', 'tools.alarmTool'],
    ['favicon', 'diverseTools.textEditor-kopie'],
    ['tiktok', 'tools.audioVisualizer'],
    ['mkv', 'diverseTools.videoConverter'],
  ])('„%s“ findet zuerst %s', (query, key) => {
    expect(first('de', query)).toBe(key);
  });

  it('Titelwort schlägt Beschreibung', () => {
    expect(first('de', 'texteditor')).toBe('diverseTools.textEditor');
  });

  it('alle Suchwörter müssen passen', () => {
    expect(searchTools(items('de'), 'lauter heic')).toEqual([]);
  });

  it('Format findet mehrere Tools, nicht nur eines', () => {
    const keys = searchTools(items('de'), 'wav').map((i) => i.key);
    expect(keys.length).toBeGreaterThan(3);
    expect(keys).toContain('tools.audioConverter');
  });
});

describe('Palette-Suche – Englisch', () => {
  it.each([
    ['make louder', 'tools.audioNormalizer'],
    ['trim', 'tools.audioCutter'],
    ['color palette', 'diverseTools.colorExtractor'],
    ['heic to jpg', 'imageTools.imageConverter'],
    ['alarm clock', 'tools.alarmTool'],
  ])('„%s“ findet zuerst %s', (query, key) => {
    expect(first('en', query)).toBe(key);
  });
});
