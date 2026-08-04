// Auflistung der auf dem Server verfügbaren Schriftarten. Der Admin kann für das
// Laufband (DE/EN) eine eigene Schrift aus dem Fonts-Ordner wählen. Gelesen wird
// aus dem Webroot (/var/www/kodinitools.com/fonts — dort liegen die tatsächlich
// ausgelieferten Dateien) und zusätzlich aus public/fonts im Repo (git-gesichert,
// als Fallback für die lokale Entwicklung). Dateinamen werden zusammengeführt.

import { readdir, stat } from 'node:fs/promises';
import { resolve, extname, basename } from 'node:path';
import { config } from './config.mjs';

const FONT_EXT = new Set(['.woff2', '.woff', '.ttf', '.otf']);

/** Nur einfache Dateinamen mit erlaubter Schrift-Endung (kein Pfad/Traversal). */
export function isValidFontFile(name) {
  return (
    typeof name === 'string' &&
    name.length > 0 &&
    name === basename(name) &&
    !name.startsWith('.') &&
    /^[a-zA-Z0-9][a-zA-Z0-9._ -]*\.(woff2|woff|ttf|otf)$/i.test(name)
  );
}

/** Dateiname -> Anzeige-Label (ohne Endung). */
export function fontLabel(name) {
  const ext = extname(name);
  return name.slice(0, name.length - ext.length);
}

async function readFontDir(dir) {
  let names;
  try {
    names = await readdir(dir);
  } catch {
    return [];
  }
  const out = [];
  for (const name of names) {
    if (!isValidFontFile(name)) continue;
    if (!FONT_EXT.has(extname(name).toLowerCase())) continue;
    let s;
    try {
      s = await stat(resolve(dir, name));
    } catch {
      continue;
    }
    if (!s.isFile()) continue;
    out.push({
      name,
      label: fontLabel(name),
      url: `/fonts/${encodeURIComponent(name)}`,
      bytes: s.size,
    });
  }
  return out;
}

/**
 * Verfügbare Schriften (nach Dateiname vereinigt, alphabetisch sortiert).
 * Webroot hat Vorrang; public/fonts füllt in der Entwicklung auf.
 */
export async function listFonts() {
  const dirs = [resolve(config.webroot, 'fonts'), resolve(config.repoDir, 'public/fonts')];
  const seen = new Map();
  for (const d of dirs) {
    for (const f of await readFontDir(d)) {
      if (!seen.has(f.name)) seen.set(f.name, f);
    }
  }
  return [...seen.values()].sort((a, b) => a.label.localeCompare(b.label));
}
