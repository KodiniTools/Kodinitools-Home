// Hintergrund-Tab (global, sprachübergreifend): Hintergrund der GESAMTEN
// Website – getrennt für Hell- und Dunkelmodus – mit Live-Vorschau. Je Modus:
// eigene Farbe, Deckkraft (Mischung mit der Standardfarbe des Modus) und
// optionaler Farbverlauf (Endfarbe, linear mit Richtung oder radial).
// Gespeichert wird global in media.site (bgColor*, bgOpacity*, bgGradient*,
// bgColor2*, bgGradientType*, bgAngle*; Suffix Dark = Dunkelmodus); leer =
// Standardfarbe des jeweiligen Modus (verhaltensneutral, wie bisher).

import { $, esc, toast } from './core.js';
import {
  getSiteBg,
  setSiteBg,
  PAGE_BG_DEFAULT,
  rgbaFromHex,
  SITE_GRADIENT_TYPES,
} from './model.js';

// Beispiel-Textfarbe für die Vorschau, passend zum jeweiligen Modus (nur Vorschau).
const PREVIEW_FG = { light: '#003971', dark: '#e2e8f0' };
// Vorschlag für die Endfarbe, wenn der Verlauf eingeschaltet wird.
const GRADIENT_END_DEFAULT = { light: '#e3ecf6', dark: '#142640' };
const GRADIENT_TYPE_LABEL = {
  linear: 'Linear (Richtung wählbar)',
  radial: 'Radial (von oben Mitte)',
};

// Hintergrund-Ebene eines Modus als CSS-Wert – identisch zur Berechnung auf der
// Seite (content.ts): eigene Farbe/Verlauf mit Deckkraft ÜBER der Standardfarbe.
function layerCss(mode) {
  const s = getSiteBg(mode);
  const base = PAGE_BG_DEFAULT[mode];
  if (!s.color) return base;
  const c1 = rgbaFromHex(s.color, s.opacity);
  if (s.gradient && s.color2) {
    const c2 = rgbaFromHex(s.color2, s.opacity);
    const g =
      s.type === 'radial'
        ? `radial-gradient(ellipse at 50% 0%, ${c1}, ${c2})`
        : `linear-gradient(${s.angle}deg, ${c1}, ${c2})`;
    return `${g}, ${base}`;
  }
  return `linear-gradient(${c1}, ${c1}), ${base}`;
}

function previewStyle(mode) {
  return `background:${layerCss(mode)};color:${PREVIEW_FG[mode]};border:1px solid var(--border);border-radius:8px;padding:1rem 1.1rem;min-height:120px;font-weight:500`;
}

function noteFor(mode) {
  const s = getSiteBg(mode);
  if (!s.color)
    return `⚠️ Keine eigene Farbe – es gilt die Standardfarbe (${PAGE_BG_DEFAULT[mode]}).`;
  const parts = [];
  if (s.gradient && s.color2)
    parts.push(s.type === 'radial' ? 'radialer Verlauf' : `linearer Verlauf, ${s.angle}°`);
  if (s.opacity < 100)
    parts.push(`Deckkraft ${s.opacity} % über der Standardfarbe ${PAGE_BG_DEFAULT[mode]}`);
  return `✅ Eigener Hintergrund wird auf der Seite angewandt${parts.length ? ` (${parts.join('; ')})` : ''}.`;
}

