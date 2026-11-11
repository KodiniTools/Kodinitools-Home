import type { IconTint, IconTintField, Lang, Overrides } from '../../../types';
import { getPath, normHexOrEmpty } from '../../../public/model-core';

/**
 * Reine Regeln des Tabs „Icons“ (Vue-Fassung von `public/icons.ts`). Arbeiten
 * nur auf übergebenen Objekten; `public/model.ts` bzw. `model-toolcards.ts`
 * werden bewusst nicht importiert (sonst zweite `state`-Instanz im Bundle).
 */

export type IconCat = 'solid' | 'regular' | 'brands' | 'admin';
export const ICON_CATS: readonly IconCat[] = ['solid', 'regular', 'brands', 'admin'];
export const CAT_LABEL: Record<IconCat, string> = {
  solid: 'Solid',
  regular: 'Regular',
  brands: 'Brands',
  admin: 'Eigene (admin-svgs)',
};
const ICON_BASE: Record<IconCat, string> = {
  solid: '/fontawesome/svgs/solid',
  regular: '/fontawesome/svgs/regular',
  brands: '/fontawesome/svgs/brands',
  admin: '/fontawesome/admin-svgs',
};
export type ToolSection = 'tools' | 'imageTools' | 'diverseTools';
export const SECTION_LABEL: Record<ToolSection, string> = {
  tools: 'Audio-Tools',
  imageTools: 'Bild-Tools',
  diverseTools: 'Diverse Tools',
};
/** Kachel 1..6 (größtmögliche Kachelzahl über alle Layouts). */
export const HERO_CELLS = 6;

export type IconLists = Record<IconCat, string[]>;
export interface IconRef {
  cat: IconCat;
  name: string;
}
/** Tool-Karte für Ziel-Auswahl und Icon-Verwaltung. */
export interface ToolRef {
  section: ToolSection;
  key: string;
  title: string;
}

export const iconUrl = (cat: IconCat, name: string) =>
  `${ICON_BASE[cat] ?? '/fontawesome/svgs/' + cat}/${encodeURIComponent(name)}`;
export const iconLabel = (name: string) => name.replace(/\.svg$/i, '');

/** Antwort von `GET /api/fontawesome` robust in Listen je Set umwandeln. */
export function normIconLists(data: unknown): IconLists {
  const icons =
    data && typeof data === 'object' && 'icons' in data
      ? ((data as { icons: unknown }).icons as Record<string, unknown> | null)
      : null;
  const pick = (c: IconCat) => {
    const v = icons && typeof icons === 'object' ? icons[c] : undefined;
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  };
  return {
    solid: pick('solid'),
    regular: pick('regular'),
    brands: pick('brands'),
    admin: pick('admin'),
  };
}

export function iconTotal(lists: IconLists | null): number {
  return lists ? ICON_CATS.reduce((n, c) => n + lists[c].length, 0) : 0;
}

/** Alle Treffer nach Set und Suchbegriff (Teilstring im Namen, ohne `.svg`). */
export function filterIcons(lists: IconLists | null, q: string, cat: IconCat | ''): IconRef[] {
  if (!lists) return [];
  const needle = q.trim().toLowerCase();
  const cats = cat ? [cat] : ICON_CATS;
  const out: IconRef[] = [];
  for (const c of cats)
    for (const name of lists[c]) {
      if (needle && !iconLabel(name).toLowerCase().includes(needle)) continue;
      out.push({ cat: c, name });
    }
  return out;
}

/** Effektives Icon (svg) einer Karte: Override (auch '' = entfernt), sonst Standard. */
export function toolSvg(overrides: Overrides, defaults: Overrides, t: ToolRef): string {
  const ov = getPath(overrides, [t.section, t.key, 'svg']);
  if (ov !== undefined) return typeof ov === 'string' ? ov : '';
  const def = getPath(defaults, [t.section, t.key, 'svg']);
  return typeof def === 'string' ? def : '';
}

/** Nur '' oder interner Pfad bzw. http(s)-URL (wie Server-Validierung). */
export const validLink = (v: string) => v === '' || /^(\/|https?:\/\/)/.test(v);

