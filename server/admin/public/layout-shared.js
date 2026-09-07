// Layout-Tab – gemeinsame Helfer für Banner- und Raster-Modul (und für andere
// Tabs wie „Medien": fontFF, slideInfo, slideshowSettingsHtml, overlayStyle,
// dragHandle). Enthält außerdem den Timer der Vorschau-Diashow.

import { esc } from './core.js';
import { slider } from './slider.js';
import { state, BANNER_TRANSITIONS } from './model.js';
import { objUrl } from './media.js';
import { ensureFontFace } from './fonts.js';

export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
// Wie clamp, aber auf 0,5er-Schritte gerundet (z. B. Umriss-/Konturdicke).
export const clampHalf = (v, min, max) =>
  Math.max(min, Math.min(max, Math.round((Number(v) || 0) * 2) / 2));
// Preset-Positionen (⤒ Oben / ◎ Mitte / ⤓ Unten) als y-Wert in %.
export const POS_PRESET_Y = { top: 10, center: 50, bottom: 90 };
// font-family-CSS für eine Kachel-Textschrift (lädt @font-face für die Vorschau) oder ''.
export function fontFF(file) {
  return file ? `font-family:'${ensureFontFace(file)}', var(--site-font, sans-serif);` : '';
}

// Bereichsinterne Rückgängig/Wiederherstellen-Buttons. Sie greifen auf denselben
// globalen Verlauf zu wie die Kopfleiste (Anbindung + Zustand in publish.js).
export function undoRedoBar() {
  return `<span style="display:inline-flex;gap:.3rem;margin-left:auto">
      <button type="button" class="hd-reset" data-undoproxy title="Rückgängig (Strg/Cmd+Z)" aria-label="Rückgängig">↶</button>
      <button type="button" class="hd-reset" data-redoproxy title="Wiederherstellen (Strg/Cmd+Y)" aria-label="Wiederherstellen">↷</button>
    </span>`;
}

// Kleiner „Zurücksetzen"-Button (↺) für ein einzelnes Feld.
// scope: 'cell' (data-cellreset="i:feld") oder 'banner' (data-bannerreset="feld").
export function resetBtn(attr, val, disabled) {
  return `<button type="button" class="hd-reset" ${attr}="${esc(val)}" ${disabled ? 'disabled' : ''} title="Auf Standard zurücksetzen" aria-label="Auf Standard zurücksetzen">↺</button>`;
}
// Umschließt ein Eingabe-Element mit seinem Zurücksetzen-Button (nebeneinander).
export function withReset(inputHtml, attr, val, disabled) {
  return `<div style="display:flex;gap:.3rem;align-items:center">${inputHtml}${resetBtn(attr, val, disabled)}</div>`;
}

