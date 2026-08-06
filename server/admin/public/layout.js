// Layout-Tab: Anordnung des Hero-Bereichs (Banner vs. Raster-Layouts) samt
// Form (Seitenverhältnis) und Per-Kachel-Design (Rahmen + Hintergrund) mit
// Live-Vorschau. Die eigentliche Medien-Zuweisung passiert weiter im Medien-Tab.

import { $, esc } from './core.js';
import {
  state,
  rgbaFromHex,
  HERO_LAYOUTS,
  heroLayoutCells,
  GRID_DIMS,
  getCellStyle,
  getMediaVal,
} from './model.js';
import { objUrl } from './media.js';
import { fontOptionsHtml, ensureFontFace } from './fonts.js';

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
// font-family-CSS für eine Kachel-Textschrift (lädt @font-face für die Vorschau) oder ''.
function fontFF(file) {
  return file ? `font-family:'${ensureFontFace(file)}', var(--site-font, sans-serif);` : '';
}
const RATIO_AR = { '1:1': '1 / 1', '16:9': '16 / 9', '2:3': '2 / 3' };

// CSS grid-template-columns je Layout (nur für die Vorschau).
function gridCols(layout) {
  if (layout === 'vrow') return '1fr';
  if (layout === 'mosaic') return '2fr 1fr';
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
// Inline-Style des Banner-Text-Overlays (oder '' bei leerem Text).
function bannerTextStyle(font) {
  return `position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;padding:.4rem;color:#fff;font-weight:800;font-size:1.3rem;line-height:1.2;text-shadow:0 2px 6px rgba(0,0,0,.6);word-break:break-word;pointer-events:none;${fontFF(font)}`;
}

// Live-Vorschau der Anordnung: zeigt die zugewiesenen Bilder (oder eine leere,
// gestylte Platzhalter-Kachel) im jeweiligen Per-Kachel-Design.
function previewHtml(lang, layout, cellsN, ratio) {
  const ar = RATIO_AR[ratio] || '1 / 1';
  const fit = state.media[lang].heroGridFit === 'contain' ? 'contain' : 'cover';
  const cells = Array.from({ length: cellsN }, (_, i) => {
    const s = getCellStyle(lang, i);
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
      ? `<div data-prevtext="${i}" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;padding:.2rem;color:#fff;font-weight:700;font-size:.85rem;line-height:1.15;text-shadow:0 1px 3px rgba(0,0,0,.7);word-break:break-word;${fontFF(s.font)}">${esc(s.text)}</div>`
      : `<div data-prevtext="${i}"></div>`;
    return `<div data-prevcell="${i}" style="position:relative;${box}${span}border-radius:8px;overflow:hidden;background:${bg};border:${s.borderWidth}px solid ${s.borderColor};display:flex;align-items:center;justify-content:center">${base}${textOverlay}</div>`;
  }).join('');
  const rows = layout === 'mosaic' ? 'grid-template-rows:1fr 1fr;aspect-ratio:2 / 1;' : '';
  const maxW = layout === 'big2' ? '560px' : layout === 'vrow' ? '260px' : '520px';
  return `<div style="display:grid;grid-template-columns:${gridCols(layout)};${rows}gap:.5rem;max-width:${maxW};margin:.3rem auto">${cells}</div>`;
}

// Editor für Rahmen + Hintergrund einer Kachel.
function cellEditor(lang, i, bigLabel) {
  const s = getCellStyle(lang, i);
  return `
    <div class="panel" style="padding:.7rem .9rem;margin-bottom:.6rem">
      <strong style="font-size:.85rem">Kachel ${i + 1}${bigLabel ? ' (groß)' : ''}</strong>
      <div class="row" style="align-items:flex-end;margin-top:.4rem">
        <div style="flex:0 0 auto">
          <label>Rahmenfarbe</label>
          <input type="color" data-cellfield="${i}:borderColor" value="${esc(s.borderColor)}" style="width:56px;height:38px;padding:2px" />
        </div>
        <div style="flex:0 0 auto">
          <label>Rahmendicke (px)</label>
          <input type="number" data-cellfield="${i}:borderWidth" min="0" max="20" step="1" value="${s.borderWidth}" style="width:90px" />
        </div>
        <div style="flex:0 0 auto">
          <label>Hintergrund</label>
          <input type="color" data-cellfield="${i}:bgColor" value="${esc(s.bgColor)}" style="width:56px;height:38px;padding:2px" />
        </div>
        <div style="flex:1 1 170px">
          <label>Hintergrund-Transparenz: <span data-cellopval="${i}">${s.bgOpacity}</span>%</label>
          <input type="range" data-cellfield="${i}:bgOpacity" min="0" max="100" value="${s.bgOpacity}" style="width:100%" />
        </div>
      </div>
      <div class="row" style="align-items:flex-end;margin-top:.4rem">
        <div style="flex:2 1 220px">
          <label>Text (über dem Bild / im leeren Kasten)</label>
          <input data-cellfield="${i}:text" value="${esc(s.text || '')}" placeholder="z.B. Neu" maxlength="120" />
        </div>
        <div style="flex:1 1 200px">
          <label>Schriftart des Textes</label>
          <select data-cellfont="${i}">${fontOptionsHtml(s.font || '')}</select>
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
    const bMedia = bannerMediaHtml(lang);
    const previewBox = `
      <div style="position:relative;max-width:640px;margin:.3rem auto;display:flex;align-items:center;justify-content:center;min-height:90px">
        ${bMedia || '<span class="hint">Kein Banner gewählt — im Tab „Medien" zuweisen.</span>'}
        <div data-bannertext style="${bText ? bannerTextStyle(bFont) : ''}">${esc(bText)}</div>
      </div>`;
    const previewPanel = `
      <div style="position:sticky;top:.5rem;z-index:5;background:var(--panel);border:1px solid var(--border);border-radius:10px;padding:.7rem .9rem;margin:0 0 .9rem;box-shadow:0 8px 22px rgba(0,0,0,.4)">
        <p class="hint" style="margin:.1rem 0 .4rem">👁 Live-Vorschau (Banner) — bleibt beim Scrollen sichtbar:</p>
        ${previewBox}
      </div>`;
    const textPanel = `
      <div class="panel">
        <h2>Banner-Text</h2>
        <p class="hint">Optionaler Text über dem Banner mit wählbarer Schriftart (aus dem Server-Ordner
          <code>/fonts</code>). Leer = kein Text. Das Banner-Bild/-Video wählst du im Tab <strong>Medien</strong>.</p>
        <div class="row" style="align-items:flex-end">
          <div style="flex:2 1 240px">
            <label>Text</label>
            <input data-bannerfield="text" value="${esc(bText)}" placeholder="z.B. Willkommen" maxlength="120" />
          </div>
          <div style="flex:1 1 200px">
            <label>Schriftart des Textes</label>
            <select data-bannerfont>${fontOptionsHtml(bFont)}</select>
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
  // Große Live-Vorschau – bleibt beim Scrollen oben sichtbar (sticky).
  const previewPanel = `
    <div style="position:sticky;top:.5rem;z-index:5;background:var(--panel);border:1px solid var(--border);border-radius:10px;padding:.7rem .9rem;margin:0 0 .9rem;box-shadow:0 8px 22px rgba(0,0,0,.4)">
      <p class="hint" style="margin:.1rem 0 .4rem">👁 Live-Vorschau (${cellsN} Kachel${cellsN === 1 ? '' : 'n'}) — bleibt beim Scrollen sichtbar:</p>
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
  const s = getCellStyle(lang, i);
  box.style.background = rgbaFromHex(s.bgColor, s.bgOpacity);
  box.style.border = `${s.borderWidth}px solid ${s.borderColor}`;
}
// Banner-Text-Overlay in der Vorschau live aktualisieren.
function updateBannerPreviewText(pane, lang) {
  const box = pane.querySelector('[data-bannertext]');
  if (!box) return;
  const t = state.media[lang].heroBannerText || '';
  box.textContent = t;
  box.setAttribute('style', t ? bannerTextStyle(state.media[lang].heroBannerFont || '') : '');
}
// Text-Overlay einer Vorschau-Kachel live aktualisieren (Text/Schrift).
function updatePreviewText(pane, lang, i) {
  const box = pane.querySelector(`[data-prevtext="${i}"]`);
  if (!box) return;
  const s = getCellStyle(lang, i);
  if (!s.text) {
    box.textContent = '';
    box.removeAttribute('style');
    return;
  }
  box.textContent = s.text;
  box.setAttribute(
    'style',
    `position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;padding:.2rem;color:#fff;font-weight:700;font-size:.85rem;line-height:1.15;text-shadow:0 1px 3px rgba(0,0,0,.7);word-break:break-word;${fontFF(s.font)}`,
  );
}

