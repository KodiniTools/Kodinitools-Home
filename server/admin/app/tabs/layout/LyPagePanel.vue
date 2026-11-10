<template>
  <div class="panel" data-homelayoutpanel>
    <h2>Seiten-Layout <span class="lang-badge">DE + EN</span></h2>
    <p class="hint">
      <strong>Kompakt</strong> ordnet den Hero platzsparend an: auf dem Desktop Texte links und
      Banner bzw. Raster rechts, auf dem Handy kleiner mit den Feature-Buttons in einer wischbaren
      Zeile. Die Tool-Karten stehen in einem Raster, das sich der Breite anpasst; als
      <strong>Liste</strong> zeigen sie zusätzlich zwei Zeilen Beschreibung, das Popup mit der
      ganzen Beschreibung bleibt. Die <strong>Kategorie-Leiste</strong> unter dem Hero springt zu
      Audio, Bild und Diverse und bleibt beim Scrollen oben; ihr Suchfeld filtert die Karten.
      Sektionsmedien (Bild bzw. Video je Sektion) stehen auf dem Desktop oben, seitlich neben den
      Karten oder darunter, auf Handy und Tablet oben oder darunter, oder sie entfallen. Farben,
      Schriften, Texte und Medien bleiben wie eingestellt. Ausgeblendete Feature-Buttons nehmen im
      Kompakt-Layout keinen Platz ein, Verschiebungen des Hero-Mediums, der Hero-Texte und der
      Buttons wirken nur im klassischen Layout, die der Sektionsmedien im Kompakt-Layout nur auf dem
      Desktop bei „Oben“ oder „Unten“. Die Wirkung siehst du in der <strong>Vorschau</strong> der
      Seite.
    </p>
    <div class="ly-row" data-homelayout>
      <UiSegmentedControl
        :model-value="p.homeLayout"
        label="Seiten-Layout"
        size="sm"
        :options="LAYOUT_OPTIONS"
        @update:model-value="set('homeLayout', $event === 'compact' ? 'compact' : 'classic')"
      />
    </div>
    <div :class="['ly-row', { 'ly-dim': !compact }]">
      <UiSwitch
        :model-value="p.heroMediaMobile"
        label="Banner bzw. Raster auf dem Handy zeigen"
        :disabled="!compact"
        title="Nur im Kompakt-Layout: Banner bzw. Raster auf Bildschirmen bis 640 px zeigen"
        data-heromediamobile
        @update:model-value="set('heroMediaMobile', $event)"
      />
    </div>
    <div :class="['ly-row', { 'ly-dim': !compact }]">
      <UiSelect
        :model-value="p.cardForm"
        label="Kartenform"
        size="sm"
        inline
        :disabled="!compact"
        :options="opts(CARD_FORM_LABEL)"
        title="Liste: Titel mit zwei Zeilen Beschreibung, auf dem Handy einspaltig. Kachel: wie im klassischen Layout. Beide zeigen beim Überfahren das Popup mit der Beschreibung."
        data-cardform
        @update:model-value="set('cardForm', $event === 'tile' ? 'tile' : 'list')"
      />
      <UiSelect
        :model-value="p.cardWidth"
        label="Kartenbreite"
        size="sm"
        inline
        :disabled="!compact"
        :options="opts(CARD_WIDTH_LABEL)"
        title="Mindestbreite einer Karte; das Raster setzt so viele Spalten, wie Platz haben."
        data-cardwidth
        @update:model-value="set('cardWidth', pickKey(CARD_WIDTH_LABEL, $event, 'medium'))"
      />
    </div>
    <div :class="['ly-row', { 'ly-dim': !compact }]">
      <UiSwitch
        :model-value="p.catBar"
        label="Kategorie-Leiste"
        :disabled="!compact"
        title="Sprunglinks zu Audio, Bild und Diverse; bleibt beim Scrollen unter der Navigation stehen."
        data-catbar
        @update:model-value="set('catBar', $event)"
      />
      <UiSwitch
        :model-value="p.catSearch"
        label="Suche in der Leiste"
        :disabled="!compact || !p.catBar"
        title="Suchfeld in der Kategorie-Leiste; filtert die Karten nach Titel und Beschreibung."
        data-catsearch
        @update:model-value="set('catSearch', $event)"
      />
    </div>
    <div :class="['ly-row', { 'ly-dim': !compact }]">
      <UiSelect
        :model-value="p.mediaPosDesktop"
        label="Sektionsmedien Desktop"
        size="sm"
        inline
        :disabled="!compact"
        :options="opts(MEDIA_POS_DESKTOP_LABEL)"
        title="Lage von Bild bzw. Video einer Sektion zu ihren Karten ab 1024 px Breite."
        data-mediaposdesktop
        @update:model-value="
          set('mediaPosDesktop', pickKey(MEDIA_POS_DESKTOP_LABEL, $event, 'side'))
        "
      />
      <UiSelect
        :model-value="p.mediaPosMobile"
        label="Sektionsmedien Handy/Tablet"
        size="sm"
        inline
        :disabled="!compact"
        :options="opts(MEDIA_POS_MOBILE_LABEL)"
        title="Lage von Bild bzw. Video einer Sektion zu ihren Karten unter 1024 px Breite (Handy und Tablet)."
        data-mediaposmobile
        @update:model-value="
          set('mediaPosMobile', pickKey(MEDIA_POS_MOBILE_LABEL, $event, 'bottom'))
        "
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { UiSegmentedControl, UiSelect, UiSwitch } from '../../components/ui';
import {
  CARD_FORM_LABEL,
  CARD_WIDTH_LABEL,
  MEDIA_POS_DESKTOP_LABEL,
  MEDIA_POS_MOBILE_LABEL,
  pageToast,
  type PageKey,
  type PageSettings,
} from './layoutData';
import { useLayout } from './useLayout';

/**
 * Panel „Seiten-Layout“ (global für DE + EN, wie `pageLayoutPanelHtml` in
 * `public/layout.js`): Klassisch/Kompakt und die Kompakt-Optionen.
 */
const { view, setPage, toast } = useLayout();
const p = computed(() => view.value.page);
const compact = computed(() => p.value.homeLayout === 'compact');

const LAYOUT_OPTIONS = [
  { value: 'classic', label: 'Klassisch' },
  { value: 'compact', label: 'Kompakt' },
];
const opts = (labels: Record<string, string>) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));
function pickKey<T extends string>(labels: Record<T, string>, v: unknown, def: T): T {
  return Object.prototype.hasOwnProperty.call(labels, String(v)) ? (String(v) as T) : def;
}
function set<K extends PageKey>(key: K, v: PageSettings[K]) {
  if (p.value[key] === v) return;
  setPage(key, v);
  toast(pageToast(key, v));
}
</script>

<style scoped>
.ly-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--ds-space-2) var(--ds-space-5);
  margin-top: var(--ds-space-2);
}
.ly-dim {
  opacity: 0.5;
}
</style>
