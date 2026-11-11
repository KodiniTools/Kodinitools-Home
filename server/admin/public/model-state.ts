// Zentraler App-Zustand des Adminbereichs. Ohne Importe, damit die Teilmodule
// (model-*.ts) ihn nutzen können, ohne einen Import-Kreis zu bilden: ticker,
// media und loadedMedia werden in model.ts gefüllt, sobald alle Teilmodule
// geladen sind (emptyTicker/defaultMedia liegen dort).
//
// ticker/media/loadedMedia sind bis dahin `null`; sie sind trotzdem als gefüllt
// typisiert, weil jeder Zugriff über model.ts läuft (das sie beim Laden setzt).

import type { AdminState } from '../types';

export const state: AdminState = {
  overrides: { de: {}, en: {} },
  ticker: null as unknown as AdminState['ticker'], // { de, en } – style ist pro Sprache Teil des Tickers (siehe model.ts)
  media: null as unknown as AdminState['media'], // { site, de, en } (siehe model.ts)
  loadedMedia: null as unknown as AdminState['loadedMedia'], // Fallback für nicht aufgelöste Staging-Refs beim Speichern
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
 */
export function navLang(): import('../types.ts').Lang {
  return state.nav.section === 'en' ? 'en' : 'de';
}
