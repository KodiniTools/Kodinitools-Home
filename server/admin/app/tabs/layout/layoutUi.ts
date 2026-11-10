import { reactive, ref } from 'vue';
import type { ThemeMode } from '../../../types';

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
}>({
  prevMode: 'light',
  slideIdx: 0,
  activeCell: null,
  selSeq: 0,
  gridTick: 0,
});

/**
 * Änderungszähler für Schreibzugriffe am Proxy vorbei (Service-Setter, andere
 * Sprache): erhöhen → alle Anzeigen lesen neu.
 */
export const lyRev = ref(0);
