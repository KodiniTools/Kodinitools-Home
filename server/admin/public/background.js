// Hintergrund-Tab (global, sprachübergreifend): Hintergrundfarbe der GESAMTEN
// Website – getrennt für Hell- und Dunkelmodus – samt Live-Vorschau. Gespeichert
// wird global in media.site (bgColor / bgColorDark); leer = Standardfarbe des
// jeweiligen Modus (verhaltensneutral, wie bisher).

import { $, esc } from './core.js';
import { getPageBg, setPageBg, PAGE_BG_DEFAULT } from './model.js';

// Beispiel-Textfarbe für die Vorschau, passend zum jeweiligen Modus (nur Vorschau).
const PREVIEW_FG = { light: '#003971', dark: '#e2e8f0' };

// Effektive Farbe eines Modus: eigene Farbe oder – falls keine gesetzt – Standard.
function effectiveBg(mode) {
  return getPageBg(mode) || PAGE_BG_DEFAULT[mode];
}

function modeRow(mode, label) {
  const custom = getPageBg(mode); // '' = Standard
  const on = custom !== '';
  const colorVal = custom || PAGE_BG_DEFAULT[mode];
  return `
    <div style="border:1px solid var(--border);border-radius:8px;padding:.8rem;margin-top:.6rem">
      <label style="display:flex;align-items:center;gap:.4rem;color:var(--text);margin:0">
        <input type="checkbox" data-bgen="${mode}" ${on ? 'checked' : ''} style="width:auto" />
        Eigene Hintergrundfarbe für ${label} verwenden
      </label>
      <div class="row" style="margin-top:.6rem;align-items:flex-end">
        <div style="flex:0 0 auto">
          <label>Farbe</label>
          <input type="color" data-bgcolor="${mode}" value="${esc(colorVal)}" ${on ? '' : 'disabled'} style="width:64px;height:40px;padding:2px" />
        </div>
        <div style="flex:1 1 200px">
          <label>Vorschau</label>
          <div data-bgprev="${mode}" style="${previewStyle(mode)}">Beispiel: So sieht die Seite aus</div>
        </div>
      </div>
      <p class="hint" data-bgnote="${mode}" style="margin-top:.4rem">${noteFor(mode)}</p>
    </div>`;
}

function previewStyle(mode) {
  return `background:${effectiveBg(mode)};color:${PREVIEW_FG[mode]};border:1px solid var(--border);border-radius:6px;padding:.9rem 1rem;font-weight:500`;
}

function noteFor(mode) {
  return getPageBg(mode)
    ? '✅ Diese Farbe wird auf der Seite angewandt.'
    : `⚠️ Keine eigene Farbe – es gilt die Standardfarbe (${PAGE_BG_DEFAULT[mode]}).`;
}

function backgroundPanel() {
  return `
    <div class="panel">
      <h2>Seiten-Hintergrund</h2>
      <p class="hint" style="margin-top:0">
        Legt die <strong>Hintergrundfarbe der gesamten Website</strong> fest (beide Sprachen).
        Getrennt einstellbar für <strong>Hell-</strong> und <strong>Dunkelmodus</strong>.
        Ausgeschaltet = Standardfarbe des jeweiligen Modus.
      </p>
      ${modeRow('light', 'den Hellmodus')}
      ${modeRow('dark', 'den Dunkelmodus')}
    </div>`;
}

export function renderBackground() {
  const pane = $('#content');
  pane.innerHTML = backgroundPanel();
  bindBackground(pane);
}

function refreshMode(pane, mode) {
  const prev = pane.querySelector(`[data-bgprev="${mode}"]`);
  if (prev) prev.setAttribute('style', previewStyle(mode));
  const note = pane.querySelector(`[data-bgnote="${mode}"]`);
  if (note) note.textContent = noteFor(mode);
}

function bindBackground(pane) {
  pane.querySelectorAll('[data-bgen]').forEach((cb) => {
    cb.addEventListener('change', () => {
      const mode = cb.dataset.bgen;
      const color = pane.querySelector(`[data-bgcolor="${mode}"]`);
      if (cb.checked) {
        // Einschalten: aktuelle Farbwahl (oder Modus-Standard) übernehmen.
        const val = (color && color.value) || PAGE_BG_DEFAULT[mode];
        setPageBg(mode, val);
        if (color) {
          color.value = val;
          color.disabled = false;
        }
      } else {
        // Ausschalten: keine eigene Farbe -> Standard des Modus.
        setPageBg(mode, '');
        if (color) color.disabled = true;
      }
      refreshMode(pane, mode);
    });
  });
  pane.querySelectorAll('[data-bgcolor]').forEach((inp) => {
    inp.addEventListener('input', () => {
      const mode = inp.dataset.bgcolor;
      setPageBg(mode, inp.value);
      refreshMode(pane, mode);
    });
  });
}
