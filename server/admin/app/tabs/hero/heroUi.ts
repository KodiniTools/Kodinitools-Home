import { reactive, ref } from 'vue';
import type { ThemeMode } from '../../../types';
import { HD_PREVIEW_HEIGHT, type HeroPartKind } from './heroData';

/** In der Vorschau gewählter Teil (Chip mit Schlüssel, CTA, Titel, Untertitel). */
export interface HeroSel {
  kind: HeroPartKind;
  key: string;
}

/**
 * UI-Zustand des Tabs „Hero-Design“ (nicht gespeichert), modulweit, damit er
 * ein Neu-Mounten (Sprachwechsel, Rückgängig) übersteht – wie die
 * Modul-Variablen `hdPrevMode`, `hdSelected`, `hdPrevHeight` in `public/design.ts`.
 */
export const hdUi = reactive<{
  /** In Vorschau und offener Seitenleiste bearbeiteter Modus. */
  prevMode: ThemeMode;
  /** Zuletzt in der Vorschau angeklickter Teil (bleibt markiert). */
  selected: HeroSel | null;
  /** Zähler je Auswahl-Klick: springt auch bei erneutem Klick auf denselben Teil. */
  selSeq: number;
  /** Vom Admin gezogene Höhe des Vorschau-Rahmens (px). */
  prevHeight: number;
  /** Aktuell gezeigtes Bild der Vorschau-Diashow (0 = Hintergrundbild). */
  slideIdx: number;
}>({
  prevMode: 'light',
  selected: null,
  selSeq: 0,
  prevHeight: HD_PREVIEW_HEIGHT,
  slideIdx: 0,
});

/**
 * Änderungszähler für Schreibzugriffe am Proxy vorbei (Service-Funktionen,
 * andere Sprache, globale Schrift): erhöhen → alle Anzeigen lesen neu.
 */
export const hdRev = ref(0);
