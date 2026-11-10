import { createApp, type App, type Component } from 'vue';
import type { Pinia } from 'pinia';

/**
 * Brücke zwischen den Vanilla-Modulen (`public/*.js`) und Vue: Vue-Teile werden
 * als „Inseln“ in bestehende DOM-Knoten gemountet und teilen sich EINE
 * Pinia-Instanz. So können Tabs einzeln nach Vue umziehen, während der Rest
 * unverändert weiterläuft.
 */
export interface IslandHandle {
  app: App;
  unmount: () => void;
}

export function mountIsland(
  pinia: Pinia,
  el: Element,
  component: Component,
  props?: Record<string, unknown>,
): IslandHandle {
  const app = createApp(component, props);
  app.use(pinia);
  app.mount(el);
  return { app, unmount: () => app.unmount() };
}

/** API, die `public/core.js` & Co. über `window.kodiniAdminVue` nutzen. */
export interface KodiniAdminVue {
  /** Version der Brücken-API (steigt bei inkompatiblen Änderungen). */
  version: 1;
  toast: (message: string, options?: import('./stores/toast').ToastOptions) => number;
  mountIsland: (el: Element, component: Component, props?: Record<string, unknown>) => IslandHandle;
  /** Namen der Tabs, die bereits als Vue-Insel vorliegen. */
  tabs: readonly VueTabName[];
  /** Mountet einen migrierten Tab (z. B. `ticker`) in `el`. */
  mountTab: (el: Element, name: VueTabName, props: Record<string, unknown>) => IslandHandle;
}

/** Tabs, die als Vue-Insel vorliegen (wächst mit jeder Migration). */
export type VueTabName = 'ticker' | 'texts' | 'icons' | 'files';

declare global {
  interface Window {
    kodiniAdminVue?: KodiniAdminVue;
  }
}
