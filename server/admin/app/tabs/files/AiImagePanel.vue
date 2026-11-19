<template>
  <div class="panel ai-img" data-ai-image>
    <UiButton size="sm" data-aiimg-toggle @click="toggle">{{
      open ? '🖼️ KI-Bilder zuklappen' : '🖼️ KI: Bild erzeugen (Gemini)'
    }}</UiButton>

    <template v-if="open">
      <p class="hint ai-m0">
        Erzeugt <strong>ein Bild je Klick</strong> mit Google Gemini (kostet pro Bild, Preis siehe
        unten). Der Prompt geht an die Google-API (USA), keine Besucherdaten. Jedes Bild trägt ein
        unsichtbares SynthID-Wasserzeichen von Google. Das Ergebnis lässt sich als Original
        herunterladen und über „Zum Entwurf hinzufügen“ in den Zwischenspeicher legen (Strg+Z,
        Vorschau, Veröffentlichen wie bei jeder Datei).
      </p>
      <UiCallout v-if="loadError" type="danger">{{ loadError }}</UiCallout>
      <UiCallout v-else-if="config && !config.configured" type="warning">
        Auf dem Server fehlt <code>GEMINI_API_KEY</code>.
      </UiCallout>

      <template v-if="config">
        <UiTextArea
          v-model="prompt"
          label="Beschreibung des Bildes (Prompt)"
          :rows="3"
          placeholder="z. B. Abstrakter dunkelblauer Hintergrund mit sanften Lichtverläufen, ohne Text"
          data-aiimg-prompt
        />
        <div class="ai-row" data-aiimg-assist>
          <UiSelect
            v-model="purpose"
            label="Verwendung"
            size="sm"
            :options="PURPOSES"
            data-aiimg-purpose
          />
          <UiButton
            size="sm"
            :disabled="ai.busy.value || !prompt.trim() || !ai.config.value?.configured"
            data-aiimg-improve
            @click="improve"
          >
            {{ ai.busy.value ? 'Claude schreibt …' : '✨ Prompt mit Claude verbessern' }}
          </UiButton>
          <UiButton v-if="previous !== null" size="sm" data-aiimg-undo @click="undo"
            >↺ Vorherigen Prompt wiederherstellen</UiButton
          >
        </div>
        <details v-if="ai.config.value" class="ai-m0">
          <summary class="hint">Claude-Modell für die Prompt-Hilfe</summary>
          <AiModelPicker
            v-model:model="ai.model.value"
            v-model:effort="ai.effort.value"
            :config="ai.config.value"
          />
        </details>
        <p v-if="ai.loadError.value" class="ai-err">{{ ai.loadError.value }}</p>
        <p v-if="ai.error.value" class="ai-err" data-aiimg-aierror>{{ ai.error.value }}</p>
        <p v-if="notes" class="hint ai-m0" data-aiimg-notes>
          {{ notes }} (Kosten Prompt-Hilfe, geschätzt: {{ formatUsd(ai.costUsd.value) }})
        </p>
        <div class="ai-row">
          <UiSelect
            v-model="model"
            label="Modell"
            size="sm"
            :options="modelOptions"
            data-aiimg-model
          />
          <UiSelect
            v-model="aspect"
            label="Format"
            size="sm"
            :options="aspectOptions"
            data-aiimg-aspect
          />
          <UiSelect v-model="size" label="Größe" size="sm" :options="sizeOptions" data-aiimg-size />
        </div>
        <p class="hint ai-m0" data-aiimg-price>{{ priceText }}</p>
        <UiButton
          variant="primary"
          size="sm"
          :disabled="busy || !config.configured || !prompt.trim()"
          data-aiimg-run
          @click="run"
        >
          {{ busy ? 'Erzeuge … (bis 2 Min.)' : 'Bild erzeugen' }}
        </UiButton>
        <p v-if="error" class="ai-err" data-aiimg-error>{{ error }}</p>
      </template>

      <section v-if="image" class="ai-res" data-aiimg-result>
        <img :src="previewSrc" alt="KI-Vorschau" class="ai-prev" />
        <div class="ai-row">
          <a
            :href="previewSrc"
            :download="fileName"
            class="ui-button ui-button--secondary ui-button--sm"
            data-aiimg-download
            >⬇ Original herunterladen</a
          >
          <UiButton size="sm" data-aiimg-use @click="use">Zum Entwurf hinzufügen</UiButton>
        </div>
        <span class="hint ai-m0"
          >{{ image.mime }}, {{ Math.round(image.bytes / 1024) }} KB – ein neuer Klick auf „Bild
          erzeugen“ ersetzt diese Vorschau, lade sie vorher herunter, falls du sie behalten
          willst.</span
        >
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { UiButton, UiCallout, UiSelect, UiTextArea } from '../../components/ui';
import AiModelPicker from '../../components/AiModelPicker.vue';
import { useAiAssist } from '../../lib/useAiAssist';
import { formatUsd } from '../texts/aiClient';
import {
  fetchGeminiConfig,
  generateGeminiImage,
  imageToFile,
  type GeminiConfig,
  type GeminiImage,
} from './geminiClient';

