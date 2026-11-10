<template>
  <div class="tc-sticky" data-hd-preview>
    <div class="hd-line hd-prevhead">
      <span class="hint hd-m0">👁 Live-Vorschau:</span>
      <UiSegmentedControl
        v-model="prevMode"
        label="Vorschau und Seitenleiste im Hell- oder Dunkelmodus"
        size="sm"
        :options="MODE_OPTIONS"
        data-hdprevmode
      />
      <span class="hint hd-m0"
        ><em>Hero in Originalgröße</em>, Layout
        <strong>{{ view.layout === 'compact' ? 'Kompakt' : 'Klassisch' }}</strong> mit Banner
        (beides unter „Layout“) – im Rahmen scrollen (Höhe unten rechts ziehbar),
        <em>zum Testen über die Buttons fahren</em>; die Farben dieses Modus stehen in der offenen
        Seitenleiste, der andere Modus ist zugeklappt.</span
      >
    </div>
    <!-- Hover-Regeln + Kompakt-Layout (Inline-Styles der Vorschau überschreiben) -->
    <CssTag :css="cssText" />
    <div class="tc-previews tc-previews--single">
      <div class="tc-page" :data-hdprev="mode" :style="{ background: PREVIEW_BG[mode] }">
        <span class="tc-page-label">{{ mode === 'dark' ? 'Dunkel 🌙' : 'Hell ☀️' }}</span>
        <div
          ref="scrollEl"
          class="hd-scroll"
          data-hdscroll
          data-tcside="hdprev"
          title="Hero in Originalgröße – scrollen; unten rechts in der Höhe ziehen"
          :style="initialHeight"
        >
          <div
            data-hdbox
            :data-hdlayout="view.layout"
            :data-hdnomedia="med ? undefined : ''"
            :style="boxCss"
          >
            <span v-if="imgCss" data-hdimg :style="imgCss"></span>
            <div v-if="med" data-hdmedia style="margin-bottom: 16px">
              <video v-if="med.isVid" :src="med.src" muted playsinline :style="mediaCss"></video>
              <img v-else :src="med.src" alt="" :style="mediaCss" />
            </div>
            <div
              :class="animClass('hero.title')"
              data-hdtitle
              role="button"
              tabindex="0"
              title="Klicken: Einstellungen des Titels anzeigen"
              :style="partCss('title', '', titleCss)"
              v-on="handlers('title', '')"
            >
              {{ slotText('hero.title') }}
            </div>
            <div
              :class="animClass('hero.subtitle')"
              data-hdsub
              role="button"
              tabindex="0"
              title="Klicken: Einstellungen des Untertitels anzeigen"
              :style="partCss('subtitle', '', subCss)"
              v-on="handlers('subtitle', '')"
            >
              {{ slotText('hero.subtitle') }}
            </div>
            <div data-hdchips :style="chipsBoxCss">
              <div
                v-for="f in view.feats"
                :key="f.key"
                :data-hdchip="f.key"
                role="button"
                tabindex="0"
                title="Klicken: Einstellungen dieses Buttons anzeigen – Ziehen verschiebt"
                :style="partCss('chip', f.key, chipCss + chipExtraCss(view.hd, f.key))"
                v-on="handlers('chip', f.key)"
              >
                {{ featLabel(view.ov, f) }}
              </div>
            </div>
            <div
              :class="animClass('hero.cta')"
              data-hdcta
              role="button"
              tabindex="0"
              title="Klicken: Einstellungen des CTA-Buttons anzeigen"
              :style="partCss('cta', '', ctaCss)"
              v-on="handlers('cta', '')"
            >
              {{ slotText('hero.cta') }}
            </div>
          </div>
        </div>
      </div>
    </div>
    <p class="hint hd-note" data-hdnote>{{ noteText(view.hd) }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onBeforeUnmount, ref, watch, type FunctionalComponent } from 'vue';
import type { ThemeMode } from '../../../types';
import { UiSegmentedControl } from '../../components/ui';
import { slotAnimClass } from '../texts/textStyle';
import {
  HD_PREVIEW_MIN,
  MODE_LABEL,
  PREVIEW_BG,
  boxStyle,
  chipExtraCss,
  chipStyle,
  ctaStyle,
  featLabel,
  hoverCss,
  imageStyle,
  noteText,
  slidesOf,
  subtitleStyle,
  titleStyle,
  type HeroPartKind,
  type HeroSlotKey,
} from './heroData';
import { hdUi } from './heroUi';
import { useHero } from './useHero';

/**
 * Sticky-Vorschau des Hero in Originalgröße (wie `stickyPreview`/`previewHtml`
 * in `public/design.js`): Titel, Untertitel, Feature-Buttons und CTA sind
 * anklickbar (springt zu den Einstellungen) und ziehbar (Versatz in px, 1:1);
 * Pfeiltasten bewegen um 1 px (Shift: 10 px). Das Hintergrundbild wechselt im
 * Takt der Diashow.
 */
const { service, view, ff, side, style, slotText, select, offsetOf, setOffset } = useHero();

const MODE_OPTIONS = (['light', 'dark'] as const).map((m) => ({ value: m, label: MODE_LABEL[m] }));
const prevMode = computed<ThemeMode>({
  get: () => hdUi.prevMode,
  set: (m) => (hdUi.prevMode = m === 'dark' ? 'dark' : 'light'),
});
const mode = computed(() => hdUi.prevMode);
const s = computed(() => side(mode.value));

