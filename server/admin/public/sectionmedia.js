// Medien-Tab: Sektions-Medien (Audio-/Bild-/Diverse-Tools) dreispaltig.
// Links: Design je Hell/Dunkel (Rahmen, Eckenradius, Deckkraft, Verdunkelung)
//        und Diashow (weitere Bilder – nur wenn das Medium ein Bild ist).
// Mitte: Sektionswahl, Sticky-Vorschau (Hell/Dunkel), Medium (Video ODER Bild:
//        Pfad/URL, Zwischenspeicher, Standard).
// Rechts: Text-Overlay (Text, Schrift, Farbe, Größe, Position, Deckkraft,
//        Schatten, Umriss) – in der Vorschau per Maus verschiebbar.
// Gespeichert in media.<lang>.sectionMedia[audio|image|diverse].

import { esc, toast } from './core.js';
import {
  state,
  getMediaVal,
  setMediaVal,
  defMediaVal,
  getSectionMedia,
  defaultSectionMediaSide,
  defaultSectionMediaText,
  defaultBannerSlideshow,
  SECTION_MEDIA_KEYS,
  SECTION_MEDIA_LABELS,
  BANNER_SLIDES_MAX,
  BANNER_TRANSITIONS,
  rgbaFromHex,
  getPageBg,
  PAGE_BG_DEFAULT,
  getPath,
  normMediaOffset,
  MEDIA_OFFSET_MAX,
  HERO_LAYOUT_COLS,
  visibleGridCells,
} from './model.js';
import { slider } from './slider.js';
import { colorPicker } from './color.js';
import { fontOptionsHtml } from './fonts.js';
import { objUrl, openMediaPicker } from './media.js';
import { dragHandle, overlayStyle, slideshowSettingsHtml, slideInfo, fontFF } from './layout.js';

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const MODE_LABEL = { light: '☀️ Hell', dark: '🌙 Dunkel' };
// Seitenhintergrund des Modus (wie im Tab „Hintergrund" gesetzt, sonst Standard der Seite).
function prevBg(mode) {
  return getPageBg(mode) || PAGE_BG_DEFAULT[mode];
}
const MODE_VIEW = { light: '☀️ Hell-Ansicht', dark: '🌙 Dunkel-Ansicht' };
const POS_PRESET_Y = { top: 10, center: 50, bottom: 90 };
const BASE_BORDER = '1.5px solid rgba(1,79,153,.2)';

// Gewählte Sektion + Vorschau-Modus (bleiben über Neu-Rendern erhalten).
let selected = 'audio';
let prevMode = 'light';
let slideTimer = null;

export function selectedSection() {
  return SECTION_MEDIA_KEYS.includes(selected) ? selected : 'audio';
}

