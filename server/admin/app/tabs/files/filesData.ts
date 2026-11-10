import type { Lang, ThemeMode } from '../../../types';

/**
 * Datenmodell und reine Regeln des Tabs „Dateien“ (Vue-Fassung von
 * `renderFiles` in `public/media.js`). Welche Plätze eine Datei nutzen
 * („wird verwendet in“), berechnet weiterhin die Vanilla-Seite
 * (`usageDetailed` über alle Bild-Plätze) und reicht es per `snapshot()` herein –
 * eine Quelle der Wahrheit, kein zweiter `state` im Bundle.
 */

/** Modus, in dem ein Platz gilt ('both' = Hell und Dunkel). */
export type UsageMode = ThemeMode | 'both';
export interface FileUsage {
  label: string;
  mode: UsageMode;
}
interface FileBase {
  /** Eindeutiger Schlüssel für Listen. */
  key: string;
  name: string;
  /** Anzeige-URL (Server-URL bzw. objectURL des Zwischenspeichers). */
  src: string;
  bytes: number | null;
  /** Endung in Großbuchstaben, z. B. „WEBP“, oder ''. */
  ext: string;
  isVid: boolean;
  usage: FileUsage[];
}
export interface ServerFileView extends FileBase {
  kind: 'server';
  /** Pfad relativ zu `/uploads`, z. B. `de/bild.webp`. */
  path: string;
}
export interface StagedFileView extends FileBase {
  kind: 'staged';
  id: string;
  published: boolean;
}
export type FileView = ServerFileView | StagedFileView;
export interface FilesSnapshot {
  server: ServerFileView[];
  shared: ServerFileView[];
  staged: StagedFileView[];
}
/** Ordner einer Server-Datei: Sprache oder '' = gemeinsam. */
export type FileLoc = Lang | '';
export interface ActionResult {
  ok: boolean;
  error?: string;
}

/** Aktionen + Daten, die `public/media.js` dem Tab übergibt. */
export interface FilesService {
  snapshot: () => FilesSnapshot;
  deleteServer: (path: string) => Promise<ActionResult>;
  moveServer: (path: string, toLang: FileLoc) => Promise<ActionResult>;
  deleteStaged: (id: string) => Promise<ActionResult>;
  addFiles: (
    files: FileList | File[],
  ) => Promise<ActionResult & { added: number; tooBig: string[] }>;
}

export const LOC_LABEL: Record<FileLoc, string> = { de: 'DE', en: 'EN', '': 'Gemeinsam' };
export const MODE_LABEL: Record<ThemeMode, string> = { light: '☀️ Hell', dark: '🌙 Dunkel' };
export const MODE_ICON: Record<UsageMode, string> = { light: '☀️', dark: '🌙', both: '' };
/** Größtes Upload-Format (wie Server-Limit). */
export const MAX_FILE_BYTES = 2048 * 1024 * 1024;

/** Gilt der Platz im Modus? */
export const inMode = (u: FileUsage, mode: ThemeMode) => u.mode === 'both' || u.mode === mode;

/** Zielordner für „Verschieben“ (alle außer dem aktuellen). */
export function moveTargets(loc: FileLoc): FileLoc[] {
  return loc === 'de' ? ['en', ''] : loc === 'en' ? ['de', ''] : ['de', 'en'];
}

/** Bytes lesbar (wie `fmtBytes` in `public/core.js`). */
export function fmtBytes(n: number | null | undefined): string {
  if (!n && n !== 0) return '';
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(0) + ' KB';
  return (n / 1024 / 1024).toFixed(1) + ' MB';
}

/** Markierung einer Kachel im gewählten Modus, oder null. */
export function modeMark(usage: FileUsage[], mode: ThemeMode): string | null {
  const used = usage.filter((u) => inMode(u, mode));
  if (!used.length) return null;
  const only = used.every((u) => u.mode === mode);
  return `${MODE_LABEL[mode]}${only ? ' (nur dieser Modus)' : ''} ✓`;
}

/** Eintrag der Modus-Übersicht „Eingesetzte Dateien“. */
export interface ModeEntry {
  file: FileView;
  where: string;
  used: FileUsage[];
}
/** Dateien (Sprache, gemeinsam, Zwischenspeicher), die im Modus eingesetzt sind. */
export function modeEntries(snap: FilesSnapshot, lang: Lang, mode: ThemeMode): ModeEntry[] {
  const all: Array<{ file: FileView; where: string }> = [
    ...snap.server.map((f) => ({ file: f as FileView, where: LOC_LABEL[lang] })),
    ...snap.shared.map((f) => ({ file: f as FileView, where: LOC_LABEL[''] })),
    ...snap.staged.map((f) => ({ file: f as FileView, where: 'Zwischenspeicher' })),
  ];
  return all
    .map((e) => ({ ...e, used: e.file.usage.filter((u) => inMode(u, mode)) }))
    .filter((e) => e.used.length);
}

/** Text der Rückfrage vor dem Löschen einer Server-Datei. */
export function deleteServerQuestion(f: ServerFileView): string {
  return f.usage.length
    ? `⚠ Diese Datei wird noch verwendet in: ${f.usage.map((u) => u.label).join(', ')}. Trotzdem löschen? Die betroffenen Plätze zeigen dann kein Medium mehr.`
    : `Datei „${f.path}“ vom Server löschen?`;
}
