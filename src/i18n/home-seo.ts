// Texte und strukturierte Daten der Startseite (Layout-Kopf) je Sprache.

import type { Lang } from './lang';

export interface HomeSeo {
  title: string;
  /** <meta name="title"> */
  metaTitle: string;
  description: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
  twitterTitle: string;
  twitterDescription: string;
  /** JSON-LD: url, description, featureList */
  schemaUrl: string;
  schemaDescription: string;
  featureList: string[];
}

export const HOME_SEO: Record<Lang, HomeSeo> = {
  de: {
    title: 'KodiniTools – Kostenlose Online-Tools ohne Registrierung',
    metaTitle: 'KodiniTools – Kostenlose Online-Tools ohne Registrierung',
    description:
      'Kostenlose Online-Tools ohne Registrierung: Audio konvertieren, schneiden und normalisieren, Bilder umwandeln, Videos konvertieren. DSGVO-konform.',
    keywords:
      'kostenlose online tools, online tools ohne registrierung, audio tools online, bild tools online, mp3 konverter kostenlos, audio konverter online, bilder konvertieren, equalizer browser, audio normalizer, foto collage, batch bildbearbeitung, mp3 zu wav, jpg zu webp, audio visualizer tiktok, DSGVO online tools schweiz',
    ogTitle: 'KodiniTools – Kostenlose Online-Tools ohne Registrierung',
    ogDescription:
      'Kostenlose Online-Tools ohne Registrierung: Audio konvertieren, schneiden und normalisieren, Bilder umwandeln, Videos konvertieren. DSGVO-konform.',
    twitterTitle: 'KodiniTools – Kostenlose Online-Tools ohne Registrierung',
    twitterDescription:
      'Kostenlose Online-Tools ohne Registrierung: Audio konvertieren, schneiden und normalisieren, Bilder umwandeln, Videos konvertieren. DSGVO-konform.',
    schemaUrl: 'https://kodinitools.com',
    schemaDescription:
      'Kostenlose Online-Tools ohne Registrierung für Audio, Bild, Video und Text: konvertieren, schneiden, normalisieren, bearbeiten. Direkt im Browser, DSGVO-konform.',
    featureList: [
      'Audio konvertieren, schneiden und normalisieren',
      'Equalizer, Musikplayer und Audio-Visualizer im Browser',
      'Wiedergabelisten erstellen und Audiodateien zusammenfügen',
      'Bilder konvertieren und stapelweise bearbeiten',
      'Fotocollagen, Farbpaletten und Favicons erstellen',
      'Videos konvertieren',
      'Texte schreiben und als PDF speichern',
      'Ohne Registrierung, ohne Tracking',
    ],
  },
  en: {
    title: 'KodiniTools – Free Online Tools, No Sign-Up Required',
    metaTitle: 'KodiniTools – Free Online Tools, No Sign-Up Required',
    description:
      'Free online tools with no sign-up: convert, cut and normalize audio, convert and batch edit images, convert videos. Works in your browser, GDPR compliant.',
    keywords:
      'free online tools, online tools no sign up, free audio tools online, free image tools online, mp3 converter free, audio converter online, image converter, browser equalizer, audio normalizer, photo collage, batch image editing, mp3 to wav, jpg to webp, audio visualizer tiktok, GDPR online tools',
    ogTitle: 'KodiniTools – Free Online Tools, No Sign-Up Required',
    ogDescription:
      'Free online tools with no sign-up: convert, cut and normalize audio, convert and batch edit images, convert videos. Works in your browser, GDPR compliant.',
    twitterTitle: 'KodiniTools – Free Online Tools, No Sign-Up Required',
    twitterDescription:
      'Free online tools with no sign-up: convert, cut and normalize audio, convert and batch edit images, convert videos. Works in your browser, GDPR compliant.',
    schemaUrl: 'https://kodinitools.com/en/',
    schemaDescription:
      'Free online tools with no sign-up for audio, images, video and text: convert, cut, normalize, edit. Right in your browser, GDPR compliant.',
    featureList: [
      'Convert, cut and normalize audio',
      'Equalizer, music player and audio visualizer in your browser',
      'Create playlists and merge audio files',
      'Convert and batch edit images',
      'Create photo collages, color palettes and favicons',
      'Convert videos',
      'Write texts and save them as PDF',
      'No sign-up, no tracking',
    ],
  },
};

