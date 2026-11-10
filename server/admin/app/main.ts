/**
 * Einstieg der Vue-Teile des Admins (gebaut nach `server/admin/dist/`, geladen
 * von `public/index.html` als `./app/main.js`). Fehlt der Build, lädt das
 * Skript nicht und der Vanilla-Admin läuft unverändert weiter.
 */
import { createPinia } from 'pinia';
import type { Component } from 'vue';
import { mountIsland, type KodiniAdminVue, type VueTabName } from './bridge';
import { useToastStore } from './stores/toast';
import ToastHost from './components/ToastHost.vue';
import TickerTab from './tabs/ticker/TickerTab.vue';
import TextsTab from './tabs/texts/TextsTab.vue';
import IconsTab from './tabs/icons/IconsTab.vue';
import FilesTab from './tabs/files/FilesTab.vue';
import MediaTab from './tabs/media/MediaTab.vue';
import BackgroundTab from './tabs/background/BackgroundTab.vue';
import ToolCardsTab from './tabs/toolcards/ToolCardsTab.vue';
import './design-system/tokens-v2.css';

/** Migrierte Tabs (Name → Komponente). */
const TABS: Record<VueTabName, Component> = {
  ticker: TickerTab,
  texts: TextsTab,
  icons: IconsTab,
  files: FilesTab,
  media: MediaTab,
  background: BackgroundTab,
  toolcards: ToolCardsTab,
};

export function startAdminVue(doc: Document = document): KodiniAdminVue {
  const pinia = createPinia();
  const host = doc.createElement('div');
  host.id = 'kv-toast-root';
  doc.body.appendChild(host);
  mountIsland(pinia, host, ToastHost);

  const toasts = useToastStore(pinia);
  const api: KodiniAdminVue = {
    version: 1,
    toast: (message, options) => toasts.addToast(message, options),
    mountIsland: (el, component, props) => mountIsland(pinia, el, component, props),
    tabs: Object.keys(TABS) as VueTabName[],
    mountTab: (el, name, props) => mountIsland(pinia, el, TABS[name], props),
  };
  window.kodiniAdminVue = api;
  window.dispatchEvent(new CustomEvent('kodini-admin-vue-ready'));
  return api;
}

if (typeof document !== 'undefined' && !window.kodiniAdminVue) startAdminVue();
