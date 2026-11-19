// Tool-Katalog der Startseite: zusätzliche Daten je Karte, die nicht in den Locales
// stehen (Verarbeitung inkl. „Hybrid“, Dateiformate, Suchbegriffe) und die
// Workflow-Ketten. Titel, Beschreibung und Link bleiben in src/locales/*.json
// (Single Source of Truth, Admin-editierbar); der Katalog verweist über den
// i18n-Schlüssel der Karte darauf, z. B. „tools.audioConverter“.
//
// Neue Karte? Hier eintragen – tests/unit/tool-catalog.spec.ts schlägt sonst fehl.

import type { Lang } from '../i18n/lang';

/** Wo die Dateien verarbeitet werden. „hybrid“: Browser, mit Server für einzelne Funktionen. */
export type ToolProcessing = 'browser' | 'server' | 'hybrid';

export interface ToolCatalogEntry {
  processing: ToolProcessing;
  /** Nur bei „hybrid“: kurzer Satz, was auf dem Server läuft (je Sprache). */
  hybridNote?: Record<Lang, string>;
  /** Dateiendungen in Kleinbuchstaben, ohne Punkt. */
  formats: readonly string[];
  /** Anwendungsfälle und Suchbegriffe je Sprache, Kleinbuchstaben. */
  keywords: Record<Lang, readonly string[]>;
}

