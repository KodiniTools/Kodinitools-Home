<template>
  <div class="panel ai-alt" data-ai-alt>
    <h2>
      KI: Alt-Texte für Bilder
      <UiButton size="sm" data-aialt-toggle @click="toggle">{{
        open ? 'Zuklappen' : 'Öffnen'
      }}</UiButton>
    </h2>
    <p class="hint ai-m0">
      Die KI sieht sich das Bild an und schlägt Alt-Text (DE und EN) und einen sprechenden
      Dateinamen vor. Nur JPG, PNG, WebP und GIF bis 4,5&nbsp;MB. Das Bild geht an die Anthropic-API
      (USA). „Übernehmen“ schreibt den Alt-Text nur in den <strong>Entwurf</strong>: mit dem
      Rückgängig-Knopf (Strg+Z) zurücknehmbar, über die Vorschau prüfbar und erst mit
      „Veröffentlichen“ live. Gilt für Bilder in Hero, Raster, Diashows und Sektions-Medien.
    </p>

    <template v-if="open">
      <UiCallout v-if="loadError" type="danger" data-aialt-error>{{ loadError }}</UiCallout>
      <UiCallout v-else-if="config && !config.configured" type="warning">
        Auf dem Server fehlt <code>ANTHROPIC_API_KEY</code>.
      </UiCallout>
      <p v-if="config && !files.length" class="hint">Keine analysierbaren Bilder vorhanden.</p>

      <div v-if="config && files.length" class="ai-form">
        <div class="ai-row">
          <UiSelect v-model="model" label="Modell" :options="modelOptions" data-aialt-model />
          <UiSelect v-model="effort" label="Aufwand" :options="EFFORT_OPTIONS" />
          <UiSelect v-model="mode" label="Ausführung" :options="MODE_OPTIONS" data-aialt-mode />
        </div>
        <template v-if="mode === 'now'">
          <UiSelect v-model="selected" label="Bild" :options="fileOptions" data-aialt-file />
          <UiTextField v-model="context" label="Verwendung (optional, z. B. „Hero-Banner“)" />
        </template>
        <p v-else class="hint ai-m0" data-aialt-batchinfo>
          Alle {{ batchFiles.length }} Bilder dieser Liste{{
            files.length > batchFiles.length
              ? ` (die ersten ${batchFiles.length} von ${files.length})`
              : ''
          }}.
        </p>
        <div class="ai-row">
          <UiButton
            variant="primary"
            :disabled="busy || !config.configured"
            data-aialt-run
            @click="submit"
          >
            {{ busy ? 'Läuft …' : mode === 'now' ? 'Alt-Text erzeugen' : 'Batch starten' }}
          </UiButton>
        </div>
        <p v-if="formError" class="ai-err" data-aialt-formerror>{{ formError }}</p>
      </div>

      <section v-if="job" class="ai-job" data-aialt-job>
        <strong>Batch {{ job.id }}</strong>
        <span class="hint ai-m0" data-aialt-jobstatus>{{ jobLabel }}</span>
        <div class="ai-row">
          <UiButton size="sm" :disabled="busy" data-aialt-check @click="checkJob">
            Status prüfen
          </UiButton>
          <UiButton size="sm" variant="ghost" @click="forgetJob">Vergessen</UiButton>
        </div>
      </section>

      <section v-if="rows.length" class="ai-results" data-aialt-results>
        <h3 class="ai-m0">
          Ergebnisse
          <span class="hint ai-m0">Kosten (geschätzt): {{ formatUsd(totalCost) }}</span>
        </h3>
        <div v-if="applicableRows.length > 1" class="ai-row">
          <UiButton size="sm" variant="primary" data-aialt-applyall @click="applyAll">
            Alle {{ applicableRows.length }} übernehmen
          </UiButton>
        </div>
        <article v-for="r in rows" :key="r.path" class="ai-result" data-aialt-result>
          <strong>{{ r.path }}</strong>
          <p v-if="isDecorative(r.path)" class="hint ai-m0" data-aialt-current>
            Im Entwurf: dekorativ (leeres alt)
          </p>
          <p v-else-if="hasAlt(r.path)" class="hint ai-m0" data-aialt-current>
            Im Entwurf: DE „{{ cur(r.path).de || '–' }}“ · EN „{{ cur(r.path).en || '–' }}“
          </p>
          <p v-if="!r.res.ok" class="ai-err">{{ r.res.error }}</p>
          <template v-else>
            <pre class="ai-pre">{{ resultToText('alt', r.res.data) }}</pre>
            <div class="ai-row">
              <UiButton
                v-if="!r.res.data?.decorative"
                size="sm"
                variant="primary"
                data-aialt-apply
                @click="apply(r.path, r.res)"
                >Übernehmen</UiButton
              >
              <UiButton
                size="sm"
                :variant="r.res.data?.decorative ? 'primary' : 'secondary'"
                title="Setzt ein bewusst leeres alt: Screenreader überspringen das Bild"
                data-aialt-decorative
                @click="markDecorative(r.path)"
                >Als dekorativ übernehmen</UiButton
              >
              <UiButton
                v-if="hasAlt(r.path)"
                size="sm"
                variant="ghost"
                data-aialt-remove
                @click="removeAlt(r.path)"
                >Alt-Text entfernen</UiButton
              >
              <UiButton size="sm" data-aialt-copy="de" @click="copy(r.res, 'altDe')"
                >Alt DE kopieren</UiButton
              >
              <UiButton size="sm" data-aialt-copy="en" @click="copy(r.res, 'altEn')"
                >Alt EN kopieren</UiButton
              >
              <UiButton size="sm" data-aialt-copy="name" @click="copy(r.res, 'filename')"
                >Dateiname kopieren</UiButton
              >
            </div>
          </template>
        </article>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import { UiButton, UiCallout, UiSelect, UiTextField } from '../../components/ui';
