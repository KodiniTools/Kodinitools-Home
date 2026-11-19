<template>
  <div class="ai-slot" data-ai-slot>
    <UiButton size="sm" data-aislot-toggle @click="ai.toggle">{{
      ai.open.value ? '✨ KI-Hilfe zuklappen' : '✨ KI: Abschnitts-Titel verbessern'
    }}</UiButton>

    <template v-if="ai.open.value">
      <p class="hint ai-m0">
        Die KI schlägt neue Titel für die Abschnitte vor. Nur diese Titel (und dein Hinweis) gehen
        an die Anthropic-API (USA). „Übernehmen“ schreibt in den <strong>Entwurf</strong> (Strg+Z
        macht es rückgängig, die Vorschau zeigt es, live erst mit „Veröffentlichen“).
      </p>
      <UiCallout v-if="ai.loadError.value" type="danger">{{ ai.loadError.value }}</UiCallout>
      <UiCallout v-else-if="ai.config.value && !ai.config.value.configured" type="warning">
        Auf dem Server fehlt <code>ANTHROPIC_API_KEY</code>.
      </UiCallout>

      <template v-if="ai.config.value">
        <UiTextArea
          v-model="hints"
          label="Hinweis (optional, z. B. „kürzer“, „einheitlich mit Verb“)"
          :rows="2"
          data-aislot-hints
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
            data-aislot-run
            @click="run"
          >
            {{ ai.busy.value ? 'Läuft …' : 'Vorschläge erzeugen' }}
          </UiButton>
        </div>
        <p v-if="ai.error.value" class="ai-err" data-aislot-error>{{ ai.error.value }}</p>
      </template>

      <section v-if="rows.length" class="ai-sug" data-aislot-result>
        <div v-for="r in rows" :key="r.key" class="ai-sug__row" :data-aislot-row="r.key">
          <strong>{{ r.label }}</strong>
          <span class="hint ai-m0">Jetzt: {{ r.current || '–' }}</span>
          <span class="ai-sug__new">Vorschlag: {{ r.text }}</span>
          <UiButton
            size="sm"
            :disabled="r.text === r.current"
            data-aislot-apply
            @click="onApply(r.key, r.text)"
            >Übernehmen</UiButton
          >
        </div>
        <p v-if="notes" class="hint ai-m0" data-aislot-notes>Hinweis der KI: {{ notes }}</p>
        <div class="ai-row">
          <UiButton
            v-if="changed.length > 1"
            size="sm"
            variant="primary"
            data-aislot-applyall
            @click="applyAll"
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
import { formatUsd } from './aiClient';

/**
 * KI-Hilfe für die Abschnitts-Titel im Tab „Texte“. Schlägt je Slot einen Titel vor;
 * „Übernehmen“ geht an den Tab (`onApply`), der wie bei einer Handeingabe in den
 * Entwurf schreibt. Vorschläge werden geprüft (nur bekannte Slots, kurz, ohne HTML).
 */
const MAX_LEN = 60;
const props = defineProps<{
  lang: 'de' | 'en';
  /** Slots mit aktuell wirksamem Titel (Override oder Standard). */
  slots: { key: string; label: string; current: string }[];
  onApply: (key: string, value: string) => void;
}>();

const ai = useAiAssist('slottext', 'low');
const hints = ref('');
const notes = computed(() => String(ai.data.value?.notes ?? ''));

/** Geprüfte Vorschläge: nur bekannte Slots, höchstens einer je Slot. */
const rows = computed(() => {
  const items = ai.data.value?.items;
  if (!Array.isArray(items)) return [];
  const out: { key: string; label: string; current: string; text: string }[] = [];
  for (const it of items as Record<string, unknown>[]) {
    const slot = props.slots.find((s) => s.key === it?.key);
    const text = typeof it?.text === 'string' ? it.text.trim() : '';
    if (!slot || !text || text.length > MAX_LEN || /[<>]/.test(text)) continue;
    if (out.some((o) => o.key === slot.key)) continue;
    out.push({ key: slot.key, label: slot.label, current: slot.current, text });
  }
  return out;
});
const changed = computed(() => rows.value.filter((r) => r.text !== r.current));

async function run() {
  await ai.run({
    lang: props.lang,
    slots: JSON.stringify(props.slots),
    hints: hints.value.trim(),
  });
}
function applyAll() {
  for (const r of changed.value) props.onApply(r.key, r.text);
}
</script>

<style scoped>
.ai-slot {
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
