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
        <span class="hint" style="margin:0">– Design-Felder links wechseln die Ansicht automatisch.</span>
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
  const dis = s.customBorder ? '' : 'disabled';
  return `
    <div class="panel" data-smdesign="${mode}">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:.5rem;flex-wrap:wrap;margin-bottom:.4rem">
        <strong data-smshowmode="${mode}" title="Vorschau im ${MODE_LABEL[mode]}-Modus anzeigen" style="cursor:pointer;padding:.1rem .4rem;border-radius:6px;${mode === prevMode ? 'outline:2px solid var(--accent)' : ''}">${MODE_LABEL[mode]} <span class="hint" style="margin:0;font-weight:400">👁</span></strong>
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
      ${dis ? '' : ''}
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
        die Vorschau springt beim Bearbeiten in den passenden Modus. Darunter die Diashow (nur bei Bildern).</p>
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

  pane.querySelector('[data-smsel]')?.addEventListener('change', (e) => {
    selected = SECTION_MEDIA_KEYS.includes(e.target.value) ? e.target.value : 'audio';
    rr();
  });
  pane
    .querySelectorAll('[data-smprevmode]')
    .forEach((el) =>
      el.addEventListener('click', () => setPrevMode(pane, lang, el.dataset.smprevmode)),
    );
  pane
    .querySelectorAll('[data-smshowmode]')
    .forEach((el) =>
      el.addEventListener('click', () => setPrevMode(pane, lang, el.dataset.smshowmode)),
    );

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
