// Hintergrund-Tab (global, sprachübergreifend): Hintergrund der GESAMTEN
// Website – getrennt für Hell- und Dunkelmodus – mit Live-Vorschau. Je Modus:
// eigene Farbe, Deckkraft (Mischung mit der Standardfarbe des Modus) und
// optionaler Farbverlauf (Endfarbe, linear mit Richtung oder radial).
// Dazu je Modus ein reines CSS-Muster (Punktraster/Gitter: Farbe, Abstand,
// Stärke, Deckkraft) und ein Hintergrundbild aus der Mediathek (Abdunkelung,
// Weichzeichner, Deckkraft, fixiert beim Scrollen).
// Gespeichert wird global in media.site (bgColor*, bgOpacity*, bgGradient*,
// bgColor2*, bgGradientType*, bgAngle*, bgPattern*, bgImage*; Suffix Dark =
// Dunkelmodus); leer = Standardfarbe des jeweiligen Modus (wie bisher).

import { $, esc, toast } from './core.js';
import {
  state,
  getSiteBg,
  setSiteBg,
  getSiteFx,
  setSiteFx,
  SITE_FX,
  PAGE_BG_DEFAULT,
  siteBgLayerCss,
  siteBgImageLayer,
  SITE_GRADIENT_TYPES,
  SITE_PATTERNS,
} from './model.js';
import { objUrl, openMediaPicker } from './media.js';

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
const PATTERN_LABEL = { none: 'Kein Muster', dots: 'Punktraster', grid: 'Feines Gitter' };

// Bild-URL für die Vorschau auflösen (staged:<id> -> Objekt-URL des Browsers).
function previewUrl(val) {
  if (!val) return '';
  if (val.startsWith('staged:')) return objUrl(val.slice(7));
  return val;
}
// style-Attribut der Bild-Ebene in der Vorschau (leer = keine Ebene sichtbar).
function imageLayerStyle(mode) {
  const l = siteBgImageLayer(mode, previewUrl);
  if (!l) return 'display:none';
  const mask = l.fixed
    ? ''
    : 'mask-image:linear-gradient(#000 60%, transparent);-webkit-mask-image:linear-gradient(#000 60%, transparent);';
  return (
    // Einfache Anführungszeichen: der Wert landet in einem style="…"-Attribut.
    `background:url('${l.url.replace(/['"]/g, '')}') center / cover no-repeat;` +
    `filter:${l.filter};opacity:${l.opacity};${mask}`
  );
}

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
// Hinweis unter Muster + Bild (unabhängig von der Farbwahl).
function extrasNote(mode) {
  const s = getSiteBg(mode);
  const parts = [];
  if (s.pattern !== 'none')
    parts.push(
      `${PATTERN_LABEL[s.pattern]} (${s.patternSpacing} px, ${s.patternOpacity} % Deckkraft)`,
    );
  if (s.image) {
    const bits = [s.imageFixed ? 'fixiert beim Scrollen' : 'scrollt mit, läuft nach unten aus'];
    if (s.imageDarken > 0) bits.push(`${s.imageDarken} % abgedunkelt`);
    if (s.imageBlur > 0) bits.push(`${s.imageBlur} px weich`);
    if (s.imageOpacity < 100) bits.push(`${s.imageOpacity} % Deckkraft`);
    parts.push(
      `Hintergrundbild${s.image.startsWith('staged:') ? ' (lokal, wird beim Veröffentlichen hochgeladen)' : ''}: ${bits.join(', ')}`,
    );
  }
  return parts.length ? `✅ ${parts.join(' · ')}.` : 'Kein Muster und kein Hintergrundbild.';
}

