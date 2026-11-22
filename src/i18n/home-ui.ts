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
  /** Modernes Design (Admin > Layout): Texte, für die es keinen Locale-Schlüssel gibt. */
  modern: ModernHomeUi;
}

/** Kategorien der Reiter im modernen Design. */
export type ModernCat = 'audio' | 'image' | 'video' | 'text';

export interface ModernHomeUi {
  eyebrow: string;
  allTools: string;
  searchButton: string;
  searchLabel: string;
  catGroupLabel: string;
  /** Kleine Zeile über dem Sektionstitel je Reiter bzw. bei der Suche. */
  kicker: Record<ModernCat | 'search', string>;
  /** Titel/Beschreibung der Reiter ohne eigene Sektion in den Locales (Video, Text). */
  videoTitle: string;
  videoDescription: string;
  textTitle: string;
  textDescription: string;
  /** „Alle Audio Tools anzeigen“ – {title} = Titel des Reiters. */
  showAll: string;
  /** Beschreibung bei aktiver Suche – {q} = Suchbegriff. */
  searchFor: string;
  nav: {
    label: string;
    tools: string;
    blog: string;
    gallery: string;
    faq: string;
    contact: string;
    search: string;
    theme: string;
    language: string;
    menuOpen: string;
    menuClose: string;
  };
  footerTagline: string;
  imprint: string;
  privacy: string;
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
    modern: {
      eyebrow: 'Online-Tools · Kostenlos · Ohne Registrierung',
      allTools: 'Alle Tools',
      searchButton: 'Suchen',
      searchLabel: 'Tools suchen',
      catGroupLabel: 'Werkzeugkategorien',
      kicker: {
        audio: 'Beliebte Audio-Tools',
        image: 'Kreative Bild-Tools',
        video: 'Video-Tools',
        text: 'Text-Tools',
        search: 'Tool-Suche',
      },
      videoTitle: 'Video Tools',
      videoDescription: 'Video-Werkzeuge im Überblick.',
      textTitle: 'Text Tools',
      textDescription: 'Text-Werkzeuge im Überblick.',
      showAll: 'Alle {title} anzeigen',
      searchFor: 'Suche nach „{q}“',
      nav: {
        label: 'Hauptnavigation',
        tools: 'Tools',
        blog: 'Blog',
        gallery: 'Galerie',
        faq: 'FAQ',
        contact: 'Kontakt',
        search: 'Suche öffnen',
        theme: 'Farbschema umschalten',
        language: 'Sprache wechseln',
        menuOpen: 'Menü öffnen',
        menuClose: 'Menü schließen',
      },
      footerTagline: 'Free Creative Tools',
      imprint: 'Impressum',
      privacy: 'Datenschutz',
    },
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
    modern: {
      eyebrow: 'Online tools · Free · No sign-up',
      allTools: 'All tools',
      searchButton: 'Search',
      searchLabel: 'Search tools',
      catGroupLabel: 'Tool categories',
      kicker: {
        audio: 'Popular audio tools',
        image: 'Creative image tools',
        video: 'Video tools',
        text: 'Text tools',
        search: 'Tool search',
      },
      videoTitle: 'Video Tools',
      videoDescription: 'Explore video tools.',
      textTitle: 'Text Tools',
      textDescription: 'Explore text tools.',
      showAll: 'Show all {title}',
      searchFor: 'Searching for “{q}”',
      nav: {
        label: 'Main navigation',
        tools: 'Tools',
        blog: 'Blog',
        gallery: 'Gallery',
        faq: 'FAQ',
        contact: 'Contact',
        search: 'Open search',
        theme: 'Toggle color scheme',
        language: 'Switch language',
        menuOpen: 'Open menu',
        menuClose: 'Close menu',
      },
      footerTagline: 'Free Creative Tools',
      imprint: 'Legal Notice',
      privacy: 'Privacy Policy',
    },
  },
};
