import { rgbaFromHex } from '../../../public/model-core.js';
import { clamp, overlayStyle, type FontDecl, type Slideshow } from './layoutData';

/**
 * Datenmodell und reine Regeln des Raster-Modus im Tab „Layout“ (Vue-Fassung
 * von `public/layout-grid.js`). Arbeitet nur auf übergebenen Objekten
 * (`state.media[lang]`); Konstanten wie die Layouts kommen über den Service
 * aus `public/model-grid.js`, damit es nur eine Quelle gibt.
 */

/** Design einer Kachel (`defaultCellStyle`). */
export interface CellStyle {
  borderColor: string;
  borderWidth: number;
  bgColor: string;
  bgOpacity: number;
  text: string;
  font: string;
  textColor: string;
  textSize: number;
  textPos: string;
  textX: number;
  textY: number;
  imgOpacity: number;
  imgDarken: number;
  imgBlur: number;
  imgSaturate: number;
}
export type CellField = keyof CellStyle;
export type CellImgField = 'imgOpacity' | 'imgDarken' | 'imgBlur' | 'imgSaturate';
export type CellColorField = 'borderColor' | 'bgColor' | 'textColor';
/** Grenzen + Beschriftung der Bildbearbeitung (`CELL_IMG_FIELDS`). */
export type CellImgFields = Record<
  CellImgField,
  { min: number; max: number; label: string; unit: string }
>;
export type GridRatio = '1:1' | '16:9' | '2:3';
export const GRID_RATIOS: readonly GridRatio[] = ['1:1', '16:9', '2:3'];
export const RATIO_LABEL: Record<GridRatio, string> = {
  '1:1': 'Quadratisch (1:1)',
  '16:9': 'Breit / Rechteck (16:9)',
  '2:3': 'Hochkant (2:3)',
};
const RATIO_AR: Record<GridRatio, string> = { '1:1': '1 / 1', '16:9': '16 / 9', '2:3': '2 / 3' };

/** Diashow der Kacheln: wie die des Banners plus „versetzt wechseln“. */
export interface GridSlideshow extends Slideshow {
  stagger: boolean;
}

/** Teil von `media.<lang>`, den der Raster-Modus liest und schreibt. */
export interface GridHost {
  heroLayout?: string;
  heroGridRatio?: string;
  heroGridFit?: 'cover' | 'contain';
  heroGridUniform?: boolean;
  heroGridUniformCell?: number;
  heroGridHidden?: boolean[];
  heroGridStyles?: CellStyle[];
  heroGrid?: string[];
  heroGridSlides?: string[][];
  heroGridSlideshow?: GridSlideshow;
}

/** Layouts (`HERO_LAYOUTS`) und Kacheln je Reihe (`HERO_LAYOUT_COLS`). */
export type HeroLayouts = Record<string, { label: string; cells: number }>;

export function normLayout(layouts: HeroLayouts, v: unknown): string {
  return typeof v === 'string' && Object.prototype.hasOwnProperty.call(layouts, v) ? v : 'grid3';
}
export const normRatio = (v: unknown): GridRatio =>
  GRID_RATIOS.includes(v as GridRatio) ? (v as GridRatio) : '1:1';
export const layoutCells = (layouts: HeroLayouts, layout: string) =>
  (layouts[layout] ?? layouts.grid3 ?? { cells: 3 }).cells;

/** Kacheln je Reihe bei n sichtbaren Kacheln (wie `heroGridReflowCols`, content.ts). */
export function reflowCols(cols: Record<string, number>, layout: string, n: number): number {
  const c = cols[layout] || 3;
  if (n <= 0) return 1;
  const rows = Math.ceil(n / c);
  return Math.max(1, Math.ceil(n / rows));
}
export const isHidden = (g: GridHost, i: number) =>
  Array.isArray(g.heroGridHidden) && g.heroGridHidden[i] === true;
