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
  /** Werkbank: Plakette und Filter nach Verarbeitung (Admin > Layout). */
  procLabel: Record<'browser' | 'server' | 'hybrid', string>;
  procFilterLabel: string;
  procFilterAll: string;
  procNoResults: string;
  /** Abschnitt „Workflows“ (Admin > Layout > Workflows). */
  workflows: { title: string; intro: string; hint: string };
  /** Such-Overlay (Strg/Cmd + K, Admin > Layout > Suche). */
  palette: {
    trigger: string;
    keyHint: string;
    keyHintMac: string;
    title: string;
    placeholder: string;
    noResults: string;
    favorites: string;
    recent: string;
    all: string;
    results: string;
    help: string;
    close: string;
  };
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
    procLabel: { browser: 'Im Browser', server: 'Server (DE)', hybrid: 'Hybrid' },
    procFilterLabel: 'Tools nach Verarbeitung filtern',
    procFilterAll: 'Alle',
    procNoResults: 'Keine Tools in dieser Auswahl.',
    workflows: {
      title: 'Workflows: Tools kombinieren',
      intro:
        'Viele Aufgaben brauchen zwei oder drei Schritte. Diese Ketten zeigen, welche Tools Sie nacheinander nutzen.',
      hint: 'Laden Sie das Ergebnis herunter und wählen Sie die Datei im nächsten Schritt aus. Alles ohne Registrierung.',
    },
    palette: {
      trigger: 'Tool finden',
      keyHint: 'Strg K',
      keyHintMac: '⌘ K',
      title: 'Tools durchsuchen',
      placeholder: 'Aufgabe, Tool oder Format, z. B. „lauter machen“, „schneiden“, „HEX“',
      noResults: 'Kein Tool gefunden. Versuchen Sie einen anderen Begriff oder ein Dateiformat.',
      favorites: 'Favoriten',
      recent: 'Zuletzt genutzt',
      all: 'Alle Tools',
      results: 'Treffer',
      help: '↑ ↓ wählen · Enter öffnen · Esc schließen',
      close: 'Schließen',
    },
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
    procLabel: { browser: 'In the browser', server: 'Server (DE)', hybrid: 'Hybrid' },
    procFilterLabel: 'Filter tools by processing',
    procFilterAll: 'All',
    procNoResults: 'No tools in this selection.',
    workflows: {
      title: 'Workflows: combine tools',
      intro:
        'Many tasks take two or three steps. These chains show which tools to use one after the other.',
      hint: 'Download the result and select the file in the next step. No registration needed.',
    },
    palette: {
      trigger: 'Find a tool',
      keyHint: 'Ctrl K',
      keyHintMac: '⌘ K',
      title: 'Search tools',
      placeholder: 'Task, tool or format, e.g. “make louder”, “trim”, “HEX”',
      noResults: 'No tool found. Try another term or a file format.',
      favorites: 'Favorites',
      recent: 'Recently used',
      all: 'All tools',
      results: 'Results',
      help: '↑ ↓ select · Enter open · Esc close',
      close: 'Close',
    },
    heroCellAlt: (index) => `Image ${index + 1}`,
  },
};