// Abschnitt „Muster" eines Modus (reines CSS: Punktraster oder Gitter).
function patternRow(mode) {
  const s = getSiteBg(mode);
  const on = s.pattern !== 'none';
  const dis = on ? '' : 'disabled';
  const opts = SITE_PATTERNS.map(
    (t) => `<option value="${t}" ${s.pattern === t ? 'selected' : ''}>${PATTERN_LABEL[t]}</option>`,
  ).join('');
  return `
    <div class="bg-sub" data-bgpattern="${mode}">
      <div class="bg-sub-title">Muster <span class="hint" style="margin:0;font-weight:400">– Punktraster oder feines Gitter (reines CSS, liegt über der Farbe)</span></div>
      <div class="row" style="align-items:flex-end">
        <div style="flex:0 0 auto">
          <label>Art</label>
          <select data-bgf="pattern" data-mode="${mode}" style="width:auto">${opts}</select>
        </div>
        <div style="flex:0 0 auto">
          <label>Farbe</label>
          <input type="color" data-bgf="patternColor" data-mode="${mode}" value="${esc(s.patternColor)}" ${dis} style="width:64px;height:40px;padding:2px" />
        </div>
        <div style="flex:1 1 140px">
          <label>Abstand: <span data-bgoval="patternSpacing" data-mode="${mode}">${s.patternSpacing}</span> px</label>
          <input type="range" data-bgf="patternSpacing" data-mode="${mode}" min="4" max="200" value="${s.patternSpacing}" ${dis} style="width:100%" />
        </div>
        <div style="flex:1 1 120px">
          <label>Stärke: <span data-bgoval="patternThickness" data-mode="${mode}">${s.patternThickness}</span> px</label>
          <input type="range" data-bgf="patternThickness" data-mode="${mode}" min="1" max="6" value="${s.patternThickness}" ${dis} style="width:100%" />
        </div>
        <div style="flex:1 1 140px">
          <label>Deckkraft: <span data-bgoval="patternOpacity" data-mode="${mode}">${s.patternOpacity}</span> %</label>
          <input type="range" data-bgf="patternOpacity" data-mode="${mode}" min="0" max="100" value="${s.patternOpacity}" ${dis} style="width:100%" />
        </div>
      </div>
    </div>`;
}

// Abschnitt „Hintergrundbild" eines Modus (aus der Mediathek oder URL).
function imageRow(mode) {
  const s = getSiteBg(mode);
  const on = s.image !== '';
  const dis = on ? '' : 'disabled';
  const url = previewUrl(s.image);
  const thumb = url
    ? `<img src="${esc(url)}" alt="" />`
    : '<span class="hint" style="margin:0">Kein Bild</span>';
  const staged = s.image.startsWith('staged:');
  return `
    <div class="bg-sub" data-bgimage="${mode}">
      <div class="bg-sub-title">Hintergrundbild <span class="hint" style="margin:0;font-weight:400">– aus der Mediathek, liegt unter Farbe/Muster und Effekten</span></div>
      <div class="row" style="align-items:flex-start">
        <div class="bg-thumb" data-bgthumb="${mode}">${thumb}</div>
        <div style="flex:1 1 220px">
          <div class="row" style="margin:0">
            <button type="button" data-bgpick="${mode}" style="flex:0 0 auto">📂 Aus Mediathek wählen</button>
            <button type="button" class="danger" data-bgimgclear="${mode}" ${dis} style="flex:0 0 auto">Entfernen</button>
          </div>
          <label style="margin-top:.5rem">Bild-URL <span class="hint" style="margin:0">(z.B. /uploads/… oder https://…)</span></label>
          <input type="text" data-bgf="image" data-mode="${mode}" value="${esc(staged ? '' : s.image)}" placeholder="${staged ? 'Lokales Medium (wird beim Veröffentlichen hochgeladen)' : '/uploads/…'}" />
        </div>
      </div>
      <div class="row" style="align-items:flex-end;margin-top:.2rem;${on ? '' : 'opacity:.45'}">
        <div style="flex:1 1 140px">
          <label>Abdunkelung: <span data-bgoval="imageDarken" data-mode="${mode}">${s.imageDarken}</span> %</label>
          <input type="range" data-bgf="imageDarken" data-mode="${mode}" min="0" max="100" value="${s.imageDarken}" ${dis} style="width:100%" />
        </div>
        <div style="flex:1 1 140px">
          <label>Weichzeichner: <span data-bgoval="imageBlur" data-mode="${mode}">${s.imageBlur}</span> px</label>
          <input type="range" data-bgf="imageBlur" data-mode="${mode}" min="0" max="40" value="${s.imageBlur}" ${dis} style="width:100%" />
        </div>
        <div style="flex:1 1 140px">
          <label>Deckkraft: <span data-bgoval="imageOpacity" data-mode="${mode}">${s.imageOpacity}</span> %</label>
          <input type="range" data-bgf="imageOpacity" data-mode="${mode}" min="0" max="100" value="${s.imageOpacity}" ${dis} style="width:100%" />
        </div>
        <label style="display:flex;align-items:center;gap:.4rem;color:var(--text);margin:0 0 .5rem;flex:0 0 auto">
          <input type="checkbox" data-bgf="imageFixed" data-mode="${mode}" ${s.imageFixed ? 'checked' : ''} ${dis} style="width:auto" /> Fixiert beim Scrollen
        </label>
      </div>
      <p class="hint" data-bgxnote="${mode}" style="margin-top:.4rem">${extrasNote(mode)}</p>
    </div>`;
}