import { useToastStore } from '../../stores/toast';
import { IMAGE_ALT_DECORATIVE } from './filesData';
import {
  createAiBatch,
  fetchAiConfig,
  formatUsd,
  getAiBatch,
  getAiBatchResults,
  resultToText,
  runAi,
  type AiConfig,
  type AiEffort,
  type AiResult,
} from '../texts/aiClient';

/**
 * KI-Alt-Texte im Tab „Dateien“. Bekommt die Server-Dateien (Pfad relativ zu
 * /uploads) und schickt nur den Pfad an /api/ai/*; der Server liest das Bild
 * selbst aus dem Uploads-Ordner. Lädt erst nach dem Öffnen; ändert nichts.
 */
const props = defineProps<{
  files: { path: string; ext: string }[];
  /** Alt-Texte aus dem Entwurf lesen / in den Entwurf schreiben ('' = entfernen). */
  getAlt: (path: string) => { de: string; en: string };
  setAlt: (path: string, alt: { de: string; en: string }) => void;
}>();
const toasts = useToastStore();

const IMAGE_EXT = new Set(['JPG', 'JPEG', 'PNG', 'WEBP', 'GIF']);
const files = computed(() => props.files.filter((f) => IMAGE_EXT.has(f.ext.toUpperCase())));
const EFFORT_OPTIONS = [
  { value: 'low', label: 'Niedrig (schneller, günstiger)' },
  { value: 'medium', label: 'Mittel' },
  { value: 'high', label: 'Hoch' },
];
const MODE_OPTIONS = [
  { value: 'now', label: 'Ein Bild, sofort' },
  { value: 'batch', label: 'Alle Bilder als Batch (50 % günstiger)' },
];
const JOB_KEY = 'kdt-ai-alt-job';

