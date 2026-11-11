import { defineStore } from 'pinia';
import { ref } from 'vue';

/**
 * Toast-Benachrichtigungen des Admins (Muster: `stores/toast.ts` im Modernen
 * Musikplayer). Angezeigt von `ToastHost.vue`; die Vanilla-Module erreichen den
 * Store über `toast()` in `public/core.ts` → `window.kodiniAdminVue.toast`.
 * Fehler bleiben länger stehen; `duration: 0` = bis zum Schließen.
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
  /** Anzeigedauer in ms; 0 = bleibt bis zum Schließen. */
  duration: number;
}

export interface ToastOptions {
  type?: ToastType;
  duration?: number;
}

/**
 * Standarddauer je Typ. `info` entspricht der bisherigen Anzeigedauer des
 * Vanilla-Toasts (2,2 s), damit sich das Verhalten der Tabs nicht ändert.
 */
export const TOAST_DURATION: Record<ToastType, number> = {
  success: 2200,
  info: 2200,
  warning: 5000,
  error: 8000,
};

/** Höchstens so viele gleichzeitig; ältere werden verdrängt. */
export const MAX_TOASTS = 4;

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<Toast[]>([]);
  const timers = new Map<number, ReturnType<typeof setTimeout>>();
  let nextId = 0;

  function removeToast(id: number): void {
    const timer = timers.get(id);
    if (timer) clearTimeout(timer);
    timers.delete(id);
    toasts.value = toasts.value.filter((toast) => toast.id !== id);
  }

  function addToast(message: string, options: ToastOptions = {}): number {
    const type = options.type ?? 'info';
    const duration = Math.max(0, options.duration ?? TOAST_DURATION[type]);
    const id = ++nextId;
    toasts.value = [...toasts.value, { id, message: String(message), type, duration }];
    while (toasts.value.length > MAX_TOASTS) {
      const oldest = toasts.value[0];
      if (!oldest) break;
      removeToast(oldest.id);
    }
    if (duration > 0)
      timers.set(
        id,
        setTimeout(() => removeToast(id), duration),
      );
    return id;
  }

  function clearAll(): void {
    for (const timer of timers.values()) clearTimeout(timer);
    timers.clear();
    toasts.value = [];
  }

  return { toasts, addToast, removeToast, clearAll };
});
