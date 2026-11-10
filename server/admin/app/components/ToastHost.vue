<template>
  <div class="kv-toast-host" aria-live="polite">
    <TransitionGroup name="kv-toast" tag="div" class="kv-toast-host__list">
      <div
        v-for="toast in visibleToasts"
        :key="toast.id"
        :class="['kv-toast', `kv-toast--${toast.type}`]"
        :role="toast.type === 'error' ? 'alert' : 'status'"
      >
        <span class="kv-toast__message">{{ toast.message }}</span>
        <button
          type="button"
          class="kv-toast__close"
          aria-label="Schließen"
          title="Schließen"
          @click="store.removeToast(toast.id)"
        >
          ×
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useToastStore } from '../stores/toast';

/**
 * Zeigt die Toasts aus `stores/toast` unten mittig (wie der bisherige
 * Vanilla-Toast), neueste unten. Farben aus den Variablen des Admins
 * (`--panel`, `--border`, `--accent` …); die Tokens v2 folgen später.
 */
const store = useToastStore();
const visibleToasts = computed(() => store.toasts);
</script>

<style scoped>
.kv-toast-host {
  position: fixed;
  left: 50%;
  bottom: 1.5rem;
  transform: translateX(-50%);
  z-index: 10000;
  pointer-events: none;
  width: min(92vw, 480px);
}
.kv-toast-host__list {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}
.kv-toast {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  max-width: 100%;
  padding: 0.6rem 0.6rem 0.6rem 1rem;
  border: 1px solid var(--border, #334155);
  border-left: 3px solid var(--accent, #38bdf8);
  border-radius: var(--radius, 10px);
  background: var(--panel, #1e293b);
  color: var(--text, #e2e8f0);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}
.kv-toast--success {
  border-left-color: var(--accent-2, #22c55e);
}
.kv-toast--warning {
  border-left-color: #f59e0b;
}
.kv-toast--error {
  border-left-color: var(--danger, #ef4444);
}
.kv-toast__message {
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
}
.kv-toast__close {
  flex-shrink: 0;
  padding: 0 0.5rem;
  line-height: 1.6;
  background: transparent;
  border: 1px solid transparent;
  color: var(--muted, #94a3b8);
}
.kv-toast__close:hover {
  color: var(--text, #e2e8f0);
}
.kv-toast-enter-active,
.kv-toast-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.kv-toast-enter-from,
.kv-toast-leave-to {
  opacity: 0;
  transform: translateY(0.5rem);
}
@media (prefers-reduced-motion: reduce) {
  .kv-toast-enter-active,
  .kv-toast-leave-active {
    transition: none;
  }
}
</style>
