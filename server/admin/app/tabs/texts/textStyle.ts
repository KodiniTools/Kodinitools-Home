import type {
  ObjPath,
  TextAnim,
  TextAnimSpeed,
  TextStyle,
  TextStyleEntry,
  ThemeMode,
} from '../../../types';
import { BANNER_ANIM_SPEEDS, BANNER_ANIM_TYPES } from '../../../public/model-core.js';

/**
 * Reine Helfer des Tabs „Texte“ (Vue-Fassung von `public/content.js` +
 * `public/textstyle.js`). Arbeiten nur auf den übergebenen Objekten und
 * importieren bewusst NICHT `public/model.js` (sonst entstünde im Bundle eine
 * zweite `state`-Instanz). Regeln 1:1 wie `getTextStyle`/`getEffectiveTextStyle`
 * in `public/model-hero.js` und `applyFxField`/`slotPreviewStyle` in
 * `public/textstyle.js`.
 */

export type { TextAnim, TextAnimSpeed, TextStyle } from '../../../types';

/** Teil von `media.<lang>`, den der Tab liest und schreibt. */
export interface TextStyleHost {
  textStyles?: Record<string, TextStyleEntry & { color?: string }>;
  textStyleUniform?: boolean;
  textStyleUniformKey?: string;
}

/** Text-Slot des Tabs: Override-Pfad, Stil-Schlüssel, Beschriftung. */
export interface TextField {
  path: ObjPath;
  key: string;
  label: string;
}

/** Slots des Tabs (= `UNIFORM_TEXT_KEYS` in `public/model-hero.js`). */
export const TEXT_FIELDS: readonly TextField[] = [
  {
    path: ['tools', 'sectionTitle'],
    key: 'tools.sectionTitle',
    label: 'Abschnitt – Audio-Tools (Titel)',
  },
  {
    path: ['imageTools', 'sectionTitle'],
    key: 'imageTools.sectionTitle',
    label: 'Abschnitt – Bild-Tools (Titel)',
  },
  {
    path: ['diverseTools', 'sectionTitle'],
    key: 'diverseTools.sectionTitle',
    label: 'Abschnitt – Diverse Tools (Titel)',
  },
];
export const UNIFORM_TEXT_KEYS: readonly string[] = TEXT_FIELDS.map((f) => f.key);

/** Standardwerte der Text-Effekte (entsprechen dem „aus“-Zustand). */
export const TEXT_FX_DEFAULTS = {
  shadow: false,
  shadowColor: '#000000',
  shadowX: 0,
  shadowY: 2,
  shadowBlur: 6,
  strokeColor: '#000000',
  strokeWidth: 0,
  opacity: 100,
  anim: 'none' as TextAnim,
  animIntensity: 5,
  animSpeed: 'normal' as TextAnimSpeed,
} as const;

export const ANIM_OPTIONS: { value: TextAnim; label: string }[] = [
  { value: 'none', label: 'Keine' },
  { value: 'pulse', label: 'Puls' },
  { value: 'float', label: 'Schweben' },
  { value: 'shake', label: 'Wackeln' },
  { value: 'wobble', label: 'Kippen' },
  { value: 'glow', label: 'Glühen' },
];
export const ANIM_SPEED_OPTIONS: { value: TextAnimSpeed; label: string }[] = [
  { value: 'slow', label: 'Langsam' },
  { value: 'normal', label: 'Normal' },
  { value: 'fast', label: 'Schnell' },
];

/** Seiten-Standardfarbe der Abschnitts-Titel je Modus (leere Farbe = diese). */
export const DEFAULT_TEXT_COLOR: Record<ThemeMode, string> = {
  light: '#013f7a',
  dark: '#f9f2d5',
};
/** Hintergrund der Vorschau je Modus, damit die Farbe sichtbar ist. */
export const PREVIEW_BG: Record<ThemeMode, string> = { light: '#f5f6f8', dark: '#0e1c32' };

export const colorField = (mode: ThemeMode): 'colorLight' | 'colorDark' =>
  mode === 'dark' ? 'colorDark' : 'colorLight';

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const ANIMS = BANNER_ANIM_TYPES as readonly string[];
const SPEEDS = BANNER_ANIM_SPEEDS as readonly string[];

