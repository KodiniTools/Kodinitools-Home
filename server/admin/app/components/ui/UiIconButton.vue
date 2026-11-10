<template>
  <button
    :type="type"
    :class="[
      'ui-icon-button',
      `ui-icon-button--${variant}`,
      `ui-icon-button--${size}`,
      { 'ui-icon-button--round': round, 'ui-icon-button--pressed': pressed === true },
    ]"
    :aria-label="label"
    :title="label"
    :aria-pressed="pressed === undefined ? undefined : pressed"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
/**
 * Quadratischer Button nur mit Icon. `label` ist Pflicht und wird zu aria-label
 * und title. `pressed` macht ihn zum Umschalter mit aria-pressed.
 */
withDefaults(
  defineProps<{
    label: string;
    variant?: 'ghost' | 'secondary' | 'primary';
    size?: 'sm' | 'md';
    round?: boolean;
    /** undefined = kein Umschalter (kein aria-pressed) */
    pressed?: boolean;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
  }>(),
  {
    variant: 'ghost',
    size: 'md',
    round: false,
    pressed: undefined,
    disabled: false,
    type: 'button',
  },
);
</script>

<style scoped>
.ui-icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--ds-control-md);
  height: var(--ds-control-md);
  padding: 0;
  border: var(--ds-border-width) solid transparent;
  border-radius: var(--ds-radius-md);
  background: transparent;
  color: var(--ds-text-2);
  cursor: pointer;
  flex-shrink: 0;
  transition:
    background-color var(--ds-duration) var(--ds-ease),
    border-color var(--ds-duration) var(--ds-ease),
    color var(--ds-duration) var(--ds-ease);
}

.ui-icon-button :deep(svg) {
  width: var(--ds-icon-md);
  height: var(--ds-icon-md);
}

.ui-icon-button:focus-visible {
  outline: none;
  box-shadow: var(--ds-focus-ring);
}

.ui-icon-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.ui-icon-button--ghost:hover:not(:disabled) {
  background: var(--ds-surface-2);
  color: var(--ds-text);
}

.ui-icon-button--secondary {
  background: var(--ds-surface-2);
  border-color: var(--ds-border-strong);
  color: var(--ds-text);
}

.ui-icon-button--secondary:hover:not(:disabled) {
  background: var(--ds-surface-3);
}

.ui-icon-button--primary {
  background: var(--ds-accent);
  color: var(--ds-on-accent);
}

.ui-icon-button--primary:hover:not(:disabled) {
  background: var(--ds-accent-hover);
}

.ui-icon-button--sm {
  width: var(--ds-control-sm);
  height: var(--ds-control-sm);
  border-radius: var(--ds-radius-sm);
}

.ui-icon-button--sm :deep(svg) {
  width: var(--ds-icon-sm);
  height: var(--ds-icon-sm);
}

.ui-icon-button--round {
  border-radius: var(--ds-radius-full);
}

.ui-icon-button--pressed {
  border-color: var(--ds-accent);
  color: var(--ds-accent);
}

/* Gedrückt auf Primärfläche: Symbol bleibt lesbar */
.ui-icon-button--primary.ui-icon-button--pressed {
  color: var(--ds-on-accent);
}
</style>
