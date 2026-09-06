// Reine Content-Bearbeitung pro Sprache: der „Texte"-Tab (formularbasierte
// Overrides der Sektions-Überschriften) und der „Erweitert"-Tab (rohe
// Overrides als JSON). Die Hero-Texte (Titel, Untertitel, Button-Text) werden
// samt ihren Stil-Einstellungen im Tab „Hero-Design" bearbeitet (design.js).
//
// Layout des Texte-Tabs (wie Tool-Karten): Mitte = Texte, Schriftart, Größe,
// Effekte und „Standard für alle Slots" (gelten für beide Modi); Seitenleiste
// Hell links und Dunkel rechts = Vorschau + Textfarbe je Slot für den Modus.

import { $, esc, toast } from './core.js';
import { colorPicker, bindColorPickers, refreshColorPickers } from './color.js';
import {
  state,
  getPath,
  setPath,
  delPath,
  getTextStyle,
  getEffectiveTextStyle,
  UNIFORM_TEXT_KEYS,
} from './model.js';
import { fontOptionsHtml } from './fonts.js';
import {
  fontFF,
  fxControls,
  bindFxControls,
  TEXT_FX_DEFAULTS,
  slotAnimClass,
  slotPreviewStyle,
  previewBg,
  updateSlotPreview,
} from './textstyle.js';
import { goto } from './admin.js';
import { captureView, restoreView } from './viewstate.js';

const MODES = ['light', 'dark'];
const colorField = (mode) => (mode === 'dark' ? 'colorDark' : 'colorLight');
const modeLabel = (mode) => (mode === 'dark' ? 'Dunkel' : 'Hell');

// ============ TAB: Texte ============
// Alle Slots sind mehrzeilig (Zeilenumbrüche werden auf der Seite übernommen)
// und haben eine einstellbare Textgröße + Textfarbe. Die Schlüssel entsprechen
// UNIFORM_TEXT_KEYS (Slots, für die „Standard für alle Slots" gilt).
const TEXT_FIELDS = [
  { path: ['tools', 'sectionTitle'], label: 'Abschnitt – Audio-Tools (Titel)' },
  { path: ['imageTools', 'sectionTitle'], label: 'Abschnitt – Bild-Tools (Titel)' },
  { path: ['diverseTools', 'sectionTitle'], label: 'Abschnitt – Diverse Tools (Titel)' },
];
// Schlüssel für die Stil-Ablage (media.<lang>.textStyles).
const styleKey = (f) => f.path.join('.');

// Master-Status eines Slots bei „Standard für alle Slots".
function slotState(lang, idx) {
  const m = state.media[lang];
  const key = styleKey(TEXT_FIELDS[idx]);
  const isMaster = m.textStyleUniform && (m.textStyleUniformKey || '') === key;
  const inherited = m.textStyleUniform && !isMaster;
  return { key, isMaster, inherited, dis: inherited ? 'disabled' : '' };
}

// Bei „Standard für alle Slots": die (gesperrten) Felder der übrigen Slots live
// auf die Werte des Master-Slots nachziehen – ohne Neu-Rendern, damit der Fokus
// im gerade bearbeiteten Master-Feld erhalten bleibt.
function syncInheritedFields(pane, lang) {
  const m = state.media[lang];
  if (!m.textStyleUniform) return;
  const master = getTextStyle(lang, m.textStyleUniformKey || UNIFORM_TEXT_KEYS[0]);
  const ff = fontFF(master.font || '');
  TEXT_FIELDS.forEach((f, idx) => {
    if (styleKey(f) === m.textStyleUniformKey) return; // Vorlage selbst auslassen
    const size = pane.querySelector(`[data-txtsize="${idx}"]`);
    if (size) size.value = master.size || 0;
    for (const mode of MODES) {
      const color = pane.querySelector(`[data-txtcolor="${idx}"][data-mode="${mode}"]`);
      if (color) color.value = master[colorField(mode)] || '#ffffff';
    }
    const font = pane.querySelector(`[data-txtfont="${idx}"]`);
    if (font) {
      font.value = master.font || '';
      font.setAttribute('style', ff);
    }
    const ta = pane.querySelector(`[data-txt="${idx}"]`);
    if (ta) ta.setAttribute('style', `min-height:64px;font-size:.95rem;${ff}`);
  });
  refreshColorPickers(pane);
  refreshTxtPreviews(pane, lang);
}

