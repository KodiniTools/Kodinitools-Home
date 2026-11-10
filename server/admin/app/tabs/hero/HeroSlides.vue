<template>
  <details :open="slides.length > 0" class="hd-slides" :data-hdslides="mode">
    <summary class="hd-slides-sum">
      🎞️ Diashow – weitere Bilder{{ slides.length ? ` (${slides.length})` : '' }}
    </summary>
    <div class="hd-slides-body">
      <p class="hint hd-m0">
        Weitere Bilder wechseln sich mit dem Hintergrundbild (Bild 1) ab; Bearbeitung (Deckkraft,
        Abdunkelung …) gilt für alle. Bis zu {{ service.slidesMax }} weitere Bilder, gleiche
        Abmessungen empfohlen.
      </p>
      <p v-if="!slides.length" class="hint hd-m0">
        Noch keine weiteren Bilder – das Hintergrundbild bleibt statisch.
      </p>
      <div
        v-for="(v, i) in slides"
        :key="i + ':' + v"
        class="hd-sliderow"
        :data-hdsliderow="`${mode}:${i}`"
      >
        <span class="hint hd-m0 hd-slidenr">{{ i + 2 }}.</span>
        <div
          :class="['bg-thumb', 'hd-slidethumb', { 'hd-slidethumb--on': isCurrent(i) }]"
          :data-hdslidethumb="`${mode}:${i}`"
          :title="slideTitle(v)"
        >
          <img v-if="service.slideInfo(v)" :src="service.slideInfo(v)!.src" alt="" />
          <span v-else class="hint hd-m0">?</span>
        </div>
        <span class="hd-btns">
          <button
            type="button"
            class="hd-reset"
            :disabled="i === 0"
            title="Nach vorn"
            aria-label="Nach vorn"
            data-hdslideup
            @click="move(i, -1)"
          >
            ↑
          </button>
          <button
            type="button"
            class="hd-reset"
            :disabled="i === slides.length - 1"
            title="Nach hinten"
            aria-label="Nach hinten"
            data-hdslidedown
            @click="move(i, 1)"
          >
            ↓
          </button>
          <button
            type="button"
            class="hd-reset danger"
            title="Aus der Diashow entfernen"
            aria-label="Aus der Diashow entfernen"
            data-hdslideremove
            @click="remove(i)"
          >
            ✕
          </button>
        </span>
      </div>
      <div class="hd-line">
        <UiButton
          size="sm"
          :disabled="slides.length >= service.slidesMax"
          data-hdslideadd
          @click="add"
          >📂 Aus Mediathek anhängen</UiButton
        >
        <UiButton
          v-if="slides.length"
          size="sm"
          variant="danger"
          data-hdslideclear
          @click="emit('askClear')"
          >Alle entfernen</UiButton
        >
      </div>
      <SliderControl
        :model-value="ss.interval"
        label="Anzeigedauer je Bild"
        :min="1"
        :max="30"
        :default-value="ssDef.interval"
        :disabled="!slides.length"
        :value-text="`${ss.interval} s`"
        input-class="hd-ss-interval"
        @update:model-value="setSs({ interval: clampSlideshow('interval', $event) })"
      />
      <SliderControl
        :model-value="ss.duration"
        label="Übergangsdauer"
        :min="0"
        :max="5000"
        :step="50"
        :default-value="ssDef.duration"
        :disabled="!slides.length"
        :value-text="`${ss.duration} ms`"
        @update:model-value="setSs({ duration: clampSlideshow('duration', $event) })"
      />
      <UiSelect
        :model-value="ss.transition"
        label="Übergang"
        size="sm"
        :disabled="!slides.length"
        :options="transitionOptions"
        data-hd-transition
        @update:model-value="setTransition(String($event))"
      />
      <UiSwitch
        :model-value="ss.pauseOnHover"
        label="Pause bei Mauszeiger"
        :disabled="!slides.length"
        @update:model-value="setSs({ pauseOnHover: $event })"
      />
      <UiSwitch
        :model-value="ss.dots"
        label="Punkte zum Umschalten"
        :disabled="!slides.length"
        @update:model-value="setSs({ dots: $event })"
      />
      <p class="hint hd-m0">
        Die Vorschau oben wechselt die Bilder im Takt; „Pause bei Mauszeiger“ gilt auf der Seite für
        den ganzen Hero-Kasten.
      </p>
    </div>
  </details>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ThemeMode } from '../../../types';
