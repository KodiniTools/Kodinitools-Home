<template>
  <div class="panel mhp" data-modern-hero-preview>
    <UiCallout type="info" title="Modernes Design aktiv">
      Die Startseite zeigt den Hero unten, nicht den klassischen Hero mit Banner oder Kacheln. Auf
      ihn wirken nur die <strong>Texte</strong> (Titel, Untertitel, Button, Vorteile; Text zwischen
      *Sternchen* im Titel wird farbig) und das <strong>Ein-/Ausblenden</strong> von Titel,
      Untertitel und Vorteilen. {{ note }}
    </UiCallout>
    <div class="mhp-head">
      <span class="hint mhp-m0">👁 Vorschau (modernes Design):</span>
      <UiSegmentedControl
        v-model="theme"
        label="Vorschau im Hell- oder Dunkelmodus"
        size="sm"
        :options="THEME_OPTIONS"
        data-mhp-theme
      />
    </div>
    <iframe
      class="mhp-frame"
      :srcdoc="doc"
      :title="`Vorschau Hero, modernes Design (${theme === 'dark' ? 'Dunkel' : 'Hell'})`"
      loading="lazy"
      data-mhp-frame
    ></iframe>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { UiCallout, UiSegmentedControl } from '../ui';
import { modernHeroDoc, type ModernHeroData, type PreviewTheme } from './modernHero';

/**
 * Vorschau des Hero im modernen Design (echtes `home-modern.css` im iframe), für die Tabs
 * „Hero-Design“ und „Layout“, solange Admin › Layout › Modernes Design an ist.
 */
const props = defineProps<{ data: ModernHeroData; note?: string }>();

const THEME_OPTIONS = [
  { value: 'light', label: '☀️ Hell' },
  { value: 'dark', label: '🌙 Dunkel' },
];
const theme = ref<PreviewTheme>('dark');
const doc = computed(() => modernHeroDoc(props.data, theme.value));
</script>

<style scoped>
.mhp-head {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin: 12px 0 8px;
}
.mhp-m0 {
  margin: 0;
}
.mhp-frame {
  display: block;
  width: 100%;
  height: 460px;
  border: 1px solid var(--ds-border, rgba(255, 255, 255, 0.12));
  border-radius: 12px;
  background: #0a1324;
}
</style>
