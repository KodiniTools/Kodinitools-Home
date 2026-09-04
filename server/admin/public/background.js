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
  getSiteFx,
  setSiteFx,
  SITE_FX,
  PAGE_BG_DEFAULT,
  siteBgLayerCss,
  SITE_GRADIENT_TYPES,
} from './model.js';

// --- Effekte (Aurora / Rauschen / Spotlight): Beschreibung + Vorschau-Werte ---
// Die Vorschau bildet background.css + index.astro nach (gleiche Verläufe,
// gleiche Skalierung der Intensität), damit sie dem Ergebnis auf der Seite entspricht.
const FX_DESC = {
  fxAurora:
    'Weiche Farbflecken in den Markenfarben (Blau/Gold) über dem Seitenhintergrund. Farben folgen automatisch dem Hell-/Dunkelmodus.',
  fxNoise:
    'Feine Körnung, die großen Flächen den sterilen Eindruck nimmt und Verläufe weicher macht.',
  fxSpotlight:
    'Sanfter Lichtkegel, der dem Mauszeiger folgt (nur Startseiten; auf Touch-Geräten unsichtbar).',
};
const AURORA_BG = {
  light:
    'radial-gradient(ellipse 75% 60% at 12% -5%, rgba(1, 79, 153, 0.24), transparent 55%),' +
    'radial-gradient(ellipse 55% 45% at 92% 8%, rgba(232, 169, 69, 0.26), transparent 55%),' +
    'radial-gradient(ellipse 65% 55% at 85% 105%, rgba(58, 123, 200, 0.22), transparent 55%)',
  dark:
    'radial-gradient(ellipse 75% 60% at 12% -5%, rgba(232, 169, 69, 0.26), transparent 55%),' +
    'radial-gradient(ellipse 55% 45% at 92% 8%, rgba(1, 79, 153, 0.44), transparent 55%),' +
    'radial-gradient(ellipse 65% 55% at 85% 105%, rgba(232, 169, 69, 0.14), transparent 55%)',
};
const FX_NOISE_MAX = 0.08;
const SPOT_BASE = { light: 'rgba(1, 79, 153, A)', dark: 'rgba(201, 152, 77, A)' };
const SPOT_ALPHA = { light: 0.4, dark: 0.3 };

// Beispiel-Textfarbe für die Vorschau, passend zum jeweiligen Modus (nur Vorschau).
const PREVIEW_FG = { light: '#003971', dark: '#e2e8f0' };
// Vorschlag für die Endfarbe, wenn der Verlauf eingeschaltet wird.
const GRADIENT_END_DEFAULT = { light: '#e3ecf6', dark: '#142640' };
const GRADIENT_TYPE_LABEL = {
  linear: 'Linear (Richtung wählbar)',
  radial: 'Radial (von oben Mitte)',
};

// Hintergrund-Ebene eines Modus (gemeinsam mit der Tool-Karten-Vorschau, model.js).
const layerCss = siteBgLayerCss;

