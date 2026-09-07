// Layout-Tab – Bild-Raster (Kacheln): Live-Vorschau, Kachel-Inhalte (Bild mit
// Bildbearbeitung, Text, Schrift, Diashow) und Kachel-Design (Rahmen,
// Hintergrund, Textfarbe/-größe/-position). Wird von layout.js gerendert
// (gridLayoutHtml) und verdrahtet (bindGrid).

import { $, esc, toast, fmtBytes } from './core.js';
import { slider } from './slider.js';
import { colorPicker } from './color.js';
import {
  state,
  rgbaFromHex,
  HERO_LAYOUTS,
  heroLayoutCells,
  GRID_DIMS,
  getCellStyle,
  getEffectiveCellStyle,
  HERO_GRID_MAX,
  CELL_SYNC_PROPS,
  defaultCellStyle,
  getMediaVal,
  setMediaVal,
  CELL_IMG_FIELDS,
  BANNER_SLIDES_MAX,
  BANNER_TRANSITIONS,
  getGridSlides,
  getGridSlideshow,
  defaultGridSlideshow,
} from './model.js';
import { objUrl, openMediaPicker } from './media.js';
import { fontOptionsHtml } from './fonts.js';
import {
  clamp,
  POS_PRESET_Y,
  fontFF,
  undoRedoBar,
  resetBtn,
  withReset,
  slideInfo,
  slideshowSettingsHtml,
  overlayStyle,
  dragHandle,
  setPreviewSlideshow,
  stopPreviewSlideshow,
} from './layout-shared.js';
import { pasteFromClipboardApi } from './layout-paste.js';

// Raster-Einstellungen und Kachel-Felder, die „Kachel-Design nach DE/EN übertragen"
// kopiert – alles außer Modus, Bildern/Links und dem Text je Kachel.
const GRID_DESIGN_KEYS = [
  'heroLayout',
  'heroGridRatio',
  'heroGridFit',
  'heroGridUniform',
  'heroGridUniformCell',
  'heroGridSlideshow',
];
const CELL_DESIGN_KEYS = Object.keys(defaultCellStyle()).filter((k) => k !== 'text');
const RATIO_AR = { '1:1': '1 / 1', '16:9': '16 / 9', '2:3': '2 / 3' };

// CSS grid-template-columns je Layout (nur für die Vorschau).
function gridCols(layout) {
  if (layout === 'vrow') return '1fr';
  if (layout === 'mosaic') return '2fr 1fr';
  if (layout === 'row4') return 'repeat(4, 1fr)';
  if (layout === 'grid3' || layout === 'grid6') return 'repeat(3, 1fr)';
  return 'repeat(2, 1fr)'; // grid2, grid4, big2
}