/** Sichtbare Kachel-Indizes (wie `visibleGridCells`). */
export function visibleCells(g: GridHost, n: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) if (!isHidden(g, i)) out.push(i);
  return out;
}
/** Kachel ein-/ausblenden (legt das Array bei Bedarf an). */
export function setHidden(g: GridHost, i: number, hidden: boolean): void {
  if (!Array.isArray(g.heroGridHidden))
    g.heroGridHidden = [false, false, false, false, false, false];
  g.heroGridHidden[i] = hidden;
}

/** Master-Kachel bei „Standard für alle Kacheln“ (oder null). */
export const masterCell = (g: GridHost) => (g.heroGridUniform ? g.heroGridUniformCell || 0 : null);
/** Übernimmt Kachel i Werte einer anderen Kachel (dann sind ihre Design-Felder gesperrt)? */
export const isInherited = (g: GridHost, i: number) => {
  const mc = masterCell(g);
  return mc !== null && mc !== i;
};
/** Effektiver Stil (wie `getEffectiveCellStyle`): synchronisierte Felder vom Master. */
export function effectiveCell(g: GridHost, i: number, syncProps: readonly CellField[]): CellStyle {
  const styles = g.heroGridStyles!;
  const base = styles[i]!;
  const mc = masterCell(g);
  if (mc === null) return base;
  const master = styles[mc]!;
  const out = { ...base } as Record<string, unknown>;
  for (const p of syncProps) out[p] = master[p];
  return out as unknown as CellStyle;
}

/** CSS grid-template-columns je Layout (nur Vorschau). */
export function gridCols(layout: string): string {
  if (layout === 'vrow') return '1fr';
  if (layout === 'mosaic') return '2fr 1fr';
  if (layout === 'row4') return 'repeat(4, 1fr)';
  if (layout === 'grid3' || layout === 'grid6') return 'repeat(3, 1fr)';
  return 'repeat(2, 1fr)';
}
/** Bildebene einer Vorschau-Kachel (Deckkraft/Abdunkelung/Weichzeichner/Sättigung). */
export function cellImgStyle(s: CellStyle): string {
  const f: string[] = [];
  if (s.imgBlur > 0) f.push(`blur(${s.imgBlur}px)`);
  if (s.imgDarken > 0) f.push(`brightness(${((100 - s.imgDarken) / 100).toFixed(2)})`);
  if (s.imgSaturate !== 100) f.push(`saturate(${s.imgSaturate}%)`);
  const inset = s.imgBlur > 0 ? -s.imgBlur * 2 : 0;
  return `position:absolute;inset:${inset}px;opacity:${(s.imgOpacity / 100).toFixed(2)};filter:${f.join(' ') || 'none'}`;
}
/** Text-Overlay einer Vorschau-Kachel ('' ohne Text). */
export function cellTextStyle(s: CellStyle, fontDecl: FontDecl): string {
  if (!s.text) return '';
  return overlayStyle(
    {
      color: s.textColor,
      size: s.textSize,
      x: s.textX,
      y: s.textY,
      font: s.font,
      fsDefault: '.85rem',
      shadow: '0 1px 3px rgba(0,0,0,.7)',
      extra: '',
    },
    fontDecl,
  );
}

