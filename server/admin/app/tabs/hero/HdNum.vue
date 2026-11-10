<template>
  <input
    type="number"
    :value="shown"
    :min="min"
    :max="max"
    :step="step"
    :placeholder="placeholder"
    :disabled="disabled"
    @input="onInput"
    @blur="draft = null"
  />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

/**
 * Zahlenfeld, das live schreibt, beim Tippen aber den eigenen Entwurf zeigt:
 * Der gespeicherte Wert wird begrenzt (z. B. Schriftgröße mind. 8 px) – ohne
 * Entwurf würde Vue das Feld schon beim ersten Ziffer-Tippen umschreiben.
 * Nach Verlassen zeigt es den gespeicherten Wert ('' = leer/Standard).
 */
const props = withDefaults(
  defineProps<{
    value: number | '';
    min?: number;
    max?: number;
    step?: number;
    placeholder?: string;
    disabled?: boolean;
  }>(),
  { min: undefined, max: undefined, step: 1, placeholder: '', disabled: false },
);
const emit = defineEmits<{ input: [raw: string] }>();

const draft = ref<string | null>(null);
const shown = computed(() => draft.value ?? String(props.value));
function onInput(e: Event) {
  const v = (e.target as HTMLInputElement).value;
  draft.value = v;
  emit('input', v);
}
</script>
