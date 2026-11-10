<template>
  <button
    type="button"
    class="hd-reset"
    :disabled="disabled"
    title="Auf Standard zurücksetzen"
    aria-label="Auf Standard zurücksetzen"
    :data-md-textreset="field"
    @click="emit('reset', field)"
  >
    ↺
  </button>
</template>

<script setup lang="ts">
/** Kleiner ↺-Knopf eines Text-Felds; meldet den Feldnamen. */
withDefaults(defineProps<{ field: string; disabled?: boolean }>(), { disabled: false });
const emit = defineEmits<{ reset: [field: string] }>();
</script>
