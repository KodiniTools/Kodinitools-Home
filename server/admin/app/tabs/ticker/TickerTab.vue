<template>
  <div class="panel tk-tab" data-vue-tab="ticker">
    <h2>
      Laufband <span class="lang-badge">{{ lang.toUpperCase() }}</span>
    </h2>

    <div class="tk-row">
      <UiSwitch v-model="ticker.enabled" label="Laufband anzeigen" />
      <UiSelect
        v-model="ticker.speed"
        class="tk-speed"
        label="Tempo"
        inline
        size="sm"
        :options="SPEED_OPTIONS"
      />
    </div>

    <h3 class="tk-h3">Einträge</h3>
    <p class="hint tk-hint">
      Schreibe oben den Text – so lang wie du möchtest, gern auch
      <strong>mehrzeilig</strong> (Zeilenumbrüche werden auf der Seite zu Leerzeichen, das Laufband
      läuft immer einzeilig durch). Um <strong>ein Wort</strong> anklickbar zu machen: das Wort und
      das Ziel im Kasten „🔗 Ein Wort im Text verlinken" eintragen und auf
      <strong>Wort verlinken</strong> klicken – die Vorschau zeigt sofort das Ergebnis. Das unterste
      Feld macht dagegen den <strong>ganzen</strong> Eintrag klickbar.
    </p>

    <ol v-if="ticker.items.length" class="tk-items">
      <li v-for="(item, i) in ticker.items" :key="i" class="tk-item" data-tk-item>
        <span class="tk-item__idx" aria-hidden="true">{{ i + 1 }}</span>
        <div class="tk-item__body">
          <UiTextArea
            v-model="item.text"
            :label="`Eintrag ${i + 1}: Text`"
            :rows="3"
            placeholder="Text"
          />
          <p class="hint tk-item__preview">
            So sieht der Eintrag aus:
            <span class="tk-item__preview-text" data-tk-preview-text>
              <template v-if="segmentsOf(item).length">
                <template v-for="(seg, k) in segmentsOf(item)" :key="k">
                  <a v-if="seg.kind === 'link'" :href="seg.url" class="tk-link" @click.prevent>{{
                    seg.text
                  }}</a>
                  <template v-else>{{ seg.text }}</template>
                </template>
              </template>
              <template v-else>—</template>
            </span>
          </p>

          <fieldset class="tk-linkbox">
            <legend class="hint">🔗 Ein Wort im Text verlinken</legend>
            <div class="tk-linkbox__row">
              <UiTextField
                v-model="linkDraft(i).word"
                :label="`Eintrag ${i + 1}: Wort im Text`"
                label-hidden
                placeholder="Wort im Text (z.B. aktuell)"
              />
              <UiTextField
                v-model="linkDraft(i).url"
                :label="`Eintrag ${i + 1}: Link-Ziel`"
                label-hidden
                placeholder="Ziel: /faq/ oder https://…"
              />
              <UiButton size="sm" variant="secondary" data-tk-linkword @click="linkWord(i)">
                Wort verlinken
              </UiButton>
            </div>
          </fieldset>

          <UiTextField
            v-model="item.link"
            :label="`Eintrag ${i + 1}: ganzen Eintrag verlinken (optional)`"
            placeholder="z.B. /faq/"
          />
        </div>
        <div class="tk-item__btns">
          <UiIconButton
            :label="`Eintrag ${i + 1} nach oben`"
            size="sm"
            :disabled="i === 0"
            data-tk-up
            @click="move(i, -1)"
            >▲</UiIconButton
          >
          <UiIconButton
            :label="`Eintrag ${i + 1} nach unten`"
            size="sm"
            :disabled="i === ticker.items.length - 1"
            data-tk-down
            @click="move(i, 1)"
            >▼</UiIconButton
          >
          <UiIconButton :label="`Eintrag ${i + 1} löschen`" size="sm" data-tk-del @click="remove(i)"
            >✕</UiIconButton
          >
        </div>
      </li>
    </ol>
    <p v-else class="hint">Noch keine Einträge.</p>

    <UiButton class="tk-add" variant="secondary" data-tk-add @click="add">
      + Eintrag hinzufügen
    </UiButton>

    <details class="tk-design" :open="designOpen" @toggle="onDesignToggle">
      <summary>🎨 Design ({{ lang.toUpperCase() }})</summary>
      <p class="hint">
        Nur für {{ lang === 'de' ? 'Deutsch' : 'Englisch' }}. Ausgeschaltet = Standard-Design (Blau,
        passt sich Dark Mode an).
      </p>
      <UiSwitch v-model="style.enabled" label="Eigenes Design verwenden" />

      <div class="tk-row tk-row--fields">
        <label class="tk-num">
          <span>Schriftgröße (px)</span>
          <input
            type="number"
            min="8"
            max="48"
            :value="style.fontSize"
            data-tk-fontsize
            @input="style.fontSize = clampFontSize(($event.target as HTMLInputElement).value)"
          />
        </label>
        <label class="tk-num">
          <span>Buchstabenabstand (px)</span>
          <input
            type="number"
            min="-5"
            max="20"
            step="0.5"
            :value="style.letterSpacing"
            data-tk-spacing
            @input="
              style.letterSpacing = clampSpacing(($event.target as HTMLInputElement).value, 0)
            "
          />
        </label>
        <label class="tk-font">
          <span>Schriftart</span>
          <!-- Natives Select: Optionen erscheinen in ihrer eigenen Schrift. -->
          <select v-model="style.fontFamily" data-tk-font>
            <option value="">Standard (System)</option>
            <option
              v-for="f in fontOptions"
              :key="f.name"
              :value="f.name"
              :style="{ fontFamily: `'${f.family}', system-ui, sans-serif` }"
            >
              {{ f.label }}
            </option>
          </select>
        </label>
      </div>
      <p class="hint">
        Schriftgröße, Buchstabenabstand und Schriftart gelten für <strong>beide</strong> Modi.
        Schriftarten aus dem Ordner <code>/fonts</code> auf dem Server.
      </p>

      <div class="tk-mode">
        <UiSegmentedControl
          v-model="editMode"
          label="Farben & Vorschau für"
          size="sm"
          :options="MODE_OPTIONS"
        />
        <span class="hint">– der andere Modus ist zugeklappt.</span>
      </div>

      <template v-for="mode in MODES" :key="mode">
        <div
          v-if="mode !== editMode"
          class="panel tc-mode-collapsed tk-collapsed"
          role="button"
          tabindex="0"
          :data-tk-showmode="mode"
          :title="`${MODE_LABEL[mode]}-Modus anzeigen und bearbeiten`"
          @click="editMode = mode"
          @keydown.enter.prevent="editMode = mode"
          @keydown.space.prevent="editMode = mode"
        >
          <span aria-hidden="true">{{ mode === 'dark' ? '🌙' : '☀️' }}</span>
          <span
            >{{ mode === 'dark' ? 'Dunkelmodus' : 'Hellmodus' }} – anklicken zum Bearbeiten</span
          >
        </div>
        <div v-else class="panel tk-modeblock" :data-tk-mode="mode">
          <strong class="tk-modeblock__title">{{ MODE_LABEL[mode] }}</strong>
          <div class="tk-row tk-row--fields">
            <div class="tk-color">
              <span>Schriftfarbe</span>
              <ColorField
                v-model="style[mode].textColor"
                :label="`Schriftfarbe ${MODE_LABEL[mode]}`"
              />
            </div>
            <div class="tk-color">
              <span>Hintergrundfarbe</span>
              <ColorField
                v-model="style[mode].bgColor"
                :label="`Hintergrundfarbe ${MODE_LABEL[mode]}`"
              />
            </div>
            <div class="tk-slider">
              <SliderControl
                :model-value="style[mode].bgOpacity"
                label="Transparenz Hintergrund (0 = ganz durchsichtig)"
                :min="0"
                :max="100"
                :step="1"
                :default-value="100"
                :value-text="`${style[mode].bgOpacity} %`"
                @update:model-value="style[mode].bgOpacity = clampOpacity($event)"
              />
            </div>
          </div>
          <div class="tk-prevbox" :style="{ background: pageBg[mode] }">
            <span :class="['tk-prevbox__badge', `tk-prevbox__badge--${mode}`]">{{
              MODE_VIEW[mode]
            }}</span>
            <div :style="previewStyle(mode)" data-tk-preview>
              Immer die besten Tools für deine Aufgaben – Beispieltext
            </div>
          </div>
        </div>
      </template>
      <p class="hint" data-tk-note>{{ tickerPreviewNote(style) }}</p>
    </details>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import type { FontEntry, Lang, ThemeMode, TickerConfig, TickerItem } from '../../../types';