// Vorschau-Text: aktueller Override, sonst Standardtext, sonst das Slot-Label.
function previewText(lang, f) {
  const cur = getPath(state.overrides[lang], f.path);
  const def = getPath(state.defaults[lang], f.path);
  const t = cur != null && String(cur).trim() !== '' ? String(cur) : def != null ? String(def) : '';
  return t || f.label;
}
// Vorschau eines Slots in beiden Seitenleisten aktualisieren.
function updateTxtPreview(pane, lang, idx) {
  const st = getEffectiveTextStyle(lang, styleKey(TEXT_FIELDS[idx]));
  for (const mode of MODES) {
    const el = pane.querySelector(`[data-txtprev="${idx}"][data-mode="${mode}"]`);
    if (el) updateSlotPreview(el, st, mode, previewText(lang, TEXT_FIELDS[idx]));
  }
}
function refreshTxtPreviews(pane, lang) {
  TEXT_FIELDS.forEach((_, idx) => updateTxtPreview(pane, lang, idx));
}

export function renderTexts() {
  const pane = $('#content');
  const lang = state.nav.section;
  const view = captureView(pane); // Scroll/Seitenleisten/Details über das Neu-Rendern erhalten
  pane.innerHTML = layoutHtml(lang);
  pane.querySelectorAll('[data-txt]').forEach((el) => {
    const idx = parseInt(el.dataset.txt, 10);
    const field = TEXT_FIELDS[idx];
    el.addEventListener('input', () => {
      const v = el.value;
      if (v.trim() === '') delPath(state.overrides[lang], field.path);
      else setPath(state.overrides[lang], field.path, v);
      updateTxtPreview(pane, lang, idx);
    });
  });

  // Textgröße (0 = Standard) – gilt für beide Modi.
  pane.querySelectorAll('[data-txtsize]').forEach((el) => {
    const key = styleKey(TEXT_FIELDS[parseInt(el.dataset.txtsize, 10)]);
    el.addEventListener('input', () => {
      const n = parseInt(el.value, 10);
      getTextStyle(lang, key).size = Number.isFinite(n) ? Math.max(0, Math.min(120, n)) : 0;
      syncInheritedFields(pane, lang);
      refreshTxtPreviews(pane, lang);
    });
  });
  // Textfarbe je Slot und Modus (Seitenleisten).
  pane.querySelectorAll('[data-txtcolor]').forEach((el) => {
    const key = styleKey(TEXT_FIELDS[parseInt(el.dataset.txtcolor, 10)]);
    const mode = el.dataset.mode === 'dark' ? 'dark' : 'light';
    el.addEventListener('input', () => {
      getTextStyle(lang, key)[colorField(mode)] = el.value;
      syncInheritedFields(pane, lang);
      refreshTxtPreviews(pane, lang);
    });
  });

  // Effekt-Felder je Slot: Schatten, Umriss, Deckkraft, Animation (beide Modi).
  bindFxControls(
    pane,
    (id) => getTextStyle(lang, styleKey(TEXT_FIELDS[parseInt(id, 10)])),
    () => refreshTxtPreviews(pane, lang),
  );

  // Schriftart je Slot (Feld-Vorschau folgt der Auswahl).
  pane.querySelectorAll('[data-txtfont]').forEach((el) => {
    const idx = parseInt(el.dataset.txtfont, 10);
    const key = styleKey(TEXT_FIELDS[idx]);
    el.addEventListener('change', () => {
      getTextStyle(lang, key).font = el.value;
      const ff = fontFF(el.value);
      el.setAttribute('style', ff);
      const ta = pane.querySelector(`[data-txt="${idx}"]`);
      if (ta) ta.setAttribute('style', `min-height:64px;font-size:.95rem;${ff}`);
      syncInheritedFields(pane, lang);
      refreshTxtPreviews(pane, lang);
    });
  });

  // Wechsel zum Tab „Hero-Design" (dort liegen die Hero-Texte).
  pane.querySelectorAll('[data-gotodesign]').forEach((el) => {
    el.addEventListener('click', () => goto(lang, 'design'));
  });

  // Farben aller Slots von einem Modus in den anderen kopieren (Seitenleiste).
  pane.querySelectorAll('[data-txtcopymode]').forEach((el) => {
    el.addEventListener('click', () => {
      const from = el.dataset.txtcopymode === 'dark' ? 'dark' : 'light';
      const to = from === 'dark' ? 'light' : 'dark';
      for (const f of TEXT_FIELDS) {
        const s = getTextStyle(lang, styleKey(f));
        s[colorField(to)] = s[colorField(from)];
      }
      renderTexts();
      toast(`Textfarben nach ${modeLabel(to)} kopiert`);
    });
  });

  // Stil-Einstellungen der Slots dieses Tabs (Hell + Dunkel + Effekte + „Standard
  // für alle Slots") von Deutsch nach Englisch übernehmen. Die Texte bleiben je
  // Sprache; die Hero-Slots (Tab „Hero-Design") bleiben unberührt.
  pane.querySelectorAll('[data-txtcopy]').forEach((el) => {
    el.addEventListener('click', () => {
      if (
        !confirm(
          'Die Text-Einstellungen der Abschnitts-Titel für Englisch werden mit den deutschen überschrieben ' +
            '(Schriftart, Größe, Farbe Hell + Dunkel, Schatten, Umriss, Deckkraft, Animation, ' +
            '„Standard für alle Slots"). Die Texte selbst und die Hero-Texte bleiben unverändert. Fortfahren?',
        )
      )
        return;
      const de = state.media.de;
      const en = state.media.en;
      if (!en.textStyles || typeof en.textStyles !== 'object') en.textStyles = {};
      for (const f of TEXT_FIELDS) {
        const key = styleKey(f);
        const src = de.textStyles && de.textStyles[key];
        if (src) en.textStyles[key] = JSON.parse(JSON.stringify(src));
        else delete en.textStyles[key];
      }
      en.textStyleUniform = de.textStyleUniform === true;
      en.textStyleUniformKey = de.textStyleUniformKey || UNIFORM_TEXT_KEYS[0];
      renderTexts();
      toast('Text-Einstellungen von Deutsch nach Englisch übernommen (Hell + Dunkel + Effekte)');
    });
  });

  // „Standard für alle Slots": Stil dieses Slots gilt für alle anderen.
  pane.querySelectorAll('[data-txtmaster]').forEach((el) => {
    const idx = parseInt(el.dataset.txtmaster, 10);
    const f = TEXT_FIELDS[idx];
    el.addEventListener('change', () => {
      const m = state.media[lang];
      m.textStyleUniform = el.checked;
      if (el.checked) m.textStyleUniformKey = styleKey(f);
      renderTexts();
      toast(
        el.checked
          ? `„${f.label}" ist Master – alle anderen Slots übernehmen seinen Stil und sind gesperrt`
          : 'Jeder Slot nutzt wieder seinen eigenen Stil',
      );
    });
  });

  // ↺ Zurücksetzen: Größe, Farbe (Modus), Schrift, Effekte oder Text des Slots.
  pane.querySelectorAll('[data-txtreset]').forEach((el) => {
    const [idxStr, what] = el.dataset.txtreset.split(':');
    const idx = parseInt(idxStr, 10);
    const field = TEXT_FIELDS[idx];
    const mode = el.dataset.mode === 'dark' ? 'dark' : 'light';
    el.addEventListener('click', () => {
      if (what === 'text') delPath(state.overrides[lang], field.path);
      else if (what === 'size') getTextStyle(lang, styleKey(field)).size = 0;
      else if (what === 'color') getTextStyle(lang, styleKey(field))[colorField(mode)] = '';
      else if (what === 'fx') Object.assign(getTextStyle(lang, styleKey(field)), TEXT_FX_DEFAULTS);
      else getTextStyle(lang, styleKey(field))[what] = ''; // font
      renderTexts();
      toast('Auf Standard zurückgesetzt');
    });
  });
  bindColorPickers(pane);
  restoreView(pane, view);
}

