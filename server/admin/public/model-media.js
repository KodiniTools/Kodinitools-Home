// Datenmodell – Medien je Sprache: Standardwerte, Normalisierung des geladenen
// Stands (inkl. Migration alter Strukturen), Slot-Zugriff (Sektions-Videos,
// Banner, Rasterbilder) und alle Bild-Plätze zusammen.

import {
  normFontFile,
  MEDIA_LANGS,
  MEDIA_KEYS,
  BANNER_ANIM_TYPES,
  BANNER_ANIM_SPEEDS,
} from './model-core.js';
import { state } from './model-state.js';
import {
  defaultHeroDesign,
  normHeroDesign,
  normTextStyles,
  UNIFORM_TEXT_KEYS,
} from './model-hero.js';
import {
  defaultToolCards,
  normToolCards,
  normIconTint,
  toolCardImageSlots,
} from './model-toolcards.js';
import {
  HERO_GRID_MAX,
  defaultCellStyles,
  normCellStyles,
  normHeroLayout,
  normTextPos,
  normPosPct,
  defaultBannerStyles,
  normBannerStyle,
  defaultBannerSlideshow,
  defaultGridSlideshow,
  normGridSlides,
  normBannerSlides,
  normBannerSlideshow,
  heroSlideImageSlots,
} from './model-grid.js';
import { defaultSite, normSite, siteImageSlots } from './model-site.js';
import {
  defaultSectionMediaAll,
  normSectionMediaAll,
  sectionMediaImageSlots,
} from './model-sectionmedia.js';

export function defaultMediaLocale() {
  return {
    sectionVideos: {
      audio: '/videos/audio-tools.mp4',
      image: '/videos/image-tools.mp4',
      diverse: '/videos/diverse-tools.mp4',
    },
    heroMode: 'banner',
    heroLayout: 'grid3',
    heroBanner: '',
    heroBannerLink: '',
    heroBannerText: '', // Text über dem Einzelbanner
    heroBannerFont: '', // Schriftart des Banner-Textes (Dateiname im /fonts-Ordner)
    heroBannerTextColor: '#ffffff',
    heroBannerTextSize: 0, // px (0 = automatisch)
    heroBannerTextPos: 'center', // Alt: 'top'|'center'|'bottom' (nur noch Migration)
    heroBannerTextX: 50, // Freie Position in % (0=links, 100=rechts) – per Maus ziehbar
    heroBannerTextY: 50, // Freie Position in % (0=oben, 100=unten)
    heroBannerTextShadow: true, // Textschatten an/aus (Standard: an)
    heroBannerTextShadowColor: '#000000', // Farbe des Schattens
    heroBannerTextShadowX: 0, // Horizontaler Versatz des Schattens in px (-50–50)
    heroBannerTextShadowY: 2, // Vertikaler Versatz des Schattens in px (-50–50)
    heroBannerTextShadowBlur: 6, // Weichzeichnung des Schattens in px (0–40)
    heroBannerTextStrokeColor: '#000000', // Farbe des Umrisses (Kontur)
    heroBannerTextStrokeWidth: 0, // Dicke des Umrisses in px (0 = kein Umriss)
    heroBannerTextOpacity: 100, // Deckkraft des Textes in % (0–100)
    heroBannerTextAnim: 'none', // Animationstyp: none|pulse|float|shake|wobble|glow
    heroBannerTextAnimIntensity: 5, // Stärke der Animation (1–10)
    heroBannerTextAnimSpeed: 'normal', // Tempo: slow|normal|fast
    heroBannerStyle: defaultBannerStyles(), // Rahmen/Ecken/Schatten/Deckkraft/Verdunkelung des Banners je Hell/Dunkel
    heroBannerSlides: [], // Weitere Bilder der Banner-Diashow (Server-URL oder 'staged:<id>')
    heroBannerSlideshow: defaultBannerSlideshow(), // Intervall, Übergang, Pause bei Hover, Punkte
    heroGridSlides: normGridSlides(null), // Weitere Bilder je Kachel (Diashow)
    heroGridSlideshow: defaultGridSlideshow(), // Diashow-Einstellungen der Kacheln
    sectionMedia: defaultSectionMediaAll(), // Design/Diashow/Text der Sektions-Medien (Tab „Medien")
    heroGrid: ['', '', '', '', '', ''],
    heroGridLinks: ['', '', '', '', '', ''],
    heroGridStyles: defaultCellStyles(),
    heroGridUniform: false, // „Standard für alle Kacheln" aktiv?
    heroGridUniformCell: 0, // Index der Master-Kachel, deren Werte gelten
    heroGridRatio: '1:1',
    heroGridFit: 'cover',
    textStyles: {}, // { "<textKey>": { size: px (0=auto), colorLight: Hex|'', colorDark: Hex|'', font: Datei|'' } }
    textStyleUniform: false, // „Standard für alle Slots" (Tab „Texte") aktiv?
    textStyleUniformKey: 'tools.sectionTitle', // Slot, dessen Stil dann für alle Texte-Tab-Slots gilt
    heroDesign: defaultHeroDesign(),
    toolCards: defaultToolCards(), // Rahmen/Hintergrund der Tool-Karten (Tab „Tool-Karten")
    iconTint: {}, // Icon-Färbung je Karte (Tab „Icons"): { "tools.x": { light, dark, bg, bgDark } }
  };
}
// Alle Bild-Plätze außerhalb der Sprach-Slots (Seite + Tool-Karten + Diashows).
export function allImageSlots() {
  return [
    ...siteImageSlots(),
    ...toolCardImageSlots(),
    ...heroSlideImageSlots(),
    ...sectionMediaImageSlots(),
  ];
}
// Medien werden pro Sprache getrennt gepflegt, plus globale site-Einstellungen:
// { site: {...}, de: {...}, en: {...} }.
export function defaultMedia() {
  return { site: defaultSite(), de: defaultMediaLocale(), en: defaultMediaLocale() };
}

