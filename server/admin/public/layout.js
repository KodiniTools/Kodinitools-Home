// @ts-check
// Layout-Tab: Anordnung des Hero-Bereichs (Banner vs. Raster-Layouts) samt
// Form (Seitenverhältnis) und Per-Kachel-Design (Rahmen + Hintergrund) mit
// Live-Vorschau. Das Kachel-Bild kann hier direkt aus der Zwischenablage
// (Strg/Cmd+V bzw. Button) oder aus der Mediathek zugewiesen und bearbeitet
// werden (Deckkraft, Abdunkelung, Weichzeichner, Sättigung); die klassische
// Medien-Zuweisung im Medien-Tab bleibt bestehen.
//
// Aufgeteilt in Module: layout-shared.js (gemeinsame Helfer, auch für andere Tabs),
// layout-banner.js (Einzelbanner), layout-grid.js (Bild-Raster), layout-paste.js
// (Zwischenablage). Diese Datei rendert den Tab und verdrahtet den Modus-Wechsel.

import { $, fmtBytes } from './core.js';
import { mountVueTab } from './islands.js';
import { objUrl, openMediaPicker } from './media.js';
import { ensureFontFace } from './fonts.js';
import {
  state,
  getHomeLayout,
  setHomeLayout,
  getHeroMediaMobile,
  setHeroMediaMobile,
  getCardForm,
  setCardForm,
  getCardWidth,
  setCardWidth,
  getCatBar,
  setCatBar,
  getCatSearch,
  setCatSearch,
  getMediaPosDesktop,
  setMediaPosDesktop,
  getMediaPosMobile,
  setMediaPosMobile,
  getBannerStyle,
  getBannerSlides,
  getBannerSlideshow,
  defaultBannerStyle,
  defaultBannerSlideshow,
  BANNER_STYLE_LIMITS,
  BANNER_SLIDES_MAX,
  BANNER_TRANSITIONS,
  HERO_LAYOUTS,
  HERO_LAYOUT_COLS,
  HERO_GRID_MAX,
  GRID_DIMS,
  CELL_IMG_FIELDS,
  CELL_SYNC_PROPS,
  defaultCellStyle,
  defaultGridSlideshow,
  getCellStyle,
  getGridSlides,
  getGridSlideshow,
  normMediaOffset,
  normCardScale,
  CARD_SCALE_MIN,
  CARD_SCALE_MAX,
  MEDIA_OFFSET_MAX,
  navLang,
} from './model';
import { initPaste, pasteFromClipboardApi } from './layout-paste.js';
import {
  fullPageModel,
  fullPageKeys,
  fullOffset,
  setFullOffset,
  fullMovedKeys,
  fullCardOffsets,
  fullCardOffsetIds,
  fullLinkedTextKeys,
  FULL_LABELS,
  FULL_TEXT_LABELS,
} from './layout-fullpage.js';

/** @import { Lang, ThemeMode } from '../types.ts' */
/** @import { LayoutService, CellHooks, PickTarget, PasteTarget, PageSettings } from '../app/tabs/layout/layoutData' */

// Getter/Setter des Panels „Seiten-Layout" (global) für die Vue-Fassung.
const PAGE_GET = {
  homeLayout: getHomeLayout,
  heroMediaMobile: getHeroMediaMobile,
  cardForm: getCardForm,
  cardWidth: getCardWidth,
  catBar: getCatBar,
  catSearch: getCatSearch,
  mediaPosDesktop: getMediaPosDesktop,
  mediaPosMobile: getMediaPosMobile,
};
/** @type {Record<keyof typeof PAGE_GET, (v: unknown) => void>} */
const PAGE_SET = {
  homeLayout: setHomeLayout,
  heroMediaMobile: setHeroMediaMobile,
  cardForm: setCardForm,
  cardWidth: setCardWidth,
  catBar: setCatBar,
  catSearch: setCatSearch,
  mediaPosDesktop: setMediaPosDesktop,
  mediaPosMobile: setMediaPosMobile,
};

// Medium (Server-URL oder 'staged:<id>') für die Vue-Fassung auflösen.
/** @param {string} val */
function resolveMedia(val) {
  if (!val) return null;
  if (val.startsWith('staged:')) {
    const id = val.slice(7);
    const item = state.stagedItems.find((x) => x.id === id);
    if (!item) return null;
    return {
      src: objUrl(id),
      isVid: /^video\//.test(item.type),
      localName: item.name,
      bytes: item.blob ? item.blob.size : 0,
    };
  }
  return { src: val, isVid: /\.(mp4|webm|mov|ogg)$/i.test(val), localName: '', bytes: 0 };
}

/**
 * Service für die Vue-Fassung des Tabs (app/tabs/layout): Zugriff auf den
 * Zustand, die Setter des Seiten-Layouts, Medien-Auswahl, Zwischenablage und
 * das Datenmodell der Ganzseiten-Vorschau – ohne model.ts ins Bundle zu ziehen.
 * @param {Lang} lang
 * @returns {LayoutService}
 */
