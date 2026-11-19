<template>
  <div class="ai-ds" data-ai-design>
    <UiButton size="sm" data-aids-toggle @click="ai.toggle">{{
      ai.open.value ? '✨ KI-Hilfe zuklappen' : '✨ KI: Design-Beratung'
    }}</UiButton>

    <template v-if="ai.open.value">
      <p class="hint ai-m0">
        Die KI bewertet die aktuellen Einstellungen dieses Bereichs und macht Vorschläge. Es gehen
        nur diese Einstellungen (Farben, Schriften, Layout-Werte, keine Besucherdaten) an die
        Anthropic-API (USA). Geändert wird nichts: Du setzt Vorschläge selbst im Admin um, sie
        landen im Entwurf und laufen durch die Vorschau.
      </p>
      <UiCallout v-if="ai.loadError.value" type="danger">{{ ai.loadError.value }}</UiCallout>
      <UiCallout v-else-if="ai.config.value && !ai.config.value.configured" type="warning">
        Auf dem Server fehlt <code>ANTHROPIC_API_KEY</code>.
      </UiCallout>

      <template v-if="ai.config.value">
        <UiTextArea
          v-model="goal"
          label="Ziel (optional)"
          :rows="2"
          placeholder="z. B. ruhiger und moderner wirken, bessere Lesbarkeit im Dunkelmodus"
          data-aids-goal
        />
        <AiModelPicker
          v-model:model="ai.model.value"
          v-model:effort="ai.effort.value"
          :config="ai.config.value"
        />
        <UiButton
          variant="primary"
          size="sm"
          :disabled="ai.busy.value || !ai.config.value.configured"
          data-aids-run
          @click="run"
        >
          {{ ai.busy.value ? 'Läuft …' : 'Beraten' }}
        </UiButton>
        <p v-if="ai.error.value" class="ai-err" data-aids-error>{{ ai.error.value }}</p>
      </template>

      <section v-if="result" class="ai-res" data-aids-result>
        <p class="ai-m0">
          <strong>{{ result.summary }}</strong>
        </p>
        <ol class="ai-list">
          <li v-for="(x, i) in result.suggestions" :key="i" data-aids-suggestion>
            <strong>{{ x.title }}</strong> – {{ x.why }}
            <span class="hint ai-block">Im Admin: {{ x.how }}</span>
          </li>
        </ol>
        <div v-if="applicable.length" class="ai-changes" data-aids-changes>
          <strong class="ai-m0"
            >Direkt anwendbar (landet im Entwurf, Strg+Z macht es rückgängig)</strong
          >
          <span v-if="applyNote" class="hint ai-m0" data-aids-note>{{ applyNote }}</span>
          <ul class="ai-list ai-clist">
            <li v-for="(a, i) in applicable" :key="i" data-aids-change>
              <strong>{{ a.label }}</strong
              >: {{ a.current }} → <code>{{ a.next }}</code>
              <span class="hint ai-block">{{ a.why }}</span>
              <UiButton size="sm" :disabled="applied.has(i)" data-aids-apply @click="applyOne(i)">{{
                applied.has(i) ? '✓ Angewendet' : 'Anwenden'
              }}</UiButton>
            </li>
          </ul>
          <UiButton
            v-if="applicable.length > 1"
            size="sm"
            variant="primary"
            data-aids-applyall
            @click="applyAll"
            >Alle anwenden</UiButton
          >
          <span v-if="skipped" class="hint ai-m0"
            >{{ skipped }} Vorschlag/Vorschläge nicht anwendbar (ungültiger Wert oder Feld).</span
          >
        </div>
        <div v-if="result.colors.length" class="ai-colors">
          <button
            v-for="c in result.colors"
            :key="c.hex + c.name"
            type="button"
            class="ai-color"
            :title="`${c.use} – Klick kopiert ${c.hex}`"
            data-aids-color
            @click="copy(c.hex)"
          >
            <span class="ai-swatch" :style="swatch(c.hex)" />
            {{ c.name }} <code>{{ c.hex }}</code>
          </button>
        </div>
        <div v-if="result.imagePrompt" class="ai-prompt" data-aids-prompt>
          <span class="hint ai-block">Bild-Prompt (für einen Bildgenerator):</span>
          <code>{{ result.imagePrompt }}</code>
          <UiButton size="sm" data-aids-copyprompt @click="copy(result.imagePrompt)"
            >Prompt kopieren</UiButton
          >
        </div>
        <span class="hint ai-m0">Kosten (geschätzt): {{ formatUsd(ai.costUsd.value) }}</span>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { UiButton, UiCallout, UiTextArea } from '../../components/ui';
