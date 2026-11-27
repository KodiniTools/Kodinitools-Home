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
  /** Hinweis an Links auf Seiten, die es nur auf Deutsch gibt (leer = kein Hinweis). */
  germanOnly: string;
  /** Modernes Design (Admin > Layout): Texte, für die es keinen Locale-Schlüssel gibt. */
  modern: ModernHomeUi;
}

/** Kategorien der Reiter im modernen Design. */
export type ModernCat = 'audio' | 'image' | 'media';

/** Reiter einschließlich „Alle“ (zeigt jede Karte). */
export type ModernTab = ModernCat | 'all';

export interface ModernHomeUi {
  eyebrow: string;
  allTools: string;
  /** Alt-Text des Hero-Bilds (statt Logo-Kachel). */
  heroImageAlt: string;
  searchButton: string;
  searchLabel: string;
  catGroupLabel: string;
  /** Kleine Zeile über dem Sektionstitel je Reiter bzw. bei der Suche. */
  kicker: Record<ModernTab | 'search', string>;
  /** Titel/Beschreibung der Reiter ohne eigene Sektion in den Locales (Video & Text, Alle). */
  mediaTitle: string;
  mediaDescription: string;
  allTitle: string;
  allDescription: string;
  /** „Alle 12 Audio-Tools anzeigen“ – {n} = Zahl der Karten, {title} = Titel des Reiters. */
  showAll: string;
  /** Knopf im Reiter „Alle“ – {n} = Zahl aller Karten (ohne doppeltes „Alle … Alle Tools“). */
  showAllTools: string;
  /** Textabsatz unter dem Raster: beliebte Tools als Textlinks, Formatvergleich, Blog. */
  popular: {
    title: string;
    lead: string;
    links: readonly { label: string; href: string }[];
    /** Wort vor dem letzten Link („und“ / „and“). */
    and: string;
    guideText: string;
    guideLink: string;
    guideHref: string;
    blogText: string;
    blogLink: string;
  };
  /** Beschreibung bei aktiver Suche – {q} = Suchbegriff. */
  searchFor: string;
  /** Ansage für Screenreader nach Reiterwechsel oder Suche – {n} = Zahl der Karten. */
  resultCount: string;
  nav: {
    label: string;
    tools: string;
    blog: string;
    gallery: string;
    faq: string;
    about: string;
    contact: string;
    donate: string;
    /** Beschriftung der Link-Liste in der Fußzeile (Screenreader). */
    footerLabel: string;
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
    imageToolsTitle: 'Bild-Tools',
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
    germanOnly: '',
    modern: {
      eyebrow: 'Online-Tools · Kostenlos · Ohne Registrierung',
      allTools: 'Alle Tools',
      heroImageAlt:
        'Schreibtisch mit Wecker, Kamera, Mischpult, Fotos, PDF, Notizbuch und Filmrollen als Sinnbild für die Tools',
      searchButton: 'Suchen',
      searchLabel: 'Tools suchen',
      catGroupLabel: 'Werkzeugkategorien',
      kicker: {
        audio: 'Musik, Podcasts und Aufnahmen',
        image: 'Fotos, Grafiken und Farben',
        media: 'Videos, Texte und PDFs',
        all: 'Gesamtübersicht',
        search: 'Tool-Suche',
      },
      mediaTitle: 'Video & Text',
      mediaDescription: 'Videos umwandeln, Texte schreiben und PDFs bearbeiten.',
      allTitle: 'Alle Tools',
      allDescription: 'Alle Werkzeuge auf einen Blick, kostenlos und ohne Registrierung.',
      showAll: 'Alle {n} {title} anzeigen',
      showAllTools: 'Alle {n} Tools anzeigen',
      popular: {
        title: 'Beliebte Online-Werkzeuge',
        lead: 'Direkt im Browser, ohne Anmeldung:',
        links: [
          { label: 'Equalizer online', href: 'https://kodinitools.com/audioequalizer/' },
          { label: '19-Band-Equalizer', href: 'https://kodinitools.com/equaliser19/' },
          { label: 'Audio normalisieren', href: 'https://kodinitools.com/audionormalisierer/' },
          { label: 'Video konvertieren online', href: 'https://kodinitools.com/videokonverter/' },
          { label: 'Bilder konvertieren', href: 'https://kodinitools.com/bildkonverter/' },
          { label: 'Fotocollage erstellen', href: 'https://kodinitools.com/collagemaker/' },
        ],
        and: 'und',
        guideText: 'Unsicher, welches Bildformat passt?',
        guideLink: 'Bildformate im Vergleich',
        guideHref: '/blog/bildformat-waehlen/',
        blogText: 'Weitere Anleitungen finden Sie im',
        blogLink: 'Blog',
      },
      searchFor: 'Suche nach „{q}“',
      resultCount: '{n} Tools angezeigt',
      nav: {
        label: 'Hauptnavigation',
        tools: 'Tools',
        blog: 'Blog',
        gallery: 'Galerie',
        faq: 'FAQ',
        about: 'Über mich',
        contact: 'Kontakt',
        donate: 'Spenden',
        footerLabel: 'Weitere Seiten',
        search: 'Suche öffnen',
        theme: 'Farbschema umschalten',
        language: 'Sprache wechseln',
        menuOpen: 'Menü öffnen',
        menuClose: 'Menü schließen',
      },
      footerTagline: 'Alle Rechte vorbehalten',
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
    procLabel: { browser: 'In the browser', server: 'Server (Germany)', hybrid: 'Hybrid' },
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
    germanOnly: 'Page in German',
    modern: {
      eyebrow: 'Online tools · Free · No sign-up',
      allTools: 'All tools',
      heroImageAlt:
        'Desk with alarm clock, camera, mixer, photos, PDF, notebook and film reels representing the tools',
      searchButton: 'Search',
      searchLabel: 'Search tools',
      catGroupLabel: 'Tool categories',
      kicker: {
        audio: 'Music, podcasts and recordings',
        image: 'Photos, graphics and colors',
        media: 'Videos, text and PDFs',
        all: 'Overview',
        search: 'Tool search',
      },
      mediaTitle: 'Video & Text',
      mediaDescription: 'Convert videos, write text and edit PDFs.',
      allTitle: 'All Tools',
      allDescription: 'Every tool at a glance, free and without sign-up.',
      showAll: 'Show all {n} {title}',
      showAllTools: 'Show all {n} tools',
      popular: {
        title: 'Popular online tools',
        lead: 'Right in your browser, no sign-up:',
        links: [
          { label: 'online equalizer', href: 'https://kodinitools.com/audioequalizer/?lang=en' },
          { label: '19-band equalizer', href: 'https://kodinitools.com/equaliser19/?lang=en' },
          { label: 'normalize audio', href: 'https://kodinitools.com/audionormalisierer/?lang=en' },
          {
            label: 'convert video online',
            href: 'https://kodinitools.com/videokonverter/?lang=en',
          },
          { label: 'convert images', href: 'https://kodinitools.com/bildkonverter/?lang=en' },
          { label: 'make a photo collage', href: 'https://kodinitools.com/collagemaker/?lang=en' },
        ],
        and: 'and',
        guideText: 'Not sure which image format to use?',
        guideLink: 'Image formats compared',
        guideHref: '/en/blog/choose-image-format/',
        blogText: 'More guides are on the',
        blogLink: 'blog',
      },
      searchFor: 'Searching for “{q}”',
      resultCount: '{n} tools shown',
      nav: {
        label: 'Main navigation',
        tools: 'Tools',
        blog: 'Blog',
        gallery: 'Gallery',
        faq: 'FAQ',
        about: 'About',
        contact: 'Contact',
        donate: 'Donate',
        footerLabel: 'More pages',
        search: 'Open search',
        theme: 'Toggle color scheme',
        language: 'Switch language',
        menuOpen: 'Open menu',
        menuClose: 'Close menu',
      },
      footerTagline: 'All rights reserved',
      imprint: 'Legal Notice',
      privacy: 'Privacy Policy',
    },
  },
};
