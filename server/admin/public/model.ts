// Datenmodell des Adminbereichs: der zentrale App-Zustand plus alle reinen
// Hilfsfunktionen zum Erzeugen/Normalisieren von Ticker- und Medien-Daten sowie
// Pfad-Helfer für verschachtelte Overrides. Keine DOM-/API-Abhängigkeiten.
//
// Aufgeteilt in Teilmodule (diese Datei bündelt sie, alle Importe bleiben bei
// './model.ts'): model-core.ts (Helfer, Konstanten, Pfade, Navigation),
// model-state.ts (App-Zustand), model-ticker.ts, model-hero.ts, model-toolcards.ts,
// model-cardlist.ts (Kartenliste, Duplizieren/Neu),
// model-grid.ts, model-site.ts, model-sectionmedia.ts, model-media.ts.

import { state } from './model-state';
import { emptyTicker } from './model-ticker';
import { defaultMedia } from './model-media';

export * from './model-core';
export * from './model-state';
export * from './model-ticker';
export * from './model-hero';
export * from './model-toolcards';
export * from './model-cardlist';
export * from './model-grid';
export * from './model-site';
export * from './model-sectionmedia';
export * from './model-media';

// Zustand mit Standardwerten füllen – erst hier, nachdem alle Teilmodule geladen
// sind (model-state.ts selbst importiert nichts, damit kein Import-Kreis entsteht).
state.ticker = { de: emptyTicker(), en: emptyTicker() }; // style ist pro Sprache Teil des Tickers
state.media = defaultMedia();
state.loadedMedia = defaultMedia(); // Fallback für nicht aufgelöste Staging-Refs beim Speichern
