import { reactive } from 'vue';
import type { ThemeMode } from '../../../types';

/**
 * Reiner UI-Zustand des Tabs „Texte“ (nicht gespeichert), modulweit, damit er
 * ein Neu-Mounten übersteht (Undo/Redo, Sprach- oder Tab-Wechsel) – wie
 * `txtPrevMode` im bisherigen `public/content.ts`.
 */
export const textsUi = reactive<{
  /** Bearbeitete Seitenleiste (die andere ist zugeklappt). */
  prevMode: ThemeMode;
  /** Effekt-Bereich je Slot-Schlüssel auf-/zugeklappt (fehlt = automatisch). */
  fxOpen: Record<string, boolean>;
}>({
  prevMode: 'light',
  fxOpen: {},
});
