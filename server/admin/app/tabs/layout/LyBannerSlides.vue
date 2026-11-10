<template>
  <div class="panel" data-bannerslidesblock>
    <h2 class="ly-h2">🎞️ Diashow – weitere Bilder</h2>
    <p class="hint">
      Weitere Bilder wechseln sich mit dem Banner (Bild 1) ab. Gleiche Größe wie das Banner
      empfohlen (ca. 1800 × 480 px); nur Bilder, keine Videos. Bis zu
      {{ service.slidesMax }} weitere Bilder.
    </p>
    <div data-slidelist>
      <p v-if="!rows.length" class="hint ly-empty">
        Noch keine weiteren Bilder – das Banner bleibt statisch.
      </p>
      <div v-for="(r, i) in rows" :key="i + ':' + r.val" class="ly-sliderow" :data-sliderow="i">
        <span class="hint ly-m0 ly-nr">{{ i + 2 }}.</span>
        <div
          :class="['bg-thumb', 'ly-slidethumb', { 'ly-slidethumb--on': lyUi.slideIdx === i + 1 }]"
          :data-slidethumb="i"
        >
          <img v-if="r.info" :src="r.info.src" alt="" />
          <span v-else class="hint ly-m0">?</span>
        </div>
        <div class="ly-label">
          <p :class="['st', r.info?.localName ? 'local' : 'pub', 'ly-ellipsis']">
            {{ slideLabel(r) }}
          </p>
        </div>
        <span class="ly-btns-s">
          <button
            type="button"
            class="hd-reset"
            :disabled="i === 0"
            title="Nach vorn"
            aria-label="Nach vorn"
            :data-slideup="i"
            @click="move(i, -1)"
          >
            ↑
          </button>
          <button
            type="button"
            class="hd-reset"
            :disabled="i === rows.length - 1"
            title="Nach hinten"
            aria-label="Nach hinten"
            :data-slidedown="i"
            @click="move(i, 1)"
          >
            ↓
          </button>
          <button
            type="button"
            class="hd-reset danger"
            title="Aus der Diashow entfernen"
            aria-label="Aus der Diashow entfernen"
            :data-slideremove="i"
            @click="remove(i)"
          >
            ✕
          </button>
        </span>
      </div>
    </div>
    <div class="ly-btns">
      <UiButton
        size="sm"
        :disabled="full"
        title="Bild aus der Zwischenablage als weiteres Bild anhängen"
        data-slidepaste
        @click="service.paste('slide')"
        >📋 Aus Zwischenablage anhängen</UiButton
      >
      <UiButton size="sm" :disabled="full" data-slideadd @click="add"
        >📂 Aus Mediathek anhängen</UiButton
      >
      <UiButton
        v-if="rows.length"
        size="sm"
        variant="danger"
        data-slideclear
        @click="emit('askClear')"
        >Alle entfernen</UiButton
      >
    </div>
    <div class="ly-settings">
      <SliderControl
        :model-value="ss.interval"
        label="Anzeigedauer je Bild"
        :min="1"
        :max="30"
        :default-value="ssDef.interval"
        :disabled="!rows.length"
        :value-text="`${ss.interval} s`"
        input-class="ly-ss-interval"
        @update:model-value="ss.interval = clampSlideshowNum('interval', $event)"
      />
      <SliderControl
        :model-value="ss.duration"
        label="Übergangsdauer"
        :min="0"
        :max="5000"
        :step="50"
        :default-value="ssDef.duration"
        :disabled="!rows.length"
        :value-text="`${ss.duration} ms`"
        input-class="ly-ss-duration"
        @update:model-value="ss.duration = clampSlideshowNum('duration', $event)"
      />
      <UiSelect
        :model-value="ss.transition"
        label="Übergang"
        size="sm"
        :disabled="!rows.length"
        :options="transitionOptions"
        data-slideshow="transition"
        @update:model-value="setTransition(String($event))"
      />
      <UiSwitch
        :model-value="ss.pauseOnHover"
        label="Pause bei Mauszeiger"
        :disabled="!rows.length"
        data-slideshow="pauseOnHover"
        @update:model-value="ss.pauseOnHover = $event"
      />
      <UiSwitch
        :model-value="ss.dots"
        label="Punkte zum Umschalten"
        :disabled="!rows.length"
        data-slideshow="dots"
        @update:model-value="ss.dots = $event"
      />
    </div>
    <p class="hint ly-m0 ly-mt">
      Die Vorschau oben wechselt die Bilder im eingestellten Takt; Übergänge und Punkte zeigt die
      veröffentlichte Seite.
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { SliderControl, UiButton, UiSelect, UiSwitch } from '../../components/ui';
import { TRANSITION_LABEL } from '../media/mediaData';
import { clampSlideshowNum, moveSlide, slideLabel, type SlideRow } from './layoutData';
import { lyUi } from './layoutUi';
import { useLayout } from './useLayout';

/**
 * Panel „Diashow“ des Banners (wie `bannerSlidesBlock` in
 * `public/layout-banner.js`): weitere Bilder anhängen, ordnen, entfernen,
 * plus Takt/Übergang. Das Banner selbst ist Bild 1.
 */
const emit = defineEmits<{ askClear: [] }>();
const { service, slides, slideshow, toast } = useLayout();

const rows = computed<SlideRow[]>(() =>
  slides().map((val) => ({ val, info: service.resolve(val) })),
);
const full = computed(() => rows.value.length >= service.slidesMax);
const ss = computed(() => slideshow());
const ssDef = service.slideshowDefault();
const transitionOptions = service.transitions.map((t) => ({
  value: t,
  label: TRANSITION_LABEL[t] ?? t,
}));

function setTransition(v: string) {
  ss.value.transition = service.transitions.includes(v) ? v : 'fade';
}
function move(i: number, dir: -1 | 1) {
  moveSlide(slides(), i, dir);
}
function remove(i: number) {
  slides().splice(i, 1);
  toast('Bild aus der Diashow entfernt');
}
function add() {
  const ok = service.pick('slide', 'Weiteres Bild für die Diashow wählen', (url) => {
    const list = slides();
    if (list.length >= service.slidesMax) {
      toast(`Maximal ${service.slidesMax} weitere Bilder`, { type: 'warning' });
      return;
    }
    list.push(url);
    toast('Bild an die Diashow angehängt');
  });
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
  margin-top: 0.5rem;
}
.ly-h2 {
  font-size: 1rem;
  margin: 0 0 0.3rem;
}
.ly-empty {
  margin: 0.3rem 0;
}
.ly-sliderow {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.35rem 0;
}
.ly-nr {
  flex: 0 0 2.2rem;
  text-align: right;
}
.ly-slidethumb {
  flex: 0 0 auto;
  width: 120px;
  height: 60px;
}
.ly-slidethumb--on {
  outline: 2px solid var(--accent);
}
.ly-label {
  flex: 1 1 120px;
  min-width: 0;
}
.ly-ellipsis {
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ly-btns-s {
  display: inline-flex;
  gap: 0.25rem;
  flex: 0 0 auto;
}
.ly-btns {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
  margin-top: 0.5rem;
}
.ly-settings {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
  margin-top: 0.7rem;
}
</style>