function previewStyle(mode) {
  return `background:${layerCss(mode)};color:${PREVIEW_FG[mode]}`;
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
      <p class="hint" data-bgnote="${mode}" style="margin-top:.6rem">${noteFor(mode)}</p>
    </div>`;
}

function backgroundPanel() {
  return `
    ${stickyPreview()}
    <div class="panel">
      <h2>Seiten-Hintergrund</h2>
      <p class="hint" style="margin-top:0">
        Legt den <strong>Hintergrund der gesamten Website</strong> fest (beide Sprachen).
        Getrennt einstellbar für <strong>Hell-</strong> und <strong>Dunkelmodus</strong>: Farbe,
        <strong>Deckkraft</strong> (Mischung mit der Standardfarbe) und optional ein <strong>Farbverlauf</strong>;
        darunter die zuschaltbaren <strong>Effekte</strong>. Die Vorschau bleibt beim Scrollen oben sichtbar.
      </p>
      ${modeRow('light', 'den Hellmodus')}
      ${modeRow('dark', 'den Dunkelmodus')}
    </div>
    ${effectsPanel()}`;
}

// Sticky-Live-Vorschau (Hell + Dunkel nebeneinander): Seitenfarbe/Verlauf/
// Deckkraft als Grund, darüber die Effekt-Ebenen (Aurora, Rauschen, Spotlight
// folgt der Maus) und Beispiel-Inhalt (Überschrift, Text, Karte) wie auf der Seite.
// Liegt direkt in #content (nicht im Panel), damit sie über den ganzen Tab klebt.
function stickyPreview() {
  const anyFx = SITE_FX.some((fx) => getSiteFx(fx.key).on);
  return `
    <div class="tc-sticky">
      <p class="hint" style="margin:.1rem 0 .4rem">Live-Vorschau Hell + Dunkel <em>(inkl. Effekte${
        anyFx ? '; Maus über die Vorschau bewegen zeigt das Spotlight' : ' – derzeit alle aus'
      })</em>:</p>
      <div class="fx-prevs">${fxPreview('light')}${fxPreview('dark')}</div>
    </div>`;
}

// --- Effekte: je Effekt Schalter + Intensität, darunter Live-Vorschau Hell/Dunkel ---
function fxRow(fx) {
  const s = getSiteFx(fx.key);
  return `
    <div style="border:1px solid var(--border);border-radius:8px;padding:.7rem .8rem;margin-top:.6rem">
      <label style="display:flex;align-items:center;gap:.4rem;color:var(--text);margin:0;font-weight:600">
        <input type="checkbox" data-fxon="${fx.key}" ${s.on ? 'checked' : ''} style="width:auto" /> ${esc(fx.label)}
      </label>
      <p class="hint" style="margin:.2rem 0 .4rem">${FX_DESC[fx.key] || ''}</p>
      <label style="margin-top:0">Intensität: <span data-fxoval="${fx.key}">${s.intensity}</span> %</label>
      <input type="range" data-fxint="${fx.key}" min="0" max="100" value="${s.intensity}" ${s.on ? '' : 'disabled'} style="width:100%" />
    </div>`;
}
function fxPreview(mode) {
  const a = getSiteFx('fxAurora');
  const n = getSiteFx('fxNoise');
  const sp = getSiteFx('fxSpotlight');
  return `
    <div class="fx-prev" data-fxprev="${mode}" data-bgprev="${mode}" style="${previewStyle(mode)}" title="${sp.on ? 'Maus bewegen: Spotlight folgt dem Zeiger' : ''}">
      <div class="fx-prev-layer" data-fxlayer="aurora" style="background:${AURORA_BG[mode]};opacity:${a.on ? a.intensity / 100 : 0}"></div>
      <div class="fx-prev-layer" data-fxlayer="noise" style="opacity:${n.on ? (n.intensity / 100) * FX_NOISE_MAX : 0}"></div>
      <div class="fx-prev-layer" data-fxlayer="spot"></div>
      <div class="fx-prev-content">
        <span class="fx-prev-label">${mode === 'dark' ? 'Dunkel 🌙' : 'Hell ☀️'}</span>
        <div class="fx-prev-title">Kostenlose Online-Tools</div>
        <div class="fx-prev-text">Überschrift, Text und Karten liegen auf diesem Hintergrund.</div>
        <div class="fx-prev-card ${mode}">
          <span class="fx-prev-badge">Beispiel</span>
          <div class="fx-prev-card-title">Tool-Karte</div>
        </div>
      </div>
    </div>`;
}
function effectsPanel() {
  return `
    <div class="panel">
      <h2>Effekte <span class="lang-badge">gilt für Hell + Dunkel</span></h2>
      <p class="hint" style="margin-top:0">Zuschaltbare Hintergrund-Effekte für die ganze Website. Jeder Effekt einzeln ein-/ausschaltbar mit eigener Intensität; die Farben passen sich dem Modus an. Alles aus = wie bisher. Wirkung oben in der Sticky-Vorschau.</p>
      ${SITE_FX.map(fxRow).join('')}
    </div>`;
}
// Vorschau-Ebenen nach Regler-Änderung aktualisieren (ohne Neu-Rendern).
function refreshFx(pane) {
  const a = getSiteFx('fxAurora');
  const n = getSiteFx('fxNoise');
  for (const mode of ['light', 'dark']) {
    const box = pane.querySelector(`[data-fxprev="${mode}"]`);
    if (!box) continue;
    box.querySelector('[data-fxlayer="aurora"]').style.opacity = a.on ? a.intensity / 100 : 0;
    box.querySelector('[data-fxlayer="noise"]').style.opacity = n.on
      ? (n.intensity / 100) * FX_NOISE_MAX
      : 0;
    const sp = box.querySelector('[data-fxlayer="spot"]');
    if (sp && !getSiteFx('fxSpotlight').on) sp.style.background = '';
  }
}
function bindEffects(pane) {
  pane.querySelectorAll('[data-fxon]').forEach((cb) => {
    cb.addEventListener('change', () => {
      setSiteFx(cb.dataset.fxon, { on: cb.checked });
      renderBackground();
    });
  });
  pane.querySelectorAll('[data-fxint]').forEach((inp) => {
    inp.addEventListener('input', () => {
      const key = inp.dataset.fxint;
      setSiteFx(key, { intensity: inp.value });
      const oval = pane.querySelector(`[data-fxoval="${key}"]`);
      if (oval) oval.textContent = getSiteFx(key).intensity;
      refreshFx(pane);
    });
  });
  // Spotlight in der Vorschau: folgt der Maus innerhalb der Box.
  pane.querySelectorAll('[data-fxprev]').forEach((box) => {
    const mode = box.dataset.fxprev;
    const spot = box.querySelector('[data-fxlayer="spot"]');
    box.addEventListener('mousemove', (e) => {
      const s = getSiteFx('fxSpotlight');
      if (!s.on || !spot) return;
      const r = box.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      const alpha = (SPOT_ALPHA[mode] * (s.intensity / 100)).toFixed(3);
      spot.style.background = `radial-gradient(420px circle at ${x}% ${y}%, ${SPOT_BASE[mode].replace('A', alpha)}, transparent 45%)`;
    });
    box.addEventListener('mouseleave', () => {
      if (spot) spot.style.background = '';
    });
  });
}

export function renderBackground() {
  const pane = $('#content');
  pane.innerHTML = backgroundPanel();
  bindBackground(pane);
  bindEffects(pane);
}

function refreshMode(pane, mode) {
  const prev = pane.querySelector(`[data-bgprev="${mode}"]`);
  if (prev) prev.setAttribute('style', previewStyle(mode)); // nur Grund; Ebenen sind Kinder
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
