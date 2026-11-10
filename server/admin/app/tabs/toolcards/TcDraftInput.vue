<template>
  <textarea
    v-if="multiline"
    :id="id"
    :value="shown"
    :rows="rows"
    :placeholder="placeholder"
    :class="{ 'tc-invalid': invalid }"
    :style="{ minHeight: rows === 2 ? '48px' : '64px' }"
    @input="onInput"
    @change="emit('commit', ($event.target as HTMLTextAreaElement).value)"
    @blur="draft = null"
  ></textarea>
  <input
    v-else
    :id="id"
    type="text"
    :value="shown"
    :placeholder="placeholder"
    :class="{ 'tc-invalid': invalid }"
    @input="onInput"
    @change="emit('commit', ($event.target as HTMLInputElement).value)"
    @blur="draft = null"
  />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

/**
 * Textfeld, das live schreibt, beim Tippen aber den eigenen Entwurf zeigt:
 * Der gespeicherte Wert wird normalisiert (getrimmt, max. 2 Titelzeilen …) –
 * ohne Entwurf würde Vue das Feld sofort auf den normalisierten Wert
 * zurücksetzen (Leerzeichen/Enter verschwinden beim Tippen).
 */
const props = withDefaults(
  defineProps<{
    id: string;
    value: string;
    multiline?: boolean;
    rows?: number;
    placeholder?: string;
    invalid?: boolean;
  }>(),
  { multiline: false, rows: 3, placeholder: '', invalid: false },
);
const emit = defineEmits<{ input: [value: string]; commit: [value: string] }>();

const draft = ref<string | null>(null);
const shown = computed(() => draft.value ?? props.value);
function onInput(e: Event) {
  const v = (e.target as HTMLInputElement | HTMLTextAreaElement).value;
  draft.value = v;
  emit('input', v);
}
</script>

<style scoped>
.tc-invalid {
  border-color: #ef4444 !important;
}
</style>
