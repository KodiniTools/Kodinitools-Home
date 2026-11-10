// Layout-Tab: Ganzseiten-Vorschau – schematische Startseite, in der das
// Hero-Medium (Banner/Raster), die drei Sektions-Medien und die Tool-Karten per
// Maus verschoben werden. Der Versatz (px) wirkt auf der Seite als relative
// Position – der Platz im Fluss bleibt. Die Seite wird in Originalbreite
// (1200 px) aufgebaut und per CSS `zoom` in die Spalte eingepasst; Maus-
// bewegungen werden durch den Zoom geteilt.

import {
  state,
  getPath,
  getSectionMedia,
  SECTION_MEDIA_KEYS,
  SECTION_MEDIA_LABELS,
  normMediaOffset,
  HERO_LAYOUT_COLS,
  visibleGridCells,
  getPageBg,
  PAGE_BG_DEFAULT,
  isCardHidden,
  toolCardKeys,
  TOOL_CARD_KEY,
  getToolCards,
  rgbaFromHex,
  getGlobalFont,
  normCardScale,
  getTextStyle,
  UNIFORM_TEXT_KEYS,
  TEXT_OFFSET_MAX,
  getHomeLayout,
} from './model.js';
import { heroPreviewMediaStyle, heroCompactCss } from './hero-preview.js';
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
const FULL_KEYS = ['hero', ...SECTION_MEDIA_KEYS];
const FULL_LABELS = {
  hero: 'Hero-Medium (Banner/Raster)',
  audio: 'Medium Audio-Tools',
  image: 'Medium Bild-Tools',
  diverse: 'Medium Diverse Tools',
};
// Verschiebbare Texte ('text:<slot>'): Versatz liegt in media.<lang>.textStyles[slot]
// .offsetX/offsetY – derselbe Speicherort wie im Tab „Hero-Design“ (Hero-Texte)
// bzw. wie die Seite die Abschnitts-Überschriften versetzt (getTextStylesCss).
const TEXT_LABELS = {
  'hero.title': 'Hero-Titel',
  'hero.subtitle': 'Hero-Untertitel',
  'hero.cta': 'Hero-Button „Jetzt starten“',
  'tools.sectionTitle': 'Überschrift Audio-Tools',
  'imageTools.sectionTitle': 'Überschrift Bild-Tools',
  'diverseTools.sectionTitle': 'Überschrift Diverse Tools',
};
const TEXT_KEYS = Object.keys(TEXT_LABELS);
// Bei „Standard für alle Slots“ (Texte-Tab) gilt für alle Abschnitts-Überschriften
// der Stil (und Versatz) des Master-Slots – wie auf der Seite.
function textSlotOf(lang, slot) {
  const m = state.media[lang];
  if (m.textStyleUniform && UNIFORM_TEXT_KEYS.includes(slot))
    return UNIFORM_TEXT_KEYS.includes(m.textStyleUniformKey)
      ? m.textStyleUniformKey
      : UNIFORM_TEXT_KEYS[0];
  return slot;
}
const clampText = (v, axis) => {
  const m = axis === 'y' ? TEXT_OFFSET_MAX.y : TEXT_OFFSET_MAX.x;
  return Math.max(-m, Math.min(m, Math.round(Number(v) || 0)));
};
// Tool-Sektionen der Seite: Sektions-Medium-Schlüssel -> Locale-Abschnitt der Karten.
const CARD_SECTION = { audio: 'tools', image: 'imageTools', diverse: 'diverseTools' };
const FULL_TEXT = {
  light: { title: '#003971', text: '#1e293b', muted: '#64748b', card: 'rgba(1,79,153,.08)' },
  dark: { title: '#f9f2d5', text: '#e2e8f0', muted: '#94a3b8', card: 'rgba(255,255,255,.06)' },
};
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
  const out = [];
  // Karten der Sprachdatei plus im Tab „Tool-Karten" angelegte Karten.
  for (const key of toolCardKeys(lang, sec)) {
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
// Nur lesen (legt nichts an): Lesen darf den Zustand nicht ändern, sonst gilt der
// Tab beim Öffnen als geändert (Undo-Eintrag, „Ungespeicherte Änderungen“).
function readCardOffsets(lang) {
  const o = state.media[lang].toolCardOffsets;
  return o && typeof o === 'object' ? o : {};
}
export function fullOffset(lang, key) {
  if (key === 'hero') {
    const m = state.media[lang];
    return { x: m.heroMediaOffsetX || 0, y: m.heroMediaOffsetY || 0 };
  }
  if (key.startsWith('card:')) {
    const o = readCardOffsets(lang)[key.slice(5)];
    return {
      x: (o && o.x) || 0,
      y: (o && o.y) || 0,
      w: o && o.w != null ? normCardScale(o.w) : 100,
      h: o && o.h != null ? normCardScale(o.h) : 100,
    };
  }
  if (key.startsWith('text:')) {
    // Ohne getTextStyle: das ergänzt fehlende Felder und würde beim Lesen schreiben.
    const ts = state.media[lang].textStyles;
    const st = ts && typeof ts === 'object' ? ts[textSlotOf(lang, key.slice(5))] : null;
    return { x: (st && st.offsetX) || 0, y: (st && st.offsetY) || 0 };
  }
  const c = getSectionMedia(lang, key);
  return { x: c.offsetX || 0, y: c.offsetY || 0 };
}
// Versatz (und bei Tool-Karten optional Skalierung w/h in %) setzen; w/h undefined =
// bisherige Skalierung behalten. Eintrag entfällt bei 0/0 und 100 %/100 %.
export function setFullOffset(lang, key, x, y, w, h) {
  if (key.startsWith('text:')) {
    const st = getTextStyle(lang, textSlotOf(lang, key.slice(5)));
    st.offsetX = clampText(x, 'x');
    st.offsetY = clampText(y, 'y');
    return { x: st.offsetX, y: st.offsetY };
  }
  const nx = normMediaOffset(x, 'x');
  const ny = normMediaOffset(y, 'y');
  if (key === 'hero') {
    state.media[lang].heroMediaOffsetX = nx;
    state.media[lang].heroMediaOffsetY = ny;
  } else if (key.startsWith('card:')) {
    const id = key.slice(5);
    const all = cardOffsets(lang);
    const cur = fullOffset(lang, key);
    const nw = w == null ? cur.w : normCardScale(w);
    const nh = h == null ? cur.h : normCardScale(h);
    if (nx || ny || nw !== 100 || nh !== 100)
      all[id] = { x: nx, y: ny, ...(nw !== 100 || nh !== 100 ? { w: nw, h: nh } : {}) };
    else delete all[id];
  } else {
    const c = getSectionMedia(lang, key);
    c.offsetX = nx;
    c.offsetY = ny;
  }
  return { x: nx, y: ny };
}
const scaled = (o) => (o.w != null && o.w !== 100) || (o.h != null && o.h !== 100);
// Alle Schlüssel mit Versatz ≠ 0 (Hero, Sektions-Medien, Tool-Karten).
function movedKeys(lang) {
  const out = [];
  for (const k of FULL_KEYS) {
    const o = fullOffset(lang, k);
    if (o.x || o.y) out.push(k);
  }
  for (const id of Object.keys(readCardOffsets(lang))) out.push(`card:${id}`);
  for (const slot of TEXT_KEYS) {
    const o = fullOffset(lang, `text:${slot}`);
    if (o.x || o.y) out.push(`text:${slot}`);
  }
  return out;
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
  // Ausgeblendete Elemente (Tab „Tool-Karten“): unsichtbar, Platz bleibt.
  const show = st && st.show && typeof st.show === 'object' ? st.show : {};
  const hid = (k) => (show[k] === false ? 'visibility:hidden;' : '');
  return {
    bg,
    border,
    radius,
    titleSize,
    titleWeight,
    badgeSize,
    align,
    alignSelf,
    titleFont,
    hid,
  };
}
// Auswahl-Panel: gewähltes Element (Klick in der Vorschau oder Dropdown) mit
// X/Y-Spinnern zum exakten Positionieren (Versatz in px der Seite) und ↺.
function allKeys(lang) {
  const out = FULL_KEYS.map((key) => ({ key, label: FULL_LABELS[key], group: '' }));
  for (const slot of TEXT_KEYS)
    out.push({ key: `text:${slot}`, label: TEXT_LABELS[slot], group: 'Texte' });
  for (const sec of SECTION_MEDIA_KEYS)
    for (const card of sectionCards(lang, sec))
      out.push({ key: `card:${card.id}`, label: card.title, group: SECTION_MEDIA_LABELS[sec] });
  return out;
}
// ---- Daten für die Vue-Fassung (app/tabs/layout/LyFullPage.vue) ----------------
// Gleiche Quellen wie fullPageHtml, aber als reine Daten; liest nur.
const mediaOf = (info, style = '') => (info ? { src: info.src, isVid: info.isVid, style } : null);
/** Schematische Startseite als Daten (Modus 'light' | 'dark'). */
export function fullPageModel(lang, mode) {
  const md = mode === 'dark' ? 'dark' : 'light';
  const c = FULL_TEXT[md];
  const m = state.media[lang];
  const compact = getHomeLayout() === 'compact';
  const hd = m.heroDesign || {};
  const hiddenChips = new Set(Array.isArray(hd.hiddenChips) ? hd.hiddenChips : []);
  let hero;
  if (m.heroMode === 'grid') {
    const layout = m.heroLayout;
    const cells = visibleGridCells(lang, layout);
    hero = {
      kind: 'grid',
      cols: Math.min(HERO_LAYOUT_COLS[layout] || 3, Math.max(1, cells.length)),
      maxW: layout === 'row4' ? 860 : layout === 'big2' ? 900 : layout === 'vrow' ? 420 : 720,
      tiles: cells.map((i) => ({ i, media: mediaOf(mediaInfo(lang, `grid${i}`), MEDIA_BASE) })),
    };
  } else if (m.heroBannerShow === false) hero = { kind: 'msg', text: 'Banner ausgeblendet' };
  else {
    const info = mediaInfo(lang, 'heroBanner');
    hero = info
      ? { kind: 'media', media: mediaOf(info, heroPreviewMediaStyle(lang, md, compact)) }
      : { kind: 'msg', text: 'Kein Hero-Medium' };
  }
  const feats = getPath(state.defaults[lang], ['hero', 'features']);
  const chips = (feats && typeof feats === 'object' ? Object.entries(feats) : [])
    .slice(0, 6)
    .map(([key, def]) => {
      const o = getPath(state.overrides[lang], ['hero', 'features', key]);
      return { key, label: String(o != null && o !== '' ? o : def), hidden: hiddenChips.has(key) };
    });
  const sections = SECTION_MEDIA_KEYS.map((key) => {
    const css = designCss(lang, key, md);
    const t = getSectionMedia(lang, key).text;
    return {
      key,
      slot: `${CARD_SECTION[key]}.sectionTitle`,
      title: effText(lang, [CARD_SECTION[key], 'sectionTitle']) || SECTION_MEDIA_LABELS[key],
      label: FULL_LABELS[key],
      media: mediaOf(mediaInfo(lang, key), `${MEDIA_BASE};${css.media}`),
      wrapCss: css.wrap,
      text: { text: t.text || '', css: t.text ? textStyle(t) : '' },
      centered: key !== 'audio',
      cards: sectionCards(lang, key).map((card) => {
        const { hid, ...d } = cardDesign(lang, card.id, md);
        const hidden = {};
        for (const k of ['icon', 'badge', 'title', 'fav', 'open']) hidden[k] = hid(k) !== '';
        return { ...card, d: { ...d, hidden } };
      }),
    };
  });
  return {
    pageW: PAGE_W,
    mode: md,
    colors: c,
    compact,
    grid: m.heroMode === 'grid',
    heroHasMedia:
      m.heroMode === 'grid' ||
      (m.heroBannerShow !== false && Boolean(mediaInfo(lang, 'heroBanner'))),
    hero,
    shown: {
      title: hd.showTitle !== false,
      subtitle: hd.showSubtitle !== false,
      chips: hd.showChips !== false,
      cta: hd.showCta !== false,
    },
    title: effText(lang, ['hero', 'title']),
    subtitle: effText(lang, ['hero', 'subtitle']),
    cta: effText(lang, ['hero', 'cta']) || 'Jetzt starten',
    chips,
    sections,
    pageBg: prevBg(md),
    fontCss: fontFF(getGlobalFont()) || PREV_FONT_STACK,
    css: `${PREV_FONT_FACES}${heroCompactCss('fp')}`,
  };
}
/** Wählbare Elemente (Medien, Texte, Tool-Karten je Sektion) für die Auswahl. */
export function fullPageKeys(lang) {
  return allKeys(lang).map((k) => ({
    ...k,
    group: k.group && k.group !== 'Texte' ? `Tool-Karten ${k.group}` : k.group,
  }));
}
/** Verschobene/skalierte Tool-Karten (nur lesen). */
export function fullCardOffsets(lang) {
  const all = readCardOffsets(lang);
  return Object.keys(all)
    .filter((id) => TOOL_CARD_KEY.test(id) && (all[id].x || all[id].y || scaled(all[id])))
    .map((id) => {
      const [sec, key] = id.split('.');
      return {
        id,
        title: effText(lang, [sec, key, 'title']) || id,
        ...fullOffset(lang, `card:${id}`),
      };
    });
}
/** Alle Tool-Karten mit gespeichertem Versatz (für „alle Karten zurücksetzen“). */
export const fullCardOffsetIds = (lang) => Object.keys(readCardOffsets(lang));
/** Text-Schlüssel, die sich bei „Standard für alle Slots“ gemeinsam bewegen. */
export function fullLinkedTextKeys(lang, key) {
  const uniform =
    key.startsWith('text:') &&
    state.media[lang].textStyleUniform &&
    UNIFORM_TEXT_KEYS.includes(key.slice(5));
  return uniform ? UNIFORM_TEXT_KEYS.map((slot) => `text:${slot}`) : [key];
}
export { movedKeys as fullMovedKeys, FULL_LABELS, TEXT_LABELS as FULL_TEXT_LABELS };
