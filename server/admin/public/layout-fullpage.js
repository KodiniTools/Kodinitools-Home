// Layout-Tab: Ganzseiten-Vorschau – schematische Startseite, in der das
// Hero-Medium (Banner/Raster), die drei Sektions-Medien und die Tool-Karten per
// Maus verschoben werden. Der Versatz (px) wirkt auf der Seite als relative
// Position – der Platz im Fluss bleibt. Die Seite wird in Originalbreite
// (1200 px) aufgebaut und per CSS `zoom` in die Spalte eingepasst; Maus-
// bewegungen werden durch den Zoom geteilt.

import { esc, toast } from './core.js';
import {
  state,
  getPath,
  getSectionMedia,
  SECTION_MEDIA_KEYS,
  SECTION_MEDIA_LABELS,
  normMediaOffset,
  MEDIA_OFFSET_MAX,
  HERO_LAYOUT_COLS,
  visibleGridCells,
  getPageBg,
  PAGE_BG_DEFAULT,
  isCardHidden,
  TOOL_CARD_KEY,
  getToolCards,
  rgbaFromHex,
  getGlobalFont,
} from './model.js';
import { fontFF } from './layout-shared.js';
import { mediaInfo, designCss, textStyle, MEDIA_BASE } from './sectionmedia.js';

const PAGE_W = 1200;
// Seitenschrift „Supreme“ (base.css) mit denselben Schnitten, damit Zeilenumbrüche
// und Höhen der Vorschau der Seite entsprechen (Dateien wie die Seite aus /fonts).
const PREV_FONT = 'kodini-prev-supreme';
const PREV_FONT_FACES = [
  ['Supreme-Regular.woff2', 400],
  ['Supreme-Medium.woff2', 500],
  ['Supreme-Bold.woff2', 700],
  ['Supreme-Extrabold.woff2', 800],
]
  .map(
    ([f, w]) =>
      `@font-face{font-family:"${PREV_FONT}";src:url("/fonts/${f}") format("woff2");font-weight:${w};font-style:normal;font-display:swap;}`,
  )
  .join('');
