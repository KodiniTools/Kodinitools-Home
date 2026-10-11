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
import { $, toast } from './core.js';
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
} from './model.js';
import { stopPreviewSlideshow } from './layout-shared.js';
import { bannerLayoutHtml, bindBanner } from './layout-banner.js';
import { gridLayoutHtml, bindGrid, markCell, getActiveCell } from './layout-grid.js';
import { initPaste } from './layout-paste.js';
import { fullPageHtml, bindFullPage } from './layout-fullpage.js';

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
        Die Tool-Karten stehen in einem Raster, das sich der Breite anpasst; als <strong>Liste</strong> zeigen sie zwei Zeilen Beschreibung statt des Popups.
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
        <label style="display:flex;align-items:center;gap:.4rem;color:var(--text)" title="Liste: Titel mit zwei Zeilen Beschreibung, auf dem Handy einspaltig. Kachel: wie im klassischen Layout, Beschreibung im Popup.">
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

export function renderLayout() {
  const lang = state.nav.section;
  const pane = $('#content');
  // Sichtzustand (Scroll der Seite/Seitenleisten, auf-/zugeklappte Bereiche) erhalten.
  const view = captureView(pane);
  stopPreviewSlideshow();
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
initPaste({ rerender: renderLayout, markCell, activeCell: getActiveCell });
