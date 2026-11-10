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

import { captureView, restoreView } from './viewstate.js';
import { $, toast, fmtBytes } from './core.js';
import { mountVueTab, unmountVueTab } from './islands.js';
import { objUrl, openMediaPicker } from './media.js';
import { ensureFontFace } from './fonts.js';
import { bindSliders } from './slider.js';
import { bindColorPickers } from './color.js';
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
} from './model.js';
import { stopPreviewSlideshow } from './layout-shared.js';
import { bannerLayoutHtml, bindBanner } from './layout-banner.js';
import { gridLayoutHtml, bindGrid, markCell, getActiveCell } from './layout-grid.js';
import { initPaste, pasteFromClipboardApi } from './layout-paste.js';
import {
  fullPageHtml,
  bindFullPage,
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

// Helfer, die andere Tabs (z. B. Medien) weiterhin aus layout.js beziehen.
export {
  fontFF,
  slideInfo,
  slideshowSettingsHtml,
  overlayStyle,
  dragHandle,
} from './layout-shared.js';

// Panel „Seiten-Layout" (Klassisch/Kompakt, gilt für DE + EN) oben in der Mitte.
function pageLayoutPanelHtml() {
  const layout = getHomeLayout();
  const compact = layout === 'compact';
  const catBar = getCatBar();
  const radio = (val, label) => `
        <label style="display:flex;align-items:center;gap:.4rem;color:var(--text)">
          <input type="radio" name="lay-home" data-homelayout="${val}" ${layout === val ? 'checked' : ''} style="width:auto" />
          ${label}
        </label>`;
  return `
    <div class="panel" data-homelayoutpanel>
      <h2>Seiten-Layout <span class="lang-badge">DE + EN</span></h2>
      <p class="hint"><strong>Kompakt</strong> ordnet den Hero platzsparend an: auf dem Desktop Texte links und Banner bzw. Raster rechts, auf dem Handy kleiner mit den Feature-Buttons in einer wischbaren Zeile.
        Die Tool-Karten stehen in einem Raster, das sich der Breite anpasst; als <strong>Liste</strong> zeigen sie zusätzlich zwei Zeilen Beschreibung, das Popup mit der ganzen Beschreibung bleibt.
        Die <strong>Kategorie-Leiste</strong> unter dem Hero springt zu Audio, Bild und Diverse und bleibt beim Scrollen oben; ihr Suchfeld filtert die Karten.
        Sektionsmedien (Bild bzw. Video je Sektion) stehen auf dem Desktop oben, seitlich neben den Karten oder darunter, auf Handy und Tablet oben oder darunter, oder sie entfallen.
        Farben, Schriften, Texte und Medien bleiben wie eingestellt. Ausgeblendete Feature-Buttons nehmen im Kompakt-Layout keinen Platz ein, Verschiebungen des Hero-Mediums, der Hero-Texte und der Buttons wirken nur im klassischen Layout, die der Sektionsmedien im Kompakt-Layout nur auf dem Desktop bei „Oben“ oder „Unten“.
        Die Wirkung siehst du in der <strong>Vorschau</strong> der Seite.</p>
      <div class="row" style="gap:1.25rem;margin-top:.4rem">
        ${radio('classic', 'Klassisch')}
        ${radio('compact', 'Kompakt')}
      </div>
      <label style="display:flex;align-items:center;gap:.4rem;margin-top:.6rem;color:var(--text)${compact ? '' : ';opacity:.5'}" title="Nur im Kompakt-Layout: Banner bzw. Raster auf Bildschirmen bis 640 px zeigen">
        <input type="checkbox" data-heromediamobile ${getHeroMediaMobile() ? 'checked' : ''} ${compact ? '' : 'disabled'} style="width:auto" />
        Banner bzw. Raster auf dem Handy zeigen
      </label>
      <div class="row" style="gap:1.25rem;margin-top:.6rem;flex-wrap:wrap${compact ? '' : ';opacity:.5'}">
        <label style="display:flex;align-items:center;gap:.4rem;color:var(--text)" title="Liste: Titel mit zwei Zeilen Beschreibung, auf dem Handy einspaltig. Kachel: wie im klassischen Layout. Beide zeigen beim Überfahren das Popup mit der Beschreibung.">
          Kartenform
          <select data-cardform ${compact ? '' : 'disabled'} style="width:auto">
            ${opt(getCardForm(), 'list', 'Liste mit Beschreibung')}
            ${opt(getCardForm(), 'tile', 'Kachel')}
          </select>
        </label>
        <label style="display:flex;align-items:center;gap:.4rem;color:var(--text)" title="Mindestbreite einer Karte; das Raster setzt so viele Spalten, wie Platz haben.">
          Kartenbreite
          <select data-cardwidth ${compact ? '' : 'disabled'} style="width:auto">
            ${opt(getCardWidth(), 'narrow', 'Schmal')}
            ${opt(getCardWidth(), 'medium', 'Mittel')}
            ${opt(getCardWidth(), 'wide', 'Breit')}
          </select>
        </label>
      </div>
      <div class="row" style="gap:1.25rem;margin-top:.6rem;flex-wrap:wrap${compact ? '' : ';opacity:.5'}">
        <label style="display:flex;align-items:center;gap:.4rem;color:var(--text)" title="Sprunglinks zu Audio, Bild und Diverse; bleibt beim Scrollen unter der Navigation stehen.">
          <input type="checkbox" data-catbar ${catBar ? 'checked' : ''} ${compact ? '' : 'disabled'} style="width:auto" />
          Kategorie-Leiste
        </label>
        <label style="display:flex;align-items:center;gap:.4rem;color:var(--text)${catBar ? '' : ';opacity:.5'}" title="Suchfeld in der Kategorie-Leiste; filtert die Karten nach Titel und Beschreibung.">
          <input type="checkbox" data-catsearch ${getCatSearch() ? 'checked' : ''} ${compact && catBar ? '' : 'disabled'} style="width:auto" />
          Suche in der Leiste
        </label>
      </div>
      <div class="row" style="gap:1.25rem;margin-top:.6rem;flex-wrap:wrap${compact ? '' : ';opacity:.5'}">
        <label style="display:flex;align-items:center;gap:.4rem;color:var(--text)" title="Lage von Bild bzw. Video einer Sektion zu ihren Karten ab 1024 px Breite.">
          Sektionsmedien Desktop
          <select data-mediaposdesktop ${compact ? '' : 'disabled'} style="width:auto">
            ${opt(getMediaPosDesktop(), 'top', 'Oben')}
            ${opt(getMediaPosDesktop(), 'side', 'Seitlich')}
            ${opt(getMediaPosDesktop(), 'bottom', 'Unten')}
            ${opt(getMediaPosDesktop(), 'off', 'Aus')}
          </select>
        </label>
        <label style="display:flex;align-items:center;gap:.4rem;color:var(--text)" title="Lage von Bild bzw. Video einer Sektion zu ihren Karten unter 1024 px Breite (Handy und Tablet).">
          Sektionsmedien Handy/Tablet
          <select data-mediaposmobile ${compact ? '' : 'disabled'} style="width:auto">
            ${opt(getMediaPosMobile(), 'top', 'Oben')}
            ${opt(getMediaPosMobile(), 'bottom', 'Unten')}
            ${opt(getMediaPosMobile(), 'off', 'Aus')}
          </select>
        </label>
      </div>
    </div>`;
}
const opt = (cur, val, label) =>
  `<option value="${val}" ${cur === val ? 'selected' : ''}>${label}</option>`;

// Panel „Hero-Layout" (Modus-Wahl Banner/Raster) oben in der Mitte.
function modePanelHtml(lang, mode) {
  const langLabel = lang === 'de' ? 'deutsche' : 'englische';
  return `
    <div class="panel">
      <h2>Hero-Layout <span class="lang-badge">${lang.toUpperCase()}</span></h2>
      <p class="hint">Bestimmt, wie der Bereich oben auf der ${langLabel} Startseite aufgebaut ist.
        Kachel-Bilder fügst du unten je Kachel direkt aus der Zwischenablage ein (oder im Tab <strong>Medien</strong>).</p>
      <div class="row" style="gap:1.25rem;margin-top:.4rem">
        <label style="display:flex;align-items:center;gap:.4rem;color:var(--text)">
          <input type="radio" name="lay-mode-${lang}" data-heromode="banner" data-lang="${lang}" ${mode === 'banner' ? 'checked' : ''} style="width:auto" />
          Einzel-Banner
        </label>
        <label style="display:flex;align-items:center;gap:.4rem;color:var(--text)">
          <input type="radio" name="lay-mode-${lang}" data-heromode="grid" data-lang="${lang}" ${mode === 'grid' ? 'checked' : ''} style="width:auto" />
          Bild-Raster (Kacheln)
        </label>
      </div>
    </div>`;
}

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
 * die (noch Vanilla-)Ganzseiten-Vorschau – ohne model.js ins Bundle zu ziehen.
 * @param {'de' | 'en'} lang
 */
export function layoutService(lang) {
  return {
    lang,
    media: () => state.media[lang],
    mediaOf: (l) => state.media[l],
    ensure: (l) => {
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
    page: () => Object.fromEntries(Object.entries(PAGE_GET).map(([k, get]) => [k, get()])),
    setPage: (key, v) => PAGE_SET[key]?.(v),
    resolve: resolveMedia,
    // target: 'banner' | 'slide' | { cell: i } | { cellSlide: i }
    pick: (target, title, onPick) => {
      const srv = [lang, 'shared'].reduce((n, l) => n + (state.serverFiles[l] || []).length, 0);
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
    paste: (target) => pasteFromClipboardApi(lang, target),
    bindCells: (hooks) => {
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
      model: (mode) => fullPageModel(lang, mode),
      keys: () => fullPageKeys(lang),
      offset: (key) => fullOffset(lang, key),
      setOffset: (key, x, y, w, h) => {
        setFullOffset(lang, key, x, y, w, h);
        return fullOffset(lang, key);
      },
      movedKeys: () => fullMovedKeys(lang),
      cardOffsets: () => fullCardOffsets(lang),
      cardOffsetIds: () => fullCardOffsetIds(lang),
      linkedKeys: (key) => fullLinkedTextKeys(lang, key),
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
  const lang = state.nav.section;
  const pane = $('#content');
  stopPreviewSlideshow();
  // Vue-Fassung (app/tabs/layout); ohne Vue-Teile bzw. mit Notbremse: Vanilla.
  const scrollY = window.scrollY;
  if (mountVueTab(pane, 'layout', { service: layoutService(lang === 'en' ? 'en' : 'de') })) {
    window.scrollTo(0, scrollY);
    return;
  }
  // Sichtzustand (Scroll der Seite/Seitenleisten, auf-/zugeklappte Bereiche) erhalten.
  const view = captureView(pane);
  unmountVueTab();
  const mode = state.media[lang].heroMode === 'grid' ? 'grid' : 'banner';
  const modePanel = pageLayoutPanelHtml() + modePanelHtml(lang, mode);
  pane.innerHTML =
    mode === 'grid' ? gridLayoutHtml(lang, modePanel) : bannerLayoutHtml(lang, modePanel);
  // Ganzseiten-Vorschau (Medien + Tool-Karten verschieben) unten in der Mitte.
  pane.querySelector('.tc-main')?.insertAdjacentHTML('beforeend', fullPageHtml(lang));

  // Zustand der bereichsinternen ↶/↷-Buttons sofort von der Kopfleiste
  // übernehmen (danach hält publish.js beide synchron).
  const hUndo = $('#undoBtn');
  const hRedo = $('#redoBtn');
  pane
    .querySelectorAll('[data-undoproxy]')
    .forEach((el) => (el.disabled = hUndo ? hUndo.disabled : true));
  pane
    .querySelectorAll('[data-redoproxy]')
    .forEach((el) => (el.disabled = hRedo ? hRedo.disabled : true));

  // Modus (Banner/Raster): strukturelle Änderung -> neu rendern.
  pane.querySelectorAll('[data-heromode]').forEach((el) =>
    el.addEventListener('change', () => {
      if (el.checked) {
        state.media[el.dataset.lang].heroMode = el.dataset.heromode;
        renderLayout();
      }
    }),
  );

  // Seiten-Layout (global): Klassisch/Kompakt und Medien auf dem Handy.
  pane.querySelectorAll('[data-homelayout]').forEach((el) =>
    el.addEventListener('change', () => {
      if (!el.checked) return;
      setHomeLayout(el.dataset.homelayout);
      renderLayout();
      toast(
        el.dataset.homelayout === 'compact'
          ? 'Kompakt-Layout gewählt'
          : 'Klassisches Layout gewählt',
      );
    }),
  );
  pane.querySelectorAll('[data-heromediamobile]').forEach((el) =>
    el.addEventListener('change', () => {
      setHeroMediaMobile(el.checked);
      toast(el.checked ? 'Medien auf dem Handy eingeblendet' : 'Medien auf dem Handy ausgeblendet');
    }),
  );
  pane.querySelector('[data-cardform]')?.addEventListener('change', (e) => {
    setCardForm(e.target.value);
    toast(e.target.value === 'tile' ? 'Kartenform: Kachel' : 'Kartenform: Liste');
  });
  pane.querySelector('[data-cardwidth]')?.addEventListener('change', (e) => {
    setCardWidth(e.target.value);
    toast('Kartenbreite geändert');
  });
  pane.querySelector('[data-catbar]')?.addEventListener('change', (e) => {
    setCatBar(e.target.checked);
    // Suchfeld-Schalter hängt an der Leiste -> neu rendern.
    renderLayout();
    toast(e.target.checked ? 'Kategorie-Leiste eingeblendet' : 'Kategorie-Leiste ausgeblendet');
  });
  pane.querySelector('[data-catsearch]')?.addEventListener('change', (e) => {
    setCatSearch(e.target.checked);
    toast(e.target.checked ? 'Suche eingeblendet' : 'Suche ausgeblendet');
  });
  pane.querySelector('[data-mediaposdesktop]')?.addEventListener('change', (e) => {
    setMediaPosDesktop(e.target.value);
    toast('Sektionsmedien Desktop geändert');
  });
  pane.querySelector('[data-mediaposmobile]')?.addEventListener('change', (e) => {
    setMediaPosMobile(e.target.value);
    toast('Sektionsmedien Handy/Tablet geändert');
  });

  if (mode === 'grid') bindGrid(pane, lang, renderLayout);
  else bindBanner(pane, lang, renderLayout);
  bindFullPage(pane, lang, renderLayout);
  bindSliders(pane); // nach den Feld-Handlern: Zahlenfeld löst deren input-Event aus
  bindColorPickers(pane);
  restoreView(pane, view);
}

// Zwischenablage-Modul mit dem Tab verbinden (Neu-Rendern, Kachel-Markierung).
// Bei der Vue-Fassung markiert deren Kachel-Auswahl (bindCells), sonst die Vanilla-Fassung.
let vueCells = null;
initPaste({
  rerender: renderLayout,
  markCell: (pane, i) => (vueCells ? vueCells.mark(i) : markCell(pane, i)),
  activeCell: () => (vueCells ? vueCells.active() : getActiveCell()),
});