import { clampSpacing } from '../../../public/model-core';
import {
  UiButton,
  UiIconButton,
  UiSegmentedControl,
  UiSelect,
  UiSwitch,
  UiTextArea,
  UiTextField,
  ColorField,
  SliderControl,
} from '../../components/ui';
import { useToastStore } from '../../stores/toast';
import {
  clampFontSize,
  clampOpacity,
  insertInlineLink,
  parseTickerText,
  tickerPreviewNote,
  tickerPreviewStyle,
} from './tickerText';
import { tickerUi } from './tickerUi';

/**
 * Laufband-Tab einer Sprache (Vue-Fassung von `public/ticker.js`). Bearbeitet
 * das übergebene Objekt `state.ticker[lang]` direkt: Speichern, Autosave und
 * Undo/Redo des Vanilla-Admins erkennen Änderungen weiterhin per Snapshot; nach
 * Undo/Redo wird der Tab mit dem wiederhergestellten Objekt neu gemountet.
 */
const props = defineProps<{
  ticker: TickerConfig;
  lang: Lang;
  fonts: FontEntry[];
  /** Seitenhintergrund je Modus (Tab „Hintergrund“ bzw. Standard). */
  pageBg: Record<ThemeMode, string>;
  /** Lädt eine Schrift per @font-face in die Admin-Seite, liefert den Family-Namen. */
  ensureFontFace: (file: string) => string;
}>();

