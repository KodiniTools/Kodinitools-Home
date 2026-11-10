// @ts-check
// Hero-Design-Vorschau (Admin > Hero-Design): Banner-Medium und Seiten-Layout
// wie auf der Startseite (HomePage.astro, hero.css, home-compact.css), damit die
// Vorschau dasselbe Bild zeigt wie die Seite. Reine Funktionen ohne DOM, damit
// sie testbar sind; design.js löst gestagte Medien selbst auf (objUrl).
import { rgbaFromHex, getBannerStyle } from './model.js';

const VIDEO_RE = /\.(mp4|webm|mov|m4v|ogv|ogg)$/i;

/**
 * Banner-Medium, das der Hero der Startseite zeigt, oder null: nur im Modus
 * „Banner" (nicht Raster), wenn das Banner eingeblendet und ein Bild/Video
 * zugewiesen ist. `resolveStaged(id)` liefert für einen noch nicht
 * veröffentlichten Upload ('staged:<id>') { src, isVid } oder null.
 * @param {any} media
 * @param {(id: string) => ({ src: string, isVid?: boolean } | null)} [resolveStaged]
 * @returns {{ src: string, isVid: boolean } | null}
 */
export function heroPreviewMedia(media, resolveStaged = () => null) {
  if (!media || media.heroMode === 'grid' || media.heroBannerShow === false) return null;
  const val = typeof media.heroBanner === 'string' ? media.heroBanner.trim() : '';
  if (!val) return null;
  if (val.startsWith('staged:')) {
    const r = resolveStaged(val.slice(7));
    return r && r.src ? { src: r.src, isVid: Boolean(r.isVid) } : null;
  }
  return { src: val, isVid: VIDEO_RE.test(val.split('?')[0]) };
}

/**
 * Inline-Style des Banner-Mediums in der Vorschau: Größe wie auf der Seite
 * (klassisch max. 240 px hoch, kompakt max. 340 px hoch und 500 px breit) plus
 * Banner-Design des Modus (Rahmen, Ecken, Schatten, Deckkraft, Verdunkelung).
 * @param {import('../types.ts').Lang} lang
 * @param {string} mode
 * @param {boolean} compact
 */
export function heroPreviewMediaStyle(lang, mode, compact) {
  const s = getBannerStyle(lang, mode);
  const p = compact
    ? ['max-width:500px', 'max-height:340px']
    : ['max-width:100%', 'max-height:240px'];
  p.push(
    'width:auto',
    'height:auto',
    'object-fit:contain',
    'display:block',
    'margin:0 auto',
    'box-sizing:border-box',
    `border-radius:${s.borderRadius}px`,
    s.borderWidth > 0 ? `border:${s.borderWidth}px solid ${s.borderColor}` : 'border:0',
    s.shadow
      ? `box-shadow:${s.shadowX}px ${s.shadowY}px ${s.shadowBlur}px ${rgbaFromHex(s.shadowColor, s.shadowOpacity)}`
      : 'box-shadow:none',
    `opacity:${(s.opacity / 100).toFixed(2)}`,
    `filter:${s.darken > 0 ? `brightness(${((100 - s.darken) / 100).toFixed(2)})` : 'none'}`,
  );
  return p.join(';');
}

/**
 * CSS für das Kompakt-Layout in einer Vorschau (nur Desktop-Ansicht, die
 * Vorschauen sind 1200 px breit): Texte links, Medium rechts, beide als
 * zentriertes Paar – wie home-compact.css ab 1024 px. !important, weil Titel,
 * Untertitel, Buttons und Kasten ihre Maße als Inline-Style tragen (klassische
 * Werte). `p` ist das Präfix der data-Attribute: hd = Tab „Hero-Design“
 * ([data-hdbox], [data-hdtitle] …), fp = Ganzseiten-Vorschau im Tab „Layout“.
 * @param {string} [p]
 */
export function heroCompactCss(p = 'hd') {
  const box = `[data-${p}box][data-${p}layout="compact"]`;
  const a = (/** @type {string} */ n) => `[data-${p}${n}]`;
  return [
    `${box}{display:grid;column-gap:56px;align-items:start;text-align:left !important;padding:48px !important;` +
      "grid-template-columns:minmax(0,38rem) auto;justify-content:center;grid-template-areas:'. media' 'title media' 'sub media' 'chips media' 'cta media' '. media';grid-template-rows:1fr auto auto auto auto 1fr}",
    `${box}${a('nomedia')}{grid-template-columns:minmax(0,52rem);grid-template-areas:'title' 'sub' 'chips' 'cta';grid-template-rows:auto}`,
    `${box} ${a('media')}{grid-area:media;align-self:center;margin:0 !important}`,
    // Kachel-Raster: Spalten wie auf der Seite 1.1fr / 1fr (das Raster ist 100 % breit).
    `${box}${a('grid')}{grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);justify-content:normal}`,
    `${box}${a('grid')} ${a('media')}{width:100%}`,
    `${box} ${a('title')}{grid-area:title;margin-bottom:0 !important}`,
    `${box} ${a('sub')}{grid-area:sub;margin:12px 0 0 !important;max-width:36rem !important}`,
    `${box} ${a('chips')}{grid-area:chips;display:flex !important;flex-wrap:wrap;gap:8px !important;margin-top:20px !important}`,
    `${box} ${a('chip')}{padding:8.8px 14.4px !important}`,
    `${box} ${a('cta')}{grid-area:cta;justify-self:start;margin-top:20px !important}`,
    // Verschiebungen aus dem Admin gelten im Kompakt-Layout nicht (wie auf der Seite).
    `${box} :is(${a('media')},${a('title')},${a('sub')},${a('chip')}){left:0 !important;top:0 !important;transform:none !important}`,
    // Ausgeblendete Teile nehmen im Kompakt-Layout keinen Platz ein (.hero-hidden).
    `${box} :is(${a('title')},${a('sub')},${a('chips')},${a('chip')},${a('cta')}):is([style*="visibility:hidden"],[style*="visibility: hidden"]){display:none !important}`,
  ].join('\n');
}

/** Kompakt-CSS der Hero-Design-Vorschau (Präfix hd). */
export const HERO_PREVIEW_LAYOUT_CSS = heroCompactCss('hd');
