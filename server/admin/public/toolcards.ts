// Tool-Karten-Tab (eine Sprache): Rahmen und Hintergrund der Tool-Karten der
// Startseite detailliert gestalten – ein Standard-Design für alle Karten plus
// optionale Einzel-Designs je Karte, getrennt für Hell- und Dunkelmodus.
// Live-Vorschau: die aktuell bearbeitete Karte bleibt beim Scrollen als
// Sticky-Vorschau (Hell + Dunkel nebeneinander, echter Hover) sichtbar; darunter
// zeigt eine Übersicht alle Karten mit ihrem effektiven Design, wie sie nach dem
// Veröffentlichen aussehen. Gespeichert wird in media.<lang>.toolCards; die
// Seite liest es über content.ts (getToolCardsCss) als --tc-*-CSS-Variablen.

import { $ } from './core';
import {
  state,
  getToolCards,
  defaultToolCards,
  toolCardSideLight,
  toolCardSideDark,
  TOOL_CARD_BORDER_STYLES,
  siteBgLayerCss,
  getGlobalFont,
  getPath,
  setPath,
  delPath,
  getIconTint,
  defaultToolCardText,
  defaultToolCardShow,
  TOOL_CARD_SHOW_KEYS,
  TOOL_CARD_WEIGHTS,
  TOOL_CARD_TRANSFORMS,
  TOOL_CARD_ALIGNS,
  isCardHidden,
  setCardHidden,
  hiddenCardIds,
  toolCardKeys,
  isCustomCard,
  duplicateCard,
  createCard,
  deleteCustomCard,
  TOOL_CARD_SECTIONS,
  navLang,
} from './model';
import { objUrl, openMediaPicker } from './media';
import { ensureFontFace } from './fonts';
import { mountVueTab } from './islands';

import type { Lang, ThemeMode, ObjPath, AnyObj } from '../types';
import type { TcService } from '../app/tabs/toolcards/tcData';

const SECTIONS = TOOL_CARD_SECTIONS;
/** Overrides einer Sprache als beschreibbares Objekt. */
const ovr = (lang: Lang) => state.overrides[lang] as AnyObj;

function sideDefault(theme: ThemeMode) {
  return theme === 'dark' ? toolCardSideDark() : toolCardSideLight();
}
// Effektiver Wert eines Locale-Pfads (Override, sonst Standard). '' zählt bei
// svg als „bewusst entfernt" (wie im Icons-Tab).
function effText(lang: Lang, path: ObjPath) {
  const o = getPath(state.overrides[lang], path);
  if (o !== undefined) return typeof o === 'string' ? o : '';
  const d = getPath(state.defaults[lang], path);
  return typeof d === 'string' ? d : '';
}
// Standardtext (Sprachdatei) eines Karten-Felds, ohne Override.
function defText(lang: Lang, path: ObjPath) {
  const d = getPath(state.defaults[lang], path);
  return typeof d === 'string' ? d : '';
}
// Alle Tool-Karten der Sprache (Reihenfolge wie auf der Startseite).

function cardList(lang: Lang) {
  const out = [];
  for (const section of SECTIONS) {
    // Karten der Sprachdatei plus im Admin angelegte (Duplikat/neu, nur Override).
    for (const key of toolCardKeys(lang, section)) {
      out.push({
        id: `${section}.${key}`,
        section,
        title: effText(lang, [section, key, 'title']) || key,
        badge: effText(lang, [section, key, 'badge']),
        description: effText(lang, [section, key, 'description']),
        link: effText(lang, [section, key, 'link']),
        svg: effText(lang, [section, key, 'svg']),
        tint: getIconTint(lang, `${section}.${key}`),
        hidden: isCardHidden(`${section}.${key}`), // auf der Seite ausgeblendet (DE + EN)
        custom: isCustomCard(`${section}.${key}`), // im Admin angelegt (löschbar)
      });
    }
  }
  return out;
}

// Seiten-Hintergrund der Vorschau = dieselbe Ebene wie auf der Seite (Farbe mit
// Deckkraft bzw. Verlauf über der Standardfarbe aus dem Tab „Hintergrund"), damit
// der Kontrast der Karten dem echten Ergebnis entspricht.

function pageBg(theme: ThemeMode) {
  return siteBgLayerCss(theme);
}

// --- Hintergrundbild der Karte (je Modus) ---
// Vorschau-URL (staged:<id> -> Objekt-URL des Browsers), '' ohne Bild.

function cardImageUrl(val: string) {
  if (!val) return '';
  return val.startsWith('staged:') ? objUrl(val.slice(7)) : val;
}

// Zustandsgebundene Teile für die Vue-Fassung (app/tabs/toolcards): Karten-Liste,
// Text-Overrides, Karten anlegen/löschen/ausblenden über model.ts.
export function tcService(lang: Lang): TcService {
  const other: Lang = lang === 'de' ? 'en' : 'de';
  return {
    lang,
    toolCards: () => getToolCards(lang),
    cards: () => cardList(lang),
    hiddenIds: hiddenCardIds,
    setHidden: setCardHidden,
    isCustom: isCustomCard,
    duplicate: duplicateCard,
    create: createCard,
    remove: deleteCustomCard,
    effText: (path: ObjPath) => effText(lang, path),
    defText: (path: ObjPath) => defText(lang, path),
    hasOverride: (path: ObjPath) => getPath(state.overrides[lang], path) !== undefined,
    setOverride: (path: ObjPath, v: unknown) => setPath(ovr(lang), path, v),
    delOverride: (path: ObjPath) => delPath(ovr(lang), path),
    copyToOtherLang: () => {
      state.media[other].toolCards = JSON.parse(JSON.stringify(getToolCards(lang)));
      if (!state.media[other].toolCards) state.media[other].toolCards = defaultToolCards();
    },
    pageBg,
    globalFont: getGlobalFont,
    fonts: () => state.fonts,
    ensureFontFace,
    resolveUrl: cardImageUrl,
    pick: (title: string, onPick: (url: string) => void) => {
      const srv = [lang, 'shared' as const].reduce(
        (n, l) => n + (state.serverFiles[l] || []).length,
        0,
      );
      if (!state.stagedItems.length && !srv) return false;
      openMediaPicker(lang, 'tcimg', { imagesOnly: true, title, onPick });
      return true;
    },
    sideDefault,
    textDefault: defaultToolCardText,
    showDefault: defaultToolCardShow,
    borderStyles: TOOL_CARD_BORDER_STYLES,
    weights: TOOL_CARD_WEIGHTS,
    transforms: TOOL_CARD_TRANSFORMS,
    aligns: TOOL_CARD_ALIGNS,
    showKeys: TOOL_CARD_SHOW_KEYS,
    sections: SECTIONS,
  };
}

export function renderToolCards() {
  const lang = navLang();
  const pane = $('#content');
  // Vue-Insel (app/tabs/toolcards).
  mountVueTab(pane, 'toolcards', { service: tcService(lang) });
}
