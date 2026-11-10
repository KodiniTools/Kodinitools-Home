/**
 * Einstieg der Vue-Teile des Admins (gebaut nach `server/admin/dist/`, geladen
 * von `public/index.html` als `./app/main.js`). Fehlt der Build, lädt das
 * Skript nicht und der Vanilla-Admin läuft unverändert weiter.
 */
import { createPinia } from 'pinia';
import { mountIsland, type KodiniAdminVue } from './bridge';
import { useToastStore } from './stores/toast';
import ToastHost from './components/ToastHost.vue';
import './design-system/tokens-v2.css';

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
  };
  window.kodiniAdminVue = api;
  window.dispatchEvent(new CustomEvent('kodini-admin-vue-ready'));
  return api;
}

if (typeof document !== 'undefined' && !window.kodiniAdminVue) startAdminVue();
