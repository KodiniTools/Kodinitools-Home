// Hero-Design-Tab (eine Sprache): Rahmen, Hintergrund und die Buttons
// (Feature-Chips) des Hero-Bereichs gestalten – getrennt für Hell- und
// Dunkelmodus – samt Live-Vorschau, plus die Hero-Texte (Titel, Untertitel,
// Button-Text) mit ihrer Feinabstimmung je Text (Schrift, Größe, Farbe
// Hell/Dunkel, Schatten, Umriss, Deckkraft, Animation) und die
// Button-Beschriftungen. Styling wird in media.<lang>.heroDesign (mit
// .light/.dark) gespeichert, die Feinabstimmung je Text in
// media.<lang>.textStyles["hero.*"]; Texte und Beschriftungen laufen über die
// Overrides (hero.title/subtitle/cta, hero.features.*).
//
// Layout (wie Tool-Karten/Texte/Hintergrund): Mitte = Sticky-Vorschau beider
// Modi, Texte, Schriften/Typografie, Button-Text und Beschriftungen (gelten für
// beide Modi); Seitenleiste Hell links / Dunkel rechts = alle Farben des Modus
// (Überschriften, Rahmen/Hintergrund, Chips, CTA, Hero-Text-Farben).

import { $, esc, toast } from './core.js';
import {
  state,
  rgbaFromHex,
  defaultHeroDesign,
  heroSideLight,
  heroSideDark,
  getGlobalFont,
  setGlobalFont,
  getPath,
  setPath,
  delPath,
  getTextStyle,
  HERO_TEXT_SLOTS,
  MEDIA_LANGS,
  HERO_IMG_FIELDS,
  normSiteMediaUrl,
  BANNER_SLIDES_MAX,
  BANNER_TRANSITIONS,
  defaultHeroBgSlideshow,
} from './model.js';
import { objUrl, openMediaPicker } from './media.js';
import { slideInfo, slideshowSettingsHtml } from './layout-shared.js';
import { ensureFontFace, fontOptionsHtml } from './fonts.js';
import { slider, bindSliders } from './slider.js';
import { colorPicker, bindColorPickers } from './color.js';
import {
  fontFF as txtFontFF,
  fxControls,
  bindFxControls,
  fxActive,
  TEXT_FX_DEFAULTS,
  slotAnimClass,
  slotPreviewStyle,
  slotFxParts,
  previewBg,
  applyAnimClass,
  updateSlotPreview,
} from './textstyle.js';
import { captureView, restoreView } from './viewstate.js';

const MODES = ['light', 'dark'];
const modeName = (mode) => (mode === 'dark' ? 'Dunkel' : 'Hell');
const colorKey = (mode) => (mode === 'dark' ? 'colorDark' : 'colorLight');

// Family-CSS für eine Schriftdatei (lädt @font-face für die Vorschau) oder ''.
// Einfache Anführungszeichen um den Family-Namen, damit der Wert gefahrlos in
// doppelt-gequotete HTML-style="…"-Attribute eingesetzt werden kann (sonst
// kollidieren die Anführungszeichen und font-family wird ungültig).
function fontFF(file) {
  return file ? `'${ensureFontFace(file)}', system-ui, sans-serif` : '';
}

// Feature-Schlüssel (Reihenfolge wie in den Locale-Dateien); Fallback, falls die
// Defaults (noch) nicht geladen sind.
const FEATURE_FALLBACK = [
  'free',
  'privacy',
  'browserBased',
  'serverBased',
  'multiLanguage',
  'noInstall',
];
function featureDefs(lang) {
  const f = state.defaults[lang]?.hero?.features;
  const keys = f && typeof f === 'object' ? Object.keys(f) : FEATURE_FALLBACK;
  return keys.map((k) => ({ key: k, def: (f && f[k]) || '' }));
}

function heroDesignOf(lang) {
  const hd = state.media[lang] && state.media[lang].heroDesign;
  if (!hd || !hd.light || !hd.dark) {
    state.media[lang].heroDesign = defaultHeroDesign();
    return state.media[lang].heroDesign;
  }
  return hd;
}
// Farb-Satz eines Modus (Hell oder Dunkel).
function sideOf(lang, mode) {
  return heroDesignOf(lang)[mode];
}
// Standard-Werte eines Modus (Hell/Dunkel).
function sideDefault(mode) {
  return mode === 'dark' ? heroSideDark() : heroSideLight();
}

// Kleiner „Zurücksetzen"-Button (↺) für ein einzelnes Feld. `scope` bestimmt,
// worauf sich `key` bezieht: 'side' = Farb-/Zahlenwert des Modus `mode`
// (bei Farbe+Transparenz beide Felder als "farbe:transparenz"), 'typo'/'font'
// = für beide Modi geltende Typografie/Schrift, 'enabled' = An-Schalter,
// 'feat' = Button-Beschriftung (Override).
function resetBtn(scope, key = '', mode = '') {
  return `<button type="button" class="hd-reset" data-hdreset="${esc(scope)}"${
    key ? ` data-hdkey="${esc(key)}"` : ''
  }${mode ? ` data-mode="${mode}"` : ''} title="Auf Standard zurücksetzen" aria-label="Auf Standard zurücksetzen">↺</button>`;
}
// Umschließt ein Eingabe-Element mit seinem Zurücksetzen-Button (nebeneinander).
function withReset(inputHtml, scope, key = '') {
  return `<div style="display:flex;gap:.3rem;align-items:center">${inputHtml}${resetBtn(
    scope,
    key,
  )}</div>`;
}

