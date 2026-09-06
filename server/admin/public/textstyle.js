// Gemeinsame Bausteine für die Text-Slot-Stile (media.<lang>.textStyles):
// Effekt-Bedienfeld (Schatten, Umriss, Deckkraft, Animation), Feld-Handler und
// Live-Vorschau eines Slots. Genutzt vom Tab „Texte" (Sektions-Überschriften)
// und vom Tab „Hero-Design" (Hero-Titel/-Untertitel/-Button-Text).

import { colorPicker } from './color.js';
import { BANNER_ANIM_TYPES, BANNER_ANIM_SPEEDS } from './model.js';
import { ensureFontFace } from './fonts.js';

// font-family-CSS für die Feld-Vorschau (lädt @font-face) oder ''.
export function fontFF(file) {
  return file ? `font-family:'${ensureFontFace(file)}', var(--site-font, sans-serif);` : '';
}
// Deutsche Beschriftungen der Animationstypen und Tempo-Stufen (nur UI).
const ANIM_LABELS = {
  none: 'Keine',
  pulse: 'Puls',
  float: 'Schweben',
  shake: 'Wackeln',
  wobble: 'Kippen',
  glow: 'Glühen',
};
const ANIM_SPEED_LABELS = { slow: 'Langsam', normal: 'Normal', fast: 'Schnell' };
// Standardwerte der Text-Effekte (entsprechen dem „aus"-Zustand).
export const TEXT_FX_DEFAULTS = {
  shadow: false,
  shadowColor: '#000000',
  shadowX: 0,
  shadowY: 2,
  shadowBlur: 6,
  strokeColor: '#000000',
  strokeWidth: 0,
  opacity: 100,
  anim: 'none',
  animIntensity: 5,
  animSpeed: 'normal',
};
const clampI = (v, min, max, def) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : def;
};
const clampH = (v, min, max, def) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n * 2) / 2)) : def;
};
// Sind Effekte eines Slots aktiv (für „•"-Markierung und Auto-Aufklappen)?
export function fxActive(st) {
  return !!(
    st.shadow ||
    (st.strokeWidth || 0) > 0 ||
    (st.opacity ?? 100) < 100 ||
    (st.anim && st.anim !== 'none')
  );
}
// Effekt-Bedienfeld eines Slots (Schatten, Umriss, Deckkraft, Animation) als
// aufklappbarer Bereich. `id` kennzeichnet den Slot in den data-Attributen
// (data-txtfx="<id>:<feld>", data-txtreset="<id>:fx"); `dis` sperrt die Felder.
export function fxControls(id, st, dis = '') {
  const active = fxActive(st);
  const animOpts = BANNER_ANIM_TYPES.map(
    (t) =>
      `<option value="${t}" ${t === (st.anim || 'none') ? 'selected' : ''}>${ANIM_LABELS[t] || t}</option>`,
  ).join('');
  const speedOpts = BANNER_ANIM_SPEEDS.map(
    (sp) =>
      `<option value="${sp}" ${sp === (st.animSpeed || 'normal') ? 'selected' : ''}>${ANIM_SPEED_LABELS[sp] || sp}</option>`,
  ).join('');
  return `
    <details ${active ? 'open' : ''} style="margin-top:.4rem">
      <summary style="cursor:pointer;color:${active ? 'var(--accent)' : 'var(--muted)'};font-size:.82rem;user-select:none">Effekte — Schatten, Umriss, Deckkraft, Animation${active ? ' •' : ''}</summary>
      <div class="row" style="align-items:flex-end;margin-top:.4rem">
        <div style="flex:0 0 auto">
          <label style="margin-top:0">Schatten</label>
          <label style="display:flex;align-items:center;gap:.4rem;color:var(--text);cursor:pointer;height:38px;margin:0">
            <input type="checkbox" data-txtfx="${id}:shadow" ${st.shadow ? 'checked' : ''} ${dis} style="width:auto" /> anzeigen
          </label>
        </div>
        <div style="flex:0 0 auto"><label style="margin-top:0">Schattenfarbe</label>
          ${colorPicker({ id: `txt:${id}:shadowColor`, attrs: `data-txtfx="${id}:shadowColor"`, value: st.shadowColor || '#000000', disabled: dis === 'disabled' })}</div>
        <div style="flex:0 0 auto"><label style="margin-top:0">Versatz X (px)</label>
          <input type="number" data-txtfx="${id}:shadowX" min="-50" max="50" step="1" value="${st.shadowX ?? 0}" ${dis} style="width:90px" /></div>
        <div style="flex:0 0 auto"><label style="margin-top:0">Versatz Y (px)</label>
          <input type="number" data-txtfx="${id}:shadowY" min="-50" max="50" step="1" value="${st.shadowY ?? 2}" ${dis} style="width:90px" /></div>
        <div style="flex:0 0 auto"><label style="margin-top:0">Weichzeichnung (px)</label>
          <input type="number" data-txtfx="${id}:shadowBlur" min="0" max="40" step="1" value="${st.shadowBlur ?? 6}" ${dis} style="width:110px" /></div>
      </div>
      <div class="row" style="align-items:flex-end;margin-top:.4rem">
        <div style="flex:0 0 auto"><label style="margin-top:0">Umriss-Farbe</label>
          ${colorPicker({ id: `txt:${id}:strokeColor`, attrs: `data-txtfx="${id}:strokeColor"`, value: st.strokeColor || '#000000', disabled: dis === 'disabled' })}</div>
        <div style="flex:0 0 auto"><label style="margin-top:0">Umriss-Dicke (px, 0=aus)</label>
          <input type="number" data-txtfx="${id}:strokeWidth" min="0" max="10" step="0.5" value="${st.strokeWidth ?? 0}" ${dis} style="width:120px" /></div>
        <div style="flex:0 0 auto"><label style="margin-top:0">Deckkraft (%)</label>
          <input type="number" data-txtfx="${id}:opacity" min="0" max="100" step="1" value="${st.opacity ?? 100}" ${dis} style="width:110px" /></div>
      </div>
      <div class="row" style="align-items:flex-end;margin-top:.4rem">
        <div style="flex:0 0 auto"><label style="margin-top:0">Animation</label>
          <select data-txtfx="${id}:anim" ${dis} style="width:auto;height:38px">${animOpts}</select></div>
        <div style="flex:0 0 auto"><label style="margin-top:0">Intensität (1–10)</label>
          <input type="number" data-txtfx="${id}:animIntensity" min="1" max="10" step="1" value="${st.animIntensity ?? 5}" ${dis} style="width:110px" /></div>
        <div style="flex:0 0 auto"><label style="margin-top:0">Geschwindigkeit</label>
          <select data-txtfx="${id}:animSpeed" ${dis} style="width:auto;height:38px">${speedOpts}</select></div>
        <div style="flex:0 0 auto"><label style="margin-top:0">&nbsp;</label>
          <button type="button" class="hd-reset" data-txtreset="${id}:fx" ${dis} title="Effekte zurücksetzen" aria-label="Effekte zurücksetzen">↺ Effekte</button></div>
      </div>
    </details>`;
}
// Übernimmt den Wert eines Effekt-Feldes (aus fxControls) in das Stil-Objekt
// `s` – mit denselben Grenzen wie die Server-Validierung.
export function applyFxField(s, field, el) {
  if (field === 'shadow') s.shadow = el.checked;
  else if (
    field === 'shadowColor' ||
    field === 'strokeColor' ||
    field === 'anim' ||
    field === 'animSpeed'
  )
    s[field] = el.value;
  else if (field === 'shadowX') s.shadowX = clampI(el.value, -50, 50, 0);
  else if (field === 'shadowY') s.shadowY = clampI(el.value, -50, 50, 2);
  else if (field === 'shadowBlur') s.shadowBlur = clampI(el.value, 0, 40, 6);
  else if (field === 'strokeWidth') s.strokeWidth = clampH(el.value, 0, 10, 0);
  else if (field === 'opacity') s.opacity = clampI(el.value, 0, 100, 100);
  else if (field === 'animIntensity') s.animIntensity = clampI(el.value, 1, 10, 5);
}
// Verdrahtet alle Effekt-Felder in `pane`: `getStyle(id)` liefert das Stil-
// Objekt des Slots, `onChange(id)` wird nach jeder Änderung aufgerufen.
export function bindFxControls(pane, getStyle, onChange) {
  pane.querySelectorAll('[data-txtfx]').forEach((el) => {
    const i = el.dataset.txtfx.lastIndexOf(':');
    const id = el.dataset.txtfx.slice(0, i);
    const field = el.dataset.txtfx.slice(i + 1);
    const evt = el.tagName === 'SELECT' || el.type === 'checkbox' ? 'change' : 'input';
    el.addEventListener(evt, () => {
      applyFxField(getStyle(id), field, el);
      onChange(id);
    });
  });
}