export const TOOL_CATALOG: Readonly<Record<string, ToolCatalogEntry>> = {
  'tools.audioConverter': {
    processing: 'hybrid',
    hybridNote: {
      de: 'Läuft im Browser; große Dateien und einige Formate werden auf unserem Server in Deutschland umgewandelt.',
      en: 'Runs in the browser; large files and some formats are converted on our server in Germany.',
    },
    formats: ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'],
    keywords: {
      de: ['umwandeln', 'konvertieren', 'format ändern', 'wav in mp3', 'mp3 in wav', 'flac'],
      en: ['convert', 'change format', 'wav to mp3', 'mp3 to wav', 'flac'],
    },
  },
  'tools.audioEqualizer': {
    processing: 'browser',
    formats: ['mp3', 'wav', 'webm'],
    keywords: {
      de: ['equalizer', 'klang', 'bass', 'höhen', 'kompressor', 'aufnahme', 'presets'],
      en: ['equalizer', 'sound', 'bass', 'treble', 'compressor', 'recording', 'presets'],
    },
  },
  'tools.musicPlayer': {
    processing: 'browser',
    formats: ['mp3', 'wav', 'flac', 'm4a', 'ogg'],
    keywords: {
      de: ['musik abspielen', 'player', 'playlist', 'shuffle', 'visualizer'],
      en: ['play music', 'player', 'playlist', 'shuffle', 'visualizer'],
    },
  },
  'tools.audioVisualizer': {
    processing: 'hybrid',
    hybridNote: {
      de: 'Die Darstellung läuft im Browser; der Video-Export kann auf unserem Server in Deutschland erfolgen.',
      en: 'The display runs in the browser; video export can run on our server in Germany.',
    },
    formats: ['mp3', 'wav', 'mp4', 'webm'],
    keywords: {
      de: [
        'musikvideo',
        'tiktok',
        'instagram reels',
        'youtube',
        'wellenform',
        'video aus audio',
        'podcast video',
      ],
      en: [
        'music video',
        'tiktok',
        'instagram reels',
        'youtube',
        'waveform',
        'audio to video',
        'podcast video',
      ],
    },
  },
  'tools.mp3Converter': {
    processing: 'hybrid',
    hybridNote: {
      de: 'Läuft im Browser; bei Bedarf wandelt unser Server in Deutschland um.',
      en: 'Runs in the browser; our server in Germany converts when needed.',
    },
    formats: ['mp3', 'wav', 'flac', 'ogg', 'm4a'],
    keywords: {
      de: ['mp3 erstellen', 'in mp3 umwandeln', 'podcast', 'hörbuch', 'komprimieren'],
      en: ['make mp3', 'convert to mp3', 'podcast', 'audiobook', 'compress'],
    },
  },
  'tools.interactiveEqualizer': {
    processing: 'browser',
    formats: ['mp3', 'wav', 'flac', 'ogg'],
    keywords: {
      de: ['equalizer', 'klang anpassen', 'bass', 'höhen', 'echtzeit', 'presets'],
      en: ['equalizer', 'adjust sound', 'bass', 'treble', 'real time', 'presets'],
    },
  },
  'tools.modernPlayer': {
    processing: 'browser',
    formats: ['mp3', 'wav', 'flac', 'm4a', 'ogg'],
    keywords: {
      de: ['musik abspielen', 'player', 'radio', 'playlist'],
      en: ['play music', 'player', 'radio', 'playlist'],
    },
  },
  'tools.playlistGenerator': {
    processing: 'browser',
    formats: ['m3u', 'm3u8', 'mp3', 'wav'],
    keywords: {
      de: ['playlist erstellen', 'wiedergabeliste', 'sortieren', 'filtern', 'm3u'],
      en: ['create playlist', 'sort', 'filter', 'm3u'],
    },
  },
  'tools.alarmTool': {
    processing: 'browser',
    formats: ['mp3', 'wav'],
    keywords: {
      de: ['wecker', 'alarmton', 'klingelton', 'ton erzeugen', 'oszillator'],
      en: ['alarm clock', 'alarm sound', 'ringtone', 'generate tone', 'oscillator'],
    },
  },
  'tools.audioNormalizer': {
    processing: 'browser',
    formats: ['mp3', 'wav', 'flac', 'ogg', 'm4a'],
    keywords: {
      de: [
        'lauter machen',
        'leiser machen',
        'lautstärke angleichen',
        'lufs',
        'normalisieren',
        'podcast',
        'spotify',
        'youtube',
      ],
      en: [
        'make louder',
        'make quieter',
        'match volume',
        'lufs',
        'normalize',
        'podcast',
        'spotify',
        'youtube',
      ],
    },
  },
  'tools.playlistToWebm': {
    processing: 'server',
    formats: ['mp3', 'wav', 'webm'],
    keywords: {
      de: ['tracks zusammenfügen', 'audio verbinden', 'mix', 'kapitel', 'webm'],
      en: ['join tracks', 'merge audio', 'mix', 'chapters', 'webm'],
    },
  },
  'tools.audioCutter': {
    processing: 'hybrid',
    hybridNote: {
      de: 'Schneidet im Browser; optional schneidet unser Server in Deutschland millisekundengenau.',
      en: 'Cuts in the browser; optionally our server in Germany cuts with millisecond precision.',
    },
    formats: ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'],
    keywords: {
      de: ['schneiden', 'zuschneiden', 'kürzen', 'trimmen', 'ausschnitt', 'klingelton'],
      en: ['cut', 'trim', 'crop', 'shorten', 'clip', 'ringtone'],
    },
  },
  'imageTools.imageConverter': {
    processing: 'hybrid',
    hybridNote: {
      de: 'Gängige Formate im Browser; TIFF und HEIC wandelt unser Server in Deutschland um.',
      en: 'Common formats in the browser; TIFF and HEIC are converted on our server in Germany.',
    },
    formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg', 'tiff', 'heic', 'heif'],
    keywords: {
      de: [
        'bild umwandeln',
        'jpg in webp',
        'png in jpg',
        'heic in jpg',
        'bild komprimieren',
        'format ändern',
      ],
      en: [
        'convert image',
        'jpg to webp',
        'png to jpg',
        'heic to jpg',
        'compress image',
        'change format',
      ],
    },
  },
  'imageTools.batchImageEditor': {
    processing: 'hybrid',
    hybridNote: {
      de: 'Bearbeitung im Browser; nur der SVG-Export läuft über unseren Server in Deutschland.',
      en: 'Editing in the browser; only the SVG export runs through our server in Germany.',
    },
    formats: ['jpg', 'jpeg', 'png', 'webp', 'svg', 'zip', 'pdf'],
    keywords: {
      de: ['bildgröße ändern', 'skalieren', 'umbenennen', 'mehrere bilder', 'stapel', 'zip', 'pdf'],
      en: ['resize image', 'scale', 'rename', 'multiple images', 'batch', 'zip', 'pdf'],
    },
  },
  'imageTools.photoCollage': {
    processing: 'browser',
    formats: ['jpg', 'png', 'webp'],
    keywords: {
      de: ['collage', 'fotocollage', 'bilder zusammenfügen', 'layout', 'vorlage'],
      en: ['collage', 'photo collage', 'combine images', 'layout', 'template'],
    },
  },
  'diverseTools.colorExtractor': {
    processing: 'browser',
    formats: ['jpg', 'png', 'webp', 'gif'],
    keywords: {
      de: ['farben', 'farbpalette', 'hex', 'farbcode', 'dominante farbe', 'farbgenerator'],
      en: ['colors', 'color palette', 'hex', 'color code', 'dominant color', 'color generator'],
    },
  },
  'diverseTools.videoConverter': {
    processing: 'server',
    formats: ['mp4', 'webm', 'avi', 'mov', 'ts', 'flv', 'mkv'],
    keywords: {
      de: ['video umwandeln', 'video konvertieren', 'mp4', 'format ändern'],
      en: ['convert video', 'change format', 'mp4'],
    },
  },
  'diverseTools.textEditor': {
    processing: 'browser',
    formats: ['txt', 'html', 'md', 'pdf'],
    keywords: {
      de: ['text schreiben', 'dokument', 'notizen', 'markdown', 'pdf erstellen'],
      en: ['write text', 'document', 'notes', 'markdown', 'create pdf'],
    },
  },
  // Admin-Karte (nur in overrides.*.json, Schlüssel historisch „textEditor-kopie“).
  'diverseTools.textEditor-kopie': {
    processing: 'browser',
    formats: ['ico', 'png', 'webp', 'gif', 'bmp', 'svg'],
    keywords: {
      de: ['favicon', 'website icon', 'app icon', 'apple touch icon', 'ico erstellen'],
      en: ['favicon', 'website icon', 'app icon', 'apple touch icon', 'create ico'],
    },
  },
};

