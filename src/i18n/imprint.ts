// Texte und Anbieterangaben des Impressums (/impressum/, /en/legal-notice/).
//
// Rechtsrahmen: Betreiber mit Wohnsitz in der Schweiz → Angaben nach
// Art. 3 Abs. 1 lit. s UWG (Identität + Kontaktadresse inkl. E-Mail).
// Betreiber ist Privatperson → keine UID.

import type { Lang } from './lang';

export const IMPRINT_PATH: Record<Lang, string> = { de: '/impressum/', en: '/en/legal-notice/' };

/** Link-Ziele, die das Impressum referenziert (sprachunabhängige URLs). */
export const PRIVACY_URL = 'https://kodinitools.com/datenschutz/';
export const CONTACT_URL = 'https://kodinitools.com/kontaktformular/';
export const GALLERY_URL = 'https://kodinitools.com/bildergalerie/';
export const FONT_AWESOME_LICENSE_URL = 'https://fontawesome.com/license/free';

/** Anbieterangaben (Name, Ort, E-Mail wie in der Datenschutzerklärung). */
export const IMPRINT_OPERATOR = {
  name: 'Dinko Ramic',
  brand: 'KodiniTools',
  street: 'Kanalweg 1',
  postalCode: '8610',
  city: 'Uster',
  email: 'kodinitools@kodinitools.com',
};

interface Section {
  heading: string;
  paragraphs: string[];
}

interface License {
  label: string;
  name: string;
  url: string;
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
  responsibleHeading: string;
  responsibleNote: string;
  sections: Section[];
  licenseHeading: string;
  licenseIntro: string;
  licenseIntroLink: string;
  licenseIntroEnd: string;
  licenses: License[];
  /** Kurzfassung der Nutzungsbedingungen der Bildergalerie; Volltext steht in der Galerie. */
  gallery: { heading: string; paragraphs: string[]; linkIntro: string; linkText: string };
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
    responsibleHeading: 'Verantwortlich für den Inhalt',
    responsibleNote: 'Anschrift wie oben.',
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
    licenseHeading: 'Urheberrechtlicher Lizenzhinweis',
    licenseIntro: 'Auf dieser Plattform werden Schriftarten und Vektorsymbole von',
    licenseIntroLink: 'Font Awesome Free',
    licenseIntroEnd: ' genutzt:',
    licenses: [
      { label: 'Webfonts', name: 'SIL Open Font License 1.1', url: 'https://openfontlicense.org/' },
      {
        label: 'Icons (Vektoren)',
        name: 'Creative Commons Attribution 4.0 International (CC BY 4.0)',
        url: 'https://creativecommons.org/licenses/by/4.0/',
      },
      { label: 'Code/Stylesheets', name: 'MIT License', url: 'https://opensource.org/license/mit' },
    ],
    gallery: {
      heading: 'Bilder der Bildergalerie',
      paragraphs: [
        'Die meisten Bilder der KodiniTools-Bildergalerie wurden mit KI (Leonardo.ai) erstellt und sind dort mit „KI“ gekennzeichnet.',
        'Alle Bilder der Galerie dürfen kostenlos heruntergeladen und für private, nicht-kommerzielle Zwecke genutzt werden, auch verändert und ohne Namensnennung. Eine kommerzielle Nutzung ist nicht gestattet.',
        'Die Nutzung erfolgt auf eigene Verantwortung und ohne Gewähr, dass keine Rechte Dritter berührt sind. Die Bilder dürfen nicht verwendet werden, um über ihre KI-Herkunft zu täuschen oder Personen falsch darzustellen.',
      ],
      linkIntro: 'Erlaubte und nicht erlaubte Nutzungen im Detail:',
      linkText: 'Bildergalerie',
    },
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
    responsibleHeading: 'Responsible for the content',
    responsibleNote: 'Address as above.',
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
    licenseHeading: 'Copyright and license notice',
    licenseIntro: 'This platform uses fonts and vector icons from',
    licenseIntroLink: 'Font Awesome Free',
    licenseIntroEnd: ':',
    licenses: [
      { label: 'Webfonts', name: 'SIL Open Font License 1.1', url: 'https://openfontlicense.org/' },
      {
        label: 'Icons (vectors)',
        name: 'Creative Commons Attribution 4.0 International (CC BY 4.0)',
        url: 'https://creativecommons.org/licenses/by/4.0/',
      },
      { label: 'Code/Stylesheets', name: 'MIT License', url: 'https://opensource.org/license/mit' },
    ],
    gallery: {
      heading: 'Images in the image gallery',
      paragraphs: [
        'Most images in the KodiniTools image gallery were created with AI (Leonardo.ai) and are marked “AI” there.',
        'All gallery images may be downloaded free of charge and used for private, non-commercial purposes, including modified and without attribution. Commercial use is not permitted.',
        'Use is at your own risk and without warranty that no third-party rights are affected. The images must not be used to hide their AI origin or to misrepresent people.',
      ],
      linkIntro: 'Allowed and prohibited uses in detail:',
      linkText: 'Image gallery',
    },
    privacyHeading: 'Privacy',
    privacyText: 'How personal data is processed is explained in the',
    privacyLink: 'Privacy Policy',
    back: 'Back to the homepage',
  },
};
