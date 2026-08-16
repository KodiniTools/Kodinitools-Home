// Layout-Tab: Anordnung des Hero-Bereichs (Banner vs. Raster-Layouts) samt
// Form (Seitenverhältnis) und Per-Kachel-Design (Rahmen + Hintergrund) mit
// Live-Vorschau. Die eigentliche Medien-Zuweisung passiert weiter im Medien-Tab.

import { $, esc, toast } from './core.js';
import {
  state,
  rgbaFromHex,
  HERO_LAYOUTS,
  heroLayoutCells,
  GRID_DIMS,
  getCellStyle,
  getEffectiveCellStyle,
  CELL_SYNC_PROPS,
  defaultCellStyle,
  getMediaVal,
} from './model.js';
import { objUrl } from './media.js';
import { fontOptionsHtml, ensureFontFace } from './fonts.js';

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
// Preset-Positionen (⤒ Oben / ◎ Mitte / ⤓ Unten) als y-Wert in %.
const POS_PRESET_Y = { top: 10, center: 50, bottom: 90 };
// font-family-CSS für eine Kachel-Textschrift (lädt @font-face für die Vorschau) oder ''.
function fontFF(file) {
  return file ? `font-family:'${ensureFontFace(file)}', var(--site-font, sans-serif);` : '';
}
const RATIO_AR = { '1:1': '1 / 1', '16:9': '16 / 9', '2:3': '2 / 3' };

// Bereichsinterne Rückgängig/Wiederherstellen-Buttons. Sie greifen auf denselben
// globalen Verlauf zu wie die Kopfleiste (Anbindung + Zustand in publish.js).
function undoRedoBar() {
  return `<span style="display:inline-flex;gap:.3rem;margin-left:auto">
      <button type="button" class="hd-reset" data-undoproxy title="Rückgängig (Strg/Cmd+Z)" aria-label="Rückgängig">↶</button>
      <button type="button" class="hd-reset" data-redoproxy title="Wiederherstellen (Strg/Cmd+Y)" aria-label="Wiederherstellen">↷</button>
    </span>`;
}

// Kleiner „Zurücksetzen"-Button (↺) für ein einzelnes Feld.
// scope: 'cell' (data-cellreset="i:feld") oder 'banner' (data-bannerreset="feld").
function resetBtn(attr, val, disabled) {
  return `<button type="button" class="hd-reset" ${attr}="${esc(val)}" ${disabled ? 'disabled' : ''} title="Auf Standard zurücksetzen" aria-label="Auf Standard zurücksetzen">↺</button>`;
}
// Umschließt ein Eingabe-Element mit seinem Zurücksetzen-Button (nebeneinander).
function withReset(inputHtml, attr, val, disabled) {
  return `<div style="display:flex;gap:.3rem;align-items:center">${inputHtml}${resetBtn(attr, val, disabled)}</div>`;
}

// CSS grid-template-columns je Layout (nur für die Vorschau).
function gridCols(layout) {
  if (layout === 'vrow') return '1fr';
  if (layout === 'mosaic') return '2fr 1fr';
  if (layout === 'row4') return 'repeat(4, 1fr)';
  if (layout === 'grid3' || layout === 'grid6') return 'repeat(3, 1fr)';
  return 'repeat(2, 1fr)'; // grid2, grid4, big2
}

// Das der Kachel i zugewiesene Medium (zugewiesenes Bild/Video) als <img>/<video>
// für die Vorschau – Server-URL oder lokaler Zwischenspeicher (staged:). '' wenn leer.
function cellMediaHtml(lang, i, fit) {
  const val = getMediaVal(lang, 'grid' + i);
  if (!val) return '';
  let src = val;
  let isVid = /\.(mp4|webm|mov|ogg)$/i.test(val);
  if (val.startsWith('staged:')) {
    const id = val.slice(7);
    const item = state.stagedItems.find((x) => x.id === id);
    if (!item) return '';
    src = objUrl(id);
    isVid = /^video\//.test(item.type);
  }
  const st = `width:100%;height:100%;object-fit:${fit};display:block`;
  return isVid
    ? `<video src="${src}" muted style="${st}"></video>`
    : `<img src="${esc(src)}" style="${st}" />`;
}