/** Ergänzt fehlende Felder in-place (Migration altes `color`, Effekt-Defaults). */
function fillDefaults(s: TextStyleEntry & { color?: string }): TextStyle {
  if (typeof s.size !== 'number') s.size = Number(s.size) || 0;
  if (typeof s.font !== 'string') s.font = '';
  if (typeof s.color === 'string' && s.color) {
    if (!s.colorLight) s.colorLight = s.color;
    if (!s.colorDark) s.colorDark = s.color;
    delete s.color;
  }
  if (typeof s.colorLight !== 'string') s.colorLight = '';
  if (typeof s.colorDark !== 'string') s.colorDark = '';
  if (typeof s.shadow !== 'boolean') s.shadow = false;
  if (typeof s.shadowColor !== 'string') s.shadowColor = '#000000';
  if (!isNum(s.shadowX)) s.shadowX = 0;
  if (!isNum(s.shadowY)) s.shadowY = 2;
  if (!isNum(s.shadowBlur)) s.shadowBlur = 6;
  if (typeof s.strokeColor !== 'string') s.strokeColor = '#000000';
  if (!isNum(s.strokeWidth)) s.strokeWidth = 0;
  if (!isNum(s.opacity)) s.opacity = 100;
  if (!ANIMS.includes(s.anim as string)) s.anim = 'none';
  if (!isNum(s.animIntensity)) s.animIntensity = 5;
  if (!SPEEDS.includes(s.animSpeed as string)) s.animSpeed = 'normal';
  if (!isNum(s.offsetX)) s.offsetX = 0;
  if (!isNum(s.offsetY)) s.offsetY = 0;
  return s as TextStyle;
}

/**
 * Stil-Objekt eines Slots zum SCHREIBEN (legt es bei Bedarf an) – wie
 * `getTextStyle` in `public/model-hero.js`.
 */
export function ensureTextStyle(media: TextStyleHost, key: string): TextStyle {
  if (!media.textStyles || typeof media.textStyles !== 'object') media.textStyles = {};
  const existing = media.textStyles[key];
  if (!existing) {
    media.textStyles[key] = { size: 0, colorLight: '', colorDark: '', font: '' };
  }
  return fillDefaults(media.textStyles[key]!);
}

/**
 * Stil eines Slots zum LESEN, ohne den Zustand zu verändern (Kopie mit
 * Defaults). So erzeugt das bloße Öffnen des Tabs keine Änderung.
 */
export function readTextStyle(media: TextStyleHost, key: string): TextStyle {
  const src = media.textStyles?.[key];
  return fillDefaults(src && typeof src === 'object' ? { ...src } : {});
}

/** Schlüssel des Master-Slots bei „Standard für alle Slots“. */
export function masterKey(media: TextStyleHost): string {
  const k = media.textStyleUniformKey ?? '';
  return UNIFORM_TEXT_KEYS.includes(k) ? k : UNIFORM_TEXT_KEYS[0]!;
}

/** Effektiver Stil (bei aktivem Master dessen Werte) – wie `getEffectiveTextStyle`. */
export function effectiveTextStyle(media: TextStyleHost, key: string): TextStyle {
  if (!media.textStyleUniform || !UNIFORM_TEXT_KEYS.includes(key)) return readTextStyle(media, key);
  return readTextStyle(media, masterKey(media));
}

/** Master-Status eines Slots (Vanilla: `slotState`). */
export function slotState(media: TextStyleHost, key: string) {
  const isMaster = !!media.textStyleUniform && (media.textStyleUniformKey || '') === key;
  const inherited = !!media.textStyleUniform && !isMaster;
  return { isMaster, inherited };
}

/** Sind Effekte aktiv (für „•“-Markierung und Auto-Aufklappen)? */
export function fxActive(st: TextStyle): boolean {
  return !!(
    st.shadow ||
    (st.strokeWidth || 0) > 0 ||
    (st.opacity ?? 100) < 100 ||
    (st.anim && st.anim !== 'none')
  );
}

const clampI = (v: unknown, min: number, max: number, def: number) => {
  const n = parseInt(String(v), 10);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : def;
};
const clampH = (v: unknown, min: number, max: number, def: number) => {
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n * 2) / 2)) : def;
};

/** Textgröße 0–120 (0 = Standard), ungültig → 0. */
export const clampTextSize = (v: unknown) => clampI(v, 0, 120, 0);

export type FxNumField =
  | 'shadowX'
  | 'shadowY'
  | 'shadowBlur'
  | 'strokeWidth'
  | 'opacity'
  | 'animIntensity';

/** Nicht-numerische Effekt-Felder (Schalter, Farben, Auswahl). */
export type FxField = 'shadow' | 'shadowColor' | 'strokeColor' | 'anim' | 'animSpeed';