// Aufgelöstes Medium der Sektion: { val, src, isVid, item } oder null.
function mediaInfo(lang, key) {
  const val = getMediaVal(lang, key);
  if (!val) return null;
  if (val.startsWith('staged:')) {
    const id = val.slice(7);
    const item = state.stagedItems.find((x) => x.id === id);
    if (!item) return null;
    return { val, src: objUrl(id), isVid: /^video\//.test(item.type), item };
  }
  return { val, src: val, isVid: /\.(mp4|webm|mov|m4v|ogv)$/i.test(val), item: null };
}

// Design eines Modus als Inline-CSS: Wrapper (Rahmen, Radius) + Medium (Deckkraft, Filter).
function designCss(lang, key, mode) {
  const s = getSectionMedia(lang, key).style[mode];
  const border = s.customBorder
    ? s.borderWidth > 0
      ? `${s.borderWidth}px solid ${s.borderColor}`
      : '0'
    : BASE_BORDER;
  return {
    wrap: `border:${border};border-radius:${s.borderRadius}px`,
    media: `opacity:${(s.opacity / 100).toFixed(2)};filter:${s.darken > 0 ? `brightness(${((100 - s.darken) / 100).toFixed(2)})` : 'none'}`,
  };
}
// Text-Overlay-Style (Vorschau) aus den Text-Feldern.
function textStyle(t) {
  const shadow = t.shadow
    ? `${t.shadowX}px ${t.shadowY}px ${t.shadowBlur}px ${rgbaFromHex(t.shadowColor || '#000000', 60)}`
    : 'none';
  const extra = [];
  if (t.strokeWidth > 0) extra.push(`-webkit-text-stroke:${t.strokeWidth}px ${t.strokeColor}`);
  if (t.opacity < 100) extra.push(`opacity:${(t.opacity / 100).toFixed(2)}`);
  return overlayStyle(
    t.color,
    t.size,
    t.x,
    t.y,
    t.font,
    '1.3rem',
    shadow,
    extra.length ? ';' + extra.join(';') : '',
  );
}

const MEDIA_BASE =
  'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block';

// --- Mitte ---
function previewHtml(lang, key) {
  const info = mediaInfo(lang, key);
  const css = designCss(lang, key, prevMode);
  const t = getSectionMedia(lang, key).text;
  let media;
  if (!info)
    media = `<div data-smmedia="box" style="${MEDIA_BASE};display:flex;align-items:center;justify-content:center;background:#1e293b"><span class="hint" style="margin:0">Kein Medium – unten zuweisen.</span></div>`;
  else if (info.isVid)
    media = `<video data-smmedia="media" src="${esc(info.src)}" muted loop autoplay playsinline style="${MEDIA_BASE};${css.media}"></video>`;
  else
    media = `<img data-smmedia="media" src="${esc(info.src)}" alt="" style="${MEDIA_BASE};${css.media}" />`;
  return `
    <div style="position:sticky;top:.5rem;z-index:5;background:var(--panel);border:1px solid var(--border);border-radius:10px;padding:.6rem .9rem;margin:0 0 .9rem;box-shadow:0 8px 22px rgba(0,0,0,.4)">
      <div style="display:flex;align-items:center;gap:.5rem;margin:.1rem 0 .35rem;flex-wrap:wrap">
        <span class="hint" style="margin:0">👁 Live-Vorschau (${SECTION_MEDIA_LABELS[key]}):</span>
        <span class="mode-switch" title="Vorschau im Hell- oder Dunkelmodus anzeigen">
          ${['light', 'dark'].map((md) => `<button type="button" class="hd-reset${md === prevMode ? ' active' : ''}" data-smprevmode="${md}" aria-pressed="${md === prevMode}">${MODE_LABEL[md]}</button>`).join('')}
        </span>
        <span class="hint" style="margin:0">– der andere Modus ist links zugeklappt.</span>
      </div>
      <div data-smprevbox data-prevmode="${prevMode}" style="position:relative;padding:1.6rem 1rem 1rem;border-radius:10px;background:${prevBg(prevMode)}">
        <span data-smprevlabel style="position:absolute;top:.35rem;left:.6rem;font-size:.72rem;font-weight:600;padding:.1rem .45rem;border-radius:999px;background:${prevMode === 'dark' ? 'rgba(255,255,255,.14)' : 'rgba(0,0,0,.08)'};color:${prevMode === 'dark' ? '#e2e8f0' : '#1e293b'}">${MODE_VIEW[prevMode]}</span>
        <div data-smwrap style="position:relative;max-width:520px;margin:0 auto;aspect-ratio:16 / 9;overflow:hidden;background:#000;box-sizing:border-box;${css.wrap}">
          ${media}
          <div data-smtext ${t.text ? 'title="Zum Verschieben ziehen"' : ''} style="${t.text ? textStyle(t) : ''}">${esc(t.text || '')}</div>
        </div>
      </div>
    </div>`;
}
function slotPanel(lang, key) {
  const info = mediaInfo(lang, key);
  const val = getMediaVal(lang, key);
  const staged = val.startsWith('staged:');
  let status;
  if (info && info.item)
    status = `<p class="st local" style="margin:.2rem 0 .4rem">● ${esc(info.item.name)} – lokal, wird beim Veröffentlichen hochgeladen.</p>`;
  else if (info)
    status = `<p class="st pub" data-slotstatus="${esc(val)}" style="margin:.2rem 0 .4rem">● ${esc(val)}</p>`;
  else status = `<p class="hint" style="margin:.2rem 0 .4rem">Kein Medium gewählt.</p>`;
  return `
    <div class="panel" data-smslotpanel>
      <h2 style="font-size:1rem;margin:0 0 .3rem">🎬 Medium: ${SECTION_MEDIA_LABELS[key]} Sektion</h2>
      <p class="hint">Video <strong>oder</strong> Bild – wird je nach Datei automatisch passend angezeigt. Bei einem Bild ist links zusätzlich eine Diashow möglich.</p>
      ${status}
      <label>Pfad/URL</label>
      <input data-smslot value="${esc(staged ? '' : val)}" placeholder="${esc(defMediaVal(key))}" ${staged ? 'disabled title="Lokales Medium – wird beim Veröffentlichen hochgeladen"' : ''} />
      <div class="row" style="margin-top:.5rem">
        <button type="button" data-smpick style="flex:0 0 auto">📁 Aus Zwischenspeicher wählen</button>
        <button type="button" data-smreset style="flex:0 0 auto">↺ Standard</button>
      </div>
    </div>`;
}
export function centerHtml(lang) {
  const key = selectedSection();
  const sel = `
    <div class="panel">
      <h2>Sektions-Medien <span class="lang-badge">${lang.toUpperCase()}</span></h2>
      <p class="hint">Video oder Bild über den drei Tool-Sektionen der ${lang === 'de' ? 'deutschen' : 'englischen'} Startseite.
        Links Design (Hell/Dunkel) und Diashow, rechts der Text über dem Medium.</p>
      <label>Sektion bearbeiten</label>
      <select data-smsel style="width:auto;min-width:240px">
        ${SECTION_MEDIA_KEYS.map((k) => `<option value="${k}" ${k === key ? 'selected' : ''}>${SECTION_MEDIA_LABELS[k]} Sektion${getSectionMedia(lang, k).text.text ? ' ✍️' : ''}${getSectionMedia(lang, k).slides.length ? ' 🎞️' : ''}</option>`).join('')}
      </select>
    </div>`;
  return sel + previewHtml(lang, key) + slotPanel(lang, key);
}

// --- Links: Design + Diashow ---
function designSection(lang, key, mode) {
  const s = getSectionMedia(lang, key).style[mode];
  const id = (f) => `sm:${mode}:${f}`;
  const attrs = (f) => `data-smstyle="${f}" data-mode="${mode}"`;
  const reset = (f) => `data-smstylereset="${f}" data-mode="${mode}"`;
  const resetBtn = (f) =>
    `<button type="button" class="hd-reset" ${reset(f)} title="Auf Standard zurücksetzen" aria-label="Auf Standard zurücksetzen">↺</button>`;
  const other = mode === 'light' ? 'dark' : 'light';
  // Nicht gewählter Modus: zu einer schmalen, klickbaren Leiste zugeklappt
  // (Klick/Enter/Leertaste zeigt ihn in Vorschau und Seitenleiste).
  if (mode !== prevMode)
    return `
    <div class="panel tc-mode-collapsed" data-smdesign="${mode}" data-smshowmode="${mode}" role="button" tabindex="0" title="${MODE_LABEL[mode]}-Modus anzeigen und bearbeiten">
      <span style="font-size:1.2rem">${mode === 'dark' ? '🌙' : '☀️'}</span>
      <span>${mode === 'dark' ? 'Dunkelmodus' : 'Hellmodus'} – anklicken zum Bearbeiten</span>
    </div>`;
  return `
    <div class="panel" data-smdesign="${mode}">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:.5rem;flex-wrap:wrap;margin-bottom:.4rem">
        <strong data-smshowmode="${mode}" style="padding:.1rem .4rem;border-radius:6px;outline:2px solid var(--accent)">${MODE_LABEL[mode]} <span class="hint" style="margin:0;font-weight:400">👁</span></strong>
        <span style="display:inline-flex;gap:.3rem">
          <button type="button" class="hd-reset" data-smcopyside="${mode}" title="Diese Werte in den ${MODE_LABEL[other]}-Modus kopieren">→ ${other === 'dark' ? 'Dunkel' : 'Hell'} kopieren</button>
          <button type="button" class="hd-reset" data-smapplyall="${mode}" title="Dieses ${MODE_LABEL[mode]}-Design als Standard für alle drei Sektionen übernehmen (Audio, Bild, Diverse)">★ Für alle Sektionen</button>
          <button type="button" class="hd-reset" data-smresetall data-mode="${mode}" title="Design dieses Modus auf Standard zurücksetzen">↺ Alles</button>
        </span>
      </div>
      <label style="display:flex;align-items:center;gap:.4rem;color:var(--text);cursor:pointer;margin:.2rem 0 .4rem">
        <input type="checkbox" ${attrs('customBorder')} ${s.customBorder ? 'checked' : ''} style="width:auto" /> Eigener Umriss (aus = Standard-Rahmen)
      </label>
      <label>Umriss-Farbe</label>
      ${colorPicker({ id: id('borderColor'), attrs: attrs('borderColor'), value: s.borderColor, disabled: !s.customBorder, resetHtml: resetBtn('borderColor') })}
      <div style="margin-top:.5rem">
        ${slider({ id: id('borderWidth'), label: 'Umriss-Dicke (0 = kein Rahmen)', unit: 'px', min: 0, max: 20, value: s.borderWidth, attrs: attrs('borderWidth'), resetAttrs: reset('borderWidth'), disabled: !s.customBorder })}
      </div>
      <div style="margin-top:.5rem">
        ${slider({ id: id('borderRadius'), label: 'Eckenradius', unit: 'px', min: 0, max: 80, value: s.borderRadius, attrs: attrs('borderRadius'), resetAttrs: reset('borderRadius') })}
      </div>
      <div style="border-top:1px solid var(--border);margin:.7rem 0 .5rem"></div>
      <div style="margin-top:.3rem">
        ${slider({ id: id('opacity'), label: 'Deckkraft', unit: '%', min: 0, max: 100, value: s.opacity, attrs: attrs('opacity'), resetAttrs: reset('opacity') })}
      </div>
      <div style="margin-top:.5rem">
        ${slider({ id: id('darken'), label: 'Verdunkelung', unit: '%', min: 0, max: 100, value: s.darken, attrs: attrs('darken'), resetAttrs: reset('darken') })}
      </div>
    </div>`;
}
function slidesPanel(lang, key) {
  const cfg = getSectionMedia(lang, key);
  const info = mediaInfo(lang, key);
  if (info && info.isVid)
    return `
    <div class="panel" data-smslidesblock>
      <h2 style="font-size:1rem;margin:0 0 .3rem">🎞️ Diashow</h2>
      <p class="hint" style="margin:0">Das Medium dieser Sektion ist ein <strong>Video</strong> – die Diashow gilt nur für Bilder. Video bleibt wie bisher möglich.</p>
      ${cfg.slides.length ? `<p class="hint" style="margin:.4rem 0 0">${cfg.slides.length} weitere Bild(er) sind hinterlegt und werden bei einem Bild-Medium wieder verwendet.</p>` : ''}
    </div>`;
  const slides = cfg.slides;
  const full = slides.length >= BANNER_SLIDES_MAX;
  const rows = slides
    .map((val, i) => {
      const s = slideInfo(val);
      const thumb = s
        ? `<img src="${esc(s.src)}" alt="" />`
        : '<span class="hint" style="margin:0">?</span>';
      const title = s && s.item ? `${s.item.name} – lokal` : val;
      return `
        <div class="row" data-smsliderow="${i}" style="align-items:center;gap:.35rem;margin:.3rem 0">
          <span class="hint" style="margin:0;flex:0 0 1.6rem;text-align:right">${i + 2}.</span>
          <div class="bg-thumb" data-smslidethumb="${i}" style="width:72px;height:40px" title="${esc(title)}">${thumb}</div>
          <span style="display:inline-flex;gap:.2rem;flex:0 0 auto;margin-left:auto">
            <button type="button" class="hd-reset" data-smslideup="${i}" ${i === 0 ? 'disabled' : ''} title="Nach vorn">↑</button>
            <button type="button" class="hd-reset" data-smslidedown="${i}" ${i === slides.length - 1 ? 'disabled' : ''} title="Nach hinten">↓</button>
            <button type="button" class="hd-reset danger" data-smslideremove="${i}" title="Entfernen">✕</button>
          </span>
        </div>`;
    })
    .join('');
  return `
    <div class="panel" data-smslidesblock>
      <h2 style="font-size:1rem;margin:0 0 .3rem">🎞️ Diashow – weitere Bilder</h2>
      <p class="hint">Wechseln sich mit dem Sektions-Bild ab (Format 16:9 empfohlen). Bis zu ${BANNER_SLIDES_MAX} weitere Bilder.</p>
      <div data-smslidelist>${rows || '<p class="hint" style="margin:.3rem 0">Noch keine weiteren Bilder – das Bild bleibt statisch.</p>'}</div>
      <div class="row" style="margin-top:.5rem">
        <button type="button" class="hd-reset" data-smslideadd ${full ? 'disabled' : ''}>📂 Aus Zwischenspeicher anhängen</button>
        ${slides.length ? '<button type="button" class="hd-reset danger" data-smslideclear>Alle entfernen</button>' : ''}
      </div>
      ${slideshowSettingsHtml(cfg.slideshow, 'smslideshow', !slides.length, false)}
    </div>`;
}
export function leftHtml(lang) {
  const key = selectedSection();
  const otherLang = lang === 'de' ? 'en' : 'de';
  const otherLabel = otherLang === 'de' ? 'Deutsch' : 'English';
  return `
    <aside class="tc-side" data-tcside="left">
      <div class="tc-side-head left">🖼️ Design &amp; Diashow – ${SECTION_MEDIA_LABELS[key]}</div>
      <p class="hint">Umriss, Eckenradius, Deckkraft und Verdunkelung des Sektions-Mediums, getrennt für <strong>Hell</strong> und <strong>Dunkel</strong>;
        der Umschalter über der Vorschau (oder die zugeklappte Leiste hier) wählt den bearbeiteten Modus, der andere ist zugeklappt.
        Darunter die Diashow (nur bei Bildern).</p>
      <div class="panel" style="display:flex;flex-wrap:wrap;gap:.4rem;align-items:center">
        <button type="button" class="hd-reset" data-smcopylang="${otherLang}" style="white-space:normal;text-align:left;flex:1 1 auto;min-width:0;max-width:100%" title="Design (Hell + Dunkel), Diashow-Einstellungen und Text-Design dieser Sektion in die andere Sprache übernehmen – Medium, Bilder und Text bleiben">📋 Sektions-Design nach ${otherLabel} übertragen<br /><span class="hint" style="margin:0">(Hell + Dunkel, Diashow-Takt, Text-Design – Medium, Bilder und Text bleiben je Sprache)</span></button>
      </div>
      ${designSection(lang, key, 'light')}
      ${designSection(lang, key, 'dark')}
      ${slidesPanel(lang, key)}
    </aside>`;
}

// --- Rechts: Text-Overlay ---
export function rightHtml(lang) {
  const key = selectedSection();
  const t = getSectionMedia(lang, key).text;
  const rb = (f) =>
    `<button type="button" class="hd-reset" data-smtextreset="${f}" title="Auf Standard zurücksetzen" aria-label="Auf Standard zurücksetzen">↺</button>`;
  const wr = (html, f) =>
    `<div style="display:flex;gap:.3rem;align-items:center">${html}${rb(f)}</div>`;
  return `
    <aside class="tc-side" data-tcside="right">
      <div class="tc-side-head right">✍️ Text – ${SECTION_MEDIA_LABELS[key]}</div>
      <p class="hint">Optionaler Text über dem Sektions-Medium: Schriftart (aus <code>/fonts</code>), Farbe, Größe, Position
        (in der Vorschau mit der Maus ziehen), Deckkraft, Schatten und Umriss. Leer = kein Text.</p>
      <div class="panel">
        <label>Text</label>
        ${wr(`<input data-smtext="text" value="${esc(t.text)}" placeholder="z.B. Neu" maxlength="200" style="${fontFF(t.font)}" />`, 'text')}
        <label style="margin-top:.5rem">Schriftart</label>
        ${wr(`<select data-smtextfont style="${fontFF(t.font)}">${fontOptionsHtml(t.font)}</select>`, 'font')}
        <div class="row" style="align-items:flex-end;margin-top:.5rem">
          <div style="flex:0 0 auto">
            <label>Textfarbe</label>
            ${colorPicker({ id: 'sm:text:color', attrs: 'data-smtext="color"', value: t.color, resetHtml: rb('color') })}
          </div>
          <div style="flex:0 0 auto">
            <label>Größe (px, 0=auto)</label>
            ${wr(`<input type="number" data-smtext="size" min="0" max="96" step="1" value="${t.size}" style="width:110px" />`, 'size')}
          </div>
        </div>
        <label style="margin-top:.5rem">Position <span style="color:var(--muted);font-weight:400">— in der Vorschau ziehen</span></label>
        <div style="display:flex;gap:.3rem;align-items:center;flex-wrap:wrap">
          <button type="button" class="hd-reset" data-smtextpos="top" title="Oben">⤒</button>
          <button type="button" class="hd-reset" data-smtextpos="center" title="Mitte">◎</button>
          <button type="button" class="hd-reset" data-smtextpos="bottom" title="Unten">⤓</button>
          <span class="hint" data-smposval style="margin:0 .2rem">${t.x} / ${t.y} %</span>
          ${rb('pos')}
        </div>
        <div style="margin-top:.5rem">
          ${slider({ id: 'sm:text:opacity', label: 'Deckkraft', unit: '%', min: 0, max: 100, value: t.opacity, attrs: 'data-smtext="opacity"', resetAttrs: 'data-smtextreset="opacity"' })}
        </div>
      </div>
      <div class="panel">
        <strong>Schatten</strong>
        <label style="display:flex;align-items:center;gap:.4rem;color:var(--text);cursor:pointer;margin:.4rem 0">
          <input type="checkbox" data-smtext="shadow" ${t.shadow ? 'checked' : ''} style="width:auto" /> Textschatten anzeigen
        </label>
        <label>Schattenfarbe</label>
        ${colorPicker({ id: 'sm:text:shadowColor', attrs: 'data-smtext="shadowColor"', value: t.shadowColor, resetHtml: rb('shadowColor') })}
        <div class="row" style="align-items:flex-end;margin-top:.4rem">
          <div style="flex:0 0 auto">
            <label>Versatz X (px)</label>
            ${wr(`<input type="number" data-smtext="shadowX" min="-50" max="50" step="1" value="${t.shadowX}" style="width:100px" />`, 'shadowX')}
          </div>
          <div style="flex:0 0 auto">
            <label>Versatz Y (px)</label>
            ${wr(`<input type="number" data-smtext="shadowY" min="-50" max="50" step="1" value="${t.shadowY}" style="width:100px" />`, 'shadowY')}
          </div>
        </div>
        <div style="margin-top:.5rem">
          ${slider({ id: 'sm:text:shadowBlur', label: 'Weichzeichnung', unit: 'px', min: 0, max: 40, value: t.shadowBlur, attrs: 'data-smtext="shadowBlur"', resetAttrs: 'data-smtextreset="shadowBlur"' })}
        </div>
      </div>
      <div class="panel">
        <strong>Umriss</strong>
        <label style="margin-top:.4rem">Umriss-Farbe</label>
        ${colorPicker({ id: 'sm:text:strokeColor', attrs: 'data-smtext="strokeColor"', value: t.strokeColor, resetHtml: rb('strokeColor') })}
        <label style="margin-top:.5rem">Umriss-Dicke (px, 0=aus)</label>
        ${wr(`<input type="number" data-smtext="strokeWidth" min="0" max="10" step="0.5" value="${t.strokeWidth}" style="width:120px" />`, 'strokeWidth')}
      </div>
    </aside>`;
}

// --- Live-Updates der Vorschau ---
function setPrevMode(pane, lang, mode) {
  prevMode = mode === 'dark' ? 'dark' : 'light';
  const box = pane.querySelector('[data-smprevbox]');
  if (box) {
    box.dataset.prevmode = prevMode;
    box.style.background = prevBg(prevMode);
  }
  const label = pane.querySelector('[data-smprevlabel]');
  if (label) {
    label.textContent = MODE_VIEW[prevMode];
    label.style.background = prevMode === 'dark' ? 'rgba(255,255,255,.14)' : 'rgba(0,0,0,.08)';
    label.style.color = prevMode === 'dark' ? '#e2e8f0' : '#1e293b';
  }
  pane.querySelectorAll('[data-smprevmode]').forEach((b) => {
    const on = b.dataset.smprevmode === prevMode;
    b.setAttribute('aria-pressed', String(on));
    b.classList.toggle('active', on);
  });
  // Abschnitts-Köpfe in der Seitenleiste markieren, welcher Modus gerade gezeigt wird.
  pane.querySelectorAll('[data-smshowmode]').forEach((h) => {
    h.style.outline = h.dataset.smshowmode === prevMode ? '2px solid var(--accent)' : '';
  });
  updatePreviewDesign(pane, lang);
}
function updatePreviewDesign(pane, lang) {
  const key = selectedSection();
  const css = designCss(lang, key, prevMode);
  const wrap = pane.querySelector('[data-smwrap]');
  if (wrap)
    wrap.setAttribute(
      'style',
      `position:relative;max-width:520px;margin:0 auto;aspect-ratio:16 / 9;overflow:hidden;background:#000;box-sizing:border-box;${css.wrap}`,
    );
  const media = pane.querySelector('[data-smmedia="media"]');
  if (media) media.setAttribute('style', `${MEDIA_BASE};${css.media}`);
}
function updatePreviewText(pane, lang) {
  const t = getSectionMedia(lang, selectedSection()).text;
  const el = pane.querySelector('[data-smtext]');
  if (!el) return;
  el.textContent = t.text || '';
  el.setAttribute('style', t.text ? textStyle(t) : '');
  if (t.text) el.setAttribute('title', 'Zum Verschieben ziehen');
  const pv = pane.querySelector('[data-smposval]');
  if (pv) pv.textContent = `${t.x} / ${t.y} %`;
}
function stopSlideshow() {
  if (slideTimer !== null) clearInterval(slideTimer);
  slideTimer = null;
}
function startSlideshow(pane, lang) {
  stopSlideshow();
  const key = selectedSection();
  const el = pane.querySelector('[data-smmedia="media"]');
  if (!el || el.tagName !== 'IMG') return;
  const main = mediaInfo(lang, key);
  const cfg = getSectionMedia(lang, key);
  const srcs = [main ? main.src : '', ...cfg.slides.map((v) => slideInfo(v)?.src || '')].filter(
    Boolean,
  );
  if (srcs.length < 2) return;
  let cur = 0;
  slideTimer = setInterval(
    () => {
      if (!el.isConnected) {
        stopSlideshow();
        return;
      }
      cur = (cur + 1) % srcs.length;
      el.setAttribute('src', srcs[cur]);
      pane.querySelectorAll('[data-smslidethumb]').forEach((t) => {
        t.style.outline =
          Number(t.dataset.smslidethumb) === cur - 1 ? '2px solid var(--accent)' : '';
      });
    },
    Math.max(1, cfg.slideshow.interval) * 1000,
  );
}

// --- Verdrahtung (nach dem Rendern des Medien-Tabs) ---
export function bindSectionMedia(pane, lang, rerender) {
  stopSlideshow();
  const key = selectedSection();
  const cfg = getSectionMedia(lang, key);
  const rr = () => rerender();
  bindFullPage(pane, lang, rr);

  pane.querySelector('[data-smsel]')?.addEventListener('change', (e) => {
    selected = SECTION_MEDIA_KEYS.includes(e.target.value) ? e.target.value : 'audio';
    rr();
  });
  // Hell/Dunkel wählen: bei einem Wechsel neu rendern (Seitenleiste zeigt den
  // gewählten Modus offen, den anderen zugeklappt; Sichtzustand bleibt erhalten),
  // sonst nur die Vorschau auffrischen.
  const showMode = (mode) => {
    const next = mode === 'dark' ? 'dark' : 'light';
    if (next === prevMode) {
      setPrevMode(pane, lang, next);
      return;
    }
    prevMode = next;
    rr();
  };
  pane
    .querySelectorAll('[data-smprevmode]')
    .forEach((el) => el.addEventListener('click', () => showMode(el.dataset.smprevmode)));
  pane.querySelectorAll('[data-smshowmode]').forEach((el) => {
    el.addEventListener('click', () => showMode(el.dataset.smshowmode));
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        showMode(el.dataset.smshowmode);
      }
    });
  });

  // Medium-Slot (Video oder Bild).
  pane.querySelectorAll('[data-smslot]').forEach((el) => {
    el.addEventListener('input', () => setMediaVal(lang, key, el.value.trim() || defMediaVal(key)));
    el.addEventListener('change', rr);
  });
  pane.querySelector('[data-smpick]')?.addEventListener('click', () => {
    const srv = [lang, 'shared'].reduce((n, l) => n + (state.serverFiles[l] || []).length, 0);
    if (!state.stagedItems.length && !srv) {
      toast('Keine Medien vorhanden — zuerst im Tab „Dateien" eine Datei hinzufügen.');
      return;
    }
    openMediaPicker(lang, key, {
      title: `Medium für die ${SECTION_MEDIA_LABELS[key]} Sektion wählen`,
      onPick: (url) => {
        setMediaVal(lang, key, url);
        rr();
        toast('Medium zugewiesen');
      },
    });
  });
  pane.querySelector('[data-smreset]')?.addEventListener('click', () => {
    setMediaVal(lang, key, defMediaVal(key));
    rr();
  });

  // Design je Modus.
  pane.querySelectorAll('[data-smstyle]').forEach((el) =>
    el.addEventListener('input', () => {
      const f = el.dataset.smstyle;
      const mode = el.dataset.mode === 'dark' ? 'dark' : 'light';
      const s = cfg.style[mode];
      if (f === 'customBorder') {
        s.customBorder = el.checked;
        prevMode = mode;
        rr(); // Felder sperren/freigeben
        return;
      }
      if (f === 'borderColor') s.borderColor = el.value;
      else if (f === 'borderWidth') s.borderWidth = clamp(parseInt(el.value, 10) || 0, 0, 20);
      else if (f === 'borderRadius') s.borderRadius = clamp(parseInt(el.value, 10) || 0, 0, 80);
      else if (f === 'opacity') s.opacity = clamp(parseInt(el.value, 10) || 0, 0, 100);
      else if (f === 'darken') s.darken = clamp(parseInt(el.value, 10) || 0, 0, 100);
      if (prevMode !== mode) setPrevMode(pane, lang, mode);
      else updatePreviewDesign(pane, lang);
    }),
  );
  pane.querySelectorAll('[data-smstylereset]').forEach((el) =>
    el.addEventListener('click', () => {
      const f = el.dataset.smstylereset;
      const mode = el.dataset.mode === 'dark' ? 'dark' : 'light';
      const d = defaultSectionMediaSide();
      if (f in d) cfg.style[mode][f] = d[f];
      prevMode = mode;
      rr();
    }),
  );
  pane.querySelectorAll('[data-smresetall]').forEach((el) =>
    el.addEventListener('click', () => {
      const mode = el.dataset.mode === 'dark' ? 'dark' : 'light';
      if (!confirm(`Design (${MODE_LABEL[mode]}) der Sektion auf Standard zurücksetzen?`)) return;
      cfg.style[mode] = defaultSectionMediaSide();
      prevMode = mode;
      rr();
      toast('Design zurückgesetzt');
    }),
  );
  pane.querySelectorAll('[data-smcopyside]').forEach((el) =>
    el.addEventListener('click', () => {
      const from = el.dataset.smcopyside === 'dark' ? 'dark' : 'light';
      const to = from === 'dark' ? 'light' : 'dark';
      cfg.style[to] = { ...cfg.style[from] };
      prevMode = to;
      rr();
      toast(`Design nach ${MODE_LABEL[to]} kopiert`);
    }),
  );
  // Design eines Modus als Standard für alle drei Sektionen übernehmen.
  pane.querySelectorAll('[data-smapplyall]').forEach((el) =>
    el.addEventListener('click', () => {
      const mode = el.dataset.smapplyall === 'dark' ? 'dark' : 'light';
      const others = SECTION_MEDIA_KEYS.filter((k) => k !== key);
      if (
        !confirm(
          `${MODE_LABEL[mode]}-Design von „${SECTION_MEDIA_LABELS[key]}" für alle Sektionen übernehmen? Das ${MODE_LABEL[mode]}-Design von ${others.map((k) => SECTION_MEDIA_LABELS[k]).join(' und ')} wird ersetzt.`,
        )
      )
        return;
      for (const k of others) getSectionMedia(lang, k).style[mode] = { ...cfg.style[mode] };
      prevMode = mode;
      rr();
      toast(`${MODE_LABEL[mode]}-Design gilt jetzt für alle Sektionen`);
    }),
  );
  pane.querySelectorAll('[data-smcopylang]').forEach((el) =>
    el.addEventListener('click', () => {
      const to = el.dataset.smcopylang === 'en' ? 'en' : 'de';
      const label = to === 'de' ? 'Deutsch' : 'English';
      if (
        !confirm(
          `Design (Hell + Dunkel), Diashow-Einstellungen und Text-Design der Sektion „${SECTION_MEDIA_LABELS[key]}" nach ${label} übertragen? Medium, Bilder und Text bleiben.`,
        )
      )
        return;
      const dst = getSectionMedia(to, key);
      dst.style = { light: { ...cfg.style.light }, dark: { ...cfg.style.dark } };
      dst.slideshow = { ...cfg.slideshow };
      dst.text = { ...cfg.text, text: dst.text.text };
      toast(`Sektions-Design nach ${label} übertragen`);
    }),
  );

  // Diashow.
  pane.querySelector('[data-smslideadd]')?.addEventListener('click', () => {
    const srv = [lang, 'shared'].reduce((n, l) => n + (state.serverFiles[l] || []).length, 0);
    if (!state.stagedItems.length && !srv) {
      toast('Keine Bilder vorhanden — zuerst im Tab „Dateien" hinzufügen.');
      return;
    }
    openMediaPicker(lang, 'sectionSlide', {
      title: `Weiteres Bild für die ${SECTION_MEDIA_LABELS[key]} Sektion wählen`,
      imagesOnly: true,
      onPick: (url) => {
        if (cfg.slides.length >= BANNER_SLIDES_MAX) {
          toast(`Maximal ${BANNER_SLIDES_MAX} weitere Bilder`);
          return;
        }
        cfg.slides.push(url);
        rr();
        toast('Bild an die Diashow angehängt');
      },
    });
  });
  pane.querySelectorAll('[data-smslideremove]').forEach((el) =>
    el.addEventListener('click', () => {
      cfg.slides.splice(Number(el.dataset.smslideremove), 1);
      rr();
    }),
  );
  pane.querySelector('[data-smslideclear]')?.addEventListener('click', () => {
    if (!confirm('Alle weiteren Bilder aus der Diashow entfernen?')) return;
    cfg.slides.length = 0;
    rr();
  });
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= cfg.slides.length) return;
    [cfg.slides[i], cfg.slides[j]] = [cfg.slides[j], cfg.slides[i]];
    rr();
  };
  pane
    .querySelectorAll('[data-smslideup]')
    .forEach((el) => el.addEventListener('click', () => move(Number(el.dataset.smslideup), -1)));
  pane
    .querySelectorAll('[data-smslidedown]')
    .forEach((el) => el.addEventListener('click', () => move(Number(el.dataset.smslidedown), 1)));
  pane.querySelectorAll('[data-smslideshow]').forEach((el) => {
    const f = el.dataset.smslideshow;
    el.addEventListener(
      el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input',
      () => {
        const ss = cfg.slideshow;
        if (f === 'interval') {
          const n = parseInt(el.value, 10);
          ss.interval = clamp(Number.isFinite(n) ? n : 5, 1, 30);
          startSlideshow(pane, lang);
        } else if (f === 'duration') {
          const n = parseInt(el.value, 10);
          ss.duration = clamp(Number.isFinite(n) ? n : 800, 0, 5000);
        } else if (f === 'transition')
          ss.transition = BANNER_TRANSITIONS.includes(el.value) ? el.value : 'fade';
        else if (f === 'pauseOnHover') ss.pauseOnHover = el.checked;
        else if (f === 'dots') ss.dots = el.checked;
      },
    );
  });
  pane.querySelectorAll('[data-smslideshowreset]').forEach((el) =>
    el.addEventListener('click', () => {
      const f = el.dataset.smslideshowreset;
      const d = defaultBannerSlideshow();
      if (f in d) cfg.slideshow[f] = d[f];
      rr();
    }),
  );

  // Text-Overlay.
  pane.querySelectorAll('[data-smtext]').forEach((el) => {
    if (!el.dataset.smtext) return; // das Vorschau-Element selbst trägt data-smtext ohne Wert
    const f = el.dataset.smtext;
    el.addEventListener('input', () => {
      const t = cfg.text;
      if (f === 'text') t.text = el.value.slice(0, 200);
      else if (f === 'color' || f === 'shadowColor' || f === 'strokeColor') t[f] = el.value;
      else if (f === 'size') t.size = clamp(parseInt(el.value, 10) || 0, 0, 96);
      else if (f === 'opacity') t.opacity = clamp(parseInt(el.value, 10) || 0, 0, 100);
      else if (f === 'shadow') t.shadow = el.checked;
      else if (f === 'shadowX') t.shadowX = clamp(parseInt(el.value, 10) || 0, -50, 50);
      else if (f === 'shadowY') t.shadowY = clamp(parseInt(el.value, 10) || 0, -50, 50);
      else if (f === 'shadowBlur') t.shadowBlur = clamp(parseInt(el.value, 10) || 0, 0, 40);
      else if (f === 'strokeWidth')
        t.strokeWidth = clamp(Math.round((Number(el.value) || 0) * 2) / 2, 0, 10);
      updatePreviewText(pane, lang);
      wireTextDrag(pane, lang);
    });
  });
  pane.querySelector('[data-smtextfont]')?.addEventListener('change', (e) => {
    cfg.text.font = e.target.value;
    const ff = fontFF(e.target.value);
    e.target.setAttribute('style', ff);
    const inp = pane.querySelector('[data-smtext="text"]');
    if (inp) inp.setAttribute('style', ff);
    updatePreviewText(pane, lang);
  });
  pane.querySelectorAll('[data-smtextpos]').forEach((el) =>
    el.addEventListener('click', () => {
      cfg.text.x = 50;
      cfg.text.y = POS_PRESET_Y[el.dataset.smtextpos] ?? 50;
      updatePreviewText(pane, lang);
    }),
  );
  pane.querySelectorAll('[data-smtextreset]').forEach((el) =>
    el.addEventListener('click', () => {
      const f = el.dataset.smtextreset;
      const d = defaultSectionMediaText();
      if (f === 'pos') {
        cfg.text.x = d.x;
        cfg.text.y = d.y;
      } else if (f in d) cfg.text[f] = d[f];
      rr();
    }),
  );
  wireTextDrag(pane, lang);
  startSlideshow(pane, lang);
}
let dragWired = null;
function wireTextDrag(pane, lang) {
  const handle = pane.querySelector('div[data-smtext]');
  if (!handle || dragWired === handle) return;
  dragWired = handle;
  const cfg = getSectionMedia(lang, selectedSection());
  dragHandle(handle, pane.querySelector('[data-smwrap]'), (x, y) => {
    cfg.text.x = x;
    cfg.text.y = y;
    updatePreviewText(pane, lang);
  });
}

