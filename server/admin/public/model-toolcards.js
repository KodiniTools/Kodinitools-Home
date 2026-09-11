// Datenmodell – Tool-Karten-Design (Rahmen, Hintergrund, Hover, Text-Farben,
// Typografie je Hell/Dunkel) und Icon-Färbung je Karte, plus die Bild-Plätze der
// Karten-Hintergrundbilder.

import {
  normHexOrEmpty,
  normFontFile,
  normSiteMediaUrl,
  getPath,
  setPath,
  MEDIA_LANGS,
} from './model-core.js';
import { state } from './model-state.js';

// --- Tool-Karten-Design (Tab „Tool-Karten") ---
// Standard je Modus = eingebautes Aussehen aus tool-cards.css (Rahmen 1px,
// Hintergrund Weiß bzw. Navy, Radius 16px, Hover-Rahmen Blau/Gold 22 %).
export function toolCardSideLight() {
  return {
    borderColor: '#e5e7eb',
    borderOpacity: 100,
    borderWidth: 1,
    borderStyle: 'solid',
    borderRadius: 16,
    bgColor: '#ffffff',
    bgOpacity: 100,
    gradient: false,
    bgColor2: '#f1f5f9',
    gradientAngle: 135,
    hoverBorderColor: '#014f99',
    hoverBorderOpacity: 22,
    hoverBgColor: '#ffffff',
    hoverBgOpacity: 0,
    titleColor: '',
    badgeColor: '',
    badgeBgColor: '',
    badgeBgOpacity: 100,
    openColor: '',
    descColor: '',
    descBgColor: '',
    bgImage: '',
    bgImageOpacity: 100,
    bgImageDarken: 0,
  };
}
export function toolCardSideDark() {
  return {
    borderColor: '#1d3a5c',
    borderOpacity: 100,
    borderWidth: 1,
    borderStyle: 'solid',
    borderRadius: 16,
    bgColor: '#142640',
    bgOpacity: 100,
    gradient: false,
    bgColor2: '#0e1c32',
    gradientAngle: 135,
    hoverBorderColor: '#e8a945',
    hoverBorderOpacity: 22,
    hoverBgColor: '#142640',
    hoverBgOpacity: 0,
    titleColor: '',
    badgeColor: '',
    badgeBgColor: '',
    badgeBgOpacity: 100,
    openColor: '',
    descColor: '',
    descBgColor: '',
    bgImage: '',
    bgImageOpacity: 100,
    bgImageDarken: 0,
  };
}
// Typografie der Karten-Texte (Hell + Dunkel gemeinsam); 0 / '' = Standard der Seite.
export const TOOL_CARD_WEIGHTS = ['', '400', '500', '600', '700', '800'];
export const TOOL_CARD_TRANSFORMS = ['', 'none', 'uppercase', 'capitalize'];
// Ausrichtung der Karten-Texte (Icon, Badge, Titel, Popup-Text); '' = Standard (links).
export const TOOL_CARD_ALIGNS = ['', 'left', 'center', 'right'];
export function defaultToolCardText() {
  return {
    titleFont: '',
    titleSize: 0,
    titleWeight: '',
    titleSpacing: 0,
    titleTransform: '',
    textFont: '',
    badgeSize: 0,
    badgeWeight: '',
    badgeTransform: '',
    openSize: 0,
    openWeight: '',
    descSize: 0,
    align: '',
  };
}
export function normToolCardText(t) {
  const d = defaultToolCardText();
  if (!t || typeof t !== 'object') return d;
  const num = (v, min, max, def) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n))) : def;
  };
  const half = (v, min, max, def) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n * 2) / 2)) : def;
  };
  const weight = (v) => (TOOL_CARD_WEIGHTS.includes(String(v ?? '')) ? String(v ?? '') : '');
  const transform = (v) => (TOOL_CARD_TRANSFORMS.includes(v) ? v : '');
  return {
    titleFont: normFontFile(t.titleFont),
    titleSize: num(t.titleSize, 0, 40, 0),
    titleWeight: weight(t.titleWeight),
    titleSpacing: half(t.titleSpacing, -2, 5, 0),
    titleTransform: transform(t.titleTransform),
    textFont: normFontFile(t.textFont),
    badgeSize: num(t.badgeSize, 0, 20, 0),
    badgeWeight: weight(t.badgeWeight),
    badgeTransform: transform(t.badgeTransform),
    openSize: num(t.openSize, 0, 20, 0),
    openWeight: weight(t.openWeight),
    descSize: num(t.descSize, 0, 24, 0),
    align: TOOL_CARD_ALIGNS.includes(t.align) ? t.align : '',
  };
}
// Sichtbarkeit der Karten-Elemente (Hell + Dunkel gemeinsam); false = ausgeblendet.
// Der Platz bleibt erhalten (visibility:hidden), die Karte behält ihre Größe.
export const TOOL_CARD_SHOW_KEYS = ['icon', 'badge', 'title', 'fav', 'open', 'popup'];
export function defaultToolCardShow() {
  const o = {};
  for (const k of TOOL_CARD_SHOW_KEYS) o[k] = true;
  return o;
}
export function normToolCardShow(s) {
  const o = s && typeof s === 'object' ? s : {};
  const out = {};
  for (const k of TOOL_CARD_SHOW_KEYS) out[k] = o[k] !== false;
  return out;
}
export function defaultToolCardStyle() {
  return {
    light: toolCardSideLight(),
    dark: toolCardSideDark(),
    text: defaultToolCardText(),
    show: defaultToolCardShow(),
  };
}
export function defaultToolCards() {
  return { enabled: false, default: defaultToolCardStyle(), cards: {} };
}
export const TOOL_CARD_KEY = /^(tools|imageTools|diverseTools)\.[a-zA-Z0-9_-]+$/;
// --- Icon-Färbung je Tool-Karte (Tab „Icons") ---
// light/dark = Icon-Farbe (SVG als einfarbige Maske), bg/bgDark = Kasten-
// Hintergrund; '' = unverändert (Originalfarben bzw. Standard-Kasten).
export const ICON_TINT_FIELDS = ['light', 'dark', 'bg', 'bgDark'];
export function normIconTint(v) {
  const out = {};
  if (!v || typeof v !== 'object') return out;
  for (const [key, t] of Object.entries(v)) {
    if (!TOOL_CARD_KEY.test(key) || !t || typeof t !== 'object') continue;
    const e = {};
    let any = false;
    for (const f of ICON_TINT_FIELDS) {
      e[f] = normHexOrEmpty(t[f]);
      if (e[f]) any = true;
    }
    if (any) out[key] = e;
  }
  return out;
}
export function getIconTint(lang, id) {
  const m = state.media[lang] || {};
  const t = (m.iconTint && m.iconTint[id]) || {};
  const out = {};
  for (const f of ICON_TINT_FIELDS) out[f] = normHexOrEmpty(t[f]);
  return out;
}
// Teilweise setzen; ein Eintrag ohne jede Farbe wird entfernt.
export function setIconTint(lang, id, patch) {
  if (!TOOL_CARD_KEY.test(id)) return;
  const m = state.media[lang];
  if (!m.iconTint || typeof m.iconTint !== 'object') m.iconTint = {};
  const cur = getIconTint(lang, id);
  for (const f of ICON_TINT_FIELDS) if (f in patch) cur[f] = normHexOrEmpty(patch[f]);
  if (ICON_TINT_FIELDS.some((f) => cur[f])) m.iconTint[id] = cur;
  else delete m.iconTint[id];
}
export const TOOL_CARD_BORDER_STYLES = ['solid', 'dashed', 'dotted', 'double'];
function normToolCardSide(s, def) {
  if (!s || typeof s !== 'object') return def;
  const hex = (v, d) => (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(String(v)) ? v : d);
  const num = (v, min, max, d) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n))) : d;
  };
  return {
    borderColor: hex(s.borderColor, def.borderColor),
    borderOpacity: num(s.borderOpacity, 0, 100, def.borderOpacity),
    borderWidth: num(s.borderWidth, 0, 8, def.borderWidth),
    borderStyle: TOOL_CARD_BORDER_STYLES.includes(s.borderStyle) ? s.borderStyle : def.borderStyle,
    borderRadius: num(s.borderRadius, 0, 40, def.borderRadius),
    bgColor: hex(s.bgColor, def.bgColor),
    bgOpacity: num(s.bgOpacity, 0, 100, def.bgOpacity),
    gradient: s.gradient === true,
    bgColor2: hex(s.bgColor2, def.bgColor2),
    gradientAngle: num(s.gradientAngle, 0, 360, def.gradientAngle),
    hoverBorderColor: hex(s.hoverBorderColor, def.hoverBorderColor),
    hoverBorderOpacity: num(s.hoverBorderOpacity, 0, 100, def.hoverBorderOpacity),
    hoverBgColor: hex(s.hoverBgColor, def.hoverBgColor),
    hoverBgOpacity: num(s.hoverBgOpacity, 0, 100, def.hoverBgOpacity),
    titleColor: normHexOrEmpty(s.titleColor),
    badgeColor: normHexOrEmpty(s.badgeColor),
    badgeBgColor: normHexOrEmpty(s.badgeBgColor),
    badgeBgOpacity: num(s.badgeBgOpacity, 0, 100, 100),
    openColor: normHexOrEmpty(s.openColor),
    descColor: normHexOrEmpty(s.descColor),
    descBgColor: normHexOrEmpty(s.descBgColor),
    bgImage: normSiteMediaUrl(s.bgImage),
    bgImageOpacity: num(s.bgImageOpacity, 0, 100, 100),
    bgImageDarken: num(s.bgImageDarken, 0, 100, 0),
  };
}
export function normToolCardStyle(st) {
  const o = st && typeof st === 'object' ? st : {};
  return {
    light: normToolCardSide(o.light, toolCardSideLight()),
    dark: normToolCardSide(o.dark, toolCardSideDark()),
    text: normToolCardText(o.text),
    show: normToolCardShow(o.show),
  };
}
// Geladenes Tool-Karten-Design normalisieren (Standard + Einzel-Designs).
export function normToolCards(tc) {
  if (!tc || typeof tc !== 'object') return defaultToolCards();
  const cards = {};
  if (tc.cards && typeof tc.cards === 'object') {
    for (const [key, val] of Object.entries(tc.cards)) {
      if (TOOL_CARD_KEY.test(key) && val && typeof val === 'object')
        cards[key] = normToolCardStyle(val);
    }
  }
  return { enabled: tc.enabled === true, default: normToolCardStyle(tc.default), cards };
}
// Sichert, dass media.<lang>.toolCards vollständig existiert, und gibt es zurück.
export function getToolCards(lang) {
  const m = state.media[lang];
  if (!m.toolCards || typeof m.toolCards !== 'object' || !m.toolCards.default || !m.toolCards.cards)
    m.toolCards = normToolCards(m.toolCards);
  return m.toolCards;
}
// Bild-Plätze der Tool-Karten (Hintergrundbild je Karte/Modus, beide Sprachen):
// { root: 'de'|'en', xLang, path, label, get(), set(v) } – Upload in den
// Ordner der Sprache.
export function toolCardImageSlots() {
  const modeLabel = (m) => (m === 'dark' ? 'Dunkel' : 'Hell');
  const slots = [];
  for (const lang of MEDIA_LANGS) {
    const tc = state.media[lang] && state.media[lang].toolCards;
    if (!tc || typeof tc !== 'object') continue;
    const entries = [['default', 'Standard (alle Karten)']];
    for (const id of Object.keys(tc.cards && typeof tc.cards === 'object' ? tc.cards : {}))
      entries.push([id, id]);
    for (const [id, name] of entries)
      for (const mode of ['light', 'dark']) {
        const path =
          id === 'default'
            ? ['toolCards', 'default', mode, 'bgImage']
            : ['toolCards', 'cards', id, mode, 'bgImage'];
        slots.push({
          root: lang,
          xLang: lang,
          path,
          mode,
          label: `${lang.toUpperCase()} · Tool-Karte ${name} (${modeLabel(mode)})`,
        });
      }
  }
  for (const slot of slots) {
    slot.get = () => {
      const v = getPath(state.media[slot.root], slot.path);
      return typeof v === 'string' ? v : '';
    };
    slot.set = (v) => setPath(state.media[slot.root], slot.path, normSiteMediaUrl(v));
  }
  return slots;
}
