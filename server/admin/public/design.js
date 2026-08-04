// Hero-Design-Tab (eine Sprache): Rahmen, Hintergrund und die Buttons
// (Feature-Chips) des Hero-Bereichs gestalten – getrennt für Hell- und
// Dunkelmodus – samt Live-Vorschau, plus die Button-Beschriftungen. Styling
// wird in media.<lang>.heroDesign (mit .light/.dark) gespeichert; die
// Beschriftungen laufen über die vorhandenen Overrides (hero.features.*).

import { $, esc } from './core.js';
import { state, rgbaFromHex, defaultHeroDesign, getPath, setPath, delPath } from './model.js';

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
function previewChipStyle(s) {
  const bg = rgbaFromHex(s.chipBgColor, s.chipBgOpacity);
  const bd = rgbaFromHex(s.chipBorderColor, s.chipBorderOpacity);
  return `background:${bg};color:${s.chipTextColor};border:1px solid ${bd};border-radius:.6rem;padding:.5rem .3rem;font-weight:600;font-size:.78rem;text-align:center`;
}
function previewCtaStyle(s) {
  return `display:inline-block;margin-top:.9rem;padding:.55rem 1.6rem;border-radius:50px;background:${s.ctaBgColor};color:${s.ctaTextColor};font-weight:700;font-size:.9rem`;
}
// CSS-Regel für den echten Hover-Effekt der Vorschau-Chips (nur im Vorschau-Kasten).
function hoverRuleCss(s) {
  return `[data-hdprev] [data-hdchip]:hover{background:${s.chipHoverBgColor} !important;color:${s.chipHoverTextColor} !important;border-color:transparent !important}`;
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

function heroDesignPanel(lang) {
  const hd = heroDesignOf(lang);
  const s = sideOf(lang);
  const modusLabel = editTheme === 'light' ? 'Hell ☀️' : 'Dunkel 🌙';
  const chips = ['100% Kostenlos', 'Datenschutz', 'Browser-basiert']
    .map((t) => `<div data-hdchip style="${previewChipStyle(s)}">${t}</div>`)
    .join('');
  return `
    <div class="panel">
      <h2>Hero-Design <span class="lang-badge">${lang.toUpperCase()}</span></h2>
      <p class="hint">Gestaltet den Hero-Bereich oben auf der ${lang === 'de' ? 'deutschen' : 'englischen'} Startseite:
        Rahmen, Hintergrund und die Buttons (die Feature-Chips) – getrennt für Hell- und Dunkelmodus. Ausgeschaltet = Standard-Design.</p>
      <label style="display:flex;align-items:center;gap:.4rem;color:var(--text);margin-top:.4rem">
        <input type="checkbox" data-hd="enabled" data-lang="${lang}" ${hd.enabled ? 'checked' : ''} style="width:auto" /> Eigenes Hero-Design verwenden
      </label>

      ${themeSwitch()}
      <h3 style="margin:.4rem 0 .25rem;font-size:.95rem">Rahmen &amp; Hintergrund <span class="lang-badge">${modusLabel}</span></h3>
      <div class="row" style="align-items:flex-end">
        ${colorField(lang, 'borderColor', 'Rahmenfarbe', false, null, s)}
        <div style="flex:0 0 auto">
          <label>Rahmenbreite (px)</label>
          <input type="number" data-hd="borderWidth" data-lang="${lang}" min="0" max="8" step="1" value="${s.borderWidth}" style="width:90px" />
        </div>
        ${colorField(lang, 'bgColor', 'Hintergrund', true, 'bgOpacity', s)}
      </div>

      <h3 style="margin:1.1rem 0 .25rem;font-size:.95rem">Buttons (Feature-Chips) <span class="lang-badge">${modusLabel}</span></h3>
      <div class="row" style="align-items:flex-end">
        ${colorField(lang, 'chipBgColor', 'Hintergrund', true, 'chipBgOpacity', s)}
        ${colorField(lang, 'chipTextColor', 'Textfarbe', false, null, s)}
        ${colorField(lang, 'chipBorderColor', 'Rahmenfarbe', true, 'chipBorderOpacity', s)}
      </div>
      <p class="hint" style="margin-top:.6rem">Hover (beim Überfahren) – zwei Farben:</p>
      <div class="row" style="align-items:flex-end">
        ${colorField(lang, 'chipHoverBgColor', 'Hover-Hintergrund', false, null, s)}
        ${colorField(lang, 'chipHoverTextColor', 'Hover-Textfarbe', false, null, s)}
      </div>

      <h3 style="margin:1.1rem 0 .25rem;font-size:.95rem">CTA-Button („Jetzt starten") <span class="lang-badge">${modusLabel}</span></h3>
      <div class="row" style="align-items:flex-end">
        ${colorField(lang, 'ctaBgColor', 'Hintergrund', false, null, s)}
        ${colorField(lang, 'ctaTextColor', 'Textfarbe', false, null, s)}
      </div>

      <p class="hint" style="margin-top:1rem">Vorschau (${modusLabel}) <em>(zum Testen über die Buttons fahren)</em>:</p>
      <style data-hdhoverstyle>${hoverRuleCss(s)}</style>
      <div data-hdprev style="${previewBoxStyle(s)}">
        <div style="font-weight:800;font-size:1.1rem;color:${esc(s.chipTextColor)}" data-hdtitle>Kostenlose Online-Tools</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.5rem;margin-top:.9rem">${chips}</div>
        <div data-hdcta style="${previewCtaStyle(s)}">Jetzt starten</div>
      </div>
      <p class="hint" data-hdnote style="margin-top:.4rem">${heroPreviewNote(hd)}</p>
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
      <h2>Button-Beschriftungen <span class="lang-badge">${lang.toUpperCase()}</span></h2>
      <p class="hint">Text der Feature-Buttons (gilt für beide Modi). Leer lassen = Standardtext.</p>
      ${rows}
    </div>`;
}

// Aktualisiert Vorschau-Box, Chips, Titelfarbe und Hinweis nach einer Änderung.
function refreshPreview(pane, lang) {
  const hd = heroDesignOf(lang);
  const s = sideOf(lang);
  const box = pane.querySelector('[data-hdprev]');
  if (box) box.setAttribute('style', previewBoxStyle(s));
  const title = pane.querySelector('[data-hdtitle]');
  if (title) title.style.color = s.chipTextColor;
  pane
    .querySelectorAll('[data-hdchip]')
    .forEach((c) => c.setAttribute('style', previewChipStyle(s)));
  const cta = pane.querySelector('[data-hdcta]');
  if (cta) cta.setAttribute('style', previewCtaStyle(s));
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
