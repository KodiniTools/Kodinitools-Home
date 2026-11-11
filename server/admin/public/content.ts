// Reine Content-Bearbeitung pro Sprache: der „Texte"-Tab (formularbasierte
// Overrides der Sektions-Überschriften) und der „Erweitert"-Tab (rohe
// Overrides als JSON). Die Hero-Texte (Titel, Untertitel, Button-Text) werden
// samt ihren Stil-Einstellungen im Tab „Hero-Design" bearbeitet (design.ts).
//
// Layout des Texte-Tabs (wie Tool-Karten): Mitte = Texte, Schriftart, Größe,
// Effekte und „Standard für alle Slots" (gelten für beide Modi); Seitenleiste
// Hell links und Dunkel rechts = Vorschau + Textfarbe je Slot für den Modus.

import { $, esc, toast } from './core';
import { state, navLang } from './model';
import { ensureFontFace } from './fonts';
import { goto } from './admin';
import { mountVueTab } from './islands';

export function renderTexts() {
  const pane = $('#content');
  const lang = navLang();
  // Vue-Insel (app/tabs/texts).
  mountVueTab(pane, 'texts', {
    lang,
    overrides: state.overrides[lang],
    defaults: state.defaults[lang],
    media: state.media[lang],
    mediaDe: state.media.de,
    mediaEn: state.media.en,
    fonts: state.fonts,
    ensureFontFace,
    gotoDesign: () => goto(lang, 'design'),
  });
}

// ============ Erweitert (rohe Overrides, eine Sprache) ============
export function renderAdvanced() {
  const l = navLang();
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
      const ta = pane.querySelector(`[data-adv="${l}"]`) as HTMLTextAreaElement;
      const txt = ta.value.trim();
      const obj = txt ? JSON.parse(txt) : {};
      if (typeof obj !== 'object' || obj === null || Array.isArray(obj))
        throw new Error(`${l}: kein Objekt`);
      state.overrides[l] = obj;
      toast('Overrides übernommen (noch nicht gespeichert)');
    } catch (e) {
      $('#advErr').textContent = 'Fehler: ' + (e instanceof Error ? e.message : String(e));
    }
  });
}