/** Begrenzungen der Effekt-Zahlenfelder (wie Server-Validierung). */
export const FX_LIMITS: Record<FxNumField, { min: number; max: number; step: number }> = {
  shadowX: { min: -50, max: 50, step: 1 },
  shadowY: { min: -50, max: 50, step: 1 },
  shadowBlur: { min: 0, max: 40, step: 1 },
  strokeWidth: { min: 0, max: 10, step: 0.5 },
  opacity: { min: 0, max: 100, step: 1 },
  animIntensity: { min: 1, max: 10, step: 1 },
};

/** Wert eines Effekt-Zahlenfeldes begrenzen (wie `applyFxField`). */
export function clampFx(field: FxNumField, v: unknown): number {
  const { min, max } = FX_LIMITS[field];
  if (field === 'strokeWidth') return clampH(v, min, max, 0);
  return clampI(v, min, max, TEXT_FX_DEFAULTS[field]);
}

/** Vorschau-Text: Override, sonst Standardtext, sonst die Slot-Beschriftung. */
export function previewText(cur: unknown, def: unknown, label: string): string {
  const t = cur != null && String(cur).trim() !== '' ? String(cur) : def != null ? String(def) : '';
  return t || label;
}

/** CSS-Wert font-family für Felder/Vorschau (Family-Name aus `ensureFontFace`). */
export function fontFamilyCss(family: string): string {
  return family ? `'${family}', var(--site-font, sans-serif)` : '';
}

function rgba(hex: string, a: number): string {
  const m = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(String(hex || '').trim());
  if (!m) return `rgba(0,0,0,${a})`;
  let h = m[1]!;
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

const PREVIEW_ANIM_DUR: Record<string, string> = { slow: '2.6s', normal: '1.8s', fast: '1s' };

/** Animationsklasse (kt-<typ>) oder '' bei 'none'. */
export function slotAnimClass(st: TextStyle): string {
  return st.anim && st.anim !== 'none' ? 'kt-' + st.anim : '';
}

/**
 * Nur die Effekt-Deklarationen (Deckkraft, Umriss, Schatten, Animations-
 * Variablen) eines Slots – wie `slotFxParts` in `public/textstyle.js`.
 */
export function slotFxParts(st: TextStyle): string[] {
  const parts: string[] = [];
  const op = st.opacity ?? 100;
  if (op < 100) parts.push(`opacity:${op / 100}`);
  const sw = st.strokeWidth ?? 0;
  if (sw > 0) parts.push(`-webkit-text-stroke:${sw}px ${st.strokeColor || '#000000'}`);
  if (st.shadow) {
    parts.push(
      `text-shadow:${st.shadowX ?? 0}px ${st.shadowY ?? 2}px ${st.shadowBlur ?? 6}px ${rgba(
        st.shadowColor || '#000000',
        0.6,
      )}`,
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

/**
 * Inline-Style der Slot-Vorschau (Farbe des Modus + Effekte), identisch zu
 * `slotPreviewStyle` in `public/textstyle.js`. `family` = Ergebnis von
 * `ensureFontFace(st.font)` bzw. '' ohne eigene Schrift.
 */
export function slotPreviewStyle(st: TextStyle, mode: ThemeMode, family: string): string {
  const dark = mode === 'dark';
  const color = (dark ? st.colorDark : st.colorLight) || DEFAULT_TEXT_COLOR[mode];
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
  if (st.font && family) parts.push(`font-family:${fontFamilyCss(family)}`);
  return parts.concat(slotFxParts(st)).join(';');
}

/** Textfarben aller Slots von einem Modus in den anderen kopieren. */
export function copyColors(media: TextStyleHost, from: ThemeMode): ThemeMode {
  const to: ThemeMode = from === 'dark' ? 'light' : 'dark';
  for (const f of TEXT_FIELDS) {
    const s = ensureTextStyle(media, f.key);
    s[colorField(to)] = s[colorField(from)];
  }
  return to;
}

/**
 * Stil-Einstellungen der Slots (inkl. „Standard für alle Slots“) von DE nach
 * EN übernehmen; Texte und Hero-Slots bleiben unberührt.
 */
export function copyStylesDeToEn(de: TextStyleHost, en: TextStyleHost): void {
  if (!en.textStyles || typeof en.textStyles !== 'object') en.textStyles = {};
  for (const f of TEXT_FIELDS) {
    const src = de.textStyles?.[f.key];
    if (src) en.textStyles[f.key] = JSON.parse(JSON.stringify(src));
    else delete en.textStyles[f.key];
  }
  en.textStyleUniform = de.textStyleUniform === true;
  en.textStyleUniformKey = de.textStyleUniformKey || UNIFORM_TEXT_KEYS[0];
}
