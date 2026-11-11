import { reactive } from 'vue';
import type { ThemeMode } from '../../../types';
import type { SectionKey } from './mediaData';

/**
 * UI-Zustand des Tabs „Medien“ (nicht gespeichert), modulweit, damit gewählte
 * Sektion und Vorschau-Modus ein Neu-Mounten (Undo, Sprachwechsel) überstehen –
 * wie `selected`/`prevMode` in `public/sectionmedia.ts`.
 */
export const mediaUi = reactive<{ section: SectionKey; prevMode: ThemeMode }>({
  section: 'audio',
  prevMode: 'light',
});