// Das dem Einzelbanner zugewiesene Medium (Bild/Video) als <img>/<video> oder ''.
function bannerMediaHtml(lang) {
  const val = getMediaVal(lang, 'heroBanner');
  if (!val) return '';
  let src = val;
  let isVid = /\.(mp4|webm|mov|ogg)$/i.test(val);
  if (val.startsWith('staged:')) {
    const id = val.slice(7);
    const item = state.stagedItems.find((x) => x.id === id);
    if (!item) return '';
    src = objUrl(id);
    isVid = /^video\//.test(item.type);
  }
  const st =
    'max-width:100%;max-height:240px;width:auto;height:auto;object-fit:contain;border-radius:10px;display:block;margin:0 auto';
  return isVid
    ? `<video src="${src}" muted style="${st}"></video>`
    : `<img src="${esc(src)}" style="${st}" />`;
}
// Gemeinsamer Overlay-Style: der Text wird an (x,y) in % verankert (Mittelpunkt)
// und lässt sich in der Vorschau mit der Maus frei verschieben (cursor:move).
function overlayStyle(color, size, x, y, font, fsDefault, shadow) {
  const fs = size > 0 ? `${size}px` : fsDefault;
  const cx = clamp(Number(x) || 0, 0, 100);
  const cy = clamp(Number(y) || 0, 0, 100);
  return `position:absolute;left:${cx}%;top:${cy}%;transform:translate(-50%,-50%);max-width:92%;text-align:center;padding:.1rem .3rem;color:${color || '#fff'};font-size:${fs};line-height:1.2;text-shadow:${shadow};word-break:break-word;cursor:move;pointer-events:auto;user-select:none;touch-action:none;${fontFF(font)}`;
}
// Inline-Style des Banner-Text-Overlays (Farbe, freie Position, Größe, Schrift).
function bannerTextStyle(color, size, x, y, font) {
  return overlayStyle(color, size, x, y, font, '1.3rem', '0 2px 6px rgba(0,0,0,.6)');
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
    const media = cellMediaHtml(lang, i, fit);
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

// Editor für Rahmen + Hintergrund einer Kachel.
function cellEditor(lang, i, bigLabel) {
  const s = getEffectiveCellStyle(lang, i);
  const m = state.media[lang];
  const isMaster = m.heroGridUniform && (m.heroGridUniformCell || 0) === i;
  // Von einer anderen Kachel „geerbt"? Dann Felder sperren und Hinweis zeigen.
  const inherited = m.heroGridUniform && !isMaster;
  const dis = inherited ? 'disabled' : '';
  const note = inherited
    ? `<p class="hint" style="margin:.3rem 0 0;color:var(--accent)">↳ Übernimmt Rahmen (Farbe &amp; Dicke), Hintergrund, Transparenz, Schriftart, Textgröße, -farbe und -position von Kachel ${(m.heroGridUniformCell || 0) + 1}.</p>`
    : '';
  return `
    <div class="panel" data-celleditor="${i}" style="padding:.7rem .9rem;margin-bottom:.6rem;scroll-margin-top:44vh${inherited ? ';opacity:.75' : ''}">
      <div style="display:flex;align-items:center;gap:.75rem;flex-wrap:wrap">
        <strong style="font-size:.85rem">Kachel ${i + 1}${bigLabel ? ' (groß)' : ''}</strong>
        <label style="display:flex;align-items:center;gap:.35rem;margin:0;color:${isMaster ? 'var(--accent)' : 'var(--muted)'};font-size:.75rem;cursor:pointer">
          <input type="checkbox" data-cellmaster="${i}" ${isMaster ? 'checked' : ''} style="width:auto" />
          Standard für alle Kacheln
        </label>
        <button type="button" class="hd-reset" data-cellresetall="${i}" title="Ganze Kachel auf Standard zurücksetzen" aria-label="Ganze Kachel zurücksetzen" style="margin-left:auto">↺ Kachel</button>
      </div>
      ${note}
      <div class="row" style="align-items:flex-end;margin-top:.4rem">
        <div style="flex:0 0 auto">
          <label>Rahmenfarbe</label>
          ${withReset(`<input type="color" data-cellfield="${i}:borderColor" value="${esc(s.borderColor)}" ${dis} style="width:56px;height:38px;padding:2px" />`, 'data-cellreset', `${i}:borderColor`, inherited)}
        </div>
        <div style="flex:0 0 auto">
          <label>Rahmendicke (px)</label>
          ${withReset(`<input type="number" data-cellfield="${i}:borderWidth" min="0" max="20" step="1" value="${s.borderWidth}" ${dis} style="width:90px" />`, 'data-cellreset', `${i}:borderWidth`, inherited)}
        </div>
        <div style="flex:0 0 auto">
          <label>Hintergrund</label>
          ${withReset(`<input type="color" data-cellfield="${i}:bgColor" value="${esc(s.bgColor)}" ${dis} style="width:56px;height:38px;padding:2px" />`, 'data-cellreset', `${i}:bgColor`, inherited)}
        </div>
        <div style="flex:1 1 170px">
          <label>Hintergrund-Transparenz: <span data-cellopval="${i}">${s.bgOpacity}</span>%</label>
          ${withReset(`<input type="range" data-cellfield="${i}:bgOpacity" min="0" max="100" value="${s.bgOpacity}" ${dis} style="width:100%" />`, 'data-cellreset', `${i}:bgOpacity`, inherited)}
        </div>
      </div>
      <div class="row" style="align-items:flex-end;margin-top:.4rem">
        <div style="flex:2 1 220px">
          <label>Text (über dem Bild / im leeren Kasten)</label>
          ${withReset(`<input data-cellfield="${i}:text" value="${esc(s.text || '')}" placeholder="z.B. Neu" maxlength="120" style="${fontFF(s.font || '')}" />`, 'data-cellreset', `${i}:text`, false)}
        </div>
        <div style="flex:1 1 200px">
          <label>Schriftart des Textes</label>
          ${withReset(`<select data-cellfont="${i}" ${dis} style="${fontFF(s.font || '')}">${fontOptionsHtml(s.font || '')}</select>`, 'data-cellreset', `${i}:font`, inherited)}
        </div>
      </div>
      <div class="row" style="align-items:flex-end;margin-top:.4rem">
        <div style="flex:0 0 auto">
          <label>Textfarbe</label>
          ${withReset(`<input type="color" data-cellfield="${i}:textColor" value="${esc(s.textColor || '#ffffff')}" ${dis} style="width:56px;height:38px;padding:2px" />`, 'data-cellreset', `${i}:textColor`, inherited)}
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

function layoutPanel(lang) {
  const m = state.media[lang];
  const mode = m.heroMode === 'grid' ? 'grid' : 'banner';
  const langLabel = lang === 'de' ? 'deutsche' : 'englische';
  const modePanel = `
    <div class="panel">
      <h2>Hero-Layout <span class="lang-badge">${lang.toUpperCase()}</span></h2>
      <p class="hint">Bestimmt, wie der Bereich oben auf der ${langLabel} Startseite aufgebaut ist.
        Die Bilder selbst weist du im Tab <strong>Medien</strong> zu.</p>
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
  if (mode !== 'grid') {
    const bText = m.heroBannerText || '';
    const bFont = m.heroBannerFont || '';
    const bColor = m.heroBannerTextColor || '#ffffff';
    const bSize = m.heroBannerTextSize || 0;
    const bX = Number.isFinite(m.heroBannerTextX) ? m.heroBannerTextX : 50;
    const bY = Number.isFinite(m.heroBannerTextY) ? m.heroBannerTextY : 50;
    const bMedia = bannerMediaHtml(lang);
    const previewBox = `
      <div data-bannerbox style="position:relative;max-width:520px;margin:.2rem auto;display:flex;align-items:center;justify-content:center;min-height:80px">
        ${bMedia || '<span class="hint">Kein Banner gewählt — im Tab „Medien" zuweisen.</span>'}
        <div data-bannertext ${bText ? 'title="Zum Verschieben ziehen"' : ''} style="${bText ? bannerTextStyle(bColor, bSize, bX, bY, bFont) : ''}">${esc(bText)}</div>
      </div>`;
    const previewPanel = `
      <div style="position:sticky;top:.5rem;z-index:5;background:var(--panel);border:1px solid var(--border);border-radius:10px;padding:.6rem .9rem;margin:0 0 .9rem;box-shadow:0 8px 22px rgba(0,0,0,.4);max-height:38vh;overflow:auto">
        <div style="display:flex;align-items:center;gap:.5rem;margin:.1rem 0 .35rem">
          <span class="hint" style="margin:0">👁 Live-Vorschau (Banner):</span>
          ${undoRedoBar()}
        </div>
        ${previewBox}
      </div>`;
    const textPanel = `
      <div class="panel">
        <h2>Banner-Text</h2>
        <p class="hint">Optionaler Text über dem Banner mit Schriftart (aus <code>/fonts</code>), Farbe,
          Größe und Position. Leer = kein Text. Das Banner-Bild/-Video wählst du im Tab <strong>Medien</strong>.</p>
        <div class="row" style="align-items:flex-end">
          <div style="flex:2 1 240px">
            <label>Text</label>
            ${withReset(`<input data-bannerfield="text" value="${esc(bText)}" placeholder="z.B. Willkommen" maxlength="120" style="${fontFF(bFont)}" />`, 'data-bannerreset', 'text', false)}
          </div>
          <div style="flex:1 1 200px">
            <label>Schriftart des Textes</label>
            ${withReset(`<select data-bannerfont style="${fontFF(bFont)}">${fontOptionsHtml(bFont)}</select>`, 'data-bannerreset', 'font', false)}
          </div>
        </div>
        <div class="row" style="align-items:flex-end;margin-top:.4rem">
          <div style="flex:0 0 auto">
            <label>Textfarbe</label>
            ${withReset(`<input type="color" data-bannerfield="textColor" value="${esc(bColor)}" style="width:56px;height:38px;padding:2px" />`, 'data-bannerreset', 'textColor', false)}
          </div>
          <div style="flex:0 0 auto">
            <label>Textgröße (px, 0=auto)</label>
            ${withReset(`<input type="number" data-bannerfield="textSize" min="0" max="96" step="1" value="${bSize}" style="width:120px" />`, 'data-bannerreset', 'textSize', false)}
          </div>
          <div style="flex:1 1 auto">
            <label>Textposition <span style="color:var(--muted);font-weight:400">— in der Vorschau mit der Maus ziehen</span></label>
            <div style="display:flex;gap:.3rem;align-items:center;flex-wrap:wrap">
              <button type="button" class="hd-reset" data-bannerpospreset="top" title="Oben" aria-label="Oben">⤒</button>
              <button type="button" class="hd-reset" data-bannerpospreset="center" title="Mitte" aria-label="Mitte">◎</button>
              <button type="button" class="hd-reset" data-bannerpospreset="bottom" title="Unten" aria-label="Unten">⤓</button>
              <span class="hint" data-bannerposval style="margin:0 .2rem">${bX} / ${bY} %</span>
              ${resetBtn('data-bannerreset', 'pos', false)}
            </div>
          </div>
        </div>
      </div>`;
    return modePanel + previewPanel + textPanel;
  }
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
  const editors = `
    <div class="panel">
      <h2>Kachel-Design (Rahmen, Hintergrund &amp; Text)</h2>
      <p class="hint">Pro Kachel: Rahmenfarbe &amp; -dicke, Hintergrundfarbe &amp; -transparenz sowie ein
        optionaler <strong>Text</strong> mit <strong>Schriftart</strong> (aus dem Server-Ordner <code>/fonts</code>).
        Der Text erscheint über dem Bild bzw. im leeren Kasten. Rahmendicke 0 = kein Rahmen.</p>
      ${Array.from({ length: cellsN }, (_, i) => cellEditor(lang, i, isMosaic && i === 0)).join('')}
    </div>`;
  return modePanel + previewPanel + layoutSel + ratioSel + editors;
}

// Aktualisiert eine Vorschau-Kachel live (ohne Neu-Rendern), damit Slider/Farb-
// Ziehen flüssig bleibt.
function updatePreviewCell(pane, lang, i) {
  const box = pane.querySelector(`[data-prevcell="${i}"]`);
  if (!box) return;
  const s = getEffectiveCellStyle(lang, i);
  box.style.background = rgbaFromHex(s.bgColor, s.bgOpacity);
  box.style.border = `${s.borderWidth}px solid ${s.borderColor}`;
}
// Banner-Text-Overlay in der Vorschau live aktualisieren.
function updateBannerPreviewText(pane, lang) {
  const box = pane.querySelector('[data-bannertext]');
  if (!box) return;
  const m = state.media[lang];
  const t = m.heroBannerText || '';
  box.textContent = t;
  box.setAttribute(
    'style',
    t
      ? bannerTextStyle(
          m.heroBannerTextColor,
          m.heroBannerTextSize,
          m.heroBannerTextX,
          m.heroBannerTextY,
          m.heroBannerFont,
        )
      : '',
  );
}
// „x / y %"-Anzeige des Banner-Textes aktualisieren.
function updateBannerPosLabel(pane, lang) {
  const el = pane.querySelector('[data-bannerposval]');
  if (!el) return;
  const m = state.media[lang];
  el.textContent = `${m.heroBannerTextX} / ${m.heroBannerTextY} %`;
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

// Kachel i in Vorschau UND Editor hervorheben (ohne zu scrollen).
function markCell(pane, i) {
  pane.querySelectorAll('[data-prevcell]').forEach((el) => {
    const on = Number(el.dataset.prevcell) === i;
    el.style.outline = on ? '3px solid var(--accent)' : '';
    el.style.outlineOffset = on ? '-2px' : '';
  });
  pane.querySelectorAll('[data-celleditor]').forEach((el) => {
    el.style.boxShadow = Number(el.dataset.celleditor) === i ? '0 0 0 2px var(--accent)' : '';
  });
}
// Wie markCell, zusätzlich den Editor direkt unter die sticky Vorschau scrollen.
function selectCell(pane, i) {
  markCell(pane, i);
  const editor = pane.querySelector(`[data-celleditor="${i}"]`);
  if (!editor) return;
  const sticky = pane.querySelector('[data-stickyprev]');
  const stickyH = sticky ? sticky.getBoundingClientRect().height : 0;
  const top = editor.getBoundingClientRect().top + window.scrollY - stickyH - 24;
  window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
}

// Macht ein Text-Overlay (handle) innerhalb seines Containers per Maus/Touch
// ziehbar. onMove(x,y) bekommt die neue Position in % (0–100). onTap() wird bei
// einem Klick ohne Bewegung ausgelöst (z. B. um die Kachel auszuwählen).
function dragHandle(handle, container, onMove, onTap) {
  if (!handle || !container) return;
  let active = false;
  let moved = false;
  let sx = 0;
  let sy = 0;
  handle.addEventListener('pointerdown', (e) => {
    active = true;
    moved = false;
    sx = e.clientX;
    sy = e.clientY;
    try {
      handle.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    e.preventDefault();
  });
  handle.addEventListener('pointermove', (e) => {
    if (!active) return;
    if (Math.abs(e.clientX - sx) > 3 || Math.abs(e.clientY - sy) > 3) moved = true;
    const r = container.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const x = Math.round(clamp(((e.clientX - r.left) / r.width) * 100, 0, 100));
    const y = Math.round(clamp(((e.clientY - r.top) / r.height) * 100, 0, 100));
    onMove(x, y);
  });
  const end = (e) => {
    if (!active) return;
    active = false;
    try {
      handle.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    if (!moved && onTap) onTap();
  };
  handle.addEventListener('pointerup', end);
  handle.addEventListener('pointercancel', end);
}

// Verdrahtet das freie Ziehen der Text-Overlays (Banner + Kacheln) in der Vorschau.
function wireDrag(pane, lang) {
  const m = state.media[lang];
  // Banner-Text ziehen. Ohne Text ist das Overlay 0 px groß und nicht greifbar –
  // die Verdrahtung greift automatisch, sobald ein Text eingegeben wurde.
  const bt = pane.querySelector('[data-bannertext]');
  if (bt) {
    dragHandle(bt, pane.querySelector('[data-bannerbox]'), (x, y) => {
      m.heroBannerTextX = x;
      m.heroBannerTextY = y;
      updateBannerPreviewText(pane, lang);
      updateBannerPosLabel(pane, lang);
    });
  }
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
}

export function renderLayout() {
  const lang = state.nav.section;
  const pane = $('#content');
  pane.innerHTML = layoutPanel(lang);

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
      renderLayout();
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
      renderLayout();
      toast('Auf Standard zurückgesetzt');
    });
  });
  // ↺ Ganze Kachel zurücksetzen (alle Felder inkl. Text).
  pane.querySelectorAll('[data-cellresetall]').forEach((el) => {
    const i = Number(el.dataset.cellresetall);
    el.addEventListener('click', () => {
      if (!confirm(`Alle Einstellungen von Kachel ${i + 1} auf Standard zurücksetzen?`)) return;
      Object.assign(getCellStyle(lang, i), defaultCellStyle());
      renderLayout();
      toast(`Kachel ${i + 1} zurückgesetzt`);
    });
  });
  // ↺ Banner-Textfeld auf Standard zurücksetzen.
  pane.querySelectorAll('[data-bannerreset]').forEach((el) => {
    const field = el.dataset.bannerreset;
    const defs = { text: '', font: '', textColor: '#ffffff', textSize: 0 };
    el.addEventListener('click', () => {
      const m = state.media[lang];
      if (field === 'pos') {
        m.heroBannerTextX = 50;
        m.heroBannerTextY = 50;
      } else if (field in defs) {
        m['heroBanner' + field.charAt(0).toUpperCase() + field.slice(1)] = defs[field];
      }
      renderLayout();
      toast('Auf Standard zurückgesetzt');
    });
  });

  // Modus (Banner/Raster) + Layout: strukturelle Änderung -> neu rendern.
  pane.querySelectorAll('[data-heromode]').forEach((el) =>
    el.addEventListener('change', () => {
      if (el.checked) {
        state.media[el.dataset.lang].heroMode = el.dataset.heromode;
        renderLayout();
      }
    }),
  );
  pane.querySelectorAll('[data-herolayout]').forEach((el) =>
    el.addEventListener('change', () => {
      state.media[el.dataset.lang].heroLayout = el.value;
      renderLayout();
    }),
  );
  pane.querySelectorAll('[data-gridratio]').forEach((el) =>
    el.addEventListener('change', () => {
      state.media[el.dataset.lang].heroGridRatio = el.value;
      renderLayout(); // Vorschau-Form + empfohlene Größe aktualisieren
    }),
  );
  pane.querySelectorAll('[data-gridfit]').forEach((el) =>
    el.addEventListener('change', () => {
      state.media[el.dataset.lang].heroGridFit = el.checked ? 'contain' : 'cover';
      renderLayout(); // Vorschau-Medien-Zuschnitt aktualisieren
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
        const ov = pane.querySelector(`[data-cellopval="${i}"]`);
        if (ov) ov.textContent = s.bgOpacity;
      } else if (field === 'text') {
        s.text = el.value.slice(0, 120);
      } else if (field === 'textSize') {
        s.textSize = clamp(parseInt(el.value, 10) || 0, 0, 96);
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

  // Banner-Text: Text / Farbe / Größe (Banner-Modus).
  pane.querySelectorAll('[data-bannerfield]').forEach((el) =>
    el.addEventListener('input', () => {
      const f = el.dataset.bannerfield;
      const m = state.media[lang];
      if (f === 'text') m.heroBannerText = el.value.slice(0, 120);
      else if (f === 'textColor') m.heroBannerTextColor = el.value;
      else if (f === 'textSize') m.heroBannerTextSize = clamp(parseInt(el.value, 10) || 0, 0, 96);
      updateBannerPreviewText(pane, lang);
    }),
  );
  pane.querySelectorAll('[data-bannerpospreset]').forEach((el) =>
    el.addEventListener('click', () => {
      state.media[lang].heroBannerTextX = 50;
      state.media[lang].heroBannerTextY = POS_PRESET_Y[el.dataset.bannerpospreset] ?? 50;
      updateBannerPreviewText(pane, lang);
      updateBannerPosLabel(pane, lang);
    }),
  );
  pane.querySelectorAll('[data-bannerfont]').forEach((el) =>
    el.addEventListener('change', () => {
      state.media[lang].heroBannerFont = el.value;
      const ff = fontFF(el.value);
      el.setAttribute('style', ff);
      const inp = pane.querySelector('[data-bannerfield="text"]');
      if (inp) inp.setAttribute('style', ff);
      updateBannerPreviewText(pane, lang);
    }),
  );

  // Freies Verschieben der Text-Overlays per Maus (Banner + Kacheln).
  wireDrag(pane, lang);
}
