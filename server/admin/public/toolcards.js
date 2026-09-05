// Tool-Karten-Tab (eine Sprache): Rahmen und Hintergrund der Tool-Karten der
// Startseite detailliert gestalten – ein Standard-Design für alle Karten plus
// optionale Einzel-Designs je Karte, getrennt für Hell- und Dunkelmodus.
// Live-Vorschau: die aktuell bearbeitete Karte bleibt beim Scrollen als
// Sticky-Vorschau (Hell + Dunkel nebeneinander, echter Hover) sichtbar; darunter
// zeigt eine Übersicht alle Karten mit ihrem effektiven Design, wie sie nach dem
// Veröffentlichen aussehen. Gespeichert wird in media.<lang>.toolCards; die
// Seite liest es über content.ts (getToolCardsCss) als --tc-*-CSS-Variablen.

import { $, esc, toast } from './core.js';
import {
  state,
  rgbaFromHex,
  getToolCards,
  defaultToolCards,
  toolCardSideLight,
  toolCardSideDark,
  TOOL_CARD_BORDER_STYLES,
  siteBgLayerCss,
  getGlobalFont,
  getPath,
  setPath,
  delPath,
  getIconTint,
} from './model.js';
import { ensureFontFace } from './fonts.js';
import { slider, bindSliders } from './slider.js';
import { colorPicker, bindColorPickers } from './color.js';

// UI-Zustand (nicht gespeichert): bearbeiteter Modus + gewählte Karte
// ('' = Standard für alle Karten, sonst "section.key").
let editTheme = 'light';
let selected = '';
// Zielkarten für „Design übertragen" (Karten-IDs); wird nach dem Anwenden geleert.
const targets = new Set();

const SECTIONS = ['tools', 'imageTools', 'diverseTools'];
const SECTION_LABEL = {
  tools: 'Audio-Tools',
  imageTools: 'Bild-Tools',
  diverseTools: 'Diverse Tools',
};
const BORDER_STYLE_LABEL = {
  solid: 'Durchgezogen',
  dashed: 'Gestrichelt',
  dotted: 'Gepunktet',
  double: 'Doppelt',
};
// Seitenfarben je Modus für die Vorschau (entsprechen base.css / tool-cards.css).
const PAGE = {
  light: {
    title: '#003971',
    muted: '#4f6f8e',
    primary: '#014f99',
    badgeFg: '#014f99',
    badgeBg: 'rgba(1, 79, 153, 0.08)',
    badgeBd: 'rgba(1, 79, 153, 0.14)',
    divider: '#e5e7eb',
    iconBg: '#ffffff',
    shadow: '0 14px 36px rgba(0, 57, 113, 0.13), 0 0 0 1px rgba(1, 79, 153, 0.1)',
  },
  dark: {
    title: '#f9f2d5',
    muted: '#7a8da0',
    primary: '#e8a945',
    badgeFg: '#ffffff',
    badgeBg: 'rgba(255, 255, 255, 0.1)',
    badgeBd: 'rgba(255, 255, 255, 0.25)',
    divider: '#1d3a5c',
    iconBg: '#eef1f5',
    shadow: '0 14px 36px rgba(0, 0, 0, 0.45), 0 0 24px rgba(232, 169, 69, 0.07)',
  },
};
const ICON_BOOKMARK =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>';
const ICON_ARROW =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';

// --- Daten-Zugriff ---
function themeLabel(t) {
  return t === 'dark' ? 'Dunkel 🌙' : 'Hell ☀️';
}
function sideDefault(theme) {
  return theme === 'dark' ? toolCardSideDark() : toolCardSideLight();
}
// Effektiver Wert eines Locale-Pfads (Override, sonst Standard). '' zählt bei
// svg als „bewusst entfernt" (wie im Icons-Tab).
function effText(lang, path) {
  const o = getPath(state.overrides[lang], path);
  if (o !== undefined) return typeof o === 'string' ? o : '';
  const d = getPath(state.defaults[lang], path);
  return typeof d === 'string' ? d : '';
}
// Beschriftung des „Öffnen"-Links (Locale tool.open, per Override änderbar).
function openLabel(lang) {
  return effText(lang, ['tool', 'open']) || (lang === 'de' ? 'Öffnen' : 'Open');
}
// Standardtext (Sprachdatei) eines Karten-Felds, ohne Override.
function defText(lang, path) {
  const d = getPath(state.defaults[lang], path);
  return typeof d === 'string' ? d : '';
}
// Alle Tool-Karten der Sprache (Reihenfolge wie auf der Startseite).
function cardList(lang) {
  const out = [];
  const defs = state.defaults[lang] || {};
  for (const section of SECTIONS) {
    const sec = defs[section];
    if (!sec || typeof sec !== 'object') continue;
    for (const [key, entry] of Object.entries(sec)) {
      if (!entry || typeof entry !== 'object' || !('title' in entry) || !('link' in entry))
        continue;
      out.push({
        id: `${section}.${key}`,
        section,
        title: effText(lang, [section, key, 'title']) || key,
        badge: effText(lang, [section, key, 'badge']),
        description: effText(lang, [section, key, 'description']),
        link: effText(lang, [section, key, 'link']),
        svg: effText(lang, [section, key, 'svg']),
        tint: getIconTint(lang, `${section}.${key}`),
      });
    }
  }
  return out;
}
function cardById(lang, id) {
  return cardList(lang).find((c) => c.id === id) || null;
}
// Beispiel-Karte für das Standard-Design (nutzt das Icon der ersten Karte).
function sampleCard(lang) {
  const first = cardList(lang)[0];
  return {
    id: '',
    section: '',
    title: lang === 'de' ? 'Beispiel-Karte' : 'Sample card',
    badge: lang === 'de' ? 'Standard' : 'Default',
    svg: first ? first.svg : '',
  };
}
// Eigenes Design der Karte (oder undefined, wenn sie den Standard nutzt).
function ownStyle(lang, id) {
  return id ? getToolCards(lang).cards[id] : getToolCards(lang).default;
}
// Effektives Design: eigenes, sonst Standard.
function effectiveStyle(lang, id) {
  return ownStyle(lang, id) || getToolCards(lang).default;
}
// Der gerade bearbeitete Farb-Satz (Standard oder Karte, Hell oder Dunkel).
function editSide(lang) {
  return effectiveStyle(lang, selected)[editTheme];
}
// Jede Bearbeitung schaltet das Design ein (sonst wirkt nichts auf der Seite,
// obwohl die Vorschau es zeigt – häufige Stolperfalle). Hält die Checkbox synchron.
function ensureEnabled(lang, pane) {
  const tc = getToolCards(lang);
  if (tc.enabled) return;
  tc.enabled = true;
  const cb = pane && pane.querySelector('[data-tcenabled]');
  if (cb) cb.checked = true;
  toast('Tool-Karten-Design aktiviert – Änderungen wirken nach Speichern/Vorschau');
}
// Zielwerte für „Zurücksetzen": beim Standard die Werkswerte, bei einer Karte
// die Werte des Standard-Designs (= „wie alle anderen Karten").
function resetSource(lang) {
  return selected ? getToolCards(lang).default[editTheme] : sideDefault(editTheme);
}

