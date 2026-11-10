<template>
  <div
    :class="['panel', 'ly-cell', { 'ly-cell--hidden': hidden, 'ly-cell--active': active }]"
    :data-celleditor="i"
    @focusin="markCell(i)"
  >
    <div class="ly-line">
      <strong class="ly-title">Kachel {{ i + 1 }}{{ big ? ' (groß)' : '' }}</strong>
      <UiSwitch
        :model-value="!hidden"
        label="anzeigen"
        title="Ausgeblendet: Kachel entfällt auf der Seite, die übrigen teilen den Platz symmetrisch; Einblenden stellt die Anordnung wieder her"
        :data-cellshow="i"
        @update:model-value="setShown"
      />
      <span v-if="hidden" class="hint ly-m0 ly-accent">ausgeblendet</span>
    </div>
    <p v-if="inh" class="hint ly-note">
      ↳ Bildbearbeitung und Schriftart von Kachel {{ master + 1 }}; Bild und Text bleiben eigen.
    </p>

    <div class="ly-line ly-start">
      <div class="bg-thumb" :data-cellimgthumb="i">
        <template v-if="med">
          <video v-if="med.isVid" :src="med.src" muted class="ly-cover"></video>
          <img v-else :src="med.src" alt="" />
        </template>
        <span v-else class="hint ly-m0">Kein Bild</span>
      </div>
      <div class="ly-grow">
        <div class="ly-line">
          <UiButton
            size="sm"
            title="Bild aus der Zwischenablage in diese Kachel einfügen (oder Kachel anklicken und Strg/Cmd+V drücken)"
            :data-cellpaste="i"
            @click="paste"
            >📋 Aus Zwischenablage einfügen</UiButton
          >
          <UiButton size="sm" :data-cellimgpick="i" @click="pick">📂 Aus Mediathek</UiButton>
          <UiButton
            size="sm"
            variant="danger"
            :disabled="!med"
            :data-cellimgclear="i"
            @click="clear"
            >Entfernen</UiButton
          >
        </div>
        <p class="hint ly-info">
          Bild kopieren (z. B. Screenshot), Kachel anklicken und <kbd>Strg</kbd>/<kbd>Cmd</kbd>+<kbd
            >V</kbd
          >
          drücken – oder den Button nutzen.
          <template v-if="med && med.localName">
            <strong
              >● {{ med.localName
              }}{{ med.bytes ? ` · ${service.fmtBytes(med.bytes)}` : '' }}</strong
            >
            – lokal, wird beim Veröffentlichen hochgeladen.
          </template>
          <code v-else-if="med">{{ val }}</code>
          <template v-else>
            Empfohlen: <strong>{{ service.gridDims[ratio] }}</strong
            >{{ view.m.heroLayout === 'mosaic' ? ' (Mosaik: große Kachel doppelt so hoch)' : '' }}.
          </template>
        </p>
      </div>
    </div>
    <div
      :class="['ly-sliders', { 'ly-dim': !med && !view.m.heroGridUniform }]"
      :data-cellimgrow="i"
    >
      <SliderControl
        v-for="(c, f) in service.imgFields"
        :key="f"
        :model-value="s[f]"
        :label="c.label"
        :min="c.min"
        :max="c.max"
        :default-value="def[f]"
        :disabled="inh"
        :value-text="`${s[f]} ${c.unit}`"
        :input-class="`ly-cell-${f}`"
        @update:model-value="set(f, $event)"
      />
    </div>

    <details :open="slidesOpen" class="ly-slides" :data-cellslides="i" @toggle="onSlidesToggle">
      <summary>🎞️ Diashow – weitere Bilder{{ slides.length ? ` (${slides.length})` : '' }}</summary>
      <p class="hint ly-m0 ly-mt">
        Wechseln sich mit dem Kachel-Bild ab; Einstellungen (Takt, Übergang) gelten für alle Kacheln
        – siehe Mitte.
      </p>
      <p v-if="!slides.length" class="hint ly-m0 ly-mt">Noch keine weiteren Bilder.</p>
      <div
        v-for="(v, j) in slides"
        :key="j + ':' + v"
        class="ly-sliderow"
        :data-cellsliderow="`${i}:${j}`"
      >
        <span class="hint ly-m0 ly-nr">{{ j + 2 }}.</span>
        <div
          class="bg-thumb ly-slidethumb"
          :data-cellslidethumb="`${i}:${j}`"
          :title="slideTitle(v)"
        >
          <img v-if="service.resolve(v)" :src="service.resolve(v)!.src" alt="" />
          <span v-else class="hint ly-m0">?</span>
        </div>
        <span class="ly-btns-s">
          <button
            type="button"
            class="hd-reset"
            :disabled="j === 0"
            title="Nach vorn"
            aria-label="Nach vorn"
            :data-cellslideup="`${i}:${j}`"
            @click="moveSlide(slides, j, -1)"
          >
            ↑
          </button>
          <button
            type="button"
            class="hd-reset"
            :disabled="j === slides.length - 1"
            title="Nach hinten"
            aria-label="Nach hinten"
            :data-cellslidedown="`${i}:${j}`"
            @click="moveSlide(slides, j, 1)"
          >
            ↓
          </button>
          <button
            type="button"
            class="hd-reset danger"
            title="Aus der Diashow entfernen"
            aria-label="Aus der Diashow entfernen"
            :data-cellslideremove="`${i}:${j}`"
            @click="slides.splice(j, 1)"
          >
            ✕
          </button>
        </span>
      </div>
      <div class="ly-line ly-mt">
        <button
          type="button"
          class="hd-reset"
          :disabled="full"
          title="Bild aus der Zwischenablage anhängen"
          :data-cellslidepaste="i"
          @click="service.paste(`cellslide:${i}`)"
        >
          📋 Anhängen
        </button>
        <button
          type="button"
          class="hd-reset"
          :disabled="full"
          :data-cellslideadd="i"
          @click="addSlide"
        >
          📂 Aus Mediathek anhängen
        </button>
      </div>
    </details>

    <div class="ly-line ly-end ly-mt">
      <div class="ly-field ly-grow">
        <label :for="`${uid}-text`">Text (über dem Bild / im leeren Kasten)</label>
        <span class="ly-line ly-nowrap">
          <textarea
            :id="`${uid}-text`"
            class="ly-text"
            rows="2"
            placeholder="z.B. Neu (Enter = neue Zeile)"
            :value="s.text"
            :style="fontDecl(s.font)"
            :data-cellfield="`${i}:text`"
            @input="cell(i).text = ($event.target as HTMLTextAreaElement).value"
          ></textarea>
          <ResetBtn field="text" @reset="reset('text')" />
        </span>
      </div>
      <span class="ly-line ly-end ly-nowrap">
        <UiSelect
          :model-value="s.font"
          label="Schriftart des Textes"
          size="sm"
          :disabled="inh"
          :options="fontOptions(s.font)"
          :style="fontDecl(s.font)"
          :data-cellfont="i"
          @update:model-value="cell(i).font = String($event)"
        />
        <ResetBtn field="font" :disabled="inh" @reset="reset('font')" />
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useId } from 'vue';
import { SliderControl, UiButton, UiSelect, UiSwitch } from '../../components/ui';
import ResetBtn from '../media/ResetBtn.vue';
import { moveSlide } from './layoutData';
import {
  isHidden,
  masterCell,
  normRatio,
  resetCellField,
  setCellField,
  setHidden,
  type CellField,
} from './gridData';
import { lyUi } from './layoutUi';
import { useLayout } from './useLayout';