// ---- Live-Vorschau eines Slots -------------------------------------------
// Zeigt den Text mit Schrift, Größe (für die Vorschau auf 12–40 px begrenzt),
// Farbe des gewählten Modus und allen Effekten (Schatten/Umriss/Deckkraft/
// Animation). Nutzt dieselben kt-*-Animationsklassen wie die Banner-Vorschau.
const PREVIEW_ANIM_DUR = { slow: '2.6s', normal: '1.8s', fast: '1s' };
const ANIM_CLASSES = ['kt-pulse', 'kt-float', 'kt-shake', 'kt-wobble', 'kt-glow'];
function previewRgba(hex, a) {
  const m = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(String(hex || '').trim());
  if (!m) return `rgba(0,0,0,${a})`;
  let h = m[1];
  if (h.length === 3)
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
// Animationsklasse (kt-<type>) oder '' bei 'none'.
export function slotAnimClass(st) {
  return st.anim && st.anim !== 'none' ? 'kt-' + st.anim : '';
}
// Nur die Effekt-Deklarationen (Deckkraft, Umriss, Schatten, Animations-
// Variablen) eines Slots – zum Anhängen an eine bestehende Inline-Style-Liste.
export function slotFxParts(st) {
  const parts = [];
  const op = st.opacity ?? 100;
  if (op < 100) parts.push(`opacity:${op / 100}`);
  const sw = st.strokeWidth ?? 0;
  if (sw > 0) parts.push(`-webkit-text-stroke:${sw}px ${st.strokeColor || '#000000'}`);
  if (st.shadow) {
    const sx = st.shadowX ?? 0;
    const sy = st.shadowY ?? 2;
    const sb = st.shadowBlur ?? 6;
    parts.push(
      `text-shadow:${sx}px ${sy}px ${sb}px ${previewRgba(st.shadowColor || '#000000', 0.6)}`,
    );
  }
  if (st.anim && st.anim !== 'none') {
    const it = Math.max(1, Math.min(10, st.animIntensity ?? 5));
    parts.push(`--anim-dur:${PREVIEW_ANIM_DUR[st.animSpeed] || '1.8s'}`);
    if (st.anim === 'pulse') parts.push(`--anim-scale:${(1 + it * 0.02).toFixed(3)}`);
    else if (st.anim === 'float' || st.anim === 'shake') parts.push(`--anim-shift:${it}px`);
    else if (st.anim === 'wobble') parts.push(`--anim-rot:${it}deg`);
    else if (st.anim === 'glow') parts.push(`--anim-glow:${it * 2}px`);
  }
  return parts;
}
// Inline-Style der Slot-Vorschau (Farbe des Modus `theme` + Effekte).
export function slotPreviewStyle(st, theme) {
  const dark = theme === 'dark';
  const color = (dark ? st.colorDark : st.colorLight) || (dark ? '#f9f2d5' : '#013f7a');
  const size = st.size > 0 ? Math.max(12, Math.min(40, st.size)) : 22;
  const parts = [
    `font-size:${size}px`,
    'line-height:1.25',
    'font-weight:700',
    'display:inline-block',
    'max-width:100%',
    'white-space:pre-line',
    'word-break:break-word',
    `color:${color}`,
    `-webkit-text-fill-color:${color}`,
  ];
  if (st.font) parts.push(`font-family:'${ensureFontFace(st.font)}', var(--site-font, sans-serif)`);
  return parts.concat(slotFxParts(st)).join(';');
}
// Hintergrund der Vorschau je Modus, damit die Farbe sichtbar ist.
export const previewBg = (theme) => (theme === 'dark' ? '#0e1c32' : '#f5f6f8');
// Setzt Animationsklasse (kt-*) eines Vorschau-Elements passend zum Stil.
export function applyAnimClass(el, st) {
  el.classList.remove(...ANIM_CLASSES);
  const c = slotAnimClass(st);
  if (c) el.classList.add(c);
}
// Vorschau-Element eines Slots komplett aktualisieren (Text, Style, Animation).
export function updateSlotPreview(el, st, theme, text) {
  el.textContent = text;
  el.setAttribute('style', slotPreviewStyle(st, theme));
  applyAnimClass(el, st);
}
