<template>
  <div data-vue-tab="files">
    <div class="tc-sticky fl-sticky">
      <UiSegmentedControl
        v-model="mode"
        label="👁 Eingesetzte Dateien im Modus:"
        size="sm"
        :options="MODE_OPTIONS"
        data-fl-mode
      />
      <span class="hint fl-m0"
        >– der andere Modus ist zugeklappt; markierte Kacheln unten sind in diesem Modus
        eingesetzt.</span
      >
    </div>

    <!-- Übersicht „Eingesetzte Dateien“ je Modus -->
    <template v-for="m in MODES" :key="m">
      <div
        v-if="m !== mode"
        class="panel tc-mode-collapsed"
        :data-fl-modepanel="m"
        :data-fl-showmode="m"
        role="button"
        tabindex="0"
        :title="`Eingesetzte Dateien im ${MODE_LABEL[m]}-Modus anzeigen`"
        @click="mode = m"
        @keydown.enter.prevent="mode = m"
        @keydown.space.prevent="mode = m"
      >
        <span class="fl-icon" aria-hidden="true">{{ m === 'dark' ? '🌙' : '☀️' }}</span>
        <span
          >{{ m === 'dark' ? 'Dunkelmodus' : 'Hellmodus' }} – anklicken: welche Dateien sind dort
          eingesetzt?</span
        >
      </div>
      <div v-else class="panel" :data-fl-modepanel="m">
        <div class="fl-head">
          <strong class="fl-modetitle"
            >{{ MODE_LABEL[m] }} – eingesetzte Dateien <span class="hint fl-m0">👁</span></strong
          >
          <span class="hint fl-m0" data-fl-modecount
            >{{ entries.length }} Datei(en) erscheinen im
            {{ m === 'dark' ? 'Dunkel' : 'Hell' }}modus{{
              onlyHere ? `, davon ${onlyHere} nur dort` : ''
            }}</span
          >
        </div>
        <p class="hint">
          Dateien dieser Sprache, gemeinsame Dateien und Zwischenspeicher, die auf der Seite im
          {{ MODE_LABEL[m] }}-Modus zu sehen sind. ☀️/🌙 = Platz gilt nur in diesem Modus
          (Seiten-Hintergrund, Sektions-Hintergründe, Tool-Karten-Bilder); ohne Symbol = in beiden
          Modi (Hero, Sektions-Medien, Diashows).
        </p>
        <p v-if="!entries.length" class="hint">Keine Datei ist in diesem Modus eingesetzt.</p>
        <div v-for="e in entries" :key="e.file.key" class="fl-moderow" data-fl-moderow>
          <video v-if="e.file.isVid" :src="e.file.src" muted preload="metadata"></video>
          <img v-else :src="e.file.src" alt="" loading="lazy" />
          <span class="fl-moderow__text">
            <strong>{{ e.file.name }}</strong> <span class="hint fl-m0">{{ e.where }}</span>
            <span class="st fl-usage"
              >↪
              {{
                e.used
                  .map((u) => (MODE_ICON[u.mode] ? MODE_ICON[u.mode] + ' ' : '') + u.label)
                  .join(', ')
              }}</span
            >
          </span>
        </div>
      </div>
    </template>

    <!-- Server-Dateien der Sprache -->
    <div class="panel" data-fl-server>
      <h2>📂 Dateien auf dem Server — {{ langLabel }}</h2>
      <p class="hint">
        Nur die für <strong>{{ langLabel }}</strong> hochgeladenen Medien (unter
        <code>/uploads/{{ lang }}/</code>) – so bleibt getrennt, was auf welche Seite kommt. Über
        „📁 Aus Zwischenspeicher wählen“ bei einem Slot zuweisen. <strong>Löschen</strong> entfernt
        sofort; dauerhaft (auch aus Git) beim nächsten <strong>Veröffentlichen</strong>.
      </p>
      <div class="media-grid">
        <p v-if="!snap.server.length" class="hint">Keine Dateien.</p>
        <FileTile v-for="f in snap.server" :key="f.key" :file="f" :mode="mode">
          <div class="fl-btnrow">
            <button
              v-for="t in moveTargets(lang)"
              :key="t"
              type="button"
              class="fl-small"
              :disabled="busy"
              :data-fl-move="t"
              @click="move(f, t)"
            >
              → {{ LOC_LABEL[t] }}
            </button>
          </div>
          <button
            type="button"
            class="danger fl-small fl-full"
            :disabled="busy"
            data-fl-delserver
            @click="askDeleteServer(f)"
          >
            Löschen
          </button>
        </FileTile>
      </div>
    </div>

    <!-- Gemeinsame Altdateien -->
    <div v-if="snap.shared.length" class="panel" data-fl-shared>
      <h2>📂 Gemeinsame Dateien (ohne Sprache)</h2>
      <p class="hint">
        Ältere Uploads ohne Sprach-Zuordnung (direkt unter <code>/uploads/</code>). Mit „→ DE“ / „→
        EN“ einer Sprache zuordnen (verschieben) oder direkt zuweisen.
      </p>
      <div class="media-grid">
        <FileTile v-for="f in snap.shared" :key="f.key" :file="f" :mode="mode">
          <div class="fl-btnrow">
            <button
              v-for="t in moveTargets('')"
              :key="t"
              type="button"
              class="fl-small"
              :disabled="busy"
              :data-fl-move="t"
              @click="move(f, t)"
            >
              → {{ LOC_LABEL[t] }}
            </button>
          </div>
          <button
            type="button"
            class="danger fl-small fl-full"
            :disabled="busy"
            data-fl-delserver
            @click="askDeleteServer(f)"
          >
            Löschen
          </button>
        </FileTile>
      </div>
    </div>

    <!-- Browser-Zwischenspeicher -->
    <div class="panel" data-fl-staged>
      <h2>Medien-Zwischenspeicher (Browser)</h2>
      <p class="hint">
        Neue Dateien hier ablegen und dann bei einem <strong>{{ langLabel }}</strong
        >-Slot zuweisen. Beim <strong>Veröffentlichen</strong> landen sie automatisch im
        {{ langLabel }}-Ordner (<code>/uploads/{{ lang }}/</code>). Der Zwischenspeicher ist
        gemeinsam – die Sprache ergibt sich aus dem Slot, dem du die Datei zuweist.
      </p>
      <div
        :class="['dropzone', { drag: dragging }]"
        data-fl-dropzone
        @dragenter.prevent="dragging = true"
        @dragover.prevent="dragging = true"
        @dragleave.prevent="dragging = false"
        @drop.prevent="onDrop"
      >
        Dateien hierher ziehen oder
        <label class="fl-pick">
          auswählen<input
            type="file"
            accept="image/*,video/*"
            multiple
            class="fl-hidden"
            :disabled="busy"
            data-fl-input
            @change="onPick"
          />
        </label>
      </div>
      <div class="media-grid">
        <p v-if="!snap.staged.length" class="hint">
          Noch nichts im Zwischenspeicher. Dateien oben hineinziehen oder auswählen.
        </p>
        <FileTile v-for="f in snap.staged" :key="f.key" :file="f" :mode="mode">
          <button
            type="button"
            class="danger fl-small fl-full"
            :disabled="busy"
            data-fl-delstaged
            @click="askDeleteStaged(f)"
          >
            Entfernen
          </button>
        </FileTile>
      </div>
    </div>

    <UiDialog
      :open="!!pending"
      :title="pending?.title ?? ''"
      :description="pending?.description"
      @close="pending = null"
    >
      <template #footer>
        <UiButton variant="ghost" @click="pending = null">Abbrechen</UiButton>
        <UiButton variant="danger" data-fl-confirm @click="confirmPending">{{
          pending?.confirmLabel ?? 'OK'
        }}</UiButton>
      </template>
    </UiDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue';
