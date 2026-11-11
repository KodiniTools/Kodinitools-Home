import type { CSSProperties } from 'vue';
import type { FontEntry, IconTint, Lang, ThemeMode } from '../../../types';
import { rgbaFromHex } from '../../../public/model-core';

/**
 * Datenmodell und reine Regeln des Tabs „Tool-Karten“ (Vue-Fassung von
 * `public/toolcards.js`). Gelesen/geschrieben wird das rohe
 * `media.<lang>.toolCards` (über `getToolCards`) und die Text-Overrides; die
 * Vanilla-Seite reicht dafür einen Service herein (keine zweite `state`-Instanz
 * im Bundle).
 */

export type TcSectionKey = 'tools' | 'imageTools' | 'diverseTools';
export type TcShowKey = 'icon' | 'badge' | 'title' | 'fav' | 'open' | 'popup';
export type CardTextKey = 'title' | 'badge' | 'description' | 'link';

/** Farb-Satz eines Modus (`toolCardSideLight/Dark` in model-toolcards.ts). */
export interface TcSide {
  borderColor: string;
  borderOpacity: number;
  borderWidth: number;
  borderStyle: string;
  borderRadius: number;
  bgColor: string;
  bgOpacity: number;
  gradient: boolean;
  bgColor2: string;
  gradientAngle: number;
  hoverBorderColor: string;
  hoverBorderOpacity: number;
  hoverBgColor: string;
  hoverBgOpacity: number;
  titleColor: string;
  badgeColor: string;
  badgeBgColor: string;
  badgeBgOpacity: number;
  openColor: string;
  descColor: string;
  descBgColor: string;
  bgImage: string;
  bgImageOpacity: number;
  bgImageDarken: number;
}
/** Typografie (Hell + Dunkel gemeinsam); 0 / '' = Standard der Seite. */
export interface TcText {
  titleFont: string;
  titleSize: number;
  titleWeight: string;
  titleSpacing: number;
  titleTransform: string;
  textFont: string;
  badgeSize: number;
  badgeWeight: string;
  badgeTransform: string;
  openSize: number;
  openWeight: string;
  descSize: number;
  align: string;
}
export type TcShow = Record<TcShowKey, boolean>;
/** Ein Design (Standard oder Einzel-Design einer Karte). */
export interface TcStyle {
  light: TcSide;
  dark: TcSide;
  text?: TcText;
  show?: TcShow;
}
/** `media.<lang>.toolCards`. */
export interface ToolCards {
  enabled: boolean;
  default: TcStyle;
  cards: Record<string, TcStyle>;
}
/** Eine Tool-Karte der Sprache (wie `cardList` in toolcards.js). */
export interface CardInfo {
  id: string;
  section: TcSectionKey | '';
  title: string;
  badge: string;
  description: string;
  link: string;
  svg: string;
  tint: Partial<IconTint>;
  hidden: boolean;
  custom: boolean;
}
/** Locale-Pfad, z. B. `['tools', 'mp3', 'title']`. */
export type TextPath = string[];

/** Was `public/toolcards.js` dem Tab übergibt. */
export interface TcService {
  lang: Lang;
  /** `getToolCards(lang)` – rohes, beschreibbares Objekt. */
  toolCards: () => ToolCards;
  cards: () => CardInfo[];
  hiddenIds: () => string[];
  setHidden: (id: string, hidden: boolean) => void;
  isCustom: (id: string) => boolean;
  duplicate: (id: string) => string | null;
  create: (section: string) => string | null;
  remove: (id: string) => boolean;
  /** Effektiver Text (Override, sonst Sprachdatei). */
  effText: (path: TextPath) => string;
  /** Standardtext der Sprachdatei. */
  defText: (path: TextPath) => string;
  hasOverride: (path: TextPath) => boolean;
  setOverride: (path: TextPath, value: string) => void;
  delOverride: (path: TextPath) => void;
  /** Komplettes Design in die andere Sprache kopieren. */
  copyToOtherLang: () => void;
  /** Seiten-Hintergrund (Tab „Hintergrund“) für die Vorschau. */
  pageBg: (mode: ThemeMode) => string;
  globalFont: () => string;
  fonts: () => FontEntry[];
  ensureFontFace: (file: string) => string;
  /** Vorschau-URL (`staged:<id>` → Objekt-URL). */
  resolveUrl: (val: string) => string;
  /** Bild-Auswahl der Sprache (nur Bilder); false = keine Medien vorhanden. */
  pick: (title: string, onPick: (url: string) => void) => boolean;
  sideDefault: (mode: ThemeMode) => TcSide;
  textDefault: () => TcText;
  showDefault: () => TcShow;
  borderStyles: readonly string[];
  weights: readonly string[];
  transforms: readonly string[];
  aligns: readonly string[];
  showKeys: readonly TcShowKey[];
  sections: readonly TcSectionKey[];
}

