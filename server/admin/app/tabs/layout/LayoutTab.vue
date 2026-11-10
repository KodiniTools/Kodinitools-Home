<template>
  <div class="tc-layout" data-vue-tab="layout">
    <aside class="tc-side" data-tcside="left">
      <div class="tc-side-head left">🖼️ Banner-Design</div>
      <p class="hint">
        Rahmen, Ecken, Schatten, Deckkraft und Verdunkelung des Banner-Bildes/-Videos – getrennt für
        <strong>Hell</strong> und <strong>Dunkel</strong>. Der Umschalter über der Vorschau (oder
        die zugeklappte Leiste hier) wählt den bearbeiteten Modus; der andere ist zugeklappt. Das
        Banner-Bild/-Video weist du in der Mitte unter der Vorschau zu.
      </p>
      <div class="panel ly-copybox">
        <button
          type="button"
          class="hd-reset ly-wrapbtn"
          title="Banner-Design (Hell + Dunkel) in die andere Sprache übernehmen – Text bleibt je Sprache"
          :data-bannercopylang="OTHER"
          @click="askCopyDesign"
        >
          📋 Banner-Design nach {{ OTHER_NAME }} übertragen<br /><span class="hint ly-m0"
            >(Hell + Dunkel; Text bleibt je Sprache)</span
          >
        </button>
      </div>
      <LyBannerDesign mode="light" @ask-reset-all="askResetAll" />
      <LyBannerDesign mode="dark" @ask-reset-all="askResetAll" />
    </aside>

    <div class="tc-main">
      <LyPagePanel />
      <LyModePanel />
      <LyBannerPreview />
      <LyBannerMedia />
      <LyBannerSlides @ask-clear="askClearSlides" />
      <div class="panel">
        <p class="hint ly-m0">
          Links das <strong>Banner-Design</strong> (Rahmen, Schatten, Deckkraft, Verdunkelung),
          rechts der <strong>Banner-Text</strong> mit allen Effekten. Die Vorschau bleibt beim
          Scrollen oben sichtbar; den Text in der Vorschau mit der Maus verschieben.
        </p>
      </div>
      <LyFullPage />
    </div>

    <LyBannerText @ask-copy-text="askCopyText" />

    <UiDialog
      :open="!!pending"
      :title="pending?.title ?? ''"
      :description="pending?.description ?? ''"
      @close="pending = null"
    >
      <template #footer>
        <UiButton variant="ghost" @click="pending = null">Abbrechen</UiButton>
        <UiButton variant="danger" data-ly-confirm @click="confirmPending">{{
          pending?.confirmLabel
        }}</UiButton>
      </template>
    </UiDialog>
  </div>
</template>

<script setup lang="ts">
import { shallowRef } from 'vue';
import type { ThemeMode } from '../../../types';
import { UiButton, UiDialog } from '../../components/ui';
import LyBannerDesign from './LyBannerDesign.vue';
import LyBannerMedia from './LyBannerMedia.vue';
import LyBannerPreview from './LyBannerPreview.vue';
import LyBannerSlides from './LyBannerSlides.vue';
import LyBannerText from './LyBannerText.vue';
import LyFullPage from './LyFullPage.vue';
import LyModePanel from './LyModePanel.vue';
import LyPagePanel from './LyPagePanel.vue';
import {
  LANG_LABEL,
  MODE_LABEL,
  copyBannerDesign,
  copyTextDesign,
  otherLang,
  type LayoutService,
} from './layoutData';
import { lyUi } from './layoutUi';
import { provideLayout } from './useLayout';

/**
 * Tab „Layout“ im Modus Einzel-Banner (Vue-Fassung von `renderLayout` +
 * `public/layout-banner.js`): links das Banner-Design je Hell/Dunkel, in der
 * Mitte Seiten-Layout, Hero-Modus, Sticky-Vorschau, Banner-Medium, Diashow und
 * die Ganzseiten-Vorschau (noch Vanilla), rechts der Banner-Text mit Effekten.
 * Geschrieben wird direkt in `media.<lang>` bzw. über die Setter des Services,
 * damit Speichern, Autosave und Undo per Snapshot unverändert greifen. Der
 * Raster-Modus bleibt bis PR 12b in Vanilla.
 */
const props = defineProps<{ service: LayoutService }>();
const { change, toast, styles, slideshow, slides } = provideLayout(props.service);
const service = props.service;
const OTHER = otherLang(service.lang);
const OTHER_NAME = LANG_LABEL[OTHER];

// ---- Rückfragen (statt confirm()) --------------------------------------------------------
interface Pending {
  title: string;
  description: string;
  confirmLabel: string;
  action: () => void;
}
const pending = shallowRef<Pending | null>(null);
function confirmPending() {
  const p = pending.value;
  pending.value = null;
  p?.action();
}
function askCopyDesign() {
  pending.value = {
    title: `Banner-Design nach ${OTHER_NAME} übertragen?`,
    description: `Banner-Design (Hell + Dunkel) und Diashow-Einstellungen für ${OTHER_NAME} werden ersetzt. Der Text bleibt je Sprache.`,
    confirmLabel: 'Übertragen',
    action: () => {
      change(() => {
        service.ensureBanner(OTHER);
        copyBannerDesign(styles(), slideshow(), service.mediaOf(OTHER));
      });
      toast(`Banner-Design nach ${OTHER_NAME} übertragen`);
    },
  };
}
function askCopyText() {
  pending.value = {
    title: `Text-Design nach ${OTHER_NAME} übertragen?`,
    description:
      'Schrift, Farbe, Größe, Position und Effekte werden ersetzt. Der Text selbst bleibt unverändert.',
    confirmLabel: 'Übertragen',
    action: () => {
      change(() => copyTextDesign(service.media(), service.mediaOf(OTHER)));
      toast(`Text-Design nach ${OTHER_NAME} übertragen`);
    },
  };
}
function askResetAll(mode: ThemeMode) {
  pending.value = {
    title: `Banner-Design (${MODE_LABEL[mode]}) zurücksetzen?`,
    description: 'Alle Werte dieses Modus werden auf Standard gesetzt.',
    confirmLabel: 'Zurücksetzen',
    action: () => {
      styles()[mode] = service.styleDefault();
      lyUi.prevMode = mode;
      toast('Banner-Design zurückgesetzt');
    },
  };
}
function askClearSlides() {
  pending.value = {
    title: 'Diashow leeren?',
    description: 'Alle weiteren Bilder aus der Diashow entfernen? Das Banner selbst bleibt.',
    confirmLabel: 'Alle entfernen',
    action: () => {
      slides().length = 0;
      toast('Diashow geleert');
    },
  };
}
</script>

<style scoped>
.ly-m0 {
  margin: 0;
}
.ly-copybox {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-1);
  align-items: center;
}
.ly-wrapbtn {
  white-space: normal;
  text-align: left;
  flex: 1 1 auto;
  min-width: 0;
  max-width: 100%;
}
</style>