// --- Ganze Seite: schematische Vorschau der Startseite, in der das Hero-Medium
// (Banner/Raster) und die drei Sektions-Medien per Maus verschoben werden. Der
// Versatz (px) wirkt auf der Seite als relative Position – der Platz im Fluss
// bleibt. Die Seite wird in Originalbreite (1200 px) aufgebaut und per CSS
// `zoom` in die Spalte eingepasst; Mausbewegungen werden durch den Zoom geteilt.
const PAGE_W = 1200;
const FULL_KEYS = ['hero', ...SECTION_MEDIA_KEYS];
const FULL_LABELS = {
  hero: 'Hero-Medium (Banner/Raster)',
  audio: 'Medium Audio-Tools',
  image: 'Medium Bild-Tools',
  diverse: 'Medium Diverse Tools',
};
const FULL_TEXT = {
  light: { title: '#003971', text: '#1e293b', muted: '#64748b', card: 'rgba(1,79,153,.08)' },
  dark: { title: '#f9f2d5', text: '#e2e8f0', muted: '#94a3b8', card: 'rgba(255,255,255,.06)' },
};
function fullOffset(lang, key) {
  if (key === 'hero') {
    const m = state.media[lang];
    return { x: m.heroMediaOffsetX || 0, y: m.heroMediaOffsetY || 0 };
  }
  const c = getSectionMedia(lang, key);
  return { x: c.offsetX || 0, y: c.offsetY || 0 };
}
function setFullOffset(lang, key, x, y) {
  const nx = normMediaOffset(x, 'x');
  const ny = normMediaOffset(y, 'y');
  if (key === 'hero') {
    state.media[lang].heroMediaOffsetX = nx;
    state.media[lang].heroMediaOffsetY = ny;
  } else {
    const c = getSectionMedia(lang, key);
    c.offsetX = nx;
    c.offsetY = ny;
  }
  return { x: nx, y: ny };
}
const fullMoveCss = (o) =>
  `position:relative;left:${o.x}px;top:${o.y}px;cursor:move;touch-action:none;user-select:none`;
