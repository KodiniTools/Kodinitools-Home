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
    title:
      'KodiniTools – MP3 in WAV umwandeln, JPG zu WebP, Audio normalisieren | Kostenlos ohne Registrierung',
    metaTitle:
      'KodiniTools – MP3 in WAV umwandeln, JPG zu WebP, Audio normalisieren | Kostenlos ohne Registrierung',
    description:
      'MP3 in WAV umwandeln kostenlos online · JPG zu WebP konvertieren · Audio Lautstärke normalisieren · Bilder Batch konvertieren · Musik-Video für TikTok erstellen · Fotocollage erstellen ohne App · Equalizer für Browser. DSGVO-konform, keine Registrierung.',
    keywords:
      'mp3 konverter kostenlos, audio konverter online, bilder konvertieren, equalizer browser, audio normalizer, foto collage, batch bildbearbeitung, mp3 zu wav, jpg zu webp, audio visualizer tiktok, DSGVO online tools schweiz',
    ogTitle: 'KodiniTools – MP3 in WAV umwandeln, JPG zu WebP, Audio normalisieren | Kostenlos',
    ogDescription:
      'MP3 in WAV umwandeln · JPG zu WebP · Audio normalisieren · Bilder Batch konvertieren · Musik-Video für TikTok · Fotocollage ohne App · Browser-Equalizer. Kostenlos, DSGVO-konform, keine Registrierung.',
    twitterTitle:
      'KodiniTools – MP3 in WAV umwandeln, JPG zu WebP, Audio normalisieren | Kostenlos',
    twitterDescription:
      'MP3 in WAV umwandeln · JPG zu WebP · Audio normalisieren · Bilder Batch konvertieren · Musik-Video für TikTok · Fotocollage ohne App · Browser-Equalizer. Kostenlos, keine Registrierung.',
    schemaUrl: 'https://kodinitools.com',
    schemaDescription:
      'MP3 in WAV umwandeln kostenlos, JPG zu WebP konvertieren, Audio Lautstärke normalisieren, Bilder Batch konvertieren, Audiodatei Format ändern DSGVO-konform. Direkt im Browser, keine Registrierung.',
    featureList: [
      'MP3 in WAV umwandeln kostenlos online',
      'MP3 Konverter ohne Registrierung',
      'Equalizer für Browser kostenlos',
      'JPG zu WebP konvertieren online',
      'Audio Lautstärke normalisieren online',
      'Bilder Batch konvertieren kostenlos',
      'Bildgrösse ändern mehrere Bilder gleichzeitig',
      'Musik-Video für TikTok erstellen kostenlos',
      'Foto Collage erstellen ohne App',
      'Audiodatei Format ändern DSGVO-konform',
    ],
  },
  en: {
    title: 'KodiniTools – Convert MP3 to WAV Free, JPG to WebP, Normalize Audio | No Registration',
    metaTitle:
      'KodiniTools – Convert MP3 to WAV Free, JPG to WebP, Normalize Audio | No Registration',
    description:
      'Convert MP3 to WAV free online · JPG to WebP converter · Normalize audio volume online · Batch resize images at once · Create music video for TikTok free · Photo collage without app · Browser equalizer free. GDPR compliant, no registration required.',
    keywords:
      'mp3 converter free, audio converter online, image converter, browser equalizer, audio normalizer, photo collage, batch image editing, mp3 to wav, jpg to webp, audio visualizer tiktok, GDPR online tools',
    ogTitle:
      'KodiniTools – Convert MP3 to WAV Free, JPG to WebP, Normalize Audio | No Registration',
    ogDescription:
      'Convert MP3 to WAV free · JPG to WebP · Normalize audio online · Batch resize images · Music video for TikTok free · Photo collage without app · Browser equalizer. GDPR compliant, no registration.',
    twitterTitle:
      'KodiniTools – Convert MP3 to WAV Free, JPG to WebP, Normalize Audio | No Registration',
    twitterDescription:
      'Convert MP3 to WAV free · JPG to WebP · Normalize audio online · Batch resize images · Music video for TikTok free · Photo collage without app · Browser equalizer. No registration.',
    schemaUrl: 'https://kodinitools.com/en/',
    schemaDescription:
      'Convert MP3 to WAV free online, JPG to WebP converter, normalize audio volume online, batch resize images, change audio file format GDPR compliant. Directly in your browser, no registration.',
    featureList: [
      'Convert MP3 to WAV free online',
      'MP3 converter without registration',
      'Free browser equalizer',
      'JPG to WebP converter online',
      'Normalize audio volume online',
      'Batch convert images free',
      'Resize multiple images at once',
      'Create music video for TikTok free',
      'Photo collage without app',
      'Change audio file format GDPR compliant',
    ],
  },
};