/** `<style>` mit erzeugten Regeln (Templates erlauben kein `<style>`, daher per Render-Funktion). */
const CssTag: FunctionalComponent<{ css: string }> = (p) => h('style', p.css);
CssTag.props = ['css'];
const cssText = computed(() => `${hoverCss(view.value.hd)}\n${service.layoutCss}`);
const med = computed(() => (void view.value, service.previewMedia()));
const mediaCss = computed(() => service.mediaStyle(mode.value, view.value.layout === 'compact'));
const boxCss = computed(() => boxStyle(s.value, ff(view.value.globalFont)));

// ---- Bildebene + Vorschau-Diashow -------------------------------------------------
const srcs = computed(() =>
  [s.value.bgImage, ...slidesOf(s.value)].map((v) => service.resolveUrl(v)).filter(Boolean),
);
const imgCss = computed(() => {
  const base = service.resolveUrl(s.value.bgImage);
  if (!base) return '';
  const list = srcs.value;
  const cur = list.length > 1 ? list[hdUi.slideIdx % list.length] || base : base;
  return imageStyle(s.value, cur);
});
let timer: ReturnType<typeof setInterval> | null = null;
function stopTimer() {
  if (timer !== null) clearInterval(timer);
  timer = null;
}
watch(
  () =>
    [
      mode.value,
      srcs.value.join('\n'),
      !!s.value.bgImage,
      s.value.bgSlideshow?.interval ?? 5,
    ] as const,
  ([, , hasImg, interval]) => {
    stopTimer();
    hdUi.slideIdx = 0;
    const n = srcs.value.length;
    if (!hasImg || n < 2) return;
    timer = setInterval(
      () => (hdUi.slideIdx = (hdUi.slideIdx + 1) % n),
      Math.max(1, interval || 5) * 1000,
    );
  },
  { immediate: true },
);

// ---- Texte und Buttons -------------------------------------------------------------
const animClass = (key: HeroSlotKey) => slotAnimClass(style(key));
const titleCss = computed(() =>
  titleStyle(s.value, view.value.hd, style('hero.title'), mode.value, ff),
);
const subCss = computed(() =>
  subtitleStyle(s.value, view.value.hd, style('hero.subtitle'), mode.value, ff),
);
const ctaCss = computed(() => ctaStyle(s.value, view.value.hd, style('hero.cta'), mode.value, ff));
const chipCss = computed(() => chipStyle(s.value, view.value.hd, ff));
const chipsBoxCss = computed(() => {
  const cols = Math.max(1, Math.min(6, view.value.feats.length));
  return `display:grid;grid-template-columns:repeat(${cols},1fr);gap:9.6px;margin-top:32px;visibility:${view.value.hd.showChips === false ? 'hidden' : 'visible'}`;
});
/** Markierung des gewählten Teils (bleibt bis zur nächsten Auswahl). */
function partCss(kind: HeroPartKind, key: string, css: string): string {
  const sel = hdUi.selected;
  const on = !!sel && sel.kind === kind && (kind !== 'chip' || sel.key === key);
  return on ? `${css};outline:3px solid var(--accent)` : css;
}

// ---- Klicken, Ziehen, Pfeiltasten ----------------------------------------------------
const ARROWS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};
interface Drag {
  kind: HeroPartKind;
  key: string;
  x: number;
  y: number;
  ox: number;
  oy: number;
  moved: boolean;
}
let drag: Drag | null = null;
/** Nach einem Zug den folgenden Klick unterdrücken (sonst springt die Auswahl). */
let suppressClick = false;

function handlers(kind: HeroPartKind, key: string) {
  return {
    click: () => {
      if (suppressClick) {
        suppressClick = false;
        return;
      }
      select(kind, key);
    },
    keydown: (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        select(kind, key);
      } else if (ARROWS[e.key]) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const [dx, dy] = ARROWS[e.key]!;
        const o = offsetOf(kind, key);
        setOffset(kind, key, o.x + dx * step, o.y + dy * step);
      }
    },
    pointerdown: (e: PointerEvent) => {
      if (e.button !== 0) return;
      const o = offsetOf(kind, key);
      drag = { kind, key, x: e.clientX, y: e.clientY, ox: o.x, oy: o.y, moved: false };
      suppressClick = false;
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    pointermove: (e: PointerEvent) => {
      if (!drag || drag.kind !== kind || drag.key !== key) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      if (!drag.moved && Math.abs(dx) < 3 && Math.abs(dy) < 3) return;
      drag.moved = true;
      setOffset(kind, key, drag.ox + dx, drag.oy + dy);
    },
    pointerup: endDrag,
    pointercancel: endDrag,
  };
}
function endDrag(e: PointerEvent) {
  if (!drag) return;
  const moved = drag.moved;
  drag = null;
  const el = e.currentTarget as HTMLElement | null;
  if (el?.hasPointerCapture?.(e.pointerId)) el.releasePointerCapture(e.pointerId);
  if (moved) suppressClick = true;
}

// ---- Höhe des Scrollrahmens merken ----------------------------------------------------
const scrollEl = ref<HTMLElement | null>(null);
const initialHeight = { height: `${Math.max(HD_PREVIEW_MIN, hdUi.prevHeight)}px` };
onBeforeUnmount(() => {
  stopTimer();
  const h = parseInt(scrollEl.value?.style.height ?? '', 10);
  if (Number.isFinite(h) && h >= HD_PREVIEW_MIN) hdUi.prevHeight = h;
});
</script>

<style scoped>
.hd-m0 {
  margin: 0;
}
.hd-line {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  flex-wrap: wrap;
}
.hd-prevhead {
  margin: var(--ds-space-1) 0 var(--ds-space-2);
}
.hd-scroll {
  overflow: auto;
  min-height: 120px;
  resize: vertical;
  border-radius: 8px;
  overscroll-behavior: contain;
  scrollbar-width: thin;
}
.hd-note {
  margin: var(--ds-space-2) 0 0;
}
</style>