// Inline-Style der Vorschau-Box eines Modus.
function previewBoxStyle(s) {
  const bg = rgbaFromHex(s.bgColor, s.bgOpacity);
  // Globale Basis-Schrift als Grundschrift der Vorschau (Titel/Chips/CTA ohne
  // eigene Schrift erben sie – wie auf der echten Seite).
  const gf = fontFF(getGlobalFont());
  const base = gf ? `font-family:${gf};` : '';
  // Maße wie .hero auf der Seite (hero.css, 16 px Grundschrift): Breite 1200 px,
  // Innenabstand 4rem 2rem, Radius 2rem, Zeilenhöhe 1.6 – die Vorschau zeigt den
  // Hero in Originalgröße; der Rahmen darum scrollt (HD_PREVIEW_HEIGHT).
  return `${base}position:relative;overflow:hidden;isolation:isolate;box-sizing:border-box;width:${HERO_SITE_WIDTH}px;max-width:none;margin:0 auto;font-size:16px;line-height:1.6;background:${bg};border:${s.borderWidth}px solid ${s.borderColor};border-radius:32px;padding:64px 32px;text-align:center`;
}
// Breite des Hero-Kastens auf der Seite (max-width in hero.css).
const HERO_SITE_WIDTH = 1200;
// Sichtbare Höhe des Scrollrahmens der Vorschau (px); der Admin kann ihn unten
// rechts in der Höhe ziehen – der Wert bleibt über ein Neu-Rendern erhalten.
const HD_PREVIEW_HEIGHT = 300;
let hdPrevHeight = HD_PREVIEW_HEIGHT;
// Vorschau-URL eines Hero-Hintergrundbilds ('staged:<id>' -> Objekt-URL), '' ohne Bild.
function heroImgUrl(val) {
  if (!val) return '';
  return val.startsWith('staged:') ? objUrl(val.slice(7)) : val;
}
// Inline-Style der Bildebene in der Vorschau-Box (wie .hero::before auf der Seite):
// Deckkraft, Abdunkelung, Weichzeichner, Sättigung; liegt unter dem Inhalt.
function previewImageStyle(s, urlOverride = '') {
  const url = urlOverride || heroImgUrl(s.bgImage);
  if (!url) return '';
  const f = [];
  if (s.bgImageBlur > 0) f.push(`blur(${s.bgImageBlur}px)`);
  if (s.bgImageDarken > 0) f.push(`brightness(${(1 - s.bgImageDarken / 100).toFixed(3)})`);
  if (s.bgImageSaturate !== 100) f.push(`saturate(${s.bgImageSaturate}%)`);
  const inset = s.bgImageBlur > 0 ? -s.bgImageBlur * 2 : 0;
  return `position:absolute;inset:${inset}px;z-index:-1;pointer-events:none;border-radius:inherit;background:url('${url.replace(/['"]/g, '')}') center / cover no-repeat;opacity:${(s.bgImageOpacity / 100).toFixed(2)};filter:${f.join(' ') || 'none'}`;
}
function previewImageLayer(s) {
  const st = previewImageStyle(s);
  return st ? `<span data-hdimg style="${st}"></span>` : '';
}
// Weitere Bilder der Hintergrund-Diashow eines Modus (Liste mit Reihenfolge und
// Entfernen) plus Takt/Übergang – das Hintergrundbild ist Bild 1.
function bgSlidesOf(s) {
  if (!Array.isArray(s.bgSlides)) s.bgSlides = [];
  return s.bgSlides;
}
function heroSlidesBody(mode, s) {
  const slides = bgSlidesOf(s);
  if (!s.bgSlideshow || typeof s.bgSlideshow !== 'object') s.bgSlideshow = defaultHeroBgSlideshow();
  const full = slides.length >= BANNER_SLIDES_MAX;
  const rows = slides
    .map((val, i) => {
      const info = slideInfo(val);
      const thumb = info
        ? `<img src="${esc(info.src)}" alt="" />`
        : '<span class="hint" style="margin:0">?</span>';
      const title = info && info.item ? `${info.item.name} – lokal` : val;
      return `
        <div class="row" data-hdsliderow="${mode}:${i}" style="align-items:center;gap:.35rem;margin:.3rem 0">
          <span class="hint" style="margin:0;flex:0 0 1.6rem;text-align:right">${i + 2}.</span>
          <div class="bg-thumb" data-hdslidethumb="${mode}:${i}" style="width:72px;height:40px" title="${esc(title)}">${thumb}</div>
          <span style="display:inline-flex;gap:.2rem;flex:0 0 auto;margin-left:auto">
            <button type="button" class="hd-reset" data-hdslideup="${mode}:${i}" ${i === 0 ? 'disabled' : ''} title="Nach vorn">↑</button>
            <button type="button" class="hd-reset" data-hdslidedown="${mode}:${i}" ${i === slides.length - 1 ? 'disabled' : ''} title="Nach hinten">↓</button>
            <button type="button" class="hd-reset danger" data-hdslideremove="${mode}:${i}" title="Aus der Diashow entfernen">✕</button>
          </span>
        </div>`;
    })
    .join('');
  return `
      <details data-hdslides="${mode}" ${slides.length ? 'open' : ''} style="margin-top:.6rem;border-top:1px dashed var(--border);padding-top:.4rem">
        <summary style="cursor:pointer;color:var(--text);font-weight:600">🎞️ Diashow – weitere Bilder${slides.length ? ` (${slides.length})` : ''}</summary>
        <p class="hint" style="margin:.3rem 0">Weitere Bilder wechseln sich mit dem Hintergrundbild (Bild 1) ab; Bearbeitung (Deckkraft, Abdunkelung …) gilt für alle. Bis zu ${BANNER_SLIDES_MAX} weitere Bilder, gleiche Abmessungen empfohlen.</p>
        ${rows || '<p class="hint" style="margin:.2rem 0">Noch keine weiteren Bilder – das Hintergrundbild bleibt statisch.</p>'}
        <div class="row" style="margin-top:.4rem">
          <button type="button" class="hd-reset" data-hdslideadd="${mode}" ${full ? 'disabled' : ''}>📂 Aus Mediathek anhängen</button>
          ${slides.length ? `<button type="button" class="hd-reset danger" data-hdslideclear="${mode}">Alle entfernen</button>` : ''}
        </div>
        ${slideshowSettingsHtml(s.bgSlideshow, 'hdslideshow', !slides.length, false, { idPrefix: `hd:${mode}:bgslideshow`, extraAttrs: `data-mode="${mode}"` })}
        <p class="hint" style="margin:.4rem 0 0">Die Vorschau oben wechselt die Bilder im Takt; „Pause bei Mauszeiger“ gilt auf der Seite für den ganzen Hero-Kasten.</p>
      </details>`;
}
// Vorschau-Diashow des Hero-Hintergrunds: wechselt das Bild der Bildebene im
// eingestellten Takt (nur der gezeigte Modus).
let hdSlideTimer = null;
function stopHdSlideshow() {
  if (hdSlideTimer !== null) clearInterval(hdSlideTimer);
  hdSlideTimer = null;
}
function startHdSlideshow(pane, lang) {
  stopHdSlideshow();
  const s = sideOf(lang, hdPrevMode);
  const layer = pane.querySelector(`[data-hdprev="${hdPrevMode}"] [data-hdimg]`);
  if (!layer) return;
  const srcs = [heroImgUrl(s.bgImage), ...bgSlidesOf(s).map((v) => heroImgUrl(v))].filter(Boolean);
  if (srcs.length < 2) return;
  let cur = 0;
  const ms = Math.max(1, (s.bgSlideshow && s.bgSlideshow.interval) || 5) * 1000;
  hdSlideTimer = setInterval(() => {
    if (!layer.isConnected) {
      stopHdSlideshow();
      return;
    }
    cur = (cur + 1) % srcs.length;
    layer.setAttribute('style', previewImageStyle(sideOf(lang, hdPrevMode), srcs[cur]));
    pane.querySelectorAll(`[data-hdslidethumb^="${hdPrevMode}:"]`).forEach((t) => {
      const i = Number(t.dataset.hdslidethumb.split(':')[1]);
      t.style.outline = i === cur - 1 ? '2px solid var(--accent)' : '';
    });
  }, ms);
}
function previewChipStyle(s, hd) {
  const bg = rgbaFromHex(s.chipBgColor, s.chipBgOpacity);
  const bd = rgbaFromHex(s.chipBorderColor, s.chipBorderOpacity);
  // Maße wie .feature-card/.feature-text auf der Seite (components.css).
  const size = hd.chipFontSize > 0 ? `${hd.chipFontSize}px` : '15.2px';
  return `background:${bg};color:${s.chipTextColor};border:1px solid ${bd};border-radius:12px;padding:13.6px 8px;font-weight:600;font-size:${size};text-align:center;${buttonTypo(hd)}`;
}
function previewCtaStyle(s, hd, lang, mode) {
  // Maße wie .hero-cta-wrap/.hero-cta-btn auf der Seite (hero.css).
  const size = hd.ctaFontSize > 0 ? `${hd.ctaFontSize}px` : '16.8px';
  const bg = rgbaFromHex(s.ctaBgColor, s.ctaBgOpacity);
  const bd =
    s.ctaBorderOpacity > 0
      ? `border:1px solid ${rgbaFromHex(s.ctaBorderColor, s.ctaBorderOpacity)};`
      : '';
  return `display:inline-block;margin-top:32px;padding:13.6px 35.2px;border-radius:50px;background:${bg};color:${s.ctaTextColor};${bd}font-weight:700;font-size:${size};cursor:pointer;${buttonTypo(hd)}${slotOverrideCss(lang, 'hero.cta', mode)}`;
}
// Feinabstimmung eines Hero-Textes (textStyles["hero.*"]) als Inline-CSS, das
// – wie auf der Seite – die allgemeinen Hero-Design-Werte überschreibt.
function slotOverrideCss(lang, key, mode) {
  const st = getTextStyle(lang, key);
  const parts = [];
  if (st.size > 0) parts.push(`font-size:${st.size}px`);
  if (st.font) parts.push(`font-family:${fontFF(st.font)}`);
  const c = st[colorKey(mode)];
  if (c) parts.push(`color:${c}`);
  return parts.concat(slotFxParts(st)).join(';');
}
function previewTitleStyle(s, hd, lang, mode) {
  // Maße wie .hero-title auf der Seite (hero.css): 2.5rem, Zeilenhöhe 1.2.
  const size = hd.titleFontSize > 0 ? `${hd.titleFontSize}px` : '40px';
  return `font-weight:800;font-size:${size};line-height:1.2;margin:0 0 12px;letter-spacing:-0.02em;color:${s.titleTextColor};${titleTypo(hd)}${slotOverrideCss(lang, 'hero.title', mode)}`;
}
function previewSubtitleStyle(s, hd, lang, mode) {
  // Maße wie .hero-subtitle auf der Seite: 1.1rem, max. 600 px breit, zentriert.
  const size = hd.subtitleFontSize > 0 ? `${hd.subtitleFontSize}px` : '17.6px';
  return `max-width:600px;margin:0 auto;font-weight:500;font-size:${size};white-space:pre-line;color:${s.titleTextColor};${titleTypo(hd)}${slotOverrideCss(lang, 'hero.subtitle', mode)}`;
}
// Typografie-CSS (Schrift + Abstand + Kontur) für Überschriften bzw. Buttons.
function titleTypo(hd) {
  const ff = fontFF(hd.titleFont);
  let css = ff ? `font-family:${ff};` : '';
  if (hd.titleLetterSpacing) css += `letter-spacing:${hd.titleLetterSpacing}px;`;
  if (hd.titleStrokeWidth > 0)
    css += `-webkit-text-stroke:${hd.titleStrokeWidth}px ${hd.titleStrokeColor};`;
  return css;
}
function buttonTypo(hd) {
  const ff = fontFF(hd.buttonFont);
  let css = ff ? `font-family:${ff};` : '';
  if (hd.buttonLetterSpacing) css += `letter-spacing:${hd.buttonLetterSpacing}px;`;
  if (hd.buttonStrokeWidth > 0)
    css += `-webkit-text-stroke:${hd.buttonStrokeWidth}px ${hd.buttonStrokeColor};`;
  return css;
}
// CSS-Regeln für den echten Hover-Effekt der Vorschau (Chips + CTA-Button), je Modus.
function hoverRuleCss(lang) {
  return MODES.map((mode) => {
    const s = sideOf(lang, mode);
    const p = `[data-hdprev="${mode}"]`;
    return (
      `${p} [data-hdchip]:hover{background:${s.chipHoverBgColor} !important;color:${s.chipHoverTextColor} !important;border-color:transparent !important}` +
      `${p} [data-hdcta]:hover{background:${s.ctaHoverBgColor} !important;color:${s.ctaHoverTextColor} !important}`
    );
  }).join('');
}
function heroPreviewNote(hd) {
  return hd.enabled
    ? '✅ Dieses Hero-Design wird auf der Seite angewandt (Hell und Dunkel getrennt).'
    : '⚠️ „Eigenes Hero-Design verwenden" ist aus – auf der Seite bleibt das Standard-Design. Die Vorschau zeigt dein eingestelltes Design.';
}

// Ein Farb-/Transparenz-Paar (Color-Picker + optional Range) als Formularzeile
// für den Modus `mode`; liest die Werte aus dem Farb-Satz `s`.
function colorField(lang, mode, field, label, withOpacity, opacityField, s) {
  const op = withOpacity
    ? `<div style="flex:1 1 160px">${sideRange(lang, mode, s, opacityField, `${label} – Transparenz`, 0, 100, '%')}</div>`
    : '';
  const picker = colorPicker({
    id: `hd:${mode}:${field}`,
    attrs: `data-hd="${field}" data-mode="${mode}" data-lang="${lang}"`,
    value: s[field],
    resetHtml: resetBtn('side', field, mode),
  });
  return `
      <div style="flex:0 0 auto">
        <label>${label}</label>
        ${picker}
      </div>${op}`;
}
// Zahlenwert eines Modus als Regler (Slider + Zahlenfeld + „↺" auf den Werkswert).
function sideRange(lang, mode, s, field, label, min, max, unit, step = 1) {
  return slider({
    id: `hd:${mode}:${field}`,
    label,
    unit,
    min,
    max,
    step,
    value: s[field],
    attrs: `data-hd="${field}" data-mode="${mode}" data-lang="${lang}"`,
    resetAttrs: `data-hdreset="side" data-hdkey="${field}" data-mode="${mode}"`,
  });
}
// Typografie-Wert (gilt für beide Modi) als Regler.
function typoRange(hd, field, label, min, max, unit, step = 1) {
  return slider({
    id: `hd:${field}`,
    label,
    unit,
    min,
    max,
    step,
    value: hd[field],
    attrs: `data-hdtypo="${field}"`,
    resetAttrs: `data-hdreset="typo" data-hdkey="${field}"`,
  });
}

