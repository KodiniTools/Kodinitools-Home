<template>
  <div class="toast-host" aria-live="polite">
    <TransitionGroup name="toast" tag="div" class="toast-host__list">
      <UiToast
        v-for="toast in store.toasts"
        :key="toast.id"
        class="kv-toast"
        :message="toast.message"
        :type="toast.type"
        @dismiss="store.removeToast(toast.id)"
      />
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useToastStore } from '../stores/toast';
import UiToast from './ui/UiToast.vue';

/**
 * Zeigt die Toasts aus `stores/toast` mit `UiToast` (Design-System v2, wie im
 * Modernen Musikplayer). Position unten mittig wie der bisherige Vanilla-Toast,
 * neueste unten.
 */
const store = useToastStore();
</script>

<style scoped>
.toast-host {
  position: fixed;
  left: 50%;
  bottom: var(--ds-space-5);
  transform: translateX(-50%);
  z-index: var(--ds-z-toast);
  width: min(92vw, 400px);
  pointer-events: none;
  font-family: var(--ds-font-sans);
}

.toast-host__list {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--ds-space-2);
}

.toast-host__list > * {
  pointer-events: auto;
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity var(--ds-duration-slow) var(--ds-ease),
    transform var(--ds-duration-slow) var(--ds-ease);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(var(--ds-space-3));
}

@media (prefers-reduced-motion: reduce) {
  .toast-enter-active,
  .toast-leave-active {
    transition: none;
  }
}
</style>
