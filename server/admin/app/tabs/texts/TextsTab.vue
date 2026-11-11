<template>
  <div :class="['tc-layout', `bg-collapsed-${otherMode}`]" data-vue-tab="texts">
    <template v-for="col in COLUMNS" :key="col">
      <!-- Mitte: Texte + modusunabhängige Einstellungen je Slot -->
      <div v-if="col === 'main'" class="tc-main">
        <div class="tc-sticky tx-sticky">
          <UiSegmentedControl
            v-model="prevMode"
            label="👁 Vorschau & Textfarben bearbeiten für:"
            size="sm"
            :options="MODE_OPTIONS"
            data-tx-prevmode
          />
          <span class="hint tx-m0"
            >– der andere Modus ist seitlich zugeklappt; Schrift, Größe und Effekte in der Mitte
            gelten für beide.</span
          >
        </div>

        <div class="panel">
          <h2>
            Texte <span class="lang-badge">{{ lang.toUpperCase() }}</span>
          </h2>

          <div class="tx-box">
            <span class="hint tx-m0"
              >🚀 Die <strong>Hero-Texte</strong> (Titel, Untertitel, Button-Text) werden samt
              Schrift, Größe, Farbe und Effekten im Tab „Hero-Design“ bearbeitet.</span
            >
            <UiButton size="sm" class="tx-wrap" data-tx-gotodesign @click="gotoDesign()"
              >Zu „Hero-Design“ wechseln</UiButton
            >
          </div>

          <div class="tx-box tx-box--col">
            <UiButton size="sm" class="tx-wrap" data-tx-copy @click="copyDialogOpen = true">{{
              lang === 'de'
                ? '➡️ Diese Text-Einstellungen auf Englisch (EN) übernehmen'
                : '⬅️ Text-Einstellungen von Deutsch (DE) übernehmen'
            }}</UiButton>
            <p class="hint tx-m0">
              Kopiert die Text-Einstellungen der Abschnitts-Titel (Schriftart, Größe, Farbe
              <strong>Hell + Dunkel</strong>, Schatten, Umriss, Deckkraft, Animation sowie „Standard
              für alle Slots“) von Deutsch nach Englisch. Die <em>Texte</em> selbst bleiben je
              Sprache erhalten. Hero-Texte: siehe Tab „Hero-Design“.
            </p>
          </div>

          <section v-for="f in TEXT_FIELDS" :key="f.key" class="tx-slot" :data-tx-slot="f.key">
            <div class="tx-slot__head">
              <strong class="tx-slot__label">{{ f.label }}</strong>
              <label :class="['tx-master', { 'tx-master--on': slot(f).isMaster }]">
                <input
                  type="checkbox"
                  :checked="slot(f).isMaster"
                  data-tx-master
                  @change="toggleMaster(f, ($event.target as HTMLInputElement).checked)"
                />
                Standard für alle Slots
              </label>
              <button
                type="button"
                class="hd-reset"
                title="Text auf Standard zurücksetzen"
                aria-label="Text zurücksetzen"
                data-tx-reset="text"
                @click="reset(f, 'text')"
              >
                ↺ Text
              </button>
            </div>
            <p v-if="slot(f).inherited" class="hint tx-note" data-tx-note>
              🔒 Übernimmt Schriftart, Textgröße, Farben und Effekte von „{{ masterLabel }}“ und ist
              gesperrt.
            </p>
            <p v-else-if="slot(f).isMaster" class="hint tx-note" data-tx-note>
              ★ Master: Schriftart, Textgröße, Farben und Effekte gelten für alle Slots (alle
              anderen sind gesperrt).
            </p>

            <UiTextArea
              :model-value="drafts[f.key] ?? ''"
              :label="`${f.label}: Text`"
              :rows="2"
              :placeholder="defaultText(f)"
              :style="fieldFont(f)"
              data-tx-text
              @update:model-value="setText(f, $event)"
            />

            <div class="tx-row">
              <label class="tx-field tx-field--grow">
                <span>Schriftart</span>
                <span class="tx-inline">
                  <!-- Natives Select: Optionen erscheinen in ihrer eigenen Schrift. -->
                  <select
                    :value="st(f).font"
                    :disabled="slot(f).inherited"
                    :style="fieldFont(f)"
                    data-tx-font
                    @change="setFont(f, ($event.target as HTMLSelectElement).value)"
                  >
                    <option value="">Standard (System)</option>
                    <option
                      v-for="o in fontOptions(st(f).font)"
                      :key="o.name"
                      :value="o.name"
                      :style="
                        o.family ? { fontFamily: `'${o.family}', system-ui, sans-serif` } : {}
                      "
                    >
                      {{ o.label }}
                    </option>
                  </select>
                  <button
                    type="button"
                    class="hd-reset"
                    :disabled="slot(f).inherited"
                    title="Schriftart zurücksetzen"
                    aria-label="Schriftart zurücksetzen"
                    data-tx-reset="font"
                    @click="reset(f, 'font')"
                  >
                    ↺
                  </button>
                </span>
              </label>
              <label class="tx-field">
                <span>Textgröße (px, 0=Standard)</span>
                <span class="tx-inline">
                  <input
                    type="number"
                    min="0"
                    max="120"
                    step="1"
                    class="tx-num tx-num--w"
                    :value="st(f).size || 0"
                    :disabled="slot(f).inherited"
                    data-tx-size
                    @input="setSize(f, ($event.target as HTMLInputElement).value)"
                    @change="syncInput($event, st(f).size || 0)"
                  />
                  <button
                    type="button"
                    class="hd-reset"
                    :disabled="slot(f).inherited"
                    title="Auf Standard zurücksetzen"
                    aria-label="Größe zurücksetzen"
                    data-tx-reset="size"
                    @click="reset(f, 'size')"
                  >
                    ↺
                  </button>
                </span>
              </label>
            </div>

            <TextFxFields
              :st="st(f)"
              :label="f.label"
              :open="isFxOpen(f)"
              :disabled="slot(f).inherited"
              @set="(field, v) => setFx(f, field, v)"
              @set-num="(field, v) => setFxNum(f, field, v)"
              @reset="reset(f, 'fx')"
              @toggle="textsUi.fxOpen[f.key] = $event"
            />
            <p class="hint">
              Leer lassen = Standardtext. Mehrere Zeilen mit Enter; Größe 0 = Standard. Schrift,
              Größe und Effekte gelten für Hell und Dunkel; die <strong>Textfarbe</strong> je Modus
              steht links (Hell) und rechts (Dunkel) mit Vorschau.
            </p>
          </section>
        </div>
      </div>

      <!-- Seitenleiste des nicht bearbeiteten Modus: schmale, klickbare Leiste -->
      <aside
        v-else-if="col !== prevMode"
        class="tc-side tc-side--collapsed"
        :data-tcside="col"
        :data-tx-showmode="col"
        role="button"
        tabindex="0"
        :title="`${col === 'dark' ? 'Dunkelmodus' : 'Hellmodus'} anzeigen und bearbeiten`"
        @click="prevMode = col"
        @keydown.enter.prevent="prevMode = col"
        @keydown.space.prevent="prevMode = col"
      >
        <span class="tx-icon" aria-hidden="true">{{ col === 'dark' ? '🌙' : '☀️' }}</span>
        <span class="tc-side-vlabel"
          >{{ col === 'dark' ? 'Dunkelmodus' : 'Hellmodus' }} – anklicken zum Bearbeiten</span
        >
      </aside>

      <!-- Seitenleiste des bearbeiteten Modus: Vorschau + Textfarbe je Slot -->
      <aside v-else class="tc-side" :data-tcside="col" :data-tx-side="col">
        <div :class="['tc-side-head', col]">
          {{ col === 'dark' ? '🌙 Dunkelmodus' : '☀️ Hellmodus' }}
        </div>
        <div class="tx-inline tx-side-actions">
          <button
            type="button"
            class="hd-reset"
            title="Textfarben aller Slots in den anderen Modus übertragen"
            :data-tx-copymode="col"
            @click="copyModeColors(col)"
          >
            {{ col === 'dark' ? '⬅️ Farben nach Hell kopieren' : '➡️ Farben nach Dunkel kopieren' }}
          </button>
        </div>
        <p class="hint tx-m0">
          Vorschau und Textfarbe der Abschnitts-Titel im {{ MODE_WORD[col] }}modus. Leere Farbe (↺)
          = Seitenstandard.
        </p>
        <div v-for="f in TEXT_FIELDS" :key="f.key" class="tx-side-slot">
          <strong class="tx-side-slot__label">{{ f.label }}</strong>
          <div class="tx-prevbox" :style="{ background: PREVIEW_BG[col] }">
            <div :class="slotAnimClass(st(f))" :style="previewStyle(f, col)" :data-tx-preview="col">
              {{ previewOf(f) }}
            </div>
          </div>
          <span class="tx-colorlabel"
            >Textfarbe ({{ MODE_WORD[col] }})<span v-if="slot(f).inherited" class="hint tx-m0">
              🔒 vom Master</span
            ><span v-else-if="!st(f)[colorField(col)]" class="hint tx-m0"> · Standard</span></span
          >
          <span class="tx-inline">
            <ColorField
              :model-value="st(f)[colorField(col)] || DEFAULT_TEXT_COLOR[col]"
              :disabled="slot(f).inherited"
              :label="`${f.label}: Textfarbe ${MODE_WORD[col]}`"
              :data-tx-color="col"
              @update:model-value="setColor(f, col, $event)"
            />
            <button
              type="button"
              class="hd-reset"
              :disabled="slot(f).inherited"
              :title="`Farbe (${MODE_WORD[col]}) auf Standard zurücksetzen`"
              aria-label="Farbe zurücksetzen"
              data-tx-reset="color"
              @click="reset(f, 'color', col)"
            >
              ↺
            </button>
          </span>
        </div>
      </aside>
    </template>

    <UiDialog
      :open="copyDialogOpen"
      title="Text-Einstellungen nach Englisch übernehmen?"
      description="Die Text-Einstellungen der Abschnitts-Titel für Englisch werden mit den deutschen überschrieben (Schriftart, Größe, Farbe Hell + Dunkel, Schatten, Umriss, Deckkraft, Animation, „Standard für alle Slots“). Die Texte selbst und die Hero-Texte bleiben unverändert."
      @close="copyDialogOpen = false"
    >
      <template #footer>
        <UiButton variant="ghost" @click="copyDialogOpen = false">Abbrechen</UiButton>
        <UiButton variant="primary" data-tx-copy-confirm @click="confirmCopy">Übernehmen</UiButton>
      </template>
    </UiDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import type { FontEntry, Lang, Overrides, ThemeMode } from '../../../types';
