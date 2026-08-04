// Reine Content-Bearbeitung pro Sprache: der „Texte"-Tab (formularbasierte
// Overrides) und der „Erweitert"-Tab (rohe Overrides als JSON).

import { $, esc, toast } from './core.js';
import { state, getPath, setPath, delPath } from './model.js';

// ============ TAB: Texte ============
const TEXT_FIELDS = [
  { path: ['hero', 'title'], label: 'Hero – Titel' },
  { path: ['hero', 'subtitle'], label: 'Hero – Untertitel', textarea: true },
  { path: ['hero', 'cta'], label: 'Hero – Button-Text' },
  { path: ['tools', 'sectionTitle'], label: 'Abschnitt – Audio-Tools (Titel)' },
  { path: ['imageTools', 'sectionTitle'], label: 'Abschnitt – Bild-Tools (Titel)' },
  { path: ['diverseTools', 'sectionTitle'], label: 'Abschnitt – Diverse Tools (Titel)' },
];

export function renderTexts() {
  const pane = $('#content');
  pane.innerHTML = textPanel(state.nav.section);
  pane.querySelectorAll('[data-txt]').forEach((el) => {
    const idx = parseInt(el.dataset.txt, 10);
    const lang = el.dataset.lang;
    const field = TEXT_FIELDS[idx];
    el.addEventListener('input', () => {
      const v = el.value;
      if (v.trim() === '') delPath(state.overrides[lang], field.path);
      else setPath(state.overrides[lang], field.path, v);
    });
  });
}

function textPanel(lang) {
  const fields = TEXT_FIELDS.map((f, idx) => {
    const cur = getPath(state.overrides[lang], f.path);
    const def = getPath(state.defaults[lang], f.path);
    const val = cur != null ? cur : '';
    const ph = def != null ? String(def).replace(/\n/g, ' ') : '';
    const input = f.textarea
      ? `<textarea data-txt="${idx}" data-lang="${lang}" placeholder="${esc(ph)}">${esc(val)}</textarea>`
      : `<input data-txt="${idx}" data-lang="${lang}" placeholder="${esc(ph)}" value="${esc(val)}" />`;
    return `<label>${f.label}</label>${input}<p class="hint">Leer lassen = Standardtext.</p>`;
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
