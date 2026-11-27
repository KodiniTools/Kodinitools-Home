import type { Lang } from '../../../types';
import { HOME_UI } from '../../../../../src/i18n/home-ui';
import {
  HERO_PIC,
  MODERN_ICONS,
  TILE_LAYERS,
  featureIconId,
  splitAccent,
} from '../../../../../src/content/modernHomeBase';
import homeModernCss from '../../../../../src/styles/parts/home-modern.css?raw';
import siteFontCss from '../../../../../src/styles/site-font.css?raw';

/**
 * Hero der Startseite im modernen Design als eigenständiges HTML-Dokument für die
 * Admin-Vorschau (iframe `srcdoc`). Markup wie der Hero in `src/components/ModernHome.astro`,
 * CSS ist das echte `home-modern.css` der Seite; Daten wie in `ModernHomePage.astro`.
 * So sieht der Admin im modernen Design denselben Hero wie die Seite, nicht den klassischen.
 */

export type PreviewTheme = 'light' | 'dark';

export interface ModernHeroData {
  lang: Lang;
  /** Leer = Titel ausgeblendet (`heroDesign.showTitle === false`). */
  title: string;
  /** Leer = Untertitel ausgeblendet. */
  subtitle: string;
  cta: string;
  /** Nur sichtbare Vorteile (ausgeblendete fehlen schon). */
  features: { key: string; text: string }[];
  /** Hero-Bild statt 3D-Logo-Kachel (Admin › Layout, Standard an). */
  heroImage?: boolean;
}

/** Eingaben aus dem Admin-Zustand (Entwurf) – dieselben Regeln wie `ModernHomePage.astro`. */
export interface ModernHeroInput {
  lang: Lang;
  title: string;
  subtitle: string;
  cta: string;
  features: { key: string; text: string }[];
  design: {
    showTitle?: boolean;
    showSubtitle?: boolean;
    showChips?: boolean;
    hiddenChips?: unknown;
  };
  heroImage?: boolean;
}

export function modernHeroData(i: ModernHeroInput): ModernHeroData {
  const hidden = new Set(Array.isArray(i.design.hiddenChips) ? i.design.hiddenChips : []);
  return {
    lang: i.lang,
    title: i.design.showTitle === false ? '' : i.title,
    subtitle: i.design.showSubtitle === false ? '' : i.subtitle,
    cta: i.cta,
    features: i.design.showChips === false ? [] : i.features.filter((f) => !hidden.has(f.key)),
    heroImage: i.heroImage !== false,
  };
}

const ESC: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};
export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ESC[c] ?? c);

const TILE = '/image/home/tile';
/** Symbole des Heros außerhalb der Merkmale (seit dem Wegfall der Hero-Knöpfe keine). */
const ICONS_USED: readonly string[] = [];

function titleHtml(title: string): string {
  return title
    .split('\n')
    .map((line) =>
      splitAccent(line)
        .map((p) => (p.accent ? `<span class="mh-accent">${esc(p.text)}</span>` : esc(p.text)))
        .join(''),
    )
    .join('<br>');
}

function sprite(features: ModernHeroData['features']): string {
  const ids = new Set([...ICONS_USED, ...features.map((f) => featureIconId(f.key))]);
  const symbols = [...ids]
    .filter((id) => id in MODERN_ICONS)
    .map((id) => `<symbol id="mhi-${id}" viewBox="0 0 24 24">${MODERN_ICONS[id]}</symbol>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" class="mh-sprite" aria-hidden="true">${symbols}</svg>`;
}

/** Nur der Hero-Abschnitt (Markup wie `ModernHome.astro`). */
export function modernHeroSection(d: ModernHeroData): string {
  const ui = HOME_UI[d.lang];
  const m = ui.modern;
  const title = d.title || ui.heroTitleFallback;
  const lead = d.subtitle
    ? `<p class="mh-lead">${d.subtitle.split('\n').map(esc).join('<br>')}</p>`
    : '';
  const feats = d.features.length
    ? `<ul class="mh-features">${d.features
        .map(
          (f) =>
            `<li data-feature="${esc(f.key)}"><svg width="22" height="22" aria-hidden="true"><use href="#mhi-${featureIconId(f.key)}"></use></svg><span>${esc(f.text)}</span></li>`,
        )
        .join('')}</ul>`
    : '';
  const layers = TILE_LAYERS.map(
    (l) =>
      `<img class="mh-tile-layer${l.fine ? ' is-fine' : ''}" src="${l.src}" width="249" height="263" alt="" style="transform:translateZ(-${l.depth}px)">`,
  ).join('');
  const pic = `<div class="mh-tile-wrap mh-pic-wrap"><img class="mh-hero-pic" src="${HERO_PIC.src}" srcset="${HERO_PIC.srcset}" sizes="${HERO_PIC.sizes}" width="${HERO_PIC.width}" height="${HERO_PIC.height}" alt="${esc(m.heroImageAlt)}"></div>`;
  const tile = `<div class="mh-tile-wrap" aria-hidden="true"><div class="mh-tile-halo"></div><div class="mh-tile-stage"><div class="mh-tile-tilt">${layers}<div class="mh-tile-face"><img class="mh-tile-img" src="${TILE}/tile.webp" width="249" height="263" alt=""><img class="mh-tile-gloss" src="${TILE}/tile-gloss.webp" width="249" height="263" alt=""></div></div></div></div>`;
  return `<section class="mh-hero"><div class="mh-shell"><div class="mh-hero-grid${d.heroImage === false ? '' : ' mh-hero-grid--pic'}">
<div class="mh-hero-copy">
<p class="mh-eyebrow">${esc(m.eyebrow)}</p>
<h1 class="mh-title hero-title">${titleHtml(title)}</h1>
${lead}
${feats}
</div>
${d.heroImage === false ? tile : pic}
</div></div></section>`;
}

/**
 * Vollständiges Dokument für `iframe.srcdoc`. Links sind abgeschaltet (Vorschau);
 * Bilder und Schrift kommen vom Live-Root (`/image/…`, `/fonts/…`).
 */
export function modernHeroDoc(d: ModernHeroData, theme: PreviewTheme): string {
  return `<!doctype html><html lang="${d.lang}" data-theme="${theme}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>${siteFontCss}</style><style>${homeModernCss}</style>
<style>html,body{margin:0}a{pointer-events:none}.mh-hero{padding-bottom:32px}</style>
</head><body><div id="app" data-design="modern" data-home-layout="compact">${sprite(d.features)}${modernHeroSection(d)}</div></body></html>`;
}