// Normalisiert einen geladenen Medien-Stand auf { de, en }. Akzeptiert auch die
// alte, sprachunabhängige Struktur ({ sectionVideos, heroBanner }) und wendet
// sie auf beide Sprachen an.
export function normalizeMedia(m) {
  const mk = (o) => {
    const d = defaultMediaLocale();
    const sv = o && typeof o.sectionVideos === 'object' && o.sectionVideos ? o.sectionVideos : {};
    const grid = Array.isArray(o?.heroGrid) ? o.heroGrid : [];
    const gridLinks = Array.isArray(o?.heroGridLinks) ? o.heroGridLinks : [];
    return {
      sectionVideos: {
        audio: sv.audio || d.sectionVideos.audio,
        image: sv.image || d.sectionVideos.image,
        diverse: sv.diverse || d.sectionVideos.diverse,
      },
      heroMode: o && o.heroMode === 'grid' ? 'grid' : 'banner',
      heroLayout: normHeroLayout(o?.heroLayout),
      heroBanner: o && typeof o.heroBanner === 'string' ? o.heroBanner : '',
      heroBannerLink: o && typeof o.heroBannerLink === 'string' ? o.heroBannerLink : '',
      heroBannerText: typeof o?.heroBannerText === 'string' ? o.heroBannerText.slice(0, 120) : '',
      heroBannerFont: normFontFile(o?.heroBannerFont),
      heroBannerTextColor: /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(String(o?.heroBannerTextColor))
        ? o.heroBannerTextColor
        : '#ffffff',
      heroBannerTextSize: Number.isFinite(Number(o?.heroBannerTextSize))
        ? Math.max(0, Math.min(96, Math.round(Number(o.heroBannerTextSize))))
        : 0,
      heroBannerTextPos: normTextPos(o?.heroBannerTextPos),
      heroBannerTextX: normPosPct(o?.heroBannerTextX, undefined, 50),
      heroBannerTextY: normPosPct(o?.heroBannerTextY, normTextPos(o?.heroBannerTextPos), 50),
      // Textschatten (Standard: an, rückwärtskompatibel), Umriss (Kontur), Deckkraft.
      heroBannerTextShadow: o?.heroBannerTextShadow !== false,
      heroBannerTextShadowColor: /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(
        String(o?.heroBannerTextShadowColor),
      )
        ? o.heroBannerTextShadowColor
        : '#000000',
      heroBannerTextShadowX: Number.isFinite(Number(o?.heroBannerTextShadowX))
        ? Math.max(-50, Math.min(50, Math.round(Number(o.heroBannerTextShadowX))))
        : 0,
      heroBannerTextShadowY: Number.isFinite(Number(o?.heroBannerTextShadowY))
        ? Math.max(-50, Math.min(50, Math.round(Number(o.heroBannerTextShadowY))))
        : 2,
      heroBannerTextShadowBlur: Number.isFinite(Number(o?.heroBannerTextShadowBlur))
        ? Math.max(0, Math.min(40, Math.round(Number(o.heroBannerTextShadowBlur))))
        : 6,
      heroBannerTextStrokeColor: /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(
        String(o?.heroBannerTextStrokeColor),
      )
        ? o.heroBannerTextStrokeColor
        : '#000000',
      heroBannerTextStrokeWidth: Number.isFinite(Number(o?.heroBannerTextStrokeWidth))
        ? Math.max(0, Math.min(10, Math.round(Number(o.heroBannerTextStrokeWidth) * 2) / 2))
        : 0,
      heroBannerTextOpacity: Number.isFinite(Number(o?.heroBannerTextOpacity))
        ? Math.max(0, Math.min(100, Math.round(Number(o.heroBannerTextOpacity))))
        : 100,
      // Animationstyp (Migration: alte boolean heroBannerTextPulse -> 'pulse').
      heroBannerTextAnim: BANNER_ANIM_TYPES.includes(o?.heroBannerTextAnim)
        ? o.heroBannerTextAnim
        : o?.heroBannerTextPulse === true
          ? 'pulse'
          : 'none',
      heroBannerTextAnimIntensity: Number.isFinite(
        Number(o?.heroBannerTextAnimIntensity ?? o?.heroBannerTextPulseIntensity),
      )
        ? Math.max(
            1,
            Math.min(
              10,
              Math.round(Number(o.heroBannerTextAnimIntensity ?? o.heroBannerTextPulseIntensity)),
            ),
          )
        : 5,
      heroBannerTextAnimSpeed: BANNER_ANIM_SPEEDS.includes(o?.heroBannerTextAnimSpeed)
        ? o.heroBannerTextAnimSpeed
        : 'normal',
      heroBannerStyle: normBannerStyle(o?.heroBannerStyle),
      heroBannerSlides: normBannerSlides(o?.heroBannerSlides),
      heroBannerSlideshow: normBannerSlideshow(o?.heroBannerSlideshow),
      heroGridSlides: normGridSlides(o?.heroGridSlides),
      heroGridSlideshow: normBannerSlideshow(o?.heroGridSlideshow, true),
      sectionMedia: normSectionMediaAll(o?.sectionMedia),
      heroGrid: [0, 1, 2, 3, 4, 5].map((i) => (typeof grid[i] === 'string' ? grid[i] : '')),
      heroGridLinks: [0, 1, 2, 3, 4, 5].map((i) =>
        typeof gridLinks[i] === 'string' ? gridLinks[i] : '',
      ),
      heroGridStyles: normCellStyles(o?.heroGridStyles),
      heroGridUniform: o?.heroGridUniform === true,
      heroGridUniformCell: Number.isFinite(Number(o?.heroGridUniformCell))
        ? Math.max(0, Math.min(HERO_GRID_MAX - 1, Math.round(Number(o.heroGridUniformCell))))
        : 0,
      heroGridRatio: ['1:1', '16:9', '2:3'].includes(o?.heroGridRatio) ? o.heroGridRatio : '1:1',
      heroGridFit: o?.heroGridFit === 'contain' ? 'contain' : 'cover',
      textStyles: normTextStyles(o?.textStyles),
      textStyleUniform: o?.textStyleUniform === true,
      textStyleUniformKey: UNIFORM_TEXT_KEYS.includes(o?.textStyleUniformKey)
        ? o.textStyleUniformKey
        : UNIFORM_TEXT_KEYS[0],
      heroDesign: normHeroDesign(o?.heroDesign),
      toolCards: normToolCards(o?.toolCards),
      iconTint: normIconTint(o?.iconTint),
    };
  };
  if (m && typeof m === 'object' && m.sectionVideos)
    return { site: defaultSite(), de: mk(m), en: mk(m) };
  const src = m && typeof m === 'object' ? m : {};
  return { site: normSite(src.site), de: mk(src.de), en: mk(src.en) };
}