import type { Lang, ThemeMode } from '../../../types';
import { UiButton, UiDialog, UiSegmentedControl } from '../../components/ui';
import { useToastStore } from '../../stores/toast';
import FileTile from './FileTile.vue';
import {
  LOC_LABEL,
  MODE_ICON,
  MODE_LABEL,
  deleteServerQuestion,
  modeEntries,
  moveTargets,
  type FileLoc,
  type FilesService,
  type FilesSnapshot,
  type ServerFileView,
  type StagedFileView,
} from './filesData';
import { filesUi } from './filesUi';

/**
 * Tab „Dateien“ einer Sprache (Vue-Fassung von `renderFiles` in
 * `public/media.ts`). Daten und Aktionen kommen als `service` von der
 * Vanilla-Seite (Server-Liste, IndexedDB-Zwischenspeicher, Plätze); nach jeder
 * Aktion wird der Schnappschuss neu geholt.
 */
const props = defineProps<{ lang: Lang; service: FilesService }>();
const toasts = useToastStore();

const MODES: ThemeMode[] = ['light', 'dark'];
const MODE_OPTIONS = MODES.map((m) => ({ value: m, label: MODE_LABEL[m] }));
const langLabel = computed(() => (props.lang === 'de' ? 'Deutsch' : 'English'));

const mode = computed<ThemeMode>({
  get: () => filesUi.mode,
  set: (m) => (filesUi.mode = m === 'dark' ? 'dark' : 'light'),
});

const snap = shallowRef<FilesSnapshot>(props.service.snapshot());
const refresh = () => (snap.value = props.service.snapshot());
const entries = computed(() => modeEntries(snap.value, props.lang, mode.value));
const onlyHere = computed(
  () => entries.value.filter((e) => e.used.every((u) => u.mode === mode.value)).length,
);

