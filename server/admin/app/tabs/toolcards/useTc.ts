import { computed, inject, provide, reactive, type ComputedRef, type InjectionKey } from 'vue';
import type { ThemeMode } from '../../../types';
import { useToastStore, type ToastOptions } from '../../stores/toast';
import {
  openLabel,
  sampleCard,
  type CardInfo,
  type TcService,
  type TcShow,
  type TcShowKey,
  type TcSide,
  type TcStyle,
  type TcText,
  type ToolCards,
} from './tcData';
import { tcRev, tcUi } from './tcUi';

/** Abgeleiteter Lese-Zustand (bei jeder Änderung neu, damit alles nachzieht). */
export interface TcView {
  /** `media.<lang>.toolCards` als reaktiver Proxy (Schreiben wirkt auf den Rohzustand). */
  tc: ToolCards;
  cards: CardInfo[];
  /** Gewählte Karte ('' = Standard; fällt auf '' zurück, wenn es sie nicht gibt). */
  selected: string;
  selCard: CardInfo | null;
  /** In der Vorschau gezeigte Karte (gewählte oder Beispiel-Karte). */
  previewCard: CardInfo;
  /** Bearbeitetes Design: eigenes der Karte, sonst Standard. */
  style: TcStyle;
  /** Bearbeitet die Auswahl ein eigenes Design (Standard oder Karte mit ●)? */
  editsOwn: boolean;
  openLabel: string;
}

export interface TcApi {
  service: TcService;
  view: ComputedRef<TcView>;
  toast: (message: string, options?: ToastOptions) => void;
  /** Externe Änderung (Karten, Texte, Ausblenden …): ausführen, dann alles neu lesen. */
  change: (fn: () => void) => void;
  /** Jede Design-Bearbeitung schaltet das Design ein (sonst wirkt nichts auf der Seite). */
  ensureEnabled: () => void;
  /** Ziel von „↺“: beim Standard die Werkswerte, bei einer Karte der Standard. */
  resetSource: (mode: ThemeMode) => TcSide;
  setSide: (mode: ThemeMode, patch: Partial<TcSide>) => void;
  resetSide: (mode: ThemeMode, fields: readonly (keyof TcSide)[]) => void;
  text: ComputedRef<TcText>;
  textResetSource: () => TcText;
  setText: <K extends keyof TcText>(field: K, value: TcText[K]) => void;
  show: ComputedRef<TcShow>;
  showResetSource: () => TcShow;
  setShow: (key: TcShowKey, on: boolean) => void;
  select: (id: string) => void;
  /** Effektives Design einer Karte. */
  styleOf: (id: string) => TcStyle;
}

const KEY: InjectionKey<TcApi> = Symbol('tc');

/** Zustand + Schreib-Funktionen des Tabs; einmal im Tab erzeugt und an die Teile verteilt. */
export function provideTc(service: TcService): TcApi {
  const toasts = useToastStore();
  const toast = (message: string, options: ToastOptions = { type: 'success' }) => {
    toasts.addToast(message, options);
  };

  const view = computed<TcView>(() => {
    void tcRev.value;
    const tc = reactive(service.toolCards()) as ToolCards;
    const cards = service.cards();
    const selCard = (tcUi.selected && cards.find((c) => c.id === tcUi.selected)) || null;
    const selected = selCard ? selCard.id : '';
    const style = (selected && tc.cards[selected]) || tc.default;
    return {
      tc,
      cards,
      selected,
      selCard,
      previewCard: selCard || sampleCard(service.lang, cards),
      style,
      editsOwn: !selected || !!tc.cards[selected],
      openLabel: openLabel(service),
    };
  });

  function change(fn: () => void) {
    fn();
    tcRev.value++;
  }
  function ensureEnabled() {
    const tc = view.value.tc;
    if (tc.enabled) return;
    tc.enabled = true;
    toast('Tool-Karten-Design aktiviert – Änderungen wirken nach Speichern/Vorschau', {
      type: 'info',
    });
  }
  const resetSource = (mode: ThemeMode): TcSide =>
    view.value.selected ? view.value.tc.default[mode] : service.sideDefault(mode);

  function setSide(mode: ThemeMode, patch: Partial<TcSide>) {
    ensureEnabled();
    Object.assign(view.value.style[mode], patch);
  }
  function resetSide(mode: ThemeMode, fields: readonly (keyof TcSide)[]) {
    const src = resetSource(mode);
    const s = view.value.style[mode] as unknown as Record<string, unknown>;
    for (const f of fields) if (f in src) s[f] = src[f];
    toast('Auf Standard zurückgesetzt');
  }

  // Typografie/Sichtbarkeit: Lesen ohne Schreiben (fehlend → Standard), das
  // Objekt wird erst beim ersten Schreiben angelegt.
  const text = computed<TcText>(() => view.value.style.text ?? service.textDefault());
  const textResetSource = (): TcText =>
    (view.value.selected && view.value.tc.default.text) || service.textDefault();
  function editText(): TcText {
    const st = view.value.style;
    if (!st.text || typeof st.text !== 'object') st.text = service.textDefault();
    return st.text;
  }
  function setText<K extends keyof TcText>(field: K, value: TcText[K]) {
    ensureEnabled();
    editText()[field] = value;
  }
  const show = computed<TcShow>(() => view.value.style.show ?? service.showDefault());
  const showResetSource = (): TcShow =>
    (view.value.selected && view.value.tc.default.show) || service.showDefault();
  function setShow(key: TcShowKey, on: boolean) {
    ensureEnabled();
    const st = view.value.style;
    if (!st.show || typeof st.show !== 'object') st.show = service.showDefault();
    st.show[key] = on;
  }

  function select(id: string) {
    tcUi.selected = id;
  }
  const styleOf = (id: string): TcStyle => view.value.tc.cards[id] || view.value.tc.default;

  const api: TcApi = {
    service,
    view,
    toast,
    change,
    ensureEnabled,
    resetSource,
    setSide,
    resetSide,
    text,
    textResetSource,
    setText,
    show,
    showResetSource,
    setShow,
    select,
    styleOf,
  };
  provide(KEY, api);
  return api;
}

export function useTc(): TcApi {
  const api = inject(KEY);
  if (!api) throw new Error('useTc() außerhalb des Tabs „Tool-Karten“');
  return api;
}