import { SliderControl, UiButton, UiSelect, UiSwitch } from '../../components/ui';
import { TRANSITION_LABEL, clampSlideshow } from '../media/mediaData';
import { MODE_NAME, slidesOf, type HeroSlideshow } from './heroData';
import { hdUi } from './heroUi';
import { useHero } from './useHero';

/**
 * Hintergrund-Diashow eines Modus (wie `heroSlidesBody` in `public/design.js`):
 * weitere Bilder anhängen, ordnen, entfernen, plus Takt/Übergang. Das
 * Hintergrundbild selbst ist Bild 1.
 */
const props = defineProps<{ mode: ThemeMode }>();
const emit = defineEmits<{ askClear: [] }>();
const { service, side, toast } = useHero();

const s = computed(() => side(props.mode));
const slides = computed(() => (Array.isArray(s.value.bgSlides) ? s.value.bgSlides : []));
const ssDef = service.slideshowDefault();
const ss = computed<HeroSlideshow>(() => s.value.bgSlideshow ?? ssDef);
const transitionOptions = service.transitions.map((t) => ({
  value: t,
  label: TRANSITION_LABEL[t] ?? t,
}));

/** Rahmen des gerade in der Vorschau gezeigten Bildes (nur im bearbeiteten Modus). */
const isCurrent = (i: number) => props.mode === hdUi.prevMode && hdUi.slideIdx === i + 1;
function slideTitle(v: string) {
  const info = service.slideInfo(v);
  return info && info.name ? `${info.name} – lokal` : v;
}
function setSs(patch: Partial<HeroSlideshow>) {
  const side = s.value;
  if (!side.bgSlideshow || typeof side.bgSlideshow !== 'object')
    side.bgSlideshow = service.slideshowDefault();
  Object.assign(side.bgSlideshow, patch);
}
function setTransition(v: string) {
  setSs({ transition: service.transitions.includes(v) ? v : 'fade' });
}
function move(i: number, dir: number) {
  const list = slidesOf(s.value);
  const j = i + dir;
  if (j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j]!, list[i]!];
}
function remove(i: number) {
  slidesOf(s.value).splice(i, 1);
  toast('Bild aus der Diashow entfernt');
}
function add() {
  const ok = service.pick(
    'heroslide',
    `Weiteres Bild für die Hero-Diashow (${MODE_NAME[props.mode]}) wählen`,
    (url) => {
      const list = slidesOf(s.value);
      if (list.length >= service.slidesMax) {
        toast(`Maximal ${service.slidesMax} weitere Bilder`, { type: 'warning' });
        return;
      }
      list.push(url);
      toast('Bild an die Diashow angehängt');
    },
  );
  if (!ok)
    toast('Keine Bilder vorhanden — zuerst im Tab „Dateien“ eine Datei hinzufügen.', {
      type: 'info',
    });
}
</script>

<style scoped>
.hd-slides {
  margin-top: var(--ds-space-2);
  border-top: 1px dashed var(--border);
  padding-top: var(--ds-space-2);
}
.hd-slides-body {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
  padding-top: var(--ds-space-2);
}
.hd-slides-sum {
  cursor: pointer;
  color: var(--text);
  font-weight: 600;
}
.hd-m0 {
  margin: 0;
}
.hd-line {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  flex-wrap: wrap;
}
.hd-sliderow {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
}
.hd-slidenr {
  flex: 0 0 1.6rem;
  text-align: right;
}
.hd-slidethumb {
  width: 72px;
  height: 40px;
}
.hd-slidethumb--on {
  outline: 2px solid var(--accent);
}
.hd-btns {
  display: inline-flex;
  gap: var(--ds-space-1);
  margin-left: auto;
}
</style>
