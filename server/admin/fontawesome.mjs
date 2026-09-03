// Auflistung der auf dem Server verfügbaren Font-Awesome-Icons (SVG-Dateien).
// Der Admin kann im „Icons"-Tab ein Icon auswählen, in der Vorschau ansehen und
// zur Seite hinzufügen. Gelesen wird aus dem Webroot
// (/var/www/kodinitools.com/public/fontawesome/svgs — die tatsächlich
// ausgelieferten Dateien) und zusätzlich aus public/fontawesome/svgs im Repo
// (git-gesichert, als Fallback für die lokale Entwicklung). Ausgeliefert werden
// die Icons unter der öffentlichen URL /fontawesome/svgs/<kategorie>/<datei>.

import { readdir } from 'node:fs/promises';
import { resolve, basename } from 'node:path';
import { config } from './config.mjs';

// Unterstützte Icon-Sets (Unterordner von svgs/).
export const ICON_CATEGORIES = ['solid', 'regular', 'brands'];

/** Nur einfache SVG-Dateinamen (kein Pfad/Traversal, keine versteckten Dateien). */
export function isValidIconFile(name) {
  return (
    typeof name === 'string' &&
    name.length > 0 &&
    name === basename(name) &&
    !name.startsWith('.') &&
    /^[a-zA-Z0-9][a-zA-Z0-9._-]*\.svg$/i.test(name)
  );
}

async function readIconDir(dir) {
  let names;
  try {
    names = await readdir(dir);
  } catch {
    return [];
  }
  return names.filter(isValidIconFile);
}

/**
 * Verfügbare Icons je Kategorie (nach Dateiname vereinigt, alphabetisch sortiert).
 * Webroot hat Vorrang; public/fontawesome füllt in der Entwicklung auf.
 * Rückgabe: { solid: string[], regular: string[], brands: string[] } (nur Dateinamen;
 * Label und URL baut der Client, um die Nutzlast klein zu halten).
 */
export async function listFontAwesome() {
  const bases = [
    resolve(config.webroot, 'public/fontawesome/svgs'),
    resolve(config.repoDir, 'public/fontawesome/svgs'),
  ];
  const out = {};
  for (const cat of ICON_CATEGORIES) {
    const seen = new Set();
    for (const base of bases) {
      for (const name of await readIconDir(resolve(base, cat))) seen.add(name);
    }
    out[cat] = [...seen].sort((a, b) => a.localeCompare(b));
  }
  return out;
}