import { delPath, getPath, setPath } from '../../../public/model-core';
import {
  ColorField,
  UiButton,
  UiDialog,
  UiSegmentedControl,
  UiTextArea,
} from '../../components/ui';
import { useToastStore } from '../../stores/toast';
import {
  DEFAULT_TEXT_COLOR,
  PREVIEW_BG,
  TEXT_FIELDS,
  TEXT_FX_DEFAULTS,
  clampFx,
  clampTextSize,
  colorField,
  copyColors,
  copyStylesDeToEn,
  effectiveTextStyle,
  ensureTextStyle,
  fontFamilyCss,
  fxActive,
  previewText,
  slotAnimClass,
  slotPreviewStyle,
  slotState,
  type FxField,
  type FxNumField,
  type TextField,
  type TextStyle,
  type TextStyleHost,
} from './textStyle';
import TextFxFields from './TextFxFields.vue';
import { textsUi } from './textsUi';

/**
 * Tab „Texte“ einer Sprache (Vue-Fassung von `renderTexts` in
 * `public/content.js`). Bearbeitet die übergebenen Objekte
 * `state.overrides[lang]` und `state.media[lang]` direkt: Speichern, Autosave
 * und Undo/Redo des Vanilla-Admins erkennen Änderungen weiterhin per Snapshot;
 * nach Undo/Redo wird der Tab mit den wiederhergestellten Objekten neu gemountet.
 */
