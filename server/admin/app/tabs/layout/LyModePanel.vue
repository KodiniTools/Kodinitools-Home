<template>
  <div class="panel" data-heromodepanel>
    <h2>
      Hero-Layout <span class="lang-badge">{{ service.lang.toUpperCase() }}</span>
    </h2>
    <p class="hint">
      Bestimmt, wie der Bereich oben auf der
      {{ service.lang === 'de' ? 'deutsche' : 'englische' }} Startseite aufgebaut ist. Kachel-Bilder
      fügst du unten je Kachel direkt aus der Zwischenablage ein (oder im Tab
      <strong>Medien</strong>).
    </p>
    <div class="ly-row" data-heromode>
      <UiSegmentedControl
        model-value="banner"
        label="Hero-Layout"
        size="sm"
        :options="MODE_OPTIONS"
        @update:model-value="setMode"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { UiSegmentedControl } from '../../components/ui';
import { useLayout } from './useLayout';

/**
 * Panel „Hero-Layout“ (je Sprache, wie `modePanelHtml` in `public/layout.js`).
 * Diese Fassung zeigt nur den Banner-Modus; „Bild-Raster“ übergibt an die
 * Vanilla-Fassung (bis PR 12b).
 */
const { service } = useLayout();
const MODE_OPTIONS = [
  { value: 'banner', label: 'Einzel-Banner' },
  { value: 'grid', label: 'Bild-Raster (Kacheln)' },
];
function setMode(v: string) {
  if (v === 'grid') service.setHeroMode('grid');
}
</script>

<style scoped>
.ly-row {
  margin-top: var(--ds-space-2);
}
</style>