export function layoutService(lang) {
  return {
    lang,
    media: () => state.media[lang],
    mediaOf: (/** @type {Lang} */ l) => state.media[l],
    ensure: (/** @type {Lang} */ l) => {
      getBannerStyle(l, 'light');
      getBannerSlides(l);
      getBannerSlideshow(l);
      for (let i = 0; i < HERO_GRID_MAX; i++) {
        getCellStyle(l, i);
        getGridSlides(l, i);
      }
      getGridSlideshow(l);
      const m = state.media[l];
      if (!Array.isArray(m.heroGridHidden))
        m.heroGridHidden = [false, false, false, false, false, false];
    },
    page: () => {
      const page = Object.fromEntries(Object.entries(PAGE_GET).map(([k, get]) => [k, get()]));
      return /** @type {PageSettings} */ (/** @type {unknown} */ (page));
    },
    setPage: (key, v) => PAGE_SET[key]?.(v),
    resolve: resolveMedia,
    // target: 'banner' | 'slide' | { cell: i } | { cellSlide: i }
    pick: (
      /** @type {PickTarget} */ target,
      /** @type {string} */ title,
      /** @type {(url: string) => void} */ onPick,
    ) => {
      const srv = [lang, /** @type {const} */ ('shared')].reduce(
        (n, l) => n + (state.serverFiles[l] || []).length,
        0,
      );
      if (!state.stagedItems.length && !srv) return false;
      const slide = target === 'slide' || (typeof target === 'object' && 'cellSlide' in target);
      const key =
        target === 'banner'
          ? 'heroBanner'
          : target === 'slide'
            ? 'heroBannerSlide'
            : 'cell' in target
              ? 'grid' + target.cell
              : 'heroGridSlide';
      openMediaPicker(lang, key, { title, imagesOnly: slide, onPick });
      return true;
    },
    // target: 'banner' | 'slide' | Kachel-Index | 'cellslide:<i>'
    paste: (/** @type {PasteTarget} */ target) => {
      pasteFromClipboardApi(lang, target);
    },
    bindCells: (/** @type {CellHooks} */ hooks) => {
      vueCells = hooks;
      return () => {
        if (vueCells === hooks) vueCells = null;
      };
    },
    fonts: () => state.fonts,
    ensureFontFace,
    fmtBytes,
    styleDefault: defaultBannerStyle,
    styleLimits: BANNER_STYLE_LIMITS,
    slideshowDefault: defaultBannerSlideshow,
    slidesMax: BANNER_SLIDES_MAX,
    transitions: BANNER_TRANSITIONS,
    layouts: HERO_LAYOUTS,
    layoutCols: HERO_LAYOUT_COLS,
    gridDims: GRID_DIMS,
    imgFields: CELL_IMG_FIELDS,
    syncProps: CELL_SYNC_PROPS,
    cellDefault: defaultCellStyle,
    gridSlideshowDefault: defaultGridSlideshow,
    fullPage: {
      model: (/** @type {ThemeMode} */ mode) => fullPageModel(lang, mode),
      keys: () => fullPageKeys(lang),
      offset: (/** @type {string} */ key) => fullOffset(lang, key),
      setOffset: (
        /** @type {string} */ key,
        /** @type {number} */ x,
        /** @type {number} */ y,
        /** @type {number | undefined} */ w,
        /** @type {number | undefined} */ h,
      ) => {
        setFullOffset(lang, key, x, y, w, h);
        return fullOffset(lang, key);
      },
      movedKeys: () => fullMovedKeys(lang),
      cardOffsets: () => fullCardOffsets(lang),
      cardOffsetIds: () => fullCardOffsetIds(lang),
      linkedKeys: (/** @type {string} */ key) => fullLinkedTextKeys(lang, key),
      labels: { ...FULL_LABELS, ...FULL_TEXT_LABELS },
      normOffset: normMediaOffset,
      normScale: normCardScale,
      scaleMin: CARD_SCALE_MIN,
      scaleMax: CARD_SCALE_MAX,
      offsetMax: MEDIA_OFFSET_MAX,
    },
  };
}

export function renderLayout() {
  const lang = navLang();
  const pane = $('#content');
  // Vue-Fassung (app/tabs/layout); Scrollposition bleibt beim Neu-Zeichnen erhalten.
  const scrollY = window.scrollY;
  if (mountVueTab(pane, 'layout', { service: layoutService(lang === 'en' ? 'en' : 'de') })) {
    window.scrollTo(0, scrollY);
  }
}

// Zwischenablage-Modul mit dem Tab verbinden (Neu-Rendern, Kachel-Markierung).
// Die Kachel-Auswahl der Vue-Fassung (bindCells) markiert die Zielkachel.
/** @type {CellHooks | null} */
let vueCells = null;
initPaste({
  rerender: renderLayout,
  markCell: (_pane, i) => vueCells?.mark(i),
  activeCell: () => (vueCells ? vueCells.active() : null),
});