const props = defineProps<{
  lang: Lang;
  /** `state.overrides[lang]` */
  overrides: Overrides;
  /** `state.defaults[lang]` (Standardtexte als Platzhalter) */
  defaults: Overrides;
  /** `state.media[lang]` */
  media: TextStyleHost;
  /** `state.media.de` / `state.media.en` für „DE → EN übernehmen“. */
  mediaDe: TextStyleHost;
  mediaEn: TextStyleHost;
  fonts: FontEntry[];
  /** Lädt eine Schrift per @font-face in die Admin-Seite, liefert den Family-Namen. */
  ensureFontFace: (file: string) => string;
  /** Wechselt zum Tab „Hero-Design“ dieser Sprache. */
  gotoDesign: () => void;
}>();

// reactive() auf die Roh-Objekte: Änderungen landen direkt im state.
const overrides = reactive(props.overrides);
const media = reactive(props.media);
const toasts = useToastStore();

type Column = ThemeMode | 'main';
const COLUMNS: Column[] = ['light', 'main', 'dark'];
const MODE_WORD: Record<ThemeMode, string> = { light: 'Hell', dark: 'Dunkel' };
const MODE_OPTIONS = [
  { value: 'light', label: '☀️ Hell' },
  { value: 'dark', label: '🌙 Dunkel' },
];