// Klappbare Sektion (Details/Summary) – standardmäßig geöffnet.
function section(title, body, open = true, id = '') {
  return `<details ${open ? 'open' : ''}${id ? ` data-hdsection="${id}"` : ''} style="border-top:1px solid var(--border);margin-top:.5rem;padding-top:.4rem">
        <summary style="cursor:pointer;font-weight:600;font-size:.95rem">${title}</summary>
        <div style="padding-top:.5rem">${body}</div>
      </details>`;
}

// Effektiver Text (Override, sonst Standard der Sprache, sonst Fallback).
function effLabel(lang, path, fallback) {
  const o = getPath(state.overrides[lang], path);
  if (o != null && o !== '') return o;
  const d = getPath(state.defaults[lang], path);
  return d != null && d !== '' ? d : fallback;
}
// Hero-Text-Slot (Titel/Untertitel/Button-Text) anhand seines Stil-Schlüssels.
function heroSlot(key) {
  return HERO_TEXT_SLOTS.find((sl) => sl.key === key);
}
// Effektiver Hero-Text eines Slots für die Vorschau (Override > Standard > Fallback).
const HERO_TEXT_FALLBACK = {
  'hero.title': { de: 'Kostenlose Online-Tools', en: 'Free Online Tools' },
  'hero.subtitle': { de: 'Sichere Bearbeitung im Browser', en: 'Secure editing in the browser' },
  'hero.cta': { de: 'Jetzt starten', en: 'Get started' },
};
function heroSlotText(lang, key) {
  const fb = HERO_TEXT_FALLBACK[key] || {};
  return String(effLabel(lang, heroSlot(key).path, fb[lang] || fb.de || key));
}
// Ist für einen Hero-Text eine Feinabstimmung gesetzt (Schrift/Größe/Effekte)?
function slotTuned(st) {
  return !!(st.font || st.size > 0 || fxActive(st));
}

// Kachel-Galerie zur Wahl der GLOBALEN Basis-Schrift (sprachübergreifend, gilt
// für die ganze Seite). Jede Kachel zeigt eine Musterschrift; die aktive Kachel
// ist hervorgehoben. Erste Kachel = „Standard (System)" (setzt zurück).
function globalFontTiles() {
  const active = getGlobalFont();
  const tile = (file, label, isActive) => {
    const ff = fontFF(file); // lädt @font-face für die Vorschau (oder '')
    const sampleStyle = ff ? `font-family:${ff}` : '';
    // Muster = der Schriftname selbst, in der jeweiligen Schrift gerendert.
    // Darunter derselbe Name klein in der UI-Schrift zur sicheren Lesbarkeit.
    return `<button type="button" class="hd-fonttile${isActive ? ' active' : ''}" data-hdglobalfont="${esc(
      file,
    )}" title="Als globale Standard-Schrift der ganzen Seite aktivieren" aria-pressed="${
      isActive ? 'true' : 'false'
    }">
        <span class="hd-fonttile-sample" style="${sampleStyle}">${esc(label)}</span>
        <span class="hd-fonttile-label">${esc(label)}</span>
        ${isActive ? '<span class="hd-fonttile-badge">✓ Aktiv</span>' : ''}
      </button>`;
  };
  const tiles = [tile('', 'Standard (System)', !active)];
  for (const f of state.fonts) tiles.push(tile(f.name, f.label || f.name, f.name === active));
  return `<div class="hd-fonttiles">${tiles.join('')}</div>`;
}

// Vorschau-Box eines Modus (Titel, Untertitel, erste drei Chips, CTA).
// Einzeln ausgeblendeter Feature-Button?
function chipHidden(hd, key) {
  return Array.isArray(hd.hiddenChips) && hd.hiddenChips.includes(key);
}
// Zuletzt in der Vorschau angeklickter Button ({ kind: 'chip'|'cta', key }) –
// seine Einstellungen bleiben in Seitenleiste und Mitte markiert.
let hdSelected = null;
function previewHtml(lang, mode) {
  const hd = heroDesignOf(lang);
  const s = sideOf(lang, mode);
  const feats = featureDefs(lang);
  const chips = feats
    .map(({ key, def }) => {
      const o = getPath(state.overrides[lang], ['hero', 'features', key]);
      const label = o != null && o !== '' ? o : def || key;
      return `<div data-hdchip="${esc(key)}" role="button" tabindex="0" title="Klicken: Einstellungen dieses Buttons anzeigen" style="${previewChipStyle(s, hd)};cursor:pointer${chipHidden(hd, key) ? ';visibility:hidden' : ''}">${esc(label)}</div>`;
    })
    .join('');
  const chipCols = Math.max(1, Math.min(6, feats.length));
  return `
      <div class="tc-page" data-hdprev="${mode}" style="background:${previewBg(mode)}">
        <span class="tc-page-label">${mode === 'dark' ? 'Dunkel 🌙' : 'Hell ☀️'}</span>
        <div data-hdscroll data-tcside="hdprev" title="Hero in Originalgröße – scrollen; unten rechts in der Höhe ziehen" style="overflow:auto;height:${hdPrevHeight}px;min-height:120px;resize:vertical;border-radius:8px;overscroll-behavior:contain;scrollbar-width:thin">
        <div data-hdbox style="${previewBoxStyle(s)}">
          ${previewImageLayer(s)}
          <div class="${slotAnimClass(getTextStyle(lang, 'hero.title'))}" style="${previewTitleStyle(s, hd, lang, mode)}" data-hdtitle>${esc(heroSlotText(lang, 'hero.title'))}</div>
          <div class="${slotAnimClass(getTextStyle(lang, 'hero.subtitle'))}" style="${previewSubtitleStyle(s, hd, lang, mode)}" data-hdsub>${esc(heroSlotText(lang, 'hero.subtitle'))}</div>
          <div data-hdchips style="display:grid;grid-template-columns:repeat(${chipCols},1fr);gap:9.6px;margin-top:32px;visibility:${hd.showChips === false ? 'hidden' : 'visible'}">${chips}</div>
          <div class="${slotAnimClass(getTextStyle(lang, 'hero.cta'))}" data-hdcta role="button" tabindex="0" title="Klicken: Einstellungen des CTA-Buttons anzeigen" style="${previewCtaStyle(s, hd, lang, mode)}${hd.showCta === false ? ';visibility:hidden' : ''}">${esc(heroSlotText(lang, 'hero.cta'))}</div>
        </div>
        </div>
      </div>`;
}
// Sticky-Vorschau beider Modi (liegt direkt in .tc-main, klebt über dem ganzen Mittelteil).
// In der Sticky-Vorschau gezeigter und bearbeiteter Modus; die Seitenleiste des
// anderen Modus ist zu einer schmalen, klickbaren Leiste zugeklappt.
let hdPrevMode = 'light';
const HD_MODE_LABEL = { light: '☀️ Hell', dark: '🌙 Dunkel' };
function stickyPreview(lang) {
  const hd = heroDesignOf(lang);
  return `
    <div class="tc-sticky">
      <div style="display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;margin:.1rem 0 .3rem">
        <span class="hint" style="margin:0">👁 Live-Vorschau:</span>
        <span class="mode-switch" title="Vorschau und Seitenleiste im Hell- oder Dunkelmodus">
          ${['light', 'dark'].map((md) => `<button type="button" class="hd-reset${md === hdPrevMode ? ' active' : ''}" data-hdprevmode="${md}" aria-pressed="${md === hdPrevMode}">${HD_MODE_LABEL[md]}</button>`).join('')}
        </span>
        <span class="hint" style="margin:0"><em>Hero in Originalgröße</em> – im Rahmen scrollen (Höhe unten rechts ziehbar), <em>zum Testen über die Buttons fahren</em>; die Farben dieses Modus stehen in der offenen Seitenleiste, der andere Modus ist zugeklappt.</span>
      </div>
      <style data-hdhoverstyle>${hoverRuleCss(lang)}</style>
      <div class="tc-previews tc-previews--single">${previewHtml(lang, hdPrevMode)}</div>
      <p class="hint" data-hdnote style="margin-top:.35rem">${heroPreviewNote(hd)}</p>
    </div>`;
}

