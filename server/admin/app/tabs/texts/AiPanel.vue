<template>
  <div class="panel ai-panel" data-ai-panel>
    <h2>
      KI-Assistent
      <UiButton size="sm" data-ai-toggle @click="toggle">{{
        open ? 'Zuklappen' : 'Öffnen'
      }}</UiButton>
    </h2>
    <p class="hint ai-m0">
      SEO-Vorschläge, DE↔EN-Vergleich und Blog-Entwürfe mit Anthropic. Du wählst Modell und Aufwand;
      Batch ist 50&nbsp;% günstiger, liefert aber erst nach Minuten bis Stunden. Es gehen nur die
      Texte, die du hier einfügst, an die API (USA).
    </p>

    <template v-if="open">
      <UiCallout v-if="loadError" type="danger" data-ai-error>{{ loadError }}</UiCallout>
      <UiCallout v-else-if="config && !config.configured" type="warning" data-ai-unconfigured>
        Auf dem Server fehlt <code>ANTHROPIC_API_KEY</code> (siehe Anleitung zu den
        Server-Befehlen).
      </UiCallout>

      <div v-if="config" class="ai-form">
        <div class="ai-row">
          <UiSelect v-model="task" label="Aufgabe" :options="taskOptions" data-ai-task />
          <UiSelect v-model="model" label="Modell" :options="modelOptions" data-ai-model />
          <UiSelect v-model="effort" label="Aufwand" :options="EFFORT_OPTIONS" data-ai-effort />
          <UiSelect v-model="lang" label="Sprache" :options="LANG_OPTIONS" data-ai-lang />
        </div>
        <p class="hint ai-m0" data-ai-hint>{{ modelHint }}</p>

        <UiSegmentedControl
          v-model="mode"
          label="Ausführung"
          size="sm"
          :options="MODE_OPTIONS"
          data-ai-mode
        />

        <template v-if="mode === 'now'">
          <template v-if="task === 'seo'">
            <UiTextField v-model="seoPage" label="Seitenname" data-ai-seo-page />
            <UiTextField v-model="seoKeywords" label="Bevorzugte Keywords (optional)" />
            <UiTextArea v-model="seoText" label="Seiteninhalt" :rows="6" data-ai-seo-text />
          </template>
          <template v-else-if="task === 'compare'">
            <UiTextArea v-model="cmpDe" label="Deutscher Text" :rows="4" data-ai-cmp-de />
            <UiTextArea v-model="cmpEn" label="Englischer Text" :rows="4" data-ai-cmp-en />
          </template>
          <template v-else>
            <UiTextField v-model="blogTopic" label="Thema" data-ai-blog-topic />
            <UiTextArea v-model="blogNotes" label="Hinweise (optional)" :rows="3" />
          </template>
        </template>
        <UiTextArea
          v-else
          v-model="batchRaw"
          label="Einträge (getrennt durch eine Zeile ---)"
          :rows="8"
          :hint="BATCH_HINT[task]"
          data-ai-batch-raw
        />

        <div class="ai-row">
          <UiButton
            variant="primary"
            :disabled="busy || !config.configured"
            data-ai-run
            @click="submit"
          >
            {{ busy ? 'Läuft …' : mode === 'now' ? 'Vorschlag erzeugen' : 'Batch starten' }}
          </UiButton>
        </div>
        <p v-if="formError" class="ai-err" data-ai-form-error>{{ formError }}</p>
      </div>

      <section v-if="job" class="ai-job" data-ai-job>
        <strong>Batch {{ job.id }}</strong>
        <span class="hint ai-m0" data-ai-job-status>{{ jobLabel }}</span>
        <div class="ai-row">
          <UiButton size="sm" :disabled="busy" data-ai-job-check @click="checkJob">
            Status prüfen
          </UiButton>
          <UiButton
            v-if="job.status === 'in_progress'"
            size="sm"
            variant="ghost"
            :disabled="busy"
            data-ai-job-cancel
            @click="cancelJob"
          >
            Abbrechen
          </UiButton>
          <UiButton size="sm" variant="ghost" data-ai-job-forget @click="forgetJob">
            Vergessen
          </UiButton>
        </div>
      </section>

      <section v-if="results.length" class="ai-results" data-ai-results>
        <h3 class="ai-m0">
          Ergebnisse
          <span class="hint ai-m0" data-ai-total
            >Kosten (geschätzt): {{ formatUsd(totalCost) }}</span
          >
        </h3>
        <article v-for="(r, i) in results" :key="r.customId ?? i" class="ai-result" data-ai-result>
          <p v-if="!r.ok" class="ai-err">{{ r.customId ? r.customId + ': ' : '' }}{{ r.error }}</p>
          <template v-else>
            <pre class="ai-pre">{{ resultToText(resultTask, r.data) }}</pre>
            <UiButton size="sm" data-ai-copy @click="copy(r)">Kopieren</UiButton>
            <span class="hint ai-m0">{{ formatUsd(r.costUsd) }}</span>
          </template>
        </article>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import {
  UiButton,
  UiCallout,
  UiSegmentedControl,
  UiSelect,
  UiTextArea,
  UiTextField,
} from '../../components/ui';
import { useToastStore } from '../../stores/toast';
import {
  cancelAiBatch,
  createAiBatch,
  fetchAiConfig,
  formatUsd,
  getAiBatch,
  getAiBatchResults,
  PANEL_TASKS,
  parseBatchBlocks,
  resultToText,
  runAi,
  type AiConfig,
  type AiEffort,
  type AiInput,
  type AiResult,
  type AiTask,
} from './aiClient';

