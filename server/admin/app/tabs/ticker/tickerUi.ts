import { reactive } from 'vue';
import type { ThemeMode } from '../../../types';

/**
 * Reiner UI-Zustand des Laufband-Tabs (nicht gespeichert), modulweit, damit er
 * ein Neu-Mounten übersteht (Undo/Redo, Sprach- oder Tab-Wechsel) – wie
 * `tkEditTheme` im bisherigen `public/ticker.ts`.
 */
export const tickerUi = reactive<{ editMode: ThemeMode; designOpen: boolean }>({
  editMode: 'light',
  designOpen: false,
});
