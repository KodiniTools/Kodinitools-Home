// Datei-Uploads. Der Admin-Client sendet die Datei als Raw-Body mit dem
// Header X-Filename (kein Multipart-Parsing nötig). Ziel: uploadsDir auf dem
// Server (außerhalb Git). Rückgabe: öffentlicher Pfad /uploads/<datei>.

import { mkdir, writeFile, access, copyFile } from 'node:fs/promises';
import { resolve, extname, basename } from 'node:path';
import { randomBytes } from 'node:crypto';
import { config } from './config.mjs';

const ALLOWED = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.svg',
  '.avif',
  '.mp4',
  '.webm',
  '.mov',
  '.ogg',
  '.mp3',
  '.wav',
]);

/** Macht einen Dateinamen sicher (keine Pfade, nur erlaubte Zeichen). */
function safeName(name) {
  const base = basename(String(name || '')).replace(/[^a-zA-Z0-9._-]/g, '-');
  const ext = extname(base).toLowerCase();
  const stem = base.slice(0, base.length - ext.length).slice(0, 60) || 'datei';
  return { stem, ext };
}

async function uniquePath(dir, stem, ext) {
  // Kurzes Zufalls-Suffix gegen Kollisionen/Überschreiben.
  for (let i = 0; i < 5; i++) {
    const suffix = randomBytes(4).toString('hex');
    const fname = `${stem}-${suffix}${ext}`;
    const full = resolve(dir, fname);
    try {
      await access(full);
    } catch {
      return { full, fname };
    }
  }
  const fname = `${stem}-${Date.now()}${ext}`;
  return { full: resolve(dir, fname), fname };
}

/**
 * Speichert einen Upload.
 * @param {Buffer} buf  Dateiinhalt
 * @param {string} filename  gewünschter Name (aus X-Filename)
 * @returns {{ url: string, filename: string, bytes: number }}
 */
export async function saveUpload(buf, filename) {
  const { stem, ext } = safeName(filename);
  if (!ALLOWED.has(ext)) {
    throw Object.assign(new Error(`Dateityp ${ext || '(keiner)'} nicht erlaubt`), {
      statusCode: 415,
    });
  }
  if (!buf || buf.length === 0) {
    throw Object.assign(new Error('Leere Datei'), { statusCode: 400 });
  }
  await mkdir(config.uploadsDir, { recursive: true });
  const { full, fname } = await uniquePath(config.uploadsDir, stem, ext);
  await writeFile(full, buf);

  // Zusätzlich eine versionierbare Kopie im Repo ablegen (public/uploads/).
  // Beim Veröffentlichen wird sie mitcommittet; der Build kopiert public/uploads
  // nach dist/uploads und der Deploy spiegelt es ins Webroot. Dadurch wird die
  // Datei bei JEDEM Deploy wiederhergestellt — auch wenn /var/www/.../uploads
  // zwischendurch geleert wird. Schlägt die Kopie fehl, gilt der Upload dennoch
  // als erfolgreich (die Webroot-Datei existiert bereits).
  try {
    const repoUploads = resolve(config.repoDir, 'public/uploads');
    await mkdir(repoUploads, { recursive: true });
    const repoTarget = resolve(repoUploads, fname);
    if (repoTarget !== full) await copyFile(full, repoTarget);
  } catch (e) {
    console.warn('[kodini-admin] Upload-Kopie nach public/uploads fehlgeschlagen:', e.message);
  }

  return { url: `/uploads/${fname}`, filename: fname, bytes: buf.length };
}