// reactive() auf das Roh-Objekt: Änderungen landen direkt in state.ticker.
const ticker = reactive(props.ticker);
const style = ticker.style;
const toasts = useToastStore();

const SPEED_OPTIONS = [
  { value: 'slow', label: 'langsam' },
  { value: 'normal', label: 'normal' },
  { value: 'fast', label: 'schnell' },
];
const MODES: ThemeMode[] = ['light', 'dark'];
const MODE_LABEL: Record<ThemeMode, string> = { light: '☀️ Hell', dark: '🌙 Dunkel' };
const MODE_VIEW: Record<ThemeMode, string> = {
  light: '☀️ Hell-Ansicht',
  dark: '🌙 Dunkel-Ansicht',
};
const MODE_OPTIONS = MODES.map((m) => ({ value: m, label: MODE_LABEL[m] }));

// UI-Zustand bleibt über Neu-Mounts (Undo, Sprachwechsel) erhalten.
const editMode = computed<ThemeMode>({
  get: () => tickerUi.editMode,
  set: (m) => (tickerUi.editMode = m === 'dark' ? 'dark' : 'light'),
});
const designOpen = computed(() => tickerUi.designOpen);
function onDesignToggle(e: Event) {
  tickerUi.designOpen = (e.target as HTMLDetailsElement).open;
}

const segmentsOf = (item: TickerItem) => parseTickerText(item.text);

const fontOptions = computed(() => {
  const list = props.fonts.slice();
  const current = style.fontFamily;
  if (current && !list.some((f) => f.name === current))
    list.unshift({ name: current, label: `${current} (nicht gefunden)`, url: '', bytes: 0 });
  return list.map((f) => ({
    name: f.name,
    label: f.label || f.name,
    family: props.ensureFontFace(f.name),
  }));
});

function previewStyle(mode: ThemeMode) {
  const fam = style.fontFamily ? props.ensureFontFace(style.fontFamily) : '';
  return tickerPreviewStyle(style, mode, fam);
}

// Eingaben des „Wort verlinken“-Helfers je Eintrag (nicht gespeichert).
const linkDrafts = ref<Array<{ word: string; url: string }>>([]);
function linkDraft(i: number) {
  return (linkDrafts.value[i] ??= { word: '', url: '' });
}
function resetDrafts() {
  linkDrafts.value = [];
}

