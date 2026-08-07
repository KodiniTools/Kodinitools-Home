// Reine Content-Bearbeitung pro Sprache: der „Texte"-Tab (formularbasierte
// Overrides) und der „Erweitert"-Tab (rohe Overrides als JSON).

import { $, esc, toast } from './core.js';
import { state, getPath, setPath, delPath, getTextStyle, getEffectiveTextStyle } from './model.js';
import { fontOptionsHtml, ensureFontFace } from './fonts.js';

// font-family-CSS für die Feld-Vorschau (lädt @font-face) oder ''.
function fontFF(file) {
  return file ? `font-family:'${ensureFontFace(file)}', var(--site-font, sans-serif);` : '';
}

// ============ TAB: Texte ============
// Alle Slots sind mehrzeilig (Zeilenumbrüche werden auf der Seite übernommen)
// und haben eine einstellbare Textgröße + Textfarbe.
const TEXT_FIELDS = [
  { path: ['hero', 'title'], label: 'Hero – Titel' },
  { path: ['hero', 'subtitle'], label: 'Hero – Untertitel' },
  { path: ['hero', 'cta'], label: 'Hero – Button-Text' },
  { path: ['tools', 'sectionTitle'], label: 'Abschnitt – Audio-Tools (Titel)' },
  { path: ['imageTools', 'sectionTitle'], label: 'Abschnitt – Bild-Tools (Titel)' },
  { path: ['diverseTools', 'sectionTitle'], label: 'Abschnitt – Diverse Tools (Titel)' },
];
// Schlüssel für die Stil-Ablage (media.<lang>.textStyles).
const styleKey = (f) => f.path.join('.');

export function renderTexts() {
  const pane = $('#content');
  pane.innerHTML = textPanel(state.nav.section);
  const lang = state.nav.section;
  pane.querySelectorAll('[data-txt]').forEach((el) => {
    const idx = parseInt(el.dataset.txt, 10);
    const l = el.dataset.lang;
    const field = TEXT_FIELDS[idx];
    el.addEventListener('input', () => {
      const v = el.value;
      if (v.trim() === '') delPath(state.overrides[l], field.path);
      else setPath(state.overrides[l], field.path, v);
    });
  });

  // Textgröße (0 = Standard) und Textfarbe je Slot.
  pane.querySelectorAll('[data-txtsize]').forEach((el) => {
    const key = styleKey(TEXT_FIELDS[parseInt(el.dataset.txtsize, 10)]);
    el.addEventListener('input', () => {
      const n = parseInt(el.value, 10);
      getTextStyle(lang, key).size = Number.isFinite(n) ? Math.max(0, Math.min(120, n)) : 0;
    });
  });
  pane.querySelectorAll('[data-txtcolor]').forEach((el) => {
    const key = styleKey(TEXT_FIELDS[parseInt(el.dataset.txtcolor, 10)]);
    el.addEventListener('input', () => {
      getTextStyle(lang, key).color = el.value;
    });
  });
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
          ? `„${f.label}" ist Standard für alle Slots`
          : 'Jeder Slot nutzt wieder seinen eigenen Stil',
      );
    });
  });

  // ↺ Zurücksetzen: Größe, Farbe oder Text des Slots.
  pane.querySelectorAll('[data-txtreset]').forEach((el) => {
    const [idxStr, what] = el.dataset.txtreset.split(':');
    const idx = parseInt(idxStr, 10);
    const field = TEXT_FIELDS[idx];
    el.addEventListener('click', () => {
      if (what === 'text') delPath(state.overrides[lang], field.path);
      else getTextStyle(lang, styleKey(field))[what] = what === 'size' ? 0 : '';
      renderTexts();
      toast('Auf Standard zurückgesetzt');
    });
  });
}

function textPanel(lang) {
  const fields = TEXT_FIELDS.map((f, idx) => {
    const cur = getPath(state.overrides[lang], f.path);
    const def = getPath(state.defaults[lang], f.path);
    const val = cur != null ? cur : '';
    const ph = def != null ? String(def) : '';
    const key = styleKey(f);
    const m = state.media[lang];
    const st = getEffectiveTextStyle(lang, key);
    const isMaster = m.textStyleUniform && (m.textStyleUniformKey || '') === key;
    const inherited = m.textStyleUniform && !isMaster;
    const dis = inherited ? 'disabled' : '';
    const masterLabel = TEXT_FIELDS.find((x) => styleKey(x) === m.textStyleUniformKey);
    const note = inherited
      ? `<p class="hint" style="margin:.25rem 0 0;color:var(--accent)">↳ Übernimmt Schriftart, Textgröße und Farbe von „${esc(masterLabel ? masterLabel.label : m.textStyleUniformKey)}".</p>`
      : '';
    // Mehrzeilig: Enter erzeugt einen echten Zeilenumbruch auf der Seite.
    const input = `<textarea data-txt="${idx}" data-lang="${lang}" rows="2" placeholder="${esc(ph)}" style="min-height:64px;font-size:.95rem;${fontFF(st.font || '')}">${esc(val)}</textarea>`;
    return `
      <div style="display:flex;align-items:center;gap:.75rem;flex-wrap:wrap;margin-top:.75rem">
        <label style="margin:0">${f.label}</label>
        <label style="display:flex;align-items:center;gap:.35rem;margin:0;color:${isMaster ? 'var(--accent)' : 'var(--muted)'};font-size:.75rem;cursor:pointer">
          <input type="checkbox" data-txtmaster="${idx}" ${isMaster ? 'checked' : ''} style="width:auto" />
          Standard für alle Slots
        </label>
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
        <div style="flex:0 0 auto">
          <label style="margin-top:0">Textfarbe</label>
          <div style="display:flex;gap:.3rem;align-items:center">
            <input type="color" data-txtcolor="${idx}" value="${esc(st.color || '#ffffff')}" ${dis} style="width:56px;height:38px;padding:2px" />
            <button type="button" class="hd-reset" data-txtreset="${idx}:color" ${dis} title="Farbe auf Standard zurücksetzen" aria-label="Farbe zurücksetzen">↺</button>
          </div>
        </div>
        <div style="flex:0 0 auto">
          <label style="margin-top:0">&nbsp;</label>
          <button type="button" class="hd-reset" data-txtreset="${idx}:text" title="Text auf Standard zurücksetzen" aria-label="Text zurücksetzen">↺ Text</button>
        </div>
      </div>
      <p class="hint">Leer lassen = Standardtext. Mehrere Zeilen mit Enter; Größe 0 = Standard.</p>`;
  }).join('');
  return `<div class="panel"><h2>Texte <span class="lang-badge">${lang.toUpperCase()}</span></h2>${fields}</div>`;
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
