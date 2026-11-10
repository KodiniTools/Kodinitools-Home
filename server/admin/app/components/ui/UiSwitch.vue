<template>
  <span :class="['ui-switch', { 'ui-switch--disabled': disabled }]">
    <button
      :id="switchId"
      type="button"
      role="switch"
      :class="['ui-switch__track', { 'ui-switch__track--on': model }]"
      :aria-checked="model ? 'true' : 'false'"
      :aria-label="labelHidden ? label : undefined"
      :title="labelHidden ? label : undefined"
      :disabled="disabled"
      @click="model = !model"
    >
      <span class="ui-switch__knob" aria-hidden="true"></span>
    </button>
    <label v-if="!labelHidden" :for="switchId" class="ui-switch__label">{{ label }}</label>
  </span>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue';

/**
 * Schiebeschalter (An/Aus) nach dem Switch-Muster, 32 × 18 px wie im
 * Bildkonverter. „An“ zeigt die Primärfarbe. `label` ist Pflicht: sichtbar
 * rechts daneben oder mit `labelHidden` nur als aria-label/title.
 */
const props = withDefaults(
  defineProps<{
    label: string;
    id?: string;
    labelHidden?: boolean;
    disabled?: boolean;
  }>(),
  { id: undefined, labelHidden: false, disabled: false },
);

const model = defineModel<boolean>({ default: false });

const generatedId = useId();
const switchId = computed(() => props.id ?? `ui-switch-${generatedId}`);
</script>

<style scoped>
.ui-switch {
  display: inline-flex;
  align-items: center;
  gap: var(--ds-space-2);
}

.ui-switch__track {
  position: relative;
  flex-shrink: 0;
  width: 32px;
  height: 18px;
  padding: 0;
  border: none;
  border-radius: var(--ds-radius-full);
  background: var(--ds-border-strong);
  cursor: pointer;
  transition: background-color var(--ds-duration) var(--ds-ease);
}

.ui-switch__track--on {
  background: var(--ds-accent);
}

.ui-switch__track:hover:not(:disabled):not(.ui-switch__track--on) {
  background: var(--ds-text-3);
}

.ui-switch__track--on:hover:not(:disabled) {
  background: var(--ds-accent-hover);
}

.ui-switch__track:focus-visible {
  outline: none;
  box-shadow: var(--ds-focus-ring);
}

.ui-switch__track:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.ui-switch__knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  border-radius: var(--ds-radius-full);
  background: #ffffff;
  transition: transform var(--ds-duration) var(--ds-ease);
  pointer-events: none;
}

.ui-switch__track--on .ui-switch__knob {
  transform: translateX(14px);
}

.ui-switch__label {
  font-size: var(--ds-text-sm);
  color: var(--ds-text);
  cursor: pointer;
}

.ui-switch--disabled .ui-switch__label {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
