import { reactive, ref } from 'vue';
import type { ThemeMode } from '../../../types';

/**
 * UI-Zustand des Tabs „Hintergrund“ (nicht gespeichert), modulweit, damit der
 * bearbeitete Modus ein Neu-Mounten übersteht – wie `bgPrevMode` in
 * `public/background.ts`.
 */
export const bgUi = reactive<{ prevMode: ThemeMode }>({ prevMode: 'light' });

/**
 * Änderungszähler: Gelesen und geschrieben wird über die (nicht reaktiven)
 * Service-Funktionen der Vanilla-Seite; jede Änderung erhöht den Zähler, alle
 * Anzeigen hängen davon ab und werden neu berechnet.
 */
export const bgRev = ref(0);