// --- Vorschau-CSS ---
function bgCss(s) {
  const c1 = rgbaFromHex(s.bgColor, s.bgOpacity);
  if (!s.gradient) return c1;
  return `linear-gradient(${s.gradientAngle}deg, ${c1}, ${rgbaFromHex(s.bgColor2, s.bgOpacity)})`;
}
function cardStyle(s) {
  const bc = rgbaFromHex(s.borderColor, s.borderOpacity);
  return `background:${bgCss(s)};border:${s.borderWidth}px ${s.borderStyle} ${bc};border-radius:${s.borderRadius}px`;
}
// Echte :hover-Regel für eine Vorschau-Karte `sel` (Inline-Styles brauchen !important).
function hoverRule(sel, s, theme) {
  const bc = rgbaFromHex(s.hoverBorderColor, s.hoverBorderOpacity);
  const bg =
    s.hoverBgOpacity > 0
      ? `background:${rgbaFromHex(s.hoverBgColor, s.hoverBgOpacity)} !important;`
      : '';
  return `${sel}:hover{border-color:${bc} !important;${bg}box-shadow:${PAGE[theme].shadow};transform:translateY(-5px)}`;
}
// Hover-Regeln der Sticky-Vorschau (Hell + Dunkel) für das bearbeitete Design.
function previewHoverCss(st) {
  return (
    hoverRule('[data-tcprev="light"] .tc-card', st.light, 'light') +
    hoverRule('[data-tcprev="dark"] .tc-card', st.dark, 'dark')
  );
}
// Hover-Regeln der Übersicht: jede Karte mit ihrem effektiven Design.
function overviewHoverCss(lang) {
  return cardList(lang)
    .map((c) =>
      hoverRule(`.tc-card[data-tcov="${c.id}"]`, effectiveStyle(lang, c.id)[editTheme], editTheme),
    )
    .join('');
}
// Seiten-Hintergrund der Vorschau = dieselbe Ebene wie auf der Seite (Farbe mit
// Deckkraft bzw. Verlauf über der Standardfarbe aus dem Tab „Hintergrund"), damit
// der Kontrast der Karten dem echten Ergebnis entspricht.
function pageBg(theme) {
  return siteBgLayerCss(theme);
}
function fontCss() {
  const gf = getGlobalFont();
  return gf ? `font-family:'${ensureFontFace(gf)}', system-ui, sans-serif;` : '';
}
// HTML einer Vorschau-Karte im Look der echten Tool-Karte (Icon, Badge, Titel,
// Fußzeile mit Favoriten-Symbol und „Öffnen").
function cardHtml(lang, card, theme, s, attrs = '') {
  const p = PAGE[theme];
  // Icon-Färbung (Tab „Icons"): Farbe als Maske, eigener Kasten-Hintergrund.
  const tint = card.tint || {};
  const tintColor = theme === 'dark' ? tint.dark : tint.light;
  const iconBg = (theme === 'dark' ? tint.bgDark : tint.bg) || p.iconBg;
  const safeSvg = String(card.svg || '').replace(/['"]/g, '');
  const iconInner = tintColor
    ? `<span style="display:block;width:100%;height:100%;background:${tintColor};-webkit-mask:url('${safeSvg}') center / contain no-repeat;mask:url('${safeSvg}') center / contain no-repeat"></span>`
    : `<img src="${esc(card.svg)}" alt="" loading="lazy" />`;
  const icon = card.svg
    ? `<div class="tc-icon" style="background:${iconBg}">${iconInner}</div>`
    : '';
  const badge = card.badge
    ? `<span class="tc-badge" style="color:${p.badgeFg};background:${p.badgeBg};border-color:${p.badgeBd}">${esc(card.badge)}</span>`
    : '';
  return `<div class="tc-card" ${attrs} style="${cardStyle(s)}">
      ${icon}${badge}
      <h3 class="tc-title" style="color:${p.title}">${esc(card.title)}</h3>
      <div class="tc-footer" style="border-top-color:${p.divider}">
        <span class="tc-fav" style="color:${p.muted}">${ICON_BOOKMARK}</span>
        <span class="tc-open" style="color:${p.primary}">${esc(openLabel(lang))} ${ICON_ARROW}</span>
      </div>
    </div>`;
}

// --- Formular-Bausteine ---
function resetBtn(key) {
  return `<button type="button" class="hd-reset" data-tcreset="${esc(key)}" title="Auf Standard zurücksetzen" aria-label="Auf Standard zurücksetzen">↺</button>`;
}
function withReset(inputHtml, key) {
  return `<div style="display:flex;gap:.3rem;align-items:center">${inputHtml}${resetBtn(key)}</div>`;
}
// Farbe (+ optional Transparenz-Regler) als Formularzeile.
function colorField(s, field, label, opacityField) {
  const picker = colorPicker({
    id: `tc:${field}`,
    attrs: `data-tcf="${field}"`,
    value: s[field],
    resetHtml: resetBtn(field),
  });
  const op = opacityField
    ? `<div style="flex:1 1 220px">${rangeField(s, opacityField, `${label} – Transparenz`, 0, 100, '%')}</div>`
    : '';
  return `<div style="flex:0 0 auto"><label>${label}</label>${picker}</div>${op}`;
}
// Zahlenwert als Regler (Slider + Zahlenfeld + „↺" auf die Quelle, siehe resetSource).
function rangeField(s, field, label, min, max, unit, disabled = false) {
  return slider({
    id: `tc:${field}`,
    label,
    unit,
    min,
    max,
    value: s[field],
    attrs: `data-tcf="${field}"`,
    resetAttrs: `data-tcreset="${field}"`,
    disabled,
  });
}
function numberField(s, field, label, min, max, unit) {
  return `<div style="flex:1 1 200px">${rangeField(s, field, label, min, max, unit)}</div>`;
}
function section(title, body, open = true) {
  return `<details ${open ? 'open' : ''} style="border-top:1px solid var(--border);margin-top:.5rem;padding-top:.4rem">
      <summary style="cursor:pointer;font-weight:600;font-size:.95rem">${title}</summary>
      <div style="padding-top:.5rem">${body}</div>
    </details>`;
}
function themeSwitch() {
  const btn = (key, label) =>
    `<button type="button" data-tctheme="${key}" class="${editTheme === key ? 'primary' : ''}" style="flex:0 0 auto">${label}</button>`;
  return `<span class="hint" style="margin:0">Modus bearbeiten:</span>${btn('light', '☀️ Hell')}${btn('dark', '🌙 Dunkel')}`;
}
// Auswahl der zu bearbeitenden Karte (Standard + alle Karten nach Bereich).
function cardSelect(lang) {
  const tc = getToolCards(lang);
  const groups = SECTIONS.map((sec) => {
    const opts = cardList(lang)
      .filter((c) => c.section === sec)
      .map(
        (c) =>
          `<option value="${esc(c.id)}" ${c.id === selected ? 'selected' : ''}>${esc(c.title)}${tc.cards[c.id] ? ' ●' : ''}</option>`,
      )
      .join('');
    return opts ? `<optgroup label="${esc(SECTION_LABEL[sec])}">${opts}</optgroup>` : '';
  }).join('');
  return `<select data-tcsel style="width:auto;min-width:220px;flex:1 1 220px">
      <option value="" ${selected ? '' : 'selected'}>★ Standard (alle Karten)</option>
      ${groups}
    </select>`;
}

function noteText(lang) {
  const tc = getToolCards(lang);
  if (!tc.enabled)
    return '⚠️ „Eigenes Tool-Karten-Design verwenden" ist aus – auf der Seite bleibt das Standard-Aussehen. Sobald du etwas änderst, wird es automatisch aktiviert.';
  if (selected && !tc.cards[selected])
    return 'ℹ️ Diese Karte nutzt das Standard-Design. Aktiviere unten „Eigenes Design für diese Karte", um sie einzeln zu gestalten.';
  const n = Object.keys(tc.cards).length;
  return `✅ Dieses Design wird auf der Seite angewandt (Hell und Dunkel getrennt)${n ? ` – ${n} Karte(n) mit eigenem Design (● in der Liste).` : '.'}`;
}

// --- Panel ---
function previewBlock(lang) {
  const card = selected ? cardById(lang, selected) || sampleCard(lang) : sampleCard(lang);
  const st = effectiveStyle(lang, selected);
  const page = (theme) =>
    `<div class="tc-page${editTheme === theme ? ' active' : ''}" data-tcprev="${theme}" style="background:${pageBg(theme)};${fontCss()}" title="Klicken, um diesen Modus zu bearbeiten">
        <span class="tc-page-label">${themeLabel(theme)}</span>
        ${cardHtml(lang, card, theme, st[theme])}
      </div>`;
  return `
    <div class="tc-sticky">
      <div class="row" style="align-items:center;gap:.5rem">
        <label style="margin:0;flex:0 0 auto">Karte bearbeiten:</label>
        ${cardSelect(lang)}
        ${themeSwitch()}
      </div>
      <p class="hint" style="margin:.35rem 0 .3rem">Live-Vorschau der bearbeiteten Karte <em>(zum Testen des Hover-Effekts über die Karte fahren)</em>:</p>
      <style data-tchover>${previewHoverCss(st)}</style>
      <div class="tc-previews">${page('light')}${page('dark')}</div>
      ${selected ? `<p class="hint" style="margin:.35rem 0 0"><span style="color:var(--muted)">Popup beim Überfahren:</span> <em data-tcdesc>${esc(card.description || '(keine Beschreibung)')}</em></p>` : ''}
      <p class="hint" data-tcnote style="margin:.35rem 0 0">${noteText(lang)}</p>
    </div>`;
}

// --- Texte der Karte (Overrides der Sprachdatei: Titel, Badge, Beschreibung, Link) ---
const CARD_TEXT_FIELDS = [
  { key: 'title', label: 'Titel', hint: 'Leer = Standardtext aus der Sprachdatei.' },
  {
    key: 'badge',
    label: 'Badge (kleines Etikett)',
    hint: 'Leer = kein Badge; „↺" = Standard-Badge.',
  },
  {
    key: 'description',
    label: 'Beschreibung (Popup beim Überfahren)',
    hint: 'Leer = Standardtext aus der Sprachdatei.',
    multiline: true,
  },
  {
    key: 'link',
    label: 'Link (URL des Tools)',
    hint: 'https://… oder /pfad/; leer = Standard-Link.',
  },
];
function hasTextOverride(lang, id, key) {
  return getPath(state.overrides[lang], [...id.split('.'), key]) !== undefined;
}
function textsBlock(lang) {
  if (!selected) {
    const ov = getPath(state.overrides[lang], ['tool', 'open']) !== undefined;
    return section(
      `📝 Texte ${badgeHtml(lang)}`,
      `<p class="hint" style="margin:0 0 .4rem">Eine Karte oben auswählen, um <strong>Titel, Badge, Beschreibung und Link</strong> dieser Karte zu bearbeiten. Hier nur die Beschriftung, die auf allen Karten gleich ist:</p>
      <div class="row" style="align-items:flex-end">
        <div style="flex:1 1 220px">
          <label>Beschriftung „${esc(defText(lang, ['tool', 'open']) || openLabel(lang))}" (Link auf allen Karten)${ov ? ' <span class="lang-badge">geändert</span>' : ''}</label>
          <div style="display:flex;gap:.3rem;align-items:center">
            <input type="text" data-tctx="open" value="${esc(openLabel(lang))}" placeholder="${esc(defText(lang, ['tool', 'open']))}" />
            <button type="button" class="hd-reset" data-tctxreset="open" title="Auf Standard zurücksetzen" ${ov ? '' : 'disabled'}>↺</button>
          </div>
        </div>
      </div>`,
      false,
    );
  }
  const c = cardById(lang, selected);
  if (!c) return '';
  const path = selected.split('.');
  const rows = CARD_TEXT_FIELDS.map((f) => {
    const val = effText(lang, [...path, f.key]);
    const ov = hasTextOverride(lang, selected, f.key);
    const input = f.multiline
      ? `<textarea data-tctx="${f.key}" rows="3" placeholder="${esc(defText(lang, [...path, f.key]))}" style="min-height:64px">${esc(val)}</textarea>`
      : `<input type="text" data-tctx="${f.key}" value="${esc(val)}" placeholder="${esc(defText(lang, [...path, f.key]))}" />`;
    return `
      <div style="margin-top:.5rem">
        <label>${f.label}${ov ? ' <span class="lang-badge">geändert</span>' : ''}</label>
        <div style="display:flex;gap:.3rem;align-items:flex-start">
          ${input}
          <button type="button" class="hd-reset" data-tctxreset="${f.key}" title="Auf Standardtext zurücksetzen" aria-label="Zurücksetzen" ${ov ? '' : 'disabled'}>↺</button>
        </div>
        <p class="hint" style="margin:.15rem 0 0">${f.hint}</p>
      </div>`;
  }).join('');
  return section(
    `📝 Texte der Karte „${esc(c.title)}" ${badgeHtml(lang)}`,
    `<p class="hint" style="margin:0">Änderungen wirken sofort in Vorschau und Übersicht und werden als Text-Override der Sprache <strong>${lang.toUpperCase()}</strong> gespeichert (wie im Tab „Texte").</p>${rows}`,
    true,
  );
}
function badgeHtml(lang) {
  return `<span class="lang-badge">${lang.toUpperCase()}</span>`;
}
// Karten-Text setzen: leer = Override entfernen (Standard), Badge darf leer sein (= kein Badge).
function setCardText(lang, id, key, value) {
  const path = [...id.split('.'), key];
  const v = String(value ?? '');
  if (key === 'link') {
    const t = v.trim();
    if (t === '') delPath(state.overrides[lang], path);
    else if (/^(https?:\/\/|\/|#)/.test(t)) setPath(state.overrides[lang], path, t);
    else return false; // ungültig (z. B. javascript:) – nicht übernehmen
    return true;
  }
  if (key === 'badge') setPath(state.overrides[lang], path, v.trim());
  else if (v.trim() === '') delPath(state.overrides[lang], path);
  else setPath(state.overrides[lang], path, key === 'description' ? v : v.trim());
  return true;
}
// Vorschau, Übersicht und Auswahlliste nach Textänderung nachziehen (ohne Neu-Rendern).
function refreshCardTexts(pane, lang) {
  const st = effectiveStyle(lang, selected);
  const card = selected ? cardById(lang, selected) || sampleCard(lang) : sampleCard(lang);
  for (const theme of ['light', 'dark']) {
    const old = pane.querySelector(`[data-tcprev="${theme}"] .tc-card`);
    if (old) old.outerHTML = cardHtml(lang, card, theme, st[theme]);
  }
  const desc = pane.querySelector('[data-tcdesc]');
  if (desc) desc.textContent = card.description || '(keine Beschreibung)';
  if (selected) {
    const ov = pane.querySelector(`[data-tcov="${selected}"]`);
    if (ov)
      ov.outerHTML = cardHtml(
        lang,
        card,
        editTheme,
        effectiveStyle(lang, selected)[editTheme],
        `data-tcov="${esc(selected)}"`,
      );
    const opt = pane.querySelector(`[data-tcsel] option[value="${selected}"]`);
    if (opt) opt.textContent = `${card.title}${getToolCards(lang).cards[selected] ? ' ●' : ''}`;
  } else {
    // „Öffnen"-Beschriftung: alle Übersichtskarten
    pane.querySelectorAll('[data-tcov] .tc-open').forEach((el) => {
      el.innerHTML = `${esc(openLabel(lang))} ${ICON_ARROW}`;
    });
  }
}

function fieldsBlock(lang) {
  const tc = getToolCards(lang);
  const badge = `<span class="lang-badge">${themeLabel(editTheme)}</span>`;
  const isCard = selected !== '';
  const hasOwn = isCard && !!tc.cards[selected];
  let ownToggle = '';
  if (isCard) {
    const c = cardById(lang, selected);
    ownToggle = `
      <div style="display:flex;align-items:center;gap:.5rem;margin:.6rem 0 .2rem;padding:.5rem .6rem;border:1px dashed var(--border);border-radius:8px">
        <label style="display:flex;align-items:center;gap:.4rem;color:var(--text);margin:0">
          <input type="checkbox" data-tcown ${hasOwn ? 'checked' : ''} style="width:auto" /> Eigenes Design für „${esc(c ? c.title : selected)}"
        </label>
        <span class="hint" style="margin:0">${hasOwn ? 'Aus = Karte nutzt wieder das Standard-Design.' : 'An = startet mit einer Kopie des Standard-Designs.'}</span>
      </div>`;
    if (!hasOwn) return ownToggle;
  }
  const s = editSide(lang);
  const styleOpts = TOOL_CARD_BORDER_STYLES.map(
    (v) =>
      `<option value="${v}" ${s.borderStyle === v ? 'selected' : ''}>${BORDER_STYLE_LABEL[v] || v}</option>`,
  ).join('');
  const frameBody = `
    <div class="row" style="align-items:flex-end">
      ${colorField(s, 'borderColor', 'Rahmenfarbe', 'borderOpacity')}
      ${numberField(s, 'borderWidth', 'Breite', 0, 8, 'px')}
      <div style="flex:0 0 auto"><label>Linienart</label>${withReset(
        `<select data-tcf="borderStyle" style="width:auto">${styleOpts}</select>`,
        'borderStyle',
      )}</div>
      ${numberField(s, 'borderRadius', 'Eckenradius', 0, 40, 'px')}
    </div>
    <p class="hint">Breite 0 = kein Rahmen. Transparenz 0 % = unsichtbarer Rahmen (Platz bleibt erhalten).</p>`;
  const bgBody = `
    <div class="row" style="align-items:flex-end">
      ${colorField(s, 'bgColor', s.gradient ? 'Startfarbe' : 'Hintergrundfarbe', 'bgOpacity')}
    </div>
    <div style="display:flex;align-items:center;gap:.5rem;margin-top:.6rem">
      <label style="display:flex;align-items:center;gap:.4rem;color:var(--text);margin:0">
        <input type="checkbox" data-tcf="gradient" ${s.gradient ? 'checked' : ''} style="width:auto" /> Farbverlauf
      </label>
      ${resetBtn('gradient:bgColor2:gradientAngle')}
    </div>
    <div class="row" style="align-items:flex-end;${s.gradient ? '' : 'opacity:.45;pointer-events:none'}" data-tcgradrow>
      ${colorField(s, 'bgColor2', 'Endfarbe', null)}
      <div style="flex:1 1 220px">${rangeField(s, 'gradientAngle', 'Richtung', 0, 360, '°', !s.gradient)}</div>
    </div>
    <p class="hint">Die Transparenz gilt für beide Verlaufsfarben. 0° = von unten nach oben, 90° = von links nach rechts.</p>`;
  const hoverBody = `
    <div class="row" style="align-items:flex-end">
      ${colorField(s, 'hoverBorderColor', 'Rahmenfarbe (Hover)', 'hoverBorderOpacity')}
    </div>
    <div class="row" style="align-items:flex-end;margin-top:.4rem">
      ${colorField(s, 'hoverBgColor', 'Hintergrund (Hover)', 'hoverBgOpacity')}
    </div>
    <p class="hint">Hintergrund-Transparenz 0 % = der Hintergrund bleibt beim Überfahren unverändert (Standard).</p>`;
  const copyLabel =
    editTheme === 'light'
      ? '➡️ Werte von Hell nach Dunkel kopieren'
      : '⬅️ Werte von Dunkel nach Hell kopieren';
  return `
    ${ownToggle}
    <div class="row" style="align-items:center;gap:.5rem;margin:.6rem 0 .2rem">
      <button type="button" data-tccopyside style="flex:0 0 auto">${copyLabel}</button>
      <span class="hint" style="margin:0">Überträgt Rahmen, Hintergrund und Hover des bearbeiteten Modus in den anderen Modus.</span>
    </div>
    ${section(`🖼️ Rahmen ${badge}`, frameBody)}
    ${section(`🎨 Hintergrund ${badge}`, bgBody)}
    ${section(`✨ Hover (beim Überfahren) ${badge}`, hoverBody)}
    ${section('📋 Design übertragen <span class="hint" style="font-weight:400">(Hell + Dunkel)</span>', applyBody(lang))}`;
}

// „Design übertragen": das Design der Quelle (gewählte Karte oder Standard) auf
// ausgewählte Zielkarten anwenden. Quelle = Standard bedeutet: die Zielkarten
// verlieren ihr eigenes Design und nutzen wieder den Standard. Bei einer Karte
// als Quelle kann ihr Design zusätzlich zum neuen Standard für alle werden.
function applyBody(lang) {
  const tc = getToolCards(lang);
  const src = selected ? cardById(lang, selected) : null;
  const srcLabel = src ? `„${esc(src.title)}"` : 'Standard (alle Karten)';
  const groups = SECTIONS.map((sec) => {
    const cards = cardList(lang).filter((c) => c.section === sec);
    if (!cards.length) return '';
    const items = cards
      .map((c) => {
        const isSrc = c.id === selected;
        const own = !!tc.cards[c.id];
        return `<label class="tc-target${isSrc ? ' src' : ''}" title="${isSrc ? 'Quelle (kann nicht Ziel sein)' : own ? 'Hat eigenes Design – wird ersetzt' : 'Nutzt Standard-Design'}">
            <input type="checkbox" data-tctarget="${esc(c.id)}" ${targets.has(c.id) ? 'checked' : ''} ${isSrc ? 'disabled' : ''} />
            <span>${esc(c.title)}${own ? ' ●' : ''}${isSrc ? ' (Quelle)' : ''}</span>
          </label>`;
      })
      .join('');
    return `<div class="tc-target-group">
        <div class="tc-target-head">
          <strong>${esc(SECTION_LABEL[sec])}</strong>
          <button type="button" class="hd-reset" data-tctargetsec="${sec}" title="Alle Karten dieses Bereichs auswählen/abwählen">Alle</button>
        </div>
        <div class="tc-targets">${items}</div>
      </div>`;
  }).join('');
  const n = [...targets].filter((id) => id !== selected).length;
  const applyLabel = src
    ? `➡️ Design von ${srcLabel} auf <span data-tcapplycount>${n}</span> Karte(n) anwenden`
    : `↺ <span data-tcapplycount>${n}</span> Karte(n) auf das Standard-Design zurücksetzen`;
  const asDefault = src
    ? `<button type="button" data-tcasdefault style="flex:0 0 auto">★ Design von ${srcLabel} als Standard für alle Karten übernehmen</button>
       <span class="hint" style="margin:0">Karten mit eigenem Design (●) behalten ihres.</span>`
    : '';
  return `
    <p class="hint" style="margin:0 0 .4rem">Quelle: <strong style="color:var(--text)">${srcLabel}</strong> – Rahmen, Hintergrund und Hover (Hell + Dunkel) werden auf die angehakten Karten übertragen; sie erhalten damit ein eigenes Design (●).${
      src ? '' : ' Beim Standard als Quelle wird das eigene Design der angehakten Karten entfernt.'
    }</p>
    ${groups}
    <div class="row" style="align-items:center;gap:.5rem;margin-top:.6rem">
      <button type="button" class="hd-reset" data-tctargetall="1">Alle auswählen</button>
      <button type="button" class="hd-reset" data-tctargetall="0">Auswahl leeren</button>
      <button type="button" class="primary" data-tcapply style="flex:0 0 auto" ${n ? '' : 'disabled'}>${applyLabel}</button>
    </div>
    ${asDefault ? `<div class="row" style="align-items:center;gap:.5rem;margin-top:.6rem">${asDefault}</div>` : ''}`;
}

// Übersicht aller Karten mit effektivem Design im bearbeiteten Modus.
function overviewBlock(lang) {
  const tc = getToolCards(lang);
  const groups = SECTIONS.map((sec) => {
    const cards = cardList(lang).filter((c) => c.section === sec);
    if (!cards.length) return '';
    const tiles = cards
      .map((c) => {
        const own = !!tc.cards[c.id];
        const cls = `tc-pick${c.id === selected ? ' active' : ''}`;
        const attrs = `data-tcpick="${esc(c.id)}"`;
        return `<div class="${cls}" ${attrs} title="Klicken, um diese Karte zu bearbeiten">
            ${own ? '<span class="tc-own" title="Eigenes Design">●</span>' : ''}
            ${cardHtml(lang, c, editTheme, effectiveStyle(lang, c.id)[editTheme], `data-tcov="${esc(c.id)}"`)}
          </div>`;
      })
      .join('');
    return `<p class="hint" style="margin:.7rem 0 .3rem;font-weight:600;color:var(--text)">${esc(SECTION_LABEL[sec])}</p>
      <div class="tc-grid">${tiles}</div>`;
  }).join('');
  return `
    <div class="panel">
      <h2>Alle Karten – Vorschau <span class="lang-badge">${themeLabel(editTheme)}</span></h2>
      <p class="hint">So sehen die Tool-Karten nach dem Veröffentlichen aus (Standard-Design; ● = Karte mit eigenem Design). Karte anklicken, um sie zu bearbeiten.</p>
      <style data-tcovhover>${overviewHoverCss(lang)}</style>
      <div data-tcoverview style="background:${pageBg(editTheme)};${fontCss()}border-radius:10px;padding:.6rem .8rem .9rem;margin-top:.4rem">${groups}</div>
    </div>`;
}

function panelHtml(lang) {
  const tc = getToolCards(lang);
  return `
    <div class="panel">
      <h2>Tool-Karten <span class="lang-badge">${lang.toUpperCase()}</span></h2>
      <p class="hint">Gestaltet Rahmen und Hintergrund der Tool-Karten auf der ${lang === 'de' ? 'deutschen' : 'englischen'} Startseite –
        ein Standard für alle Karten plus optionale Einzel-Designs je Karte, getrennt für Hell- und Dunkelmodus.
        Ausgeschaltet = Standard-Aussehen. Die Vorschau der bearbeiteten Karte bleibt beim Scrollen oben sichtbar.</p>
      <div style="display:flex;align-items:center;gap:.5rem;margin-top:.4rem">
        <label style="display:flex;align-items:center;gap:.4rem;color:var(--text);margin:0">
          <input type="checkbox" data-tcenabled ${tc.enabled ? 'checked' : ''} style="width:auto" /> Eigenes Tool-Karten-Design verwenden
        </label>
      </div>
      <div style="margin:.6rem 0 .2rem;padding:.5rem .6rem;border:1px dashed var(--border);border-radius:8px">
        <button type="button" data-tccopylang style="width:auto">${
          lang === 'de'
            ? '➡️ Dieses Tool-Karten-Design auf Englisch (EN) übernehmen'
            : '⬅️ Tool-Karten-Design von Deutsch (DE) übernehmen'
        }</button>
        <p class="hint" style="margin:.35rem 0 0">Kopiert <strong>alle</strong> Einstellungen (Standard + Einzel-Designs, Hell + Dunkel) von Deutsch nach Englisch.</p>
      </div>
      ${previewBlock(lang)}
      ${textsBlock(lang)}
      ${fieldsBlock(lang)}
    </div>
    ${overviewBlock(lang)}`;
}

// --- Live-Aktualisierung ohne Neu-Rendern (bei Eingaben in Felder) ---
function refreshPreview(pane, lang) {
  const st = effectiveStyle(lang, selected);
  for (const theme of ['light', 'dark']) {
    const card = pane.querySelector(`[data-tcprev="${theme}"] .tc-card`);
    if (card) card.setAttribute('style', cardStyle(st[theme]));
  }
  const hs = pane.querySelector('[data-tchover]');
  if (hs) hs.textContent = previewHoverCss(st);
  // Übersicht: jede Karte mit ihrem effektiven Design im bearbeiteten Modus.
  pane.querySelectorAll('[data-tcov]').forEach((el) => {
    el.setAttribute('style', cardStyle(effectiveStyle(lang, el.dataset.tcov)[editTheme]));
  });
  const ohs = pane.querySelector('[data-tcovhover]');
  if (ohs) ohs.textContent = overviewHoverCss(lang);
  const note = pane.querySelector('[data-tcnote]');
  if (note) note.textContent = noteText(lang);
}

export function renderToolCards() {
  const lang = state.nav.section === 'en' ? 'en' : 'de';
  const pane = $('#content');
  // Gewählte Karte muss in dieser Sprache existieren (sonst Standard).
  if (selected && !cardById(lang, selected)) selected = '';
  pane.innerHTML = panelHtml(lang);
  const rerender = () => renderToolCards();

  pane.querySelector('[data-tcenabled]')?.addEventListener('change', (e) => {
    getToolCards(lang).enabled = e.target.checked;
    refreshPreview(pane, lang);
  });
  pane.querySelector('[data-tcsel]')?.addEventListener('change', (e) => {
    selected = e.target.value;
    rerender();
  });
  pane.querySelectorAll('[data-tctheme]').forEach((el) =>
    el.addEventListener('click', () => {
      editTheme = el.dataset.tctheme === 'dark' ? 'dark' : 'light';
      rerender();
    }),
  );
  // Klick auf eine Vorschau-Seite wechselt in deren Modus.
  pane.querySelectorAll('[data-tcprev]').forEach((el) =>
    el.addEventListener('click', () => {
      const t = el.dataset.tcprev === 'dark' ? 'dark' : 'light';
      if (t !== editTheme) {
        editTheme = t;
        rerender();
      }
    }),
  );
  pane.querySelector('[data-tcown]')?.addEventListener('change', (e) => {
    const tc = getToolCards(lang);
    if (e.target.checked) ensureEnabled(lang, pane);
    if (e.target.checked) tc.cards[selected] = JSON.parse(JSON.stringify(tc.default));
    else delete tc.cards[selected];
    rerender();
    toast(
      e.target.checked
        ? 'Eigenes Design für die Karte angelegt'
        : 'Karte nutzt wieder das Standard-Design',
    );
  });
  // Design-Felder: Farben, Zahlen, Regler, Linienart, Verlauf-Schalter.
  pane.querySelectorAll('[data-tcf]').forEach((el) => {
    const field = el.dataset.tcf;
    const evt = el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input';
    el.addEventListener(evt, () => {
      ensureEnabled(lang, pane);
      const s = editSide(lang);
      if (field === 'gradient') {
        s.gradient = el.checked;
        rerender(); // Verlaufs-Felder ein-/ausblenden + Beschriftung wechseln
        return;
      }
      if (field === 'borderStyle')
        s.borderStyle = TOOL_CARD_BORDER_STYLES.includes(el.value) ? el.value : 'solid';
      else if (field === 'borderWidth') s.borderWidth = clampInt(el.value, 0, 8, s.borderWidth);
      else if (field === 'borderRadius') s.borderRadius = clampInt(el.value, 0, 40, s.borderRadius);
      else if (field === 'gradientAngle')
        s.gradientAngle = clampInt(el.value, 0, 360, s.gradientAngle);
      else if (/Opacity$/.test(field)) s[field] = clampInt(el.value, 0, 100, s[field]);
      else s[field] = el.value; // Farben
      refreshPreview(pane, lang);
    });
  });
  // Zurücksetzen (↺): ein Feld bzw. "a:b:c" mehrere Felder auf die Quelle
  // (Werkswerte bzw. Standard-Design) zurücksetzen.
  pane.querySelectorAll('[data-tcreset]').forEach((el) =>
    el.addEventListener('click', () => {
      const s = editSide(lang);
      const src = resetSource(lang);
      el.dataset.tcreset.split(':').forEach((f) => {
        if (f in src) s[f] = src[f];
      });
      rerender();
      toast('Auf Standard zurückgesetzt');
    }),
  );
  pane.querySelector('[data-tccopyside]')?.addEventListener('click', () => {
    ensureEnabled(lang, pane);
    const st = effectiveStyle(lang, selected);
    const other = editTheme === 'light' ? 'dark' : 'light';
    st[other] = JSON.parse(JSON.stringify(st[editTheme]));
    rerender();
    toast(`Werte nach ${other === 'dark' ? 'Dunkel' : 'Hell'} kopiert`);
  });
  pane.querySelector('[data-tccopylang]')?.addEventListener('click', () => {
    if (
      !confirm(
        'Alle Tool-Karten-Einstellungen für Englisch werden mit den deutschen überschrieben (Standard + Einzel-Designs, Hell + Dunkel). Fortfahren?',
      )
    )
      return;
    state.media.en.toolCards = JSON.parse(JSON.stringify(getToolCards('de')));
    if (!state.media.en.toolCards) state.media.en.toolCards = defaultToolCards();
    rerender();
    toast('Tool-Karten-Design von Deutsch nach Englisch übernommen');
  });
  // „Design übertragen": Ziel-Auswahl (einzeln / Bereich / alle) + Anwenden.
  const applyBtn = pane.querySelector('[data-tcapply]');
  const refreshApplyBtn = () => {
    const n = [...targets].filter((id) => id !== selected).length;
    const cnt = pane.querySelector('[data-tcapplycount]');
    if (cnt) cnt.textContent = String(n);
    if (applyBtn) applyBtn.disabled = n === 0;
  };
  pane.querySelectorAll('[data-tctarget]').forEach((cb) =>
    cb.addEventListener('change', () => {
      if (cb.checked) targets.add(cb.dataset.tctarget);
      else targets.delete(cb.dataset.tctarget);
      refreshApplyBtn();
    }),
  );
  pane.querySelectorAll('[data-tctargetsec]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const ids = cardList(lang)
        .filter((c) => c.section === btn.dataset.tctargetsec && c.id !== selected)
        .map((c) => c.id);
      const allOn = ids.every((id) => targets.has(id));
      ids.forEach((id) => (allOn ? targets.delete(id) : targets.add(id)));
      rerender();
    }),
  );
  pane.querySelectorAll('[data-tctargetall]').forEach((btn) =>
    btn.addEventListener('click', () => {
      targets.clear();
      if (btn.dataset.tctargetall === '1')
        cardList(lang).forEach((c) => c.id !== selected && targets.add(c.id));
      rerender();
    }),
  );
  applyBtn?.addEventListener('click', () => {
    const tc = getToolCards(lang);
    const valid = new Set(cardList(lang).map((c) => c.id));
    const ids = [...targets].filter((id) => id !== selected && valid.has(id));
    if (!ids.length) return;
    ensureEnabled(lang, pane);
    if (selected) {
      const srcStyle = effectiveStyle(lang, selected);
      for (const id of ids) tc.cards[id] = JSON.parse(JSON.stringify(srcStyle));
    } else {
      for (const id of ids) delete tc.cards[id];
    }
    targets.clear();
    rerender();
    toast(
      selected
        ? `Design auf ${ids.length} Karte(n) angewendet`
        : `${ids.length} Karte(n) auf Standard-Design zurückgesetzt`,
    );
  });
  pane.querySelector('[data-tcasdefault]')?.addEventListener('click', () => {
    const src = cardById(lang, selected);
    if (!src) return;
    if (
      !confirm(
        `Das Design von „${src.title}" wird zum Standard für alle Karten ohne eigenes Design (Hell + Dunkel). Fortfahren?`,
      )
    )
      return;
    const tc = getToolCards(lang);
    ensureEnabled(lang, pane);
    tc.default = JSON.parse(JSON.stringify(effectiveStyle(lang, selected)));
    // Die Quelle selbst entspricht jetzt dem Standard -> eigenes Design überflüssig.
    delete tc.cards[selected];
    rerender();
    toast(`Design von „${src.title}" ist jetzt der Standard`);
  });
  // Texte der Karte (bzw. „Öffnen"-Beschriftung beim Standard) – Overrides live.
  pane.querySelectorAll('[data-tctx]').forEach((el) => {
    const key = el.dataset.tctx;
    el.addEventListener('input', () => {
      if (key === 'open') {
        if (el.value.trim() === '') delPath(state.overrides[lang], ['tool', 'open']);
        else setPath(state.overrides[lang], ['tool', 'open'], el.value.trim());
      } else if (!setCardText(lang, selected, key, el.value)) {
        el.style.borderColor = '#ef4444';
        return;
      }
      el.style.borderColor = '';
      const rst = pane.querySelector(`[data-tctxreset="${key}"]`);
      if (rst)
        rst.disabled =
          key === 'open'
            ? getPath(state.overrides[lang], ['tool', 'open']) === undefined
            : !hasTextOverride(lang, selected, key);
      refreshCardTexts(pane, lang);
    });
    if (key === 'link')
      el.addEventListener('change', () => {
        if (el.style.borderColor)
          toast('Link nicht übernommen – erlaubt sind https://…, /pfad/ oder #');
      });
  });
  pane.querySelectorAll('[data-tctxreset]').forEach((el) =>
    el.addEventListener('click', () => {
      const key = el.dataset.tctxreset;
      if (key === 'open') delPath(state.overrides[lang], ['tool', 'open']);
      else delPath(state.overrides[lang], [...selected.split('.'), key]);
      rerender();
      toast('Auf Standardtext zurückgesetzt');
    }),
  );
  pane.querySelectorAll('[data-tcpick]').forEach((el) =>
    el.addEventListener('click', () => {
      selected = el.dataset.tcpick;
      rerender();
      // Zur Sticky-Vorschau/Auswahl scrollen, damit die Felder sichtbar sind.
      pane.querySelector('.tc-sticky')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }),
  );
  bindSliders(pane); // nach den Feld-Handlern: Zahlenfeld löst deren input-Event aus
  bindColorPickers(pane);
}

function clampInt(v, min, max, def) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : def;
}