// UI-Zustand bleibt über Neu-Mounts (Undo, Sprachwechsel) erhalten.
const prevMode = computed<ThemeMode>({
  get: () => textsUi.prevMode,
  set: (m) => (textsUi.prevMode = m === 'dark' ? 'dark' : 'light'),
});
const otherMode = computed<ThemeMode>(() => (prevMode.value === 'light' ? 'dark' : 'light'));

// Effektiver Stil je Slot (liest nur, legt nichts im state an).
const styles = computed<Record<string, TextStyle>>(() =>
  Object.fromEntries(TEXT_FIELDS.map((f) => [f.key, effectiveTextStyle(media, f.key)])),
);
const st = (f: TextField): TextStyle => styles.value[f.key]!;
const slot = (f: TextField) => slotState(media, f.key);
const masterLabel = computed(() => {
  const m = TEXT_FIELDS.find((x) => x.key === media.textStyleUniformKey);
  return m ? m.label : (media.textStyleUniformKey ?? '');
});

// ---- Texte (Overrides) -----------------------------------------------------
// Eingabe-Puffer je Slot: hält z. B. ein einzelnes Leerzeichen sichtbar, obwohl
// der Override bei leerem Inhalt entfernt wird (wie die frühere Vanilla-Fassung).
const drafts = reactive<Record<string, string>>(
  Object.fromEntries(
    TEXT_FIELDS.map((f) => {
      const cur = getPath(props.overrides, f.path);
      return [f.key, cur != null ? String(cur) : ''];
    }),
  ),
);
function defaultText(f: TextField): string {
  const d = getPath(props.defaults, f.path);
  return d != null ? String(d) : '';
}
function setText(f: TextField, v: string) {
  drafts[f.key] = v;
  if (v.trim() === '') delPath(overrides, f.path);
  else setPath(overrides, f.path, v);
}
function previewOf(f: TextField): string {
  return previewText(getPath(overrides, f.path), getPath(props.defaults, f.path), f.label);
}

// ---- Schrift ------------------------------------------------------------------
function familyOf(font: string): string {
  return font ? props.ensureFontFace(font) : '';
}
function fieldFont(f: TextField) {
  const fam = familyOf(st(f).font);
  return fam ? { fontFamily: fontFamilyCss(fam) } : {};
}
function fontOptions(current: string) {
  const list = props.fonts.slice();
  if (current && !list.some((x) => x.name === current))
    list.unshift({ name: current, label: `${current} (nicht gefunden)`, url: '', bytes: 0 });
  return list.map((x) => ({
    name: x.name,
    label: x.label || x.name,
    family: props.ensureFontFace(x.name),
  }));
}
function previewStyle(f: TextField, mode: ThemeMode): string {
  const s = st(f);
  return slotPreviewStyle(s, mode, familyOf(s.font));
}

// ---- Stil schreiben (immer in den EIGENEN Slot; gesperrte Slots sind disabled)
const own = (f: TextField) => ensureTextStyle(media, f.key);
function setSize(f: TextField, v: string) {
  own(f).size = clampTextSize(v);
}
function setFont(f: TextField, v: string) {
  own(f).font = v;
}
function setColor(f: TextField, mode: ThemeMode, hex: string) {
  own(f)[colorField(mode)] = hex;
}
function setFx(f: TextField, field: FxField, v: string | boolean) {
  const s = own(f);
  if (field === 'shadow') s.shadow = v === true;
  else if (field === 'anim') s.anim = v as TextStyle['anim'];
  else if (field === 'animSpeed') s.animSpeed = v as TextStyle['animSpeed'];
  else s[field] = String(v);
}
function setFxNum(f: TextField, field: FxNumField, v: string) {
  own(f)[field] = clampFx(field, v);
}
/** Nach Verlassen eines Zahlenfelds den (begrenzten) gespeicherten Wert zeigen. */
function syncInput(e: Event, v: number) {
  (e.target as HTMLInputElement).value = String(v);
}