function linkWord(i: number) {
  const item = ticker.items[i];
  if (!item) return;
  const d = linkDraft(i);
  const r = insertInlineLink(item, d.word, d.url);
  if (!r.ok) {
    toasts.addToast(r.msg, { type: 'warning' });
    return;
  }
  linkDrafts.value[i] = { word: '', url: '' };
  toasts.addToast('Wort verlinkt ✓ – zum Übernehmen veröffentlichen', { type: 'success' });
}

function add() {
  ticker.items.push({ id: String(Date.now()), text: '', link: '' });
}
function remove(i: number) {
  ticker.items.splice(i, 1);
  resetDrafts();
}
function move(i: number, dir: -1 | 1) {
  const j = i + dir;
  const a = ticker.items[i];
  const b = ticker.items[j];
  if (!a || !b) return;
  ticker.items[i] = b;
  ticker.items[j] = a;
  resetDrafts();
}
</script>

<style scoped>
.tk-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--ds-space-4);
  margin: var(--ds-space-3) 0;
}
.tk-h3 {
  margin: var(--ds-space-4) 0 var(--ds-space-1);
  font-size: var(--ds-text-md);
}
.tk-hint {
  margin-top: 0;
}
.tk-items {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-3);
}
.tk-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: var(--ds-space-3);
  padding: var(--ds-space-3);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-md);
}
.tk-item__idx {
  color: var(--ds-text-3);
  padding-top: var(--ds-space-6);
}
.tk-item__body {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
  min-width: 0;
}
.tk-item__preview {
  margin: 0;
}
.tk-item__preview-text {
  color: var(--ds-text);
}
.tk-link {
  color: var(--ds-link, var(--ds-accent));
  text-decoration: underline;
}
.tk-linkbox {
  border: var(--ds-border-width) dashed var(--ds-border);
  border-radius: var(--ds-radius-sm);
  padding: var(--ds-space-2);
  margin: 0;
}
.tk-linkbox legend {
  margin: 0;
  padding: 0 var(--ds-space-1);
}
.tk-linkbox__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ds-space-2);
}
.tk-linkbox__row > :not(:last-child) {
  flex: 1 1 150px;
}
.tk-item__btns {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
  padding-top: var(--ds-space-6);
}
.tk-add {
  margin-top: var(--ds-space-3);
}
.tk-design {
  margin-top: var(--ds-space-4);
  border-top: var(--ds-border-width) solid var(--ds-border);
  padding-top: var(--ds-space-3);
}
.tk-design summary {
  cursor: pointer;
  font-weight: 600;
}
.tk-num,
.tk-font,
.tk-color {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
  color: var(--ds-text-2);
  font-size: var(--ds-text-sm);
}
.tk-num input {
  width: 90px;
}
.tk-font {
  flex: 1 1 240px;
}
.tk-slider {
  flex: 1 1 240px;
}
.tk-mode {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ds-space-2);
  margin-top: var(--ds-space-3);
}
.tk-collapsed {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  margin: var(--ds-space-2) 0 0;
  cursor: pointer;
}
.tk-modeblock {
  margin: var(--ds-space-2) 0 0;
}
.tk-modeblock__title {
  display: inline-block;
  padding: 0 var(--ds-space-1);
  border-radius: var(--ds-radius-sm);
  outline: 2px solid var(--ds-accent);
}
.tk-prevbox {
  position: relative;
  margin-top: var(--ds-space-3);
  padding: var(--ds-space-6) var(--ds-space-3) var(--ds-space-3);
  border-radius: var(--ds-radius-md);
}
.tk-prevbox__badge {
  position: absolute;
  top: var(--ds-space-1);
  left: var(--ds-space-2);
  font-size: var(--ds-text-xs);
  font-weight: 600;
  padding: 0 var(--ds-space-2);
  border-radius: var(--ds-radius-full);
}
/* Inhalt (Seitenhintergrund des Modus), nicht Oberfläche */
.tk-prevbox__badge--light {
  background: rgba(0, 0, 0, 0.08); /* ds-content */
  color: #1e293b; /* ds-content */
}
.tk-prevbox__badge--dark {
  background: rgba(255, 255, 255, 0.14); /* ds-content */
  color: #e2e8f0; /* ds-content */
}
</style>
