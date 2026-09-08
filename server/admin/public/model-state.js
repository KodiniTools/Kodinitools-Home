// Zentraler App-Zustand des Adminbereichs. Ohne Importe, damit die Teilmodule
// (model-*.js) ihn nutzen können, ohne einen Import-Kreis zu bilden: ticker,
// media und loadedMedia werden in model.js gefüllt, sobald alle Teilmodule
// geladen sind (emptyTicker/defaultMedia liegen dort).
export const state = {
  overrides: { de: {}, en: {} },
  ticker: null, // { de, en } – style ist pro Sprache Teil des Tickers (siehe model.js)
  media: null, // { site, de, en } (siehe model.js)
  loadedMedia: null, // Fallback für nicht aufgelöste Staging-Refs beim Speichern
  defaults: { de: {}, en: {} },
  stagedItems: [], // aus IndexedDB (nur im Browser)
  serverFiles: { de: [], en: [], shared: [] }, // Server-Uploads getrennt nach Sprache
  fonts: [], // verfügbare Schriftarten aus /fonts (für die Laufband-Schrift)
  objectUrls: new Map(), // id -> objectURL (für Vorschau)
  nav: { section: 'de', sub: 'ticker' }, // Ebene 1 (de|en|dateien|publish) + Ebene 2
  publishing: false, // läuft gerade eine Veröffentlichung?
};
