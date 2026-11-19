/**
 * Tool-Katalog der Startseite: deckt alle Karten ab (inkl. Admin-Karten), verweist
 * nur auf vorhandene Karten, passt zur Verarbeitung in den Locales (Abweichung nur
 * als „hybrid“) und liefert Suchbegriffe sowie Workflow-Schritte in beiden Sprachen.
 */
import { describe, expect, it } from 'vitest';
import { getContent } from '../../src/content/content';
import { TOOL_CATALOG, TOOL_WORKFLOWS } from '../../src/content/toolCatalog';

const SECTIONS = ['tools', 'imageTools', 'diverseTools'] as const;
type Entry = { link?: unknown; processing?: unknown };

/** Karten-Schlüssel (z. B. „tools.audioConverter“) der gemergten Inhalte einer Sprache. */
function cardKeys(lang: 'de' | 'en'): Map<string, Entry> {
  const content = (lang === 'en' ? getContent('en') : getContent('de')) as unknown as Record<
    string,
    Record<string, unknown>
  >;
  const map = new Map<string, Entry>();
  for (const section of SECTIONS) {
    for (const [k, v] of Object.entries(content[section] ?? {})) {
      if (v && typeof v === 'object' && 'link' in v) map.set(`${section}.${k}`, v as Entry);
    }
  }
  return map;
}

describe.each(['de', 'en'] as const)('Tool-Katalog (%s)', (lang) => {
  const cards = cardKeys(lang);

  it('hat zu jeder Karte der Startseite einen Eintrag', () => {
    const missing = [...cards.keys()].filter((key) => !(key in TOOL_CATALOG));
    expect(missing).toEqual([]);
  });

  it('verweist nur auf vorhandene Karten', () => {
    const unknown = Object.keys(TOOL_CATALOG).filter((key) => !cards.has(key));
    expect(unknown).toEqual([]);
  });

  it('weicht von der Locale nur zu „hybrid“ ab', () => {
    for (const [key, card] of cards) {
      const entry = TOOL_CATALOG[key];
      if (!entry || typeof card.processing !== 'string') continue;
      if (entry.processing === 'hybrid') continue;
      expect(entry.processing, key).toBe(card.processing);
    }
  });

  it('hat Suchbegriffe in dieser Sprache', () => {
    for (const [key, entry] of Object.entries(TOOL_CATALOG)) {
      expect(entry.keywords[lang].length, key).toBeGreaterThan(0);
      for (const word of entry.keywords[lang]) expect(word, key).toBe(word.toLowerCase());
    }
  });
});

describe('Tool-Katalog – Daten', () => {
  it('Formate sind Endungen ohne Punkt in Kleinbuchstaben', () => {
    for (const [key, entry] of Object.entries(TOOL_CATALOG)) {
      expect(entry.formats.length, key).toBeGreaterThan(0);
      for (const ext of entry.formats) expect(ext, key).toMatch(/^[a-z0-9]+$/);
    }
  });

  it('Hybrid-Tools erklären den Serveranteil in DE und EN, andere nicht', () => {
    for (const [key, entry] of Object.entries(TOOL_CATALOG)) {
      if (entry.processing === 'hybrid') {
        expect(entry.hybridNote?.de.length, key).toBeGreaterThan(10);
        expect(entry.hybridNote?.en.length, key).toBeGreaterThan(10);
      } else {
        expect(entry.hybridNote, key).toBeUndefined();
      }
    }
  });

  it('Workflows haben mindestens zwei bekannte Schritte ohne Wiederholung', () => {
    const ids = new Set<string>();
    for (const wf of TOOL_WORKFLOWS) {
      expect(ids.has(wf.id), wf.id).toBe(false);
      ids.add(wf.id);
      expect(wf.steps.length, wf.id).toBeGreaterThanOrEqual(2);
      expect(new Set(wf.steps).size, wf.id).toBe(wf.steps.length);
      for (const step of wf.steps) expect(step in TOOL_CATALOG, `${wf.id}: ${step}`).toBe(true);
      expect(wf.title.de && wf.title.en && wf.description.de && wf.description.en).toBeTruthy();
    }
  });
});