// Laufende Aktion sperrt die Knöpfe (keine Doppelklicks auf Löschen/Verschieben).
const busy = ref(false);
async function run<T extends { ok: boolean; error?: string }>(
  fn: () => Promise<T>,
  failPrefix: string,
): Promise<T | null> {
  if (busy.value) return null;
  busy.value = true;
  try {
    const r = await fn();
    if (!r.ok) {
      toasts.addToast(`${failPrefix}: ${r.error ?? 'unbekannter Fehler'}`, { type: 'error' });
      return null;
    }
    return r;
  } catch (e) {
    console.error('[admin] Datei-Aktion fehlgeschlagen', e);
    toasts.addToast(`${failPrefix}: ${e instanceof Error ? e.message : String(e)}`, {
      type: 'error',
    });
    return null;
  } finally {
    refresh();
    busy.value = false;
  }
}

// ---- Bestätigungsdialog ---------------------------------------------------------
interface Pending {
  title: string;
  description: string;
  confirmLabel: string;
  action: () => Promise<void>;
}
const pending = shallowRef<Pending | null>(null);
async function confirmPending() {
  const p = pending.value;
  pending.value = null;
  if (p) await p.action();
}

function askDeleteServer(f: ServerFileView) {
  pending.value = {
    title: 'Datei löschen?',
    description: deleteServerQuestion(f),
    confirmLabel: 'Löschen',
    action: async () => {
      const r = await run(() => props.service.deleteServer(f.path), 'Löschen fehlgeschlagen');
      if (r)
        toasts.addToast('Gelöscht – dauerhaft beim nächsten Veröffentlichen', { type: 'success' });
    },
  };
}
function askDeleteStaged(f: StagedFileView) {
  const remove = async () => {
    await run(() => props.service.deleteStaged(f.id), 'Entfernen fehlgeschlagen');
  };
  if (!f.usage.length) {
    void remove();
    return;
  }
  pending.value = {
    title: 'Aus dem Zwischenspeicher entfernen?',
    description:
      '⚠ Dieses Medium ist einem Platz zugewiesen. Der zugewiesene Platz verliert dann sein Medium.',
    confirmLabel: 'Entfernen',
    action: remove,
  };
}
async function move(f: ServerFileView, to: FileLoc) {
  const r = await run(() => props.service.moveServer(f.path, to), 'Verschieben fehlgeschlagen');
  if (r)
    toasts.addToast(`Verschoben nach „${LOC_LABEL[to]}“ – zum Übernehmen veröffentlichen`, {
      type: 'success',
    });
}

// ---- Hinzufügen -------------------------------------------------------------
const dragging = ref(false);
async function add(files: FileList | File[] | null | undefined) {
  const list = Array.from(files ?? []);
  if (!list.length) return;
  const r = await run(() => props.service.addFiles(list), 'Hinzufügen fehlgeschlagen');
  if (!r) return;
  for (const name of r.tooBig) toasts.addToast(`${name} zu groß`, { type: 'warning' });
  if (r.added) toasts.addToast(`${r.added} Datei(en) im Zwischenspeicher`, { type: 'success' });
}
function onDrop(e: DragEvent) {
  dragging.value = false;
  void add(e.dataTransfer?.files);
}
function onPick(e: Event) {
  const input = e.target as HTMLInputElement;
  void add(input.files).finally(() => (input.value = ''));
}
</script>

<style scoped>
.fl-m0 {
  margin: 0;
}
.fl-sticky {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
  margin-top: 0;
}
.fl-icon {
  font-size: 1.2rem;
}
.fl-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
}
.fl-modetitle {
  padding: 0 var(--ds-space-1);
  border-radius: var(--ds-radius-sm);
  outline: 2px solid var(--ds-accent);
}
.fl-moderow {
  display: flex;
  align-items: center;
  gap: var(--ds-space-3);
  padding: var(--ds-space-2) 0;
  border-top: var(--ds-border-width) solid var(--ds-border);
}
.fl-moderow img,
.fl-moderow video {
  width: 44px;
  height: 32px;
  object-fit: cover;
  border-radius: 5px;
  flex-shrink: 0;
  background: #000; /* ds-content */
}
.fl-moderow__text {
  flex: 1 1 auto;
  min-width: 0;
  overflow-wrap: anywhere;
}
.fl-moderow__text .hint {
  margin-left: var(--ds-space-1);
}
.fl-usage {
  display: block;
  color: var(--ds-accent);
}
.fl-btnrow {
  display: flex;
  gap: var(--ds-space-1);
  margin-top: var(--ds-space-2);
}
.fl-btnrow > button {
  flex: 1;
}
.fl-small {
  padding: var(--ds-space-1);
  font-size: 0.7rem;
}
.fl-full {
  width: 100%;
  margin-top: var(--ds-space-1);
}
.fl-pick {
  display: inline;
  color: var(--ds-accent);
  cursor: pointer;
  text-decoration: underline;
}
.fl-hidden {
  display: none;
}
</style>