export function renderLayout() {
  const lang = state.nav.section;
  const pane = $('#content');
  pane.innerHTML = layoutPanel(lang);

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
        updatePreviewCell(pane, lang, i);
      } else if (field === 'bgOpacity') {
        s.bgOpacity = clamp(parseInt(el.value, 10) || 0, 0, 100);
        const ov = pane.querySelector(`[data-cellopval="${i}"]`);
        if (ov) ov.textContent = s.bgOpacity;
        updatePreviewCell(pane, lang, i);
      } else if (field === 'text') {
        s.text = el.value.slice(0, 120);
        updatePreviewText(pane, lang, i);
      } else {
        s[field] = el.value; // Farben
        updatePreviewCell(pane, lang, i);
      }
    });
  });

  // Schriftart des Kachel-Textes.
  pane.querySelectorAll('[data-cellfont]').forEach((el) => {
    const i = Number(el.dataset.cellfont);
    el.addEventListener('change', () => {
      getCellStyle(lang, i).font = el.value;
      updatePreviewText(pane, lang, i);
    });
  });

  // Banner-Text + -Schriftart (Banner-Modus).
  pane.querySelectorAll('[data-bannerfield]').forEach((el) =>
    el.addEventListener('input', () => {
      state.media[lang].heroBannerText = el.value.slice(0, 120);
      updateBannerPreviewText(pane, lang);
    }),
  );
  pane.querySelectorAll('[data-bannerfont]').forEach((el) =>
    el.addEventListener('change', () => {
      state.media[lang].heroBannerFont = el.value;
      updateBannerPreviewText(pane, lang);
    }),
  );
}