/**
 * Linke Seitenleiste im Raster-Modus: Inhalt einer Kachel (wie
 * `cellContentEditor` in `public/layout-grid.js`) – Ein-/Ausblenden, Bild aus
 * Zwischenablage/Mediathek mit Bildbearbeitung, Diashow, Text und Schriftart.
 */
const props = defineProps<{ i: number; big: boolean }>();
const {
  view,
  service,
  cell,
  effCell,
  inherited,
  cellSlides,
  markCell,
  fontDecl,
  fontOptions,
  toast,
} = useLayout();

const uid = `ly-gc-${useId()}`;
const s = computed(() => effCell(props.i));
const inh = computed(() => inherited(props.i));
const master = computed(() => masterCell(view.value.m) ?? 0);
const hidden = computed(() => isHidden(view.value.m, props.i));
const active = computed(() => lyUi.activeCell === props.i);
const val = computed(() => view.value.m.heroGrid?.[props.i] || '');
const med = computed(() => service.resolve(val.value));
const ratio = computed(() => normRatio(view.value.m.heroGridRatio));
const def = service.cellDefault();
const slides = computed(() => cellSlides(props.i));
const full = computed(() => slides.value.length >= service.slidesMax);
// Auf/zu: Startwert = „hat Bilder“, danach wie vom Admin geklickt.
const slidesOpen = ref(slides.value.length > 0);
function onSlidesToggle(e: Event) {
  slidesOpen.value = (e.target as HTMLDetailsElement).open;
}

