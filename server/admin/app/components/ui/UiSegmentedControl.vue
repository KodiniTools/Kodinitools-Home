<template>
  <div
    :class="['ui-segmented', `ui-segmented--${size}`, { 'ui-segmented--wrap': wrap }]"
    role="radiogroup"
    :aria-label="label"
  >
    <button
      v-for="(option, index) in options"
      :key="option.value"
      :ref="(el) => setButtonRef(el, index)"
      type="button"
      role="radio"
      class="ui-segmented__option"
      :class="{ 'ui-segmented__option--active': option.value === model }"
      :data-value="option.value"
      :aria-checked="option.value === model"
      :tabindex="index === activeIndex ? 0 : -1"
      :disabled="option.disabled"
      @click="select(index)"
      @keydown="onKeydown($event, index)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, type ComponentPublicInstance } from 'vue';

/**
 * Segmented Control nach dem Radiogroup-Muster: eine Option ist gewählt,
 * Pfeiltasten wechseln und wählen, Tab springt als Ganzes hinein und hinaus.
 */
export interface UiSegmentedOption {
  value: string;
  label: string;
  disabled?: boolean;
}

const props = withDefaults(
  defineProps<{
    options: UiSegmentedOption[];
    label: string;
    size?: 'sm' | 'md';
    /** Volle Breite; Optionen brechen bei Platzmangel in weitere Zeilen um (z. B. 3 + 3 + 1) */
    wrap?: boolean;
  }>(),
  { size: 'md', wrap: false },
);

const model = defineModel<string>({ required: true });

const buttons = ref<HTMLButtonElement[]>([]);

function setButtonRef(el: Element | ComponentPublicInstance | null, index: number) {
  if (el instanceof HTMLButtonElement) buttons.value[index] = el;
}

const activeIndex = computed(() => {
  const index = props.options.findIndex((option) => option.value === model.value);
  return index === -1 ? 0 : index;
});

function select(index: number) {
  const option = props.options[index];
  if (!option || option.disabled) return;
  model.value = option.value;
  buttons.value[index]?.focus();
}

function step(from: number, direction: number): number {
  const count = props.options.length;
  let index = from;
  for (let i = 0; i < count; i++) {
    index = (index + direction + count) % count;
    if (!props.options[index]?.disabled) return index;
  }
  return from;
}

function firstEnabled(): number {
  const index = props.options.findIndex((option) => !option.disabled);
  return index === -1 ? 0 : index;
}

function lastEnabled(): number {
  for (let index = props.options.length - 1; index >= 0; index--) {
    if (!props.options[index]?.disabled) return index;
  }
  return 0;
}

function onKeydown(event: KeyboardEvent, index: number) {
  const targets: Record<string, () => number> = {
    ArrowRight: () => step(index, 1),
    ArrowDown: () => step(index, 1),
    ArrowLeft: () => step(index, -1),
    ArrowUp: () => step(index, -1),
    Home: firstEnabled,
    End: lastEnabled,
  };
  const target = targets[event.key];
  if (!target) return;
  event.preventDefault();
  select(target());
}
</script>

<style scoped>
.ui-segmented {
  display: inline-flex;
  gap: 2px;
  padding: 2px;
  height: var(--ds-control-md);
  box-sizing: border-box;
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-md);
  background: var(--ds-surface-0);
}

.ui-segmented__option {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 var(--ds-space-3);
  border: var(--ds-border-width) solid transparent;
  border-radius: var(--ds-radius-sm);
  background: transparent;
  color: var(--ds-text-2);
  font: inherit;
  font-size: var(--ds-text-sm);
  font-weight: var(--ds-weight-medium);
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background-color var(--ds-duration) var(--ds-ease),
    border-color var(--ds-duration) var(--ds-ease),
    color var(--ds-duration) var(--ds-ease);
}

.ui-segmented__option:hover:not(:disabled) {
  color: var(--ds-text);
}

.ui-segmented__option:focus-visible {
  outline: none;
  box-shadow: var(--ds-focus-ring);
}

.ui-segmented__option:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.ui-segmented__option--active {
  background: var(--ds-surface-1);
  border-color: var(--ds-border-strong);
  color: var(--ds-text);
}

.ui-segmented--sm {
  height: var(--ds-control-sm);
  border-radius: var(--ds-radius-sm);
}

.ui-segmented--sm .ui-segmented__option {
  padding: 0 var(--ds-space-2);
  border-radius: calc(var(--ds-radius-sm) - 2px);
  font-size: var(--ds-text-xs);
}
.ui-segmented--wrap {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  height: auto;
  min-height: var(--ds-control-md);
}

.ui-segmented--wrap .ui-segmented__option {
  flex: 1 1 30%;
  min-width: 0;
  min-height: calc(var(--ds-control-md) - 6px);
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
