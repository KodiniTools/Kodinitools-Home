// Reine Content-Bearbeitung pro Sprache: der „Texte"-Tab (formularbasierte
// Overrides) und der „Erweitert"-Tab (rohe Overrides als JSON).

import { $, esc, toast } from './core.js';
import { state, getPath, setPath, delPath, getTextStyle } from './model.js';

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
    const st = getTextStyle(lang, styleKey(f));
    // Mehrzeilig: Enter erzeugt einen echten Zeilenumbruch auf der Seite.
    const input = `<textarea data-txt="${idx}" data-lang="${lang}" rows="2" placeholder="${esc(ph)}" style="min-height:64px;font-family:inherit;font-size:.95rem">${esc(val)}</textarea>`;
    return `
      <label>${f.label}</label>
      ${input}
      <div class="row" style="align-items:flex-end;margin-top:.35rem">
        <div style="flex:0 0 auto">
          <label style="margin-top:0">Textgröße (px, 0=Standard)</label>
          <div style="display:flex;gap:.3rem;align-items:center">
            <input type="number" data-txtsize="${idx}" min="0" max="120" step="1" value="${st.size || 0}" style="width:120px" />
            <button type="button" class="hd-reset" data-txtreset="${idx}:size" title="Auf Standard zurücksetzen" aria-label="Größe zurücksetzen">↺</button>
          </div>
        </div>
        <div style="flex:0 0 auto">
          <label style="margin-top:0">Textfarbe</label>
          <div style="display:flex;gap:.3rem;align-items:center">
            <input type="color" data-txtcolor="${idx}" value="${esc(st.color || '#ffffff')}" style="width:56px;height:38px;padding:2px" />
            <button type="button" class="hd-reset" data-txtreset="${idx}:color" title="Farbe auf Standard zurücksetzen" aria-label="Farbe zurücksetzen">↺</button>
          </div>
        </div>
        <div style="flex:0 0 auto">
          <label style="margin-top:0">&nbsp;</label>
          <button type="button" class="hd-reset" data-txtreset="${idx}:text" title="Text auf Standard zurücksetzen" aria-label="Text zurücksetzen">↺ Text</button>
        </div>
      </div>
      <p class="hint">Leer lassen = Standardtext. Mehrere Zeilen mit Enter; Größe 0 = Standard,
        Farbe erst nach Änderung aktiv.</p>`;
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
