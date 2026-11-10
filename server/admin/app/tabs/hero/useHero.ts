import { computed, inject, provide, reactive, type ComputedRef, type InjectionKey } from 'vue';
import type { Overrides, ThemeMode } from '../../../types';
import { useToastStore, type ToastOptions } from '../../stores/toast';
import { ensureTextStyle, readTextStyle, type TextStyle } from '../texts/textStyle';
import {
  chipOffset,
  clampOffset,
  setChipOffset,
  slotText as slotTextOf,
  type FontFamilyOf,
  type HeroDesign,
  type HeroFeature,
  type HeroMediaHost,
  type HeroPartKind,
  type HeroService,
  type HeroSide,
  type HeroSlotKey,
  type HeroTextSlot,
} from './heroData';
import { hdRev, hdUi } from './heroUi';

/** Abgeleiteter Lese-Zustand (bei jeder Änderung neu, damit alles nachzieht). */
export interface HeroView {
  /** `media.<lang>.heroDesign` als reaktiver Proxy (Schreiben wirkt auf den Rohzustand). */
  hd: HeroDesign;
  /** `media.<lang>` (für `textStyles["hero.*"]`). */
  media: HeroMediaHost;
  /** `overrides.<lang>` */
  ov: Overrides;
  defs: Overrides;
  feats: HeroFeature[];
  globalFont: string;
  layout: 'classic' | 'compact';
}

export interface HeroApi {
  service: HeroService;
  view: ComputedRef<HeroView>;
  toast: (message: string, options?: ToastOptions) => void;
  /** Änderung am Proxy vorbei (Service, andere Sprache): ausführen, dann alles neu lesen. */
  change: (fn: () => void) => void;
  /** font-family-Wert einer Schriftdatei (lädt @font-face) oder ''. */
  ff: FontFamilyOf;
  side: (mode: ThemeMode) => HeroSide;
  slot: (key: HeroSlotKey) => HeroTextSlot;
  /** Feinabstimmung eines Hero-Textes lesen (legt nichts an). */
  style: (key: HeroSlotKey) => TextStyle;
  /** … zum Schreiben (legt den Eintrag bei Bedarf an). */
  editStyle: (key: HeroSlotKey) => TextStyle;
  slotText: (key: HeroSlotKey) => string;
  select: (kind: HeroPartKind, key?: string) => void;
  offsetOf: (kind: HeroPartKind, key: string) => { x: number; y: number };
  setOffset: (kind: HeroPartKind, key: string, x: number, y: number) => void;
  /** Optionen einer Schriftauswahl (jede in ihrer Schrift; fehlende bleibt wählbar). */
  fontOptions: (cur: string) => FontOption[];
}

export interface FontOption {
  value: string;
  label: string;
  style?: { fontFamily: string };
}

const KEY: InjectionKey<HeroApi> = Symbol('hero');

/** Stil-Schlüssel des Hero-Textes eines Vorschau-Teils (Chips haben keinen). */
export const PART_SLOT: Record<Exclude<HeroPartKind, 'chip'>, HeroSlotKey> = {
  title: 'hero.title',
  subtitle: 'hero.subtitle',
  cta: 'hero.cta',
};

/** Zustand + Schreib-Funktionen des Tabs; einmal im Tab erzeugt und an die Teile verteilt. */
export function provideHero(service: HeroService): HeroApi {
  const toasts = useToastStore();
  const toast = (message: string, options: ToastOptions = { type: 'success' }) => {
    toasts.addToast(message, options);
  };

  const view = computed<HeroView>(() => {
    void hdRev.value;
    return {
      hd: reactive(service.design()) as HeroDesign,
      media: reactive(service.media()) as HeroMediaHost,
      ov: reactive(service.overrides()) as Overrides,
      defs: service.defaults(),
      feats: service.features(),
      globalFont: service.globalFont(),
      layout: service.homeLayout(),
    };
  });

  function change(fn: () => void) {
    fn();
    hdRev.value++;
  }
  const ff: FontFamilyOf = (file) =>
    file ? `'${service.ensureFontFace(file)}', system-ui, sans-serif` : '';
  const side = (mode: ThemeMode) => view.value.hd[mode];
  const slot = (key: HeroSlotKey) => service.textSlots.find((s) => s.key === key)!;
  const style = (key: HeroSlotKey) => readTextStyle(view.value.media, key);
  const editStyle = (key: HeroSlotKey) => ensureTextStyle(view.value.media, key);
  const slotText = (key: HeroSlotKey) =>
    slotTextOf(view.value.ov, view.value.defs, service.lang, slot(key));

  function select(kind: HeroPartKind, key = '') {
    hdUi.selected = { kind, key };
    hdUi.selSeq++;
  }
  function offsetOf(kind: HeroPartKind, key: string) {
    if (kind === 'chip') return chipOffset(view.value.hd, key);
    const st = style(PART_SLOT[kind]);
    return { x: st.offsetX || 0, y: st.offsetY || 0 };
  }
  function setOffset(kind: HeroPartKind, key: string, x: number, y: number) {
    const m = service.offsetMax;
    const cx = clampOffset(x, m.x);
    const cy = clampOffset(y, m.y);
    if (kind === 'chip') {
      setChipOffset(view.value.hd, key, cx, cy);
      return;
    }
    const st = editStyle(PART_SLOT[kind]);
    st.offsetX = cx;
    st.offsetY = cy;
  }

  function fontOptions(cur: string): FontOption[] {
    const list = service.fonts().slice();
    if (cur && !list.some((f) => f.name === cur))
      list.unshift({ name: cur, label: `${cur} (nicht gefunden)`, url: '', bytes: 0 });
    return [
      { value: '', label: 'Standard (System)' },
      ...list.map((f) => {
        const fam = service.ensureFontFace(f.name);
        return {
          value: f.name,
          label: f.label || f.name,
          style: fam ? { fontFamily: `'${fam}', system-ui, sans-serif` } : undefined,
        };
      }),
    ];
  }

  const api: HeroApi = {
    service,
    view,
    toast,
    change,
    ff,
    side,
    slot,
    style,
    editStyle,
    slotText,
    select,
    offsetOf,
    setOffset,
    fontOptions,
  };
  provide(KEY, api);
  return api;
}

export function useHero(): HeroApi {
  const api = inject(KEY);
  if (!api) throw new Error('useHero() außerhalb des Tabs „Hero-Design“');
  return api;
}
