<template>
  <div class="control-group slider">
    <!-- Einheitliche Slider-Zeile wie bei den Bild-Filtern (Helligkeit …) -->
    <label>{{ label }}</label>
    <SliderField
      :class="inputClass"
      :model-value="modelValue"
      :min="min"
      :max="max"
      :step="step"
      :default-value="defaultValue"
      :disabled="disabled"
      :aria-label="label"
      @start="(v) => emit('start', v)"
      @update:model-value="(v) => emit('update:modelValue', v)"
      @change="(v) => emit('change', v)"
    />
    <span class="slider-control__value">{{ valueText }}</span>
  </div>
</template>

<script setup lang="ts">
/**
 * SliderControl – eine Regler-Zeile in der Standard-Optik der App:
 * Label (klein, versal) · SliderField (Regler + Zahlen-Spinner + ↺) · Einheit.
 * Optik aus ./slider-control.css, damit alle Regler in Hell- und Dunkelmodus
 * identisch aussehen.
 *
 * `inputClass` landet auf dem Range-Input (z. B. für bestehende Selektoren).
 * Events wie SliderField: `update:modelValue` (live), `start`, `change`.
 */
import SliderField from './SliderField.vue';

withDefaults(
  defineProps<{
    label: string;
    modelValue?: number | string;
    min?: number | string;
    max?: number | string;
    step?: number | string;
    defaultValue?: number | string;
    disabled?: boolean;
    /** Anzeige rechts (Wert mit Einheit, z. B. "1.0s", "80 %") */
    valueText?: string;
    inputClass?: string | unknown[] | Record<string, unknown>;
  }>(),
  {
    modelValue: 0,
    min: 0,
    max: 100,
    step: 1,
    defaultValue: undefined,
    disabled: false,
    valueText: '',
    inputClass: '',
  },
);
const emit = defineEmits<{
  'update:modelValue': [value: number];
  start: [value: number];
  change: [value: number];
}>();
</script>

<style scoped src="./slider-control.css"></style>
