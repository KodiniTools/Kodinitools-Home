/**
 * Tool-Karten duplizieren / neu anlegen (Admin > Tool-Karten): angelegte Karten
 * existieren nur als Override in DE + EN, erscheinen in der Kartenliste nach den
 * Karten der Sprachdatei und lassen sich wieder vollständig löschen.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import {
  state as adminState,
  defaultMedia,
  getToolCards,
  toolCardKeys,
  isCustomCard,
  uniqueCardKey,
  duplicateCard,
  createCard,
  deleteCustomCard,
  isCardHidden,
} from '../../server/admin/public/model.js';
import { validateMedia } from '../../server/admin/content.mjs';

// Der Admin-Zustand ist untypisiertes JS (Typen aus den Startwerten {} / null);
// für den Test als offene Struktur ansprechen.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Loose = any;
const state = adminState as unknown as { defaults: Loose; overrides: Loose; media: Loose };

const card = (title: string, link: string) => ({
  title,
  badge: 'Badge',
  description: `${title} Beschreibung`,
  link,
  svg: '/image/a.svg',
});

beforeEach(() => {
  state.defaults = {
    de: { tools: { sectionTitle: 'Audio', mp3: card('MP3-Konverter', '/mp3/') } },
    en: { tools: { sectionTitle: 'Audio', mp3: card('MP3 Converter', '/mp3/') } },
  };
  state.overrides = { de: {}, en: {} };
  state.media = defaultMedia();
});

describe('Tool-Karten: Kartenliste', () => {
  it('Standard-Karten zuerst, angelegte (nur Override) danach; Nicht-Karten fehlen', () => {
    state.overrides.de = {
      tools: {
        mp3: { title: 'Geändert' },
        extra: { title: 'X', link: '/x/' },
        kaputt: { title: 'ohne Link' },
      },
    };
    expect(toolCardKeys('de', 'tools')).toEqual(['mp3', 'extra']);
    expect(toolCardKeys('en', 'tools')).toEqual(['mp3']);
    expect(isCustomCard('tools.mp3')).toBe(false);
    expect(isCustomCard('tools.extra')).toBe(true);
    expect(isCustomCard('ungültig')).toBe(false);
  });

  it('uniqueCardKey vermeidet belegte Schlüssel und säubert Zeichen', () => {
    expect(uniqueCardKey('tools', 'mp3')).toBe('mp3-2');
    expect(uniqueCardKey('tools', 'Neue Karte!')).toBe('Neue-Karte');
    expect(uniqueCardKey('tools', '')).toBe('karte');
  });
});

describe('Tool-Karten: Duplizieren', () => {
  it('übernimmt Texte DE + EN (mit Override), Einzel-Design und Icon-Färbung', () => {
    state.overrides.en = { tools: { mp3: { badge: 'Own badge' } } };
    const tcDe = getToolCards('de');
    tcDe.cards['tools.mp3'] = JSON.parse(JSON.stringify(tcDe.default));
    tcDe.cards['tools.mp3'].light.borderColor = '#103ab7';
    state.media.de.iconTint = { 'tools.mp3': { light: '#ff0000', dark: '', bg: '', bgDark: '' } };

    const id = duplicateCard('tools.mp3');
    expect(id).toBe('tools.mp3-kopie');
    expect(state.overrides.de.tools['mp3-kopie']).toEqual({
      ...card('MP3-Konverter', '/mp3/'),
      title: 'MP3-Konverter (Kopie)',
    });
    expect(state.overrides.en.tools['mp3-kopie']).toMatchObject({
      title: 'MP3 Converter (Copy)',
      badge: 'Own badge',
      link: '/mp3/',
    });
    expect(getToolCards('de').cards[id!].light.borderColor).toBe('#103ab7');
    // Kopie ist unabhängig vom Original
    getToolCards('de').cards[id!].light.borderColor = '#000000';
    expect(getToolCards('de').cards['tools.mp3'].light.borderColor).toBe('#103ab7');
    expect(state.media.de.iconTint[id!].light).toBe('#ff0000');
    expect(getToolCards('en').cards[id!]).toBeUndefined(); // EN hatte kein Einzel-Design
    expect(isCardHidden(id)).toBe(false);
    expect(toolCardKeys('de', 'tools')).toEqual(['mp3', 'mp3-kopie']);

    expect(duplicateCard('tools.mp3')).toBe('tools.mp3-kopie-2');
    expect(duplicateCard('ungültig')).toBeNull();
  });
});

describe('Tool-Karten: Neu anlegen und Löschen', () => {
  it('neue Karte: leere Texte DE + EN, Standard-Design, startet ausgeblendet', () => {
    const id = createCard('imageTools');
    expect(id).toBe('imageTools.neue-karte');
    for (const l of ['de', 'en'] as const) {
      expect(state.overrides[l].imageTools['neue-karte']).toEqual({
        title: '',
        badge: '',
        description: '',
        link: '',
        svg: '',
      });
      expect(toolCardKeys(l, 'imageTools')).toEqual(['neue-karte']);
      expect(getToolCards(l).cards[id!]).toBeUndefined();
    }
    expect(isCardHidden(id)).toBe(true);
    expect(createCard('imageTools')).toBe('imageTools.neue-karte-2');
    expect(createCard('unbekannt')).toBeNull();
  });

  it('Löschen entfernt alles der angelegten Karte, Standard-Karten bleiben', () => {
    const id = duplicateCard('tools.mp3')!;
    getToolCards('de').cards[id] = JSON.parse(JSON.stringify(getToolCards('de').default));
    state.media.de.toolCardOffsets = { [id]: { x: 5, y: 0 } };
    state.media.site.hiddenCards = [id];

    expect(deleteCustomCard('tools.mp3')).toBe(false);
    expect(deleteCustomCard(id)).toBe(true);
    expect(state.overrides.de.tools).toBeUndefined();
    expect(state.overrides.en.tools).toBeUndefined();
    expect(getToolCards('de').cards[id]).toBeUndefined();
    expect(state.media.de.toolCardOffsets[id]).toBeUndefined();
    expect(isCardHidden(id)).toBe(false);
    expect(toolCardKeys('de', 'tools')).toEqual(['mp3']);
  });

  it('Server behält Einzel-Design und Ausblenden der angelegten Karte', () => {
    const id = createCard('tools')!;
    const tc = getToolCards('de');
    tc.cards[id] = JSON.parse(JSON.stringify(tc.default));
    const out: Loose = validateMedia(JSON.parse(JSON.stringify(state.media)));
    expect(out.de.toolCards.cards[id]).toBeDefined();
    expect(out.site.hiddenCards).toContain(id);
  });
});
