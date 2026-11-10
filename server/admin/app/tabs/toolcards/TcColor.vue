<template>
  <div class="tc-color" :data-tc-color="field">
    <UiSwitch
      v-if="toggle"
      :model-value="on"
      :label="label"
      data-tcon
      @update:model-value="emit('toggle', $event)"
    />
    <span v-else class="tc-flabel">{{ label }}</span>
    <div class="tc-color-row">
      <ColorField
        :model-value="value"
        :disabled="disabled"
        :label="label"
        @update:model-value="emit('update', $event)"
      />
      <button
        type="button"
        class="hd-reset"
        title="Auf Standard zurücksetzen"
        aria-label="Auf Standard zurücksetzen"
        data-tc-colorreset
        @click="emit('reset')"
      >
        ↺
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ColorField, UiSwitch } from '../../components/ui';

/**
 * Farbfeld einer Seitenleiste mit „↺“; mit `toggle` zusätzlich ein An-Schalter
 * (aus = Standardfarbe der Seite, wie `optColor` in `public/toolcards.js`).
 */
withDefaults(
  defineProps<{
    field: string;
    label: string;
    value: string;
    disabled?: boolean;
    toggle?: boolean;
    on?: boolean;
  }>(),
  { disabled: false, toggle: false, on: false },
);
const emit = defineEmits<{ update: [value: string]; reset: []; toggle: [on: boolean] }>();
</script>

<style scoped>
.tc-color {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
}
.tc-flabel {
  font-size: 0.8rem;
  color: var(--ds-text-2);
}
.tc-color-row {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
}
</style>