// ---- Ziel „Banner / Kachel“ -------------------------------------------------
/** Teil von `media.<lang>`, den „Hinzufügen“ als Banner/Kachel schreibt. */
export interface HeroMediaHost {
  heroBanner?: string;
  heroBannerLink?: string;
  heroMode?: 'banner' | 'grid';
  heroGrid?: string[];
  heroGridLinks?: string[];
}
export type IconTarget = 'banner' | `grid${number}` | `tool:${string}`;

/** Ziel anwenden (wie `addIcon` in `public/icons.ts`); Rückgabe = Toast-Text. */
export function applyIconTarget(
  media: HeroMediaHost,
  overrides: Overrides,
  lang: Lang,
  target: string,
  url: string,
  link: string,
  setOverride: (o: Overrides, path: (string | number)[], v: unknown) => void,
): string | null {
  const L = lang.toUpperCase();
  if (target === 'banner') {
    media.heroBanner = url;
    media.heroBannerLink = link;
    media.heroMode = 'banner';
    return `Icon als Einzel-Banner (${L}) gesetzt${link ? ' + Link' : ''}`;
  }
  const g = /^grid([0-5])$/.exec(target);
  if (g) {
    const i = Number(g[1]);
    if (!Array.isArray(media.heroGrid)) media.heroGrid = ['', '', '', '', '', ''];
    media.heroGrid[i] = url;
    if (!Array.isArray(media.heroGridLinks)) media.heroGridLinks = ['', '', '', '', '', ''];
    media.heroGridLinks[i] = link;
    media.heroMode = 'grid';
    return `Icon in Kachel ${i + 1} (${L}) gesetzt${link ? ' + Link' : ''}`;
  }
  if (target.startsWith('tool:')) {
    const parts = target.split(':');
    const section = parts[1]!;
    const key = parts.slice(2).join(':');
    setOverride(overrides, [section, key, 'svg'], url);
    return `Tool-Icon „${key}“ (${L}) gesetzt`;
  }
  return null;
}

// ---- Icon-Färbung je Karte (media.<lang>.iconTint) -------------------------
export type TintField = IconTintField;
export type { IconTint };
export const TINT_FIELDS: readonly TintField[] = ['light', 'dark', 'bg', 'bgDark'];
/** Vorschlagsfarben für neu aktivierte Felder (Markenfarben / Standard-Kasten). */
export const TINT_SUGGEST: IconTint = {
  light: '#014f99',
  dark: '#e8a945',
  bg: '#ffffff',
  bgDark: '#eef1f5',
};
export const TINT_LABEL: IconTint = {
  light: 'Icon-Farbe Hell',
  dark: 'Icon-Farbe Dunkel',
  bg: 'Kasten Hell',
  bgDark: 'Kasten Dunkel',
};
export const TINT_MODE_FIELDS = {
  light: ['light', 'bg'],
  dark: ['dark', 'bgDark'],
} as const satisfies Record<'light' | 'dark', readonly TintField[]>;

export interface TintHost {
  iconTint?: Record<string, Partial<IconTint>>;
}
const TOOL_CARD_KEY = /^(tools|imageTools|diverseTools)\.[a-zA-Z0-9_-]+$/;

/** Färbung einer Karte (normalisiert, '' = aus) – wie `getIconTint`. */
export function getTint(media: TintHost, id: string): IconTint {
  const t = media.iconTint?.[id] ?? {};
  return {
    light: normHexOrEmpty(t.light),
    dark: normHexOrEmpty(t.dark),
    bg: normHexOrEmpty(t.bg),
    bgDark: normHexOrEmpty(t.bgDark),
  };
}
/** Teilweise setzen; ein Eintrag ohne jede Farbe wird entfernt – wie `setIconTint`. */
export function setTint(media: TintHost, id: string, patch: Partial<IconTint>): void {
  if (!TOOL_CARD_KEY.test(id)) return;
  if (!media.iconTint || typeof media.iconTint !== 'object') media.iconTint = {};
  const cur = getTint(media, id);
  for (const f of TINT_FIELDS) if (f in patch) cur[f] = normHexOrEmpty(patch[f]);
  if (TINT_FIELDS.some((f) => cur[f])) media.iconTint[id] = cur;
  else delete media.iconTint[id];
}
export const tintActive = (t: IconTint) => TINT_FIELDS.some((f) => t[f]);