// Mitte: An-Schalter, DE→EN, Hero-Texte, Typografie, Button-Text + Beschriftungen.
function centerPanel(lang) {
  const hd = heroDesignOf(lang);
  const otherLang = lang === 'de' ? 'en' : 'de';
  const otherLabel = otherLang === 'de' ? 'Deutsch' : 'English';
  const typoBody = `
      <div class="row">
        <div style="flex:1 1 220px">
          <label>Überschriften-Schrift (Titel/Untertitel)</label>
          ${withReset(
            `<select data-hdfont="titleFont" data-lang="${lang}">${fontOptionsHtml(hd.titleFont)}</select>`,
            'font',
            'titleFont',
          )}
        </div>
      </div>
      <p class="hint" style="margin-bottom:.5rem">Aus dem Ordner <code>/fonts</code> auf dem Server. Wirkt auf beide Modi. Auch ohne „Eigenes Hero-Design" nutzbar.
        Schrift, Größe und Beschriftung der <strong>Buttons</strong> stehen in der Sektion „Buttons &amp; CTA" weiter unten; Farben in den Seitenleisten.</p>

      <p class="hint" style="margin:.6rem 0 .1rem;font-weight:600;color:var(--text)">🌐 Globale Standard-Schrift der ganzen Seite <span class="lang-badge">gilt für DE + EN</span></p>
      <p class="hint" style="margin:.1rem 0 .4rem">Eine Kachel aktivieren, um diese Schrift als Basis-Schrift der <strong>gesamten Website</strong> zu setzen (Navigation, Tool-Karten, Texte, Footer …). Wirkt sofort überall; einzelne Hero-Schriften oben überschreiben sie im Hero. „Standard (System)" setzt auf die Werksschrift zurück.</p>
      ${globalFontTiles()}

      <p class="hint" style="margin:.2rem 0">✏️ Überschriften – Buchstabenabstand &amp; Kontur (Rahmen):</p>
      <div class="row" style="align-items:flex-end">
        <div style="flex:1 1 200px">${typoRange(hd, 'titleLetterSpacing', 'Abstand', -5, 20, 'px', 0.5)}</div>
        <div style="flex:0 0 auto">
          <label>Kontur-Farbe</label>
          ${colorPicker({ id: 'hd:titleStrokeColor', attrs: 'data-hdtypo="titleStrokeColor"', value: hd.titleStrokeColor, resetHtml: resetBtn('typo', 'titleStrokeColor') })}
        </div>
        <div style="flex:1 1 200px">${typoRange(hd, 'titleStrokeWidth', 'Kontur-Breite', 0, 5, 'px', 0.5)}</div>
      </div>
      <p class="hint">Kontur-Breite 0 = keine Kontur. Buchstabenabstand 0 = normal.</p>
      <p class="hint" style="margin:.5rem 0 .2rem">🔠 Schriftgröße der Überschriften in px – leer = Standard (die Zahl im Feld ist die Standardgröße). Eine Feinabstimmung unter „Hero-Texte" geht für den jeweiligen Text vor.</p>
      <div class="row" style="align-items:flex-end">
        <div style="flex:0 0 auto">
          <label>Titel</label>
          ${withReset(
            `<input type="number" data-hdtypo="titleFontSize" min="8" max="96" step="1" placeholder="Standard ≈ 40" value="${hd.titleFontSize || ''}" style="width:120px" />`,
            'typo',
            'titleFontSize',
          )}
        </div>
        <div style="flex:0 0 auto">
          <label>Untertitel</label>
          ${withReset(
            `<input type="number" data-hdtypo="subtitleFontSize" min="8" max="96" step="1" placeholder="≈ 18" value="${hd.subtitleFontSize || ''}" style="width:100px" />`,
            'typo',
            'subtitleFontSize',
          )}
        </div>
      </div>`;

  // Text der Buttons (Feature-Chips + CTA): Schrift, Größen, Buchstabenabstand,
  // Kontur – gilt für beide Modi – plus die Beschriftungen der Chips.
  const buttonsBody = `
      <p class="hint" style="margin:0 0 .2rem;font-weight:600;color:var(--text)">✏️ Text der Buttons <span class="hint" style="font-weight:400">(gilt für beide Modi)</span></p>
      <div class="row" style="align-items:flex-end">
        <div style="flex:1 1 220px">
          <label>Schriftart (Chips + CTA-Button)</label>
          ${withReset(
            `<select data-hdfont="buttonFont" data-lang="${lang}">${fontOptionsHtml(hd.buttonFont)}</select>`,
            'font',
            'buttonFont',
          )}
        </div>
        <div style="flex:0 0 auto">
          <label>Schriftgröße Chips (px)</label>
          ${withReset(
            `<input type="number" data-hdtypo="chipFontSize" min="8" max="96" step="1" placeholder="≈ 15" value="${hd.chipFontSize || ''}" style="width:110px" />`,
            'typo',
            'chipFontSize',
          )}
        </div>
        <div style="flex:0 0 auto">
          <label>Schriftgröße CTA (px)</label>
          ${withReset(
            `<input type="number" data-hdtypo="ctaFontSize" min="8" max="96" step="1" placeholder="≈ 17" value="${hd.ctaFontSize || ''}" style="width:110px" />`,
            'typo',
            'ctaFontSize',
          )}
        </div>
      </div>
      <div class="row" style="align-items:flex-end;margin-top:.3rem">
        <div style="flex:1 1 200px">${typoRange(hd, 'buttonLetterSpacing', 'Buchstabenabstand', -5, 20, 'px', 0.5)}</div>
        <div style="flex:0 0 auto">
          <label>Kontur-Farbe</label>
          ${colorPicker({ id: 'hd:buttonStrokeColor', attrs: 'data-hdtypo="buttonStrokeColor"', value: hd.buttonStrokeColor, resetHtml: resetBtn('typo', 'buttonStrokeColor') })}
        </div>
        <div style="flex:1 1 200px">${typoRange(hd, 'buttonStrokeWidth', 'Kontur-Breite', 0, 5, 'px', 0.5)}</div>
      </div>
      <p class="hint">Schriftart, Abstand und Kontur gelten für Chips <em>und</em> CTA-Button; Größe leer = Standard. Kontur-Breite 0 = keine Kontur. Farben der Chips und des CTA-Buttons stehen in den Seitenleisten.</p>
      <p class="hint" style="margin:.6rem 0 .2rem;font-weight:600;color:var(--text)">🏷️ Beschriftungen der Chips <span class="lang-badge">${lang.toUpperCase()}</span></p>
      <p class="hint" style="margin:0 0 .2rem">Leer lassen = Standardtext der Sprachdatei. Der CTA-Text steht unter „Hero-Texte".</p>
      ${featureLabelsBody(lang)}`;

  // Buttons im Hero ein-/ausblenden (gilt für beide Modi, unabhängig vom An-Schalter).
  const chipRows = featureDefs(lang)
    .map(({ key, def }) => {
      const o = getPath(state.overrides[lang], ['hero', 'features', key]);
      const label = o != null && o !== '' ? o : def || key;
      const sel = hdSelected && hdSelected.kind === 'chip' && hdSelected.key === key;
      return `<label data-hdshowrow="chip:${esc(key)}" style="display:flex;align-items:center;gap:.4rem;color:var(--text);margin:0;padding:.15rem .35rem;border-radius:6px;${sel ? 'outline:2px solid var(--accent)' : ''}">
          <input type="checkbox" data-hdchipshow="${esc(key)}" ${chipHidden(hd, key) ? '' : 'checked'} ${hd.showChips === false ? 'disabled' : ''} style="width:auto" /> ${esc(label)}
        </label>`;
    })
    .join('');
  const ctaSel = hdSelected && hdSelected.kind === 'cta';
  const showBody = `
      <label style="display:flex;align-items:center;gap:.4rem;color:var(--text);margin:0 0 .3rem;font-weight:600">
        <input type="checkbox" data-hdshow="showChips" ${hd.showChips === false ? '' : 'checked'} style="width:auto" /> Feature-Buttons (Chips) anzeigen
      </label>
      <div class="row" data-hdchiprows style="gap:.3rem .9rem;align-items:center;margin-left:1.4rem">${chipRows}</div>
      <label data-hdshowrow="cta" style="display:flex;align-items:center;gap:.4rem;color:var(--text);margin:.5rem 0 0;padding:.15rem .35rem;border-radius:6px;font-weight:600;${ctaSel ? 'outline:2px solid var(--accent)' : ''}">
        <input type="checkbox" data-hdshow="showCta" ${hd.showCta === false ? '' : 'checked'} style="width:auto" /> CTA-Button („Jetzt starten") anzeigen
      </label>
      <p class="hint" style="margin:.4rem 0 0">Jeder Button lässt sich einzeln ausblenden; der Schalter „Feature-Buttons anzeigen“ blendet alle Chips auf einmal aus. Ausgeblendete Buttons sind auf der Seite unsichtbar und nicht anklickbar; ihr Platz bleibt erhalten, der Hero behält seine Höhe (Vorschau oben folgt sofort). Ein Klick auf einen Button in der Vorschau springt zu seinen Einstellungen. Gilt für Hell und Dunkel und unabhängig von „Eigenes Hero-Design“.</p>`;
  return `
    <div class="panel">
      <h2>Hero-Design <span class="lang-badge">${lang.toUpperCase()}</span></h2>
      <p class="hint">Gestaltet den Hero-Bereich oben auf der ${lang === 'de' ? 'deutschen' : 'englischen'} Startseite.
        Hier in der Mitte: Texte, Schriften und Typografie (gelten für beide Modi). Alle <strong>Farben</strong> je Modus stehen links (Hell) und rechts (Dunkel).
        Ausgeschaltet = Standard-Design.</p>
      <div style="display:flex;align-items:center;gap:.5rem;margin-top:.4rem">
        <label style="display:flex;align-items:center;gap:.4rem;color:var(--text);margin:0">
          <input type="checkbox" data-hd="enabled" data-lang="${lang}" ${hd.enabled ? 'checked' : ''} style="width:auto" /> Eigenes Hero-Design verwenden
        </label>
        ${resetBtn('enabled')}
      </div>

      <!-- Komplettes Hero-Design (Hell + Dunkel) in die andere Sprache übertragen -->
      <div style="margin:.6rem 0 .2rem;padding:.5rem .6rem;border:1px dashed var(--border);border-radius:8px">
        <button data-hdcopy="${otherLang}" type="button" style="width:auto" title="Alle Hero-Design-Einstellungen (Hell + Dunkel) und die Feinabstimmung der Hero-Texte in die andere Sprache übernehmen – Texte und Beschriftungen bleiben je Sprache">📋 Hero-Design nach ${otherLabel} übertragen</button>
        <p class="hint" style="margin:.35rem 0 0">Kopiert <strong>alle</strong> Hero-Design-Einstellungen (Hell + Dunkel: Schriften, Typografie, Farben, Transparenzen) sowie die Feinabstimmung der Hero-Texte (Schrift, Größe, Farbe Hell + Dunkel, Effekte) von ${lang === 'de' ? 'Deutsch' : 'English'} nach ${otherLabel}. Die <em>Texte</em> und Button-<em>Beschriftungen</em> bleiben je Sprache erhalten.</p>
      </div>

      ${section('✍️ Hero-Texte – Titel, Untertitel, Button-Text', heroTextsBody(lang))}
      ${section('🔤 Überschriften-Typografie &amp; globale Schrift <span class="hint" style="font-weight:400">(für beide Modi)</span>', typoBody)}
      ${section('👁️ Buttons ein-/ausblenden', showBody, true, 'show')}
      ${section('🔘 Buttons &amp; CTA – Text, Größen, Beschriftungen', buttonsBody, true, 'buttons')}
    </div>`;
}

