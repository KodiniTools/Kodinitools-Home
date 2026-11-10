<template>
  <div :class="['ui-select', `ui-select--${size}`, { 'ui-select--inline': inline }]">
    <label
      :for="selectId"
      :class="['ui-select__label', { 'ui-select__label--hidden': labelHidden }]"
    >
      {{ label }}
    </label>
    <span class="ui-select__control">
      <select
        :id="selectId"
        v-model="model"
        class="ui-select__native"
        :disabled="disabled"
        v-bind="$attrs"
      >
        <template
          v-for="(entry, index) in options"
          :key="isGroup(entry) ? `g${index}` : entry.value"
        >
          <optgroup v-if="isGroup(entry)" :label="entry.label">
            <option
              v-for="option in entry.options"
              :key="option.value"
              :value="option.value"
              :disabled="option.disabled"
              :style="option.style"
            >
              {{ option.label }}
            </option>
          </optgroup>
          <option v-else :value="entry.value" :disabled="entry.disabled" :style="entry.style">
            {{ entry.label }}
          </option>
        </template>
      </select>
      <svg
        class="ui-select__chevron"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed, useId, type StyleValue } from 'vue';

/**
 * Natives <select> im Look des Systems. Das Label ist Pflicht; `labelHidden`
 * versteckt es visuell, `inline` stellt es links neben das Feld.
 * Ein Eintrag mit `options` wird zur <optgroup>. Werte dürfen Zahlen sein;
 * v-model liefert dann die Zahl zurück (wie beim nativen select).
 */
defineOptions({ inheritAttrs: false });

export interface UiSelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  style?: StyleValue;
}
export interface UiSelectGroup {
  label: string;
  options: UiSelectOption[];
}
export type UiSelectEntry = UiSelectOption | UiSelectGroup;

const props = withDefaults(
  defineProps<{
    options: UiSelectEntry[];
    label: string;
    id?: string;
    size?: 'sm' | 'md';
    inline?: boolean;
    labelHidden?: boolean;
    disabled?: boolean;
  }>(),
  { id: undefined, size: 'md', inline: false, labelHidden: false, disabled: false },
);

const model = defineModel<string | number>({ required: true });

/** Gruppe = Eintrag mit eigener Optionsliste (wird zu <optgroup>) */
const isGroup = (entry: UiSelectEntry): entry is UiSelectGroup =>
  Array.isArray((entry as UiSelectGroup | undefined)?.options);

const generatedId = useId();
const selectId = computed(() => props.id ?? `ui-select-${generatedId}`);
</script>

<style scoped>
.ui-select {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
}

.ui-select--inline {
  flex-direction: row;
  align-items: center;
  gap: var(--ds-space-2);
}

.ui-select__label {
  font-size: var(--ds-text-sm);
  font-weight: var(--ds-weight-medium);
  color: var(--ds-text-2);
  white-space: nowrap;
}

.ui-select__label--hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}

.ui-select__control {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.ui-select__native {
  appearance: none;
  height: var(--ds-control-md);
  width: 100%;
  padding: 0 calc(var(--ds-space-6) + var(--ds-space-2)) 0 var(--ds-space-3);
  border: var(--ds-border-width) solid var(--ds-border-strong);
  border-radius: var(--ds-radius-md);
  background: var(--ds-surface-2);
  color: var(--ds-text);
  font: inherit;
  font-size: var(--ds-text-md);
  font-weight: var(--ds-weight-medium);
  cursor: pointer;
  transition:
    border-color var(--ds-duration) var(--ds-ease),
    box-shadow var(--ds-duration) var(--ds-ease);
}

.ui-select__native:focus-visible {
  outline: none;
  border-color: var(--ds-accent);
  box-shadow: var(--ds-focus-ring);
}

.ui-select__native:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.ui-select__chevron {
  position: absolute;
  right: var(--ds-space-3);
  width: var(--ds-icon-sm);
  height: var(--ds-icon-sm);
  color: var(--ds-text-3);
  pointer-events: none;
}

.ui-select--sm .ui-select__native {
  height: var(--ds-control-sm);
  padding-left: var(--ds-space-2);
  border-radius: var(--ds-radius-sm);
  font-size: var(--ds-text-sm);
}
</style>
