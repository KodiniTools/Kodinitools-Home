// Layout-Tab – Einzelbanner: Banner-Design (Hell/Dunkel), Banner-Text mit
// Effekten, Banner-Medium, Diashow und Live-Vorschau. Wird von layout.js
// gerendert (bannerLayoutHtml) und verdrahtet (bindBanner).

import { esc, toast, fmtBytes } from './core.js';
import { slider } from './slider.js';
import { colorPicker } from './color.js';
import {
  state,
  rgbaFromHex,
  getMediaVal,
  setMediaVal,
  BANNER_ANIM_TYPES,
  BANNER_ANIM_SPEEDS,
  getBannerStyle,
  getBannerSlides,
  getBannerSlideshow,
  defaultBannerSlideshow,
  BANNER_SLIDES_MAX,
  BANNER_TRANSITIONS,
  defaultBannerStyle,
  BANNER_STYLE_LIMITS,
} from './model.js';
import { objUrl, openMediaPicker } from './media.js';
import { fontOptionsHtml } from './fonts.js';
import {
  clamp,
  clampHalf,
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

// Felder des Banner-Text-Designs (alles außer dem Text selbst) – für „Text-Design
// nach DE/EN übertragen".
const BANNER_TEXT_DESIGN_KEYS = [
  'heroBannerFont',
  'heroBannerTextColor',
  'heroBannerTextSize',
  'heroBannerTextPos',
  'heroBannerTextX',
  'heroBannerTextY',
  'heroBannerTextShadow',
  'heroBannerTextShadowColor',
  'heroBannerTextShadowX',
  'heroBannerTextShadowY',
  'heroBannerTextShadowBlur',
  'heroBannerTextStrokeColor',
  'heroBannerTextStrokeWidth',
  'heroBannerTextOpacity',
  'heroBannerTextAnim',
  'heroBannerTextAnimIntensity',
  'heroBannerTextAnimSpeed',
];

// Basis-Styles des Banner-Mediums in der Vorschau: 'media' = Bild/Video,
// 'box' = Platzhalter-Kasten, wenn noch kein Banner gewählt ist (zeigt das Design).
const BANNER_MEDIA_BASE = {
  media:
    'max-width:100%;max-height:240px;width:auto;height:auto;object-fit:contain;display:block;margin:0 auto;box-sizing:border-box',
  box: 'width:100%;min-height:110px;display:flex;align-items:center;justify-content:center;background:rgba(1,79,153,.12);box-sizing:border-box',
};
// Aktuell in der Banner-Vorschau gezeigter Modus (Hell/Dunkel). Wechselt beim
// Klick auf die Umschalter über der Vorschau oder automatisch beim Bearbeiten
// eines Feldes des jeweiligen Modus.
let bannerPrevMode = 'light';
// Seitenhintergrund der Vorschau je Modus (angenähert an die Startseite).
const BANNER_PREV_BG = { light: '#f1f5f9', dark: '#0b1220' };
const MODE_LABEL = { light: '☀️ Hell', dark: '🌙 Dunkel' };
// Design des Banners (Seitenleiste „Banner-Design") eines Modus als CSS-
// Deklarationen – wie content.ts → getHeroBannerCss auf der Seite (Rahmen, Ecken,
// Schatten, Deckkraft, Verdunkelung). Immer vollständig, damit die Vorschau live
// überschrieben werden kann.
function bannerDesignCss(lang, mode) {
  const s = getBannerStyle(lang, mode);
  const p = [`border-radius:${s.borderRadius}px`];
  p.push(s.borderWidth > 0 ? `border:${s.borderWidth}px solid ${s.borderColor}` : 'border:0');
  p.push(
    s.shadow
      ? `box-shadow:${s.shadowX}px ${s.shadowY}px ${s.shadowBlur}px ${rgbaFromHex(s.shadowColor, s.shadowOpacity)}`
      : 'box-shadow:none',
  );
  p.push(`opacity:${(s.opacity / 100).toFixed(2)}`);
  p.push(`filter:${s.darken > 0 ? `brightness(${((100 - s.darken) / 100).toFixed(2)})` : 'none'}`);
  return p.join(';');
}
// Vollständiger Inline-Style des Vorschau-Mediums (Basis je Art + Design des Modus).
function bannerMediaStyle(lang, kind, mode = bannerPrevMode) {
  return `${BANNER_MEDIA_BASE[kind] || BANNER_MEDIA_BASE.media};${bannerDesignCss(lang, mode)}`;
}
// Das dem Einzelbanner zugewiesene Medium (Bild/Video) als <img>/<video> im
// Banner-Design – oder ein Platzhalter-Kasten, wenn kein Banner gewählt ist.
function bannerMediaHtml(lang) {
  const med = bannerMediaInfo(lang);
  if (!med)
    return `<div data-bannermedia="box" style="${bannerMediaStyle(lang, 'box')}"><span class="hint" style="margin:0">Kein Banner gewählt — unten unter „Banner (Bild oder Video)" zuweisen.</span></div>`;
  const st = bannerMediaStyle(lang, 'media');
  return med.isVid
    ? `<video data-bannermedia="media" src="${med.src}" muted style="${st}"></video>`
    : `<img data-bannermedia="media" src="${esc(med.src)}" style="${st}" />`;
}
// Aufgelöstes Banner-Medium: { val, src, isVid, item } oder null, wenn leer/unbekannt.
function bannerMediaInfo(lang) {
  const val = getMediaVal(lang, 'heroBanner');
  if (!val) return null;
  if (val.startsWith('staged:')) {
    const id = val.slice(7);
    const item = state.stagedItems.find((x) => x.id === id);
    if (!item) return null;
    return { val, src: objUrl(id), isVid: /^video\//.test(item.type), item };
  }
  return { val, src: val, isVid: /\.(mp4|webm|mov|ogg)$/i.test(val), item: null };
}
// Panel „Banner (Bild oder Video)" in der Mitte des Banner-Modus: Zuweisung aus
// Zwischenablage, Mediathek oder per Pfad/URL, Entfernen und Verlinkung –
// ehemals im Tab „Medien".
function bannerMediaBlock(lang) {
  const m = state.media[lang];
  const val = getMediaVal(lang, 'heroBanner');
  const med = bannerMediaInfo(lang);
  const staged = val.startsWith('staged:');
  const thumb = med
    ? med.isVid
      ? `<video src="${med.src}" muted style="width:100%;height:100%;object-fit:cover;display:block"></video>`
      : `<img src="${esc(med.src)}" alt="" />`
    : '<span class="hint" style="margin:0">Kein Banner</span>';
  let status;
  if (med && med.item) {
    const size = med.item.blob ? ` · ${fmtBytes(med.item.blob.size)}` : '';
    status = `<p class="st local" style="margin:.2rem 0 .4rem">● ${esc(med.item.name)}${size} – lokal, wird beim Veröffentlichen hochgeladen.</p>`;
  } else if (med) {
    status = `<p class="st pub" data-slotstatus="${esc(val)}" style="margin:.2rem 0 .4rem">● ${esc(val)}</p>`;
  } else {
    status = `<p class="hint" style="margin:.2rem 0 .4rem">Leer = kein Banner. 📐 Empfohlen: breites Format, ca. <strong>1800 × 480 px</strong> (Anzeige bis 900 × 240 px).</p>`;
  }
  return `
    <div class="panel" data-bannermediablock>
      <h2 style="font-size:1rem;margin:0 0 .3rem">🖼️ Banner (Bild oder Video)</h2>
      <p class="hint">Erscheint ganz oben im Hero-Bereich der ${lang === 'de' ? 'deutschen' : 'englischen'} Startseite. Bild
        aus der Zwischenablage (Strg/Cmd+V oder Button), aus der Mediathek oder per Pfad/URL.</p>
      <div class="row" style="align-items:flex-start">
        <div class="bg-thumb" data-bannerthumb style="width:220px;height:110px">${thumb}</div>
        <div style="flex:1 1 260px">
          ${status}
          <label>Pfad/URL</label>
          <input data-bannerslot value="${esc(staged ? '' : val)}" placeholder="/uploads/mein-banner.jpg" ${staged ? 'disabled title="Lokales Medium – wird beim Veröffentlichen hochgeladen"' : ''} />
          <div class="row" style="margin-top:.5rem">
            <button type="button" data-bannerpaste title="Bild aus der Zwischenablage als Banner einsetzen (oder Strg/Cmd+V)" style="flex:0 0 auto">📋 Aus Zwischenablage einfügen</button>
            <button type="button" data-bannerpick style="flex:0 0 auto">📂 Aus Mediathek</button>
            <button type="button" class="danger" data-bannerclear ${med || val ? '' : 'disabled'} style="flex:0 0 auto">Entfernen</button>
          </div>
          <label style="margin-top:.6rem">🔗 Verlinkung (optional) — öffnet beim Klick auf das Banner</label>
          <input data-bannerlink value="${esc(m.heroBannerLink || '')}" placeholder="https://… oder /faq/" />
          <p class="hint" style="margin:.3rem 0 0">Leer = nicht klickbar. Externe Links (http/https) öffnen in neuem Tab; interne Pfade (z.B. <code>/faq/</code>) im selben Tab.</p>
        </div>
      </div>
    </div>`;
}
// Panel „Diashow": weitere Bilder (Reihenfolge, Entfernen) + Intervall, Übergang,
// Pause bei Hover, Punkte. Ohne weitere Bilder bleibt das Banner statisch.
function bannerSlidesBlock(lang) {
  const slides = getBannerSlides(lang);
  const ss = getBannerSlideshow(lang);
  const full = slides.length >= BANNER_SLIDES_MAX;
  const rows = slides
    .map((val, i) => {
      const info = slideInfo(val);
      const thumb = info
        ? `<img src="${esc(info.src)}" alt="" />`
        : '<span class="hint" style="margin:0">?</span>';
      const label =
        info && info.item
          ? `● ${esc(info.item.name)} – lokal, wird beim Veröffentlichen hochgeladen`
          : info
            ? esc(val)
            : `⚠ ${esc(val)} (lokales Bild nicht gefunden)`;
      return `
        <div class="row" data-sliderow="${i}" style="align-items:center;gap:.5rem;margin:.35rem 0">
          <span class="hint" style="margin:0;flex:0 0 2.2rem;text-align:right">${i + 2}.</span>
          <div class="bg-thumb" data-slidethumb="${i}" style="width:120px;height:60px">${thumb}</div>
          <div style="flex:1 1 200px;min-width:0"><p class="st ${info && info.item ? 'local' : 'pub'}" style="margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${label}</p></div>
          <span style="display:inline-flex;gap:.25rem;flex:0 0 auto">
            <button type="button" class="hd-reset" data-slideup="${i}" ${i === 0 ? 'disabled' : ''} title="Nach vorn">↑</button>
            <button type="button" class="hd-reset" data-slidedown="${i}" ${i === slides.length - 1 ? 'disabled' : ''} title="Nach hinten">↓</button>
            <button type="button" class="hd-reset danger" data-slideremove="${i}" title="Aus der Diashow entfernen">✕</button>
          </span>
        </div>`;
    })
    .join('');
  const list = slides.length
    ? rows
    : '<p class="hint" style="margin:.3rem 0">Noch keine weiteren Bilder – das Banner bleibt statisch.</p>';
  return `
    <div class="panel" data-bannerslidesblock>
      <h2 style="font-size:1rem;margin:0 0 .3rem">🎞️ Diashow – weitere Bilder</h2>
      <p class="hint">Weitere Bilder wechseln sich mit dem Banner (Bild 1) ab. Gleiche Größe wie das Banner empfohlen
        (ca. 1800 × 480 px); nur Bilder, keine Videos. Bis zu ${BANNER_SLIDES_MAX} weitere Bilder.</p>
      <div data-slidelist>${list}</div>
      <div class="row" style="margin-top:.5rem">
        <button type="button" data-slidepaste ${full ? 'disabled' : ''} title="Bild aus der Zwischenablage als weiteres Bild anhängen" style="flex:0 0 auto">📋 Aus Zwischenablage anhängen</button>
        <button type="button" data-slideadd ${full ? 'disabled' : ''} style="flex:0 0 auto">📂 Aus Mediathek anhängen</button>
        ${slides.length ? '<button type="button" class="danger" data-slideclear style="flex:0 0 auto">Alle entfernen</button>' : ''}
      </div>
      ${slideshowSettingsHtml(ss, 'slideshow', !slides.length, false)}
      <p class="hint" style="margin:.5rem 0 0">Die Vorschau oben wechselt die Bilder im eingestellten Takt; Übergänge und Punkte zeigt die veröffentlichte Seite.</p>
    </div>`;
}
// Prüft nach dem Rendern, ob die referenzierte /uploads-Datei des Banners auf dem
// Server existiert; fehlt sie, erscheint eine deutliche Warnung.
async function verifyBannerFile(pane) {
  const el = pane.querySelector('[data-bannermediablock] [data-slotstatus]');
  if (!el) return;
  const url = el.dataset.slotstatus;
  if (!/^\/uploads\//.test(url)) return;
  let ok;
  try {
    const r = await fetch(url, { method: 'HEAD', cache: 'no-store' });
    ok = r.ok;
  } catch {
    ok = false;
  }
  if (!ok && el.isConnected) {
    el.insertAdjacentHTML(
      'afterend',
      '<p class="st" style="color:#f87171;font-weight:600">⚠ Datei fehlt auf dem Server – bitte über „📂 Aus Mediathek" neu zuweisen und veröffentlichen.</p>',
    );
  }
}

// Textschatten des Banners aus den einstellbaren Feldern (oder 'none' bei „aus").
// Der Standard (an, #000000, 6 px) reproduziert das bisherige Aussehen exakt.
function bannerShadowCss(m) {
  if (m.heroBannerTextShadow === false) return 'none';
  const x = Number.isFinite(m.heroBannerTextShadowX) ? m.heroBannerTextShadowX : 0;
  const y = Number.isFinite(m.heroBannerTextShadowY) ? m.heroBannerTextShadowY : 2;
  const blur = Number.isFinite(m.heroBannerTextShadowBlur) ? m.heroBannerTextShadowBlur : 6;
  const col = rgbaFromHex(m.heroBannerTextShadowColor || '#000000', 60);
  return `${x}px ${y}px ${blur}px ${col}`;
}
// Tempo (Animationsdauer) je Geschwindigkeitsstufe.
const ANIM_DUR = { slow: '2.6s', normal: '1.8s', fast: '1s' };
// Deutsche Beschriftungen der Animationstypen und Tempo-Stufen (nur für die UI).
const ANIM_LABELS = {
  none: 'Keine',
  pulse: 'Puls',
  float: 'Schweben',
  shake: 'Wackeln',
  wobble: 'Kippen',
  glow: 'Glühen',
};
const ANIM_SPEED_LABELS = { slow: 'Langsam', normal: 'Normal', fast: 'Schnell' };
// Inline-CSS-Variablen der aktiven Text-Animation (leer bei 'none'). Intensität 1–10
// steuert die Amplitude je Typ; die Keyframes stehen in index.html (Admin).
function bannerAnimVars(m) {
  const type = m.heroBannerTextAnim;
  if (!type || type === 'none') return [];
  const it = clamp(
    Number.isFinite(m.heroBannerTextAnimIntensity) ? m.heroBannerTextAnimIntensity : 5,
    1,
    10,
  );
  const out = [`--anim-dur:${ANIM_DUR[m.heroBannerTextAnimSpeed] || '1.8s'}`];
  if (type === 'pulse') out.push(`--anim-scale:${(1 + it * 0.02).toFixed(3)}`);
  else if (type === 'float' || type === 'shake') out.push(`--anim-shift:${it}px`);
  else if (type === 'wobble') out.push(`--anim-rot:${it}deg`);
  else if (type === 'glow') out.push(`--anim-glow:${it * 2}px`);
  return out;
}
// Animationsklasse für das Vorschau-Element (kt-<type>) oder '' bei 'none'.
function bannerAnimClass(m) {
  const type = m.heroBannerTextAnim;
  return type && type !== 'none' ? 'kt-' + type : '';
}
// Umriss (Kontur) + Deckkraft + Animations-Amplitude des Banner-Textes als
// zusätzliche CSS-Deklarationen. Die Animation selbst kommt über die kt-*-Klasse.
function bannerExtraCss(m) {
  const parts = [];
  const sw = Number.isFinite(m.heroBannerTextStrokeWidth) ? m.heroBannerTextStrokeWidth : 0;
  if (sw > 0) parts.push(`-webkit-text-stroke:${sw}px ${m.heroBannerTextStrokeColor || '#000000'}`);
  const op = Number.isFinite(m.heroBannerTextOpacity) ? m.heroBannerTextOpacity : 100;
  if (op < 100) parts.push(`opacity:${clamp(op, 0, 100) / 100}`);
  for (const v of bannerAnimVars(m)) parts.push(v);
  return parts.length ? ';' + parts.join(';') : '';
}
// Inline-Style des Banner-Text-Overlays (Farbe, Position, Größe, Schrift, Schatten,
// Umriss, Deckkraft) – liest alle Werte aus dem Medien-Objekt der Sprache.
function bannerTextStyle(m) {
  const x = Number.isFinite(m.heroBannerTextX) ? m.heroBannerTextX : 50;
  const y = Number.isFinite(m.heroBannerTextY) ? m.heroBannerTextY : 50;
  return overlayStyle(
    m.heroBannerTextColor || '#ffffff',
    m.heroBannerTextSize || 0,
    x,
    y,
    m.heroBannerFont || '',
    '1.3rem',
    bannerShadowCss(m),
    bannerExtraCss(m),
  );
}

// Felder des Banner-Designs für einen Modus (Hell/Dunkel) in der Seitenleiste.
function bannerDesignSection(lang, mode) {
  const bs = getBannerStyle(lang, mode);
  const L = BANNER_STYLE_LIMITS;
  const id = (f) => `ly:banner:${mode}:${f}`;
  const attrs = (f) => `data-bannerstyle="${f}" data-mode="${mode}"`;
  const reset = (f) => `data-bannerstylereset="${f}" data-mode="${mode}"`;
  const resetBtnM = (f) =>
    `<button type="button" class="hd-reset" data-bannerstylereset="${f}" data-mode="${mode}" title="Auf Standard zurücksetzen" aria-label="Auf Standard zurücksetzen">↺</button>`;
  const withResetM = (html, f) =>
    `<div style="display:flex;gap:.3rem;align-items:center">${html}${resetBtnM(f)}</div>`;
  const other = mode === 'light' ? 'dark' : 'light';
  // Nicht gewählter Modus: zu einer schmalen, klickbaren Leiste zugeklappt
  // (Klick/Enter/Leertaste zeigt ihn in Vorschau und Seitenleiste).
  if (mode !== bannerPrevMode)
    return `
    <div class="panel tc-mode-collapsed" data-bannerdesign="${mode}" data-bannershowmode="${mode}" role="button" tabindex="0" title="${MODE_LABEL[mode]}-Modus anzeigen und bearbeiten">
      <span style="font-size:1.2rem">${mode === 'dark' ? '🌙' : '☀️'}</span>
      <span>${mode === 'dark' ? 'Dunkelmodus' : 'Hellmodus'} – anklicken zum Bearbeiten</span>
    </div>`;
  return `
    <div class="panel" data-bannerdesign="${mode}">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:.5rem;flex-wrap:wrap;margin-bottom:.4rem">
        <strong data-bannershowmode="${mode}" style="outline:2px solid var(--accent);padding:.1rem .4rem;border-radius:6px">${MODE_LABEL[mode]} <span class="hint" style="margin:0;font-weight:400">👁</span></strong>
        <span style="display:inline-flex;gap:.3rem">
          <button type="button" class="hd-reset" data-bannercopyside="${mode}" title="Diese Werte in den ${MODE_LABEL[other]}-Modus kopieren">→ ${other === 'dark' ? 'Dunkel' : 'Hell'} kopieren</button>
          <button type="button" class="hd-reset" data-bannerstyleresetall data-mode="${mode}" title="Banner-Design dieses Modus auf Standard zurücksetzen">↺ Alles</button>
        </span>
      </div>
      <label>Rahmenfarbe</label>
      ${colorPicker({ id: id('borderColor'), attrs: attrs('borderColor'), value: bs.borderColor, resetHtml: resetBtnM('borderColor') })}
      <div style="margin-top:.5rem">
        ${slider({ id: id('borderWidth'), label: 'Rahmendicke (0 = kein Rahmen)', unit: 'px', min: L.borderWidth.min, max: L.borderWidth.max, value: bs.borderWidth, attrs: attrs('borderWidth'), resetAttrs: reset('borderWidth') })}
      </div>
      <div style="margin-top:.5rem">
        ${slider({ id: id('borderRadius'), label: 'Eckenradius', unit: 'px', min: L.borderRadius.min, max: L.borderRadius.max, value: bs.borderRadius, attrs: attrs('borderRadius'), resetAttrs: reset('borderRadius') })}
      </div>
      <div style="border-top:1px solid var(--border);margin:.7rem 0 .5rem"></div>
      <label style="display:flex;align-items:center;gap:.4rem;color:var(--text);cursor:pointer;margin:.2rem 0 .4rem">
        <input type="checkbox" ${attrs('shadow')} ${bs.shadow ? 'checked' : ''} style="width:auto" />
        Schatten anzeigen
      </label>
      <label>Schattenfarbe</label>
      ${colorPicker({ id: id('shadowColor'), attrs: attrs('shadowColor'), value: bs.shadowColor, resetHtml: resetBtnM('shadowColor') })}
      <div class="row" style="align-items:flex-end;margin-top:.4rem">
        <div style="flex:0 0 auto">
          <label>Versatz X (px)</label>
          ${withResetM(`<input type="number" ${attrs('shadowX')} min="${L.shadowX.min}" max="${L.shadowX.max}" step="1" value="${bs.shadowX}" style="width:100px" />`, 'shadowX')}
        </div>
        <div style="flex:0 0 auto">
          <label>Versatz Y (px)</label>
          ${withResetM(`<input type="number" ${attrs('shadowY')} min="${L.shadowY.min}" max="${L.shadowY.max}" step="1" value="${bs.shadowY}" style="width:100px" />`, 'shadowY')}
        </div>
      </div>
      <div style="margin-top:.5rem">
        ${slider({ id: id('shadowBlur'), label: 'Weichzeichnung', unit: 'px', min: L.shadowBlur.min, max: L.shadowBlur.max, value: bs.shadowBlur, attrs: attrs('shadowBlur'), resetAttrs: reset('shadowBlur') })}
      </div>
      <div style="margin-top:.5rem">
        ${slider({ id: id('shadowOpacity'), label: 'Schatten-Deckkraft', unit: '%', min: L.shadowOpacity.min, max: L.shadowOpacity.max, value: bs.shadowOpacity, attrs: attrs('shadowOpacity'), resetAttrs: reset('shadowOpacity') })}
      </div>
      <div style="border-top:1px solid var(--border);margin:.7rem 0 .5rem"></div>
      <div style="margin-top:.3rem">
        ${slider({ id: id('opacity'), label: 'Deckkraft', unit: '%', min: L.opacity.min, max: L.opacity.max, value: bs.opacity, attrs: attrs('opacity'), resetAttrs: reset('opacity') })}
      </div>
      <div style="margin-top:.5rem">
        ${slider({ id: id('darken'), label: 'Verdunkelung', unit: '%', min: L.darken.min, max: L.darken.max, value: bs.darken, attrs: attrs('darken'), resetAttrs: reset('darken') })}
      </div>
    </div>`;
}

// Banner-Modus des Layout-Tabs: dreispaltig (links Banner-Design, Mitte Modus-Panel
// + Sticky-Vorschau + Banner-Medium + Diashow, rechts Banner-Text).
export function bannerLayoutHtml(lang, modePanel) {
  const m = state.media[lang];
  const bText = m.heroBannerText || '';
  const bFont = m.heroBannerFont || '';
  const bColor = m.heroBannerTextColor || '#ffffff';
  const bSize = m.heroBannerTextSize || 0;
  const bX = Number.isFinite(m.heroBannerTextX) ? m.heroBannerTextX : 50;
  const bY = Number.isFinite(m.heroBannerTextY) ? m.heroBannerTextY : 50;
  const bShadow = m.heroBannerTextShadow !== false;
  const bShadowColor = m.heroBannerTextShadowColor || '#000000';
  const bShadowX = Number.isFinite(m.heroBannerTextShadowX) ? m.heroBannerTextShadowX : 0;
  const bShadowY = Number.isFinite(m.heroBannerTextShadowY) ? m.heroBannerTextShadowY : 2;
  const bShadowBlur = Number.isFinite(m.heroBannerTextShadowBlur) ? m.heroBannerTextShadowBlur : 6;
  const bStrokeColor = m.heroBannerTextStrokeColor || '#000000';
  const bStrokeWidth = Number.isFinite(m.heroBannerTextStrokeWidth)
    ? m.heroBannerTextStrokeWidth
    : 0;
  const bOpacity = Number.isFinite(m.heroBannerTextOpacity) ? m.heroBannerTextOpacity : 100;
  const bAnim = BANNER_ANIM_TYPES.includes(m.heroBannerTextAnim) ? m.heroBannerTextAnim : 'none';
  const bAnimIntensity = Number.isFinite(m.heroBannerTextAnimIntensity)
    ? m.heroBannerTextAnimIntensity
    : 5;
  const bAnimSpeed = BANNER_ANIM_SPEEDS.includes(m.heroBannerTextAnimSpeed)
    ? m.heroBannerTextAnimSpeed
    : 'normal';
  const bMedia = bannerMediaHtml(lang);
  const previewBox = `
      <div data-bannerbox data-prevmode="${bannerPrevMode}" style="position:relative;max-width:520px;margin:.6rem auto;display:flex;align-items:center;justify-content:center;min-height:80px;padding:1rem;border-radius:10px;background:${BANNER_PREV_BG[bannerPrevMode]}">
        ${bMedia}
        <div data-bannertext class="${bText ? bannerAnimClass(m) : ''}" ${bText ? 'title="Zum Verschieben ziehen"' : ''} style="${bText ? bannerTextStyle(m) : ''}">${esc(bText)}</div>
      </div>`;
  const previewPanel = `
      <div style="position:sticky;top:.5rem;z-index:5;background:var(--panel);border:1px solid var(--border);border-radius:10px;padding:.6rem .9rem;margin:0 0 .9rem;box-shadow:0 8px 22px rgba(0,0,0,.4);max-height:38vh;overflow:auto">
        <div style="display:flex;align-items:center;gap:.5rem;margin:.1rem 0 .35rem">
          <span class="hint" style="margin:0">👁 Live-Vorschau (Banner):</span>
          <span class="mode-switch" title="Vorschau im Hell- oder Dunkelmodus anzeigen">
            ${['light', 'dark'].map((md) => `<button type="button" class="hd-reset${md === bannerPrevMode ? ' active' : ''}" data-bannerprevmode="${md}" aria-pressed="${md === bannerPrevMode}">${MODE_LABEL[md]}</button>`).join('')}
          </span>
          ${undoRedoBar()}
        </div>
        ${previewBox}
      </div>`;
  const otherLang = lang === 'de' ? 'en' : 'de';
  const otherLabel = otherLang === 'de' ? 'Deutsch' : 'English';
  const designSide = `
      <aside class="tc-side" data-tcside="left">
        <div class="tc-side-head left">🖼️ Banner-Design</div>
        <p class="hint">Rahmen, Ecken, Schatten, Deckkraft und Verdunkelung des Banner-Bildes/-Videos – getrennt für
          <strong>Hell</strong> und <strong>Dunkel</strong>. Der Umschalter über der Vorschau (oder die zugeklappte Leiste hier)
          wählt den bearbeiteten Modus; der andere ist zugeklappt.
          Das Banner-Bild/-Video weist du in der Mitte unter der Vorschau zu.</p>
        <div class="panel" style="display:flex;flex-wrap:wrap;gap:.4rem;align-items:center">
          <button type="button" class="hd-reset" data-bannercopylang="${otherLang}" title="Banner-Design (Hell + Dunkel) in die andere Sprache übernehmen – Text bleibt je Sprache" style="white-space:normal;text-align:left;flex:1 1 auto;min-width:0;max-width:100%">📋 Banner-Design nach ${otherLabel} übertragen<br /><span class="hint" style="margin:0">(Hell + Dunkel; Text bleibt je Sprache)</span></button>
        </div>
        ${bannerDesignSection(lang, 'light')}
        ${bannerDesignSection(lang, 'dark')}
      </aside>`;
  const textSide = `
      <aside class="tc-side" data-tcside="right">
        <div class="tc-side-head right">✍️ Banner-Text</div>
        <p class="hint">Optionaler Text über dem Banner: Schriftart (aus <code>/fonts</code>), Farbe, Größe, Position
          sowie Schatten, Umriss, Deckkraft und Animation. Leer = kein Text.</p>
        <div class="panel" style="display:flex;flex-wrap:wrap;gap:.4rem;align-items:center">
          <button type="button" class="hd-reset" data-bannertextcopylang="${otherLang}" title="Schrift, Farbe, Größe, Position und Effekte in die andere Sprache übernehmen – der Text selbst bleibt je Sprache" style="white-space:normal;text-align:left;flex:1 1 auto;min-width:0;max-width:100%">📋 Text-Design nach ${otherLabel} übertragen<br /><span class="hint" style="margin:0">(Schrift, Farbe, Größe, Position, Effekte – der Text selbst bleibt)</span></button>
        </div>
        <div class="row" style="align-items:flex-end">
          <div style="flex:2 1 160px">
            <label>Text</label>
            ${withReset(`<input data-bannerfield="text" value="${esc(bText)}" placeholder="z.B. Willkommen" maxlength="120" style="${fontFF(bFont)}" />`, 'data-bannerreset', 'text', false)}
          </div>
          <div style="flex:1 1 160px">
            <label>Schriftart des Textes</label>
            ${withReset(`<select data-bannerfont style="${fontFF(bFont)}">${fontOptionsHtml(bFont)}</select>`, 'data-bannerreset', 'font', false)}
          </div>
        </div>
        <div class="row" style="align-items:flex-end;margin-top:.4rem">
          <div style="flex:0 0 auto">
            <label>Textfarbe</label>
            ${colorPicker({ id: 'ly:banner:textColor', attrs: 'data-bannerfield="textColor"', value: bColor, resetHtml: resetBtn('data-bannerreset', 'textColor', false) })}
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
        <div style="border-top:1px solid var(--border);margin:.8rem 0 .4rem"></div>
        <strong>Text-Effekte</strong>
        <div class="row" style="align-items:flex-end;margin-top:.4rem">
          <div style="flex:0 0 auto">
            <label>Schatten</label>
            <label style="display:flex;align-items:center;gap:.4rem;color:var(--text);cursor:pointer;height:38px;margin:0">
              <input type="checkbox" data-bannerfield="textShadow" ${bShadow ? 'checked' : ''} style="width:auto" />
              Textschatten anzeigen
            </label>
          </div>
          <div style="flex:0 0 auto">
            <label>Schattenfarbe</label>
            ${colorPicker({ id: 'ly:banner:textShadowColor', attrs: 'data-bannerfield="textShadowColor"', value: bShadowColor, resetHtml: resetBtn('data-bannerreset', 'textShadowColor', false) })}
          </div>
          <div style="flex:0 0 auto">
            <label>Schatten-Versatz X (px)</label>
            ${withReset(`<input type="number" data-bannerfield="textShadowX" min="-50" max="50" step="1" value="${bShadowX}" style="width:110px" />`, 'data-bannerreset', 'textShadowX', false)}
          </div>
          <div style="flex:0 0 auto">
            <label>Schatten-Versatz Y (px)</label>
            ${withReset(`<input type="number" data-bannerfield="textShadowY" min="-50" max="50" step="1" value="${bShadowY}" style="width:110px" />`, 'data-bannerreset', 'textShadowY', false)}
          </div>
          <div style="flex:1 1 240px">
            ${slider({ id: 'ly:banner:textShadowBlur', label: 'Schatten-Weichzeichnung', unit: 'px', min: 0, max: 40, value: bShadowBlur, attrs: 'data-bannerfield="textShadowBlur"', resetAttrs: 'data-bannerreset="textShadowBlur"' })}
          </div>
        </div>
        <div class="row" style="align-items:flex-end;margin-top:.4rem">
          <div style="flex:0 0 auto">
            <label>Umriss-Farbe</label>
            ${colorPicker({ id: 'ly:banner:textStrokeColor', attrs: 'data-bannerfield="textStrokeColor"', value: bStrokeColor, resetHtml: resetBtn('data-bannerreset', 'textStrokeColor', false) })}
          </div>
          <div style="flex:0 0 auto">
            <label>Umriss-Dicke (px, 0=aus)</label>
            ${withReset(`<input type="number" data-bannerfield="textStrokeWidth" min="0" max="10" step="0.5" value="${bStrokeWidth}" style="width:120px" />`, 'data-bannerreset', 'textStrokeWidth', false)}
          </div>
          <div style="flex:1 1 240px">
            ${slider({ id: 'ly:banner:textOpacity', label: 'Deckkraft', unit: '%', min: 0, max: 100, value: bOpacity, attrs: 'data-bannerfield="textOpacity"', resetAttrs: 'data-bannerreset="textOpacity"' })}
          </div>
        </div>
        <div class="row" style="align-items:flex-end;margin-top:.4rem">
          <div style="flex:0 0 auto">
            <label>Animation</label>
            ${withReset(`<select data-bannerfield="textAnim" style="width:auto;height:38px">${BANNER_ANIM_TYPES.map((t) => `<option value="${t}" ${t === bAnim ? 'selected' : ''}>${ANIM_LABELS[t] || t}</option>`).join('')}</select>`, 'data-bannerreset', 'textAnim', false)}
          </div>
          <div style="flex:0 0 auto">
            <label>Intensität (1–10)</label>
            ${withReset(`<input type="number" data-bannerfield="textAnimIntensity" min="1" max="10" step="1" value="${bAnimIntensity}" style="width:110px" />`, 'data-bannerreset', 'textAnimIntensity', false)}
          </div>
          <div style="flex:0 0 auto">
            <label>Geschwindigkeit</label>
            ${withReset(`<select data-bannerfield="textAnimSpeed" style="width:auto;height:38px">${BANNER_ANIM_SPEEDS.map((s) => `<option value="${s}" ${s === bAnimSpeed ? 'selected' : ''}>${ANIM_SPEED_LABELS[s] || s}</option>`).join('')}</select>`, 'data-bannerreset', 'textAnimSpeed', false)}
          </div>
        </div>
      </aside>`;
  return `<div class="tc-layout">${designSide}<div class="tc-main">${modePanel}${previewPanel}${bannerMediaBlock(lang)}${bannerSlidesBlock(lang)}
      <div class="panel"><p class="hint" style="margin:0">Links das <strong>Banner-Design</strong> (Rahmen, Schatten, Deckkraft, Verdunkelung), rechts der <strong>Banner-Text</strong> mit allen Effekten. Die Vorschau bleibt beim Scrollen oben sichtbar; den Text in der Vorschau mit der Maus verschieben.</p></div>
    </div>${textSide}</div>`;
}

// Banner-Text-Overlay in der Vorschau live aktualisieren.
function updateBannerPreviewText(pane, lang) {
  const box = pane.querySelector('[data-bannertext]');
  if (!box) return;
  const m = state.media[lang];
  const t = m.heroBannerText || '';
  box.textContent = t;
  box.setAttribute('style', t ? bannerTextStyle(m) : '');
  // Animationsklasse (kt-*) neu setzen: erst alle entfernen, dann die aktive.
  box.classList.remove('kt-pulse', 'kt-float', 'kt-shake', 'kt-wobble', 'kt-glow');
  const cls = t ? bannerAnimClass(m) : '';
  if (cls) box.classList.add(cls);
}
// Banner-Medium (bzw. Platzhalter) in der Vorschau mit dem aktuellen Design versehen.
function updateBannerPreviewMedia(pane, lang) {
  const el = pane.querySelector('[data-bannermedia]');
  if (!el) return;
  el.setAttribute('style', bannerMediaStyle(lang, el.dataset.bannermedia, bannerPrevMode));
}
// Vorschau-Modus (Hell/Dunkel) umschalten. Bei einem Wechsel wird neu gerendert,
// damit in der Seitenleiste der bearbeitete Modus offen und der andere
// zugeklappt ist (Sichtzustand bleibt erhalten); sonst nur die Vorschau auffrischen.
function setBannerPrevMode(pane, lang, mode) {
  const next = mode === 'dark' ? 'dark' : 'light';
  if (next !== bannerPrevMode) {
    bannerPrevMode = next;
    rerender();
    return;
  }
  const box = pane.querySelector('[data-bannerbox]');
  if (box) {
    box.dataset.prevmode = bannerPrevMode;
    box.style.background = BANNER_PREV_BG[bannerPrevMode];
  }
  pane.querySelectorAll('[data-bannerprevmode]').forEach((b) => {
    const on = b.dataset.bannerprevmode === bannerPrevMode;
    b.setAttribute('aria-pressed', String(on));
    b.classList.toggle('active', on);
  });
  updateBannerPreviewMedia(pane, lang);
}
// „x / y %"-Anzeige des Banner-Textes aktualisieren.
function updateBannerPosLabel(pane, lang) {
  const el = pane.querySelector('[data-bannerposval]');
  if (!el) return;
  const m = state.media[lang];
  el.textContent = `${m.heroBannerTextX} / ${m.heroBannerTextY} %`;
}
// Vorschau-Diashow des Banners: wechselt das Bild in der Sticky-Vorschau im Takt.
function startBannerSlideshow(pane, lang) {
  const el = pane.querySelector('[data-bannermedia="media"]');
  if (!el || el.tagName !== 'IMG') return;
  const main = bannerMediaInfo(lang);
  const srcs = [
    main ? main.src : '',
    ...getBannerSlides(lang).map((v) => slideInfo(v)?.src || ''),
  ].filter(Boolean);
  if (srcs.length < 2) return;
  let cur = 0;
  const ms = Math.max(1, getBannerSlideshow(lang).interval) * 1000;
  setPreviewSlideshow(() => {
    if (!el.isConnected) {
      stopPreviewSlideshow();
      return;
    }
    cur = (cur + 1) % srcs.length;
    el.setAttribute('src', srcs[cur]);
    pane.querySelectorAll('[data-slidethumb]').forEach((t) => {
      t.style.outline = Number(t.dataset.slidethumb) === cur - 1 ? '2px solid var(--accent)' : '';
    });
  }, ms);
}

// Neu-Rendern des Tabs (von bindBanner gesetzt; nötig für den Modus-Wechsel).
let rerender = () => {};

// Verdrahtet alle Bedienelemente des Banner-Modus. rr = Tab neu rendern.
export function bindBanner(pane, lang, rr) {
  rerender = rr;
  const m = state.media[lang];
  // ↺ Banner-Textfeld auf Standard zurücksetzen.
  pane.querySelectorAll('[data-bannerreset]').forEach((el) => {
    const field = el.dataset.bannerreset;
    const defs = {
      text: '',
      font: '',
      textColor: '#ffffff',
      textSize: 0,
      textShadow: true,
      textShadowColor: '#000000',
      textShadowX: 0,
      textShadowY: 2,
      textShadowBlur: 6,
      textStrokeColor: '#000000',
      textStrokeWidth: 0,
      textOpacity: 100,
      textAnim: 'none',
      textAnimIntensity: 5,
      textAnimSpeed: 'normal',
    };
    el.addEventListener('click', () => {
      const m = state.media[lang];
      if (field === 'pos') {
        m.heroBannerTextX = 50;
        m.heroBannerTextY = 50;
      } else if (field in defs) {
        m['heroBanner' + field.charAt(0).toUpperCase() + field.slice(1)] = defs[field];
      }
      rr();
      toast('Auf Standard zurückgesetzt');
    });
  });

  // Banner-Text: Text / Farbe / Größe / Schatten / Umriss / Deckkraft (Banner-Modus).
  pane.querySelectorAll('[data-bannerfield]').forEach((el) =>
    el.addEventListener('input', () => {
      const f = el.dataset.bannerfield;
      const m = state.media[lang];
      if (f === 'text') m.heroBannerText = el.value.slice(0, 120);
      else if (f === 'textColor') m.heroBannerTextColor = el.value;
      else if (f === 'textSize') m.heroBannerTextSize = clamp(parseInt(el.value, 10) || 0, 0, 96);
      else if (f === 'textShadow') m.heroBannerTextShadow = el.checked;
      else if (f === 'textShadowColor') m.heroBannerTextShadowColor = el.value;
      else if (f === 'textShadowX')
        m.heroBannerTextShadowX = clamp(parseInt(el.value, 10) || 0, -50, 50);
      else if (f === 'textShadowY')
        m.heroBannerTextShadowY = clamp(parseInt(el.value, 10) || 0, -50, 50);
      else if (f === 'textShadowBlur')
        m.heroBannerTextShadowBlur = clamp(parseInt(el.value, 10) || 0, 0, 40);
      else if (f === 'textStrokeColor') m.heroBannerTextStrokeColor = el.value;
      else if (f === 'textStrokeWidth') m.heroBannerTextStrokeWidth = clampHalf(el.value, 0, 10);
      else if (f === 'textOpacity')
        m.heroBannerTextOpacity = clamp(parseInt(el.value, 10) || 0, 0, 100);
      else if (f === 'textAnim') m.heroBannerTextAnim = el.value;
      else if (f === 'textAnimSpeed') m.heroBannerTextAnimSpeed = el.value;
      else if (f === 'textAnimIntensity') {
        const n = parseInt(el.value, 10);
        m.heroBannerTextAnimIntensity = clamp(Number.isFinite(n) ? n : 5, 1, 10);
      }
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

  // Banner-Medium: Pfad/URL, Zwischenablage, Mediathek, Entfernen, Verlinkung.
  pane.querySelectorAll('[data-bannerslot]').forEach((el) => {
    el.addEventListener('input', () => setMediaVal(lang, 'heroBanner', el.value.trim()));
    el.addEventListener('change', () => rr());
  });
  pane
    .querySelectorAll('[data-bannerpaste]')
    .forEach((el) => el.addEventListener('click', () => pasteFromClipboardApi(lang, 'banner')));
  pane.querySelectorAll('[data-bannerpick]').forEach((el) =>
    el.addEventListener('click', () => {
      const srv = [lang, 'shared'].reduce((n, l) => n + (state.serverFiles[l] || []).length, 0);
      if (!state.stagedItems.length && !srv) {
        toast('Keine Medien vorhanden — Bild einfügen oder im Tab „Dateien" hochladen.');
        return;
      }
      openMediaPicker(lang, 'heroBanner', {
        title: 'Bild/Video für das Banner wählen',
        onPick: (url) => {
          setMediaVal(lang, 'heroBanner', url);
          rr();
          toast('Banner zugewiesen');
        },
      });
    }),
  );
  pane.querySelectorAll('[data-bannerclear]').forEach((el) =>
    el.addEventListener('click', () => {
      setMediaVal(lang, 'heroBanner', '');
      rr();
      toast('Banner entfernt');
    }),
  );
  pane.querySelectorAll('[data-bannerlink]').forEach((el) =>
    el.addEventListener('input', () => {
      state.media[lang].heroBannerLink = el.value.trim();
    }),
  );
  verifyBannerFile(pane);
  // Diashow: Bilder anhängen / ordnen / entfernen + Einstellungen.
  pane
    .querySelectorAll('[data-slidepaste]')
    .forEach((el) => el.addEventListener('click', () => pasteFromClipboardApi(lang, 'slide')));
  pane.querySelectorAll('[data-slideadd]').forEach((el) =>
    el.addEventListener('click', () => {
      const srv = [lang, 'shared'].reduce((n, l) => n + (state.serverFiles[l] || []).length, 0);
      if (!state.stagedItems.length && !srv) {
        toast('Keine Bilder vorhanden — Bild einfügen oder im Tab „Dateien" hochladen.');
        return;
      }
      openMediaPicker(lang, 'heroBannerSlide', {
        title: 'Weiteres Bild für die Diashow wählen',
        imagesOnly: true,
        onPick: (url) => {
          const slides = getBannerSlides(lang);
          if (slides.length >= BANNER_SLIDES_MAX) {
            toast(`Maximal ${BANNER_SLIDES_MAX} weitere Bilder`);
            return;
          }
          slides.push(url);
          rr();
          toast('Bild an die Diashow angehängt');
        },
      });
    }),
  );
  pane.querySelectorAll('[data-slideremove]').forEach((el) =>
    el.addEventListener('click', () => {
      getBannerSlides(lang).splice(Number(el.dataset.slideremove), 1);
      rr();
      toast('Bild aus der Diashow entfernt');
    }),
  );
  pane.querySelectorAll('[data-slideclear]').forEach((el) =>
    el.addEventListener('click', () => {
      if (!confirm('Alle weiteren Bilder aus der Diashow entfernen? Das Banner selbst bleibt.'))
        return;
      getBannerSlides(lang).length = 0;
      rr();
      toast('Diashow geleert');
    }),
  );
  const moveSlide = (i, dir) => {
    const slides = getBannerSlides(lang);
    const j = i + dir;
    if (j < 0 || j >= slides.length) return;
    [slides[i], slides[j]] = [slides[j], slides[i]];
    rr();
  };
  pane
    .querySelectorAll('[data-slideup]')
    .forEach((el) => el.addEventListener('click', () => moveSlide(Number(el.dataset.slideup), -1)));
  pane
    .querySelectorAll('[data-slidedown]')
    .forEach((el) =>
      el.addEventListener('click', () => moveSlide(Number(el.dataset.slidedown), 1)),
    );
  pane.querySelectorAll('[data-slideshow]').forEach((el) => {
    const f = el.dataset.slideshow;
    el.addEventListener(
      el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input',
      () => {
        const ss = getBannerSlideshow(lang);
        if (f === 'interval') {
          const n = parseInt(el.value, 10);
          ss.interval = clamp(Number.isFinite(n) ? n : 5, 1, 30);
          startBannerSlideshow(pane, lang);
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
  pane.querySelectorAll('[data-slideshowreset]').forEach((el) =>
    el.addEventListener('click', () => {
      const f = el.dataset.slideshowreset;
      const d = defaultBannerSlideshow();
      if (f in d) getBannerSlideshow(lang)[f] = d[f];
      rr();
    }),
  );

  // Banner-Design je Modus: Rahmen / Ecken / Schatten / Deckkraft / Verdunkelung.
  pane
    .querySelectorAll('[data-bannerprevmode]')
    .forEach((el) =>
      el.addEventListener('click', () => setBannerPrevMode(pane, lang, el.dataset.bannerprevmode)),
    );
  // Zugeklappte Leiste bzw. Abschnittskopf in der Seitenleiste: Modus wählen.
  pane.querySelectorAll('[data-bannershowmode]').forEach((el) => {
    el.addEventListener('click', () => setBannerPrevMode(pane, lang, el.dataset.bannershowmode));
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setBannerPrevMode(pane, lang, el.dataset.bannershowmode);
      }
    });
  });
  pane.querySelectorAll('[data-bannerstyle]').forEach((el) =>
    el.addEventListener('input', () => {
      const f = el.dataset.bannerstyle;
      const mode = el.dataset.mode === 'dark' ? 'dark' : 'light';
      const bs = getBannerStyle(lang, mode);
      if (f === 'shadow') bs.shadow = el.checked;
      else if (f === 'borderColor' || f === 'shadowColor') bs[f] = el.value;
      else if (f in BANNER_STYLE_LIMITS) {
        const n = parseInt(el.value, 10);
        const { min, max } = BANNER_STYLE_LIMITS[f];
        bs[f] = clamp(Number.isFinite(n) ? n : defaultBannerStyle()[f], min, max);
      }
      // Vorschau zeigt den Modus, der gerade bearbeitet wird.
      if (bannerPrevMode !== mode) setBannerPrevMode(pane, lang, mode);
      else updateBannerPreviewMedia(pane, lang);
    }),
  );
  pane.querySelectorAll('[data-bannerstylereset]').forEach((el) =>
    el.addEventListener('click', () => {
      const f = el.dataset.bannerstylereset;
      const mode = el.dataset.mode === 'dark' ? 'dark' : 'light';
      const d = defaultBannerStyle();
      if (!(f in d)) return;
      getBannerStyle(lang, mode)[f] = d[f];
      bannerPrevMode = mode;
      rr();
      toast('Auf Standard zurückgesetzt');
    }),
  );
  pane.querySelectorAll('[data-bannerstyleresetall]').forEach((el) =>
    el.addEventListener('click', () => {
      const mode = el.dataset.mode === 'dark' ? 'dark' : 'light';
      if (!confirm(`Banner-Design (${MODE_LABEL[mode]}) auf Standard zurücksetzen?`)) return;
      getBannerStyle(lang, mode); // sichert die Struktur
      state.media[lang].heroBannerStyle[mode] = defaultBannerStyle();
      bannerPrevMode = mode;
      rr();
      toast('Banner-Design zurückgesetzt');
    }),
  );
  // Hell ↔ Dunkel: Werte eines Modus in den anderen kopieren.
  pane.querySelectorAll('[data-bannercopyside]').forEach((el) =>
    el.addEventListener('click', () => {
      const from = el.dataset.bannercopyside === 'dark' ? 'dark' : 'light';
      const to = from === 'dark' ? 'light' : 'dark';
      state.media[lang].heroBannerStyle[to] = { ...getBannerStyle(lang, from) };
      bannerPrevMode = to;
      rr();
      toast(`Banner-Design nach ${MODE_LABEL[to]} kopiert`);
    }),
  );
  // Banner-Design (Hell + Dunkel) in die andere Sprache übernehmen – Text bleibt.
  pane.querySelectorAll('[data-bannercopylang]').forEach((el) =>
    el.addEventListener('click', () => {
      const to = el.dataset.bannercopylang === 'en' ? 'en' : 'de';
      const label = to === 'de' ? 'Deutsch' : 'English';
      if (
        !confirm(
          `Banner-Design (Hell + Dunkel) nach ${label} übertragen? Das dortige Design wird ersetzt.`,
        )
      )
        return;
      state.media[to].heroBannerStyle = {
        light: { ...getBannerStyle(lang, 'light') },
        dark: { ...getBannerStyle(lang, 'dark') },
      };
      state.media[to].heroBannerSlideshow = { ...getBannerSlideshow(lang) };
      toast(`Banner-Design nach ${label} übertragen`);
    }),
  );
  // Text-Design (Schrift, Farbe, Größe, Position, Effekte) in die andere Sprache
  // übernehmen – der Text selbst (heroBannerText) bleibt je Sprache.
  pane.querySelectorAll('[data-bannertextcopylang]').forEach((el) =>
    el.addEventListener('click', () => {
      const to = el.dataset.bannertextcopylang === 'en' ? 'en' : 'de';
      const label = to === 'de' ? 'Deutsch' : 'English';
      if (!confirm(`Text-Design nach ${label} übertragen? Der Text selbst bleibt unverändert.`))
        return;
      const src = state.media[lang];
      const dst = state.media[to];
      for (const k of BANNER_TEXT_DESIGN_KEYS) dst[k] = src[k];
      toast(`Text-Design nach ${label} übertragen`);
    }),
  );

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
  startBannerSlideshow(pane, lang);
}