// Seitenleiste eines Modus: alle Farben (Überschriften, Rahmen/Hintergrund,
// Chips, CTA) und die Textfarbe je Hero-Text mit Vorschau.
function sidePanel(lang, mode) {
  const dark = mode === 'dark';
  const s = sideOf(lang, mode);
  const headingBody = `
      <div class="row" style="align-items:flex-end">
        ${colorField(lang, mode, 'titleTextColor', 'Textfarbe (Titel &amp; Untertitel)', false, null, s)}
      </div>
      <p class="hint">Allgemeine Farbe der Überschriften; eine Farbe unter „Hero-Texte" unten geht je Text vor.</p>`;
  const frameBody = `
      <div class="row" style="align-items:flex-end">
        ${colorField(lang, mode, 'borderColor', 'Rahmenfarbe', false, null, s)}
        <div style="flex:1 1 160px">${sideRange(lang, mode, s, 'borderWidth', 'Rahmenbreite', 0, 8, 'px')}</div>
      </div>
      <div class="row" style="align-items:flex-end;margin-top:.3rem">
        ${colorField(lang, mode, 'bgColor', 'Hintergrund', true, 'bgOpacity', s)}
      </div>`;
  const imgUrl = heroImgUrl(s.bgImage);
  const imgOn = s.bgImage !== '';
  const imgStaged = s.bgImage.startsWith('staged:');
  const imgSliders = Object.entries(HERO_IMG_FIELDS)
    .map(
      ([f, c]) =>
        `<div style="flex:1 1 150px">${sideRange(lang, mode, s, f, c.label, c.min, c.max, c.unit)}</div>`,
    )
    .join('');
  const imageBody = `
      <div class="row" style="align-items:flex-start">
        <div class="bg-thumb" data-hdimgthumb="${mode}">${imgUrl ? `<img src="${esc(imgUrl)}" alt="" />` : '<span class="hint" style="margin:0">Kein Bild</span>'}</div>
        <div style="flex:1 1 160px">
          <div class="row" style="margin:0">
            <button type="button" data-hdimgpick="${mode}" style="flex:0 0 auto">📂 Mediathek</button>
            <button type="button" class="danger" data-hdimgclear="${mode}" ${imgOn ? '' : 'disabled'} style="flex:0 0 auto">Entfernen</button>
            ${resetBtn('side', 'bgImage:' + Object.keys(HERO_IMG_FIELDS).join(':') + ':bgSlides:bgSlideshow', mode)}
          </div>
          <label style="margin-top:.5rem">Bild-URL <span class="hint" style="margin:0">(/uploads/… oder https://…)</span></label>
          <input type="text" data-hdimgurl="${mode}" value="${esc(imgStaged ? '' : s.bgImage)}" placeholder="${imgStaged ? 'Lokales Medium (wird beim Veröffentlichen hochgeladen)' : '/uploads/…'}" ${imgStaged ? 'disabled' : ''} />
        </div>
      </div>
      <div class="row" style="align-items:flex-end;margin-top:.2rem;${imgOn ? '' : 'opacity:.45'}" data-hdimgrow="${mode}">
        ${imgSliders}
      </div>
      <div class="row" style="margin-top:.3rem">
        <button type="button" class="hd-reset" data-hdimgcopy="${mode}" ${imgOn ? '' : 'disabled'} title="Hintergrundbild, Bildbearbeitung und Diashow dieses Modus in den ${dark ? 'Hell' : 'Dunkel'}modus übernehmen">${dark ? '⬅️ Bild & Diashow nach Hell kopieren' : '➡️ Bild & Diashow nach Dunkel kopieren'}</button>
      </div>
      <p class="hint">Liegt hinter Titel, Buttons und Banner und wird auf den Hero-Kasten zugeschnitten (mittig). Wirkt auch ohne „Eigenes Hero-Design“. Empfehlung: <strong>1800 × 1000 px</strong> (Querformat, wichtiges Motiv in der Mitte – auf dem Handy wird links/rechts beschnitten), WebP Qualität 75–80 unter 250 KB, ruhiges Motiv ohne Text; Abdunkelung 30–50 % oder Weichzeichner 3–6 px für lesbaren Text.${imgStaged ? ' <strong>● lokal – wird beim Veröffentlichen hochgeladen.</strong>' : ''}</p>
      ${imgOn ? heroSlidesBody(mode, s) : '<p class="hint" style="margin:.3rem 0 0">🎞️ Diashow: zuerst ein Hintergrundbild wählen, dann lassen sich weitere Bilder anhängen.</p>'}`;
  const chipsBody = `
      <div class="row" style="align-items:flex-end">
        ${colorField(lang, mode, 'chipBgColor', 'Hintergrund', true, 'chipBgOpacity', s)}
      </div>
      <div class="row" style="align-items:flex-end;margin-top:.3rem">
        ${colorField(lang, mode, 'chipTextColor', 'Textfarbe', false, null, s)}
      </div>
      <div class="row" style="align-items:flex-end;margin-top:.3rem">
        ${colorField(lang, mode, 'chipBorderColor', 'Rahmenfarbe', true, 'chipBorderOpacity', s)}
      </div>
      <p class="hint" style="margin-top:.6rem">Hover (beim Überfahren):</p>
      <div class="row" style="align-items:flex-end">
        ${colorField(lang, mode, 'chipHoverBgColor', 'Hover-Hintergrund', false, null, s)}
        ${colorField(lang, mode, 'chipHoverTextColor', 'Hover-Textfarbe', false, null, s)}
      </div>`;
  const ctaBody = `
      <div class="row" style="align-items:flex-end">
        ${colorField(lang, mode, 'ctaBgColor', 'Hintergrund', true, 'ctaBgOpacity', s)}
      </div>
      <div class="row" style="align-items:flex-end;margin-top:.3rem">
        ${colorField(lang, mode, 'ctaTextColor', 'Textfarbe', false, null, s)}
      </div>
      <div class="row" style="align-items:flex-end;margin-top:.3rem">
        ${colorField(lang, mode, 'ctaBorderColor', 'Rahmenfarbe', true, 'ctaBorderOpacity', s)}
      </div>
      <p class="hint" style="margin:.2rem 0 0">Rahmen-Transparenz 0 % = kein Rahmen.</p>
      <p class="hint" style="margin-top:.6rem">Hover (beim Überfahren):</p>
      <div class="row" style="align-items:flex-end">
        ${colorField(lang, mode, 'ctaHoverBgColor', 'Hover-Hintergrund', false, null, s)}
        ${colorField(lang, mode, 'ctaHoverTextColor', 'Hover-Textfarbe', false, null, s)}
      </div>`;
  const textsBody = HERO_TEXT_SLOTS.map((sl) => {
    const st = getTextStyle(lang, sl.key);
    return `
      <div style="margin-top:.6rem;padding-top:.5rem;border-top:1px dashed var(--border)">
        <label style="margin:0 0 .3rem">${esc(sl.label)}</label>
        <div style="border:1px solid var(--border);border-radius:8px;padding:.5rem .7rem;background:${previewBg(mode)};overflow:hidden">
          <div data-txtprev="${sl.key}" data-mode="${mode}" class="${slotAnimClass(st)}" style="${slotPreviewStyle(st, mode)}">${esc(heroSlotText(lang, sl.key))}</div>
        </div>
        <label style="margin-top:.4rem">Textfarbe (${modeName(mode)})</label>
        ${colorPicker({
          id: `txt:${mode}:${sl.key}:color`,
          attrs: `data-txtcolor="${sl.key}" data-mode="${mode}"`,
          value: st[colorKey(mode)] || '#ffffff',
          resetHtml: `<button type="button" class="hd-reset" data-txtreset="${sl.key}:color" data-mode="${mode}" title="Farbe (${modeName(mode)}) zurücksetzen – es gilt die allgemeine Farbe" aria-label="Farbe zurücksetzen">↺</button>`,
        })}
      </div>`;
  }).join('');
  if (mode !== hdPrevMode)
    return `
    <aside class="tc-side tc-side--collapsed" data-tcside="${mode}" data-hdshowmode="${mode}" role="button" tabindex="0" title="${dark ? 'Dunkelmodus' : 'Hellmodus'} anzeigen und bearbeiten">
      <span style="font-size:1.3rem">${dark ? '🌙' : '☀️'}</span>
      <span class="tc-side-vlabel">${dark ? 'Dunkelmodus' : 'Hellmodus'} – anklicken zum Bearbeiten</span>
    </aside>`;
  return `
    <aside class="tc-side" data-tcside="${mode}">
      <div class="tc-side-head ${mode}">${dark ? '🌙 Dunkelmodus' : '☀️ Hellmodus'}</div>
      <div class="row" style="align-items:center;gap:.5rem;margin:.5rem 0 .2rem">
        <button type="button" class="hd-reset" data-hdcopyside="${mode}" style="flex:0 0 auto" title="Alle Farben dieses Modus (inkl. Hero-Text-Farben) in den anderen Modus übertragen">${dark ? '⬅️ Farben nach Hell kopieren' : '➡️ Farben nach Dunkel kopieren'}</button>
      </div>
      ${section('🅰️ Überschriften-Farbe', headingBody)}
      ${section('🖼️ Rahmen &amp; Hintergrund', frameBody)}
      ${section('🏞️ Hintergrundbild', imageBody)}
      ${section('🔘 Buttons (Feature-Chips)', chipsBody, true, 'chips')}
      ${section('🚀 CTA-Button („Jetzt starten")', ctaBody, true, 'cta')}
      ${section('✍️ Hero-Texte – Farbe je Text', `<p class="hint" style="margin:0">Leer (↺) = allgemeine Überschriften- bzw. CTA-Textfarbe.</p>${textsBody}`)}
    </aside>`;
}

// Gesamtlayout: Seitenleiste Hell | Mitte (Sticky-Vorschau + Panel) | Seitenleiste Dunkel.
function layoutHtml(lang) {
  return `
    <div class="tc-layout bg-collapsed-${hdPrevMode === 'light' ? 'dark' : 'light'}">
      ${sidePanel(lang, 'light')}
      <div class="tc-main">${stickyPreview(lang)}${centerPanel(lang)}</div>
      ${sidePanel(lang, 'dark')}
    </div>`;
}