const open = ref(false);
const config = ref<AiConfig | null>(null);
const loadError = ref('');
const formError = ref('');
const busy = ref(false);
const model = ref('');
const effort = ref<AiEffort>('low');
const mode = ref<'now' | 'batch'>('now');
const selected = ref('');
const context = ref('');
const results = ref<Record<string, AiResult>>({});
const totalCost = ref(0);

type Job = {
  id: string;
  model: string;
  paths: string[];
  status: string;
  counts?: Record<string, number>;
};
const job = ref<Job | null>(null);
let timer: ReturnType<typeof setInterval> | undefined;

const modelOptions = computed(() =>
  (config.value?.models ?? []).map((m) => ({ value: m.id, label: m.label })),
);
const fileOptions = computed(() => files.value.map((f) => ({ value: f.path, label: f.path })));
const batchFiles = computed(() => files.value.slice(0, config.value?.maxBatchItems ?? 100));
// Reihenfolge wie in der Dateiliste (Batch-Ergebnisse kommen in beliebiger Reihenfolge).
const rows = computed(() => {
  const order = new Map(files.value.map((f, i) => [f.path, i]));
  return Object.entries(results.value)
    .map(([path, res]) => ({ path, res }))
    .sort((a, b) => (order.get(a.path) ?? 1e9) - (order.get(b.path) ?? 1e9));
});
const jobLabel = computed(() => {
  const j = job.value;
  if (!j) return '';
  if (j.status === 'ended') return 'Fertig – Ergebnisse unten';
  const c = j.counts ?? {};
  const done = (c.succeeded ?? 0) + (c.errored ?? 0) + (c.canceled ?? 0) + (c.expired ?? 0);
  const total = done + (c.processing ?? 0);
  return total ? `Läuft … ${done} von ${total} fertig` : 'Läuft …';
});

function saveJob() {
  try {
    if (job.value) localStorage.setItem(JOB_KEY, JSON.stringify(job.value));
    else localStorage.removeItem(JOB_KEY);
  } catch {
    /* Speicher nicht verfügbar */
  }
}
function loadJob(): Job | null {
  try {
    const raw = localStorage.getItem(JOB_KEY);
    const j = raw ? (JSON.parse(raw) as Job) : null;
    return j && typeof j.id === 'string' && Array.isArray(j.paths) && typeof j.model === 'string'
      ? j
      : null;
  } catch {
    return null;
  }
}

async function toggle() {
  open.value = !open.value;
  if (!open.value || config.value) return;
  const r = await fetchAiConfig();
  if (!r.ok) {
    loadError.value = r.error;
    return;
  }
  config.value = r.data;
  model.value = r.data.defaultModel;
  selected.value = files.value[0]?.path ?? '';
  job.value = loadJob();
  if (job.value) {
    await checkJob();
    startPolling();
  }
}

async function submit() {
  formError.value = '';
  const sel = { task: 'alt' as const, model: model.value, effort: effort.value };
  busy.value = true;
  try {
    if (mode.value === 'now') {
      if (!selected.value) return void (formError.value = 'Kein Bild gewählt');
      const input: Record<string, string> = { path: selected.value };
      if (context.value.trim()) input.context = context.value.trim();
      const r = await runAi(sel, input);
      if (!r.ok) return void (formError.value = r.error);
      results.value = { ...results.value, [selected.value]: r.data };
      totalCost.value += r.data.costUsd ?? 0;
      return;
    }
    const paths = batchFiles.value.map((f) => f.path);
    const r = await createAiBatch(
      sel,
      paths.map((path) => ({ path })),
    );
    if (!r.ok) return void (formError.value = r.error);
    job.value = { id: r.data.id, model: sel.model, paths, status: r.data.status };
    saveJob();
    startPolling();
    toasts.addToast(`Batch mit ${r.data.count} Bildern gestartet`, { type: 'success' });
  } finally {
    busy.value = false;
  }
}

