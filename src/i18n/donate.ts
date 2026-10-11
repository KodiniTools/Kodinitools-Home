// Texte der Spenden-Seite (/spenden/, /en/donate/) je Sprache.

import type { Lang } from './lang';

export const DONATE_PATH: Record<Lang, string> = { de: '/spenden/', en: '/en/donate/' };

interface Card {
  title: string;
  text: string;
}

export interface DonatePage {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  breadcrumb: string;
  heading: string;
  subtitle: string;
  intro: string[];
  whyHeading: string;
  costsIntro: string;
  costs: Card[];
  trust: string;
  contributeHeading: string;
  contributeIntro: string;
  options: Card[];
  actionText: string;
  paypalQrAlt: string;
  coffeeQrAlt: string;
  scanHint: string;
  paypalButton: string;
  thanks: string;
  signature: string;
  back: string;
}

export const DONATE_PAGE: Record<Lang, DonatePage> = {
  de: {
    title: 'KodiniTools unterstützen – Freiwillig spenden statt Paywall | KodiniTools',
    description:
      'Unterstütze KodiniTools freiwillig per PayPal. Keine Paywalls, keine Abofallen – einfach nützliche, kostenlose Werkzeuge, die durch freiwillige Spenden am Laufen gehalten werden.',
    ogTitle: 'KodiniTools unterstützen – Freiwillig spenden statt Paywall',
    ogDescription:
      'Keine Paywalls. Keine Abofallen. Einfach nützliche Werkzeuge – getragen von freiwilligen Spenden.',
    breadcrumb: 'Spenden',
    heading: 'Unterstütze KodiniTools: Software frei halten',
    subtitle: 'Keine Paywalls. Keine Abofallen. Einfach nützliche Werkzeuge.',
    intro: [
      'KodiniTools entstand aus einer einfachen Überzeugung: Moderne digitale Werkzeuge für Audio, Bild und Medien sollten für jeden direkt zugänglich sein – ohne teure Monatsabos, ohne Registrierungszwang und ohne künstliche Barrieren.',
      'Ich entwickle und betreue diese Plattform unabhängig aus Uster in der Schweiz. Jedes Tool ist von Grund auf so gebaut, dass es dir sofort Zeit spart und deine Arbeit erleichtert.',
    ],
    whyHeading: 'Warum freiwillige Spenden?',
    costsIntro: 'Der Betrieb von KodiniTools ist mit realen Kosten verbunden:',
    costs: [
      {
        title: 'Server & Infrastruktur',
        text: 'Schnelle Ladezeiten, stabiles Hosting und zuverlässige Rechenleistung.',
      },
      {
        title: 'Aktive Weiterentwicklung',
        text: 'Neue Features, Fehlerbehebungen und moderne Browser-Kompatibilität.',
      },
      {
        title: 'Unabhängigkeit',
        text: 'Keine störenden Werbebanner, kein Datenverkauf und keine Investoren, die Profit vor Nutzen stellen.',
      },
    ],
    trust:
      'Statt alle Funktionen hinter einer 20-Euro-Paywall einzusperren, setze ich auf Vertrauen und Wertschätzung: Wer die Tools regelmässig nutzt und davon profitiert, gibt freiwillig etwas zurück. Wer es sich gerade nicht leisten kann, nutzt sie trotzdem kostenfrei.',
    contributeHeading: 'Einen Beitrag leisten',
    contributeIntro:
      'Wenn dir KodiniTools geholfen hat, einen Auftrag abzuschliessen, Zeit zu sparen oder ein kreatives Projekt umzusetzen, freue ich mich über deinen Support:',
    options: [
      {
        title: 'Einen Kaffee spendieren',
        text: 'Ein kleiner Betrag, der den Code am Laufen hält.',
      },
      {
        title: 'Projekt-Unterstützer',
        text: 'Hilf mit, die monatlichen Hosting- und Serverkosten direkt zu decken.',
      },
      {
        title: 'Wunschbetrag',
        text: 'Jeder Franken oder Euro fliesst direkt in die Weiterentwicklung der Tools.',
      },
    ],
    actionText: 'Schnell & sicher spenden – wähle deine bevorzugte Methode.',
    paypalQrAlt: 'PayPal QR-Code zum Spenden an KodiniTools',
    coffeeQrAlt: 'Buy Me a Coffee QR-Code zum Spenden an KodiniTools',
    scanHint: 'Mit dem Smartphone scannen',
    paypalButton: 'Jetzt via PayPal spenden →',
    thanks:
      'Ein grosses Dankeschön an alle, die dieses Projekt mittragen. Deine Unterstützung sorgt dafür, dass das Web ein Stück offener, fairer und werbefreier bleibt.',
    signature: '– Dinko Ramic, Entwickler von KodiniTools',
    back: 'Zurück zur Startseite',
  },
  en: {
    title: 'Support KodiniTools – Donate Voluntarily Instead of a Paywall | KodiniTools',
    description:
      'Support KodiniTools voluntarily via PayPal. No paywalls, no subscription traps — just useful, free tools kept running by voluntary donations.',
    ogTitle: 'Support KodiniTools – Donate Voluntarily Instead of a Paywall',
    ogDescription:
      'No paywalls. No subscription traps. Just useful tools — kept alive by voluntary donations.',
    breadcrumb: 'Donate',
    heading: 'Support KodiniTools: Keeping Software Free',
    subtitle: 'No paywalls. No subscription traps. Just useful tools.',
    intro: [
      'KodiniTools was born from a simple conviction: modern digital tools for audio, images, and media should be directly accessible to everyone — with no expensive monthly subscriptions, no forced registration, and no artificial barriers.',
      'I develop and maintain this platform independently from Uster, Switzerland. Every tool is built from the ground up to save you time and make your work easier right away.',
    ],
    whyHeading: 'Why Voluntary Donations?',
    costsIntro: 'Running KodiniTools comes with real costs:',
    costs: [
      {
        title: 'Servers & Infrastructure',
        text: 'Fast load times, stable hosting, and reliable computing power.',
      },
      {
        title: 'Active Development',
        text: 'New features, bug fixes, and up-to-date browser compatibility.',
      },
      {
        title: 'Independence',
        text: 'No intrusive ad banners, no selling of data, and no investors putting profit ahead of usefulness.',
      },
    ],
    trust:
      "Instead of locking every feature behind a 20-euro paywall, I rely on trust and appreciation: those who use the tools regularly and benefit from them give something back voluntarily. Those who can't afford to right now still get to use them for free.",
    contributeHeading: 'Make a Contribution',
    contributeIntro:
      "If KodiniTools has helped you finish a job, save time, or bring a creative project to life, I'd be grateful for your support:",
    options: [
      { title: 'Buy a Coffee', text: 'A small amount that keeps the code running.' },
      {
        title: 'Project Supporter',
        text: 'Help cover the monthly hosting and server costs directly.',
      },
      {
        title: 'Any Amount',
        text: 'Every franc or euro flows directly into further developing the tools.',
      },
    ],
    actionText: 'Donate quickly & securely — choose your preferred method.',
    paypalQrAlt: 'PayPal QR code to donate to KodiniTools',
    coffeeQrAlt: 'Buy Me a Coffee QR code to donate to KodiniTools',
    scanHint: 'Scan with your smartphone',
    paypalButton: 'Donate now via PayPal →',
    thanks:
      'A huge thank you to everyone who helps carry this project forward. Your support helps keep the web a little more open, fair, and ad-free.',
    signature: '– Dinko Ramic, developer of KodiniTools',
    back: 'Back to Home',
  },
};
