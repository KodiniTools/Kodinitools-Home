import { computed, inject, provide, reactive, type ComputedRef, type InjectionKey } from 'vue';
import type { ThemeMode } from '../../../types';
import { useToastStore, type ToastOptions } from '../../stores/toast';
import {
  fontOptionsOf,
  readBannerText,
  type BannerHost,
  type BannerStyle,
  type BannerText,
  type FontDecl,
  type FontOption,
  type LayoutService,
  type PageKey,
  type PageSettings,
  type Slideshow,
} from './layoutData';
import { lyRev } from './layoutUi';

/** Abgeleiteter Lese-Zustand (bei jeder Änderung neu, damit alles nachzieht). */
export interface LayoutView {
  /** `media.<lang>` als reaktiver Proxy (Schreiben wirkt auf den Rohzustand). */
  m: BannerHost;
  page: PageSettings;
}

export interface LayoutApi {
  service: LayoutService;
  view: ComputedRef<LayoutView>;
  /** Banner-Text mit Standardwerten (reaktiv). */
  text: ComputedRef<BannerText>;
  toast: (message: string, options?: ToastOptions) => void;
  /** Änderung am Proxy vorbei (Service, andere Sprache): ausführen, dann alles neu lesen. */
  change: (fn: () => void) => void;
  /** Banner-Design eines Modus (reaktiver Proxy). */
  style: (mode: ThemeMode) => BannerStyle;
  styles: () => Record<ThemeMode, BannerStyle>;
  slides: () => string[];
  slideshow: () => Slideshow;
  setPage: <K extends PageKey>(key: K, v: PageSettings[K]) => void;
  /** font-family-Deklaration (lädt @font-face) oder '' – wie `fontFF`. */
  fontDecl: FontDecl;
  fontOptions: (cur: string) => FontOption[];
}

const KEY: InjectionKey<LayoutApi> = Symbol('layout');

/** Zustand + Schreib-Funktionen des Tabs; einmal im Tab erzeugt und an die Teile verteilt. */
export function provideLayout(service: LayoutService): LayoutApi {
  const toasts = useToastStore();
  const toast = (message: string, options: ToastOptions = { type: 'success' }) => {
    toasts.addToast(message, options);
  };

  const view = computed<LayoutView>(() => {
    void lyRev.value;
    // Strukturen sichern, bevor der Proxy entsteht (wie getBannerStyle & Co.).
    service.ensureBanner(service.lang);
    return { m: reactive(service.media()) as BannerHost, page: service.page() };
  });
  const text = computed(() => readBannerText(view.value.m));

  function change(fn: () => void) {
    fn();
    lyRev.value++;
  }
  const styles = () => view.value.m.heroBannerStyle!;
  const style = (mode: ThemeMode) => styles()[mode === 'dark' ? 'dark' : 'light'];
  const slides = () => view.value.m.heroBannerSlides!;
  const slideshow = () => view.value.m.heroBannerSlideshow!;
  function setPage<K extends PageKey>(key: K, v: PageSettings[K]) {
    change(() => service.setPage(key, v));
  }
  const fontDecl: FontDecl = (file) =>
    file ? `font-family:'${service.ensureFontFace(file)}', var(--site-font, sans-serif);` : '';
  const fontOptions = (cur: string) => fontOptionsOf(service.fonts(), service.ensureFontFace, cur);

  const api: LayoutApi = {
    service,
    view,
    text,
    toast,
    change,
    style,
    styles,
    slides,
    slideshow,
    setPage,
    fontDecl,
    fontOptions,
  };
  provide(KEY, api);
  return api;
}

export function useLayout(): LayoutApi {
  const api = inject(KEY);
  if (!api) throw new Error('useLayout() außerhalb des Tabs „Layout“');
  return api;
}