/** Tools im JSON-LD (hasPart), Reihenfolge wie bisher. */
export const HOME_SCHEMA_TOOLS: {
  url: string;
  name: Record<Lang, string>;
  description: Record<Lang, string>;
}[] = [
  {
    url: 'https://kodinitools.com/audiokonverter/',
    name: { de: 'Audio Konverter', en: 'Audio Converter' },
    description: {
      de: 'Audio konvertieren online zwischen MP3, WAV, OGG, FLAC, AAC. Verlustfreie Audiokonvertierung im Browser.',
      en: 'Convert audio online between MP3, WAV, OGG, FLAC, AAC. Lossless audio conversion in browser.',
    },
  },
  {
    url: 'https://kodinitools.com/equaliser19/',
    name: { de: '19-Band EQ Pro', en: '19-Band EQ Pro' },
    description: {
      de: '19 Band Equalizer online mit Presets und Dynamic Compressor. Audio Frequenzen online anpassen.',
      en: '19 band equalizer online with presets and dynamic compressor. Adjust audio frequencies online.',
    },
  },
  {
    url: 'https://kodinitools.com/ultimativer-musikplayer/',
    name: { de: 'Ultimativer Musikplayer', en: 'Music Player' },
    description: {
      de: 'Online Musikplayer mit Playlist, Shuffle und Visualizer. Moderner Musikplayer für lokale Dateien im Browser.',
      en: 'Online music player with playlist, shuffle and visualizer. Modern music player for local files in browser.',
    },
  },
  {
    url: 'https://kodinitools.com/visualizer/',
    name: { de: 'Audio Visualizer', en: 'Audio Visualizer' },
    description: {
      de: 'Audio Visualizer online: Musik visualisieren für YouTube, TikTok und Instagram. Echtzeit Audio-Wellenform generieren.',
      en: 'Audio visualizer online: Create music visualizations for YouTube, TikTok and Instagram. Real-time audio waveform generator.',
    },
  },
  {
    url: 'https://kodinitools.com/mp3konverter/',
    name: { de: 'MP3 Konverter', en: 'MP3 Converter' },
    description: {
      de: 'MP3 Konverter kostenlos: Video zu MP3 umwandeln, MP3 Bitrate online ändern. Schnellster In-Browser MP3 Konverter.',
      en: 'Free MP3 converter: Convert video to MP3, change MP3 bitrate online. Fastest in-browser MP3 converter.',
    },
  },
  {
    url: 'https://kodinitools.com/audioequalizer/',
    name: { de: 'Audio Equalizer', en: 'Audio Equalizer' },
    description: {
      de: 'Sound Equalizer Browser: Audio lauter machen online, Bass Booster online kostenlos mit Web Audio API Presets.',
      en: 'Browser sound equalizer: Make audio louder online, free bass booster with Web Audio API presets.',
    },
  },
  {
    url: 'https://kodinitools.com/modernermusikplayer/',
    name: { de: 'Moderner Musikplayer', en: 'Modern Music Player' },
    description: {
      de: 'Minimalistischer Musikplayer Web mit Dark Mode und Playlist-Unterstützung.',
      en: 'Minimalist web music player with dark mode and playlist support.',
    },
  },
  {
    url: 'https://kodinitools.com/playlist_generator/',
    name: { de: 'Playlist Generator', en: 'Playlist Generator' },
    description: {
      de: 'Playlist erstellen online: Automatische Playlist aus Audio-Ordner, M3U Playlist online erstellen.',
      en: 'Create playlists online: Automatic playlist from audio folder, create M3U playlist online.',
    },
  },
  {
    url: 'https://kodinitools.com/alarmtool/',
    name: { de: 'Alarmtool', en: 'Alarm Tool' },
    description: {
      de: 'Online Wecker mit eigener Musik. Interaktiver Online Timer mit Audio-Benachrichtigung.',
      en: 'Online alarm clock with custom music. Interactive online timer with audio notification.',
    },
  },
  {
    url: 'https://kodinitools.com/audionormalisierer/',
    name: { de: 'Audio Normalizer', en: 'Audio Normalizer' },
    description: {
      de: 'Audio normalisieren online: MP3 Lautstärke angleichen, LUFS Normalisierung online kostenlos.',
      en: 'Normalize audio online: Match MP3 volume levels, free LUFS normalization online.',
    },
  },
  {
    url: 'https://kodinitools.com/bildkonverter/',
    name: { de: 'Bildkonverter', en: 'Image Converter' },
    description: {
      de: 'Bilder konvertieren online: JPG in WebP umwandeln, HEIC in JPG. Sicherer Bildkonverter ohne Upload.',
      en: 'Convert images online: JPG to WebP, HEIC to JPG. Secure image converter without upload.',
    },
  },
  {
    url: 'https://kodinitools.com/bilderseriebearbeiten/',
    name: { de: 'Batch Bildbearbeitung', en: 'Batch Image Editor' },
    description: {
      de: 'Bilder im Batch bearbeiten: Mehrere Bilder gleichzeitig skalieren, Wasserzeichen auf mehrere Bilder online.',
      en: 'Batch edit images: Resize multiple images at once, add watermark to multiple images online.',
    },
  },
  {
    url: 'https://kodinitools.com/collagemaker/',
    name: { de: 'Fotocollage', en: 'Photo Collage' },
    description: {
      de: 'Fotocollage online erstellen kostenlos mit Raster-Layout. Collage Maker für Instagram und mehr.',
      en: 'Create photo collage online free with grid layout. Collage maker for Instagram and more.',
    },
  },
  {
    url: 'https://kodinitools.com/kodini-color-extractor/',
    name: { de: 'Farbextraktor', en: 'Color Extractor' },
    description: {
      de: 'Farben aus Bild extrahieren: HEX Codes aus Bild finden online, Farbpalette aus Foto generieren.',
      en: 'Extract colors from image: Find HEX codes from image online, generate color palette from photo.',
    },
  },
  {
    url: 'https://kodinitools.com/videokonverter/',
    name: { de: 'Videokonverter', en: 'Video Converter' },
    description: {
      de: 'Video konvertieren online: MP4 in MOV umwandeln, Video zu GIF Converter online.',
      en: 'Convert video online: MP4 to MOV, video to GIF converter online.',
    },
  },
];