// Ein Diashow-Bild (Server-URL oder 'staged:<id>') auflösen: { src, item } oder null.
export function slideInfo(val) {
  if (!val) return null;
  if (val.startsWith('staged:')) {
    const id = val.slice(7);
    const item = state.stagedItems.find((x) => x.id === id);
    if (!item) return null;
    return { src: objUrl(id), item };
  }
  return { src: val, item: null };
}
const TRANSITION_LABELS = {
  fade: 'Überblenden',
  slide: 'Schieben',
  zoom: 'Zoom (Ken Burns)',
  none: 'Harter Schnitt',
};
// Einstellungen einer Diashow (Banner: attr 'slideshow', Raster: 'gridslideshow'):
// Anzeigedauer, Übergangsdauer, Übergang, Pause bei Mauszeiger, Punkte, optional
// „versetzt wechseln" (nur Raster).
export function slideshowSettingsHtml(ss, attr, disabled, withStagger) {
  const dis = disabled ? 'disabled' : '';
  const pre = attr === 'gridslideshow' ? 'ly:gridslideshow' : 'ly:slideshow';
  return `
      <div class="row" style="align-items:flex-end;margin-top:.7rem">
        <div style="flex:1 1 220px">
          ${slider({ id: `${pre}:interval`, label: 'Anzeigedauer je Bild', unit: 's', min: 1, max: 30, value: ss.interval, attrs: `data-${attr}="interval"`, resetAttrs: `data-${attr}reset="interval"`, disabled })}
        </div>
        <div style="flex:1 1 220px">
          ${slider({ id: `${pre}:duration`, label: 'Übergangsdauer', unit: 'ms', min: 0, max: 5000, step: 50, value: ss.duration, attrs: `data-${attr}="duration"`, resetAttrs: `data-${attr}reset="duration"`, disabled })}
        </div>
        <div style="flex:0 0 auto">
          <label>Übergang</label>
          <select data-${attr}="transition" ${dis} style="width:auto;height:38px">${BANNER_TRANSITIONS.map((t) => `<option value="${t}" ${t === ss.transition ? 'selected' : ''}>${TRANSITION_LABELS[t] || t}</option>`).join('')}</select>
        </div>
      </div>
      <div class="row" style="align-items:center;margin-top:.4rem;gap:1rem">
        <label style="display:flex;align-items:center;gap:.4rem;color:var(--text);cursor:pointer;margin:0">
          <input type="checkbox" data-${attr}="pauseOnHover" ${ss.pauseOnHover ? 'checked' : ''} ${dis} style="width:auto" /> Pause bei Mauszeiger
        </label>
        <label style="display:flex;align-items:center;gap:.4rem;color:var(--text);cursor:pointer;margin:0">
          <input type="checkbox" data-${attr}="dots" ${ss.dots ? 'checked' : ''} ${dis} style="width:auto" /> Punkte zum Umschalten
        </label>
        ${
          withStagger
            ? `<label style="display:flex;align-items:center;gap:.4rem;color:var(--text);cursor:pointer;margin:0">
          <input type="checkbox" data-${attr}="stagger" ${ss.stagger !== false ? 'checked' : ''} ${dis} style="width:auto" /> Versetzt wechseln (Kacheln nacheinander)
        </label>`
            : ''
        }
      </div>`;
}

// Gemeinsamer Overlay-Style: der Text wird an (x,y) in % verankert (Mittelpunkt)
// und lässt sich in der Vorschau mit der Maus frei verschieben (cursor:move).
export function overlayStyle(color, size, x, y, font, fsDefault, shadow, extra) {
  const fs = size > 0 ? `${size}px` : fsDefault;
  const cx = clamp(Number(x) || 0, 0, 100);
  const cy = clamp(Number(y) || 0, 0, 100);
  return `position:absolute;left:${cx}%;top:${cy}%;transform:translate(-50%,-50%);max-width:92%;text-align:center;padding:.1rem .3rem;color:${color || '#fff'};font-size:${fs};line-height:1.2;text-shadow:${shadow};word-break:break-word;cursor:move;pointer-events:auto;user-select:none;touch-action:none;${fontFF(font)}${extra || ''}`;
}

// Macht ein Text-Overlay (handle) innerhalb seines Containers per Maus/Touch
// ziehbar. onMove(x,y) bekommt die neue Position in % (0–100). onTap() wird bei
// einem Klick ohne Bewegung ausgelöst (z. B. um die Kachel auszuwählen).
export function dragHandle(handle, container, onMove, onTap) {
  if (!handle || !container) return;
  let active = false;
  let moved = false;
  let sx = 0;
  let sy = 0;
  handle.addEventListener('pointerdown', (e) => {
    active = true;
    moved = false;
    sx = e.clientX;
    sy = e.clientY;
    try {
      handle.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    e.preventDefault();
  });
  handle.addEventListener('pointermove', (e) => {
    if (!active) return;
    if (Math.abs(e.clientX - sx) > 3 || Math.abs(e.clientY - sy) > 3) moved = true;
    const r = container.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const x = Math.round(clamp(((e.clientX - r.left) / r.width) * 100, 0, 100));
    const y = Math.round(clamp(((e.clientY - r.top) / r.height) * 100, 0, 100));
    onMove(x, y);
  });
  const end = (e) => {
    if (!active) return;
    active = false;
    try {
      handle.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    if (!moved && onTap) onTap();
  };
  handle.addEventListener('pointerup', end);
  handle.addEventListener('pointercancel', end);
}

// Timer der Vorschau-Diashow (Banner oder Kacheln – es läuft immer nur einer).
let previewTimer = null;
export function stopPreviewSlideshow() {
  if (previewTimer !== null) clearInterval(previewTimer);
  previewTimer = null;
}
// Startet die Vorschau-Diashow neu: fn wird alle ms Millisekunden aufgerufen.
export function setPreviewSlideshow(fn, ms) {
  stopPreviewSlideshow();
  previewTimer = setInterval(fn, ms);
}