// Das der Kachel i zugewiesene Medium (Server-URL oder lokaler Zwischenspeicher
// 'staged:<id>') aufgelöst: { src, isVid, item } oder null, wenn leer/unbekannt.
function cellMedia(lang, i) {
  const val = getMediaVal(lang, 'grid' + i);
  if (!val) return null;
  if (val.startsWith('staged:')) {
    const id = val.slice(7);
    const item = state.stagedItems.find((x) => x.id === id);
    if (!item) return null;
    return { src: objUrl(id), isVid: /^video\//.test(item.type), item };
  }
  return { src: val, isVid: /\.(mp4|webm|mov|ogg)$/i.test(val), item: null };
}
// Inline-Style der Bildebene einer Vorschau-Kachel: Deckkraft/Abdunkelung/
// Weichzeichner/Sättigung wie auf der Seite (hero.css, --cell-img-*).
function cellImgStyle(s) {
  const f = [];
  if (s.imgBlur > 0) f.push(`blur(${s.imgBlur}px)`);
  if (s.imgDarken > 0) f.push(`brightness(${((100 - s.imgDarken) / 100).toFixed(2)})`);
  if (s.imgSaturate !== 100) f.push(`saturate(${s.imgSaturate}%)`);
  const inset = s.imgBlur > 0 ? -s.imgBlur * 2 : 0;
  return `position:absolute;inset:${inset}px;opacity:${(s.imgOpacity / 100).toFixed(2)};filter:${f.join(' ') || 'none'}`;
}
// Das der Kachel i zugewiesene Medium (zugewiesenes Bild/Video) als Ebene mit
// <img>/<video> für die Vorschau (inkl. Bildbearbeitung). '' wenn leer.
function cellMediaHtml(lang, i, fit, s) {
  const m = cellMedia(lang, i);
  if (!m) return '';
  const st = `width:100%;height:100%;object-fit:${fit};display:block`;
  const inner = m.isVid
    ? `<video src="${m.src}" muted style="${st}"></video>`
    : `<img src="${esc(m.src)}" style="${st}" />`;
  return `<div data-prevmedia="${i}" style="${cellImgStyle(s)}">${inner}</div>`;
}
// Weitere Bilder einer Kachel (Diashow) in der Seitenleiste „Kachel-Inhalte".
function cellSlidesHtml(lang, i) {
  const slides = getGridSlides(lang, i);
  const full = slides.length >= BANNER_SLIDES_MAX;
  const rows = slides
    .map((val, j) => {
      const info = slideInfo(val);
      const thumb = info
        ? `<img src="${esc(info.src)}" alt="" />`
        : '<span class="hint" style="margin:0">?</span>';
      const title = info && info.item ? `${info.item.name} – lokal` : val;
      return `
        <div class="row" data-cellsliderow="${i}:${j}" style="align-items:center;gap:.35rem;margin:.3rem 0">
          <span class="hint" style="margin:0;flex:0 0 1.6rem;text-align:right">${j + 2}.</span>
          <div class="bg-thumb" data-cellslidethumb="${i}:${j}" style="width:64px;height:40px" title="${esc(title)}">${thumb}</div>
          <span style="display:inline-flex;gap:.2rem;flex:0 0 auto;margin-left:auto">
            <button type="button" class="hd-reset" data-cellslideup="${i}:${j}" ${j === 0 ? 'disabled' : ''} title="Nach vorn">↑</button>
            <button type="button" class="hd-reset" data-cellslidedown="${i}:${j}" ${j === slides.length - 1 ? 'disabled' : ''} title="Nach hinten">↓</button>
            <button type="button" class="hd-reset danger" data-cellslideremove="${i}:${j}" title="Aus der Diashow entfernen">✕</button>
          </span>
        </div>`;
    })
    .join('');
  return `
      <details data-cellslides="${i}" ${slides.length ? 'open' : ''} style="margin-top:.5rem">
        <summary style="cursor:pointer;color:var(--text)">🎞️ Diashow – weitere Bilder${slides.length ? ` (${slides.length})` : ''}</summary>
        <p class="hint" style="margin:.3rem 0">Wechseln sich mit dem Kachel-Bild ab; Einstellungen (Takt, Übergang) gelten für alle Kacheln – siehe Mitte.</p>
        ${rows || '<p class="hint" style="margin:.2rem 0">Noch keine weiteren Bilder.</p>'}
        <div class="row" style="margin-top:.4rem">
          <button type="button" class="hd-reset" data-cellslidepaste="${i}" ${full ? 'disabled' : ''} title="Bild aus der Zwischenablage anhängen">📋 Anhängen</button>
          <button type="button" class="hd-reset" data-cellslideadd="${i}" ${full ? 'disabled' : ''}>📂 Aus Mediathek anhängen</button>
        </div>
      </details>`;
}
// Panel „Diashow der Kacheln" (Mitte, Raster-Modus): gemeinsame Einstellungen.
function gridSlideshowPanel(lang, cellsN) {
  const ss = getGridSlideshow(lang);
  const withSlides = Array.from({ length: cellsN }, (_, i) => i).filter(
    (i) => getGridSlides(lang, i).length > 0,
  );
  return `
    <div class="panel" data-gridslideshowblock>
      <h2 style="font-size:1rem;margin:0 0 .3rem">🎞️ Diashow der Kacheln</h2>
      <p class="hint">Weitere Bilder je Kachel fügst du links unter der Kachel („Diashow – weitere Bilder") hinzu.
        ${withSlides.length ? `Aktiv in Kachel ${withSlides.map((i) => i + 1).join(', ')}.` : 'Noch in keiner Kachel aktiv.'}
        Takt, Übergangsdauer und Übergang gelten für alle Kacheln; „versetzt" lässt die Kacheln nacheinander wechseln.</p>
      ${slideshowSettingsHtml(ss, 'gridslideshow', !withSlides.length, true)}
    </div>`;
}
// Inline-Style des Kachel-Text-Overlays (in der Vorschau).
function cellTextOverlayStyle(color, size, x, y, font) {
  return overlayStyle(color, size, x, y, font, '.85rem', '0 1px 3px rgba(0,0,0,.7)');
}

// Live-Vorschau der Anordnung: zeigt die zugewiesenen Bilder (oder eine leere,
// gestylte Platzhalter-Kachel) im jeweiligen Per-Kachel-Design.
function previewHtml(lang, layout, cellsN, ratio) {
  const ar = RATIO_AR[ratio] || '1 / 1';
  const fit = state.media[lang].heroGridFit === 'contain' ? 'contain' : 'cover';
  const cells = Array.from({ length: cellsN }, (_, i) => {
    const s = getEffectiveCellStyle(lang, i);
    const bg = rgbaFromHex(s.bgColor, s.bgOpacity);
    let box = `aspect-ratio:${ar};`;
    let span = '';
    if (layout === 'mosaic') {
      box = 'height:100%;';
      if (i === 0) span = 'grid-row:1 / span 2;';
    }
    const media = cellMediaHtml(lang, i, fit, s);
    const base = media || `<span style="color:var(--muted);font-size:.72rem">${i + 1}</span>`;
    const textOverlay = s.text
      ? `<div data-prevtext="${i}" title="Zum Verschieben ziehen" style="${cellTextOverlayStyle(s.textColor, s.textSize, s.textX, s.textY, s.font)}">${esc(s.text)}</div>`
      : `<div data-prevtext="${i}"></div>`;
    return `<div data-prevcell="${i}" title="Kachel ${i + 1} bearbeiten" style="position:relative;${box}${span}border-radius:8px;overflow:hidden;background:${bg};border:${s.borderWidth}px solid ${s.borderColor};display:flex;align-items:center;justify-content:center;cursor:pointer">${base}${textOverlay}</div>`;
  }).join('');
  const rows = layout === 'mosaic' ? 'grid-template-rows:1fr 1fr;aspect-ratio:2 / 1;' : '';
  const maxW = layout === 'big2' ? '440px' : layout === 'vrow' ? '190px' : '400px';
  return `<div style="display:grid;grid-template-columns:${gridCols(layout)};${rows}gap:.45rem;max-width:${maxW};margin:.2rem auto">${cells}</div>`;
}

// Bild-Block eines Kachel-Editors: Vorschaubild, Einfügen aus der Zwischenablage
// (Button oder Strg/Cmd+V), Mediathek, Entfernen sowie die Bildbearbeitung
// (Deckkraft, Abdunkelung, Weichzeichner, Sättigung) als Slider mit Zahlenfeld + ↺.
function cellImageBlock(lang, i, inherited) {
  const s = getEffectiveCellStyle(lang, i);
  const m = state.media[lang];
  const med = cellMedia(lang, i);
  const val = getMediaVal(lang, 'grid' + i);
  const thumb = med
    ? med.isVid
      ? `<video src="${med.src}" muted style="width:100%;height:100%;object-fit:cover;display:block"></video>`
      : `<img src="${esc(med.src)}" alt="" />`
    : '<span class="hint" style="margin:0">Kein Bild</span>';
  const ratio = ['1:1', '16:9', '2:3'].includes(m.heroGridRatio) ? m.heroGridRatio : '1:1';
  let info;
  if (med && med.item) {
    const size = med.item.blob ? ` · ${fmtBytes(med.item.blob.size)}` : '';
    info = `<strong>● ${esc(med.item.name)}${size}</strong> – lokal, wird beim Veröffentlichen hochgeladen.`;
  } else if (med) {
    info = `<code>${esc(val)}</code>`;
  } else {
    info = `Empfohlen: <strong>${GRID_DIMS[ratio]}</strong>${m.heroLayout === 'mosaic' ? ' (Mosaik: große Kachel doppelt so hoch)' : ''}.`;
  }
  const sliders = Object.entries(CELL_IMG_FIELDS)
    .map(
      ([f, c]) =>
        `<div style="flex:1 1 200px">${slider({ id: `ly:cell:${i}:${f}`, label: c.label, unit: c.unit, min: c.min, max: c.max, value: s[f], attrs: `data-cellfield="${i}:${f}"`, resetAttrs: `data-cellreset="${i}:${f}"`, disabled: inherited })}</div>`,
    )
    .join('');
  return `
      <div class="row" style="align-items:flex-start;margin-top:.5rem">
        <div class="bg-thumb" data-cellimgthumb="${i}">${thumb}</div>
        <div style="flex:1 1 260px">
          <div class="row" style="margin:0">
            <button type="button" data-cellpaste="${i}" title="Bild aus der Zwischenablage in diese Kachel einfügen (oder Kachel anklicken und Strg/Cmd+V drücken)" style="flex:0 0 auto">📋 Aus Zwischenablage einfügen</button>
            <button type="button" data-cellimgpick="${i}" style="flex:0 0 auto">📂 Aus Mediathek</button>
            <button type="button" class="danger" data-cellimgclear="${i}" ${med ? '' : 'disabled'} style="flex:0 0 auto">Entfernen</button>
          </div>
          <p class="hint" style="margin:.4rem 0 0">Bild kopieren (z. B. Screenshot), Kachel anklicken und <kbd>Strg</kbd>/<kbd>Cmd</kbd>+<kbd>V</kbd> drücken – oder den Button nutzen. ${info}</p>
        </div>
      </div>
      <div class="row" style="align-items:flex-end;margin-top:.2rem;${med || m.heroGridUniform ? '' : 'opacity:.55'}" data-cellimgrow="${i}">
        ${sliders}
      </div>
      ${cellSlidesHtml(lang, i)}`;
}

// Kachel-Zustand bei „Standard für alle Kacheln" (Master / geerbt).
function cellState(lang, i) {
  const m = state.media[lang];
  const isMaster = m.heroGridUniform && (m.heroGridUniformCell || 0) === i;
  // Von einer anderen Kachel „geerbt"? Dann Felder sperren und Hinweis zeigen.
  const inherited = m.heroGridUniform && !isMaster;
  return {
    isMaster,
    inherited,
    dis: inherited ? 'disabled' : '',
    masterIdx: m.heroGridUniformCell || 0,
  };
}
// Linke Seitenleiste: Inhalt einer Kachel – Bild (mit Bildbearbeitung), Text, Schriftart.
function cellContentEditor(lang, i, bigLabel) {
  const s = getEffectiveCellStyle(lang, i);
  const { inherited, dis, masterIdx } = cellState(lang, i);
  const note = inherited
    ? `<p class="hint" style="margin:.3rem 0 0;color:var(--accent)">↳ Bildbearbeitung und Schriftart von Kachel ${masterIdx + 1}; Bild und Text bleiben eigen.</p>`
    : '';
  return `
    <div class="panel" data-celleditor="${i}" style="padding:.7rem .9rem;margin-bottom:.6rem;scroll-margin-top:.5rem">
      <strong style="font-size:.85rem">Kachel ${i + 1}${bigLabel ? ' (groß)' : ''}</strong>
      ${note}
      ${cellImageBlock(lang, i, inherited)}
      <div class="row" style="align-items:flex-end;margin-top:.4rem">
        <div style="flex:2 1 160px">
          <label>Text (über dem Bild / im leeren Kasten)</label>
          ${withReset(`<input data-cellfield="${i}:text" value="${esc(s.text || '')}" placeholder="z.B. Neu" maxlength="120" style="${fontFF(s.font || '')}" />`, 'data-cellreset', `${i}:text`, false)}
        </div>
        <div style="flex:1 1 160px">
          <label>Schriftart des Textes</label>
          ${withReset(`<select data-cellfont="${i}" ${dis} style="${fontFF(s.font || '')}">${fontOptionsHtml(s.font || '')}</select>`, 'data-cellreset', `${i}:font`, inherited)}
        </div>
      </div>
    </div>`;
}
// Rechte Seitenleiste: Design einer Kachel – Rahmen, Hintergrund, Textfarbe/-größe/-position.
function cellDesignEditor(lang, i, bigLabel) {
  const s = getEffectiveCellStyle(lang, i);
  const { isMaster, inherited, dis, masterIdx } = cellState(lang, i);
  const note = inherited
    ? `<p class="hint" style="margin:.3rem 0 0;color:var(--accent)">↳ Übernimmt Rahmen (Farbe &amp; Dicke), Hintergrund, Transparenz, Textgröße, -farbe und -position von Kachel ${masterIdx + 1}.</p>`
    : '';
  return `
    <div class="panel" data-celleditor="${i}" style="padding:.7rem .9rem;margin-bottom:.6rem;scroll-margin-top:.5rem${inherited ? ';opacity:.75' : ''}">
      <div style="display:flex;align-items:center;gap:.75rem;flex-wrap:wrap">
        <strong style="font-size:.85rem">Kachel ${i + 1}${bigLabel ? ' (groß)' : ''}</strong>
        <label style="display:flex;align-items:center;gap:.35rem;margin:0;color:${isMaster ? 'var(--accent)' : 'var(--muted)'};font-size:.75rem;cursor:pointer">
          <input type="checkbox" data-cellmaster="${i}" ${isMaster ? 'checked' : ''} style="width:auto" />
          Standard für alle
        </label>
        <button type="button" class="hd-reset" data-cellresetall="${i}" title="Ganze Kachel auf Standard zurücksetzen" aria-label="Ganze Kachel zurücksetzen" style="margin-left:auto">↺ Kachel</button>
      </div>
      ${note}
      <div class="row" style="align-items:flex-end;margin-top:.4rem">
        <div style="flex:0 0 auto">
          <label>Rahmenfarbe</label>
          ${colorPicker({ id: `ly:cell:${i}:borderColor`, attrs: `data-cellfield="${i}:borderColor"`, value: s.borderColor, disabled: inherited, resetHtml: resetBtn('data-cellreset', `${i}:borderColor`, inherited) })}
        </div>
        <div style="flex:0 0 auto">
          <label>Rahmendicke (px)</label>
          ${withReset(`<input type="number" data-cellfield="${i}:borderWidth" min="0" max="20" step="1" value="${s.borderWidth}" ${dis} style="width:90px" />`, 'data-cellreset', `${i}:borderWidth`, inherited)}
        </div>
        <div style="flex:0 0 auto">
          <label>Hintergrund</label>
          ${colorPicker({ id: `ly:cell:${i}:bgColor`, attrs: `data-cellfield="${i}:bgColor"`, value: s.bgColor, disabled: inherited, resetHtml: resetBtn('data-cellreset', `${i}:bgColor`, inherited) })}
        </div>
        <div style="flex:1 1 160px">
          ${slider({ id: `ly:cell:${i}:bgOpacity`, label: 'Hintergrund-Transparenz', unit: '%', min: 0, max: 100, value: s.bgOpacity, attrs: `data-cellfield="${i}:bgOpacity"`, resetAttrs: `data-cellreset="${i}:bgOpacity"`, disabled: inherited })}
        </div>
      </div>
      <div class="row" style="align-items:flex-end;margin-top:.4rem">
        <div style="flex:0 0 auto">
          <label>Textfarbe</label>
          ${colorPicker({ id: `ly:cell:${i}:textColor`, attrs: `data-cellfield="${i}:textColor"`, value: s.textColor || '#ffffff', disabled: inherited, resetHtml: resetBtn('data-cellreset', `${i}:textColor`, inherited) })}
        </div>
        <div style="flex:0 0 auto">
          <label>Textgröße (px, 0=auto)</label>
          ${withReset(`<input type="number" data-cellfield="${i}:textSize" min="0" max="96" step="1" value="${s.textSize || 0}" ${dis} style="width:120px" />`, 'data-cellreset', `${i}:textSize`, inherited)}
        </div>
        <div style="flex:1 1 auto">
          <label>Textposition <span style="color:var(--muted);font-weight:400">— in der Vorschau mit der Maus ziehen</span></label>
          <div style="display:flex;gap:.3rem;align-items:center;flex-wrap:wrap">
            <button type="button" class="hd-reset" data-cellpospreset="${i}:top" ${dis} title="Oben" aria-label="Oben">⤒</button>
            <button type="button" class="hd-reset" data-cellpospreset="${i}:center" ${dis} title="Mitte" aria-label="Mitte">◎</button>
            <button type="button" class="hd-reset" data-cellpospreset="${i}:bottom" ${dis} title="Unten" aria-label="Unten">⤓</button>
            <span class="hint" data-cellposval="${i}" style="margin:0 .2rem">${s.textX} / ${s.textY} %</span>
            ${resetBtn('data-cellreset', `${i}:pos`, inherited)}
          </div>
        </div>
      </div>
    </div>`;
}

// Raster-Modus des Layout-Tabs: dreispaltig (links Kachel-Inhalte, Mitte Modus-Panel
// + Sticky-Vorschau + Anordnung/Form + Diashow, rechts Kachel-Design).
export function gridLayoutHtml(lang, modePanel) {
  const m = state.media[lang];
  const layout = Object.prototype.hasOwnProperty.call(HERO_LAYOUTS, m.heroLayout)
    ? m.heroLayout
    : 'grid3';
  const cellsN = heroLayoutCells(layout);
  const isMosaic = layout === 'mosaic';
  const ratio = ['1:1', '16:9', '2:3'].includes(m.heroGridRatio) ? m.heroGridRatio : '1:1';
  const fitContain = m.heroGridFit === 'contain';
  const layoutOpts = Object.entries(HERO_LAYOUTS)
    .map(([k, v]) => `<option value="${k}" ${k === layout ? 'selected' : ''}>${v.label}</option>`)
    .join('');
  // Kompakte Live-Vorschau – bleibt beim Scrollen sichtbar (sticky), Höhe
  // begrenzt (scrollt intern), damit sie den Adminbereich nicht blockiert.
  const previewPanel = `
    <div data-stickyprev style="position:sticky;top:.5rem;z-index:5;background:var(--panel);border:1px solid var(--border);border-radius:10px;padding:.6rem .9rem;margin:0 0 .9rem;box-shadow:0 8px 22px rgba(0,0,0,.4);max-height:38vh;overflow:auto">
      <div style="display:flex;align-items:center;gap:.5rem;margin:.1rem 0 .35rem">
        <span class="hint" style="margin:0">👁 Live-Vorschau (${cellsN} Kachel${cellsN === 1 ? '' : 'n'}) — Kachel anklicken zum Bearbeiten:</span>
        ${undoRedoBar()}
      </div>
      <div data-layprev>${previewHtml(lang, layout, cellsN, ratio)}</div>
    </div>`;
  const layoutSel = `
    <div class="panel">
      <label>Anordnung der Kacheln</label>
      <select data-herolayout data-lang="${lang}" style="width:auto">${layoutOpts}</select>
      <p class="hint" style="margin-top:.5rem">Wähle Anordnung &amp; Form; die Vorschau oben aktualisiert sich sofort.</p>
    </div>`;
  const ratioSel = isMosaic
    ? ''
    : `
    <div class="panel">
      <label>Form der Kacheln</label>
      <select data-gridratio data-lang="${lang}" style="width:auto">
        <option value="1:1" ${ratio === '1:1' ? 'selected' : ''}>Quadratisch (1:1)</option>
        <option value="16:9" ${ratio === '16:9' ? 'selected' : ''}>Breit / Rechteck (16:9)</option>
        <option value="2:3" ${ratio === '2:3' ? 'selected' : ''}>Hochkant (2:3)</option>
      </select>
      <label style="display:flex;align-items:center;gap:.4rem;color:var(--text);margin-top:.7rem">
        <input type="checkbox" data-gridfit data-lang="${lang}" ${fitContain ? 'checked' : ''} style="width:auto" />
        Ganzes Bild zeigen (nicht beschneiden)
      </label>
      <p class="hint" style="margin-top:.6rem">📐 Empfohlene Bildgröße: <strong>${GRID_DIMS[ratio]}</strong> — für alle Kacheln gleich.</p>
    </div>`;
  const cells = Array.from({ length: cellsN }, (_, i) => i);
  const contentSide = `
    <aside class="tc-side" data-tcside="left">
      <div class="tc-side-head left">🖼️ Kachel-Inhalte</div>
      <p class="hint">Pro Kachel: <strong>Bild</strong> (aus der Zwischenablage oder Mediathek) mit Bildbearbeitung
        (Deckkraft, Abdunkelung, Weichzeichner, Sättigung) sowie optionaler <strong>Text</strong> mit <strong>Schriftart</strong>
        (aus dem Server-Ordner <code>/fonts</code>). Kachel in der Vorschau anklicken springt zur passenden Kachel.</p>
      ${cells.map((i) => cellContentEditor(lang, i, isMosaic && i === 0)).join('')}
    </aside>`;
  const gridOtherLang = lang === 'de' ? 'en' : 'de';
  const gridOtherLabel = gridOtherLang === 'de' ? 'Deutsch' : 'English';
  const designSide = `
    <aside class="tc-side" data-tcside="right">
      <div class="tc-side-head right">🎨 Kachel-Design</div>
      <p class="hint">Pro Kachel: Rahmenfarbe &amp; -dicke, Hintergrundfarbe &amp; -transparenz, Textfarbe, -größe und -position.
        Rahmendicke 0 = kein Rahmen. „Standard für alle" macht eine Kachel zur Vorlage der übrigen.</p>
      <div class="panel" style="display:flex;flex-wrap:wrap;gap:.4rem;align-items:center">
        <button type="button" class="hd-reset" data-gridcopylang="${gridOtherLang}" style="white-space:normal;text-align:left;flex:1 1 auto;min-width:0;max-width:100%" title="Anordnung, Form und Design aller Kacheln in die andere Sprache übernehmen – Texte und Bilder bleiben je Sprache">📋 Kachel-Design nach ${gridOtherLabel} übertragen<br /><span class="hint" style="margin:0">(Anordnung, Form, Rahmen, Hintergrund, Schrift, Textfarbe/-größe/-position, Bildbearbeitung, „Standard für alle“ – Texte und Bilder bleiben je Sprache)</span></button>
      </div>
      ${cells.map((i) => cellDesignEditor(lang, i, isMosaic && i === 0)).join('')}
    </aside>`;
  const hintPanel = `
    <div class="panel"><p class="hint" style="margin:0">Links die <strong>Inhalte</strong> der Kacheln (Bild, Text, Schrift), rechts ihr <strong>Design</strong> (Rahmen, Hintergrund, Textfarbe/-position). Die Vorschau bleibt beim Scrollen oben sichtbar; Texte darin mit der Maus verschieben.</p></div>`;
  return `<div class="tc-layout">${contentSide}<div class="tc-main">${modePanel}${previewPanel}${layoutSel}${ratioSel}${gridSlideshowPanel(lang, cellsN)}${hintPanel}</div>${designSide}</div>`;
}

// Aktualisiert eine Vorschau-Kachel live (ohne Neu-Rendern), damit Slider/Farb-
// Ziehen flüssig bleibt.
function updatePreviewCell(pane, lang, i) {
  const box = pane.querySelector(`[data-prevcell="${i}"]`);
  if (!box) return;
  const s = getEffectiveCellStyle(lang, i);
  box.style.background = rgbaFromHex(s.bgColor, s.bgOpacity);
  box.style.border = `${s.borderWidth}px solid ${s.borderColor}`;
  const media = box.querySelector(`[data-prevmedia="${i}"]`);
  if (media) media.setAttribute('style', cellImgStyle(s));
}
// Text-Overlay einer Vorschau-Kachel live aktualisieren (Text/Schrift).
function updatePreviewText(pane, lang, i) {
  const box = pane.querySelector(`[data-prevtext="${i}"]`);
  if (!box) return;
  const s = getEffectiveCellStyle(lang, i);
  if (!s.text) {
    box.textContent = '';
    box.removeAttribute('style');
    return;
  }
  box.textContent = s.text;
  box.setAttribute(
    'style',
    cellTextOverlayStyle(s.textColor, s.textSize, s.textX, s.textY, s.font),
  );
}
// „x / y %"-Anzeige aller Kachel-Editoren aktualisieren (berücksichtigt „Standard
// für alle Kacheln": geerbte Kacheln zeigen die Werte der Master-Kachel).
function updateCellPosLabels(pane, lang) {
  pane.querySelectorAll('[data-cellposval]').forEach((el) => {
    const s = getEffectiveCellStyle(lang, Number(el.dataset.cellposval));
    el.textContent = `${s.textX} / ${s.textY} %`;
  });
}

// Aktualisiert die Vorschau nach einer Feld-Änderung: bei „Standard für alle
// Kacheln" und einer synchronisierten Eigenschaft alle Kacheln, sonst nur die
// bearbeitete.
function refreshPreviewFor(pane, lang, i, field) {
  const all = state.media[lang].heroGridUniform && CELL_SYNC_PROPS.includes(field);
  const idx = all
    ? [...pane.querySelectorAll('[data-prevcell]')].map((el) => Number(el.dataset.prevcell))
    : [i];
  for (const n of idx) {
    updatePreviewCell(pane, lang, n);
    updatePreviewText(pane, lang, n);
  }
}

// Zuletzt markierte Kachel (Ziel für Strg/Cmd+V außerhalb eines Editors).
let activeCell = null;
// Zuletzt markierte Kachel (für Strg/Cmd+V aus layout-paste.js).
export function getActiveCell() {
  return activeCell;
}
// Kachel i in Vorschau UND Editor hervorheben (ohne zu scrollen).
export function markCell(pane, i) {
  activeCell = i;
  pane.querySelectorAll('[data-prevcell]').forEach((el) => {
    const on = Number(el.dataset.prevcell) === i;
    el.style.outline = on ? '3px solid var(--accent)' : '';
    el.style.outlineOffset = on ? '-2px' : '';
  });
  pane.querySelectorAll('[data-celleditor]').forEach((el) => {
    el.style.boxShadow = Number(el.dataset.celleditor) === i ? '0 0 0 2px var(--accent)' : '';
  });
}
// Wie markCell, zusätzlich die Editoren der Kachel in beiden Seitenleisten nach
// oben scrollen (nur innerhalb der Seitenleiste – die Seite selbst bleibt stehen).
function selectCell(pane, i) {
  markCell(pane, i);
  pane.querySelectorAll(`[data-celleditor="${i}"]`).forEach((editor) => {
    const side = editor.closest('.tc-side');
    if (!side) return;
    // Position relativ zum sichtbaren Bereich der Seitenleiste (unabhängig vom offsetParent).
    const top =
      editor.getBoundingClientRect().top - side.getBoundingClientRect().top + side.scrollTop;
    side.scrollTo({ top: Math.max(0, top - 8), behavior: 'smooth' });
  });
}
// Vorschau-Diashow der Kacheln: alle Kacheln mit weiteren Bildern wechseln im
// gemeinsamen Takt.
function startGridSlideshow(pane, lang) {
  const cellImgs = [...pane.querySelectorAll('[data-prevmedia] img')]
    .map((img) => {
      const i = Number(img.closest('[data-prevmedia]').dataset.prevmedia);
      const first = cellMedia(lang, i);
      const srcs = [
        first && !first.isVid ? first.src : '',
        ...getGridSlides(lang, i).map((v) => slideInfo(v)?.src || ''),
      ].filter(Boolean);
      return srcs.length > 1 ? { img, srcs, cur: 0 } : null;
    })
    .filter(Boolean);
  if (!cellImgs.length) return;
  const ms = Math.max(1, getGridSlideshow(lang).interval) * 1000;
  setPreviewSlideshow(() => {
    if (!cellImgs[0].img.isConnected) {
      stopPreviewSlideshow();
      return;
    }
    for (const c of cellImgs) {
      c.cur = (c.cur + 1) % c.srcs.length;
      c.img.setAttribute('src', c.srcs[c.cur]);
    }
  }, ms);
}

// Verdrahtet alle Bedienelemente des Raster-Modus. rr = Tab neu rendern.
export function bindGrid(pane, lang, rr) {
  const m = state.media[lang];
  // Klick auf eine Vorschau-Kachel: markieren + Editor darunter scrollen.
  pane
    .querySelectorAll('[data-prevcell]')
    .forEach((el) =>
      el.addEventListener('click', () => selectCell(pane, Number(el.dataset.prevcell))),
    );
  // Umgekehrt: Fokus in einem Kachel-Editor markiert die passende Vorschau-Kachel.
  pane
    .querySelectorAll('[data-celleditor]')
    .forEach((el) =>
      el.addEventListener('focusin', () => markCell(pane, Number(el.dataset.celleditor))),
    );

  // „Standard für alle Kacheln": diese Kachel wird Vorlage für alle anderen.
  // Ausschalten stellt die individuellen Werte wieder her – die eigenen Werte
  // jeder Kachel werden nie überschrieben, nur beim Anzeigen überlagert.
  pane.querySelectorAll('[data-cellmaster]').forEach((el) => {
    const i = Number(el.dataset.cellmaster);
    el.addEventListener('change', () => {
      const m = state.media[lang];
      m.heroGridUniform = el.checked;
      if (el.checked) m.heroGridUniformCell = i;
      rr();
      toast(
        el.checked
          ? `Kachel ${i + 1} ist Standard für alle Kacheln`
          : 'Jede Kachel nutzt wieder ihre eigenen Einstellungen',
      );
    });
  });

  // ↺ Einzelnes Kachel-Feld auf Standard zurücksetzen.
  pane.querySelectorAll('[data-cellreset]').forEach((el) => {
    const [iStr, field] = el.dataset.cellreset.split(':');
    const i = Number(iStr);
    el.addEventListener('click', () => {
      const d = defaultCellStyle();
      const s = getCellStyle(lang, i);
      if (field === 'pos') {
        s.textX = d.textX;
        s.textY = d.textY;
      } else if (field in d) {
        s[field] = d[field];
      }
      rr();
      toast('Auf Standard zurückgesetzt');
    });
  });
  // ↺ Ganze Kachel zurücksetzen (alle Felder inkl. Text).
  pane.querySelectorAll('[data-cellresetall]').forEach((el) => {
    const i = Number(el.dataset.cellresetall);
    el.addEventListener('click', () => {
      if (!confirm(`Alle Einstellungen von Kachel ${i + 1} auf Standard zurücksetzen?`)) return;
      Object.assign(getCellStyle(lang, i), defaultCellStyle());
      rr();
      toast(`Kachel ${i + 1} zurückgesetzt`);
    });
  });

  pane.querySelectorAll('[data-herolayout]').forEach((el) =>
    el.addEventListener('change', () => {
      state.media[el.dataset.lang].heroLayout = el.value;
      rr();
    }),
  );
  pane.querySelectorAll('[data-gridratio]').forEach((el) =>
    el.addEventListener('change', () => {
      state.media[el.dataset.lang].heroGridRatio = el.value;
      rr(); // Vorschau-Form + empfohlene Größe aktualisieren
    }),
  );
  pane.querySelectorAll('[data-gridfit]').forEach((el) =>
    el.addEventListener('change', () => {
      state.media[el.dataset.lang].heroGridFit = el.checked ? 'contain' : 'cover';
      rr(); // Vorschau-Medien-Zuschnitt aktualisieren
    }),
  );

  // Per-Kachel-Design: live aktualisieren (kein Neu-Rendern -> Slider bleibt greifbar).
  pane.querySelectorAll('[data-cellfield]').forEach((el) => {
    const [iStr, field] = el.dataset.cellfield.split(':');
    const i = Number(iStr);
    el.addEventListener('input', () => {
      const s = getCellStyle(lang, i);
      if (field === 'borderWidth') {
        s.borderWidth = clamp(parseInt(el.value, 10) || 0, 0, 20);
      } else if (field === 'bgOpacity') {
        s.bgOpacity = clamp(parseInt(el.value, 10) || 0, 0, 100);
      } else if (field === 'text') {
        s.text = el.value.slice(0, 120);
      } else if (field === 'textSize') {
        s.textSize = clamp(parseInt(el.value, 10) || 0, 0, 96);
      } else if (field in CELL_IMG_FIELDS) {
        const c = CELL_IMG_FIELDS[field];
        s[field] = clamp(parseInt(el.value, 10) || 0, c.min, c.max);
      } else {
        s[field] = el.value; // Farben (Rahmen/Hintergrund/Text)
      }
      // Bei „Standard für alle Kacheln" wirkt eine synchronisierte Eigenschaft
      // auf ALLE Kacheln -> gesamte Vorschau auffrischen, sonst nur diese.
      refreshPreviewFor(pane, lang, i, field);
    });
  });
  // Text-Position der Kachel: Presets (Oben/Mitte/Unten) setzen x=50 und y.
  pane.querySelectorAll('[data-cellpospreset]').forEach((el) => {
    const [iStr, pos] = el.dataset.cellpospreset.split(':');
    const i = Number(iStr);
    el.addEventListener('click', () => {
      const s = getCellStyle(lang, i);
      s.textX = 50;
      s.textY = POS_PRESET_Y[pos] ?? 50;
      refreshPreviewFor(pane, lang, i, 'textX');
      updateCellPosLabels(pane, lang);
    });
  });

  // Kachel-Bild: Zwischenablage (Button), Mediathek, Entfernen.
  pane.querySelectorAll('[data-cellpaste]').forEach((el) => {
    const i = Number(el.dataset.cellpaste);
    el.addEventListener('click', () => {
      markCell(pane, i);
      pasteFromClipboardApi(lang, i);
    });
  });
  pane.querySelectorAll('[data-cellimgpick]').forEach((el) => {
    const i = Number(el.dataset.cellimgpick);
    el.addEventListener('click', () => {
      markCell(pane, i);
      const srv = [lang, 'shared'].reduce((n, l) => n + (state.serverFiles[l] || []).length, 0);
      if (!state.stagedItems.length && !srv) {
        toast('Keine Medien vorhanden — Bild einfügen oder im Tab „Medien" hochladen.');
        return;
      }
      openMediaPicker(lang, 'grid' + i, {
        title: `Bild/Video für Kachel ${i + 1} wählen`,
        onPick: (url) => {
          setMediaVal(lang, 'grid' + i, url);
          const y = window.scrollY;
          rr();
          markCell($('#content'), i);
          window.scrollTo({ top: y });
        },
      });
    });
  });
  pane.querySelectorAll('[data-cellimgclear]').forEach((el) => {
    const i = Number(el.dataset.cellimgclear);
    el.addEventListener('click', () => {
      setMediaVal(lang, 'grid' + i, '');
      const y = window.scrollY;
      rr();
      markCell($('#content'), i);
      window.scrollTo({ top: y });
      toast(`Bild aus Kachel ${i + 1} entfernt`);
    });
  });

  // Schriftart des Kachel-Textes.
  pane.querySelectorAll('[data-cellfont]').forEach((el) => {
    const i = Number(el.dataset.cellfont);
    el.addEventListener('change', () => {
      getCellStyle(lang, i).font = el.value;
      const ff = fontFF(el.value);
      el.setAttribute('style', ff);
      const inp = pane.querySelector(`[data-cellfield="${i}:text"]`);
      if (inp) inp.setAttribute('style', ff);
      refreshPreviewFor(pane, lang, i, 'font');
    });
  });
  // Diashow der Kacheln: Bilder je Kachel anhängen / ordnen / entfernen + Einstellungen.
  const cellSlideRef = (el, attr) => {
    const [i, j] = el.dataset[attr].split(':').map(Number);
    return { i, j };
  };
  pane
    .querySelectorAll('[data-cellslidepaste]')
    .forEach((el) =>
      el.addEventListener('click', () =>
        pasteFromClipboardApi(lang, 'cellslide:' + Number(el.dataset.cellslidepaste)),
      ),
    );
  pane.querySelectorAll('[data-cellslideadd]').forEach((el) =>
    el.addEventListener('click', () => {
      const i = Number(el.dataset.cellslideadd);
      const srv = [lang, 'shared'].reduce((n, l) => n + (state.serverFiles[l] || []).length, 0);
      if (!state.stagedItems.length && !srv) {
        toast('Keine Bilder vorhanden — Bild einfügen oder im Tab „Dateien" hochladen.');
        return;
      }
      openMediaPicker(lang, 'heroGridSlide', {
        title: `Weiteres Bild für die Diashow von Kachel ${i + 1} wählen`,
        imagesOnly: true,
        onPick: (url) => {
          const slides = getGridSlides(lang, i);
          if (slides.length >= BANNER_SLIDES_MAX) {
            toast(`Maximal ${BANNER_SLIDES_MAX} weitere Bilder`);
            return;
          }
          slides.push(url);
          rr();
          markCell($('#content'), i);
          toast(`Bild an die Diashow von Kachel ${i + 1} angehängt`);
        },
      });
    }),
  );
  pane.querySelectorAll('[data-cellslideremove]').forEach((el) =>
    el.addEventListener('click', () => {
      const { i, j } = cellSlideRef(el, 'cellslideremove');
      getGridSlides(lang, i).splice(j, 1);
      rr();
      markCell($('#content'), i);
    }),
  );
  const moveCellSlide = (i, j, dir) => {
    const slides = getGridSlides(lang, i);
    const k = j + dir;
    if (k < 0 || k >= slides.length) return;
    [slides[j], slides[k]] = [slides[k], slides[j]];
    rr();
    markCell($('#content'), i);
  };
  pane.querySelectorAll('[data-cellslideup]').forEach((el) =>
    el.addEventListener('click', () => {
      const { i, j } = cellSlideRef(el, 'cellslideup');
      moveCellSlide(i, j, -1);
    }),
  );
  pane.querySelectorAll('[data-cellslidedown]').forEach((el) =>
    el.addEventListener('click', () => {
      const { i, j } = cellSlideRef(el, 'cellslidedown');
      moveCellSlide(i, j, 1);
    }),
  );
  pane.querySelectorAll('[data-gridslideshow]').forEach((el) => {
    const f = el.dataset.gridslideshow;
    el.addEventListener(
      el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input',
      () => {
        const ss = getGridSlideshow(lang);
        if (f === 'interval') {
          const n = parseInt(el.value, 10);
          ss.interval = clamp(Number.isFinite(n) ? n : 5, 1, 30);
          startGridSlideshow(pane, lang);
        } else if (f === 'duration') {
          const n = parseInt(el.value, 10);
          ss.duration = clamp(Number.isFinite(n) ? n : 800, 0, 5000);
        } else if (f === 'transition')
          ss.transition = BANNER_TRANSITIONS.includes(el.value) ? el.value : 'fade';
        else if (f === 'pauseOnHover') ss.pauseOnHover = el.checked;
        else if (f === 'dots') ss.dots = el.checked;
        else if (f === 'stagger') ss.stagger = el.checked;
      },
    );
  });
  pane.querySelectorAll('[data-gridslideshowreset]').forEach((el) =>
    el.addEventListener('click', () => {
      const f = el.dataset.gridslideshowreset;
      const d = defaultGridSlideshow();
      if (f in d) getGridSlideshow(lang)[f] = d[f];
      rr();
    }),
  );
  // Kachel-Raster: Anordnung, Form und Design aller Kacheln in die andere Sprache
  // übernehmen – Kachel-Texte und Bilder/Links bleiben je Sprache.
  pane.querySelectorAll('[data-gridcopylang]').forEach((el) =>
    el.addEventListener('click', () => {
      const to = el.dataset.gridcopylang === 'en' ? 'en' : 'de';
      const label = to === 'de' ? 'Deutsch' : 'English';
      if (
        !confirm(
          `Kachel-Design nach ${label} übertragen? Anordnung, Form und Design aller Kacheln werden dort ersetzt; Texte und Bilder bleiben.`,
        )
      )
        return;
      const src = state.media[lang];
      const dst = state.media[to];
      for (const k of GRID_DESIGN_KEYS) dst[k] = src[k];
      for (let i = 0; i < HERO_GRID_MAX; i++) {
        const from = getCellStyle(lang, i);
        const target = getCellStyle(to, i);
        for (const k of CELL_DESIGN_KEYS) target[k] = from[k];
      }
      toast(`Kachel-Design nach ${label} übertragen`);
    }),
  );

  // Kachel-Texte ziehen. Geerbte Kacheln („Standard für alle Kacheln") sind
  // gesperrt – nur die Master-Kachel bzw. freie Kacheln lassen sich verschieben.
  pane.querySelectorAll('[data-prevtext]').forEach((handle) => {
    const i = Number(handle.dataset.prevtext);
    const inherited = m.heroGridUniform && (m.heroGridUniformCell || 0) !== i;
    if (inherited) {
      handle.style.cursor = 'default';
      handle.style.pointerEvents = 'none';
      return;
    }
    dragHandle(
      handle,
      pane.querySelector(`[data-prevcell="${i}"]`),
      (x, y) => {
        const s = getCellStyle(lang, i);
        s.textX = x;
        s.textY = y;
        refreshPreviewFor(pane, lang, i, 'textX');
        updateCellPosLabels(pane, lang);
      },
      () => selectCell(pane, i),
    );
  });
  startGridSlideshow(pane, lang);
}