/**
 * KI-Assistent im Tab „Texte“: Aufgabe, Modell, Aufwand und Sofort/Batch wählen.
 * Spricht nur mit /api/ai/* des Admin-Servers (der API-Schlüssel bleibt dort).
 * Lädt erst nach dem Öffnen; ändert keine Inhalte der Seite, Ergebnisse sind
 * Vorschläge zum Kopieren.
 */
const toasts = useToastStore();

const EFFORT_OPTIONS = [
  { value: 'low', label: 'Niedrig (schneller, günstiger)' },
  { value: 'medium', label: 'Mittel' },
  { value: 'high', label: 'Hoch (gründlicher)' },
];
const LANG_OPTIONS = [
  { value: 'de', label: 'Deutsch' },
  { value: 'en', label: 'English' },
];
const MODE_OPTIONS = [
  { value: 'now', label: 'Sofort' },
  { value: 'batch', label: 'Batch (50 % günstiger)' },
];
const BATCH_HINT: Record<AiTask, string> = {
  seo: 'Je Eintrag: erste Zeile = Seitenname, danach der Seitentext.',
  compare: 'Je Eintrag: deutscher Text, eine Zeile ===, englischer Text.',
  blog: 'Je Eintrag ein Thema.',
  alt: '',
  card: '',
  ticker: '',
  icon: '',
  design: '',
  imageprompt: '',
};
const JOB_KEY = 'kdt-ai-job';

const open = ref(false);
const config = ref<AiConfig | null>(null);
const loadError = ref('');
const formError = ref('');
const busy = ref(false);

const task = ref<AiTask>('seo');
const model = ref('');
const effort = ref<AiEffort>('medium');
const lang = ref<'de' | 'en'>('de');
const mode = ref<'now' | 'batch'>('now');
const seoPage = ref('');
const seoKeywords = ref('');
const seoText = ref('');
const cmpDe = ref('');
const cmpEn = ref('');
const blogTopic = ref('');
const blogNotes = ref('');
const batchRaw = ref('');

const results = ref<AiResult[]>([]);
const resultTask = ref<AiTask>('seo');
const totalCost = ref(0);