// Mitte: Texte + modusunabhängige Einstellungen je Slot.
function centerPanel(lang) {
  const fields = TEXT_FIELDS.map((f, idx) => {
    const cur = getPath(state.overrides[lang], f.path);
    const def = getPath(state.defaults[lang], f.path);
    const val = cur != null ? cur : '';
    const ph = def != null ? String(def) : '';
    const m = state.media[lang];
    const { key, isMaster, inherited, dis } = slotState(lang, idx);
    const st = getEffectiveTextStyle(lang, key);
    // Nicht-Master-Slots sind gesperrt, solange ein Master aktiv ist. Deaktiviert
    // man den Master, kehrt jeder Slot auf seine EIGENEN Einstellungen zurück
    // (nicht auf Standard) – die eigenen Werte werden nie überschrieben.
    const masterLabel = TEXT_FIELDS.find((x) => styleKey(x) === m.textStyleUniformKey);
    const note = inherited
      ? `<p class="hint" style="margin:.25rem 0 0;color:var(--accent)">🔒 Übernimmt Schriftart, Textgröße, Farben und Effekte von „${esc(masterLabel ? masterLabel.label : m.textStyleUniformKey)}" und ist gesperrt.</p>`
      : isMaster
        ? `<p class="hint" style="margin:.25rem 0 0;color:var(--accent)">★ Master: Schriftart, Textgröße, Farben und Effekte gelten für alle Slots (alle anderen sind gesperrt).</p>`
        : '';
    // Mehrzeilig: Enter erzeugt einen echten Zeilenumbruch auf der Seite.
    const input = `<textarea data-txt="${idx}" rows="2" placeholder="${esc(ph)}" style="min-height:64px;font-size:.95rem;${fontFF(st.font || '')}">${esc(val)}</textarea>`;
    return `
      <div style="margin-top:.9rem;padding-top:.6rem;border-top:1px solid var(--border)">
        <div style="display:flex;align-items:center;gap:.75rem;flex-wrap:wrap">
          <label style="margin:0">${f.label}</label>
          <label style="display:flex;align-items:center;gap:.35rem;margin:0;color:${isMaster ? 'var(--accent)' : 'var(--muted)'};font-size:.75rem;cursor:pointer">
            <input type="checkbox" data-txtmaster="${idx}" ${isMaster ? 'checked' : ''} style="width:auto" />
            Standard für alle Slots
          </label>
          <button type="button" class="hd-reset" data-txtreset="${idx}:text" title="Text auf Standard zurücksetzen" aria-label="Text zurücksetzen">↺ Text</button>
        </div>
        ${note}
        ${input}
        <div class="row" style="align-items:flex-end;margin-top:.35rem">
          <div style="flex:1 1 200px">
            <label style="margin-top:0">Schriftart</label>
            <div style="display:flex;gap:.3rem;align-items:center">
              <select data-txtfont="${idx}" ${dis} style="${fontFF(st.font || '')}">${fontOptionsHtml(st.font || '')}</select>
              <button type="button" class="hd-reset" data-txtreset="${idx}:font" ${dis} title="Schriftart zurücksetzen" aria-label="Schriftart zurücksetzen">↺</button>
            </div>
          </div>
          <div style="flex:0 0 auto">
            <label style="margin-top:0">Textgröße (px, 0=Standard)</label>
            <div style="display:flex;gap:.3rem;align-items:center">
              <input type="number" data-txtsize="${idx}" min="0" max="120" step="1" value="${st.size || 0}" ${dis} style="width:120px" />
              <button type="button" class="hd-reset" data-txtreset="${idx}:size" ${dis} title="Auf Standard zurücksetzen" aria-label="Größe zurücksetzen">↺</button>
            </div>
          </div>
        </div>
        ${fxControls(String(idx), st, dis)}
        <p class="hint">Leer lassen = Standardtext. Mehrere Zeilen mit Enter; Größe 0 = Standard. Schrift, Größe und Effekte gelten für Hell und Dunkel;
          die <strong>Textfarbe</strong> je Modus steht links (Hell) und rechts (Dunkel) mit Vorschau.</p>
      </div>`;
  }).join('');
  const heroNote = `
    <div style="margin:.25rem 0 .7rem;padding:.5rem .6rem;border:1px dashed var(--border);border-radius:8px;display:flex;align-items:center;gap:.6rem;flex-wrap:wrap">
      <span class="hint" style="margin:0">🚀 Die <strong>Hero-Texte</strong> (Titel, Untertitel, Button-Text) werden samt Schrift, Größe, Farbe und Effekten im Tab „Hero-Design" bearbeitet.</span>
      <button type="button" data-gotodesign style="width:auto;flex:0 0 auto">Zu „Hero-Design" wechseln</button>
    </div>`;
  // Stil-Einstellungen der Abschnitts-Titel (Hell + Dunkel + Effekte) von
  // Deutsch nach Englisch übernehmen. Die Texte selbst bleiben je Sprache.
  const copyBox = `
    <div style="margin:.2rem 0 .2rem;padding:.5rem .6rem;border:1px dashed var(--border);border-radius:8px">
      <button data-txtcopy type="button" style="width:auto">${
        lang === 'de'
          ? '➡️ Diese Text-Einstellungen auf Englisch (EN) übernehmen'
          : '⬅️ Text-Einstellungen von Deutsch (DE) übernehmen'
      }</button>
      <p class="hint" style="margin:.35rem 0 0">Kopiert die Text-Einstellungen der Abschnitts-Titel
        (Schriftart, Größe, Farbe <strong>Hell + Dunkel</strong>, Schatten, Umriss, Deckkraft, Animation
        sowie „Standard für alle Slots") von Deutsch nach Englisch. Die <em>Texte</em> selbst bleiben je Sprache erhalten.
        Hero-Texte: siehe Tab „Hero-Design".</p>
    </div>`;
  return `<div class="panel"><h2>Texte <span class="lang-badge">${lang.toUpperCase()}</span></h2>${heroNote}${copyBox}${fields}</div>`;
}