const GAP = '.45rem';
/** Aufbau der Vorschau: Container- und Kachel-Styles (wie `previewHtml`). */
export function previewLayout(
  g: GridHost,
  layouts: HeroLayouts,
  cols: Record<string, number>,
  syncProps: readonly CellField[],
): {
  layout: string;
  reflow: number;
  container: string;
  cells: { i: number; style: string; s: CellStyle }[];
} {
  const layout = normLayout(layouts, g.heroLayout);
  const n = layoutCells(layouts, layout);
  const ar = RATIO_AR[normRatio(g.heroGridRatio)];
  const visible = visibleCells(g, n);
  const reflow = visible.length < n;
  const c = reflowCols(cols, layout, visible.length);
  const cells = visible.map((i) => {
    const s = effectiveCell(g, i, syncProps);
    let box = `aspect-ratio:${ar};`;
    if (reflow)
      box += `flex:0 0 calc((100% - ${c - 1} * ${GAP}) / ${c});max-width:calc((100% - ${c - 1} * ${GAP}) / ${c});`;
    else if (layout === 'mosaic') box = `height:100%;${i === 0 ? 'grid-row:1 / span 2;' : ''}`;
    return {
      i,
      s,
      style: `position:relative;${box}border-radius:8px;overflow:hidden;background:${rgbaFromHex(s.bgColor, s.bgOpacity)};border:${s.borderWidth}px solid ${s.borderColor};display:flex;align-items:center;justify-content:center;cursor:pointer`,
    };
  });
  const rows =
    layout === 'mosaic' && !reflow ? 'grid-template-rows:1fr 1fr;aspect-ratio:2 / 1;' : '';
  const maxW = layout === 'big2' ? '440px' : layout === 'vrow' ? '190px' : '400px';
  const disp = reflow
    ? 'display:flex;flex-wrap:wrap;justify-content:center;'
    : `display:grid;grid-template-columns:${gridCols(layout)};`;
  return {
    layout,
    reflow: reflow ? c : 0,
    container: `${disp}${rows}gap:${GAP};max-width:${maxW};margin:.2rem auto`,
    cells,
  };
}

/**
 * Eingabe eines Kachel-Felds übernehmen – mit den Grenzen der Vanilla-Bindings
 * (`[data-cellfield]` in `bindGrid`).
 */
export function setCellField(
  s: CellStyle,
  field: CellField,
  raw: string | number,
  imgFields: CellImgFields,
): void {
  const int = parseInt(String(raw), 10) || 0;
  if (field === 'borderWidth') s.borderWidth = clamp(int, 0, 20);
  else if (field === 'bgOpacity') s.bgOpacity = clamp(int, 0, 100);
  else if (field === 'textSize') s.textSize = clamp(int, 0, 96);
  else if (field in imgFields) {
    const c = imgFields[field as CellImgField];
    s[field as CellImgField] = clamp(int, c.min, c.max);
  } else if (field === 'textX' || field === 'textY') s[field] = clamp(int, 0, 100);
  else (s as unknown as Record<string, unknown>)[field] = String(raw);
}
/** ↺ eines Kachel-Felds ('pos' = Position). */
export function resetCellField(s: CellStyle, field: CellField | 'pos', def: CellStyle): void {
  if (field === 'pos') {
    s.textX = def.textX;
    s.textY = def.textY;
    return;
  }
  (s as unknown as Record<string, unknown>)[field] = def[field];
}

/** Raster-Einstellungen, die „Kachel-Design übertragen“ kopiert. */
export const GRID_DESIGN_KEYS = [
  'heroLayout',
  'heroGridRatio',
  'heroGridFit',
  'heroGridUniform',
  'heroGridUniformCell',
  'heroGridSlideshow',
] as const satisfies readonly (keyof GridHost)[];
/**
 * Anordnung, Form, „Standard für alle“, Diashow-Einstellungen und das Design
 * aller Kacheln (ohne Text) in eine andere Sprache; Bilder/Links/Texte bleiben.
 * Objekte werden kopiert, damit die Sprachen sich nichts teilen.
 */
export function copyGridDesign(src: GridHost, dst: GridHost, cellDefault: () => CellStyle): void {
  const s = src as Record<string, unknown>;
  const d = dst as Record<string, unknown>;
  for (const k of GRID_DESIGN_KEYS) {
    const v = s[k];
    d[k] = v && typeof v === 'object' ? JSON.parse(JSON.stringify(v)) : v;
  }
  const from = src.heroGridStyles ?? [];
  if (!Array.isArray(dst.heroGridStyles)) dst.heroGridStyles = [];
  const keys = (Object.keys(cellDefault()) as CellField[]).filter((k) => k !== 'text');
  for (let i = 0; i < from.length; i++) {
    const target = (dst.heroGridStyles[i] ??= cellDefault());
    for (const k of keys) (target as unknown as Record<string, unknown>)[k] = from[i]![k];
  }
}