// Sektion „Hero-Texte": je Slot (Titel, Untertitel, Button-Text) der Text
// (Override) und die Feinabstimmung, die für beide Modi gilt: Schriftart,
// Textgröße und Effekte (Schatten, Umriss, Deckkraft, Animation). Die
// Textfarbe je Modus steht in den Seitenleisten. Gespeichert in
// media.<lang>.textStyles["hero.*"]; auf der Seite überschreibt sie die
// allgemeinen Hero-Design-Werte nur für den jeweiligen Text.
function heroTextsBody(lang) {
  const rows = HERO_TEXT_SLOTS.map((sl) => {
    const key = sl.key;
    const cur = getPath(state.overrides[lang], sl.path);
    const def = getPath(state.defaults[lang], sl.path);
    const val = cur != null ? String(cur) : '';
    const ph = def != null ? String(def) : '';
    const st = getTextStyle(lang, key);
    const tuned = slotTuned(st);
    const rowsAttr = key === 'hero.cta' ? 1 : 2;
    return `
      <div style="margin-top:.75rem;padding-top:.6rem;border-top:1px dashed var(--border)">
        <div style="display:flex;align-items:center;gap:.6rem;flex-wrap:wrap">
          <label style="margin:0">${esc(sl.label)}</label>
          <button type="button" class="hd-reset" data-txtreset="${key}:text" title="Text auf Standard zurücksetzen" aria-label="Text zurücksetzen">↺ Text</button>
        </div>
        <textarea data-hdtxt="${key}" rows="${rowsAttr}" placeholder="${esc(ph)}" style="min-height:48px;font-size:.95rem;${txtFontFF(st.font || '')}">${esc(val)}</textarea>
        <details ${tuned ? 'open' : ''} style="margin-top:.4rem">
          <summary style="cursor:pointer;color:${tuned ? 'var(--accent)' : 'var(--muted)'};font-size:.82rem;user-select:none">Feinabstimmung – Schriftart, Größe, Effekte (beide Modi)${tuned ? ' •' : ''}</summary>
          <div class="row" style="align-items:flex-end;margin-top:.4rem">
            <div style="flex:1 1 200px">
              <label style="margin-top:0">Schriftart</label>
              <div style="display:flex;gap:.3rem;align-items:center">
                <select data-txtfont="${key}" style="${txtFontFF(st.font || '')}">${fontOptionsHtml(st.font || '')}</select>
                <button type="button" class="hd-reset" data-txtreset="${key}:font" title="Schriftart zurücksetzen" aria-label="Schriftart zurücksetzen">↺</button>
              </div>
            </div>
            <div style="flex:0 0 auto">
              <label style="margin-top:0">Textgröße (px, 0=Standard)</label>
              <div style="display:flex;gap:.3rem;align-items:center">
                <input type="number" data-txtsize="${key}" min="0" max="120" step="1" value="${st.size || 0}" style="width:120px" />
                <button type="button" class="hd-reset" data-txtreset="${key}:size" title="Auf Standard zurücksetzen" aria-label="Größe zurücksetzen">↺</button>
              </div>
            </div>
          </div>
          ${fxControls(key, st)}
        </details>
      </div>`;
  }).join('');
  return `
      <p class="hint" style="margin:0">Texte des Hero-Bereichs. Leer lassen = Standardtext der Sprachdatei; mehrere Zeilen mit Enter.
        Die <strong>Feinabstimmung</strong> je Text geht den allgemeinen Einstellungen vor; Schriftart „Standard" bzw. Größe 0 = allgemeine Einstellung.
        Die <strong>Textfarbe</strong> je Modus steht in den Seitenleisten unter „Hero-Texte – Farbe je Text"; Effekte wirken auf der veröffentlichten Seite.</p>
      ${rows}`;
}

// Beschriftungen der Buttons (Feature-Chips) – über die Overrides bearbeitbar;
// Teil der Sektion „Buttons & CTA".
function featureLabelsBody(lang) {
  return featureDefs(lang)
    .map(({ key, def }) => {
      const cur = getPath(state.overrides[lang], ['hero', 'features', key]);
      const val = cur != null ? cur : '';
      const sel = hdSelected && hdSelected.kind === 'chip' && hdSelected.key === key;
      return `<div data-hdfeatrow="${esc(key)}" style="padding:.1rem .35rem;border-radius:6px;${sel ? 'outline:2px solid var(--accent)' : ''}"><label>Button „${esc(def || key)}"</label>
        ${withReset(
          `<input data-feat="${esc(key)}" data-lang="${lang}" placeholder="${esc(def)}" value="${esc(val)}" />`,
          'feat',
          key,
        )}</div>`;
    })
    .join('');
}

// Aktualisiert beide Vorschau-Boxen (Rahmen, Chips, Titel, Untertitel, CTA
// inkl. Schriften, Texten und Feinabstimmung der Hero-Texte) und den Hinweis.
function refreshPreview(pane, lang) {
  const hd = heroDesignOf(lang);
  for (const mode of MODES) {
    const s = sideOf(lang, mode);
    const root = pane.querySelector(`[data-hdprev="${mode}"]`);
    if (!root) continue;
    const box = root.querySelector('[data-hdbox]');
    if (box) {
      box.setAttribute('style', previewBoxStyle(s));
      // Bildebene (Hintergrundbild) anlegen/aktualisieren/entfernen.
      const layerStyle = previewImageStyle(s);
      const layer = box.querySelector('[data-hdimg]');
      if (layerStyle && !layer) box.insertAdjacentHTML('afterbegin', previewImageLayer(s));
      else if (layerStyle) layer.setAttribute('style', layerStyle);
      else if (layer) layer.remove();
    }
    const chipsBox = root.querySelector('[data-hdchips]');
    if (chipsBox) chipsBox.style.visibility = hd.showChips === false ? 'hidden' : 'visible';
    const title = root.querySelector('[data-hdtitle]');
    if (title) {
      title.textContent = heroSlotText(lang, 'hero.title');
      title.setAttribute('style', previewTitleStyle(s, hd, lang, mode));
      applyAnimClass(title, getTextStyle(lang, 'hero.title'));
    }
    const sub = root.querySelector('[data-hdsub]');
    if (sub) {
      sub.textContent = heroSlotText(lang, 'hero.subtitle');
      sub.setAttribute('style', previewSubtitleStyle(s, hd, lang, mode));
      applyAnimClass(sub, getTextStyle(lang, 'hero.subtitle'));
    }
    const feats = featureDefs(lang);
    root.querySelectorAll('[data-hdchip]').forEach((c) => {
      const key = c.dataset.hdchip;
      c.setAttribute(
        'style',
        `${previewChipStyle(s, hd)};cursor:pointer${chipHidden(hd, key) ? ';visibility:hidden' : ''}`,
      );
      const f = feats.find((x) => x.key === key);
      if (f) {
        const o = getPath(state.overrides[lang], ['hero', 'features', f.key]);
        c.textContent = o != null && o !== '' ? o : f.def || f.key;
      }
    });
    const cta = root.querySelector('[data-hdcta]');
    if (cta) {
      cta.textContent = heroSlotText(lang, 'hero.cta');
      cta.setAttribute(
        'style',
        previewCtaStyle(s, hd, lang, mode) + (hd.showCta === false ? ';visibility:hidden' : ''),
      );
      applyAnimClass(cta, getTextStyle(lang, 'hero.cta'));
    }
  }
  const hs = pane.querySelector('[data-hdhoverstyle]');
  if (hs) hs.textContent = hoverRuleCss(lang);
  startHdSlideshow(pane, lang);
  const note = pane.querySelector('[data-hdnote]');
  if (note) note.textContent = heroPreviewNote(hd);
  // Markierung des gewählten Buttons erneut setzen (style-Attribute wurden ersetzt).
  applyHdSelection(pane, false);
}

// Markierung des in der Vorschau gewählten Buttons anwenden: Sektion in der
// offenen Seitenleiste aufklappen, dorthin scrollen (nur innerhalb der
// Seitenleiste) und hervorheben; in der Mitte Schalter- und Beschriftungszeile
// hervorheben. scroll=false beim Neu-Rendern (Sichtzustand wird ohnehin erhalten).
function applyHdSelection(pane, scroll = true) {
  const sel = hdSelected;
  pane.querySelectorAll('[data-hdsection]').forEach((d) => (d.style.boxShadow = ''));
  pane
    .querySelectorAll('[data-hdshowrow],[data-hdfeatrow]')
    .forEach((el) => (el.style.outline = ''));
  pane.querySelectorAll('[data-hdchip],[data-hdcta]').forEach((el) => (el.style.outline = ''));
  if (!sel) return;
  const sectionId = sel.kind === 'cta' ? 'cta' : 'chips';
  const side = pane.querySelector('.tc-side:not(.tc-side--collapsed)');
  const det = side && side.querySelector(`[data-hdsection="${sectionId}"]`);
  if (det) {
    det.open = true;
    det.style.boxShadow = '0 0 0 2px var(--accent)';
    if (scroll) {
      const top =
        det.getBoundingClientRect().top - side.getBoundingClientRect().top + side.scrollTop;
      side.scrollTo({ top: Math.max(0, top - 8), behavior: 'smooth' });
    }
  }
  const rowSel =
    sel.kind === 'cta' ? '[data-hdshowrow="cta"]' : `[data-hdshowrow="chip:${sel.key}"]`;
  pane.querySelectorAll(rowSel).forEach((el) => (el.style.outline = '2px solid var(--accent)'));
  if (sel.kind === 'chip')
    pane
      .querySelectorAll(`[data-hdfeatrow="${sel.key}"]`)
      .forEach((el) => (el.style.outline = '2px solid var(--accent)'));
  const prevSel = sel.kind === 'cta' ? '[data-hdcta]' : `[data-hdchip="${sel.key}"]`;
  pane.querySelectorAll(prevSel).forEach((el) => (el.style.outline = '3px solid var(--accent)'));
}

