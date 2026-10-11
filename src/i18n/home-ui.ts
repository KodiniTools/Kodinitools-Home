// Feste UI-Texte der Startseite (nicht im Admin editierbar) je Sprache.
// Admin-editierbare Texte kommen aus src/locales/*.json über content.ts.

import type { Lang } from './lang';

export interface HomeUi {
  /** Fallback, wenn hero.title leer ist (auch für die Tipp-Animation). */
  heroTitleFallback: string;
  cta: string;
  favoritesTitle: string;
  favoritesClearAll: string;
  imageToolsTitle: string;
  favAdd: string;
  favRemove: string;
  favTitle: string;
  open: string;
  /** Beschriftung der Kategorie-Leiste (Kompakt-Layout) für Screenreader. */
  catNavLabel: string;
  /** Alt-Text einer Hero-Kachel (Index ab 0). */
  heroCellAlt: (index: number) => string;
}

export const HOME_UI: Record<Lang, HomeUi> = {
  de: {
    heroTitleFallback: 'Kostenlose Online-Tools für Audio & Bild',
    cta: 'Jetzt starten',
    favoritesTitle: 'Meine Favoriten',
    favoritesClearAll: 'Alle entfernen',
    imageToolsTitle: 'Bild Tools',
    favAdd: 'Zu Favoriten hinzufügen',
    favRemove: 'Aus Favoriten entfernen',
    favTitle: 'Favorit',
    open: 'Öffnen',
    catNavLabel: 'Tool-Kategorien',
    heroCellAlt: (index) => `Bild ${index + 1}`,
  },
  en: {
    heroTitleFallback: 'Free Online Tools for Audio & Images',
    cta: 'Get Started',
    favoritesTitle: 'My Favorites',
    favoritesClearAll: 'Remove all',
    imageToolsTitle: 'Image Tools',
    favAdd: 'Add to favorites',
    favRemove: 'Remove from favorites',
    favTitle: 'Favorite',
    open: 'Open',
    catNavLabel: 'Tool categories',
    heroCellAlt: (index) => `Image ${index + 1}`,
  },
};
