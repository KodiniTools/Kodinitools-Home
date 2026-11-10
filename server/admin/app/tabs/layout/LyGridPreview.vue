<template>
  <div ref="rootEl" class="ly-sticky" data-stickyprev>
    <div class="ly-head">
      <span class="hint ly-m0"
        >👁 Live-Vorschau ({{ cellsN }} Kachel{{ cellsN === 1 ? '' : 'n' }}) — Kachel anklicken zum
        Bearbeiten:</span
      >
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
    <p v-if="hiddenList.length" class="hint ly-hidden" data-hiddeninfo>
      👁 Ausgeblendet:
      <button
        v-for="i in hiddenList"
        :key="i"
        type="button"
        class="hd-reset"
        :title="`Kachel ${i + 1} wieder einblenden`"
        :data-cellshowbtn="i"
        @click="show(i)"
      >
        Kachel {{ i + 1 }} einblenden
      </button>
      <span
        >– die übrigen Kacheln teilen den Platz symmetrisch; Einblenden stellt die Anordnung wieder
        her.</span
      >
    </p>
    <div data-layprev>
      <div data-layprevgrid :data-reflow="pv.reflow || ''" :style="pv.container">
        <div
          v-for="c in pv.cells"
          :key="c.i"
          :ref="(el) => setCellEl(c.i, el)"
          :data-prevcell="c.i"
          :title="`Kachel ${c.i + 1} bearbeiten`"
          :style="c.style"
          :class="{ 'ly-active': lyUi.activeCell === c.i }"
          @click="markCell(c.i, true)"
        >
          <div v-if="media(c.i)" :data-prevmedia="c.i" :style="cellImgStyle(c.s)">
            <video v-if="media(c.i)!.isVid" :src="media(c.i)!.src" muted :style="mediaFit"></video>
            <img v-else :src="slideSrc(c.i)" alt="" :style="mediaFit" />
          </div>
          <span v-else class="ly-nr">{{ c.i + 1 }}</span>
          <div
            :data-prevtext="c.i"
            :title="c.s.text ? 'Zum Verschieben ziehen' : undefined"
            :style="textStyle(c.i, c.s)"
            @pointerdown="onDown($event, c.i)"
            @pointermove="onMove($event, c.i)"
            @pointerup="onUp($event, c.i)"
            @pointercancel="onUp($event, c.i)"
            @click.stop
          >
            {{ c.s.text }}
          </div>
        </div>
        <p v-if="!pv.cells.length" class="hint ly-empty">
          Alle Kacheln ausgeblendet – auf der Seite erscheint kein Raster.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type ComponentPublicInstance,
} from 'vue';
import { clamp } from './layoutData';
import {
  cellImgStyle,
  cellTextStyle,
  isHidden,
  layoutCells,
  normLayout,
  previewLayout,
  setHidden,
  type CellStyle,
} from './gridData';
import { lyUi } from './layoutUi';
import { useLayout } from './useLayout';

/**
 * Sticky-Vorschau des Raster-Modus (wie `previewHtml` in
 * `public/layout-grid.js`): Kacheln im Design (bei „Standard für alle“ mit den
 * Werten der Master-Kachel), ausgeblendete Kacheln entfallen; Klick markiert,
 * Text ziehen verschiebt (Position in %); Diashow im gemeinsamen Takt.
 */
const { view, service, inherited, cellSlides, gridSlideshow, markCell, fontDecl, cell, toast } =
  useLayout();