export function getMediaVal(lang, key) {
  if (key === 'heroBanner') return state.media[lang].heroBanner || '';
  const g = /^grid([0-5])$/.exec(key);
  if (g) return (state.media[lang].heroGrid || [])[+g[1]] || '';
  return state.media[lang].sectionVideos[key] || '';
}
export function setMediaVal(lang, key, val) {
  if (key === 'heroBanner') {
    state.media[lang].heroBanner = val;
    return;
  }
  const g = /^grid([0-5])$/.exec(key);
  if (g) {
    if (!Array.isArray(state.media[lang].heroGrid))
      state.media[lang].heroGrid = ['', '', '', '', '', ''];
    state.media[lang].heroGrid[+g[1]] = val;
    return;
  }
  state.media[lang].sectionVideos[key] = val;
}
export function defMediaVal(key) {
  if (key === 'heroBanner' || /^grid[0-5]$/.test(key)) return '';
  return defaultMediaLocale().sectionVideos[key];
}
// Ersetzt eine Medien-URL in ALLEN Slots (beide Sprachen) — z.B. nachdem eine
// Datei serverseitig verschoben wurde, damit die Zuweisungen erhalten bleiben.
export function updateMediaUrlEverywhere(oldUrl, newUrl) {
  for (const lang of MEDIA_LANGS) {
    for (const key of MEDIA_KEYS) {
      if (getMediaVal(lang, key) === oldUrl) setMediaVal(lang, key, newUrl);
    }
  }
  for (const slot of allImageSlots()) {
    if (slot.get() === oldUrl) slot.set(newUrl);
  }
}
