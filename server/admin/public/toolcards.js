// @ts-check
// Tool-Karten-Tab (eine Sprache): Rahmen und Hintergrund der Tool-Karten der
// Startseite detailliert gestalten – ein Standard-Design für alle Karten plus
// optionale Einzel-Designs je Karte, getrennt für Hell- und Dunkelmodus.
// Live-Vorschau: die aktuell bearbeitete Karte bleibt beim Scrollen als
// Sticky-Vorschau (Hell + Dunkel nebeneinander, echter Hover) sichtbar; darunter
// zeigt eine Übersicht alle Karten mit ihrem effektiven Design, wie sie nach dem
// Veröffentlichen aussehen. Gespeichert wird in media.<lang>.toolCards; die
// Seite liest es über content.ts (getToolCardsCss) als --tc-*-CSS-Variablen.

import { $ } from './core.js';
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
import { objUrl, openMediaPicker } from './media.js';
import { ensureFontFace } from './fonts.js';
import { mountVueTab } from './islands.js';

/** @import { Lang, ThemeMode, ObjPath, AnyObj } from '../types.ts' */

const SECTIONS = TOOL_CARD_SECTIONS;
/** Overrides einer Sprache als beschreibbares Objekt. */
const ovr = (/** @type {Lang} */ lang) => /** @type {AnyObj} */ (state.overrides[lang]);

/** @param {ThemeMode} theme */
function sideDefault(theme) {
  return theme === 'dark' ? toolCardSideDark() : toolCardSideLight();
}
// Effektiver Wert eines Locale-Pfads (Override, sonst Standard). '' zählt bei
// svg als „bewusst entfernt" (wie im Icons-Tab).
/**
 * @param {Lang} lang
 * @param {ObjPath} path
 */
function effText(lang, path) {
  const o = getPath(state.overrides[lang], path);
  if (o !== undefined) return typeof o === 'string' ? o : '';
  const d = getPath(state.defaults[lang], path);
  return typeof d === 'string' ? d : '';
}
// Standardtext (Sprachdatei) eines Karten-Felds, ohne Override.
/**
 * @param {Lang} lang
 * @param {ObjPath} path
 */
function defText(lang, path) {
  const d = getPath(state.defaults[lang], path);
  return typeof d === 'string' ? d : '';
}
// Alle Tool-Karten der Sprache (Reihenfolge wie auf der Startseite).
/** @param {Lang} lang */
function cardList(lang) {
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
/** @param {ThemeMode} theme */
function pageBg(theme) {
  return siteBgLayerCss(theme);
}

// --- Hintergrundbild der Karte (je Modus) ---
// Vorschau-URL (staged:<id> -> Objekt-URL des Browsers), '' ohne Bild.
/** @param {string} val */
function cardImageUrl(val) {
  if (!val) return '';
  return val.startsWith('staged:') ? objUrl(val.slice(7)) : val;
}

// Zustandsgebundene Teile für die Vue-Fassung (app/tabs/toolcards): Karten-Liste,
// Text-Overrides, Karten anlegen/löschen/ausblenden über model.ts.
/**
 * @param {Lang} lang
 * @returns {import('../app/tabs/toolcards/tcData').TcService}
 */
export function tcService(lang) {
  /** @type {Lang} */
  const other = lang === 'de' ? 'en' : 'de';
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
    effText: (/** @type {ObjPath} */ path) => effText(lang, path),
    defText: (/** @type {ObjPath} */ path) => defText(lang, path),
    hasOverride: (/** @type {ObjPath} */ path) =>
      getPath(state.overrides[lang], path) !== undefined,
    setOverride: (/** @type {ObjPath} */ path, /** @type {unknown} */ v) =>
      setPath(ovr(lang), path, v),
    delOverride: (/** @type {ObjPath} */ path) => delPath(ovr(lang), path),
    copyToOtherLang: () => {
      state.media[other].toolCards = JSON.parse(JSON.stringify(getToolCards(lang)));
      if (!state.media[other].toolCards) state.media[other].toolCards = defaultToolCards();
    },
    pageBg,
    globalFont: getGlobalFont,
    fonts: () => state.fonts,
    ensureFontFace,
    resolveUrl: cardImageUrl,
    pick: (/** @type {string} */ title, /** @type {(url: string) => void} */ onPick) => {
      const srv = [lang, /** @type {const} */ ('shared')].reduce(
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
