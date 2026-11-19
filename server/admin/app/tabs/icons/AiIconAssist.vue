<template>
  <div class="ai-ic" data-ai-icon>
    <UiButton size="sm" data-aiic-toggle @click="ai.toggle">{{
      ai.open.value ? '✨ KI-Hilfe zuklappen' : '✨ KI: Icon für ein Tool finden'
    }}</UiButton>

    <template v-if="ai.open.value">
      <p class="hint ai-m0">
        Die KI nennt passende Suchbegriffe für ein Tool; ein Klick auf einen Begriff trägt ihn in
        die Suche ein. Es gehen nur Name und Beschreibung des Tools an die Anthropic-API (USA).
        Geändert wird nichts.
      </p>
      <UiCallout v-if="ai.loadError.value" type="danger">{{ ai.loadError.value }}</UiCallout>
      <UiCallout v-else-if="ai.config.value && !ai.config.value.configured" type="warning">
        Auf dem Server fehlt <code>ANTHROPIC_API_KEY</code>.
      </UiCallout>

      <template v-if="ai.config.value">
        <UiSelect v-model="tool" label="Tool" size="sm" :options="toolOptions" data-aiic-tool />
        <AiModelPicker
          v-model:model="ai.model.value"
          v-model:effort="ai.effort.value"
          :config="ai.config.value"
        />
        <UiButton
          variant="primary"
          size="sm"
          :disabled="ai.busy.value || !ai.config.value.configured || !tool"
          data-aiic-run
          @click="run"
        >
          {{ ai.busy.value ? 'Läuft …' : 'Suchbegriffe erzeugen' }}
        </UiButton>
        <p v-if="ai.error.value" class="ai-err" data-aiic-error>{{ ai.error.value }}</p>
      </template>

      <section v-if="terms.length" class="ai-terms" data-aiic-result>
        <button
          v-for="t in terms"
          :key="t"
          type="button"
          class="ai-chip"
          data-aiic-term
          @click="search(t)"
        >
          {{ t }} <span class="hint ai-m0">({{ hits(t) }})</span>
        </button>
        <p v-if="reasoning" class="hint ai-m0">{{ reasoning }}</p>
        <span class="hint ai-m0">Kosten (geschätzt): {{ formatUsd(ai.costUsd.value) }}</span>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { UiButton, UiCallout, UiSelect } from '../../components/ui';
import AiModelPicker from '../../components/AiModelPicker.vue';
import { useAiAssist } from '../../lib/useAiAssist';
import { formatUsd } from '../texts/aiClient';

/**
 * KI-Hilfe im Icons-Tab: Suchbegriffe für passende Icons zu einem Tool. Ein Klick
 * auf einen Begriff ruft `search` auf (füllt die Suche); `hits` zeigt die Treffer.
 */
const props = defineProps<{
  tools: { key: string; title: string }[];
  search: (term: string) => void;
  hits: (term: string) => number;
}>();

const ai = useAiAssist('icon', 'low');
const tool = ref('');
const toolOptions = computed(() => [
  { value: '', label: '– Tool wählen –' },
  ...props.tools.map((t) => ({ value: t.key, label: t.title })),
]);
const terms = computed(() => {
  const t = ai.data.value?.terms;
  return Array.isArray(t) ? t.map((x) => String(x).trim()).filter(Boolean) : [];
});
const reasoning = computed(() => String(ai.data.value?.reasoning ?? ''));

async function run() {
  const t = props.tools.find((x) => x.key === tool.value);
  if (!t) return;
  await ai.run({ title: t.title });
}
</script>

<style scoped>
.ai-ic {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--ds-space-2);
  margin: var(--ds-space-3) 0;
}
.ai-m0 {
  margin: 0;
}
.ai-err {
  margin: 0;
  color: var(--ds-danger, #c0392b);
}
.ai-terms {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ds-space-2);
}
.ai-chip {
  padding: var(--ds-space-1) var(--ds-space-3);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: 999px;
  background: var(--ds-surface-1);
  color: var(--ds-text);
  cursor: pointer;
}
.ai-chip:hover {
  border-color: var(--ds-accent);
}
</style>