const PREV_FONT_STACK = `font-family:'${PREV_FONT}',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;`;
const MODE_LABEL = { light: '☀️ Hell', dark: '🌙 Dunkel' };
const FULL_KEYS = ['hero', ...SECTION_MEDIA_KEYS];
const FULL_LABELS = {
  hero: 'Hero-Medium (Banner/Raster)',
  audio: 'Medium Audio-Tools',
  image: 'Medium Bild-Tools',
  diverse: 'Medium Diverse Tools',
};
// Tool-Sektionen der Seite: Sektions-Medium-Schlüssel -> Locale-Abschnitt der Karten.
const CARD_SECTION = { audio: 'tools', image: 'imageTools', diverse: 'diverseTools' };
const FULL_TEXT = {
  light: { title: '#003971', text: '#1e293b', muted: '#64748b', card: 'rgba(1,79,153,.08)' },
  dark: { title: '#f9f2d5', text: '#e2e8f0', muted: '#94a3b8', card: 'rgba(255,255,255,.06)' },
};
// Vorschau-Modus und zuletzt angeklicktes Element (bleiben über Neu-Rendern erhalten).
let fullMode = 'light';
let fullActive = null;
function prevBg(mode) {
  return getPageBg(mode) || PAGE_BG_DEFAULT[mode];
}
// Effektiver Text eines Locale-Pfads (Override, sonst Standard).
function effText(lang, path) {
  const o = getPath(state.overrides[lang], path);
  if (typeof o === 'string' && o !== '') return o;
  const d = getPath(state.defaults[lang], path);
  return typeof d === 'string' ? d : '';
}
// Sichtbare Tool-Karten einer Sektion (Reihenfolge wie auf der Seite).
function sectionCards(lang, sectionKey) {
  const sec = CARD_SECTION[sectionKey];
  const defs = (state.defaults[lang] || {})[sec];
  const out = [];
  if (!defs || typeof defs !== 'object') return out;
  for (const [key, entry] of Object.entries(defs)) {
    if (!entry || typeof entry !== 'object' || !('title' in entry) || !('link' in entry)) continue;
    const id = `${sec}.${key}`;
    if (isCardHidden(id)) continue;
    out.push({
      id,
      title: effText(lang, [sec, key, 'title']) || key,
      // Wie auf der Seite: ein leerer Override ('') entfernt das Icon bewusst.
      svg: (() => {
        const o = getPath(state.overrides[lang], [sec, key, 'svg']);
        return typeof o === 'string' ? o : effText(lang, [sec, key, 'svg']);
      })(),
      badge: effText(lang, [sec, key, 'badge']),
    });
  }
  return out;
}
// Versatz lesen/schreiben – Schlüssel: 'hero' | Sektion | 'card:<sektion.key>'.
function cardOffsets(lang) {
  const m = state.media[lang];
  if (!m.toolCardOffsets || typeof m.toolCardOffsets !== 'object') m.toolCardOffsets = {};
  return m.toolCardOffsets;
}
export function fullOffset(lang, key) {
  if (key === 'hero') {
    const m = state.media[lang];
    return { x: m.heroMediaOffsetX || 0, y: m.heroMediaOffsetY || 0 };
  }
  if (key.startsWith('card:')) {
    const o = cardOffsets(lang)[key.slice(5)];
    return { x: (o && o.x) || 0, y: (o && o.y) || 0 };
  }
  const c = getSectionMedia(lang, key);
  return { x: c.offsetX || 0, y: c.offsetY || 0 };
}
export function setFullOffset(lang, key, x, y) {
  const nx = normMediaOffset(x, 'x');
  const ny = normMediaOffset(y, 'y');
  if (key === 'hero') {
    state.media[lang].heroMediaOffsetX = nx;
    state.media[lang].heroMediaOffsetY = ny;
  } else if (key.startsWith('card:')) {
    const id = key.slice(5);
    const all = cardOffsets(lang);
    if (nx || ny) all[id] = { x: nx, y: ny };
    else delete all[id];
  } else {
    const c = getSectionMedia(lang, key);
    c.offsetX = nx;
    c.offsetY = ny;
  }
  return { x: nx, y: ny };
}
const moveCss = (o) =>
  `position:relative;left:${o.x}px;top:${o.y}px;cursor:move;touch-action:none;user-select:none`;
const activeCss = (key) =>
  fullActive === key ? ';outline:3px solid var(--accent);outline-offset:2px' : '';
