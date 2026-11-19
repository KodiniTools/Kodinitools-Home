<template>
  <div class="ai-tk" data-ai-ticker>
    <UiButton size="sm" data-aitk-toggle @click="ai.toggle">{{
      ai.open.value ? '✨ KI-Hilfe zuklappen' : '✨ KI: Meldungen vorschlagen'
    }}</UiButton>

    <template v-if="ai.open.value">
      <p class="hint ai-m0">
        Die KI formuliert Meldungen in {{ lang === 'de' ? 'Deutsch' : 'English' }}. Sie erfindet
        nichts: trage unten ein, worum es gehen soll. Die bisherigen Meldungen und deine Hinweise
        gehen an die Anthropic-API (USA). „Hinzufügen“ legt einen neuen Eintrag im
        <strong>Entwurf</strong>
        an (Strg+Z macht es rückgängig, live erst mit „Veröffentlichen“).
      </p>
      <UiCallout v-if="ai.loadError.value" type="danger">{{ ai.loadError.value }}</UiCallout>
      <UiCallout v-else-if="ai.config.value && !ai.config.value.configured" type="warning">
        Auf dem Server fehlt <code>ANTHROPIC_API_KEY</code>.
      </UiCallout>

      <template v-if="ai.config.value">
        <UiTextArea
          v-model="hints"
          label="Worum soll es gehen? (Hinweise)"
          :rows="3"
          placeholder="z. B. Neues Tool: Audio-Normalizer, läuft im Browser. Kostenlos."
          data-aitk-hints
        />
        <UiSelect v-model="count" label="Anzahl Vorschläge" size="sm" :options="COUNT_OPTIONS" />
        <AiModelPicker
          v-model:model="ai.model.value"
          v-model:effort="ai.effort.value"
          :config="ai.config.value"
        />
        <div class="ai-row">
          <UiButton
            variant="primary"
            size="sm"
            :disabled="ai.busy.value || !ai.config.value.configured"
            data-aitk-run
            @click="run"
          >
            {{ ai.busy.value ? 'Läuft …' : 'Vorschläge erzeugen' }}
          </UiButton>
        </div>
        <p v-if="ai.error.value" class="ai-err" data-aitk-error>{{ ai.error.value }}</p>
      </template>

      <section v-if="suggestions.length" class="ai-sug" data-aitk-result>
        <div v-for="(t, i) in suggestions" :key="i" class="ai-sug__row" data-aitk-item>
          <span class="ai-sug__new">{{ t }}</span>
          <UiButton size="sm" data-aitk-add @click="add(t)">Hinzufügen</UiButton>
        </div>
        <p v-if="notes" class="hint ai-m0" data-aitk-notes>Hinweis der KI: {{ notes }}</p>
        <div class="ai-row">
          <UiButton
            v-if="suggestions.length > 1"
            size="sm"
            variant="primary"
            data-aitk-addall
            @click="addAll"
            >Alle hinzufügen</UiButton
          >
          <span class="hint ai-m0">Kosten (geschätzt): {{ formatUsd(ai.costUsd.value) }}</span>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { UiButton, UiCallout, UiSelect, UiTextArea } from '../../components/ui';
import AiModelPicker from '../../components/AiModelPicker.vue';
import { useAiAssist } from '../../lib/useAiAssist';
import { formatUsd } from '../texts/aiClient';

/**
 * KI-Hilfe für das Laufband: schlägt Meldungen vor. „Hinzufügen“ übergibt den
 * Text an den Tab (`add`), der einen neuen Eintrag im Entwurf anlegt.
 */
const props = defineProps<{
  lang: 'de' | 'en';
  /** Texte der bisherigen Einträge. */
  current: string[];
  onAdd: (text: string) => void;
}>();

const COUNT_OPTIONS = [1, 3, 5, 8].map((n) => ({ value: String(n), label: String(n) }));
const ai = useAiAssist('ticker', 'low');
const hints = ref('');
const count = ref('3');
const suggestions = computed(() => {
  const items = ai.data.value?.items;
  return Array.isArray(items) ? items.map((x) => String(x)).filter((x) => x.trim() !== '') : [];
});
const notes = computed(() => String(ai.data.value?.notes ?? ''));

async function run() {
  const current = props.current
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t, i) => `${i + 1}. ${t}`)
    .join('\n');
  if (!hints.value.trim() && !current) {
    ai.error.value = 'Bitte Hinweise eintragen oder zuerst einen Eintrag anlegen.';
    return;
  }
  await ai.run({
    lang: props.lang,
    count: count.value,
    hints: hints.value.trim(),
    current,
  });
}
function add(t: string) {
  props.onAdd(t);
}
function addAll() {
  for (const t of suggestions.value) props.onAdd(t);
}
</script>

<style scoped>
.ai-tk {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--ds-space-2);
  margin-top: var(--ds-space-3);
}
.ai-m0 {
  margin: 0;
}
.ai-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ds-space-3);
}
.ai-err {
  margin: 0;
  color: var(--ds-danger, #c0392b);
}
.ai-sug {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
  width: 100%;
}
.ai-sug__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-3);
  padding: var(--ds-space-2) var(--ds-space-3);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-md);
}
.ai-sug__new {
  flex: 1 1 14rem;
  min-width: 0;
  overflow-wrap: anywhere;
}
</style>