/**
 * Tools im JSON-LD (hasPart): alle öffentlichen Tools. `path` relativ zur Domain;
 * die EN-Fassung verweist auf `?lang=en` (siehe HomeLayout). Texte nach Keyword-Set 11/2026.
 */
export const HOME_SCHEMA_TOOLS: {
  path: string;
  name: Record<Lang, string>;
  description: Record<Lang, string>;
}[] = [
  {
    path: '/audiokonverter/',
    name: { de: 'Audio-Konverter', en: 'Audio Converter' },
    description: {
      de: 'MP3 in WAV umwandeln und umgekehrt: Audioformat ändern zwischen MP3, WAV, FLAC, OGG, AAC, M4A und OPUS.',
      en: 'Convert MP3 to WAV and back: change audio format between MP3, WAV, FLAC, OGG, AAC, M4A and OPUS.',
    },
  },
  {
    path: '/mp3konverter/',
    name: { de: 'MP3-Konverter', en: 'MP3 Converter' },
    description: {
      de: 'Audiodateien in MP3 umwandeln: WAV, FLAC, M4A, OGG und AAC bis 100 MB, Bitrate wählbar.',
      en: 'Convert audio files to MP3: WAV, FLAC, M4A, OGG and AAC up to 100 MB, with selectable bitrate.',
    },
  },
  {
    path: '/audionormalisierer/',
    name: { de: 'Audio-Normalizer', en: 'Audio Normalizer' },
    description: {
      de: 'Audio-Lautstärke normalisieren nach EBU R128/LUFS, RMS oder Peak, lokal im Browser ohne Upload.',
      en: 'Normalize audio volume with EBU R128/LUFS, RMS or Peak, locally in your browser with no upload.',
    },
  },
  {
    path: '/audio-cutter/',
    name: { de: 'Audio-Schneider', en: 'Audio Cutter' },
    description: {
      de: 'MP3 und andere Audiodateien millisekundengenau schneiden, mit Fade-In/-Out, Export als WAV, MP3 oder FLAC.',
      en: 'Cut MP3 and other audio files with millisecond precision, with fade in/out, export as WAV, MP3 or FLAC.',
    },
  },
  {
    path: '/visualizer/',
    name: { de: 'Audio-Visualizer', en: 'Audio Visualizer' },
    description: {
      de: 'Musikvideo für TikTok, Reels und YouTube erstellen: Track laden, Visualisierung wählen, als MP4 exportieren.',
      en: 'Turn a song into a video for TikTok, Reels and YouTube: load a track, pick a visualizer, export as MP4.',
    },
  },
  {
    path: '/equaliser19/',
    name: { de: '19-Band EQ Pro', en: '19-Band EQ Pro' },
    description: {
      de: 'Equalizer online mit 19 Bändern, Kompressor, Effekten und Aufnahme in Echtzeit.',
      en: 'Online equalizer with 19 bands, compressor, effects and real-time recording.',
    },
  },
  {
    path: '/audioequalizer/',
    name: { de: 'Interaktiver Audio-Equalizer', en: 'Interactive Audio Equalizer' },
    description: {
      de: '15-Band-Equalizer im Browser: Frequenzen in Echtzeit anpassen, mit Presets, Visualisierung und Playlist.',
      en: '15-band equalizer in your browser: adjust frequencies in real time, with presets, visualization and playlist.',
    },
  },
  {
    path: '/playlist_generator/',
    name: { de: 'Wiedergabelisten-Generator', en: 'Playlist Generator' },
    description: {
      de: 'M3U-Playlist aus MP3-, WAV- und FLAC-Dateien erstellen, auch als M3U8, PLS, XSPF, JSON oder CSV.',
      en: 'Create an M3U playlist from MP3, WAV and FLAC files, or export as M3U8, PLS, XSPF, JSON or CSV.',
    },
  },
  {
    path: '/playlistkonverter/',
    name: { de: 'Wiedergabelisten-Konverter', en: 'Playlist Converter' },
    description: {
      de: 'Mehrere MP3-, WAV-, FLAC- oder OGG-Dateien zu einer Datei zusammenfügen, Ausgabe als MP3, WebM oder OGG.',
      en: 'Merge several MP3, WAV, FLAC or OGG files into one, output as MP3, WebM or OGG.',
    },
  },
  {
    path: '/ultimativer-musikplayer/',
    name: { de: 'Ultimativer Musikplayer', en: 'Ultimate Music Player' },
    description: {
      de: 'MP3-Player online: lokale Musik im Browser abspielen, mit 7 Visualisierungen, Playlist und Equalizer.',
      en: 'Online MP3 player: play local music in your browser with 7 visualizer modes, playlist and equalizer.',
    },
  },
  {
    path: '/modernermusikplayer/',
    name: { de: 'Moderner Musikplayer', en: 'Modern Music Player' },
    description: {
      de: 'Audio-Player im Browser mit Playlist-Verwaltung, Equalizer und Dark Mode, ohne Installation.',
      en: 'Web audio player with playlist management, equalizer and dark mode, no installation.',
    },
  },
  {
    path: '/alarmtool/',
    name: { de: 'Alarmtool', en: 'Alarm Tool' },
    description: {
      de: 'Alarmton-Generator: eigene Alarm- und Signaltöne mit Oszillatoren, Filter und Hüllkurve bauen, als WAV oder MP3 speichern.',
      en: 'Alarm sound generator: build custom alarm and signal tones with oscillators, filter and envelope, save as WAV or MP3.',
    },
  },
  {
    path: '/bildkonverter/',
    name: { de: 'Bildkonverter', en: 'Image Converter' },
    description: {
      de: 'Bilder konvertieren online: JPG zu WebP, WebP in JPG, HEIC in JPG, PNG in JPG, dazu komprimieren und zuschneiden.',
      en: 'Convert images online: JPG to WebP, WebP to JPG, HEIC to JPG, PNG to JPG, plus compress and crop.',
    },
  },
  {
    path: '/bilderseriebearbeiten/',
    name: { de: 'Bilder-Batchbearbeitung', en: 'Batch Image Editor' },
    description: {
      de: 'Mehrere Bilder gleichzeitig verkleinern, umbenennen und mit Wasserzeichen versehen, Export als ZIP oder PDF.',
      en: 'Batch resize images, rename them and add a watermark to many photos at once, export as ZIP or PDF.',
    },
  },
  {
    path: '/collagemaker/',
    name: { de: 'Fotocollage', en: 'Photo Collage Maker' },
    description: {
      de: 'Fotocollage erstellen ohne Anmeldung und ohne Wasserzeichen: 14 Layouts, Bildbearbeitung und Texte im Browser.',
      en: 'Create a photo collage with no sign-up and no watermark: 14 layouts, image editing and text in your browser.',
    },
  },
  {
    path: '/kodini-color-extractor/',
    name: { de: 'Farbextraktor', en: 'Color Extractor' },
    description: {
      de: 'Farbpalette aus Bild erstellen: dominante Farben extrahieren und als HEX, RGB, HSL oder CSS kopieren.',
      en: 'Create a color palette from an image: extract dominant colors and copy them as HEX, RGB, HSL or CSS.',
    },
  },
  {
    path: '/favicon-tool/',
    name: { de: 'Favicon-Generator', en: 'Favicon Generator' },
    description: {
      de: 'Favicon erstellen aus PNG, JPG, SVG und mehr: als ICO oder komplettes Paket mit Apple-Touch-Icon und Webmanifest.',
      en: 'Create a favicon from PNG, JPG, SVG and more: as ICO or a complete package with Apple touch icon and web manifest.',
    },
  },
  {
    path: '/videokonverter/',
    name: { de: 'Videokonverter', en: 'Video Converter' },
    description: {
      de: 'Video konvertieren online: MOV, AVI, WebM, MKV, FLV, WMV und TS in MP4 und zurück, Dateien bis 5 GB.',
      en: 'Convert video online: MOV, AVI, WebM, MKV, FLV, WMV and TS to MP4 and back, files up to 5 GB.',
    },
  },
  {
    path: '/texteditor/',
    name: { de: 'Texteditor', en: 'Text Editor' },
    description: {
      de: 'Texteditor online: schreiben, formatieren, Bilder einfügen, als PDF speichern oder drucken. Texte bleiben lokal.',
      en: 'Online text editor: write, format, insert images, save as PDF or print. Your texts stay local.',
    },
  },
];