type ResetWhat = 'text' | 'size' | 'color' | 'font' | 'fx';
function reset(f: TextField, what: ResetWhat, mode: ThemeMode = 'light') {
  switch (what) {
    case 'text':
      delPath(overrides, f.path);
      drafts[f.key] = '';
      break;
    case 'size':
      own(f).size = 0;
      break;
    case 'color':
      own(f)[colorField(mode)] = '';
      break;
    case 'font':
      own(f).font = '';
      break;
    case 'fx':
      Object.assign(own(f), TEXT_FX_DEFAULTS);
      break;
  }
  toasts.addToast('Auf Standard zurückgesetzt', { type: 'success' });
}

// ---- Effekte auf-/zuklappen -------------------------------------------------
function isFxOpen(f: TextField): boolean {
  return textsUi.fxOpen[f.key] ?? fxActive(st(f));
}

// ---- Master, Farben kopieren, DE → EN --------------------------------------
function toggleMaster(f: TextField, checked: boolean) {
  media.textStyleUniform = checked;
  if (checked) media.textStyleUniformKey = f.key;
  toasts.addToast(
    checked
      ? `„${f.label}“ ist Master – alle anderen Slots übernehmen seinen Stil und sind gesperrt`
      : 'Jeder Slot nutzt wieder seinen eigenen Stil',
  );
}
function copyModeColors(from: ThemeMode) {
  const to = copyColors(media, from);
  toasts.addToast(`Textfarben nach ${MODE_WORD[to]} kopiert`, { type: 'success' });
}

const copyDialogOpen = ref(false);
function confirmCopy() {
  copyDialogOpen.value = false;
  // reactive(): ist die aktuelle Sprache EN, ist das derselbe Proxy wie `media`.
  copyStylesDeToEn(reactive(props.mediaDe), reactive(props.mediaEn));
  toasts.addToast(
    'Text-Einstellungen von Deutsch nach Englisch übernommen (Hell + Dunkel + Effekte)',
    {
      type: 'success',
    },
  );
}
</script>

<style scoped>
.tx-m0 {
  margin: 0;
}
.tx-sticky {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
  margin-bottom: var(--ds-space-3);
}
.tx-box {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--ds-space-3);
  margin: var(--ds-space-1) 0 var(--ds-space-3);
  padding: var(--ds-space-2) var(--ds-space-3);
  border: var(--ds-border-width) dashed var(--ds-border);
  border-radius: var(--ds-radius-md);
}
.tx-box > * {
  min-width: 0;
  max-width: 100%;
}
/* Lange Beschriftungen dürfen auf schmalen Bildschirmen umbrechen. */
.tx-box .tx-wrap {
  height: auto;
  min-height: var(--ds-control-sm);
  padding-block: var(--ds-space-1);
  white-space: normal;
  line-height: 1.3;
  text-align: left;
}
.tx-box--col {
  flex-direction: column;
  align-items: flex-start;
  gap: var(--ds-space-2);
}
.tx-slot {
  margin-top: var(--ds-space-4);
  padding-top: var(--ds-space-3);
  border-top: var(--ds-border-width) solid var(--ds-border);
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
}
.tx-slot__head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--ds-space-3);
}
.tx-master {
  display: inline-flex;
  align-items: center;
  gap: var(--ds-space-1);
  margin: 0;
  color: var(--ds-text-3);
  font-size: var(--ds-text-xs);
  cursor: pointer;
}
.tx-master--on {
  color: var(--ds-accent);
}
.tx-master input {
  width: auto;
  margin: 0;
}
.tx-note {
  margin: 0;
  color: var(--ds-accent);
}
.tx-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--ds-space-3);
  margin-top: var(--ds-space-2);
}
.tx-field {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
  margin: 0;
  color: var(--ds-text-2);
  font-size: var(--ds-text-sm);
}
.tx-field--grow {
  flex: 1 1 200px;
}
.tx-inline {
  display: flex;
  align-items: center;
  gap: var(--ds-space-1);
}
.tx-num {
  width: 90px;
}
.tx-num--w {
  width: 120px;
}
.tx-icon {
  font-size: 1.3rem;
}
.tx-side-actions {
  margin: var(--ds-space-2) 0 var(--ds-space-1);
}
.tx-side-slot {
  margin-top: var(--ds-space-3);
  padding-top: var(--ds-space-2);
  border-top: var(--ds-border-width) dashed var(--ds-border);
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
}
.tx-side-slot__label,
.tx-colorlabel {
  font-size: var(--ds-text-sm);
  color: var(--ds-text-2);
}
.tx-prevbox {
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-md);
  padding: var(--ds-space-2) var(--ds-space-3);
  overflow: hidden;
}
</style>