import AiModelPicker from '../../components/AiModelPicker.vue';
import { useAiAssist } from '../../lib/useAiAssist';
import { useToastStore } from '../../stores/toast';
import { formatUsd } from '../texts/aiClient';
import type { AiChange } from './aiHero';

/**
 * KI-Design-Beratung für Hero-Design, Hintergrund und Layout. `getCurrent` liefert
 * die aktuellen Einstellungen als JSON-Text. Ergebnisse sind reine Vorschläge
 * (nur Kopieren), der Tab wird nicht verändert.
 */
/** Anwendbarer Vorschlag: `null` = nicht anwendbar (Feld unbekannt/Wert ungültig). */
export interface Applicable {
  label: string;
  current: string;
  next: string;
  apply: () => void;
}
const props = defineProps<{
  area: 'hero' | 'background' | 'layout';
  getCurrent: () => string;
  /** Prüft einen Änderungsvorschlag der KI; nur Bereiche mit sicherem Anwenden setzen das. */
  resolve?: (c: AiChange) => Applicable | null;
  /** Hinweis über der Anwenden-Liste (z. B. „Funktion ist aus“). */
  applyNote?: string;
}>();

const HEX = /^#[0-9a-fA-F]{6}$/;
const MAX_CURRENT = 12_000;

interface Suggestion {
  title: string;
  why: string;
  how: string;
}
interface Colour {
  name: string;
  hex: string;
  use: string;
}

const ai = useAiAssist('design', 'medium');
const toasts = useToastStore();
const goal = ref('');

const result = computed(() => {
  const d = ai.data.value;
  if (!d) return null;
  const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
  return {
    summary: String(d.summary ?? ''),
    suggestions: arr<Suggestion>(d.suggestions),
    colors: arr<Colour>(d.colors).filter((c) => HEX.test(String(c?.hex))),
    imagePrompt: String(d.imagePrompt ?? ''),
  };
});

const applied = ref(new Set<number>());
const applicableAll = computed(() => {
  const d = ai.data.value?.changes;
  const raw = Array.isArray(d) ? (d as AiChange[]) : [];
  if (!props.resolve) return [];
  return raw.map((c) => {
    const r = props.resolve!(c);
    return r ? { ...r, why: String(c.why ?? '') } : null;
  });
});
const applicable = computed(() =>
  applicableAll.value.filter((x): x is NonNullable<typeof x> => x !== null),
);
const skipped = computed(() => applicableAll.value.length - applicable.value.length);
function applyOne(i: number) {
  const a = applicable.value[i];
  if (!a || applied.value.has(i)) return;
  a.apply();
  applied.value = new Set(applied.value).add(i);
  toasts.addToast(`Angewendet: ${a.label}`, { type: 'success' });
}
function applyAll() {
  applicable.value.forEach((_, i) => applyOne(i));
}

/** Nur geprüfte Hex-Werte landen im style (kein freier Text aus der KI). */
const swatch = (hex: string) => ({ background: HEX.test(hex) ? hex : 'transparent' });

async function run() {
  let current: string;
  try {
    current = props.getCurrent();
  } catch {
    current = '{}';
  }
  if (current.length > MAX_CURRENT) current = current.slice(0, MAX_CURRENT);
  applied.value = new Set();
  await ai.run({ area: props.area, goal: goal.value, current });
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toasts.addToast(`Kopiert: ${text.slice(0, 40)}`, { type: 'success' });
  } catch {
    toasts.addToast('Kopieren nicht möglich', { type: 'warning' });
  }
}
</script>

<style scoped>
.ai-ds {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--ds-space-2);
  margin: var(--ds-space-3) 0;
}
.ai-m0 {
  margin: 0;
}
.ai-block {
  display: block;
}
.ai-err {
  margin: 0;
  color: var(--ds-danger, #c0392b);
}
.ai-res {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
}
.ai-list {
  margin: 0;
  padding-left: 1.2rem;
}
.ai-clist {
  list-style: none;
  padding-left: 0;
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
}
.ai-changes {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
}
.ai-colors {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
}
.ai-color {
  display: inline-flex;
  align-items: center;
  gap: var(--ds-space-1);
  padding: var(--ds-space-1) var(--ds-space-2);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: 999px;
  background: var(--ds-surface-1);
  color: var(--ds-text);
  cursor: pointer;
}
.ai-swatch {
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  border: 1px solid var(--ds-border);
}
.ai-prompt {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--ds-space-1);
}
</style>
