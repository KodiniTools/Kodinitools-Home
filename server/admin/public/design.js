// @ts-check
// Hero-Design-Tab (eine Sprache): Rahmen, Hintergrund und die Buttons
// (Feature-Chips) des Hero-Bereichs gestalten – getrennt für Hell- und
// Dunkelmodus – samt Live-Vorschau, plus die Hero-Texte (Titel, Untertitel,
// Button-Text) mit ihrer Feinabstimmung je Text (Schrift, Größe, Farbe
// Hell/Dunkel, Schatten, Umriss, Deckkraft, Animation) und die
// Button-Beschriftungen. Styling wird in media.<lang>.heroDesign (mit
// .light/.dark) gespeichert, die Feinabstimmung je Text in
// media.<lang>.textStyles["hero.*"]; Texte und Beschriftungen laufen über die
// Overrides (hero.title/subtitle/cta, hero.features.*).
//
// Layout (wie Tool-Karten/Texte/Hintergrund): Mitte = Sticky-Vorschau beider
// Modi, Texte, Schriften/Typografie, Button-Text und Beschriftungen (gelten für
// beide Modi); Seitenleiste Hell links / Dunkel rechts = alle Farben des Modus
// (Überschriften, Rahmen/Hintergrund, Chips, CTA, Hero-Text-Farben).

import { $ } from './core.js';
import {
  state,
  defaultHeroDesign,
  heroSideLight,
  heroSideDark,
  getGlobalFont,
  setGlobalFont,
  HERO_TEXT_SLOTS,
  TEXT_OFFSET_MAX,
  MEDIA_LANGS,
  HERO_IMG_FIELDS,
  BANNER_SLIDES_MAX,
  BANNER_TRANSITIONS,
  defaultHeroBgSlideshow,
  getHomeLayout,
  navLang,
} from './model.js';
import {
  heroPreviewMedia,
  heroPreviewMediaStyle,
  HERO_PREVIEW_LAYOUT_CSS,
} from './hero-preview.js';
import { objUrl, openMediaPicker } from './media.js';
import { slideInfo } from './layout-shared.js';
import { ensureFontFace } from './fonts.js';
import { mountVueTab } from './islands.js';

/** @import { Lang, ThemeMode } from '../types.ts' */

// Feature-Schlüssel (Reihenfolge wie in den Locale-Dateien); Fallback, falls die
// Defaults (noch) nicht geladen sind.
const FEATURE_FALLBACK = [
  'free',
  'privacy',
  'browserBased',
  'serverBased',
  'multiLanguage',
  'noInstall',
];
/** @param {Lang} lang */
function featureDefs(lang) {
  /** @type {any} */
  const f = /** @type {any} */ (state.defaults[lang])?.hero?.features;
  const keys = f && typeof f === 'object' ? Object.keys(f) : FEATURE_FALLBACK;
  return keys.map((k) => ({ key: k, def: /** @type {string} */ ((f && f[k]) || '') }));
}

/** @param {Lang} lang */
function heroDesignOf(lang) {
  const hd = state.media[lang] && state.media[lang].heroDesign;
  if (!hd || !hd.light || !hd.dark) {
    state.media[lang].heroDesign = defaultHeroDesign();
    return state.media[lang].heroDesign;
  }
  return hd;
}
// Standard-Werte eines Modus (Hell/Dunkel).
/** @param {ThemeMode} mode */
function sideDefault(mode) {
  return mode === 'dark' ? heroSideDark() : heroSideLight();
}

// Vorschau-URL eines Hero-Hintergrundbilds ('staged:<id>' -> Objekt-URL), '' ohne Bild.
/** @param {string} val */
function heroImgUrl(val) {
  if (!val) return '';
  return val.startsWith('staged:') ? objUrl(val.slice(7)) : val;
}

// Banner-Medium der Startseite (Layout > Banner) für die Vorschau; gestagte
// Uploads über ihre Objekt-URL.
/** @param {Lang} lang */
function previewMedia(lang) {
  return heroPreviewMedia(state.media[lang], (id) => {
    const item = state.stagedItems.find((x) => x.id === id);
    return item ? { src: objUrl(id), isVid: /^video\//.test(item.type) } : null;
  });
}

// Service für die Vue-Fassung des Tabs (app/tabs/hero): kapselt die Zugriffe auf
// den Admin-Zustand, damit das Vue-Bundle model.js nicht selbst importiert.
/**
 * @param {Lang} lang
 * @returns {import('../app/tabs/hero/heroData').HeroService}
 */
export function heroService(lang) {
  return {
    lang,
    design: () => heroDesignOf(lang),
    designOf: (/** @type {Lang} */ l) => heroDesignOf(l),
    media: () => state.media[lang],
    mediaOf: (/** @type {Lang} */ l) => state.media[l],
    overrides: () => state.overrides[lang],
    defaults: () => state.defaults[lang] || {},
    features: () => featureDefs(lang),
    globalFont: getGlobalFont,
    // Globale Schrift + Hero-Schriften beider Sprachen (wie die Kachel-Klicks unten).
    setGlobalFont: (/** @type {string} */ name) => {
      setGlobalFont(name);
      const file = getGlobalFont();
      for (const l of MEDIA_LANGS) {
        const hd = heroDesignOf(l);
        hd.titleFont = file;
        hd.buttonFont = file;
      }
    },
    homeLayout: getHomeLayout,
    fonts: () => state.fonts,
    ensureFontFace,
    resolveUrl: heroImgUrl,
    slideInfo: (/** @type {string} */ val) => {
      const info = slideInfo(val);
      return info ? { src: info.src, name: info.item ? info.item.name : '' } : null;
    },
    pick: (
      /** @type {string} */ kind,
      /** @type {string} */ title,
      /** @type {(url: string) => void} */ onPick,
    ) => {
      const srv = [lang, /** @type {const} */ ('shared')].reduce(
        (n, l) => n + (state.serverFiles[l] || []).length,
        0,
      );
      if (!state.stagedItems.length && !srv) return false;
      openMediaPicker(lang, kind === 'heroslide' ? 'heroslide' : 'heroimg', {
        imagesOnly: true,
        title,
        onPick,
      });
      return true;
    },
    previewMedia: () => previewMedia(lang),
    mediaStyle: (/** @type {ThemeMode} */ mode, /** @type {boolean} */ compact) =>
      heroPreviewMediaStyle(lang, mode, compact),
    layoutCss: HERO_PREVIEW_LAYOUT_CSS,
    sideDefault,
    designDefault: defaultHeroDesign,
    slideshowDefault: defaultHeroBgSlideshow,
    imgFields: HERO_IMG_FIELDS,
    slidesMax: BANNER_SLIDES_MAX,
    transitions: BANNER_TRANSITIONS,
    offsetMax: TEXT_OFFSET_MAX,
    textSlots: HERO_TEXT_SLOTS,
  };
}

export function renderHeroDesign() {
  const lang = navLang();
  const pane = $('#content');
  // Vue-Insel (app/tabs/hero).
  mountVueTab(pane, 'hero', { service: heroService(lang === 'en' ? 'en' : 'de') });
}
