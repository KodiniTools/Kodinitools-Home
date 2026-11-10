<template>
  <label class="md-field">
    <span class="md-flabel">{{ label }}</span>
    <span class="md-inline">
      <input
        type="number"
        class="md-num"
        :min="TEXT_LIMITS[field].min"
        :max="TEXT_LIMITS[field].max"
        :step="TEXT_LIMITS[field].step"
        :value="value"
        :data-md-num="field"
        @input="emit('set', field, clampText(field, ($event.target as HTMLInputElement).value))"
        @change="($event.target as HTMLInputElement).value = String(value)"
      />
      <ResetBtn :field="field" @reset="emit('reset', field)" />
    </span>
  </label>
</template>

<script setup lang="ts">
import ResetBtn from './ResetBtn.vue';
import { TEXT_LIMITS, clampText, type TextNumField } from './mediaData';

/**
 * Zahlenfeld eines Text-Overlay-Werts mit Begrenzung (wie die Vanilla-Bindings);
 * nach Verlassen zeigt es den gespeicherten (begrenzten) Wert.
 */
defineProps<{ value: number; field: TextNumField; label: string }>();
const emit = defineEmits<{ reset: [field: TextNumField]; set: [field: TextNumField, v: number] }>();
</script>

<style scoped>
.md-field {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
  margin-top: var(--ds-space-2);
}
.md-flabel {
  display: block;
  font-size: 0.8rem;
  color: var(--ds-text-2);
}
.md-inline {
  display: flex;
  align-items: center;
  gap: var(--ds-space-1);
}
.md-num {
  width: 100px;
}
</style>