// Hero-Medium der Vorschau: Banner (Bild/Video) oder Kachel-Raster (Anordnung,
// ausgeblendete Kacheln entfallen) – wie im Tab „Layout“ eingestellt.
function fullHeroMediaHtml(lang, mode) {
  const m = state.media[lang];
  const c = FULL_TEXT[mode];
  if (m.heroMode === 'grid') {
    const layout = m.heroLayout;
    const cells = visibleGridCells(lang, layout);
    const cols = Math.min(HERO_LAYOUT_COLS[layout] || 3, Math.max(1, cells.length));
    const maxW = layout === 'row4' ? 860 : layout === 'big2' ? 900 : layout === 'vrow' ? 420 : 720;
    const tiles = cells
      .map((i) => {
        const info = mediaInfo(lang, `grid${i}`);
        const inner = info
          ? info.isVid
            ? `<video src="${esc(info.src)}" muted playsinline preload="metadata" style="${MEDIA_BASE}"></video>`
            : `<img src="${esc(info.src)}" alt="" style="${MEDIA_BASE}" />`
          : `<span style="color:${c.muted};font-size:14px">Kachel ${i + 1}</span>`;
        return `<div style="position:relative;aspect-ratio:1 / 1;border-radius:14px;overflow:hidden;background:${c.card};display:flex;align-items:center;justify-content:center">${inner}</div>`;
      })
      .join('');
    return `<div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:16px;width:100%;max-width:${maxW}px;margin:0 auto">${tiles || `<span style="color:${c.muted}">Alle Kacheln ausgeblendet</span>`}</div>`;
  }
  if (m.heroBannerShow === false)
    return `<div style="color:${c.muted};font-size:14px;padding:12px">Banner ausgeblendet (Tab „Layout“)</div>`;
  const info = mediaInfo(lang, 'heroBanner');
  if (!info)
    return `<div style="color:${c.muted};font-size:14px;padding:12px">Kein Hero-Medium</div>`;
  const st =
    'display:block;max-width:min(100%,900px);max-height:240px;width:auto;height:auto;object-fit:contain;border-radius:14px';
  return info.isVid
    ? `<video src="${esc(info.src)}" muted playsinline preload="metadata" style="${st}"></video>`
    : `<img src="${esc(info.src)}" alt="" style="${st}" />`;
}
// Sektion der Vorschau: Überschrift, verschiebbares Medium, Karten-Platzhalter.
function fullSectionHtml(lang, key, mode) {
  const c = FULL_TEXT[mode];
  const titlePath = { audio: 'tools', image: 'imageTools', diverse: 'diverseTools' }[key];
  const title =
    getPath(state.overrides[lang], [titlePath, 'sectionTitle']) ||
    getPath(state.defaults[lang], [titlePath, 'sectionTitle']) ||
    SECTION_MEDIA_LABELS[key];
  const info = mediaInfo(lang, key);
  const css = designCss(lang, key, mode);
  const t = getSectionMedia(lang, key).text;
  const media = !info
    ? `<div style="${MEDIA_BASE};display:flex;align-items:center;justify-content:center;background:#1e293b"><span style="color:#94a3b8;font-size:14px">Kein Medium</span></div>`
    : info.isVid
      ? `<video src="${esc(info.src)}" muted playsinline preload="metadata" style="${MEDIA_BASE};${css.media}"></video>`
      : `<img src="${esc(info.src)}" alt="" style="${MEDIA_BASE};${css.media}" />`;
  const sel = key === selectedSection();
  const cards = Array.from(
    { length: 6 },
    () => `<div style="height:120px;border-radius:16px;background:${c.card}"></div>`,
  ).join('');
  return `
    <section data-smfullsection="${key}" style="max-width:${PAGE_W}px;margin:0 auto;padding:80px 32px;box-sizing:border-box">
      <h2 style="text-align:center;font-size:40px;font-weight:600;letter-spacing:.04em;line-height:1.2;margin:0 0 40px;color:${c.title}">${esc(title)}</h2>
      <div data-smfullmedia="${key}" role="button" tabindex="0" title="Ziehen: verschieben (Pfeiltasten: 1 px, Shift 10 px) · Klick: Sektion bearbeiten" style="width:100%;max-width:720px;margin:0 auto 24px;aspect-ratio:16 / 9;overflow:hidden;box-sizing:border-box;background:#000;${css.wrap};${fullMoveCss(fullOffset(lang, key))}${sel ? ';outline:3px solid var(--accent);outline-offset:2px' : ''}">
        ${media}
        <div style="${t.text ? textStyle(t) : ''}">${esc(t.text || '')}</div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px">${cards}</div>
    </section>`;
}
// Felder „Verschiebung X / Y“ je Medium (folgen dem Ziehen live).
function fullFieldsHtml(lang) {
  return FULL_KEYS.map((key) => {
    const o = fullOffset(lang, key);
    return `<div data-smoffrow="${key}" style="display:flex;align-items:center;gap:.3rem;flex-wrap:wrap">
        <span style="min-width:190px;font-size:.85rem;color:var(--text)">${FULL_LABELS[key]}</span>
        <input type="number" data-smoff="${key}:x" min="-${MEDIA_OFFSET_MAX.x}" max="${MEDIA_OFFSET_MAX.x}" step="1" value="${o.x}" style="width:80px" title="Waagerecht (px): − links, + rechts" />
        <input type="number" data-smoff="${key}:y" min="-${MEDIA_OFFSET_MAX.y}" max="${MEDIA_OFFSET_MAX.y}" step="1" value="${o.y}" style="width:80px" title="Senkrecht (px): − oben, + unten" />
        <button type="button" class="hd-reset" data-smoffreset="${key}" title="Verschiebung zurücksetzen (0/0)" aria-label="Verschiebung zurücksetzen">↺</button>
      </div>`;
  }).join('');
}
export function fullPageHtml(lang) {
  const mode = prevMode;
  const c = FULL_TEXT[mode];
  const m = state.media[lang];
  const heroTitle =
    getPath(state.overrides[lang], ['hero', 'title']) ||
    getPath(state.defaults[lang], ['hero', 'title']) ||
    '';
  const heroSub =
    getPath(state.overrides[lang], ['hero', 'subtitle']) ||
    getPath(state.defaults[lang], ['hero', 'subtitle']) ||
    '';
  const feats = getPath(state.defaults[lang], ['hero', 'features']);
  const chips = (feats && typeof feats === 'object' ? Object.values(feats) : [])
    .slice(0, 6)
    .map(
      (label) =>
        `<div style="padding:13.6px 8px;border-radius:12px;background:${c.card};font-size:15.2px;font-weight:600;text-align:center;color:${c.title}">${esc(String(label))}</div>`,
    )
    .join('');
  const heroBg = mode === 'dark' ? 'rgba(14,28,50,.8)' : 'rgba(255,255,255,.7)';
  const heroBorder = mode === 'dark' ? 'rgba(232,169,69,.28)' : 'rgba(1,79,153,.25)';
  const hero = `
    <div style="max-width:${PAGE_W}px;margin:32px auto 40px;padding:64px 32px;border-radius:32px;background:${heroBg};border:1px solid ${heroBorder};text-align:center;box-sizing:border-box">
      <div data-smfullmedia="hero" role="button" tabindex="0" title="Ziehen: Hero-Medium verschieben (Pfeiltasten: 1 px, Shift 10 px) – Bild/Raster im Tab „Layout“" style="display:flex;flex-direction:column;align-items:center;gap:16px;margin-bottom:32px;${fullMoveCss(fullOffset(lang, 'hero'))}">${fullHeroMediaHtml(lang, mode)}</div>
      <div style="font-size:40px;font-weight:800;line-height:1.2;margin-bottom:12px;color:${c.title}">${esc(heroTitle)}</div>
      <div style="font-size:17.6px;max-width:600px;margin:0 auto;white-space:pre-line;color:${c.title}">${esc(heroSub)}</div>
      <div style="display:grid;grid-template-columns:repeat(${Math.max(1, Math.min(6, chips ? 6 : 1))},1fr);gap:9.6px;margin-top:32px">${chips}</div>
      <div style="display:inline-block;margin-top:32px;padding:13.6px 35.2px;border-radius:50px;background:${mode === 'dark' ? '#e8a945' : '#014f99'};color:${mode === 'dark' ? '#1e293b' : '#fff'};font-weight:700;font-size:16.8px">${esc(getPath(state.overrides[lang], ['hero', 'cta']) || getPath(state.defaults[lang], ['hero', 'cta']) || 'Jetzt starten')}</div>
    </div>`;
  const sections = SECTION_MEDIA_KEYS.map((k) => fullSectionHtml(lang, k, mode)).join('');
  return `
    <details class="panel" data-smfull open style="padding:.7rem .9rem">
      <summary style="cursor:pointer;font-weight:700;color:var(--text)">🗺️ Ganze Seite – Vorschau: Medien verschieben</summary>
      <p class="hint" style="margin:.4rem 0">Schematische Ansicht der ${lang === 'de' ? 'deutschen' : 'englischen'} Startseite im ${MODE_VIEW[mode]}-Modus (Umschalter oben). <strong>Hero-Medium</strong> und die drei <strong>Sektions-Medien</strong> lassen sich mit der Maus <strong>verschieben</strong> (Pfeiltasten auf dem fokussierten Medium: 1 px, Shift = 10 px) oder unten über die Felder setzen. Der Versatz gilt 1:1 in Pixeln auf der Seite; der Platz im Seitenfluss bleibt, nur das Medium wandert. Klick auf ein Sektions-Medium öffnet dessen Einstellungen. Karten und Texte sind Platzhalter.</p>
      <div class="row" style="gap:.35rem .9rem;align-items:center;margin:.2rem 0 .6rem">${fullFieldsHtml(lang)}</div>
      <div data-smfullwrap style="overflow:auto;max-height:70vh;border:1px solid var(--border);border-radius:10px;background:${prevBg(mode)};resize:vertical">
        <div data-smpage data-scale="0.5" style="width:${PAGE_W}px;zoom:0.5;padding:8px 0 24px;color:${c.text};font-family:system-ui,sans-serif;line-height:1.6;box-sizing:border-box">
          ${hero}${sections}
        </div>
      </div>
      <p class="hint" style="margin:.4rem 0 0">Hero-Modus: ${m.heroMode === 'grid' ? 'Kachel-Raster' : 'Einzelbanner'} – Bild/Raster und Ein-/Ausblenden im Tab „Layout“.</p>
    </details>`;
}
// Bindet Zoom, Ziehen, Pfeiltasten und Felder der Ganzseiten-Vorschau.
let fullResizeObs = null;
function bindFullPage(pane, lang, rr) {
  const wrap = pane.querySelector('[data-smfullwrap]');
  const page = pane.querySelector('[data-smpage]');
  if (!wrap || !page) return;
  // Zoom so, dass die 1200 px breite Seite in die Spalte passt (max. 1:1).
  const fit = () => {
    const w = wrap.clientWidth - 2;
    const scale = w > 0 ? Math.min(1, w / PAGE_W) : 0.5;
    page.style.zoom = String(scale);
    page.dataset.scale = String(scale);
  };
  fit();
  if (fullResizeObs) fullResizeObs.disconnect();
  if (typeof ResizeObserver !== 'undefined') {
    fullResizeObs = new ResizeObserver(fit);
    fullResizeObs.observe(wrap);
  }
  const scaleOf = () => Number(page.dataset.scale) || 1;
  const apply = (key) => {
    const el = pane.querySelector(`[data-smfullmedia="${key}"]`);
    const o = fullOffset(lang, key);
    if (el) {
      el.style.position = 'relative';
      el.style.left = `${o.x}px`;
      el.style.top = `${o.y}px`;
    }
    const ix = pane.querySelector(`[data-smoff="${key}:x"]`);
    const iy = pane.querySelector(`[data-smoff="${key}:y"]`);
    if (ix) ix.value = String(o.x);
    if (iy) iy.value = String(o.y);
  };
  // Felder X/Y + ↺
  pane.querySelectorAll('[data-smoff]').forEach((el) => {
    const i = el.dataset.smoff.lastIndexOf(':');
    const key = el.dataset.smoff.slice(0, i);
    const axis = el.dataset.smoff.slice(i + 1) === 'y' ? 'y' : 'x';
    el.addEventListener('input', () => {
      const o = fullOffset(lang, key);
      o[axis] = normMediaOffset(parseInt(el.value, 10), axis);
      setFullOffset(lang, key, o.x, o.y);
      apply(key);
    });
  });
  pane.querySelectorAll('[data-smoffreset]').forEach((el) => {
    el.addEventListener('click', () => {
      setFullOffset(lang, el.dataset.smoffreset, 0, 0);
      apply(el.dataset.smoffreset);
      toast('Verschiebung zurückgesetzt');
    });
  });
  // Ziehen (Zoom berücksichtigen), Pfeiltasten, Klick = Sektion wählen.
  const ARROWS = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
  pane.querySelectorAll('[data-smfullmedia]').forEach((el) => {
    const key = el.dataset.smfullmedia;
    let drag = null;
    el.addEventListener('click', () => {
      if (el.dataset.smDragged) {
        delete el.dataset.smDragged;
        return;
      }
      if (key !== 'hero' && key !== selectedSection()) {
        selected = key;
        rr();
      }
    });
    el.addEventListener('keydown', (e) => {
      if (!ARROWS[e.key]) return;
      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;
      const o = fullOffset(lang, key);
      setFullOffset(lang, key, o.x + ARROWS[e.key][0] * step, o.y + ARROWS[e.key][1] * step);
      apply(key);
    });
    el.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      const o = fullOffset(lang, key);
      drag = { x: e.clientX, y: e.clientY, ox: o.x, oy: o.y, moved: false };
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      if (!drag.moved && Math.abs(dx) < 3 && Math.abs(dy) < 3) return;
      drag.moved = true;
      const sc = scaleOf();
      setFullOffset(lang, key, drag.ox + dx / sc, drag.oy + dy / sc);
      apply(key);
    });
    const end = (e) => {
      if (!drag) return;
      const moved = drag.moved;
      drag = null;
      if (el.hasPointerCapture && el.hasPointerCapture(e.pointerId))
        el.releasePointerCapture(e.pointerId);
      if (moved) el.dataset.smDragged = '1';
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  });
}
