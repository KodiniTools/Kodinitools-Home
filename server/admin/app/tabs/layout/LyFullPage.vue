<template>
  <div ref="hostEl" data-lyfullhost></div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useLayout } from './useLayout';

/**
 * Host der Ganzseiten-Vorschau (Medien & Tool-Karten verschieben). Sie bleibt
 * bis PR 12c in Vanilla (`public/layout-fullpage.js`) und wird hier hinein
 * gezeichnet. Ändert sich, was sie zeigt (Hero-Modus, Banner bzw. Kacheln,
 * Ein-/Ausblenden, Seiten-Layout), wird sie neu gezeichnet; Design-Regler frischen nur das
 * Banner auf (wie `refreshFullPageBanner`).
 */
const { service, view, styles } = useLayout();
const hostEl = ref<HTMLElement | null>(null);

const draw = () => hostEl.value && service.fullPage.draw(hostEl.value);
onMounted(draw);
watch(() => {
  const m = view.value.m;
  return JSON.stringify([
    m.heroMode,
    m.heroBanner,
    m.heroBannerShow,
    view.value.page.homeLayout,
    m.heroLayout,
    m.heroGrid,
    m.heroGridHidden,
  ]);
}, draw);
watch(
  () => JSON.stringify(styles()),
  () => hostEl.value && service.fullPage.refreshBanner(hostEl.value),
);
</script>