export const MODES: readonly ThemeMode[] = ['light', 'dark'];
export const MODE_LABEL: Record<ThemeMode, string> = { light: '☀️ Hell', dark: '🌙 Dunkel' };
export const THEME_LABEL: Record<ThemeMode, string> = { light: 'Hell ☀️', dark: 'Dunkel 🌙' };
export const SECTION_LABEL: Record<string, string> = {
  tools: 'Audio-Tools',
  imageTools: 'Bild-Tools',
  diverseTools: 'Diverse Tools',
};
export const BORDER_STYLE_LABEL: Record<string, string> = {
  solid: 'Durchgezogen',
  dashed: 'Gestrichelt',
  dotted: 'Gepunktet',
  double: 'Doppelt',
};
export const WEIGHT_LABEL: Record<string, string> = {
  '': 'Standard',
  400: 'Normal (400)',
  500: 'Mittel (500)',
  600: 'Halbfett (600)',
  700: 'Fett (700)',
  800: 'Extrafett (800)',
};
export const ALIGN_LABEL: Record<string, string> = {
  '': 'Standard (links)',
  left: 'Linksbündig',
  center: 'Zentriert',
  right: 'Rechtsbündig',
};
export const TRANSFORM_LABEL: Record<string, string> = {
  '': 'Standard',
  none: 'Wie geschrieben',
  uppercase: 'GROSSBUCHSTABEN',
  capitalize: 'Wortanfänge groß',
};
export const SHOW_LABEL: Record<TcShowKey, string> = {
  icon: 'Icon',
  badge: 'Badge',
  title: 'Titel',
  fav: 'Favoriten-Knopf',
  open: '„Öffnen“-Link',
  popup: 'Popup (Beschreibung beim Überfahren)',
};
/** align-self für Icon/Badge in der Flex-Spalte der Karte je Ausrichtung. */
const ALIGN_SELF: Record<string, string> = {
  left: 'flex-start',
  center: 'center',
  right: 'flex-end',
};
/** Seitenfarben je Modus für die Vorschau (wie base.css / tool-cards.css). */
export const PAGE: Record<
  ThemeMode,
  {
    title: string;
    muted: string;
    primary: string;
    badgeFg: string;
    badgeBg: string;
    badgeBd: string;
    iconBg: string;
    shadow: string;
  }
> = {
  light: {
    title: '#003971',
    muted: '#4f6f8e',
    primary: '#014f99',
    badgeFg: '#014f99',
    badgeBg: 'rgba(1, 79, 153, 0.08)',
    badgeBd: 'rgba(1, 79, 153, 0.14)',
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
    iconBg: '#eef1f5',
    shadow: '0 14px 36px rgba(0, 0, 0, 0.45), 0 0 24px rgba(232, 169, 69, 0.07)',
  },
};
/** Optionale Text-Farben eines Modus. */
export type TextColorField =
  | 'titleColor'
  | 'badgeColor'
  | 'badgeBgColor'
  | 'openColor'
  | 'descColor'
  | 'descBgColor';
