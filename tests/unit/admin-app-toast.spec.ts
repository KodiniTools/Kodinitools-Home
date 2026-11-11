// @vitest-environment happy-dom
/**
 * Erste Vue-Insel des Admins: Toast-Store + ToastHost, Brücke
 * `window.kodiniAdminVue` und die Delegation aus `public/core.ts` – inklusive
 * Rückfall auf den Vanilla-Toast, wenn die Vue-Teile nicht geladen sind.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { MAX_TOASTS, TOAST_DURATION, useToastStore } from '../../server/admin/app/stores/toast';
import { startAdminVue } from '../../server/admin/app/main';
import { toast as legacyToast } from '../../server/admin/public/core';

describe('Toast-Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  it('info entspricht der bisherigen Anzeigedauer (2,2 s), Fehler bleiben länger', () => {
    const s = useToastStore();
    s.addToast('a');
    s.addToast('b', { type: 'error' });
    expect(s.toasts.map((t) => [t.type, t.duration])).toEqual([
      ['info', TOAST_DURATION.info],
      ['error', TOAST_DURATION.error],
    ]);
    expect(TOAST_DURATION.info).toBe(2200);
    vi.advanceTimersByTime(2200);
    expect(s.toasts.map((t) => t.message)).toEqual(['b']);
    vi.advanceTimersByTime(TOAST_DURATION.error);
    expect(s.toasts).toEqual([]);
  });

  it('verdrängt ältere über MAX_TOASTS, duration 0 bleibt bis zum Schließen', () => {
    const s = useToastStore();
    const sticky = s.addToast('bleibt', { duration: 0 });
    for (let i = 0; i < MAX_TOASTS; i++) s.addToast(`m${i}`);
    expect(s.toasts).toHaveLength(MAX_TOASTS);
    expect(s.toasts.some((t) => t.id === sticky)).toBe(false);
    s.clearAll();
    const id = s.addToast('x', { duration: 0 });
    vi.advanceTimersByTime(60_000);
    expect(s.toasts.map((t) => t.id)).toEqual([id]);
    s.removeToast(id);
    expect(s.toasts).toEqual([]);
  });
});

describe('Brücke + ToastHost', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div class="toast" id="toast"></div>';
    delete window.kodiniAdminVue;
  });

  it('ohne Vue-Teile zeigt core.ts den Vanilla-Toast', () => {
    legacyToast('Gespeichert');
    const el = document.querySelector('#toast')!;
    expect(el.textContent).toBe('Gespeichert');
    expect(el.classList.contains('show')).toBe(true);
  });

  it('mit Vue-Teilen übernimmt der Store, der Vanilla-Toast bleibt leer', async () => {
    const ready = vi.fn();
    window.addEventListener('kodini-admin-vue-ready', ready, { once: true });
    const api = startAdminVue(document);
    expect(window.kodiniAdminVue).toBe(api);
    expect(ready).toHaveBeenCalledOnce();

    legacyToast('Hochgeladen');
    legacyToast('Fehler beim Speichern', 'error');
    await nextTick();

    expect(document.querySelector('#toast')!.textContent).toBe('');
    const items = [...document.querySelectorAll('#kv-toast-root .kv-toast')];
    expect(items.map((e) => e.querySelector('.ui-toast__message')?.textContent)).toEqual([
      'Hochgeladen',
      'Fehler beim Speichern',
    ]);
    expect(items[1]!.getAttribute('role')).toBe('alert');
    expect(items[0]!.getAttribute('role')).toBe('status');

    (items[0]!.querySelector('button') as HTMLButtonElement).click();
    await nextTick();
    // Der geschlossene Toast läuft noch aus (Leave-Transition), gezählt werden die übrigen.
    expect(
      document.querySelectorAll('#kv-toast-root .kv-toast:not(.toast-leave-active)'),
    ).toHaveLength(1);
  });

  it('wirft die Vue-Seite, fällt core.ts auf den Vanilla-Toast zurück', () => {
    window.kodiniAdminVue = {
      version: 1,
      toast: () => {
        throw new Error('kaputt');
      },
      mountIsland: () => {
        throw new Error('n/a');
      },
      tabs: [],
      mountTab: () => {
        throw new Error('n/a');
      },
    };
    legacyToast('Trotzdem sichtbar');
    expect(document.querySelector('#toast')!.textContent).toBe('Trotzdem sichtbar');
  });
});
