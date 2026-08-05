// Hero-Design-Tab (eine Sprache): Rahmen, Hintergrund und die Buttons
// (Feature-Chips) des Hero-Bereichs gestalten – getrennt für Hell- und
// Dunkelmodus – samt Live-Vorschau, plus die Button-Beschriftungen. Styling
// wird in media.<lang>.heroDesign (mit .light/.dark) gespeichert; die
// Beschriftungen laufen über die vorhandenen Overrides (hero.features.*).

import { $, esc } from './core.js';
import { state, rgbaFromHex, defaultHeroDesign, getPath, setPath, delPath } from './model.js';
import { ensureFontFace, fontOptionsHtml } from './fonts.js';

// Family-CSS für eine Schriftdatei (lädt @font-face für die Vorschau) oder ''.
function fontFF(file) {
  return file ? `"${ensureFontFace(file)}", system-ui, sans-serif` : '';
}

// Aktuell im Editor bearbeiteter Modus (UI-Zustand, nicht gespeichert).
let editTheme = 'light';

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
// Der aktuell bearbeitete Farb-Satz (Hell oder Dunkel).
function sideOf(lang) {
  return heroDesignOf(lang)[editTheme];
}

// Inline-Style der Vorschau-Box (zeigt die Werte des bearbeiteten Modus).
function previewBoxStyle(s) {
  const bg = rgbaFromHex(s.bgColor, s.bgOpacity);
  return `background:${bg};border:${s.borderWidth}px solid ${s.borderColor};border-radius:1rem;padding:1.1rem 1rem;text-align:center`;
}
function previewChipStyle(s, extra) {
  const bg = rgbaFromHex(s.chipBgColor, s.chipBgOpacity);
  const bd = rgbaFromHex(s.chipBorderColor, s.chipBorderOpacity);
  return `background:${bg};color:${s.chipTextColor};border:1px solid ${bd};border-radius:.6rem;padding:.5rem .3rem;font-weight:600;font-size:.78rem;text-align:center;${extra || ''}`;
}
function previewCtaStyle(s, extra) {
  return `display:inline-block;margin-top:.9rem;padding:.55rem 1.6rem;border-radius:50px;background:${s.ctaBgColor};color:${s.ctaTextColor};font-weight:700;font-size:.9rem;cursor:pointer;${extra || ''}`;
}
function previewTitleStyle(s, hd) {
  return `font-weight:800;font-size:1.1rem;color:${s.chipTextColor};${titleTypo(hd)}`;
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
// CSS-Regeln für den echten Hover-Effekt der Vorschau (Chips + CTA-Button).
function hoverRuleCss(s) {
  return (
    `[data-hdprev] [data-hdchip]:hover{background:${s.chipHoverBgColor} !important;color:${s.chipHoverTextColor} !important;border-color:transparent !important}` +
    `[data-hdprev] [data-hdcta]:hover{background:${s.ctaHoverBgColor} !important;color:${s.ctaHoverTextColor} !important}`
  );
}
function heroPreviewNote(hd) {
  return hd.enabled
    ? '✅ Dieses Hero-Design wird auf der Seite angewandt (Hell und Dunkel getrennt).'
    : '⚠️ „Eigenes Hero-Design verwenden" ist aus – auf der Seite bleibt das Standard-Design. Die Vorschau zeigt dein eingestelltes Design.';
}

// Ein Farb-/Transparenz-Paar (Color-Picker + optional Range) als Formularzeile.
// Liest die Werte aus dem aktuell bearbeiteten Farb-Satz `s`.
function colorField(lang, field, label, withOpacity, opacityField, s) {
  const op = withOpacity
    ? `<div style="flex:1 1 160px">
        <label>${label} – Transparenz: <span data-hdoval="${opacityField}">${s[opacityField]}</span>%</label>
        <input type="range" data-hd="${opacityField}" data-lang="${lang}" min="0" max="100" value="${s[opacityField]}" style="width:100%" />
      </div>`
    : '';
  return `
      <div style="flex:0 0 auto">
        <label>${label}</label>
        <input type="color" data-hd="${field}" data-lang="${lang}" value="${esc(s[field])}" style="width:56px;height:38px;padding:2px" />
      </div>${op}`;
}

// Umschalter Hell/Dunkel für den bearbeiteten Modus.
function themeSwitch() {
  const btn = (key, label) =>
    `<button data-hdtheme="${key}" class="${editTheme === key ? 'primary' : ''}" style="flex:0 0 auto">${label}</button>`;
  return `
      <div class="row" style="gap:.4rem;margin:.9rem 0 .2rem;align-items:center">
        <span class="hint" style="margin:0">Modus bearbeiten:</span>
        ${btn('light', '☀️ Hell')}
        ${btn('dark', '🌙 Dunkel')}
      </div>
      <p class="hint" style="margin:.1rem 0 .4rem">Hell- und Dunkelmodus werden getrennt gespeichert. Wechsle oben, um den jeweils anderen Modus zu gestalten.</p>`;
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

function heroDesignPanel(lang) {
  const hd = heroDesignOf(lang);
  const s = sideOf(lang);
  const modusLabel = editTheme === 'light' ? 'Hell ☀️' : 'Dunkel 🌙';
  // Vorschau in der bearbeiteten Sprache (Titel, erste drei Chips, CTA).
  const previewTitle = effLabel(
    lang,
    ['hero', 'title'],
    lang === 'de' ? 'Kostenlose Online-Tools' : 'Free Online Tools',
  );
  const previewCta = effLabel(
    lang,
    ['hero', 'cta'],
    lang === 'de' ? 'Jetzt starten' : 'Get started',
  );
  const btnExtra = buttonTypo(hd);
  const chips = featureDefs(lang)
    .slice(0, 3)
    .map(({ key, def }) => {
      const o = getPath(state.overrides[lang], ['hero', 'features', key]);
      const label = o != null && o !== '' ? o : def || key;
      return `<div data-hdchip style="${previewChipStyle(s, btnExtra)}">${esc(label)}</div>`;
    })
    .join('');
  // Bausteine der klappbaren Sektionen.
  const typoBody = `
      <div class="row">
        <div style="flex:1 1 220px">
          <label>Überschriften-Schrift (Titel/Untertitel)</label>
          <select data-hdfont="titleFont" data-lang="${lang}">${fontOptionsHtml(hd.titleFont)}</select>
        </div>
        <div style="flex:1 1 220px">
          <label>Button-Schrift (Chips + „Jetzt starten")</label>
          <select data-hdfont="buttonFont" data-lang="${lang}">${fontOptionsHtml(hd.buttonFont)}</select>
        </div>
      </div>
      <p class="hint" style="margin-bottom:.5rem">Aus dem Ordner <code>/fonts</code> auf dem Server. Wirkt auf beide Modi. Auch ohne „Eigenes Hero-Design" nutzbar.</p>
      <p class="hint" style="margin:.2rem 0">✏️ Überschriften – Buchstabenabstand &amp; Kontur (Rahmen):</p>
      <div class="row" style="align-items:flex-end">
        <div style="flex:0 0 auto">
          <label>Abstand (px)</label>
          <input type="number" data-hdtypo="titleLetterSpacing" min="-5" max="20" step="0.5" value="${hd.titleLetterSpacing}" style="width:90px" />
        </div>
        <div style="flex:0 0 auto">
          <label>Kontur-Farbe</label>
          <input type="color" data-hdtypo="titleStrokeColor" value="${esc(hd.titleStrokeColor)}" style="width:56px;height:38px;padding:2px" />
        </div>
        <div style="flex:0 0 auto">
          <label>Kontur-Breite (px)</label>
          <input type="number" data-hdtypo="titleStrokeWidth" min="0" max="5" step="0.5" value="${hd.titleStrokeWidth}" style="width:90px" />
        </div>
      </div>
      <p class="hint" style="margin:.5rem 0 .2rem">✏️ Buttons – Buchstabenabstand &amp; Kontur (Rahmen):</p>
      <div class="row" style="align-items:flex-end">
        <div style="flex:0 0 auto">
          <label>Abstand (px)</label>
          <input type="number" data-hdtypo="buttonLetterSpacing" min="-5" max="20" step="0.5" value="${hd.buttonLetterSpacing}" style="width:90px" />
        </div>
        <div style="flex:0 0 auto">
          <label>Kontur-Farbe</label>
          <input type="color" data-hdtypo="buttonStrokeColor" value="${esc(hd.buttonStrokeColor)}" style="width:56px;height:38px;padding:2px" />
        </div>
        <div style="flex:0 0 auto">
          <label>Kontur-Breite (px)</label>
          <input type="number" data-hdtypo="buttonStrokeWidth" min="0" max="5" step="0.5" value="${hd.buttonStrokeWidth}" style="width:90px" />
        </div>
      </div>
      <p class="hint">Kontur-Breite 0 = keine Kontur. Buchstabenabstand 0 = normal.</p>`;

  const frameBody = `
      <div class="row" style="align-items:flex-end">
        ${colorField(lang, 'borderColor', 'Rahmenfarbe', false, null, s)}
        <div style="flex:0 0 auto">
          <label>Rahmenbreite (px)</label>
          <input type="number" data-hd="borderWidth" data-lang="${lang}" min="0" max="8" step="1" value="${s.borderWidth}" style="width:90px" />
        </div>
        ${colorField(lang, 'bgColor', 'Hintergrund', true, 'bgOpacity', s)}
      </div>`;

  const chipsBody = `
      <div class="row" style="align-items:flex-end">
        ${colorField(lang, 'chipBgColor', 'Hintergrund', true, 'chipBgOpacity', s)}
        ${colorField(lang, 'chipTextColor', 'Textfarbe', false, null, s)}
        ${colorField(lang, 'chipBorderColor', 'Rahmenfarbe', true, 'chipBorderOpacity', s)}
      </div>
      <p class="hint" style="margin-top:.6rem">Hover (beim Überfahren) – zwei Farben:</p>
      <div class="row" style="align-items:flex-end">
        ${colorField(lang, 'chipHoverBgColor', 'Hover-Hintergrund', false, null, s)}
        ${colorField(lang, 'chipHoverTextColor', 'Hover-Textfarbe', false, null, s)}
      </div>`;

  const ctaBody = `
      <div class="row" style="align-items:flex-end">
        ${colorField(lang, 'ctaBgColor', 'Hintergrund', false, null, s)}
        ${colorField(lang, 'ctaTextColor', 'Textfarbe', false, null, s)}
      </div>
      <p class="hint" style="margin-top:.6rem">Hover (beim Überfahren) – zwei Farben:</p>
      <div class="row" style="align-items:flex-end">
        ${colorField(lang, 'ctaHoverBgColor', 'Hover-Hintergrund', false, null, s)}
        ${colorField(lang, 'ctaHoverTextColor', 'Hover-Textfarbe', false, null, s)}
      </div>`;

  const badge = `<span class="lang-badge">${modusLabel}</span>`;
  return `
    <div class="panel">
      <h2>Hero-Design <span class="lang-badge">${lang.toUpperCase()}</span></h2>
      <p class="hint">Gestaltet den Hero-Bereich oben auf der ${lang === 'de' ? 'deutschen' : 'englischen'} Startseite –
        getrennt für Hell- und Dunkelmodus. Ausgeschaltet = Standard-Design. Sektionen zum Fokussieren zuklappen; die Vorschau bleibt oben sichtbar.</p>
      <label style="display:flex;align-items:center;gap:.4rem;color:var(--text);margin-top:.4rem">
        <input type="checkbox" data-hd="enabled" data-lang="${lang}" ${hd.enabled ? 'checked' : ''} style="width:auto" /> Eigenes Hero-Design verwenden
      </label>

      <!-- Vorschau bleibt beim Scrollen oben sichtbar -->
      <div style="position:sticky;top:.5rem;z-index:5;background:var(--panel);border:1px solid var(--border);border-radius:10px;padding:.55rem .7rem;margin:.6rem 0 .8rem;box-shadow:0 6px 18px rgba(0,0,0,.35)">
        ${themeSwitch()}
        <p class="hint" style="margin:.1rem 0 .3rem">Vorschau (${modusLabel}) <em>(zum Testen über die Buttons fahren)</em>:</p>
        <style data-hdhoverstyle>${hoverRuleCss(s)}</style>
        <div data-hdprev style="${previewBoxStyle(s)}">
          <div style="${previewTitleStyle(s, hd)}" data-hdtitle>${esc(previewTitle)}</div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.5rem;margin-top:.9rem">${chips}</div>
          <div data-hdcta style="${previewCtaStyle(s, btnExtra)}">${esc(previewCta)}</div>
        </div>
        <p class="hint" data-hdnote style="margin-top:.35rem">${heroPreviewNote(hd)}</p>
      </div>

      ${section('🔤 Schriften &amp; Typografie <span class="hint" style="font-weight:400">(für beide Modi)</span>', typoBody)}
      ${section(`🖼️ Rahmen &amp; Hintergrund ${badge}`, frameBody)}
      ${section(`🔘 Buttons (Feature-Chips) ${badge}`, chipsBody)}
      ${section(`🚀 CTA-Button („Jetzt starten") ${badge}`, ctaBody)}
    </div>

    ${featureLabelsPanel(lang)}`;
}

// Beschriftungen der Buttons (Feature-Chips) – über die Overrides bearbeitbar.
function featureLabelsPanel(lang) {
  const rows = featureDefs(lang)
    .map(({ key, def }) => {
      const cur = getPath(state.overrides[lang], ['hero', 'features', key]);
      const val = cur != null ? cur : '';
      return `<label>Button „${esc(def || key)}"</label>
        <input data-feat="${esc(key)}" data-lang="${lang}" placeholder="${esc(def)}" value="${esc(val)}" />`;
    })
    .join('');
  return `
    <div class="panel">
      <details open>
        <summary style="cursor:pointer;font-weight:600">Button-Beschriftungen <span class="lang-badge">${lang.toUpperCase()}</span></summary>
        <p class="hint">Text der Feature-Buttons (gilt für beide Modi). Leer lassen = Standardtext.</p>
        ${rows}
      </details>
    </div>`;
}

// Aktualisiert Vorschau-Box, Chips, Titel, CTA (inkl. Schriften) und Hinweis.
function refreshPreview(pane, lang) {
  const hd = heroDesignOf(lang);
  const s = sideOf(lang);
  const btnExtra = buttonTypo(hd);
  const box = pane.querySelector('[data-hdprev]');
  if (box) box.setAttribute('style', previewBoxStyle(s));
  const title = pane.querySelector('[data-hdtitle]');
  if (title) title.setAttribute('style', previewTitleStyle(s, hd));
  pane
    .querySelectorAll('[data-hdchip]')
    .forEach((c) => c.setAttribute('style', previewChipStyle(s, btnExtra)));
  const cta = pane.querySelector('[data-hdcta]');
  if (cta) cta.setAttribute('style', previewCtaStyle(s, btnExtra));
  const hs = pane.querySelector('[data-hdhoverstyle]');
  if (hs) hs.textContent = hoverRuleCss(s);
  const note = pane.querySelector('[data-hdnote]');
  if (note) note.textContent = heroPreviewNote(hd);
}

export function renderHeroDesign() {
  const lang = state.nav.section;
  const pane = $('#content');
  pane.innerHTML = heroDesignPanel(lang);

  // Modus-Umschalter (Hell/Dunkel) -> neu rendern für den anderen Farb-Satz.
  pane.querySelectorAll('[data-hdtheme]').forEach((el) => {
    el.addEventListener('click', () => {
      editTheme = el.dataset.hdtheme === 'dark' ? 'dark' : 'light';
      renderHeroDesign();
    });
  });

  // Design-Felder (Farben/Zahlen/Transparenz + An-Schalter).
  pane.querySelectorAll('[data-hd]').forEach((el) => {
    const field = el.dataset.hd;
    const evt = el.type === 'checkbox' ? 'change' : 'input';
    el.addEventListener(evt, () => {
      const hd = heroDesignOf(lang);
      if (field === 'enabled') {
        hd.enabled = el.checked;
      } else {
        const s = sideOf(lang);
        if (field === 'borderWidth')
          s.borderWidth = Math.max(0, Math.min(8, parseInt(el.value, 10) || 0));
        else if (/Opacity$/.test(field)) {
          s[field] = Math.max(0, Math.min(100, parseInt(el.value, 10) || 0));
          const oval = pane.querySelector(`[data-hdoval="${field}"]`);
          if (oval) oval.textContent = s[field];
        } else s[field] = el.value; // Farben
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

  // Typografie (Buchstabenabstand + Kontur) – gilt für beide Modi.
  pane.querySelectorAll('[data-hdtypo]').forEach((el) => {
    el.addEventListener('input', () => {
      const hd = heroDesignOf(lang);
      const f = el.dataset.hdtypo;
      if (/LetterSpacing$/.test(f))
        hd[f] = Math.max(-5, Math.min(20, Math.round((parseFloat(el.value) || 0) * 2) / 2));
      else if (/StrokeWidth$/.test(f))
        hd[f] = Math.max(0, Math.min(5, Math.round((parseFloat(el.value) || 0) * 2) / 2));
      else hd[f] = el.value; // Kontur-Farbe
      refreshPreview(pane, lang);
    });
  });

  // Button-Beschriftungen (schreiben in die Overrides, wie im Texte-Tab).
  pane.querySelectorAll('[data-feat]').forEach((el) => {
    const key = el.dataset.feat;
    el.addEventListener('input', () => {
      const v = el.value;
      if (v.trim() === '') delPath(state.overrides[lang], ['hero', 'features', key]);
      else setPath(state.overrides[lang], ['hero', 'features', key], v);
    });
  });
}
