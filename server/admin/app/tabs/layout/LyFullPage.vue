<template>
  <div ref="hostEl" data-lyfullhost></div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useLayout } from './useLayout';

/**
 * Host der Ganzseiten-Vorschau (Medien & Tool-Karten verschieben). Sie bleibt
 * bis PR 12c in Vanilla (`public/layout-fullpage.js`) und wird hier hinein
 * gezeichnet. Ändert sich, was sie zeigt (Banner, Ein-/Ausblenden,
 * Seiten-Layout), wird sie neu gezeichnet; Design-Regler frischen nur das
 * Banner auf (wie `refreshFullPageBanner`).
 */
const { service, view, styles } = useLayout();
const hostEl = ref<HTMLElement | null>(null);

const draw = () => hostEl.value && service.fullPage.draw(hostEl.value);
onMounted(draw);
watch(
  () => [view.value.m.heroBanner, view.value.m.heroBannerShow, view.value.page.homeLayout],
  draw,
);
watch(
  () => JSON.stringify(styles()),
  () => hostEl.value && service.fullPage.refreshBanner(hostEl.value),
);
</script>
