/**
 * Farb-Hilfsmodul: Hex ↔ RGB ↔ HSL, Parsing und Normalisierung.
 *
 * Übernommen aus KodiniTools/Visualizer (`src/lib/color.js`), hier in TypeScript.
 * Logik unverändert.
 *
 * Konventionen:
 * - Hex-Ausgabe ist immer `#rrggbb` (kleingeschrieben, ohne Alpha).
 * - HSL: h in [0, 360), s und l in [0, 100] – als Fließkommazahlen, damit
 *   Round-Trips (hex → hsl → hex) verlustfrei bleiben. Runden übernimmt die UI.
 *
 * Das Modul ist frameworkfrei (kein Vue-Import).
 */

export type HslChannel = 'h' | 's' | 'l';
export interface Hsl {
  h: number;
  s: number;
  l: number;
}
export interface Rgb {
  r: number;
  g: number;
  b: number;
}
export interface ChannelRange {
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly unit: string;
}

/** Wertebereiche der drei HSL-Kanäle (für Slider/Spinner). */
export const HSL_RANGES: Readonly<Record<HslChannel, ChannelRange>> = Object.freeze({
  h: Object.freeze({ min: 0, max: 360, step: 1, unit: '°' }),
  s: Object.freeze({ min: 0, max: 100, step: 1, unit: '%' }),
  l: Object.freeze({ min: 0, max: 100, step: 1, unit: '%' }),
});

/** Sicherer Fallback, wenn ein Wert nicht als Farbe interpretierbar ist. */
export const FALLBACK_HEX = '#000000';

const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const RGB_RE =
  /^rgba?\(\s*([\d.]+%?)\s*[, ]\s*([\d.]+%?)\s*[, ]\s*([\d.]+%?)(?:\s*[,/]\s*[\d.]+%?)?\s*\)$/i;

/** Begrenzt einen Wert auf [min, max]. Nicht-numerische Eingaben ergeben `min`. */
export function clamp(value: unknown, min: number, max: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

/** Normalisiert einen Farbton auf [0, 360). */
export function normalizeHue(h: unknown): number {
  const n = Number(h);
  if (!Number.isFinite(n)) return 0;
  const wrapped = n % 360;
  return wrapped < 0 ? wrapped + 360 : wrapped;
}

function parseRgbChannel(token: string): number {
  if (token.endsWith('%')) {
    return Math.round((clamp(parseFloat(token), 0, 100) / 100) * 255);
  }
  return Math.round(clamp(parseFloat(token), 0, 255));
}

/**
 * Normalisiert eine Farbangabe zu `#rrggbb`.
 *
 * Akzeptiert: `#rgb`, `rgb`, `#rgba`, `#rrggbb`, `rrggbb`, `#rrggbbaa`
 * (Alpha wird verworfen) sowie `rgb()`/`rgba()`-Strings. Groß-/Kleinschreibung
 * und umgebende Leerzeichen sind egal.
 *
 * @returns `#rrggbb` oder `null` bei ungültiger Eingabe
 */
export function normalizeHex(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const s = input.trim();
  if (!s) return null;

  const hexMatch = HEX_RE.exec(s);
  if (hexMatch?.[1]) {
    let hex = hexMatch[1].toLowerCase();
    if (hex.length === 3 || hex.length === 4) {
      hex = hex
        .slice(0, 3)
        .split('')
        .map((c) => c + c)
        .join('');
    } else if (hex.length === 8) {
      hex = hex.slice(0, 6);
    }
    return `#${hex}`;
  }

  const rgbMatch = RGB_RE.exec(s);
  if (rgbMatch) {
    const [r = 0, g = 0, b = 0] = rgbMatch.slice(1, 4).map((token) => parseRgbChannel(token ?? ''));
    return rgbToHex(r, g, b);
  }

  return null;
}

/** true, wenn `normalizeHex` die Eingabe versteht. */
export function isValidHex(input: unknown): boolean {
  return normalizeHex(input) !== null;
}

/** @param hex beliebiges von `normalizeHex` akzeptiertes Format */
export function hexToRgb(hex: unknown): Rgb | null {
  const n = normalizeHex(hex);
  if (!n) return null;
  return {
    r: parseInt(n.slice(1, 3), 16),
    g: parseInt(n.slice(3, 5), 16),
    b: parseInt(n.slice(5, 7), 16),
  };
}

/** Kanäle 0–255 → `#rrggbb`. */
export function rgbToHex(r: number, g: number, b: number): string {
  const to = (v: number) =>
    Math.round(clamp(v, 0, 255))
      .toString(16)
      .padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

/** Kanäle 0–255 → h ∈ [0,360), s/l ∈ [0,100]. */
export function rgbToHsl(r: number, g: number, b: number): Hsl {
  const rn = clamp(r, 0, 255) / 255;
  const gn = clamp(g, 0, 255) / 255;
  const bn = clamp(b, 0, 255) / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l: l * 100 };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  h *= 60;

  return { h: normalizeHue(h), s: s * 100, l: l * 100 };
}

function hueToRgb(p: number, q: number, t: number): number {
  let tt = t;
  if (tt < 0) tt += 1;
  if (tt > 1) tt -= 1;
  if (tt < 1 / 6) return p + (q - p) * 6 * tt;
  if (tt < 1 / 2) return q;
  if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
  return p;
}

/** Farbton (normalisiert), Sättigung/Helligkeit 0–100 → ganzzahlige Kanäle 0–255. */
export function hslToRgb(h: number, s: number, l: number): Rgb {
  const hn = normalizeHue(h) / 360;
  const sn = clamp(s, 0, 100) / 100;
  const ln = clamp(l, 0, 100) / 100;

  if (sn === 0) {
    const v = Math.round(ln * 255);
    return { r: v, g: v, b: v };
  }

  const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn;
  const p = 2 * ln - q;
  return {
    r: Math.round(hueToRgb(p, q, hn + 1 / 3) * 255),
    g: Math.round(hueToRgb(p, q, hn) * 255),
    b: Math.round(hueToRgb(p, q, hn - 1 / 3) * 255),
  };
}

export function hexToHsl(hex: unknown): Hsl | null {
  const rgb = hexToRgb(hex);
  return rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : null;
}

export function hslToHex(h: number, s: number, l: number): string {
  const { r, g, b } = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
}

/** Setzt einen HSL-Kanal auf einen (geclampten) Wert und liefert ein neues Objekt. */
export function setHslChannel(hsl: Hsl, channel: HslChannel, value: unknown): Hsl {
  const range = HSL_RANGES[channel];
  if (!range) return { ...hsl };
  return { ...hsl, [channel]: clamp(value, range.min, range.max) };
}

/**
 * Liefert für die Slider-Tracks passende CSS-Hintergründe (Verläufe) zum
 * aktuellen HSL-Zustand. Reine Darstellungshilfe.
 */
export function hslTrackGradients(hsl: Hsl): Record<HslChannel, string> {
  const h = Math.round(normalizeHue(hsl.h));
  const s = Math.round(clamp(hsl.s, 0, 100));
  const l = Math.round(clamp(hsl.l, 0, 100));
  return {
    h: 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)',
    s: `linear-gradient(to right, hsl(${h} 0% ${l}%), hsl(${h} 100% ${l}%))`,
    l: `linear-gradient(to right, #000, hsl(${h} ${s}% 50%), #fff)`,
  };
}
