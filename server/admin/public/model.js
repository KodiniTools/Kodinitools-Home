// Datenmodell des Adminbereichs: der zentrale App-Zustand plus alle reinen
// Hilfsfunktionen zum Erzeugen/Normalisieren von Ticker- und Medien-Daten sowie
// Pfad-Helfer für verschachtelte Overrides. Keine DOM-/API-Abhängigkeiten.
//
// Aufgeteilt in Teilmodule (diese Datei bündelt sie, alle Importe bleiben bei
// './model.js'): model-core.js (Helfer, Konstanten, Pfade, Navigation),
// model-state.js (App-Zustand), model-ticker.js, model-hero.js, model-toolcards.js,
// model-grid.js, model-site.js, model-sectionmedia.js, model-media.js.

import { state } from './model-state.js';
import { emptyTicker } from './model-ticker.js';
import { defaultMedia } from './model-media.js';

export * from './model-core.js';
export * from './model-state.js';
export * from './model-ticker.js';
export * from './model-hero.js';
export * from './model-toolcards.js';
export * from './model-grid.js';
export * from './model-site.js';
export * from './model-sectionmedia.js';
export * from './model-media.js';

// Zustand mit Standardwerten füllen – erst hier, nachdem alle Teilmodule geladen
// sind (model-state.js selbst importiert nichts, damit kein Import-Kreis entsteht).
state.ticker = { de: emptyTicker(), en: emptyTicker() }; // style ist pro Sprache Teil des Tickers
state.media = defaultMedia();
state.loadedMedia = defaultMedia(); // Fallback für nicht aufgelöste Staging-Refs beim Speichern