/** Vorschlagsfarben beim Einschalten (= Standardwerte der Seite je Modus). */
export const TEXT_COLOR_SUGGEST: Record<ThemeMode, Record<TextColorField, string>> = {
  light: {
    titleColor: '#003971',
    badgeColor: '#014f99',
    badgeBgColor: '#014f99',
    openColor: '#014f99',
    descColor: '#4f6f8e',
    descBgColor: '#ffffff',
  },
  dark: {
    titleColor: '#f9f2d5',
    badgeColor: '#ffffff',
    badgeBgColor: '#ffffff',
    openColor: '#e8a945',
    descColor: '#7a8da0',
    descBgColor: '#0a1628',
  },
};

/** Texte einer Karte (Overrides der Sprachdatei). */
export const CARD_TEXT_FIELDS: readonly {
  key: CardTextKey;
  label: string;
  hint: string;
  customHint: string;
  multiline?: boolean;
  rows?: number;
}[] = [
  {
    key: 'title',
    label: 'Titel',
    hint: 'Leer = Standardtext aus der Sprachdatei. Enter = zweite Zeile (max. 2 Zeilen; Karten sind für zwei Zeilen ausgelegt).',
    customHint: 'Enter = zweite Zeile (max. 2 Zeilen; Karten sind für zwei Zeilen ausgelegt).',
    multiline: true,
    rows: 2,
  },
  {
    key: 'badge',
    label: 'Badge (kleines Etikett)',
    hint: 'Leer = kein Badge; „↺“ = Standard-Badge.',
    customHint: 'Leer = kein Badge.',
  },
  {
    key: 'description',
    label: 'Beschreibung (Popup beim Überfahren)',
    hint: 'Leer = Standardtext aus der Sprachdatei.',
    customHint: 'Text im Popup beim Überfahren der Karte.',
    multiline: true,
    rows: 3,
  },
  {
    key: 'link',
    label: 'Link (URL des Tools)',
    hint: 'https://… oder /pfad/; leer = Standard-Link.',
    customHint: 'https://… oder /pfad/ – ohne Link führt die Karte nirgendwohin.',
  },
];

// ---- Zahlen ------------------------------------------------------------------------
export function clampInt(v: unknown, min: number, max: number, def: number): number {
  const n = parseInt(String(v), 10);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : def;
}
export function clampHalf(v: unknown, min: number, max: number, def: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n * 2) / 2)) : def;
}

// ---- Texte -------------------------------------------------------------------------
/** Titel: bis zu zwei Zeilen; Leerzeilen und Rand-Leerzeichen entfallen. */
export function normTitle(v: string): string {
  return String(v)
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join('\n');
}
/** Einzeilige Darstellung eines (ggf. zweizeiligen) Titels für Listen/Auswahl. */
export function oneLine(t: unknown): string {
  return String(t ?? '').replace(/\s*\n\s*/g, ' / ');
}
/** Beschriftung des „Öffnen“-Links (Locale tool.open, per Override änderbar). */
export function openLabel(svc: Pick<TcService, 'effText' | 'lang'>): string {
  return svc.effText(['tool', 'open']) || (svc.lang === 'de' ? 'Öffnen' : 'Open');
}
/**
 * Karten-Text setzen (wie `setCardText` in toolcards.js): leer = Override
 * entfernen (Standard), Badge darf leer sein (= kein Badge), Link nur
 * https://…, /pfad oder # (sonst false, nichts übernommen). Angelegte Karten
 * haben keinen Standardtext – leer bleibt dort ''.
 */
