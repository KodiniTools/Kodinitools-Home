<template>
  <div class="control-group slider">
    <!-- Kompakt: Zeile 1 Label · Wert, Zeile 2 schlanke Spur + ↺ -->
    <label>{{ label }}</label>
    <span class="slider-control__value">{{ valueText }}</span>
    <SliderField
      :class="inputClass"
      :model-value="modelValue"
      :min="min"
      :max="max"
      :step="step"
      :default-value="defaultValue"
      :disabled="disabled"
      :aria-label="label"
      :show-number="false"
      @start="(v) => emit('start', v)"
      @update:model-value="(v) => emit('update:modelValue', v)"
      @change="(v) => emit('change', v)"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * SliderControl – kompakte Regler-Zeile in der Standard-Optik der App:
 * oben Label links und Wert (mit Einheit) rechts, darunter eine schlanke Spur
 * mit Akzent-Füllung und ↺ (nur sichtbar, wenn vom Standard abweichend).
 * Ohne Zahlenfeld; Feinsteuerung per Pfeiltasten (Bild auf/ab = größere Schritte).
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
