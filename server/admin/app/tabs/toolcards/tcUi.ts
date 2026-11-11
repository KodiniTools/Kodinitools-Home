import { reactive, ref } from 'vue';
import type { ThemeMode } from '../../../types';

/**
 * UI-Zustand des Tabs „Tool-Karten“ (nicht gespeichert), modulweit, damit er
 * ein Neu-Mounten (Sprachwechsel, Rückgängig) übersteht – wie die
 * Modul-Variablen in `public/toolcards.ts`.
 */
export const tcUi = reactive<{
  /** In Vorschau und offener Seitenleiste bearbeiteter Modus. */
  prevMode: ThemeMode;
  /** Modus der Übersicht „Alle Karten“. */
  ovTheme: ThemeMode;
  ovOpen: boolean;
  /** '' = Standard für alle Karten, sonst "sektion.key". */
  selected: string;
  /** Zielkarten für „Design übertragen“. */
  targets: Set<string>;
}>({
  prevMode: 'light',
  ovTheme: 'light',
  ovOpen: false,
  selected: '',
  targets: new Set(),
});

/**
 * Änderungszähler: Gelesen und geschrieben wird über rohe (nicht reaktive)
 * Objekte des Admin-Zustands; jede Änderung erhöht den Zähler, alle Anzeigen
 * hängen davon ab und werden neu berechnet.
 */
export const tcRev = ref(0);
