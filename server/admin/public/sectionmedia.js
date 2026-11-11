// @ts-check
// Medien-Tab: Sektions-Medien (Audio-/Bild-/Diverse-Tools) dreispaltig.
// Links: Design je Hell/Dunkel (Rahmen, Eckenradius, Deckkraft, Verdunkelung)
//        und Diashow (weitere Bilder – nur wenn das Medium ein Bild ist).
// Mitte: Sektionswahl, Sticky-Vorschau (Hell/Dunkel), Medium (Video ODER Bild:
//        Pfad/URL, Zwischenspeicher, Standard).
// Rechts: Text-Overlay (Text, Schrift, Farbe, Größe, Position, Deckkraft,
//        Schatten, Umriss) – in der Vorschau per Maus verschiebbar.
// Gespeichert in media.<lang>.sectionMedia[audio|image|diverse].

import { state, getMediaVal, getSectionMedia, rgbaFromHex } from './model.js';
import { objUrl } from './media.js';
import { overlayStyle } from './layout-shared.js';

/** @import { Lang, MediaKey, SectionVideoKey, ThemeMode, StagedItem } from '../types.ts' */
/** @import { SectionMediaText } from './model-sectionmedia.js' */

const BASE_BORDER = '1.5px solid rgba(1,79,153,.2)';

// Aufgelöstes Medium der Sektion: { val, src, isVid, item } oder null.
/**
 * @param {Lang} lang
 * @param {MediaKey} key
 * @returns {{ val: string; src: string; isVid: boolean; item: StagedItem | null } | null}
 */
export function mediaInfo(lang, key) {
  const val = getMediaVal(lang, key);
  if (!val) return null;
  if (val.startsWith('staged:')) {
    const id = val.slice(7);
    const item = state.stagedItems.find((x) => x.id === id);
    if (!item) return null;
    return { val, src: objUrl(id), isVid: /^video\//.test(item.type), item };
  }
  return { val, src: val, isVid: /\.(mp4|webm|mov|m4v|ogv)$/i.test(val), item: null };
}

// Design eines Modus als Inline-CSS: Wrapper (Rahmen, Radius) + Medium (Deckkraft, Filter).
/**
 * @param {Lang} lang
 * @param {SectionVideoKey} key
 * @param {ThemeMode} mode
 */
export function designCss(lang, key, mode) {
  const s = getSectionMedia(lang, key).style[mode];
  const border = s.customBorder
    ? s.borderWidth > 0
      ? `${s.borderWidth}px solid ${s.borderColor}`
      : '0'
    : BASE_BORDER;
  return {
    wrap: `border:${border};border-radius:${s.borderRadius}px`,
    media: `opacity:${(s.opacity / 100).toFixed(2)};filter:${s.darken > 0 ? `brightness(${((100 - s.darken) / 100).toFixed(2)})` : 'none'}`,
  };
}
// Text-Overlay-Style (Vorschau) aus den Text-Feldern.
/** @param {SectionMediaText} t */
export function textStyle(t) {
  const shadow = t.shadow
    ? `${t.shadowX}px ${t.shadowY}px ${t.shadowBlur}px ${rgbaFromHex(t.shadowColor || '#000000', 60)}`
    : 'none';
  const extra = [];
  if (t.strokeWidth > 0) extra.push(`-webkit-text-stroke:${t.strokeWidth}px ${t.strokeColor}`);
  if (t.opacity < 100) extra.push(`opacity:${(t.opacity / 100).toFixed(2)}`);
  return overlayStyle(
    t.color,
    t.size,
    t.x,
    t.y,
    t.font,
    '1.3rem',
    shadow,
    extra.length ? ';' + extra.join(';') : '',
  );
}

export const MEDIA_BASE =
  'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block';
