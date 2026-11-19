<template>
  <div class="ai-card" data-ai-card>
    <UiButton size="sm" data-aicard-toggle @click="ai.toggle">{{
      ai.open.value ? '✨ KI-Hilfe zuklappen' : '✨ KI: Text verbessern'
    }}</UiButton>

    <template v-if="ai.open.value">
      <p class="hint ai-m0">
        Die KI schlägt Titel, Badge und Beschreibung vor. Nur diese Texte gehen an die Anthropic-API
        (USA). „Übernehmen“ schreibt in den <strong>Entwurf</strong> (Strg+Z macht es rückgängig,
        die Vorschau zeigt es, live erst mit „Veröffentlichen“).
      </p>
      <UiCallout v-if="ai.loadError.value" type="danger">{{ ai.loadError.value }}</UiCallout>
      <UiCallout v-else-if="ai.config.value && !ai.config.value.configured" type="warning">
        Auf dem Server fehlt <code>ANTHROPIC_API_KEY</code>.
      </UiCallout>

      <template v-if="ai.config.value">
        <UiTextArea
          v-model="facts"
          label="Was kann das Tool wirklich? (verbindlich, damit nichts erfunden wird)"
          :rows="3"
          placeholder="z. B. Läuft komplett im Browser, keine Uploads. Formate: MP3, WAV, FLAC."
          data-aicard-facts
        />
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
            data-aicard-run
            @click="run"
          >
            {{ ai.busy.value ? 'Läuft …' : 'Vorschlag erzeugen' }}
          </UiButton>
        </div>
        <p v-if="ai.error.value" class="ai-err" data-aicard-error>{{ ai.error.value }}</p>
      </template>

      <section v-if="suggestion" class="ai-sug" data-aicard-result>
        <div v-for="f in FIELDS" :key="f.key" class="ai-sug__row" :data-aicard-field="f.key">
          <strong>{{ f.label }}</strong>
          <span class="hint ai-m0">Jetzt: {{ current[f.key] || '–' }}</span>
          <span class="ai-sug__new">Vorschlag: {{ suggestion[f.key] || '–' }}</span>
          <UiButton
            size="sm"
            :disabled="suggestion[f.key] === current[f.key]"
            data-aicard-apply
            @click="apply(f.key)"
            >Übernehmen</UiButton
          >
        </div>
        <p v-if="suggestion.notes" class="hint ai-m0" data-aicard-notes>
          Hinweis der KI: {{ suggestion.notes }}
        </p>
        <div class="ai-row">
          <UiButton size="sm" variant="primary" data-aicard-applyall @click="applyAll"
            >Alle übernehmen</UiButton
          >
          <span class="hint ai-m0">Kosten (geschätzt): {{ formatUsd(ai.costUsd.value) }}</span>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { UiButton, UiCallout, UiTextArea } from '../../components/ui';
import AiModelPicker from '../../components/AiModelPicker.vue';
import { useAiAssist } from '../../lib/useAiAssist';
import { formatUsd } from '../texts/aiClient';

/**
 * KI-Hilfe für die Texte der gewählten Tool-Karte. Liest die aktuellen Texte,
 * schlägt neue vor und übergibt „Übernehmen“ an den Tab (`onApply`), der sie wie
 * eine Handeingabe in den Entwurf schreibt.
 */
type Key = 'title' | 'badge' | 'description';
const props = defineProps<{
  lang: 'de' | 'en';
  current: Record<Key, string>;
  onApply: (key: Key, value: string) => void;
}>();

const FIELDS: { key: Key; label: string }[] = [
  { key: 'title', label: 'Titel' },
  { key: 'badge', label: 'Badge' },
  { key: 'description', label: 'Beschreibung' },
];
const ai = useAiAssist('card');
const facts = ref('');
const suggestion = computed(() => {
  const d = ai.data.value;
  if (!d) return null;
  return {
    title: String(d.title ?? ''),
    badge: String(d.badge ?? ''),
    description: String(d.description ?? ''),
    notes: String(d.notes ?? ''),
  };
});

async function run() {
  await ai.run({
    lang: props.lang,
    title: props.current.title,
    badge: props.current.badge,
    description: props.current.description,
    facts: facts.value.trim(),
  });
}
function apply(key: Key) {
  if (suggestion.value) props.onApply(key, suggestion.value[key]);
}
function applyAll() {
  for (const f of FIELDS) {
    if (suggestion.value && suggestion.value[f.key] !== props.current[f.key]) apply(f.key);
  }
}
</script>

<style scoped>
.ai-card {
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
  gap: var(--ds-space-3);
  width: 100%;
}
.ai-sug__row {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--ds-space-1);
  padding: var(--ds-space-2) var(--ds-space-3);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-md);
  overflow-wrap: anywhere;
}
.ai-sug__new {
  white-space: pre-wrap;
}
</style>
