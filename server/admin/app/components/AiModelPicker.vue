<template>
  <div class="ai-pick">
    <UiSelect v-model="model" label="Modell" size="sm" :options="modelOptions" data-ai-pick-model />
    <UiSelect
      v-model="effort"
      label="Aufwand"
      size="sm"
      :options="EFFORT_OPTIONS"
      data-ai-pick-effort
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { UiSelect } from './ui';
import type { AiConfig, AiEffort } from '../tabs/texts/aiClient';

/** Modell- und Aufwand-Auswahl der kleinen KI-Hilfen (Optionen aus /api/ai/config). */
const props = defineProps<{ config: AiConfig }>();
const model = defineModel<string>('model', { required: true });
const effort = defineModel<AiEffort>('effort', { required: true });

const EFFORT_OPTIONS = [
  { value: 'low', label: 'Niedrig (schneller, günstiger)' },
  { value: 'medium', label: 'Mittel' },
  { value: 'high', label: 'Hoch' },
];
const modelOptions = computed(() =>
  props.config.models.map((m) => ({ value: m.id, label: `${m.label} – ${m.hint}` })),
);
</script>

<style scoped>
.ai-pick {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-3);
}
</style>
