<template>
  <div ref="rootEl" class="ly-sticky" data-bannerpreview>
    <div class="ly-head">
      <span class="hint ly-m0">👁 Live-Vorschau (Banner):</span>
      <UiSwitch
        :model-value="shown"
        label="Banner anzeigen"
        title="Ausgeblendet: Banner samt Banner-Text erscheint nicht auf der Seite; Bild, Text und Design bleiben gespeichert"
        data-bannershow
        @update:model-value="setShown"
      />
      <UiSegmentedControl
        v-model="prevMode"
        label="Vorschau im Hell- oder Dunkelmodus anzeigen"
        size="sm"
        :options="MODE_OPTIONS"
        data-bannerprevmode
      />
      <span class="ly-undo">
        <button
          type="button"
          class="hd-reset"
          data-undoproxy
          title="Rückgängig (Strg/Cmd+Z)"
          aria-label="Rückgängig"
        >
          ↶
        </button>
        <button
          type="button"
          class="hd-reset"
          data-redoproxy
          title="Wiederherstellen (Strg/Cmd+Y)"
          aria-label="Wiederherstellen"
        >
          ↷
        </button>
      </span>
    </div>
    <p v-if="!shown" class="hint ly-hiddeninfo" data-bannerhiddeninfo>
      👁 Banner ausgeblendet – auf der Seite erscheint kein Banner (und kein Banner-Text). Die
      Vorschau zeigt es abgeblendet zum Weiterbearbeiten.
    </p>
    <div
      ref="boxEl"
      :class="['ly-box', { 'ly-box--hidden': !shown }]"
      data-bannerbox
      :data-prevmode="mode"
      :data-bannerhidden="shown ? '' : '1'"
      :style="{ background: BANNER_PREV_BG[mode] }"
    >
      <template v-if="med">
        <video
          v-if="med.isVid"
          data-bannermedia="media"
          :src="med.src"
          muted
          :style="mediaCss('media')"
        ></video>
        <img v-else data-bannermedia="media" :src="curSrc" alt="" :style="mediaCss('media')" />
      </template>
      <div v-else data-bannermedia="box" :style="mediaCss('box')">
        <span class="hint ly-m0"
          >Kein Banner gewählt — unten unter „Banner (Bild oder Video)“ zuweisen.</span
        >
      </div>
      <div
        data-bannertext
        :class="bannerAnimClass(text)"
        :title="text.text ? 'Zum Verschieben ziehen' : undefined"
        :style="bannerTextStyle(text, fontDecl)"
        @pointerdown="onDown"
        @pointermove="onMove"
        @pointerup="onUp"
        @pointercancel="onUp"
      >
        {{ text.text }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { ThemeMode } from '../../../types';
import { UiSegmentedControl, UiSwitch } from '../../components/ui';
import {
  BANNER_PREV_BG,
  MODE_LABEL,
  bannerAnimClass,
  bannerMediaStyle,
  bannerTextStyle,
  clamp,
} from './layoutData';
import { lyUi } from './layoutUi';
import { useLayout } from './useLayout';

/**
 * Sticky-Vorschau des Einzelbanners (wie `previewPanel` in
 * `public/layout-banner.js`): Medium im Banner-Design des gewählten Modus,
 * ziehbarer Text (Position in %), Diashow im eingestellten Takt.
 */
const { view, text, style, slides, slideshow, service, fontDecl, toast } = useLayout();

const MODE_OPTIONS = (['light', 'dark'] as const).map((m) => ({ value: m, label: MODE_LABEL[m] }));
const prevMode = computed<string>({
  get: () => lyUi.prevMode,
  set: (m) => (lyUi.prevMode = m === 'dark' ? 'dark' : 'light'),
});
const mode = computed<ThemeMode>(() => lyUi.prevMode);
const shown = computed(() => view.value.m.heroBannerShow !== false);
function setShown(on: boolean) {
  view.value.m.heroBannerShow = on;
  toast(on ? 'Banner eingeblendet' : 'Banner ausgeblendet');
}

const med = computed(() => service.resolve(view.value.m.heroBanner || ''));
const mediaCss = (kind: 'media' | 'box') => bannerMediaStyle(style(mode.value), kind);

// ---- Vorschau-Diashow (nur bei Bild-Banner, wie startBannerSlideshow) ------------------
const srcs = computed(() => {
  const main = med.value;
  if (!main || main.isVid) return [];
  return [main.src, ...slides().map((v) => service.resolve(v)?.src || '')].filter(Boolean);
});
const curSrc = computed(() => {
  const list = srcs.value;
  return list.length > 1 ? list[lyUi.slideIdx % list.length] || med.value!.src : med.value!.src;
});
let timer: ReturnType<typeof setInterval> | null = null;
function stopTimer() {
  if (timer !== null) clearInterval(timer);
  timer = null;
}
watch(
  () => [srcs.value.join('\n'), slideshow().interval] as const,
  ([, interval]) => {
    stopTimer();
    lyUi.slideIdx = 0;
    const n = srcs.value.length;
    if (n < 2) return;
    timer = setInterval(
      () => (lyUi.slideIdx = (lyUi.slideIdx + 1) % n),
      Math.max(1, interval || 5) * 1000,
    );
  },
  { immediate: true },
);

// ---- Text ziehen (Position in % des Kastens, wie dragHandle) ------------------------------
const boxEl = ref<HTMLElement | null>(null);
let dragging = false;
function onDown(e: PointerEvent) {
  if (!text.value.text || e.button !== 0) return;
  dragging = true;
  (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  e.preventDefault();
}
function onMove(e: PointerEvent) {
  if (!dragging || !boxEl.value) return;
  const r = boxEl.value.getBoundingClientRect();
  if (!r.width || !r.height) return;
  const m = view.value.m;
  m.heroBannerTextX = Math.round(clamp(((e.clientX - r.left) / r.width) * 100, 0, 100));
  m.heroBannerTextY = Math.round(clamp(((e.clientY - r.top) / r.height) * 100, 0, 100));
}
function onUp(e: PointerEvent) {
  if (!dragging) return;
  dragging = false;
  const el = e.currentTarget as HTMLElement | null;
  if (el?.hasPointerCapture?.(e.pointerId)) el.releasePointerCapture(e.pointerId);
}

// ↶/↷ übernehmen den Zustand der Kopfleiste (danach hält publish.js sie synchron).
const rootEl = ref<HTMLElement | null>(null);
onMounted(() => {
  const doc = rootEl.value?.ownerDocument;
  const sync = (sel: string, head: string) => {
    const h = doc?.getElementById(head) as HTMLButtonElement | null;
    rootEl.value
      ?.querySelectorAll<HTMLButtonElement>(sel)
      .forEach((b) => (b.disabled = h ? h.disabled : true));
  };
  sync('[data-undoproxy]', 'undoBtn');
  sync('[data-redoproxy]', 'redoBtn');
});
onBeforeUnmount(stopTimer);
</script>

<style scoped>
.ly-m0 {
  margin: 0;
}
.ly-sticky {
  position: sticky;
  top: 0.5rem;
  z-index: 5;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0.6rem 0.9rem;
  margin: 0 0 0.9rem;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.4);
  max-height: 38vh;
  overflow: auto;
}
.ly-head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
  margin: 0.1rem 0 0.35rem;
}
.ly-undo {
  display: inline-flex;
  gap: 0.3rem;
  margin-left: auto;
}
.ly-hiddeninfo {
  margin: 0.3rem 0 0;
  color: var(--accent);
  text-align: center;
}
.ly-box {
  position: relative;
  max-width: 520px;
  margin: 0.6rem auto;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80px;
  padding: 1rem;
  border-radius: 10px;
}
.ly-box--hidden {
  opacity: 0.35;
  outline: 2px dashed var(--accent);
}
</style>