function setShown(on: boolean) {
  setHidden(view.value.m, props.i, !on);
  toast(on ? `Kachel ${props.i + 1} eingeblendet` : `Kachel ${props.i + 1} ausgeblendet`);
}
function set(f: CellField, raw: number | string) {
  setCellField(cell(props.i), f, raw, service.imgFields);
}
function reset(f: CellField) {
  resetCellField(cell(props.i), f, service.cellDefault());
  toast('Auf Standard zurückgesetzt');
}
function setImage(url: string) {
  const g = view.value.m;
  if (!Array.isArray(g.heroGrid)) g.heroGrid = ['', '', '', '', '', ''];
  g.heroGrid[props.i] = url;
}
function paste() {
  markCell(props.i);
  service.paste(props.i);
}
function pick() {
  markCell(props.i);
  const ok = service.pick(
    { cell: props.i },
    `Bild/Video für Kachel ${props.i + 1} wählen`,
    setImage,
  );
  if (!ok)
    toast('Keine Medien vorhanden — Bild einfügen oder im Tab „Medien“ hochladen.', {
      type: 'info',
    });
}
function clear() {
  markCell(props.i);
  setImage('');
  toast(`Bild aus Kachel ${props.i + 1} entfernt`);
}
function slideTitle(v: string) {
  const info = service.resolve(v);
  return info && info.localName ? `${info.localName} – lokal` : v;
}
function addSlide() {
  const i = props.i;
  const ok = service.pick(
    { cellSlide: i },
    `Weiteres Bild für die Diashow von Kachel ${i + 1} wählen`,
    (url) => {
      const list = cellSlides(i);
      if (list.length >= service.slidesMax) {
        toast(`Maximal ${service.slidesMax} weitere Bilder`, { type: 'warning' });
        return;
      }
      list.push(url);
      markCell(i);
      toast(`Bild an die Diashow von Kachel ${i + 1} angehängt`);
    },
  );
  if (!ok)
    toast('Keine Bilder vorhanden — Bild einfügen oder im Tab „Dateien“ hochladen.', {
      type: 'info',
    });
}
</script>

<style scoped>
.ly-m0 {
  margin: 0;
}
.ly-mt {
  margin-top: 0.4rem;
}
.ly-cell {
  padding: 0.7rem 0.9rem;
  margin-bottom: 0.6rem;
  scroll-margin-top: 0.5rem;
}
.ly-cell--hidden {
  opacity: 0.75;
}
.ly-cell--active {
  box-shadow: 0 0 0 2px var(--accent);
}
.ly-title {
  font-size: 0.85rem;
}
.ly-accent {
  color: var(--accent);
}
.ly-note {
  margin: 0.3rem 0 0;
  color: var(--accent);
}
.ly-line {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.4rem 0.6rem;
}
.ly-nowrap {
  flex-wrap: nowrap;
}
.ly-start {
  align-items: flex-start;
  margin-top: 0.5rem;
}
.ly-end {
  align-items: flex-end;
}
.ly-grow {
  flex: 1 1 200px;
  min-width: 0;
}
.ly-grow textarea {
  flex: 1 1 auto;
  min-width: 0;
}
.ly-info {
  margin: 0.4rem 0 0;
}
.ly-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.ly-sliders {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
  margin-top: 0.4rem;
}
.ly-dim {
  opacity: 0.55;
}
.ly-slides {
  margin-top: 0.5rem;
}
.ly-slides summary {
  cursor: pointer;
  color: var(--text);
}
.ly-sliderow {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin: 0.3rem 0;
}
.ly-nr {
  flex: 0 0 1.6rem;
  text-align: right;
}
.ly-slidethumb {
  width: 64px;
  height: 40px;
}
.ly-btns-s {
  display: inline-flex;
  gap: 0.2rem;
  margin-left: auto;
}
.ly-field {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
  margin: 0;
  color: var(--ds-text-2);
  font-size: var(--ds-text-sm);
}
</style>