export function renderHeroDesign() {
  const lang = state.nav.section;
  const pane = $('#content');
  // Sichtzustand (Scroll der Seite/Seitenleisten, auf-/zugeklappte Bereiche) erhalten.
  const view = captureView(pane);
  // Vom Admin gezogene Höhe des Vorschau-Rahmens merken.
  const prevScroll = pane.querySelector('[data-hdscroll]');
  if (prevScroll) {
    const h = parseInt(prevScroll.style.height, 10);
    if (Number.isFinite(h) && h >= 120) hdPrevHeight = h;
  }
  stopHdSlideshow();
  pane.innerHTML = layoutHtml(lang);

  // Hell/Dunkel: Vorschau + bearbeitete Seitenleiste umschalten (Gegenseite klappt zu).
  const showMode = (mode) => {
    hdPrevMode = mode === 'dark' ? 'dark' : 'light';
    renderHeroDesign();
  };
  pane
    .querySelectorAll('[data-hdprevmode]')
    .forEach((b) => b.addEventListener('click', () => showMode(b.dataset.hdprevmode)));
  pane.querySelectorAll('[data-hdshowmode]').forEach((el) => {
    el.addEventListener('click', () => showMode(el.dataset.hdshowmode));
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        showMode(el.dataset.hdshowmode);
      }
    });
  });

  // Komplettes Hero-Design (Hell + Dunkel, alle Einstellungen) der aktuellen
  // Sprache in die andere übertragen. Texte und Button-Beschriftungen (Overrides)
  // bleiben je Sprache.
  pane.querySelectorAll('[data-hdcopy]').forEach((el) => {
    el.addEventListener('click', () => {
      const to = el.dataset.hdcopy === 'en' ? 'en' : 'de';
      if (to === lang) return;
      const label = to === 'de' ? 'Deutsch' : 'English';
      if (
        !confirm(
          `Alle Hero-Design-Einstellungen für ${label} werden ersetzt (Hell + Dunkel, inkl. Feinabstimmung der Hero-Texte). Die Texte selbst bleiben. Fortfahren?`,
        )
      )
        return;
      const dst = state.media[to];
      dst.heroDesign = JSON.parse(JSON.stringify(heroDesignOf(lang)));
      // Feinabstimmung der Hero-Texte (textStyles["hero.*"]) mitnehmen.
      const srcTs = state.media[lang].textStyles || {};
      if (!dst.textStyles || typeof dst.textStyles !== 'object') dst.textStyles = {};
      for (const sl of HERO_TEXT_SLOTS) {
        if (srcTs[sl.key]) dst.textStyles[sl.key] = JSON.parse(JSON.stringify(srcTs[sl.key]));
        else delete dst.textStyles[sl.key];
      }
      toast(`Hero-Design nach ${label} übertragen (Hell + Dunkel)`);
    });
  });

  // Farben eines Modus (Hero-Design-Farbsatz + Hero-Text-Farben) in den anderen kopieren.
  pane.querySelectorAll('[data-hdcopyside]').forEach((el) => {
    el.addEventListener('click', () => {
      const from = el.dataset.hdcopyside === 'dark' ? 'dark' : 'light';
      const to = from === 'dark' ? 'light' : 'dark';
      const hd = heroDesignOf(lang);
      // Farben kopieren – das Hintergrundbild des Ziel-Modus bleibt erhalten.
      const keepImg = {};
      for (const k of ['bgImage', ...Object.keys(HERO_IMG_FIELDS), 'bgSlides', 'bgSlideshow'])
        keepImg[k] = hd[to][k];
      hd[to] = { ...JSON.parse(JSON.stringify(hd[from])), ...keepImg };
      for (const sl of HERO_TEXT_SLOTS) {
        const st = getTextStyle(lang, sl.key);
        st[colorKey(to)] = st[colorKey(from)];
      }
      renderHeroDesign();
      toast(`Farben nach ${modeName(to)} kopiert`);
    });
  });

  // Design-Felder (Farben/Zahlen/Transparenz je Modus + An-Schalter).
  pane.querySelectorAll('[data-hd]').forEach((el) => {
    const field = el.dataset.hd;
    const mode = el.dataset.mode === 'dark' ? 'dark' : 'light';
    const evt = el.type === 'checkbox' ? 'change' : 'input';
    el.addEventListener(evt, () => {
      const hd = heroDesignOf(lang);
      if (field === 'enabled') {
        hd.enabled = el.checked;
      } else {
        const s = sideOf(lang, mode);
        if (field === 'borderWidth')
          s.borderWidth = Math.max(0, Math.min(8, parseInt(el.value, 10) || 0));
        else if (/Opacity$/.test(field))
          s[field] = Math.max(0, Math.min(100, parseInt(el.value, 10) || 0));
        else if (field in HERO_IMG_FIELDS) {
          const c = HERO_IMG_FIELDS[field];
          s[field] = Math.max(c.min, Math.min(c.max, parseInt(el.value, 10) || 0));
        } else s[field] = el.value; // Farben
      }
      refreshPreview(pane, lang);
    });
  });

  // Hintergrundbild je Modus: URL (Enter/Verlassen), Mediathek, Entfernen.
  pane.querySelectorAll('[data-hdimgurl]').forEach((el) => {
    const mode = el.dataset.hdimgurl === 'dark' ? 'dark' : 'light';
    el.addEventListener('change', () => {
      const s = sideOf(lang, mode);
      s.bgImage = normSiteMediaUrl(el.value);
      if (el.value.trim() && !s.bgImage)
        toast('Ungültige Bild-URL – erlaubt sind /pfad oder https://…');
      renderHeroDesign(); // Miniatur, Regler, Vorschau
    });
  });
  pane.querySelectorAll('[data-hdimgpick]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const mode = btn.dataset.hdimgpick === 'dark' ? 'dark' : 'light';
      const srv = [lang, 'shared'].reduce((n, l) => n + (state.serverFiles[l] || []).length, 0);
      if (!state.stagedItems.length && !srv) {
        toast('Keine Medien vorhanden — zuerst im Tab „Dateien" eine Datei hinzufügen.');
        return;
      }
      openMediaPicker(lang, 'heroimg', {
        imagesOnly: true,
        title: `Hintergrundbild des Hero (${modeName(mode)}) wählen`,
        onPick: (url) => {
          sideOf(lang, mode).bgImage = url;
          renderHeroDesign();
          toast('Hintergrundbild zugewiesen');
        },
      });
    }),
  );
  // Hintergrundbild + Bearbeitung + Diashow in den anderen Modus übernehmen.
  pane.querySelectorAll('[data-hdimgcopy]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const from = btn.dataset.hdimgcopy === 'dark' ? 'dark' : 'light';
      const to = from === 'dark' ? 'light' : 'dark';
      const src = sideOf(lang, from);
      const dst = sideOf(lang, to);
      for (const k of ['bgImage', ...Object.keys(HERO_IMG_FIELDS)]) dst[k] = src[k];
      dst.bgSlides = [...bgSlidesOf(src)];
      dst.bgSlideshow = { ...(src.bgSlideshow || defaultHeroBgSlideshow()) };
      hdPrevMode = to;
      renderHeroDesign();
      toast(`Hintergrundbild & Diashow nach ${modeName(to)} kopiert`);
    }),
  );
  pane.querySelectorAll('[data-hdimgclear]').forEach((btn) =>
    btn.addEventListener('click', () => {
      sideOf(lang, btn.dataset.hdimgclear === 'dark' ? 'dark' : 'light').bgImage = '';
      renderHeroDesign();
      toast('Hintergrundbild entfernt');
    }),
  );
  // Hintergrund-Diashow je Modus: Bilder anhängen / ordnen / entfernen + Einstellungen.
  const slideRef = (v) => {
    const [m, i] = String(v).split(':');
    return { mode: m === 'dark' ? 'dark' : 'light', i: Number(i) };
  };
  pane.querySelectorAll('[data-hdslideadd]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const mode = btn.dataset.hdslideadd === 'dark' ? 'dark' : 'light';
      const srv = [lang, 'shared'].reduce((n, l) => n + (state.serverFiles[l] || []).length, 0);
      if (!state.stagedItems.length && !srv) {
        toast('Keine Bilder vorhanden — zuerst im Tab „Dateien" eine Datei hinzufügen.');
        return;
      }
      openMediaPicker(lang, 'heroslide', {
        imagesOnly: true,
        title: `Weiteres Bild für die Hero-Diashow (${modeName(mode)}) wählen`,
        onPick: (url) => {
          const slides = bgSlidesOf(sideOf(lang, mode));
          if (slides.length >= BANNER_SLIDES_MAX) {
            toast(`Maximal ${BANNER_SLIDES_MAX} weitere Bilder`);
            return;
          }
          slides.push(url);
          renderHeroDesign();
          toast('Bild an die Diashow angehängt');
        },
      });
    }),
  );
  pane.querySelectorAll('[data-hdslideremove]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const { mode, i } = slideRef(btn.dataset.hdslideremove);
      bgSlidesOf(sideOf(lang, mode)).splice(i, 1);
      renderHeroDesign();
      toast('Bild aus der Diashow entfernt');
    }),
  );
  pane.querySelectorAll('[data-hdslideclear]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const mode = btn.dataset.hdslideclear === 'dark' ? 'dark' : 'light';
      if (
        !confirm('Alle weiteren Bilder aus der Hero-Diashow entfernen? Das Hintergrundbild bleibt.')
      )
        return;
      bgSlidesOf(sideOf(lang, mode)).length = 0;
      renderHeroDesign();
      toast('Diashow geleert');
    }),
  );
  const moveHdSlide = (mode, i, dir) => {
    const slides = bgSlidesOf(sideOf(lang, mode));
    const j = i + dir;
    if (j < 0 || j >= slides.length) return;
    [slides[i], slides[j]] = [slides[j], slides[i]];
    renderHeroDesign();
  };
  pane.querySelectorAll('[data-hdslideup]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const { mode, i } = slideRef(btn.dataset.hdslideup);
      moveHdSlide(mode, i, -1);
    }),
  );
  pane.querySelectorAll('[data-hdslidedown]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const { mode, i } = slideRef(btn.dataset.hdslidedown);
      moveHdSlide(mode, i, 1);
    }),
  );
  pane.querySelectorAll('[data-hdslideshow]').forEach((el) => {
    const f = el.dataset.hdslideshow;
    const mode = el.dataset.mode === 'dark' ? 'dark' : 'light';
    el.addEventListener(
      el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input',
      () => {
        const s = sideOf(lang, mode);
        if (!s.bgSlideshow || typeof s.bgSlideshow !== 'object')
          s.bgSlideshow = defaultHeroBgSlideshow();
        const ss = s.bgSlideshow;
        if (f === 'interval') {
          const n = parseInt(el.value, 10);
          ss.interval = Math.max(1, Math.min(30, Number.isFinite(n) ? n : 5));
        } else if (f === 'duration') {
          const n = parseInt(el.value, 10);
          ss.duration = Math.max(0, Math.min(5000, Number.isFinite(n) ? n : 800));
        } else if (f === 'transition')
          ss.transition = BANNER_TRANSITIONS.includes(el.value) ? el.value : 'fade';
        else if (f === 'pauseOnHover') ss.pauseOnHover = el.checked;
        else if (f === 'dots') ss.dots = el.checked;
        refreshPreview(pane, lang);
      },
    );
  });
  pane.querySelectorAll('[data-hdslideshowreset]').forEach((el) =>
    el.addEventListener('click', () => {
      const f = el.dataset.hdslideshowreset;
      const mode = el.dataset.mode === 'dark' ? 'dark' : 'light';
      const d = defaultHeroBgSlideshow();
      const s = sideOf(lang, mode);
      if (!s.bgSlideshow || typeof s.bgSlideshow !== 'object')
        s.bgSlideshow = defaultHeroBgSlideshow();
      if (f in d) s.bgSlideshow[f] = d[f];
      renderHeroDesign();
    }),
  );
  // Buttons ein-/ausblenden (Chips insgesamt, CTA) – beide Modi.
  pane.querySelectorAll('[data-hdshow]').forEach((el) => {
    el.addEventListener('change', () => {
      heroDesignOf(lang)[el.dataset.hdshow] = el.checked;
      if (el.dataset.hdshow === 'showChips')
        pane.querySelectorAll('[data-hdchipshow]').forEach((c) => (c.disabled = !el.checked));
      refreshPreview(pane, lang);
    });
  });
  // Einzelne Feature-Buttons ein-/ausblenden.
  pane.querySelectorAll('[data-hdchipshow]').forEach((el) => {
    el.addEventListener('change', () => {
      const hd = heroDesignOf(lang);
      const key = el.dataset.hdchipshow;
      const set = new Set(Array.isArray(hd.hiddenChips) ? hd.hiddenChips : []);
      if (el.checked) set.delete(key);
      else set.add(key);
      hd.hiddenChips = [...set];
      refreshPreview(pane, lang);
    });
  });
  // Klick auf einen Button in der Vorschau: Einstellungen in der offenen
  // Seitenleiste (Farben) anspringen und in der Mitte (Schalter, Beschriftung)
  // markieren – die Markierung bleibt bis zur nächsten Auswahl.
  const selectPart = (kind, key) => {
    hdSelected = { kind, key };
    applyHdSelection(pane);
  };
  pane.querySelectorAll('[data-hdchip]').forEach((c) => {
    c.addEventListener('click', () => selectPart('chip', c.dataset.hdchip));
    c.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectPart('chip', c.dataset.hdchip);
      }
    });
  });
  pane.querySelectorAll('[data-hdcta]').forEach((c) => {
    c.addEventListener('click', () => selectPart('cta', ''));
    c.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectPart('cta', '');
      }
    });
  });

  // Schriftauswahl (Überschriften / Buttons) – gilt für beide Modi.
  pane.querySelectorAll('[data-hdfont]').forEach((el) => {
    el.addEventListener('change', () => {
      heroDesignOf(lang)[el.dataset.hdfont] = el.value;
      refreshPreview(pane, lang);
    });
  });

  // Typografie (Buchstabenabstand + Kontur + Größen) – gilt für beide Modi.
  pane.querySelectorAll('[data-hdtypo]').forEach((el) => {
    el.addEventListener('input', () => {
      const hd = heroDesignOf(lang);
      const f = el.dataset.hdtypo;
      if (/LetterSpacing$/.test(f))
        hd[f] = Math.max(-5, Math.min(20, Math.round((parseFloat(el.value) || 0) * 2) / 2));
      else if (/StrokeWidth$/.test(f))
        hd[f] = Math.max(0, Math.min(5, Math.round((parseFloat(el.value) || 0) * 2) / 2));
      else if (/FontSize$/.test(f)) {
        const n = parseInt(el.value, 10);
        hd[f] = Number.isFinite(n) && n > 0 ? Math.max(8, Math.min(96, n)) : 0;
      } else hd[f] = el.value; // Kontur-Farbe
      refreshPreview(pane, lang);
    });
  });

  // Globale Basis-Schrift per Kachel wählen (sprachübergreifend). Aktiviert die
  // Schrift für die ganze Seite; leere Kachel = Standard (System).
  pane.querySelectorAll('[data-hdglobalfont]').forEach((el) => {
    el.addEventListener('click', () => {
      const name = el.dataset.hdglobalfont || '';
      setGlobalFont(name);
      // Ausgewählte Schrift auch in die Hero-Schrift-Dropdowns übernehmen (DE+EN),
      // damit die Auswahl konsistent sichtbar ist und keine Verwirrung entsteht.
      // '' (Standard) setzt beide Dropdowns wieder auf „Standard (System)".
      for (const l of MEDIA_LANGS) {
        const hd = heroDesignOf(l);
        hd.titleFont = name;
        hd.buttonFont = name;
      }
      renderHeroDesign();
      toast(name ? 'Globale Schrift aktiviert' : 'Globale Schrift auf Standard zurückgesetzt');
    });
  });

  // Zurücksetzen-Buttons (↺): setzen genau ein Feld auf den Standard zurück
  // und rendern das Panel neu (Eingabefelder + Vorschau aktualisieren sich).
  pane.querySelectorAll('[data-hdreset]').forEach((el) => {
    el.addEventListener('click', () => {
      const scope = el.dataset.hdreset;
      const key = el.dataset.hdkey || '';
      const mode = el.dataset.mode === 'dark' ? 'dark' : 'light';
      if (scope === 'enabled') {
        heroDesignOf(lang).enabled = defaultHeroDesign().enabled;
      } else if (scope === 'side') {
        const s = sideOf(lang, mode);
        const def = sideDefault(mode);
        // "farbe:transparenz" -> beide Werte zurücksetzen.
        key.split(':').forEach((f) => {
          if (f in def) s[f] = def[f];
        });
      } else if (scope === 'typo' || scope === 'font') {
        const def = defaultHeroDesign();
        if (key in def) heroDesignOf(lang)[key] = def[key];
      } else if (scope === 'feat') {
        delPath(state.overrides[lang], ['hero', 'features', key]);
      }
      renderHeroDesign();
      toast('Auf Standard zurückgesetzt');
    });
  });

  // ---- Hero-Texte (Titel/Untertitel/Button-Text) + Feinabstimmung je Text ----
  // Slot-Vorschau eines Hero-Textes in beiden Seitenleisten aktualisieren.
  const updateSlotPrev = (key) => {
    for (const mode of MODES) {
      const el = pane.querySelector(`[data-txtprev="${key}"][data-mode="${mode}"]`);
      if (el) updateSlotPreview(el, getTextStyle(lang, key), mode, heroSlotText(lang, key));
    }
  };
  const refreshSlot = (key) => {
    updateSlotPrev(key);
    refreshPreview(pane, lang);
  };
  // Text (Override; leer = Standardtext).
  pane.querySelectorAll('[data-hdtxt]').forEach((el) => {
    const key = el.dataset.hdtxt;
    const sl = heroSlot(key);
    el.addEventListener('input', () => {
      const v = el.value;
      if (v.trim() === '') delPath(state.overrides[lang], sl.path);
      else setPath(state.overrides[lang], sl.path, v);
      refreshSlot(key);
    });
  });
  // Schriftart je Text (Feld-Vorschau folgt der Auswahl).
  pane.querySelectorAll('[data-txtfont]').forEach((el) => {
    const key = el.dataset.txtfont;
    el.addEventListener('change', () => {
      getTextStyle(lang, key).font = el.value;
      const ff = txtFontFF(el.value);
      el.setAttribute('style', ff);
      const ta = pane.querySelector(`[data-hdtxt="${key}"]`);
      if (ta) ta.setAttribute('style', `min-height:48px;font-size:.95rem;${ff}`);
      refreshSlot(key);
    });
  });
  // Textgröße (0 = allgemeine Einstellung) – beide Modi.
  pane.querySelectorAll('[data-txtsize]').forEach((el) => {
    const key = el.dataset.txtsize;
    el.addEventListener('input', () => {
      const n = parseInt(el.value, 10);
      getTextStyle(lang, key).size = Number.isFinite(n) ? Math.max(0, Math.min(120, n)) : 0;
      refreshSlot(key);
    });
  });
  // Textfarbe je Text und Modus (Seitenleisten).
  pane.querySelectorAll('[data-txtcolor]').forEach((el) => {
    const key = el.dataset.txtcolor;
    const mode = el.dataset.mode === 'dark' ? 'dark' : 'light';
    el.addEventListener('input', () => {
      getTextStyle(lang, key)[colorKey(mode)] = el.value;
      refreshSlot(key);
    });
  });
  // Effekte (Schatten, Umriss, Deckkraft, Animation) je Text.
  bindFxControls(pane, (key) => getTextStyle(lang, key), refreshSlot);
  // ↺ je Text: Text, Schriftart, Größe, Farbe (Modus) oder Effekte zurücksetzen.
  pane.querySelectorAll('[data-txtreset]').forEach((el) => {
    const i = el.dataset.txtreset.lastIndexOf(':');
    const key = el.dataset.txtreset.slice(0, i);
    const what = el.dataset.txtreset.slice(i + 1);
    const mode = el.dataset.mode === 'dark' ? 'dark' : 'light';
    const sl = heroSlot(key);
    if (!sl) return;
    el.addEventListener('click', () => {
      const st = getTextStyle(lang, key);
      if (what === 'text') delPath(state.overrides[lang], sl.path);
      else if (what === 'size') st.size = 0;
      else if (what === 'color') st[colorKey(mode)] = '';
      else if (what === 'fx') Object.assign(st, TEXT_FX_DEFAULTS);
      else if (what === 'font') st.font = '';
      renderHeroDesign();
      toast('Auf Standard zurückgesetzt');
    });
  });

  // Button-Beschriftungen (schreiben in die Overrides).
  pane.querySelectorAll('[data-feat]').forEach((el) => {
    const key = el.dataset.feat;
    el.addEventListener('input', () => {
      const v = el.value;
      if (v.trim() === '') delPath(state.overrides[lang], ['hero', 'features', key]);
      else setPath(state.overrides[lang], ['hero', 'features', key], v);
      refreshPreview(pane, lang);
    });
  });

  // Schriftarten-Galerie beim Öffnen zur aktuell aktiven Schrift scrollen, damit
  // die gewählte Standardschrift sofort sichtbar ist (nur innerhalb der Galerie,
  // ohne die ganze Seite zu scrollen).
  const gallery = pane.querySelector('.hd-fonttiles');
  const activeTile = gallery && gallery.querySelector('.hd-fonttile.active');
  if (gallery && activeTile) {
    const gr = gallery.getBoundingClientRect();
    const tr = activeTile.getBoundingClientRect();
    const centered = tr.top - gr.top - (gallery.clientHeight - activeTile.clientHeight) / 2;
    gallery.scrollTop = Math.max(0, gallery.scrollTop + centered);
  }
  bindSliders(pane); // nach den Feld-Handlern: Zahlenfeld löst deren input-Event aus
  bindColorPickers(pane);
  restoreView(pane, view);
  applyHdSelection(pane, false);
  startHdSlideshow(pane, lang);
}