/**
 * KI-Bilder (Gemini) im Tab „Dateien“. Erzeugt nie automatisch: ein Klick = ein Bild.
 * „Zum Entwurf hinzufügen“ gibt die Originaldatei an den Zwischenspeicher (`add`).
 */
const props = defineProps<{ add: (files: File[]) => void | Promise<void> }>();

const open = ref(false);
const config = ref<GeminiConfig | null>(null);
const loadError = ref('');
const error = ref('');
const busy = ref(false);
const prompt = ref('');
const model = ref('');
const aspect = ref('16:9');
const size = ref('1K');
const image = ref<GeminiImage | null>(null);
const fileName = ref('ki-bild.png');

const currentModel = computed(() => config.value?.models.find((m) => m.id === model.value));
const modelOptions = computed(() =>
  (config.value?.models ?? []).map((m) => ({ value: m.id, label: `${m.label} – ${m.hint}` })),
);
const aspectOptions = computed(() =>
  (config.value?.aspectRatios ?? []).map((a) => ({ value: a, label: a })),
);
const sizeOptions = computed(() =>
  (currentModel.value?.sizes ?? ['1K']).map((s) => ({ value: s, label: s })),
);
const priceText = computed(() => {
  const usd = currentModel.value?.usd?.[size.value];
  return usd === undefined
    ? 'Preis für dieses Modell/diese Größe: nicht in der Anwendung hinterlegt, bitte auf der Google-Preisseite (ai.google.dev/gemini-api/docs/pricing) prüfen.'
    : `Preis pro Bild laut Google: ${formatUsd(usd)}.`;
});
const previewSrc = computed(() =>
  image.value ? `data:${image.value.mime};base64,${image.value.data}` : '',
);

// Prompt-Hilfe (Anthropic): schreibt die grobe Idee in einen Gemini-Prompt um.
const ai = useAiAssist('imageprompt', 'low');
const PURPOSES = [
  { value: '', label: 'Allgemein' },
  { value: 'Hero-Banner oben auf der Startseite', label: 'Hero-Banner' },
  { value: 'Seiten-Hintergrund', label: 'Hintergrund' },
  { value: 'Bild für eine Tool-Karte', label: 'Tool-Karte' },
];
const purpose = ref('');
const previous = ref<string | null>(null);
const notes = ref('');

async function improve() {
  const idea = prompt.value.trim();
  if (!idea) return;
  const r = await ai.run({ idea, purpose: purpose.value, aspectRatio: aspect.value });
  const text = typeof r?.data?.prompt === 'string' ? r.data.prompt.trim() : '';
  if (!text) return;
  previous.value = prompt.value;
  prompt.value = text;
  notes.value = String(r?.data?.notes ?? '');
}
function undo() {
  if (previous.value === null) return;
  prompt.value = previous.value;
  previous.value = null;
  notes.value = '';
}

async function toggle() {
  open.value = !open.value;
  if (open.value && !ai.config.value) void ai.toggle();
  if (!open.value || config.value) return;
  const r = await fetchGeminiConfig();
  if (!r.ok) {
    loadError.value = r.error;
    return;
  }
  config.value = r.data;
  model.value = r.data.defaultModel;
}

// Größe zurücksetzen, wenn das Modell sie nicht kennt (z. B. Lite = nur 1K).
function fixSize() {
  const sizes = currentModel.value?.sizes ?? ['1K'];
  if (!sizes.includes(size.value)) size.value = sizes[0] ?? '1K';
}

watch(model, fixSize);

async function run() {
  fixSize();
  error.value = '';
  busy.value = true;
  try {
    const r = await generateGeminiImage({
      prompt: prompt.value.trim(),
      model: model.value,
      aspectRatio: aspect.value,
      size: size.value,
    });
    if (!r.ok) {
      error.value = r.error;
      return;
    }
    image.value = r.data;
    fileName.value = imageToFile(r.data).name;
  } finally {
    busy.value = false;
  }
}

async function use() {
  if (image.value) await props.add([imageToFile(image.value)]);
}
</script>

<style scoped>
.ai-img {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--ds-space-2);
}
.ai-m0 {
  margin: 0;
}
.ai-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--ds-space-2);
}
.ai-err {
  margin: 0;
  color: var(--ds-danger, #c0392b);
}
.ai-res {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
  max-width: 100%;
}
.ai-prev {
  max-width: min(100%, 520px);
  height: auto;
  border-radius: 8px;
  border: 1px solid var(--ds-border);
}
</style>