export function setCardText(
  svc: Pick<TcService, 'isCustom' | 'setOverride' | 'delOverride'>,
  id: string,
  key: CardTextKey,
  value: string,
): boolean {
  const path = [...id.split('.'), key];
  const v = String(value ?? '');
  if (svc.isCustom(id) && v.trim() === '') {
    svc.setOverride(path, '');
    return true;
  }
  if (key === 'link') {
    const t = v.trim();
    if (t === '') svc.delOverride(path);
    else if (/^(https?:\/\/|\/|#)/.test(t)) svc.setOverride(path, t);
    else return false;
    return true;
  }
  if (key === 'badge') svc.setOverride(path, v.trim());
  else if (v.trim() === '') svc.delOverride(path);
  else if (key === 'title') svc.setOverride(path, normTitle(v));
  else svc.setOverride(path, key === 'description' ? v : v.trim());
  return true;
}

/** Typografie-Feld normalisieren (wie `normTextField`). */
export function normTextField(
  f: keyof TcText,
  v: unknown,
  svc: Pick<TcService, 'weights' | 'transforms' | 'aligns'>,
  normFont: (v: unknown) => string,
): string | number {
  if (f === 'titleFont' || f === 'textFont') return normFont(v);
  if (f.endsWith('Weight')) return svc.weights.includes(String(v)) ? String(v) : '';
  if (f.endsWith('Transform')) return svc.transforms.includes(String(v)) ? String(v) : '';
  if (f === 'align') return svc.aligns.includes(String(v)) ? String(v) : '';
  if (f === 'titleSpacing') return clampHalf(v, -2, 5, 0);
  const max = f === 'titleSize' ? 40 : f === 'descSize' ? 24 : 20;
  return clampInt(v, 0, max, 0);
}

// ---- Hinweise ----------------------------------------------------------------------
export function noteText(tc: ToolCards, selected: string, hidden: boolean): string {
  if (selected && hidden)
    return '🙈 Diese Karte ist auf der Seite ausgeblendet (DE + EN). „Wieder einblenden“ macht das rückgängig.';
  if (!tc.enabled)
    return '⚠️ „Eigenes Tool-Karten-Design verwenden“ ist aus – auf der Seite bleibt das Standard-Aussehen. Sobald du etwas änderst, wird es automatisch aktiviert.';
  if (selected && !tc.cards[selected])
    return 'ℹ️ Diese Karte nutzt das Standard-Design. Aktiviere „Eigenes Design für diese Karte“, um sie einzeln zu gestalten.';
  const n = Object.keys(tc.cards).length;
  return `✅ Dieses Design wird auf der Seite angewandt (Hell und Dunkel getrennt)${
    n ? ` – ${n} Karte(n) mit eigenem Design (● in der Liste).` : '.'
  }`;
}
export function hiddenCount(show: TcShow | undefined, keys: readonly TcShowKey[]): number {
  return show ? keys.filter((k) => show[k] === false).length : 0;
}
export function showInfoText(show: TcShow | undefined, keys: readonly TcShowKey[]): string {
  const n = hiddenCount(show, keys);
  return n
    ? `${n} Element(e) ausgeblendet – die Karte behält ihre Größe.`
    : 'Alle Elemente sichtbar.';
}

// ---- Vorschau-CSS (wie tool-cards.css / content.ts) --------------------------------
export function bgCss(s: TcSide): string {
  const c1 = rgbaFromHex(s.bgColor, s.bgOpacity);
  if (!s.gradient) return c1;
  return `linear-gradient(${s.gradientAngle}deg, ${c1}, ${rgbaFromHex(s.bgColor2, s.bgOpacity)})`;
}
/**
 * Inline-Style einer Vorschaukarte inkl. Hover-Werten als CSS-Variablen
 * (die :hover-Regel steht in TcCard.vue; ersetzt die erzeugten
 * `<style>`-Regeln der früheren Vanilla-Fassung).
 */
export function cardStyle(s: TcSide, theme: ThemeMode): CSSProperties {
  const bg = bgCss(s);
  return {
    background: bg,
    border: `${s.borderWidth}px ${s.borderStyle} ${rgbaFromHex(s.borderColor, s.borderOpacity)}`,
    borderRadius: `${s.borderRadius}px`,
    '--tc-hbc': rgbaFromHex(s.hoverBorderColor, s.hoverBorderOpacity),
    '--tc-hbg': s.hoverBgOpacity > 0 ? rgbaFromHex(s.hoverBgColor, s.hoverBgOpacity) : bg,
    '--tc-hsh': PAGE[theme].shadow,
  } as CSSProperties;
}
/** Bild-Ebene der Karte ('' ohne Bild). */
export function imageStyle(s: TcSide, url: string): string {
  if (!url) return '';
  const filter =
    s.bgImageDarken > 0 ? `brightness(${(1 - s.bgImageDarken / 100).toFixed(3)})` : 'none';
  return `background-image:url('${url.replace(/['"]/g, '')}');opacity:${
    (s.bgImageOpacity ?? 100) / 100
  };filter:${filter}`;
}
export interface TextStyles {
  title: string;
  badge: string;
  open: string;
  desc: string;
  alignSelf: string;
}
/** Inline-Styles der Karten-Texte (Seitenstandard, wenn nichts gesetzt). */
export function textStyles(
  s: TcSide,
  theme: ThemeMode,
  text: TcText | undefined,
  ensureFontFace: (file: string) => string,
): TextStyles {
  const p = PAGE[theme];
  const t: Partial<TcText> = text || {};
  const font = (f?: string) =>
    f ? `font-family:'${ensureFontFace(f)}', system-ui, sans-serif;` : '';
  const size = (n?: number) => (n && n > 0 ? `font-size:${n}px;` : '');
  const weight = (w?: string) => (w ? `font-weight:${w};` : '');
  const transform = (v?: string) => (v ? `text-transform:${v};` : '');
  const self = t.align ? ALIGN_SELF[t.align] : undefined;
  const ta = self ? `text-align:${t.align};` : '';
  const alignSelf = self ? `align-self:${self};` : '';
  const title = `color:${s.titleColor || p.title};${font(t.titleFont)}${size(t.titleSize)}${weight(
    t.titleWeight,
  )}${t.titleSpacing ? `letter-spacing:${t.titleSpacing}px;` : ''}${transform(t.titleTransform)}${ta}`;
  const badgeBg = s.badgeBgColor ? rgbaFromHex(s.badgeBgColor, s.badgeBgOpacity ?? 100) : p.badgeBg;
  const badge = `color:${s.badgeColor || p.badgeFg};background:${badgeBg};border-color:${
    p.badgeBd
  };${font(t.textFont)}${size(t.badgeSize)}${weight(t.badgeWeight)}${transform(
    t.badgeTransform,
  )}${alignSelf}`;
  const open = `color:${s.openColor || p.primary};${font(t.textFont)}${size(t.openSize)}${weight(
    t.openWeight,
  )}`;
  const desc = `${s.descColor ? `color:${s.descColor};` : ''}${
    s.descBgColor ? `background:${s.descBgColor};padding:.15rem .4rem;border-radius:.3rem;` : ''
  }${font(t.textFont)}${size(t.descSize)}${ta}`;
  return { title, badge, open, desc, alignSelf };
}
/** Ausgeblendetes Element (Platz bleibt erhalten). */
export function hiddenCss(show: TcShow | undefined, key: TcShowKey): string {
  return show && show[key] === false ? 'visibility:hidden;' : '';
}
/** Schrift der Seite (Tab „Design“) für die Vorschau-Fläche. */
export function fontCss(globalFont: string, ensureFontFace: (file: string) => string): string {
  return globalFont ? `font-family:'${ensureFontFace(globalFont)}', system-ui, sans-serif;` : '';
}
/** Beispiel-Karte für das Standard-Design (Icon der ersten Karte mit Icon). */
export function sampleCard(lang: Lang, cards: CardInfo[]): CardInfo {
  const first = cards.find((c) => c.svg);
  return {
    id: '',
    section: '',
    title: lang === 'de' ? 'Beispiel-Karte' : 'Sample card',
    badge: lang === 'de' ? 'Standard' : 'Default',
    description: '',
    link: '',
    svg: first ? first.svg : '',
    tint: {},
    hidden: false,
    custom: false,
  };
}
/** Tiefe Kopie (Designs sind reine JSON-Daten). */
export function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}