// Hero-Medium der Vorschau: Banner (Bild/Video) oder Kachel-Raster (Anordnung,
// ausgeblendete Kacheln entfallen) – wie im Tab „Layout“ eingestellt.
function heroMediaHtml(lang, mode) {
  const m = state.media[lang];
  const c = FULL_TEXT[mode];
  if (m.heroMode === 'grid') {
    const layout = m.heroLayout;
    const cells = visibleGridCells(lang, layout);
    const cols = Math.min(HERO_LAYOUT_COLS[layout] || 3, Math.max(1, cells.length));
    const maxW = layout === 'row4' ? 860 : layout === 'big2' ? 900 : layout === 'vrow' ? 420 : 720;
    const tiles = cells
      .map((i) => {
        const info = mediaInfo(lang, `grid${i}`);
        const inner = info
          ? info.isVid
            ? `<video src="${esc(info.src)}" muted playsinline preload="metadata" style="${MEDIA_BASE}"></video>`
            : `<img src="${esc(info.src)}" alt="" style="${MEDIA_BASE}" />`
          : `<span style="color:${c.muted};font-size:14px">Kachel ${i + 1}</span>`;
        return `<div style="position:relative;aspect-ratio:1 / 1;border-radius:14px;overflow:hidden;background:${c.card};display:flex;align-items:center;justify-content:center">${inner}</div>`;
      })
      .join('');
    return `<div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:16px;width:100%;max-width:${maxW}px;margin:0 auto">${tiles || `<span style="color:${c.muted}">Alle Kacheln ausgeblendet</span>`}</div>`;
  }
  if (m.heroBannerShow === false)
    return `<div style="color:${c.muted};font-size:14px;padding:12px">Banner ausgeblendet</div>`;
  const info = mediaInfo(lang, 'heroBanner');
  if (!info)
    return `<div style="color:${c.muted};font-size:14px;padding:12px">Kein Hero-Medium</div>`;
  const st =
    'display:block;max-width:min(100%,900px);max-height:240px;width:auto;height:auto;object-fit:contain;border-radius:14px';
  return info.isVid
    ? `<video src="${esc(info.src)}" muted playsinline preload="metadata" style="${st}"></video>`
    : `<img src="${esc(info.src)}" alt="" style="${st}" />`;
}
// Tool-Karte der Vorschau (verschiebbar) mit den Maßen der Seite (tool-cards.css,
// 16 px Grundschrift): Karte 1.1rem/0.85rem Innenabstand, Icon 44 px, Badge, Titel
// (2 Zeilen reserviert), Fußzeile mit Favoriten-Knopf (28 px) – so stimmt der
// Versatz aus der Vorschau 1:1 mit der Seite überein. Design (Rahmen, Hintergrund,
// Typografie) aus dem Tab „Tool-Karten“ (Standard oder Einzel-Design), sonst Seitenstandard.
function cardDesign(lang, id, mode) {
  const tc = getToolCards(lang);
  const st = tc.enabled ? tc.cards[id] || tc.default : null;
  const side = st ? st[mode] : null;
  const text = st ? st.text : null;
  const dark = mode === 'dark';
  let bg = dark ? '#142640' : '#ffffff';
  let border = dark ? '1px solid rgba(232,169,69,.12)' : '1px solid #e5e7eb';
  let radius = 16;
  if (side) {
    const c1 = rgbaFromHex(side.bgColor, side.bgOpacity);
    bg =
      side.gradient && side.bgColor2
        ? `linear-gradient(${side.gradientAngle || 135}deg, ${c1}, ${rgbaFromHex(side.bgColor2, side.bgOpacity)})`
        : c1;
    border = `${side.borderWidth}px ${side.borderStyle || 'solid'} ${rgbaFromHex(side.borderColor, side.borderOpacity)}`;
    radius = side.borderRadius;
  }
  const titleSize = text && text.titleSize > 0 ? text.titleSize : 14.4;
  const titleWeight = text && text.titleWeight ? text.titleWeight : 600;
  const badgeSize = text && text.badgeSize > 0 ? text.badgeSize : 9.92;
  const align = text && text.align ? text.align : 'left';
  const alignSelf = align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start';
  const titleFont = text && text.titleFont ? fontFF(text.titleFont) : '';
  return { bg, border, radius, titleSize, titleWeight, badgeSize, align, alignSelf, titleFont };
}
function cardHtml(lang, card, mode) {
  const c = FULL_TEXT[mode];
  const d = cardDesign(lang, card.id, mode);
  const key = `card:${card.id}`;
  const dark = mode === 'dark';
  const icon = card.svg
    ? `<div style="width:44px;height:44px;border-radius:9.6px;overflow:hidden;background:${dark ? '#eef1f5' : '#ffffff'};box-sizing:border-box;padding:5px;flex-shrink:0;align-self:${d.alignSelf}"><img src="${esc(card.svg)}" alt="" style="width:100%;height:100%;object-fit:contain;display:block" /></div>`
    : '';
  const badge = card.badge
    ? `<span style="display:inline-block;font-size:${d.badgeSize}px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:${dark ? '#ffffff' : '#014f99'};background:${dark ? 'rgba(255,255,255,.1)' : 'rgba(1,79,153,.08)'};border:1px solid ${dark ? 'rgba(255,255,255,.25)' : 'rgba(1,79,153,.14)'};border-radius:5.6px;padding:2.4px 6.72px;white-space:nowrap;align-self:${d.alignSelf};margin-bottom:4.8px">${esc(card.badge)}</span>`
    : '';
  const fav = `<span style="display:inline-block;width:28px;height:28px;border-radius:50%;color:${c.muted}"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="padding:6px;box-sizing:border-box"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg></span>`;
  return `<div data-smfullmedia="${esc(key)}" data-smcard="${esc(card.id)}" role="button" tabindex="0" title="${esc(card.title)} – Ziehen: verschieben (Pfeiltasten: 1 px, Shift 10 px)" style="z-index:1;${moveCss(fullOffset(lang, key))}${activeCss(key)}">
      <div style="background:${d.bg};border:${d.border};border-radius:${d.radius}px;padding:17.6px 17.6px 13.6px;display:flex;flex-direction:column;gap:7.2px;height:100%;box-sizing:border-box;overflow:hidden">
        ${icon}${badge}
        <h3 style="font-size:${d.titleSize}px;font-weight:${d.titleWeight};color:${c.title};line-height:1.3;min-height:2.6em;margin:0 0 5.6px;white-space:pre-line;text-align:${d.align};${d.titleFont}">${esc(card.title)}</h3>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8.8px;padding-top:8.8px">${fav}<span style="font-size:12px;opacity:0">Öffnen</span></div>
      </div>
    </div>`;
}
// Sektion der Vorschau: Überschrift, verschiebbares Medium, verschiebbare Karten.
function sectionHtml(lang, key, mode) {
  const c = FULL_TEXT[mode];
  const title = effText(lang, [CARD_SECTION[key], 'sectionTitle']) || SECTION_MEDIA_LABELS[key];
  const info = mediaInfo(lang, key);
  const css = designCss(lang, key, mode);
  const t = getSectionMedia(lang, key).text;
  const media = !info
    ? `<div style="${MEDIA_BASE};display:flex;align-items:center;justify-content:center;background:#1e293b"><span style="color:#94a3b8;font-size:14px">Kein Medium</span></div>`
    : info.isVid
      ? `<video src="${esc(info.src)}" muted playsinline preload="metadata" style="${MEDIA_BASE};${css.media}"></video>`
      : `<img src="${esc(info.src)}" alt="" style="${MEDIA_BASE};${css.media}" />`;
  const cards = sectionCards(lang, key)
    .map((card) => cardHtml(lang, card, mode))
    .join('');
  return `
    <section data-smfullsection="${key}" style="max-width:${PAGE_W}px;margin:0 auto;padding:80px 32px;box-sizing:border-box">
      <h2 style="text-align:center;font-size:40px;font-weight:600;letter-spacing:.04em;line-height:1.2;margin:0 0 40px;color:${c.title}">${esc(title)}</h2>
      <div data-smfullmedia="${key}" role="button" tabindex="0" title="${esc(FULL_LABELS[key])} – Ziehen: verschieben (Pfeiltasten: 1 px, Shift 10 px)" style="width:100%;max-width:720px;margin:0 auto 24px;aspect-ratio:16 / 9;overflow:hidden;box-sizing:border-box;background:#000;${css.wrap};${moveCss(fullOffset(lang, key))}${activeCss(key)}">
        ${media}
        <div style="${t.text ? textStyle(t) : ''}">${esc(t.text || '')}</div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:20px;grid-auto-rows:1fr;position:relative;z-index:1">${cards || `<p style="color:${c.muted};grid-column:1 / -1;text-align:center">Keine Karten</p>`}</div>
    </section>`;
}
// Felder „Verschiebung X / Y“ je Medium (folgen dem Ziehen live).
function fieldsHtml(lang) {
  return FULL_KEYS.map((key) => {
    const o = fullOffset(lang, key);
    return `<div data-smoffrow="${key}" style="display:flex;align-items:center;gap:.3rem;flex-wrap:wrap">
        <span style="min-width:190px;font-size:.85rem;color:var(--text)">${FULL_LABELS[key]}</span>
        <input type="number" data-smoff="${key}:x" min="-${MEDIA_OFFSET_MAX.x}" max="${MEDIA_OFFSET_MAX.x}" step="1" value="${o.x}" style="width:80px" title="Waagerecht (px): − links, + rechts" />
        <input type="number" data-smoff="${key}:y" min="-${MEDIA_OFFSET_MAX.y}" max="${MEDIA_OFFSET_MAX.y}" step="1" value="${o.y}" style="width:80px" title="Senkrecht (px): − oben, + unten" />
        <button type="button" class="hd-reset" data-smoffreset="${key}" title="Verschiebung zurücksetzen (0/0)" aria-label="Verschiebung zurücksetzen">↺</button>
      </div>`;
  }).join('');
}
// Liste der verschobenen Tool-Karten (Titel, Versatz, ↺) + „alle zurücksetzen“.
function cardsInfoHtml(lang) {
  const all = cardOffsets(lang);
  const ids = Object.keys(all).filter((id) => TOOL_CARD_KEY.test(id) && (all[id].x || all[id].y));
  if (!ids.length)
    return '<span class="hint" style="margin:0">🃏 Tool-Karten: keine verschoben – Karte in der Vorschau ziehen.</span>';
  const titleOf = (id) => {
    const [sec, key] = id.split('.');
    return effText(lang, [sec, key, 'title']) || id;
  };
  return `<span class="hint" style="margin:0">🃏 Verschobene Tool-Karten:</span> ${ids
    .map(
      (id) =>
        `<span style="display:inline-flex;align-items:center;gap:.25rem;font-size:.85rem;color:var(--text)">${esc(titleOf(id))} <span class="hint" style="margin:0">(${all[id].x}/${all[id].y})</span><button type="button" class="hd-reset" data-smoffreset="card:${esc(id)}" title="Verschiebung dieser Karte zurücksetzen" aria-label="Karte zurücksetzen">↺</button></span>`,
    )
    .join(
      ' ',
    )} <button type="button" class="hd-reset" data-smcardsreset title="Verschiebung aller Tool-Karten zurücksetzen">↺ alle Karten</button>`;
}
export function fullPageHtml(lang) {
  const mode = fullMode;
  const c = FULL_TEXT[mode];
  const m = state.media[lang];
  const heroTitle = effText(lang, ['hero', 'title']);
  const heroSub = effText(lang, ['hero', 'subtitle']);
  const feats = getPath(state.defaults[lang], ['hero', 'features']);
  const chips = (feats && typeof feats === 'object' ? Object.values(feats) : [])
    .slice(0, 6)
    .map(
      (label) =>
        `<div style="padding:13.6px 8px;border-radius:12px;background:${c.card};font-size:15.2px;font-weight:600;text-align:center;color:${c.title}">${esc(String(label))}</div>`,
    )
    .join('');
  const heroBg = mode === 'dark' ? 'rgba(14,28,50,.8)' : 'rgba(255,255,255,.7)';
  const heroBorder = mode === 'dark' ? 'rgba(232,169,69,.28)' : 'rgba(1,79,153,.25)';
  const hero = `
    <div style="max-width:${PAGE_W}px;margin:32px auto 40px;padding:64px 32px;border-radius:32px;background:${heroBg};border:1px solid ${heroBorder};text-align:center;box-sizing:border-box">
      <div data-smfullmedia="hero" role="button" tabindex="0" title="Ziehen: Hero-Medium verschieben (Pfeiltasten: 1 px, Shift 10 px)" style="display:flex;flex-direction:column;align-items:center;gap:16px;margin-bottom:32px;${moveCss(fullOffset(lang, 'hero'))}${activeCss('hero')}">${heroMediaHtml(lang, mode)}</div>
      <div style="font-size:40px;font-weight:800;line-height:1.2;margin-bottom:12px;color:${c.title}">${esc(heroTitle)}</div>
      <div style="font-size:17.6px;max-width:600px;margin:0 auto;white-space:pre-line;color:${c.title}">${esc(heroSub)}</div>
      <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:9.6px;margin-top:32px">${chips}</div>
      <div style="display:inline-block;margin-top:32px;padding:13.6px 35.2px;border-radius:50px;background:${mode === 'dark' ? '#e8a945' : '#014f99'};color:${mode === 'dark' ? '#1e293b' : '#fff'};font-weight:700;font-size:16.8px">${esc(effText(lang, ['hero', 'cta']) || 'Jetzt starten')}</div>
    </div>`;
  const sections = SECTION_MEDIA_KEYS.map((k) => sectionHtml(lang, k, mode)).join('');
  return `
    <details class="panel" data-smfull open style="padding:.7rem .9rem">
      <summary style="cursor:pointer;font-weight:700;color:var(--text)">🗺️ Ganze Seite – Vorschau: Medien &amp; Tool-Karten verschieben</summary>
      <div style="display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;margin:.4rem 0 .2rem">
        <span class="mode-switch" title="Vorschau im Hell- oder Dunkelmodus anzeigen">
          ${['light', 'dark'].map((md) => `<button type="button" class="hd-reset${md === mode ? ' active' : ''}" data-smfullmode="${md}" aria-pressed="${md === mode}">${MODE_LABEL[md]}</button>`).join('')}
        </span>
        <span class="hint" style="margin:0">Hero-Modus: ${m.heroMode === 'grid' ? 'Kachel-Raster' : 'Einzelbanner'} (oben umschalten).</span>
      </div>
      <p class="hint" style="margin:.3rem 0">Schematische Ansicht der ${lang === 'de' ? 'deutschen' : 'englischen'} Startseite. <strong>Hero-Medium</strong>, die drei <strong>Sektions-Medien</strong> und jede <strong>Tool-Karte</strong> lassen sich mit der Maus <strong>verschieben</strong> (Pfeiltasten auf dem fokussierten Element: 1 px, Shift = 10 px) oder unten über die Felder setzen. Der Versatz gilt 1:1 in Pixeln auf der Seite; der Platz im Seitenfluss bleibt, nur das Element wandert. Texte und Buttons sind Platzhalter (Hero-Design-Tab).</p>
      <div class="row" style="gap:.35rem .9rem;align-items:center;margin:.2rem 0 .4rem">${fieldsHtml(lang)}</div>
      <div data-smcardsinfo style="display:flex;flex-wrap:wrap;gap:.3rem .6rem;align-items:center;margin:0 0 .6rem">${cardsInfoHtml(lang)}</div>
      <style>${PREV_FONT_FACES}</style>
      <div data-smfullwrap style="overflow:auto;max-height:70vh;border:1px solid var(--border);border-radius:10px;background:${prevBg(mode)};resize:vertical">
        <div data-smpage data-scale="0.5" style="width:${PAGE_W}px;zoom:0.5;padding:8px 0 24px;color:${c.text};${fontFF(getGlobalFont()) || PREV_FONT_STACK}line-height:1.6;box-sizing:border-box">
          ${hero}${sections}
        </div>
      </div>
    </details>`;
}
// Bindet Modus, Zoom, Ziehen, Pfeiltasten und Felder der Ganzseiten-Vorschau.
let resizeObs = null;
export function bindFullPage(pane, lang, rr) {
  const wrap = pane.querySelector('[data-smfullwrap]');
  const page = pane.querySelector('[data-smpage]');
  if (!wrap || !page) return;
  pane.querySelectorAll('[data-smfullmode]').forEach((b) =>
    b.addEventListener('click', () => {
      const next = b.dataset.smfullmode === 'dark' ? 'dark' : 'light';
      if (next === fullMode) return;
      fullMode = next;
      rr();
    }),
  );
  // Zoom so, dass die 1200 px breite Seite in die Spalte passt (max. 1:1).
  const fit = () => {
    const w = wrap.clientWidth - 2;
    const scale = w > 0 ? Math.min(1, w / PAGE_W) : 0.5;
    page.style.zoom = String(scale);
    page.dataset.scale = String(scale);
  };
  fit();
  if (resizeObs) resizeObs.disconnect();
  if (typeof ResizeObserver !== 'undefined') {
    resizeObs = new ResizeObserver(fit);
    resizeObs.observe(wrap);
  }
  const scaleOf = () => Number(page.dataset.scale) || 1;
  const cardsInfo = pane.querySelector('[data-smcardsinfo]');
  const apply = (key) => {
    const o = fullOffset(lang, key);
    pane.querySelectorAll(`[data-smfullmedia="${CSS.escape(key)}"]`).forEach((el) => {
      el.style.position = 'relative';
      el.style.left = `${o.x}px`;
      el.style.top = `${o.y}px`;
    });
    const ix = pane.querySelector(`[data-smoff="${key}:x"]`);
    const iy = pane.querySelector(`[data-smoff="${key}:y"]`);
    if (ix) ix.value = String(o.x);
    if (iy) iy.value = String(o.y);
    if (key.startsWith('card:') && cardsInfo) {
      cardsInfo.innerHTML = cardsInfoHtml(lang);
      bindResets();
    }
  };
  const bindResets = () => {
    pane.querySelectorAll('[data-smoffreset]').forEach((el) => {
      if (el.dataset.bound) return;
      el.dataset.bound = '1';
      el.addEventListener('click', () => {
        setFullOffset(lang, el.dataset.smoffreset, 0, 0);
        apply(el.dataset.smoffreset);
        toast('Verschiebung zurückgesetzt');
      });
    });
    pane.querySelectorAll('[data-smcardsreset]').forEach((el) => {
      if (el.dataset.bound) return;
      el.dataset.bound = '1';
      el.addEventListener('click', () => {
        const ids = Object.keys(cardOffsets(lang));
        ids.forEach((id) => setFullOffset(lang, `card:${id}`, 0, 0));
        ids.forEach((id) => apply(`card:${id}`));
        if (!ids.length && cardsInfo) cardsInfo.innerHTML = cardsInfoHtml(lang);
        toast('Alle Tool-Karten zurückgesetzt');
      });
    });
  };
  bindResets();
  // Felder X/Y (Hero + Sektions-Medien)
  pane.querySelectorAll('[data-smoff]').forEach((el) => {
    const i = el.dataset.smoff.lastIndexOf(':');
    const key = el.dataset.smoff.slice(0, i);
    const axis = el.dataset.smoff.slice(i + 1) === 'y' ? 'y' : 'x';
    el.addEventListener('input', () => {
      const o = fullOffset(lang, key);
      o[axis] = normMediaOffset(parseInt(el.value, 10), axis);
      setFullOffset(lang, key, o.x, o.y);
      apply(key);
    });
  });
  // Ziehen (Zoom berücksichtigen), Pfeiltasten, Klick = markieren.
  const ARROWS = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
  const mark = (key) => {
    fullActive = key;
    pane.querySelectorAll('[data-smfullmedia]').forEach((el) => {
      const on = el.dataset.smfullmedia === key;
      el.style.outline = on ? '3px solid var(--accent)' : '';
      el.style.outlineOffset = on ? '2px' : '';
    });
  };
  pane.querySelectorAll('[data-smfullmedia]').forEach((el) => {
    const key = el.dataset.smfullmedia;
    let drag = null;
    el.addEventListener('click', () => {
      if (el.dataset.smDragged) {
        delete el.dataset.smDragged;
        return;
      }
      mark(key);
    });
    el.addEventListener('keydown', (e) => {
      if (!ARROWS[e.key]) return;
      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;
      const o = fullOffset(lang, key);
      setFullOffset(lang, key, o.x + ARROWS[e.key][0] * step, o.y + ARROWS[e.key][1] * step);
      apply(key);
    });
    el.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      const o = fullOffset(lang, key);
      drag = { x: e.clientX, y: e.clientY, ox: o.x, oy: o.y, moved: false };
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      if (!drag.moved && Math.abs(dx) < 3 && Math.abs(dy) < 3) return;
      drag.moved = true;
      const sc = scaleOf();
      setFullOffset(lang, key, drag.ox + dx / sc, drag.oy + dy / sc);
      apply(key);
    });
    const end = (e) => {
      if (!drag) return;
      const moved = drag.moved;
      drag = null;
      if (el.hasPointerCapture && el.hasPointerCapture(e.pointerId))
        el.releasePointerCapture(e.pointerId);
      if (moved) {
        el.dataset.smDragged = '1';
        mark(key);
      }
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  });
}