const pv = computed(() =>
  previewLayout(view.value.m, service.layouts, service.layoutCols, service.syncProps),
);
const cellsN = computed(() =>
  layoutCells(service.layouts, normLayout(service.layouts, view.value.m.heroLayout)),
);
const hiddenList = computed(() =>
  Array.from({ length: cellsN.value }, (_, i) => i).filter((i) => isHidden(view.value.m, i)),
);
const mediaFit = computed(
  () =>
    `width:100%;height:100%;object-fit:${view.value.m.heroGridFit === 'contain' ? 'contain' : 'cover'};display:block`,
);
const media = (i: number) => service.resolve(view.value.m.heroGrid?.[i] || '');
const textStyle = (i: number, s: CellStyle) => {
  const css = cellTextStyle(s, fontDecl);
  return css && inherited(i) ? `${css};cursor:default;pointer-events:none` : css;
};
function show(i: number) {
  setHidden(view.value.m, i, false);
  toast(`Kachel ${i + 1} eingeblendet`);
}

// ---- Diashow der Kacheln (alle im gemeinsamen Takt, wie startGridSlideshow) ------------
const srcsOf = (i: number) => {
  const first = media(i);
  return [
    first && !first.isVid ? first.src : '',
    ...cellSlides(i).map((v) => service.resolve(v)?.src || ''),
  ].filter(Boolean);
};
function slideSrc(i: number) {
  const list = srcsOf(i);
  return list.length > 1 ? list[lyUi.gridTick % list.length] : media(i)!.src;
}
let timer: ReturnType<typeof setInterval> | null = null;
function stopTimer() {
  if (timer !== null) clearInterval(timer);
  timer = null;
}
watch(
  () =>
    [
      pv.value.cells.map((c) => srcsOf(c.i).join('|')).join('\n'),
      gridSlideshow().interval,
    ] as const,
  ([key, interval]) => {
    stopTimer();
    lyUi.gridTick = 0;
    if (!pv.value.cells.some((c) => srcsOf(c.i).length > 1) || !key) return;
    timer = setInterval(() => lyUi.gridTick++, Math.max(1, interval || 5) * 1000);
  },
  { immediate: true },
);

// ---- Text ziehen (Position in % der Kachel; geerbte Kacheln gesperrt) ---------------------
const cellEls = new Map<number, HTMLElement>();
function setCellEl(i: number, el: Element | ComponentPublicInstance | null) {
  if (el instanceof HTMLElement) cellEls.set(i, el);
  else cellEls.delete(i);
}
let drag: { i: number; moved: boolean; sx: number; sy: number } | null = null;
function onDown(e: PointerEvent, i: number) {
  if (e.button !== 0 || inherited(i) || !view.value.m.heroGridStyles?.[i]?.text) return;
  drag = { i, moved: false, sx: e.clientX, sy: e.clientY };
  (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  e.preventDefault();
}
function onMove(e: PointerEvent, i: number) {
  if (!drag || drag.i !== i) return;
  if (Math.abs(e.clientX - drag.sx) > 3 || Math.abs(e.clientY - drag.sy) > 3) drag.moved = true;
  const r = cellEls.get(i)?.getBoundingClientRect();
  if (!r || !r.width || !r.height) return;
  const s = cell(i);
  s.textX = Math.round(clamp(((e.clientX - r.left) / r.width) * 100, 0, 100));
  s.textY = Math.round(clamp(((e.clientY - r.top) / r.height) * 100, 0, 100));
}
function onUp(e: PointerEvent, i: number) {
  if (!drag || drag.i !== i) return;
  const moved = drag.moved;
  drag = null;
  const el = e.currentTarget as HTMLElement | null;
  if (el?.hasPointerCapture?.(e.pointerId)) el.releasePointerCapture(e.pointerId);
  if (!moved) markCell(i, true);
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
  gap: 0.5rem;
  margin: 0.1rem 0 0.35rem;
}
.ly-undo {
  display: inline-flex;
  gap: 0.3rem;
  margin-left: auto;
}
.ly-hidden {
  margin: 0 0 0.35rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem 0.5rem;
  align-items: center;
}
.ly-nr {
  color: var(--muted);
  font-size: 0.72rem;
}
.ly-active {
  outline: 3px solid var(--accent);
  outline-offset: -2px;
}
.ly-empty {
  margin: 0.4rem 0;
  text-align: center;
  width: 100%;
}
</style>