export interface ToolWorkflow {
  id: string;
  /** i18n-Schlüssel der Schritte in Reihenfolge (Schlüssel von TOOL_CATALOG). */
  steps: readonly string[];
  title: Record<Lang, string>;
  description: Record<Lang, string>;
}

export const TOOL_WORKFLOWS: readonly ToolWorkflow[] = [
  {
    id: 'podcast',
    steps: ['tools.audioConverter', 'tools.audioNormalizer', 'tools.audioVisualizer'],
    title: { de: 'Podcast veröffentlichen', en: 'Publish a podcast' },
    description: {
      de: 'Format umwandeln, Lautstärke angleichen, Video für Social Media erstellen.',
      en: 'Convert the format, match the volume, create a video for social media.',
    },
  },
  {
    id: 'clip',
    steps: ['tools.audioCutter', 'tools.audioNormalizer', 'tools.audioVisualizer'],
    title: { de: 'Song-Ausschnitt als Video', en: 'Song clip as video' },
    description: {
      de: 'Ausschnitt schneiden, Lautstärke angleichen, Musikvideo für Reels oder TikTok erstellen.',
      en: 'Cut a clip, match the volume, create a music video for Reels or TikTok.',
    },
  },
  {
    id: 'images',
    steps: ['imageTools.imageConverter', 'imageTools.batchImageEditor', 'imageTools.photoCollage'],
    title: { de: 'Bilderserie vorbereiten', en: 'Prepare an image series' },
    description: {
      de: 'Bilder umwandeln, Größe stapelweise anpassen, zur Collage zusammenfügen.',
      en: 'Convert images, resize them in batch, combine them into a collage.',
    },
  },
  {
    id: 'palette',
    steps: ['diverseTools.colorExtractor', 'imageTools.photoCollage'],
    title: { de: 'Farbpalette für die Collage', en: 'Color palette for a collage' },
    description: {
      de: 'Farben aus einem Foto auslesen und die Collage passend gestalten.',
      en: 'Read the colors from a photo and style the collage to match.',
    },
  },
];

export interface ResolvedWorkflowStep {
  key: string;
  title: string;
  link: string;
  svg: string;
}

export interface ResolvedWorkflow {
  id: string;
  title: string;
  description: string;
  steps: ResolvedWorkflowStep[];
}

/** Karte der Seite (Titel mit Umbruch erlaubt, Link, Icon) für die Auflösung der Ketten. */
export interface WorkflowTool {
  title: string;
  link: string;
  svg: string;
}

/**
 * Ketten für eine Sprache: Schritte, deren Karte im Admin ausgeblendet ist oder fehlt,
 * entfallen; bleiben weniger als zwei Schritte übrig, entfällt die ganze Kette.
 * Der Titel eines Schritts ist die erste Zeile des Kartentitels (ohne Formatzeile).
 */
export function resolveWorkflows(
  tools: ReadonlyMap<string, WorkflowTool>,
  lang: Lang,
  workflows: readonly ToolWorkflow[] = TOOL_WORKFLOWS,
): ResolvedWorkflow[] {
  return workflows.flatMap((wf) => {
    const steps = wf.steps.flatMap((key) => {
      const tool = tools.get(key);
      return tool
        ? [{ key, title: tool.title.split('\n')[0] ?? tool.title, link: tool.link, svg: tool.svg }]
        : [];
    });
    return steps.length >= 2
      ? [{ id: wf.id, title: wf.title[lang], description: wf.description[lang], steps }]
      : [];
  });
}
