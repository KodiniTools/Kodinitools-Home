// Pixelmaße eines Bildes aus public/ beim Build auslesen (nur Datei-Header,
// ohne Abhängigkeiten). Damit können <img>-Tags width/height bzw. ein
// Seitenverhältnis erhalten und der Browser reserviert den Platz, bevor das
// Bild geladen ist (verhindert Layout-Verschiebungen / CLS).
// Unterstützt PNG, JPEG, WebP (VP8, VP8L, VP8X) und GIF – unabhängig von der
// Dateiendung (Uploads sind teils JPEGs mit .png-Endung).
import { readFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';

export interface ImageSize {
  width: number;
  height: number;
}

const PUBLIC_DIR = resolve('public');
const cache = new Map<string, ImageSize | null>();

function parse(buf: Buffer): ImageSize | null {
  if (buf.length < 30) return null;
  // PNG: Signatur + IHDR
  if (buf.readUInt32BE(0) === 0x89504e47) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  // GIF
  if (buf.toString('ascii', 0, 3) === 'GIF') {
    return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
  }
  // WebP
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    const chunk = buf.toString('ascii', 12, 16);
    if (chunk === 'VP8X') {
      return { width: buf.readUIntLE(24, 3) + 1, height: buf.readUIntLE(27, 3) + 1 };
    }
    if (chunk === 'VP8 ') {
      return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
    }
    if (chunk === 'VP8L') {
      const b = buf.readUInt32LE(21);
      return { width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1 };
    }
    return null;
  }
  // JPEG: Segmente bis zum SOF-Marker durchlaufen
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) return null;
      const marker = buf[i + 1];
      const len = buf.readUInt16BE(i + 2);
      // SOF0–SOF15 außer DHT (C4), JPG (C8), DAC (CC)
      if (
        marker >= 0xc0 &&
        marker <= 0xcf &&
        marker !== 0xc4 &&
        marker !== 0xc8 &&
        marker !== 0xcc
      ) {
        return { width: buf.readUInt16BE(i + 7), height: buf.readUInt16BE(i + 5) };
      }
      i += 2 + len;
    }
  }
  return null;
}

/**
 * Maße eines Bildes unter public/ (z. B. "/uploads/de/banner.webp").
 * Gibt null zurück bei externen URLs, unbekanntem Format, fehlender Datei oder
 * Pfaden außerhalb von public/ – der Aufrufer rendert dann ohne Maße (bisheriges Verhalten).
 */
export function getPublicImageSize(src: string): ImageSize | null {
  if (typeof src !== 'string' || !src.startsWith('/') || src.startsWith('//')) return null;
  const clean = src.split(/[?#]/)[0];
  if (cache.has(clean)) return cache.get(clean) ?? null;
  let size: ImageSize | null = null;
  try {
    const file = resolve(PUBLIC_DIR, '.' + decodeURIComponent(clean));
    if (file.startsWith(PUBLIC_DIR + sep)) {
      const s = parse(readFileSync(file));
      if (s && s.width > 0 && s.height > 0) size = s;
    }
  } catch {
    size = null; // Datei fehlt (z. B. nur im Server-Webroot) -> ohne Maße rendern
  }
  cache.set(clean, size);
  return size;
}
