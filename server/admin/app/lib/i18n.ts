/**
 * Minimaler i18n-Adapter für die Ui-Bausteine (`components/ui`), die wie im
 * Modernen Musikplayer `useI18n()` aus `lib/i18n` erwarten. Die Admin-Oberfläche
 * ist deutschsprachig; die Inhalte der Seite (DE/EN) pflegt der Admin getrennt,
 * davon ist dieser Adapter unabhängig. Unbekannte Schlüssel kommen unverändert zurück.
 */
import { computed, type ComputedRef } from 'vue';

export interface I18nApi {
  t: (key: string) => string;
  locale: ComputedRef<string>;
}

/** Schlüssel wie im Musikplayer (`src/locales/de.json`), flach mit Punkt. */
export const ADMIN_UI_MESSAGES: Readonly<Record<string, string>> = {
  'common.close': 'Schließen',
  'colorField.pickColor': 'Farbe wählen',
  'colorField.hue': 'Farbton',
  'colorField.saturation': 'Sättigung',
  'colorField.lightness': 'Helligkeit',
  'colorField.hex': 'Hex-Wert',
  'colorField.invalidHex': 'Ungültiger Hex-Wert (z. B. #ff8800)',
  'sliderField.value': 'Wert',
  'sliderField.reset': 'Auf Standard zurücksetzen',
};

const locale = computed(() => 'de');

export function useI18n(): I18nApi {
  return { t: (key: string): string => ADMIN_UI_MESSAGES[key] ?? key, locale };
}
