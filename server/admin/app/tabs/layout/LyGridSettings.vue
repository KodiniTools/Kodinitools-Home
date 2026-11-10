<template>
  <div class="panel">
    <UiSelect
      :model-value="layout"
      label="Anordnung der Kacheln"
      size="sm"
      :options="layoutOptions"
      data-herolayout
      @update:model-value="view.m.heroLayout = normLayout(service.layouts, $event)"
    />
    <p class="hint ly-mt">
      Wähle Anordnung &amp; Form; die Vorschau oben aktualisiert sich sofort.
    </p>
  </div>
  <div v-if="layout !== 'mosaic'" class="panel ly-col" data-gridformpanel>
    <UiSelect
      :model-value="ratio"
      label="Form der Kacheln"
      size="sm"
      :options="RATIO_OPTIONS"
      data-gridratio
      @update:model-value="view.m.heroGridRatio = normRatio($event)"
    />
    <UiSwitch
      :model-value="view.m.heroGridFit === 'contain'"
      label="Ganzes Bild zeigen (nicht beschneiden)"
      data-gridfit
      @update:model-value="view.m.heroGridFit = $event ? 'contain' : 'cover'"
    />
    <p class="hint ly-m0">
      📐 Empfohlene Bildgröße: <strong>{{ service.gridDims[ratio] }}</strong> — für alle Kacheln
      gleich.
    </p>
  </div>
  <div class="panel" data-gridslideshowblock>
    <h2 class="ly-h2">🎞️ Diashow der Kacheln</h2>
    <p class="hint">
      Weitere Bilder je Kachel fügst du links unter der Kachel („Diashow – weitere Bilder“) hinzu.
      {{
        withSlides.length
          ? `Aktiv in Kachel ${withSlides.map((i) => i + 1).join(', ')}.`
          : 'Noch in keiner Kachel aktiv.'
      }}
      Takt, Übergangsdauer und Übergang gelten für alle Kacheln; „versetzt“ lässt die Kacheln
      nacheinander wechseln.
    </p>
    <div class="ly-col">
      <SliderControl
        :model-value="ss.interval"
        label="Anzeigedauer je Bild"
        :min="1"
        :max="30"
        :default-value="ssDef.interval"
        :disabled="off"
        :value-text="`${ss.interval} s`"
        input-class="ly-gss-interval"
        @update:model-value="ss.interval = clampSlideshowNum('interval', $event)"
      />
      <SliderControl
        :model-value="ss.duration"
        label="Übergangsdauer"
        :min="0"
        :max="5000"
        :step="50"
        :default-value="ssDef.duration"
        :disabled="off"
        :value-text="`${ss.duration} ms`"
        input-class="ly-gss-duration"
        @update:model-value="ss.duration = clampSlideshowNum('duration', $event)"
      />
      <UiSelect
        :model-value="ss.transition"
        label="Übergang"
        size="sm"
        :disabled="off"
        :options="transitionOptions"
        data-gridslideshow="transition"
        @update:model-value="
          ss.transition = service.transitions.includes(String($event)) ? String($event) : 'fade'
        "
      />
      <UiSwitch
        :model-value="ss.pauseOnHover"
        label="Pause bei Mauszeiger"
        :disabled="off"
        data-gridslideshow="pauseOnHover"
        @update:model-value="ss.pauseOnHover = $event"
      />
      <UiSwitch
        :model-value="ss.dots"
        label="Punkte zum Umschalten"
        :disabled="off"
        data-gridslideshow="dots"
        @update:model-value="ss.dots = $event"
      />
      <UiSwitch
        :model-value="ss.stagger !== false"
        label="Versetzt wechseln (Kacheln nacheinander)"
        :disabled="off"
        data-gridslideshow="stagger"
        @update:model-value="ss.stagger = $event"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { SliderControl, UiSelect, UiSwitch } from '../../components/ui';
import { TRANSITION_LABEL } from '../media/mediaData';
import { clampSlideshowNum } from './layoutData';
import { RATIO_LABEL, GRID_RATIOS, layoutCells, normLayout, normRatio } from './gridData';
import { useLayout } from './useLayout';

/**
 * Mitte des Raster-Modus (wie `layoutSel`, `ratioSel` und `gridSlideshowPanel`
 * in `public/layout-grid.js`): Anordnung, Form/Zuschnitt und die gemeinsame
 * Diashow der Kacheln.
 */
const { view, service, cellSlides, gridSlideshow } = useLayout();

const layout = computed(() => normLayout(service.layouts, view.value.m.heroLayout));
const ratio = computed(() => normRatio(view.value.m.heroGridRatio));
const layoutOptions = Object.entries(service.layouts).map(([value, v]) => ({
  value,
  label: v.label,
}));
const RATIO_OPTIONS = GRID_RATIOS.map((value) => ({ value, label: RATIO_LABEL[value] }));
const ss = computed(() => gridSlideshow());
const ssDef = service.gridSlideshowDefault();
const transitionOptions = service.transitions.map((t) => ({
  value: t,
  label: TRANSITION_LABEL[t] ?? t,
}));
const withSlides = computed(() =>
  Array.from({ length: layoutCells(service.layouts, layout.value) }, (_, i) => i).filter(
    (i) => cellSlides(i).length > 0,
  ),
);
const off = computed(() => !withSlides.value.length);
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
.ly-col {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
}
</style>
