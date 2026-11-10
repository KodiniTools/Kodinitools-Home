<template>
  <Teleport :to="teleportTo">
    <Transition name="ui-dialog">
      <div v-if="open" class="ui-dialog__backdrop" @click.self="emit('close')">
        <div
          :id="dialogId"
          ref="panel"
          :class="['ui-dialog', `ui-dialog--${size}`]"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          :aria-describedby="description ? descriptionId : undefined"
          tabindex="-1"
          @keydown.esc.prevent="emit('close')"
        >
          <header class="ui-dialog__header">
            <h2 :id="titleId" class="ui-dialog__title">{{ title }}</h2>
            <UiIconButton :label="closeLabel" size="sm" @click="emit('close')">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </UiIconButton>
          </header>
          <p v-if="description" :id="descriptionId" class="ui-dialog__description">
            {{ description }}
          </p>
          <div v-if="$slots.default" class="ui-dialog__body">
            <slot />
          </div>
          <footer v-if="$slots.footer" class="ui-dialog__footer">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue';
import { useI18n } from '../../lib/i18n';
import UiIconButton from './UiIconButton.vue';

/**
 * Modaler Dialog. Schließt über Escape, Klick auf den Hintergrund und den
 * Schließen-Button, jeweils per `close`-Event; der Aufrufer steuert `open`.
 * Fokus wandert beim Öffnen in den Dialog und beim Schließen zurück.
 * `closeLabel` fällt auf i18n `common.close` zurück.
 */
const props = withDefaults(
  defineProps<{
    open: boolean;
    title: string;
    description?: string;
    closeLabel?: string;
    /** Eigene id, z. B. für aria-controls am auslösenden Button. */
    id?: string;
    /** md = 440 px für Bestätigungen, lg = 720 px für Übersichten. */
    size?: 'md' | 'lg';
    /** Teleport-Ziel, z. B. ein Portal-Element der App mit eigenem Stacking-Context. */
    teleportTo?: string;
  }>(),
  {
    description: undefined,
    closeLabel: undefined,
    id: undefined,
    size: 'md',
    teleportTo: 'body',
  },
);

const emit = defineEmits<{ close: [] }>();

const { t } = useI18n();
const closeLabel = computed(() => props.closeLabel ?? t('common.close'));

const generatedId = useId();
const dialogId = computed(() => props.id ?? `ui-dialog-${generatedId}`);
const titleId = computed(() => `${dialogId.value}-title`);
const descriptionId = computed(() => `${dialogId.value}-description`);

const panel = ref<HTMLElement | null>(null);
let previouslyFocused: HTMLElement | null = null;

watch(
  () => props.open,
  async (open) => {
    if (open) {
      previouslyFocused =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      await nextTick();
      panel.value?.focus();
    } else {
      previouslyFocused?.focus();
      previouslyFocused = null;
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  previouslyFocused = null;
});
</script>

<style scoped>
.ui-dialog__backdrop {
  position: fixed;
  inset: 0;
  z-index: var(--ds-z-backdrop);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--ds-space-4);
  background: rgba(0, 0, 0, 0.5);
}

.ui-dialog {
  width: min(440px, 100%);
  max-height: calc(100vh - 2 * var(--ds-space-4));
  max-height: calc(100dvh - 2 * var(--ds-space-4));
  overflow: auto;
  box-sizing: border-box;
  padding: var(--ds-space-5);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-surface-1);
  color: var(--ds-text);
  box-shadow: var(--ds-shadow-overlay);
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-3);
}

.ui-dialog--lg {
  width: min(720px, 100%);
}

.ui-dialog:focus {
  outline: none;
}

.ui-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-3);
}

.ui-dialog__title {
  margin: 0;
  font-size: var(--ds-text-lg);
  font-weight: var(--ds-weight-semibold);
  line-height: var(--ds-leading);
}

.ui-dialog__description {
  margin: 0;
  font-size: var(--ds-text-sm);
  line-height: var(--ds-leading);
  color: var(--ds-text-2);
}

.ui-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--ds-space-2);
  padding-top: var(--ds-space-2);
}

.ui-dialog-enter-active,
.ui-dialog-leave-active {
  transition: opacity var(--ds-duration-slow) var(--ds-ease);
}

.ui-dialog-enter-active .ui-dialog,
.ui-dialog-leave-active .ui-dialog {
  transition: transform var(--ds-duration-slow) var(--ds-ease);
}

.ui-dialog-enter-from,
.ui-dialog-leave-to {
  opacity: 0;
}

.ui-dialog-enter-from .ui-dialog,
.ui-dialog-leave-to .ui-dialog {
  transform: translateY(8px);
}
</style>