// Seitenleiste eines Modus: je Slot Vorschau + Textfarbe für diesen Modus.
function sidePanel(lang, mode) {
  const dark = mode === 'dark';
  const rows = TEXT_FIELDS.map((f, idx) => {
    const { key, inherited, dis } = slotState(lang, idx);
    const st = getEffectiveTextStyle(lang, key);
    return `
      <div style="margin-top:.75rem;padding-top:.5rem;border-top:1px dashed var(--border)">
        <label style="margin:0 0 .3rem">${f.label}</label>
        <div style="border:1px solid var(--border);border-radius:8px;padding:.5rem .7rem;background:${previewBg(mode)};overflow:hidden">
          <div data-txtprev="${idx}" data-mode="${mode}" class="${slotAnimClass(st)}" style="${slotPreviewStyle(st, mode)}">${esc(previewText(lang, f))}</div>
        </div>
        <label style="margin-top:.4rem">Textfarbe (${modeLabel(mode)})${inherited ? ' <span class="hint" style="margin:0">🔒 vom Master</span>' : ''}</label>
        ${colorPicker({
          id: `txt:${mode}:${idx}:color`,
          attrs: `data-txtcolor="${idx}" data-mode="${mode}"`,
          value: st[colorField(mode)] || '#ffffff',
          disabled: dis === 'disabled',
          resetHtml: `<button type="button" class="hd-reset" data-txtreset="${idx}:color" data-mode="${mode}" ${dis} title="Farbe (${modeLabel(mode)}) auf Standard zurücksetzen" aria-label="Farbe zurücksetzen">↺</button>`,
        })}
      </div>`;
  }).join('');
  return `
    <aside class="tc-side" data-tcside="${mode}">
      <div class="tc-side-head ${mode}">${dark ? '🌙 Dunkelmodus' : '☀️ Hellmodus'}</div>
      <div class="row" style="align-items:center;gap:.5rem;margin:.5rem 0 .2rem">
        <button type="button" class="hd-reset" data-txtcopymode="${mode}" style="flex:0 0 auto" title="Textfarben aller Slots in den anderen Modus übertragen">${dark ? '⬅️ Farben nach Hell kopieren' : '➡️ Farben nach Dunkel kopieren'}</button>
      </div>
      <p class="hint" style="margin:.2rem 0 0">Vorschau und Textfarbe der Abschnitts-Titel im ${modeLabel(mode)}modus. Leere Farbe (↺) = Seitenstandard.</p>
      ${rows}
    </aside>`;
}