async function checkJob() {
  const j = job.value;
  if (!j) return;
  const r = await getAiBatch(j.id);
  if (!r.ok) {
    formError.value = r.error;
    return;
  }
  j.status = r.data.status;
  j.counts = r.data.counts;
  saveJob();
  if (j.status !== 'ended') return;
  stopPolling();
  const res = await getAiBatchResults(j.id, j.model);
  if (!res.ok) {
    formError.value = res.error;
    return;
  }
  const next: Record<string, AiResult> = {};
  for (const item of res.data.results) {
    const idx = Number(String(item.customId ?? '').replace(/^alt-/, ''));
    const path = Number.isInteger(idx) ? j.paths[idx] : undefined;
    if (path) next[path] = item;
  }
  results.value = next;
  totalCost.value = res.data.totalCostUsd;
}

// ---- Übernehmen (nur Entwurf) ---------------------------------------------------
const stamp = ref(0); // erzwingt Neulesen der Entwurfs-Werte nach Änderungen
const cur = (path: string) => (stamp.value >= 0 ? props.getAlt(path) : { de: '', en: '' });
const hasAlt = (path: string) => {
  const a = cur(path);
  return Boolean(a.de || a.en);
};
const isDecorative = (path: string) => cur(path).de === IMAGE_ALT_DECORATIVE;
const applicableRows = computed(() =>
  rows.value.filter((r) => r.res.ok && !r.res.data?.decorative),
);
function apply(path: string, res: AiResult, quiet = false) {
  if (!res.ok || res.data?.decorative) return;
  props.setAlt(path, { de: String(res.data?.altDe ?? ''), en: String(res.data?.altEn ?? '') });
  stamp.value++;
  if (!quiet)
    toasts.addToast('Übernommen (Entwurf) – mit Strg+Z rückgängig, in der Vorschau prüfen', {
      type: 'success',
    });
}
function markDecorative(path: string) {
  props.setAlt(path, { de: IMAGE_ALT_DECORATIVE, en: IMAGE_ALT_DECORATIVE });
  stamp.value++;
  toasts.addToast(
    'Als dekorativ übernommen (Entwurf) – mit Strg+Z rückgängig, in der Vorschau prüfen',
    {
      type: 'success',
    },
  );
}
function applyAll() {
  for (const r of applicableRows.value) apply(r.path, r.res, true);
  toasts.addToast(
    `${applicableRows.value.length} Alt-Texte übernommen (Entwurf) – Strg+Z macht es rückgängig`,
    { type: 'success' },
  );
}
function removeAlt(path: string) {
  props.setAlt(path, { de: '', en: '' });
  stamp.value++;
  toasts.addToast('Alt-Text entfernt (Entwurf)', { type: 'success' });
}

function forgetJob() {
  job.value = null;
  stopPolling();
  saveJob();
}
function startPolling() {
  stopPolling();
  timer = setInterval(() => void checkJob(), 20_000);
}
function stopPolling() {
  if (timer) clearInterval(timer);
  timer = undefined;
}
onBeforeUnmount(stopPolling);

async function copy(res: AiResult, key: 'altDe' | 'altEn' | 'filename') {
  try {
    await navigator.clipboard.writeText(String(res.data?.[key] ?? ''));
    toasts.addToast('Kopiert', { type: 'success' });
  } catch {
    toasts.addToast('Kopieren nicht möglich – Text markieren und Strg+C', { type: 'error' });
  }
}
</script>

<style scoped>
.ai-alt {
  margin-top: var(--ds-space-4);
}
.ai-m0 {
  margin: 0;
}
.ai-form,
.ai-job,
.ai-results {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
  margin-top: var(--ds-space-3);
}
.ai-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--ds-space-3);
}
.ai-result {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--ds-space-2);
  padding: var(--ds-space-3);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-md);
}
.ai-pre {
  margin: 0;
  max-width: 100%;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font: inherit;
}
.ai-err {
  margin: 0;
  color: var(--ds-danger, #c0392b);
}
</style>