function modeRow(mode, label) {
  const s = getSiteBg(mode);
  const on = s.color !== '';
  const dis = on ? '' : 'disabled';
  const anySet = on || s.pattern !== 'none' || s.image !== '';
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
        <button type="button" class="hd-reset" data-bgreset="${mode}" title="Diesen Modus auf Standard zurücksetzen (Farbe, Muster, Bild)" ${anySet ? '' : 'disabled'}>↺ Standard</button>
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
      ${patternRow(mode)}
      ${imageRow(mode)}
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
        <strong>Deckkraft</strong> (Mischung mit der Standardfarbe), optional ein <strong>Farbverlauf</strong>,
        ein <strong>Muster</strong> (Punktraster/Gitter) und ein <strong>Hintergrundbild</strong> aus der Mediathek;
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
      <div class="fx-prev-layer" data-fxlayer="image" style="${imageLayerStyle(mode)}"></div>
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
  const img = pane.querySelector(`[data-fxprev="${mode}"] [data-fxlayer="image"]`);
  if (img) img.setAttribute('style', imageLayerStyle(mode));
  const note = pane.querySelector(`[data-bgnote="${mode}"]`);
  if (note) note.textContent = noteFor(mode);
  const xnote = pane.querySelector(`[data-bgxnote="${mode}"]`);
  if (xnote) xnote.textContent = extrasNote(mode);
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
    const evt =
      inp.type === 'checkbox' || inp.type === 'text' || inp.tagName === 'SELECT'
        ? 'change'
        : 'input';
    inp.addEventListener(evt, () => {
      if (field === 'gradient') {
        const patch = { gradient: inp.checked };
        // Beim Einschalten ohne Endfarbe: passenden Vorschlag setzen.
        if (inp.checked && !getSiteBg(mode).color2) patch.color2 = GRADIENT_END_DEFAULT[mode];
        setSiteBg(mode, patch);
        renderBackground();
        return;
      }
      if (field === 'type' || field === 'pattern' || field === 'image') {
        setSiteBg(mode, { [field]: inp.value });
        if (field === 'image' && inp.value.trim() && !getSiteBg(mode).image)
          toast('Ungültige Bild-URL – erlaubt sind /pfad oder https://…');
        renderBackground(); // Felder aktivieren/deaktivieren (Richtung nur bei linear usw.)
        return;
      }
      setSiteBg(mode, { [field]: inp.type === 'checkbox' ? inp.checked : inp.value });
      const oval = pane.querySelector(`[data-bgoval="${field}"][data-mode="${mode}"]`);
      if (oval) oval.textContent = getSiteBg(mode)[field];
      refreshMode(pane, mode);
    });
  });
  pane.querySelectorAll('[data-bgpick]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.bgpick;
      const srv = ['de', 'en', 'shared'].reduce(
        (n, l) => n + (state.serverFiles[l] || []).length,
        0,
      );
      if (!state.stagedItems.length && !srv) {
        toast('Keine Medien vorhanden — zuerst im Tab „Mediathek" eine Datei hinzufügen.');
        return;
      }
      openMediaPicker('de', 'bgImage', {
        allLangs: true,
        imagesOnly: true,
        title: `Hintergrundbild (${mode === 'dark' ? 'Dunkelmodus' : 'Hellmodus'}) wählen`,
        onPick: (url) => {
          setSiteBg(mode, { image: url });
          renderBackground();
        },
      });
    });
  });
  pane.querySelectorAll('[data-bgimgclear]').forEach((btn) => {
    btn.addEventListener('click', () => {
      setSiteBg(btn.dataset.bgimgclear, { image: '' });
      renderBackground();
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
        pattern: 'none',
        patternColor: '',
        patternSpacing: 24,
        patternThickness: 1,
        patternOpacity: 12,
        image: '',
        imageDarken: 0,
        imageBlur: 0,
        imageOpacity: 100,
        imageFixed: true,
      });
      renderBackground();
      toast(`${mode === 'dark' ? 'Dunkelmodus' : 'Hellmodus'} auf Standard zurückgesetzt`);
    });
  });
}