// Gesamtlayout: Seitenleiste Hell | Mitte | Seitenleiste Dunkel (wie Tool-Karten).
function layoutHtml(lang) {
  return `
    <div class="tc-layout">
      ${sidePanel(lang, 'light')}
      <div class="tc-main">${centerPanel(lang)}</div>
      ${sidePanel(lang, 'dark')}
    </div>`;
}

// ============ Erweitert (rohe Overrides, eine Sprache) ============
export function renderAdvanced() {
  const l = state.nav.section;
  const pane = $('#content');
  pane.innerHTML = `
    <div class="panel">
      <h2>Erweitert — Overrides als JSON <span class="lang-badge">${l.toUpperCase()}</span></h2>
      <p class="hint">Für Felder, die es oben nicht als Formular gibt. Struktur wie in den Locale-Dateien,
        nur die zu ändernden Schlüssel. Ungültiges JSON wird beim Übernehmen abgelehnt.</p>
      <textarea data-adv="${l}" style="min-height:220px">${esc(JSON.stringify(state.overrides[l], null, 2))}</textarea>
      <div class="err" id="advErr"></div>
      <button id="advApply" style="margin-top:.5rem">Übernehmen</button>
    </div>`;
  $('#advApply').addEventListener('click', () => {
    $('#advErr').textContent = '';
    try {
      const txt = pane.querySelector(`[data-adv="${l}"]`).value.trim();
      const obj = txt ? JSON.parse(txt) : {};
      if (typeof obj !== 'object' || obj === null || Array.isArray(obj))
        throw new Error(`${l}: kein Objekt`);
      state.overrides[l] = obj;
      toast('Overrides übernommen (noch nicht gespeichert)');
    } catch (e) {
      $('#advErr').textContent = 'Fehler: ' + e.message;
    }
  });
}
