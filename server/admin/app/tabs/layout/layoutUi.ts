import { reactive, ref } from 'vue';
import type { ThemeMode } from '../../../types';

/**
 * UI-Zustand des Tabs „Layout“ (nicht gespeichert), modulweit, damit er ein
 * Neu-Mounten (Sprachwechsel, Rückgängig, Einfügen) übersteht – wie die
 * Modul-Variable `bannerPrevMode` in `public/layout-banner.js`.
 */
export const lyUi = reactive<{
  /** In Vorschau und Seitenleiste „Banner-Design“ bearbeiteter Modus. */
  prevMode: ThemeMode;
  /** Aktuell gezeigtes Bild der Vorschau-Diashow (0 = Banner selbst). */
  slideIdx: number;
}>({
  prevMode: 'light',
  slideIdx: 0,
});

/**
 * Änderungszähler für Schreibzugriffe am Proxy vorbei (Service-Setter, andere
 * Sprache): erhöhen → alle Anzeigen lesen neu.
 */
export const lyRev = ref(0);
