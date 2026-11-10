import { reactive } from 'vue';
import type { ThemeMode } from '../../../types';

/**
 * UI-Zustand des Tabs „Dateien“ (nicht gespeichert), modulweit, damit er ein
 * Neu-Mounten übersteht – wie `filesPrevMode` in `public/media.js`.
 */
export const filesUi = reactive<{ mode: ThemeMode }>({ mode: 'light' });
