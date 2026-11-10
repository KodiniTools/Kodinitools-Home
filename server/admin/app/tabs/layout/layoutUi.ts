import { reactive, ref } from 'vue';
import type { ThemeMode } from '../../../types';
import { FpHistory } from './fullPageData';

/**
 * UI-Zustand des Tabs „Layout“ (nicht gespeichert), modulweit, damit er ein
 * Neu-Mounten (Sprachwechsel, Rückgängig, Einfügen) übersteht – wie die
 * Modul-Variablen `bannerPrevMode` (layout-banner.js) und `activeCell` (layout-grid.js).
 */
export const lyUi = reactive<{
  /** In Vorschau und Seitenleiste „Banner-Design“ bearbeiteter Modus. */
  prevMode: ThemeMode;
  /** Aktuell gezeigtes Bild der Vorschau-Diashow (0 = Banner selbst). */
  slideIdx: number;
  /** Zuletzt markierte Kachel (auch Ziel für Strg/Cmd+V außerhalb eines Editors). */
  activeCell: number | null;
  /** Zähler je Klick auf eine Vorschau-Kachel: scrollt die Seitenleisten zur Kachel. */
  selSeq: number;
  /** Schritt der Kachel-Diashow (jede Kachel zeigt Bild `gridTick % Anzahl`). */
  gridTick: number;
  // ---- Ganzseiten-Vorschau ----
  /** Modus der Ganzseiten-Vorschau. */
  fpMode: ThemeMode;
  /** Zuletzt gewähltes Element (Schlüssel wie 'hero', 'card:tools.x', 'text:hero.title'). */
  fpActive: string | null;
  /** Hilfsraster an/aus, Rasterweite (px der Seite), Einrasten. */
  fpGrid: boolean;
  fpStep: number;
  fpSnap: boolean;
}>({
  prevMode: 'light',
  slideIdx: 0,
  activeCell: null,
  selSeq: 0,
  gridTick: 0,
  fpMode: 'light',
  fpActive: null,
  fpGrid: false,
  fpStep: 20,
  fpSnap: true,
});

/** Eigener Verlauf der Ganzseiten-Vorschau (↶ Rückgängig), je Sprache. */
export const fpHist = new FpHistory();

/**
 * Änderungszähler für Schreibzugriffe am Proxy vorbei (Service-Setter, andere
 * Sprache): erhöhen → alle Anzeigen lesen neu.
 */
export const lyRev = ref(0);
