// Gemeinsame Vorschau-Helfer (Ganzseiten-Vorschau, Hero-Design, Abschnitts-
// Medien): fontFF, slideInfo, overlayStyle.

import { state } from './model';
import { objUrl } from './media';
import { ensureFontFace } from './fonts';
import type { StagedItem } from '../types';

const clamp = (v: number, min: number, max: number): number => Math.max(min, Math.min(max, v));
// font-family-CSS für eine Kachel-Textschrift (lädt @font-face für die Vorschau) oder ''.

export function fontFF(file: string | null | undefined) {
  return file ? `font-family:'${ensureFontFace(file)}', var(--site-font, sans-serif);` : '';
}

// Ein Diashow-Bild (Server-URL oder 'staged:<id>') auflösen: { src, item } oder null.
export function slideInfo(
  val: string | null | undefined,
): { src: string; item: StagedItem | null } | null {
  if (!val) return null;
  if (val.startsWith('staged:')) {
    const id = val.slice(7);
    const item = state.stagedItems.find((x) => x.id === id);
    if (!item) return null;
    return { src: objUrl(id), item };
  }
  return { src: val, item: null };
}

// Gemeinsamer Overlay-Style: der Text wird an (x,y) in % verankert (Mittelpunkt)
// und lässt sich in der Vorschau mit der Maus frei verschieben (cursor:move).
/**
 * @param size px, 0 = `fsDefault`
 * @param x Position in %
 * @param y Position in %
 * @param shadow text-shadow
 * @param extra weiteres CSS
 */
export function overlayStyle(
  color: string,
  size: number,
  x: unknown,
  y: unknown,
  font: string,
  fsDefault: string,
  shadow: string,
  extra?: string,
) {
  const fs = size > 0 ? `${size}px` : fsDefault;
  const cx = clamp(Number(x) || 0, 0, 100);
  const cy = clamp(Number(y) || 0, 0, 100);
  return `position:absolute;left:${cx}%;top:${cy}%;transform:translate(-50%,-50%);max-width:92%;text-align:center;padding:.1rem .3rem;color:${color || '#fff'};font-size:${fs};line-height:1.2;text-shadow:${shadow};white-space:pre-line;word-break:break-word;cursor:move;pointer-events:auto;user-select:none;touch-action:none;${fontFF(font)}${extra || ''}`;
}
