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
} from './model.js';
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
  return `${base}background:${bg};border:${s.borderWidth}px solid ${s.borderColor};border-radius:1rem;padding:1.1rem 1rem;text-align:center`;
}
function previewChipStyle(s, hd) {
  const bg = rgbaFromHex(s.chipBgColor, s.chipBgOpacity);
  const bd = rgbaFromHex(s.chipBorderColor, s.chipBorderOpacity);
  const size = hd.chipFontSize > 0 ? `${hd.chipFontSize}px` : '.78rem';
  return `background:${bg};color:${s.chipTextColor};border:1px solid ${bd};border-radius:.6rem;padding:.5rem .3rem;font-weight:600;font-size:${size};text-align:center;${buttonTypo(hd)}`;
}
function previewCtaStyle(s, hd, lang, mode) {
  const size = hd.ctaFontSize > 0 ? `${hd.ctaFontSize}px` : '.9rem';
  const bg = rgbaFromHex(s.ctaBgColor, s.ctaBgOpacity);
  const bd =
    s.ctaBorderOpacity > 0
      ? `border:1px solid ${rgbaFromHex(s.ctaBorderColor, s.ctaBorderOpacity)};`
      : '';
  return `display:inline-block;margin-top:.9rem;padding:.55rem 1.6rem;border-radius:50px;background:${bg};color:${s.ctaTextColor};${bd}font-weight:700;font-size:${size};cursor:pointer;${buttonTypo(hd)}${slotOverrideCss(lang, 'hero.cta', mode)}`;
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
  const size = hd.titleFontSize > 0 ? `${hd.titleFontSize}px` : '1.1rem';
  return `font-weight:800;font-size:${size};color:${s.titleTextColor};${titleTypo(hd)}${slotOverrideCss(lang, 'hero.title', mode)}`;
}
function previewSubtitleStyle(s, hd, lang, mode) {
  const size = hd.subtitleFontSize > 0 ? `${hd.subtitleFontSize}px` : '.8rem';
  return `margin-top:.3rem;font-weight:500;font-size:${size};opacity:.85;white-space:pre-line;color:${s.titleTextColor};${titleTypo(hd)}${slotOverrideCss(lang, 'hero.subtitle', mode)}`;
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
function section(title, body, open = true) {
  return `<details ${open ? 'open' : ''} style="border-top:1px solid var(--border);margin-top:.5rem;padding-top:.4rem">
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
function previewHtml(lang, mode) {
  const hd = heroDesignOf(lang);
  const s = sideOf(lang, mode);
  const chips = featureDefs(lang)
    .slice(0, 3)
    .map(({ key, def }) => {
      const o = getPath(state.overrides[lang], ['hero', 'features', key]);
      const label = o != null && o !== '' ? o : def || key;
      return `<div data-hdchip style="${previewChipStyle(s, hd)}">${esc(label)}</div>`;
    })
    .join('');
  return `
      <div class="tc-page" data-hdprev="${mode}" style="background:${previewBg(mode)}">
        <span class="tc-page-label">${mode === 'dark' ? 'Dunkel 🌙' : 'Hell ☀️'}</span>
        <div data-hdbox style="${previewBoxStyle(s)}">
          <div class="${slotAnimClass(getTextStyle(lang, 'hero.title'))}" style="${previewTitleStyle(s, hd, lang, mode)}" data-hdtitle>${esc(heroSlotText(lang, 'hero.title'))}</div>
          <div class="${slotAnimClass(getTextStyle(lang, 'hero.subtitle'))}" style="${previewSubtitleStyle(s, hd, lang, mode)}" data-hdsub>${esc(heroSlotText(lang, 'hero.subtitle'))}</div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.5rem;margin-top:.9rem">${chips}</div>
          <div class="${slotAnimClass(getTextStyle(lang, 'hero.cta'))}" data-hdcta style="${previewCtaStyle(s, hd, lang, mode)}">${esc(heroSlotText(lang, 'hero.cta'))}</div>
        </div>
      </div>`;
}
// Sticky-Vorschau beider Modi (liegt direkt in .tc-main, klebt über dem ganzen Mittelteil).
function stickyPreview(lang) {
  const hd = heroDesignOf(lang);
  return `
    <div class="tc-sticky">
      <p class="hint" style="margin:.1rem 0 .3rem">Live-Vorschau Hell + Dunkel <em>(zum Testen über die Buttons fahren)</em>. Farben je Modus stehen links (Hell) und rechts (Dunkel).</p>
      <style data-hdhoverstyle>${hoverRuleCss(lang)}</style>
      <div class="tc-previews">${previewHtml(lang, 'light')}${previewHtml(lang, 'dark')}</div>
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
      ${section('🔘 Buttons &amp; CTA – Text, Größen, Beschriftungen', buttonsBody)}
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
  return `
    <aside class="tc-side" data-tcside="${mode}">
      <div class="tc-side-head ${mode}">${dark ? '🌙 Dunkelmodus' : '☀️ Hellmodus'}</div>
      <div class="row" style="align-items:center;gap:.5rem;margin:.5rem 0 .2rem">
        <button type="button" class="hd-reset" data-hdcopyside="${mode}" style="flex:0 0 auto" title="Alle Farben dieses Modus (inkl. Hero-Text-Farben) in den anderen Modus übertragen">${dark ? '⬅️ Farben nach Hell kopieren' : '➡️ Farben nach Dunkel kopieren'}</button>
      </div>
      ${section('🅰️ Überschriften-Farbe', headingBody)}
      ${section('🖼️ Rahmen &amp; Hintergrund', frameBody)}
      ${section('🔘 Buttons (Feature-Chips)', chipsBody)}
      ${section('🚀 CTA-Button („Jetzt starten")', ctaBody)}
      ${section('✍️ Hero-Texte – Farbe je Text', `<p class="hint" style="margin:0">Leer (↺) = allgemeine Überschriften- bzw. CTA-Textfarbe.</p>${textsBody}`)}
    </aside>`;
}

// Gesamtlayout: Seitenleiste Hell | Mitte (Sticky-Vorschau + Panel) | Seitenleiste Dunkel.
function layoutHtml(lang) {
  return `
    <div class="tc-layout">
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
      return `<label>Button „${esc(def || key)}"</label>
        ${withReset(
          `<input data-feat="${esc(key)}" data-lang="${lang}" placeholder="${esc(def)}" value="${esc(val)}" />`,
          'feat',
          key,
        )}`;
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
    if (box) box.setAttribute('style', previewBoxStyle(s));
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
    root.querySelectorAll('[data-hdchip]').forEach((c, i) => {
      c.setAttribute('style', previewChipStyle(s, hd));
      const f = feats[i];
      if (f) {
        const o = getPath(state.overrides[lang], ['hero', 'features', f.key]);
        c.textContent = o != null && o !== '' ? o : f.def || f.key;
      }
    });
    const cta = root.querySelector('[data-hdcta]');
    if (cta) {
      cta.textContent = heroSlotText(lang, 'hero.cta');
      cta.setAttribute('style', previewCtaStyle(s, hd, lang, mode));
      applyAnimClass(cta, getTextStyle(lang, 'hero.cta'));
    }
  }
  const hs = pane.querySelector('[data-hdhoverstyle]');
  if (hs) hs.textContent = hoverRuleCss(lang);
  const note = pane.querySelector('[data-hdnote]');
  if (note) note.textContent = heroPreviewNote(hd);
}

export function renderHeroDesign() {
  const lang = state.nav.section;
  const pane = $('#content');
  // Sichtzustand (Scroll der Seite/Seitenleisten, auf-/zugeklappte Bereiche) erhalten.
  const view = captureView(pane);
  pane.innerHTML = layoutHtml(lang);

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
      hd[to] = JSON.parse(JSON.stringify(hd[from]));
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
        else s[field] = el.value; // Farben
      }
      refreshPreview(pane, lang);
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
}
