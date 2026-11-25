// Texte der Seite „Über mich“ (/ueber-mich/, /en/about/).

import type { Lang } from './lang';

export const ABOUT_PATH: Record<Lang, string> = { de: '/ueber-mich/', en: '/en/about/' };

/** Porträt (640×800, WebP mit transparentem Hintergrund) in public/image/. */
export const ABOUT_PHOTO = {
  src: '/image/dinko-ramic-portrait.webp',
  width: 640,
  height: 800,
} as const;

/** KodiniTools-Logo neben der Überschrift (256×256, WebP mit transparentem Hintergrund). */
export const ABOUT_LOGO = {
  src: '/image/logo-kodinitools-blau.webp',
  width: 256,
  height: 256,
} as const;

/** Name der Person für Bild-Alt und strukturierte Daten (wie im Impressum). */
export const ABOUT_PERSON = 'Dinko Ramic';

/** Bildunterschrift unter dem Porträt (Schreibweise mit ć). */
export const ABOUT_CAPTION = 'Dinko Ramić';

export interface AboutPage {
  title: string;
  description: string;
  breadcrumb: string;
  heading: string;
  photoAlt: string;
  paragraphs: string[];
  back: string;
}

export const ABOUT_PAGE: Record<Lang, AboutPage> = {
  de: {
    title: 'Über mich | KodiniTools',
    description:
      'Wer steckt hinter KodiniTools? Dinko, Elektrotechniker aus der Schweiz, baut kostenlose und datenschutzfreundliche Browser-Tools ohne Konto, Abo und Tracking.',
    breadcrumb: 'Über mich',
    heading: 'Wer steckt hinter KodiniTools?',
    photoAlt: 'Dinko Ramic, Entwickler von KodiniTools',
    paragraphs: [
      'Hallo, ich bin Dinko – gelernter Elektrotechniker aus der Schweiz und leidenschaftlicher „Vibe Coder“. Ich bin kein klassischer Informatiker, sondern ein Macher, der Werkzeuge baut, die im Alltag einfach funktionieren müssen.',
      'KodiniTools entstand aus einem einfachen Wunsch: Ich war es leid, für jede kleine Audio-, Bild- oder Video-Aufgabe ein Konto anlegen, ein Abo abschließen oder meine privaten Dateien auf dubiose Server hochladen zu müssen. Mithilfe moderner KI-Entwicklung habe ich deshalb diese Sammlung aus kostenlosen, schnellen und datenschutzfreundlichen Browser-Tools geschaffen. Viele Werkzeuge laufen direkt lokal auf deinem Gerät – und wenn doch einmal Serverleistung nötig ist, geschieht dies DSGVO-konform auf Servern in Deutschland. Kein Tracking, keine Bezahlschranken, einfach nützliche Technik.',
    ],
    back: 'Zurück zur Startseite',
  },
  en: {
    title: 'About | KodiniTools',
    description:
      'Who is behind KodiniTools? Dinko, an electrical technician based in Switzerland, builds free, privacy-first browser tools with no accounts, subscriptions or tracking.',
    breadcrumb: 'About',
    heading: 'Who is behind KodiniTools?',
    photoAlt: 'Dinko Ramic, developer of KodiniTools',
    paragraphs: [
      'Hi, I’m Dinko – a trained electrical technician based in Switzerland and a passionate "Vibe Coder." I’m not a formally trained computer scientist; I’m a builder who believes tools should simply work without unnecessary hurdles.',
      'KodiniTools started with a simple frustration: having to create accounts, pay for subscriptions, or upload private files to questionable servers just to convert an audio track or resize an image. Using modern AI-assisted development, I built this suite of fast, free, and privacy-first browser utilities. Most tools run directly on your device, and whenever server processing is required, it runs strictly on GDPR-compliant servers in Germany. No tracking, no paywalls—just practical engineering.',
    ],
    back: 'Back to the homepage',
  },
};
