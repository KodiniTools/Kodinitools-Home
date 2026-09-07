// Layout-Tab: Anordnung des Hero-Bereichs (Banner vs. Raster-Layouts) samt
// Form (Seitenverhältnis) und Per-Kachel-Design (Rahmen + Hintergrund) mit
// Live-Vorschau. Das Kachel-Bild kann hier direkt aus der Zwischenablage
// (Strg/Cmd+V bzw. Button) oder aus der Mediathek zugewiesen und bearbeitet
// werden (Deckkraft, Abdunkelung, Weichzeichner, Sättigung); die klassische
// Medien-Zuweisung im Medien-Tab bleibt bestehen.

import { captureView, restoreView } from './viewstate.js';
import { $, esc, toast, fmtBytes } from './core.js';
import { slider, bindSliders } from './slider.js';
import { colorPicker, bindColorPickers } from './color.js';
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
  BANNER_ANIM_TYPES,
  BANNER_ANIM_SPEEDS,
  getBannerStyle,
  getBannerSlides,
  getBannerSlideshow,
  defaultBannerSlideshow,
  BANNER_SLIDES_MAX,
  BANNER_TRANSITIONS,
  getGridSlides,
  getGridSlideshow,
  defaultGridSlideshow,
  defaultBannerStyle,
  BANNER_STYLE_LIMITS,
} from './model.js';
import { objUrl, openMediaPicker, stageFile } from './media.js';
import { fontOptionsHtml, ensureFontFace } from './fonts.js';

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
// Wie clamp, aber auf 0,5er-Schritte gerundet (z. B. Umriss-/Konturdicke).
const clampHalf = (v, min, max) =>
  Math.max(min, Math.min(max, Math.round((Number(v) || 0) * 2) / 2));
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
// Preset-Positionen (⤒ Oben / ◎ Mitte / ⤓ Unten) als y-Wert in %.
const POS_PRESET_Y = { top: 10, center: 50, bottom: 90 };
// font-family-CSS für eine Kachel-Textschrift (lädt @font-face für die Vorschau) oder ''.
export function fontFF(file) {
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
// Ein Diashow-Bild (Server-URL oder 'staged:<id>') auflösen: { src, item } oder null.
export function slideInfo(val) {
  if (!val) return null;
  if (val.startsWith('staged:')) {
    const id = val.slice(7);
    const item = state.stagedItems.find((x) => x.id === id);
    if (!item) return null;
    return { src: objUrl(id), item };
  }
  return { src: val, item: null };
}
const TRANSITION_LABELS = {
  fade: 'Überblenden',
  slide: 'Schieben',
  zoom: 'Zoom (Ken Burns)',
  none: 'Harter Schnitt',
};
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
// Einstellungen einer Diashow (Banner: attr 'slideshow', Raster: 'gridslideshow'):
// Anzeigedauer, Übergangsdauer, Übergang, Pause bei Mauszeiger, Punkte, optional
// „versetzt wechseln" (nur Raster).
export function slideshowSettingsHtml(ss, attr, disabled, withStagger) {
  const dis = disabled ? 'disabled' : '';
  const pre = attr === 'gridslideshow' ? 'ly:gridslideshow' : 'ly:slideshow';
  return `
      <div class="row" style="align-items:flex-end;margin-top:.7rem">
        <div style="flex:1 1 220px">
          ${slider({ id: `${pre}:interval`, label: 'Anzeigedauer je Bild', unit: 's', min: 1, max: 30, value: ss.interval, attrs: `data-${attr}="interval"`, resetAttrs: `data-${attr}reset="interval"`, disabled })}
        </div>
        <div style="flex:1 1 220px">
          ${slider({ id: `${pre}:duration`, label: 'Übergangsdauer', unit: 'ms', min: 0, max: 5000, step: 50, value: ss.duration, attrs: `data-${attr}="duration"`, resetAttrs: `data-${attr}reset="duration"`, disabled })}
        </div>
        <div style="flex:0 0 auto">
          <label>Übergang</label>
          <select data-${attr}="transition" ${dis} style="width:auto;height:38px">${BANNER_TRANSITIONS.map((t) => `<option value="${t}" ${t === ss.transition ? 'selected' : ''}>${TRANSITION_LABELS[t] || t}</option>`).join('')}</select>
        </div>
      </div>
      <div class="row" style="align-items:center;margin-top:.4rem;gap:1rem">
        <label style="display:flex;align-items:center;gap:.4rem;color:var(--text);cursor:pointer;margin:0">
          <input type="checkbox" data-${attr}="pauseOnHover" ${ss.pauseOnHover ? 'checked' : ''} ${dis} style="width:auto" /> Pause bei Mauszeiger
        </label>
        <label style="display:flex;align-items:center;gap:.4rem;color:var(--text);cursor:pointer;margin:0">
          <input type="checkbox" data-${attr}="dots" ${ss.dots ? 'checked' : ''} ${dis} style="width:auto" /> Punkte zum Umschalten
        </label>
        ${
          withStagger
            ? `<label style="display:flex;align-items:center;gap:.4rem;color:var(--text);cursor:pointer;margin:0">
          <input type="checkbox" data-${attr}="stagger" ${ss.stagger !== false ? 'checked' : ''} ${dis} style="width:auto" /> Versetzt wechseln (Kacheln nacheinander)
        </label>`
            : ''
        }
      </div>`;
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
// Vorschau-Diashow: wechselt das Bild in der Sticky-Vorschau im eingestellten Takt.
let slideTimer = null;
function stopPreviewSlideshow() {
  if (slideTimer !== null) clearInterval(slideTimer);
  slideTimer = null;
}
function startPreviewSlideshow(pane, lang) {
  stopPreviewSlideshow();
  // Raster-Modus: alle Kacheln mit weiteren Bildern wechseln im gemeinsamen Takt.
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
  if (cellImgs.length) {
    const ms = Math.max(1, getGridSlideshow(lang).interval) * 1000;
    slideTimer = setInterval(() => {
      if (!cellImgs[0].img.isConnected) {
        stopPreviewSlideshow();
        return;
      }
      for (const c of cellImgs) {
        c.cur = (c.cur + 1) % c.srcs.length;
        c.img.setAttribute('src', c.srcs[c.cur]);
      }
    }, ms);
    return;
  }
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
  slideTimer = setInterval(() => {
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

// Gemeinsamer Overlay-Style: der Text wird an (x,y) in % verankert (Mittelpunkt)
// und lässt sich in der Vorschau mit der Maus frei verschieben (cursor:move).
export function overlayStyle(color, size, x, y, font, fsDefault, shadow, extra) {
  const fs = size > 0 ? `${size}px` : fsDefault;
  const cx = clamp(Number(x) || 0, 0, 100);
  const cy = clamp(Number(y) || 0, 0, 100);
  return `position:absolute;left:${cx}%;top:${cy}%;transform:translate(-50%,-50%);max-width:92%;text-align:center;padding:.1rem .3rem;color:${color || '#fff'};font-size:${fs};line-height:1.2;text-shadow:${shadow};word-break:break-word;cursor:move;pointer-events:auto;user-select:none;touch-action:none;${fontFF(font)}${extra || ''}`;
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
  return `
    <div class="panel" data-bannerdesign="${mode}">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:.5rem;flex-wrap:wrap;margin-bottom:.4rem">
        <strong>${MODE_LABEL[mode]}</strong>
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

function layoutPanel(lang) {
  const m = state.media[lang];
  const mode = m.heroMode === 'grid' ? 'grid' : 'banner';
  const langLabel = lang === 'de' ? 'deutsche' : 'englische';
  const modePanel = `
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
  if (mode !== 'grid') {
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
    const bShadowBlur = Number.isFinite(m.heroBannerTextShadowBlur)
      ? m.heroBannerTextShadowBlur
      : 6;
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
          <span style="display:inline-flex;gap:.25rem">
            ${['light', 'dark'].map((md) => `<button type="button" class="hd-reset" data-bannerprevmode="${md}" aria-pressed="${md === bannerPrevMode}" style="${md === bannerPrevMode ? 'outline:2px solid var(--accent)' : ''}">${MODE_LABEL[md]}</button>`).join('')}
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
          <strong>Hell</strong> und <strong>Dunkel</strong>; die Vorschau springt beim Bearbeiten in den passenden Modus.
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
// Vorschau-Modus (Hell/Dunkel) umschalten: Hintergrund, Umschalter, Medium.
function setBannerPrevMode(pane, lang, mode) {
  bannerPrevMode = mode === 'dark' ? 'dark' : 'light';
  const box = pane.querySelector('[data-bannerbox]');
  if (box) {
    box.dataset.prevmode = bannerPrevMode;
    box.style.background = BANNER_PREV_BG[bannerPrevMode];
  }
  pane.querySelectorAll('[data-bannerprevmode]').forEach((b) => {
    const on = b.dataset.bannerprevmode === bannerPrevMode;
    b.setAttribute('aria-pressed', String(on));
    b.style.outline = on ? '2px solid var(--accent)' : '';
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
// Kachel i in Vorschau UND Editor hervorheben (ohne zu scrollen).
function markCell(pane, i) {
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

// Macht ein Text-Overlay (handle) innerhalb seines Containers per Maus/Touch
// ziehbar. onMove(x,y) bekommt die neue Position in % (0–100). onTap() wird bei
// einem Klick ohne Bewegung ausgelöst (z. B. um die Kachel auszuwählen).
export function dragHandle(handle, container, onMove, onTap) {
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

// --- Bild in Kachel einsetzen (Zwischenablage / Mediathek) ---

// Dateiendung je MIME-Typ für Bilder aus der Zwischenablage (Screenshots = PNG).
const IMG_EXT = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};
const MAX_PASTE_BYTES = 25 * 1024 * 1024;

// Legt ein Bild (Blob) im Zwischenspeicher ab, weist es Kachel i (oder dem
// Banner bei i === 'banner') zu und rendert den Tab neu (Scrollposition bleibt,
// Kachel bleibt markiert).
async function assignImageBlob(lang, i, blob) {
  const type = blob.type || 'image/png';
  const ext = IMG_EXT[type];
  if (!ext) {
    toast(`Bildformat ${type} wird nicht unterstützt (PNG, JPEG, WebP, GIF)`);
    return false;
  }
  if (blob.size > MAX_PASTE_BYTES) {
    toast(`Bild zu groß (${fmtBytes(blob.size)}, max. ${fmtBytes(MAX_PASTE_BYTES)})`);
    return false;
  }
  const stamp = new Date().toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '-');
  const isBanner = i === 'banner';
  const isSlide = i === 'slide';
  const cellSlide =
    typeof i === 'string' && i.startsWith('cellslide:') ? Number(i.slice(10)) : null;
  if (
    (isSlide && getBannerSlides(lang).length >= BANNER_SLIDES_MAX) ||
    (cellSlide !== null && getGridSlides(lang, cellSlide).length >= BANNER_SLIDES_MAX)
  ) {
    toast(`Maximal ${BANNER_SLIDES_MAX} weitere Bilder`);
    return false;
  }
  const base = isBanner
    ? 'banner'
    : isSlide
      ? 'banner-diashow'
      : cellSlide !== null
        ? `kachel-${cellSlide + 1}-diashow`
        : `kachel-${i + 1}`;
  const name = `${base}-${stamp}.${ext}`;
  const id = await stageFile(new File([blob], name, { type }), name);
  if (isSlide) getBannerSlides(lang).push('staged:' + id);
  else if (cellSlide !== null) getGridSlides(lang, cellSlide).push('staged:' + id);
  else setMediaVal(lang, isBanner ? 'heroBanner' : 'grid' + i, 'staged:' + id);
  const y = window.scrollY;
  renderLayout();
  if (cellSlide !== null) markCell($('#content'), cellSlide);
  else if (!isBanner && !isSlide) markCell($('#content'), i);
  window.scrollTo({ top: y });
  toast(
    `Bild ${isBanner ? 'als Banner' : isSlide ? 'an die Diashow angehängt' : cellSlide !== null ? `an die Diashow von Kachel ${cellSlide + 1} angehängt` : `in Kachel ${i + 1}`} (${fmtBytes(blob.size)}) – lokal bis zum Veröffentlichen`,
  );
  return true;
}

// Erstes Bild aus einer DataTransfer-Liste (Zwischenablage/Drop) oder null.
function imageFromDataTransfer(dt) {
  if (!dt) return null;
  for (const it of dt.items || []) {
    if (it.kind === 'file' && /^image\//.test(it.type)) return it.getAsFile();
  }
  for (const f of dt.files || []) if (/^image\//.test(f.type)) return f;
  return null;
}

// Button „Aus Zwischenablage einfügen": liest die Zwischenablage über die
// Clipboard-API (nur HTTPS/localhost, fragt ggf. um Erlaubnis). Ohne Zugriff
// bleibt Strg/Cmd+V auf der markierten Kachel als Weg.
async function pasteFromClipboardApi(lang, i) {
  if (!navigator.clipboard || typeof navigator.clipboard.read !== 'function') {
    toast(
      i === 'banner' || i === 'slide' || String(i).startsWith('cellslide:')
        ? 'Zwischenablage nicht direkt lesbar – jetzt Strg/Cmd+V drücken'
        : 'Zwischenablage nicht direkt lesbar – Kachel ist markiert: jetzt Strg/Cmd+V drücken',
    );
    return;
  }
  try {
    const items = await navigator.clipboard.read();
    for (const it of items) {
      const type = it.types.find((t) => /^image\//.test(t));
      if (!type) continue;
      const blob = await it.getType(type);
      await assignImageBlob(lang, i, blob);
      return;
    }
    toast('Kein Bild in der Zwischenablage');
  } catch (e) {
    const hint =
      i === 'banner' || i === 'slide' || String(i).startsWith('cellslide:')
        ? 'jetzt Strg/Cmd+V drücken'
        : 'Kachel ist markiert: jetzt Strg/Cmd+V drücken';
    toast(
      e && e.name === 'NotAllowedError'
        ? `Zugriff auf die Zwischenablage abgelehnt – ${hint}`
        : `Zwischenablage nicht lesbar – ${hint}`,
    );
  }
}

// Strg/Cmd+V im Layout-Tab: Bild aus der Zwischenablage in die Kachel einfügen,
// deren Editor den Fokus hat, sonst in die zuletzt markierte Kachel. Text-Einfügen
// in Eingabefelder bleibt unberührt (nur Bild-Daten werden abgefangen).
function onDocumentPaste(e) {
  if (state.nav.sub !== 'layout' || !['de', 'en'].includes(state.nav.section)) return;
  const pane = $('#content');
  if (!pane) return;
  // Banner-Modus: Bild aus der Zwischenablage wird zum Banner (außer beim Text-
  // Einfügen in ein Eingabefeld – dort nur, wenn wirklich Bilddaten anliegen).
  if (pane.querySelector('[data-bannermediablock]')) {
    const blob = imageFromDataTransfer(e.clipboardData);
    if (!blob) return;
    e.preventDefault();
    assignImageBlob(state.nav.section, 'banner', blob).catch((err) => {
      console.error(err);
      toast('Einfügen fehlgeschlagen');
    });
    return;
  }
  if (!pane.querySelector('[data-celleditor]')) return;
  const blob = imageFromDataTransfer(e.clipboardData);
  if (!blob) return;
  const editor = e.target instanceof Element ? e.target.closest('[data-celleditor]') : null;
  const i = editor ? Number(editor.dataset.celleditor) : activeCell;
  if (i === null || i === undefined || !pane.querySelector(`[data-celleditor="${i}"]`)) {
    toast('Zuerst eine Kachel anklicken, dann Strg/Cmd+V');
    return;
  }
  e.preventDefault();
  assignImageBlob(state.nav.section, i, blob).catch((err) => {
    console.error(err);
    toast('Einfügen fehlgeschlagen');
  });
}
document.addEventListener('paste', onDocumentPaste);

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
  // Sichtzustand (Scroll der Seite/Seitenleisten, auf-/zugeklappte Bereiche) erhalten.
  const view = captureView(pane);
  stopPreviewSlideshow();
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
          renderLayout();
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
      renderLayout();
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
    el.addEventListener('change', () => renderLayout());
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
          renderLayout();
          toast('Banner zugewiesen');
        },
      });
    }),
  );
  pane.querySelectorAll('[data-bannerclear]').forEach((el) =>
    el.addEventListener('click', () => {
      setMediaVal(lang, 'heroBanner', '');
      renderLayout();
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
          renderLayout();
          toast('Bild an die Diashow angehängt');
        },
      });
    }),
  );
  pane.querySelectorAll('[data-slideremove]').forEach((el) =>
    el.addEventListener('click', () => {
      getBannerSlides(lang).splice(Number(el.dataset.slideremove), 1);
      renderLayout();
      toast('Bild aus der Diashow entfernt');
    }),
  );
  pane.querySelectorAll('[data-slideclear]').forEach((el) =>
    el.addEventListener('click', () => {
      if (!confirm('Alle weiteren Bilder aus der Diashow entfernen? Das Banner selbst bleibt.'))
        return;
      getBannerSlides(lang).length = 0;
      renderLayout();
      toast('Diashow geleert');
    }),
  );
  const moveSlide = (i, dir) => {
    const slides = getBannerSlides(lang);
    const j = i + dir;
    if (j < 0 || j >= slides.length) return;
    [slides[i], slides[j]] = [slides[j], slides[i]];
    renderLayout();
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
          startPreviewSlideshow(pane, lang);
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
      renderLayout();
    }),
  );
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
          renderLayout();
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
      renderLayout();
      markCell($('#content'), i);
    }),
  );
  const moveCellSlide = (i, j, dir) => {
    const slides = getGridSlides(lang, i);
    const k = j + dir;
    if (k < 0 || k >= slides.length) return;
    [slides[j], slides[k]] = [slides[k], slides[j]];
    renderLayout();
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
          startPreviewSlideshow(pane, lang);
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
      renderLayout();
    }),
  );
  startPreviewSlideshow(pane, lang);

  // Banner-Design je Modus: Rahmen / Ecken / Schatten / Deckkraft / Verdunkelung.
  pane
    .querySelectorAll('[data-bannerprevmode]')
    .forEach((el) =>
      el.addEventListener('click', () => setBannerPrevMode(pane, lang, el.dataset.bannerprevmode)),
    );
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
      renderLayout();
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
      renderLayout();
      toast('Banner-Design zurückgesetzt');
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
  // Hell ↔ Dunkel: Werte eines Modus in den anderen kopieren.
  pane.querySelectorAll('[data-bannercopyside]').forEach((el) =>
    el.addEventListener('click', () => {
      const from = el.dataset.bannercopyside === 'dark' ? 'dark' : 'light';
      const to = from === 'dark' ? 'light' : 'dark';
      state.media[lang].heroBannerStyle[to] = { ...getBannerStyle(lang, from) };
      bannerPrevMode = to;
      renderLayout();
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

  // Freies Verschieben der Text-Overlays per Maus (Banner + Kacheln).
  wireDrag(pane, lang);
  bindSliders(pane); // nach den Feld-Handlern: Zahlenfeld löst deren input-Event aus
  bindColorPickers(pane);
  restoreView(pane, view);
}
