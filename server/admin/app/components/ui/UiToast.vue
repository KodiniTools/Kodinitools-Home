<template>
  <div
    :class="['ui-toast', `ui-toast--${type}`, { 'ui-toast--dismissable': dismissOnClick }]"
    :role="type === 'error' ? 'alert' : 'status'"
    @click="onRootClick"
  >
    <span class="ui-toast__icon" aria-hidden="true">
      <svg
        v-if="type === 'success'"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
      <svg
        v-else-if="type === 'error'"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
      <svg
        v-else-if="type === 'warning'"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path
          d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <svg
        v-else
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    </span>
    <span class="ui-toast__message">{{ message }}</span>
    <UiButton v-if="actionLabel" size="sm" variant="secondary" @click="emit('action')">
      {{ actionLabel }}
    </UiButton>
    <UiIconButton :label="dismissLabel" size="sm" @click="emit('dismiss')">
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
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from '../../lib/i18n';
import UiButton from './UiButton.vue';
import UiIconButton from './UiIconButton.vue';

/**
 * Eine Benachrichtigung: Statusfarbe als Linie und Icon, flache Fläche,
 * optionale Aktion. Fehler sind role=alert, alles andere role=status.
 * `dismissOnClick` schließt zusätzlich bei Klick auf die Fläche; der
 * Schließen-Button bleibt der Weg für Tastatur und Screenreader.
 * Typ `warning` wie im Visualizer; `dismissLabel` fällt auf i18n `common.close` zurück.
 */
const props = withDefaults(
  defineProps<{
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    actionLabel?: string;
    dismissLabel?: string;
    dismissOnClick?: boolean;
  }>(),
  { type: 'info', actionLabel: undefined, dismissLabel: undefined, dismissOnClick: false },
);

const emit = defineEmits<{ action: []; dismiss: [] }>();

const { t } = useI18n();
const dismissLabel = computed(() => props.dismissLabel ?? t('common.close'));

function onRootClick(event: MouseEvent) {
  if (!props.dismissOnClick) return;
  if (event.target instanceof Element && event.target.closest('button')) return;
  emit('dismiss');
}
</script>

<style scoped>
.ui-toast {
  display: flex;
  align-items: center;
  gap: var(--ds-space-3);
  max-width: 400px;
  padding: var(--ds-space-3) var(--ds-space-3) var(--ds-space-3) var(--ds-space-4);
  border: var(--ds-border-width) solid var(--ds-border);
  border-left: 3px solid var(--ds-info);
  border-radius: var(--ds-radius-md);
  background: var(--ds-surface-1);
  color: var(--ds-text);
  box-shadow: var(--ds-shadow-overlay);
}

.ui-toast--dismissable {
  cursor: pointer;
}

.ui-toast__icon {
  display: inline-flex;
  width: var(--ds-icon-sm);
  height: var(--ds-icon-sm);
  flex-shrink: 0;
  color: var(--ds-info);
}

.ui-toast__icon svg {
  width: 100%;
  height: 100%;
}

.ui-toast__message {
  flex: 1;
  min-width: 0;
  font-size: var(--ds-text-sm);
  line-height: var(--ds-leading);
}

.ui-toast--success {
  border-left-color: var(--ds-success);
}

.ui-toast--success .ui-toast__icon {
  color: var(--ds-success);
}

.ui-toast--error {
  border-left-color: var(--ds-danger);
}

.ui-toast--error .ui-toast__icon {
  color: var(--ds-danger);
}
.ui-toast--warning {
  border-left-color: var(--ds-warning);
}

.ui-toast--warning .ui-toast__icon {
  color: var(--ds-warning);
}
</style>