function modeRow(mode, label) {
  const s = getSiteBg(mode);
  const on = s.color !== '';
  const dis = on ? '' : 'disabled';
  const colorVal = s.color || PAGE_BG_DEFAULT[mode];
  const typeOpts = SITE_GRADIENT_TYPES.map(
    (t) =>
      `<option value="${t}" ${s.type === t ? 'selected' : ''}>${GRADIENT_TYPE_LABEL[t]}</option>`,
  ).join('');
  const gradDis = on && s.gradient ? '' : 'disabled';
  return `
    <div style="border:1px solid var(--border);border-radius:8px;padding:.8rem;margin-top:.6rem" data-bgmode="${mode}">
      <div style="display:flex;align-items:center;gap:.6rem;flex-wrap:wrap">
        <label style="display:flex;align-items:center;gap:.4rem;color:var(--text);margin:0;flex:1 1 auto">
          <input type="checkbox" data-bgen="${mode}" ${on ? 'checked' : ''} style="width:auto" />
          Eigene Hintergrundfarbe für ${label} verwenden
        </label>
        <button type="button" class="hd-reset" data-bgreset="${mode}" title="Diesen Modus auf Standard zurücksetzen" ${dis}>↺ Standard</button>
      </div>
      <div class="row" style="margin-top:.6rem;align-items:flex-end">
        <div style="flex:0 0 auto">
          <label>${s.gradient ? 'Startfarbe' : 'Farbe'}</label>
          <input type="color" data-bgf="color" data-mode="${mode}" value="${esc(colorVal)}" ${dis} style="width:64px;height:40px;padding:2px" />
        </div>
        <div style="flex:1 1 180px">
          <label>Deckkraft: <span data-bgoval="opacity" data-mode="${mode}">${s.opacity}</span>% <span class="hint" style="margin:0">(mischt mit der Standardfarbe ${PAGE_BG_DEFAULT[mode]})</span></label>
          <input type="range" data-bgf="opacity" data-mode="${mode}" min="0" max="100" value="${s.opacity}" ${dis} style="width:100%" />
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:.5rem;margin-top:.6rem">
        <label style="display:flex;align-items:center;gap:.4rem;color:var(--text);margin:0">
          <input type="checkbox" data-bgf="gradient" data-mode="${mode}" ${s.gradient ? 'checked' : ''} ${dis} style="width:auto" /> Farbverlauf
        </label>
      </div>
      <div class="row" style="align-items:flex-end;${on && s.gradient ? '' : 'opacity:.45'}">
        <div style="flex:0 0 auto">
          <label>Endfarbe</label>
          <input type="color" data-bgf="color2" data-mode="${mode}" value="${esc(s.color2 || GRADIENT_END_DEFAULT[mode])}" ${gradDis} style="width:64px;height:40px;padding:2px" />
        </div>
        <div style="flex:0 0 auto">
          <label>Art</label>
          <select data-bgf="type" data-mode="${mode}" ${gradDis} style="width:auto">${typeOpts}</select>
        </div>
        <div style="flex:1 1 160px">
          <label>Richtung: <span data-bgoval="angle" data-mode="${mode}">${s.angle}</span>° <span class="hint" style="margin:0">(0° = von unten nach oben, 180° = von oben nach unten)</span></label>
          <input type="range" data-bgf="angle" data-mode="${mode}" min="0" max="360" value="${s.angle}" ${gradDis} ${s.type === 'radial' ? 'disabled' : ''} style="width:100%" />
        </div>
      </div>
      <label>Vorschau</label>
      <div data-bgprev="${mode}" style="${previewStyle(mode)}">
        <div style="font-weight:700;font-size:1.05rem">Beispiel: So sieht die Seite aus</div>
        <div style="opacity:.8;font-size:.85rem;margin-top:.3rem">Überschrift, Text und Karten liegen auf diesem Hintergrund.</div>
      </div>
      <p class="hint" data-bgnote="${mode}" style="margin-top:.4rem">${noteFor(mode)}</p>
    </div>`;
}

function backgroundPanel() {
  return `
    <div class="panel">
      <h2>Seiten-Hintergrund</h2>
      <p class="hint" style="margin-top:0">
        Legt den <strong>Hintergrund der gesamten Website</strong> fest (beide Sprachen).
        Getrennt einstellbar für <strong>Hell-</strong> und <strong>Dunkelmodus</strong>: Farbe,
        <strong>Deckkraft</strong> (Mischung mit der Standardfarbe) und optional ein <strong>Farbverlauf</strong>.
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
      if (cb.checked) {
        // Einschalten: aktuelle Farbwahl (oder Modus-Standard) übernehmen.
        const color = pane.querySelector(`[data-bgf="color"][data-mode="${mode}"]`);
        setSiteBg(mode, { color: (color && color.value) || PAGE_BG_DEFAULT[mode] });
      } else {
        // Ausschalten: keine eigene Farbe -> Standard des Modus (Verlauf/Deckkraft bleiben gespeichert).
        setSiteBg(mode, { color: '' });
      }
      renderBackground(); // Felder aktivieren/deaktivieren
    });
  });
  pane.querySelectorAll('[data-bgf]').forEach((inp) => {
    const mode = inp.dataset.mode;
    const field = inp.dataset.bgf;
    const evt = inp.type === 'checkbox' || inp.tagName === 'SELECT' ? 'change' : 'input';
    inp.addEventListener(evt, () => {
      if (field === 'gradient') {
        const patch = { gradient: inp.checked };
        // Beim Einschalten ohne Endfarbe: passenden Vorschlag setzen.
        if (inp.checked && !getSiteBg(mode).color2) patch.color2 = GRADIENT_END_DEFAULT[mode];
        setSiteBg(mode, patch);
        renderBackground();
        return;
      }
      if (field === 'type') {
        setSiteBg(mode, { type: inp.value });
        renderBackground(); // Richtungsregler nur bei linear
        return;
      }
      setSiteBg(mode, { [field]: inp.value });
      const oval = pane.querySelector(`[data-bgoval="${field}"][data-mode="${mode}"]`);
      if (oval) oval.textContent = getSiteBg(mode)[field];
      refreshMode(pane, mode);
    });
  });
  pane.querySelectorAll('[data-bgreset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.bgreset;
      setSiteBg(mode, {
        color: '',
        opacity: 100,
        gradient: false,
        color2: '',
        type: 'linear',
        angle: 180,
      });
      renderBackground();
      toast(`${mode === 'dark' ? 'Dunkelmodus' : 'Hellmodus'} auf Standard zurückgesetzt`);
    });
  });
}
