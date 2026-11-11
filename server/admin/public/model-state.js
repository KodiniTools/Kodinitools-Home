// @ts-check
// Zentraler App-Zustand des Adminbereichs. Ohne Importe, damit die Teilmodule
// (model-*.js) ihn nutzen können, ohne einen Import-Kreis zu bilden: ticker,
// media und loadedMedia werden in model.js gefüllt, sobald alle Teilmodule
// geladen sind (emptyTicker/defaultMedia liegen dort).
//
// ticker/media/loadedMedia sind bis dahin `null`; sie sind trotzdem als gefüllt
// typisiert, weil jeder Zugriff über model.js läuft (das sie beim Laden setzt).

/** @import { AdminState } from '../types.ts' */

/** @type {AdminState} */
export const state = {
  overrides: { de: {}, en: {} },
  ticker: /** @type {AdminState['ticker']} */ (/** @type {unknown} */ (null)), // { de, en } – style ist pro Sprache Teil des Tickers (siehe model.js)
  media: /** @type {AdminState['media']} */ (/** @type {unknown} */ (null)), // { site, de, en } (siehe model.js)
  loadedMedia: /** @type {AdminState['loadedMedia']} */ (/** @type {unknown} */ (null)), // Fallback für nicht aufgelöste Staging-Refs beim Speichern
  defaults: { de: {}, en: {} },
  stagedItems: [], // aus IndexedDB (nur im Browser)
  serverFiles: { de: [], en: [], shared: [] }, // Server-Uploads getrennt nach Sprache
  fonts: [], // verfügbare Schriftarten aus /fonts (für die Laufband-Schrift)
  objectUrls: new Map(), // id -> objectURL (für Vorschau)
  nav: { section: 'de', sub: 'ticker' }, // Ebene 1 (de|en|publish) + Ebene 2
  publishing: false, // läuft gerade eine Veröffentlichung?
};

/**
 * Sprache des offenen Sprach-Bereichs (DE/EN). Die Sprach-Tabs werden nur
 * dort gerendert; im Bereich „Status“ (publish) liefert das 'de'.
 * @returns {import('../types.ts').Lang}
 */
export function navLang() {
  return state.nav.section === 'en' ? 'en' : 'de';
}
