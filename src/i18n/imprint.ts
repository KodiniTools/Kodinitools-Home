// Texte und Anbieterangaben des Impressums (/impressum/, /en/legal-notice/).
//
// Rechtsrahmen: Betreiber mit Wohnsitz in der Schweiz → Angaben nach
// Art. 3 Abs. 1 lit. s UWG (Identität + Kontaktadresse inkl. E-Mail).
// Angaben mit Wert `null` sind noch offen und erscheinen auf der Seite als
// deutlich markierter Platzhalter, bis sie hier eingetragen werden.

import type { Lang } from './lang';

export const IMPRINT_PATH: Record<Lang, string> = { de: '/impressum/', en: '/en/legal-notice/' };

/** Link-Ziele, die das Impressum referenziert (bestehende Seiten, sprachunabhängige URL). */
export const PRIVACY_URL = 'https://kodinitools.com/datenschutz/';
export const CONTACT_URL = 'https://kodinitools.com/kontaktformular/';

/**
 * Anbieterangaben. Name, Ort und E-Mail stammen aus der bestehenden
 * Datenschutzerklärung (Abschnitt „Verantwortliche Stelle“).
 */
export const IMPRINT_OPERATOR = {
  name: 'Dinko Ramic',
  brand: 'KodiniTools',
  street: null as string | null,
  postalCode: null as string | null,
  city: 'Uster',
  email: 'kodinitools@kodinitools.com',
  /** UID (CHE-xxx.xxx.xxx), nur falls im Handelsregister eingetragen. */
  uid: null as string | null,
};

interface Section {
  heading: string;
  paragraphs: string[];
}

export interface ImprintPage {
  title: string;
  description: string;
  breadcrumb: string;
  heading: string;
  subtitle: string;
  operatorHeading: string;
  country: string;
  contactHeading: string;
  emailLabel: string;
  contactFormLabel: string;
  contactFormText: string;
  uidHeading: string;
  responsibleHeading: string;
  responsibleNote: string;
  placeholder: { street: string; postalCode: string; uid: string };
  sections: Section[];
  privacyHeading: string;
  privacyText: string;
  privacyLink: string;
  back: string;
}

export const IMPRINT_PAGE: Record<Lang, ImprintPage> = {
  de: {
    title: 'Impressum | KodiniTools',
    description:
      'Impressum von KodiniTools: Betreiber, Kontaktadresse und rechtliche Hinweise zu kodinitools.com.',
    breadcrumb: 'Impressum',
    heading: 'Impressum',
    subtitle: 'Angaben gemäss Art. 3 Abs. 1 lit. s UWG (Schweiz)',
    operatorHeading: 'Betreiber der Website',
    country: 'Schweiz',
    contactHeading: 'Kontakt',
    emailLabel: 'E-Mail',
    contactFormLabel: 'Kontaktformular',
    contactFormText: 'Nachricht senden',
    uidHeading: 'Unternehmens-Identifikationsnummer (UID)',
    responsibleHeading: 'Verantwortlich für den Inhalt',
    responsibleNote: 'Anschrift wie oben.',
    placeholder: {
      street: 'Strasse und Hausnummer',
      postalCode: 'PLZ',
      uid: 'UID-Nummer eintragen oder Abschnitt entfernen',
    },
    sections: [
      {
        heading: 'Haftungsausschluss',
        paragraphs: [
          'Die Inhalte und Tools dieser Website werden mit grösster Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte sowie die ständige Verfügbarkeit der Tools wird jedoch keine Gewähr übernommen.',
          'Haftungsansprüche wegen Schäden materieller oder immaterieller Art, die aus dem Zugriff auf die Website, der Nutzung oder Nichtnutzung der veröffentlichten Inhalte und Tools, durch Missbrauch der Verbindung oder durch technische Störungen entstehen, sind ausgeschlossen, soweit dies gesetzlich zulässig ist.',
        ],
      },
      {
        heading: 'Haftung für Links',
        paragraphs: [
          'Verweise und Links auf Websites Dritter liegen ausserhalb des Verantwortungsbereichs des Betreibers. Für deren Inhalte sind ausschliesslich die jeweiligen Anbieter verantwortlich. Zum Zeitpunkt der Verlinkung waren keine rechtswidrigen Inhalte erkennbar; werden Rechtsverletzungen bekannt, wird der betreffende Link umgehend entfernt.',
        ],
      },
      {
        heading: 'Urheberrechte',
        paragraphs: [
          'Die Urheber- und alle anderen Rechte an Texten, Bildern, Grafiken und Programmcode auf dieser Website gehören ausschliesslich dem Betreiber oder den ausdrücklich genannten Rechteinhabern. Für die Vervielfältigung von Elementen ist vorab die schriftliche Zustimmung der Rechteinhaber einzuholen.',
          'Dateien, die Sie mit den Tools bearbeiten, bleiben Ihr Eigentum.',
        ],
      },
    ],
    privacyHeading: 'Datenschutz',
    privacyText: 'Wie personenbezogene Daten verarbeitet werden, erklärt die',
    privacyLink: 'Datenschutzerklärung',
    back: 'Zurück zur Startseite',
  },
  en: {
    title: 'Legal Notice | KodiniTools',
    description:
      'Legal notice of KodiniTools: operator, contact address and legal information about kodinitools.com.',
    breadcrumb: 'Legal Notice',
    heading: 'Legal Notice',
    subtitle: 'Information pursuant to Art. 3(1)(s) of the Swiss Unfair Competition Act (UWG)',
    operatorHeading: 'Website operator',
    country: 'Switzerland',
    contactHeading: 'Contact',
    emailLabel: 'Email',
    contactFormLabel: 'Contact form',
    contactFormText: 'Send a message',
    uidHeading: 'Business identification number (UID)',
    responsibleHeading: 'Responsible for the content',
    responsibleNote: 'Address as above.',
    placeholder: {
      street: 'Street and house number',
      postalCode: 'Postcode',
      uid: 'Enter UID number or remove this section',
    },
    sections: [
      {
        heading: 'Disclaimer',
        paragraphs: [
          'The content and tools on this website are created with the greatest care. However, no guarantee is given for the accuracy, completeness or timeliness of the content, nor for the constant availability of the tools.',
          'Liability claims for material or immaterial damage arising from access to the website, the use or non-use of the published content and tools, misuse of the connection or technical faults are excluded to the extent permitted by law.',
        ],
      },
      {
        heading: 'Liability for links',
        paragraphs: [
          'References and links to third-party websites are outside the operator’s area of responsibility. The respective providers are solely responsible for their content. No illegal content was apparent at the time of linking; if any infringement becomes known, the link in question will be removed immediately.',
        ],
      },
      {
        heading: 'Copyright',
        paragraphs: [
          'Copyright and all other rights to texts, images, graphics and program code on this website belong exclusively to the operator or the expressly named rights holders. Written consent from the rights holders must be obtained in advance before reproducing any element.',
          'Files you process with the tools remain your property.',
        ],
      },
    ],
    privacyHeading: 'Privacy',
    privacyText: 'How personal data is processed is explained in the',
    privacyLink: 'Privacy Policy',
    back: 'Back to the homepage',
  },
};