type Job = {
  id: string;
  model: string;
  task: AiTask;
  status: string;
  counts?: Record<string, number>;
};
const job = ref<Job | null>(null);
let timer: ReturnType<typeof setInterval> | undefined;

const taskOptions = computed(() =>
  (config.value?.tasks ?? [])
    .filter((t) => PANEL_TASKS.includes(t.id))
    .map((t) => ({ value: t.id, label: t.label })),
);
const modelOptions = computed(() =>
  (config.value?.models ?? []).map((m) => ({ value: m.id, label: m.label })),
);
const modelHint = computed(
  () => config.value?.models.find((m) => m.id === model.value)?.hint ?? '',
);
const jobLabel = computed(() => {
  const j = job.value;
  if (!j) return '';
  const c = j.counts ?? {};
  const done = (c.succeeded ?? 0) + (c.errored ?? 0) + (c.canceled ?? 0) + (c.expired ?? 0);
  const total = done + (c.processing ?? 0);
  if (j.status === 'ended') return 'Fertig – Ergebnisse unten';
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
    return j && typeof j.id === 'string' && typeof j.model === 'string' ? j : null;
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
  job.value = loadJob();
  if (job.value) {
    await checkJob();
    startPolling();
  }
}

function currentInput(): AiInput {
  if (task.value === 'seo') {
    const i: AiInput = { lang: lang.value, page: seoPage.value.trim(), text: seoText.value.trim() };
    if (seoKeywords.value.trim()) i.keywords = seoKeywords.value.trim();
    return i;
  }
  if (task.value === 'compare') return { de: cmpDe.value.trim(), en: cmpEn.value.trim() };
  const i: AiInput = { lang: lang.value, topic: blogTopic.value.trim() };
  if (blogNotes.value.trim()) i.notes = blogNotes.value.trim();
  return i;
}

async function submit() {
  formError.value = '';
  const sel = { task: task.value, model: model.value, effort: effort.value };
  busy.value = true;
  try {
    if (mode.value === 'now') {
      const r = await runAi(sel, currentInput());
      if (!r.ok) return void (formError.value = r.error);
      resultTask.value = sel.task;
      results.value = [r.data];
      totalCost.value = r.data.costUsd ?? 0;
      return;
    }
    let items: AiInput[];
    try {
      items = parseBatchBlocks(task.value, lang.value, batchRaw.value);
    } catch (e) {
      return void (formError.value = (e as Error).message);
    }
    if (!items.length) return void (formError.value = 'Keine Einträge');
    if (config.value && items.length > config.value.maxBatchItems) {
      return void (formError.value = `Zu viele Einträge (max. ${config.value.maxBatchItems})`);
    }
    const r = await createAiBatch(sel, items);
    if (!r.ok) return void (formError.value = r.error);
    job.value = { id: r.data.id, model: sel.model, task: sel.task, status: r.data.status };
    results.value = [];
    saveJob();
    startPolling();
    toasts.addToast(`Batch mit ${r.data.count} Einträgen gestartet`, { type: 'success' });
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
  if (j.status === 'ended') {
    stopPolling();
    const res = await getAiBatchResults(j.id, j.model);
    if (!res.ok) {
      formError.value = res.error;
      return;
    }
    resultTask.value = j.task;
    results.value = res.data.results;
    totalCost.value = res.data.totalCostUsd;
  }
}

async function cancelJob() {
  if (!job.value) return;
  busy.value = true;
  const r = await cancelAiBatch(job.value.id);
  busy.value = false;
  if (!r.ok) formError.value = r.error;
  else await checkJob();
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

async function copy(r: AiResult) {
  try {
    await navigator.clipboard.writeText(resultToText(resultTask.value, r.data));
    toasts.addToast('Kopiert', { type: 'success' });
  } catch {
    toasts.addToast('Kopieren nicht möglich – Text markieren und Strg+C', { type: 'error' });
  }
}
</script>

<style scoped>
.ai-panel {
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
