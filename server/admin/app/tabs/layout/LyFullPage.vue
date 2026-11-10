<template>
  <details class="panel fp" data-smfull open>
    <summary class="fp-sum">
      🗺️ Ganze Seite – Vorschau: Medien &amp; Tool-Karten verschieben
    </summary>
    <div class="fp-bar">
      <span class="mode-switch" title="Vorschau im Hell- oder Dunkelmodus anzeigen">
        <button
          v-for="md in MODES"
          :key="md"
          type="button"
          :class="['hd-reset', { active: md === mode }]"
          :data-smfullmode="md"
          :aria-pressed="md === mode"
          @click="lyUi.fpMode = md"
        >
          {{ MODE_LABEL[md] }}
        </button>
      </span>
      <button
        type="button"
        class="hd-reset"
        data-smundo
        :disabled="!histN"
        title="Letzte Verschiebung rückgängig machen (auch nach dem Neu-Zeichnen)"
        @click="undo"
      >
        ↶ Rückgängig{{ histN ? ` (${histN})` : '' }}
      </button>
      <button
        type="button"
        class="hd-reset"
        data-smresetall
        title="Alle Verschiebungen (Hero-Medium, Sektions-Medien, Tool-Karten, Texte) auf 0 setzen – per „Rückgängig“ zurückholbar"
        @click="resetAll"
      >
        ↺ Ursprüngliche Anordnung
      </button>
      <UiSwitch
        :model-value="lyUi.fpGrid"
        label="📐 Hilfsraster"
        title="Temporäres Hilfsraster über der Vorschau (nicht auf der Seite)"
        data-smgrid
        @update:model-value="lyUi.fpGrid = $event"
      />
      <UiSelect
        :model-value="String(lyUi.fpStep)"
        size="sm"
        label="Rasterweite"
        label-hidden
        :options="STEP_OPTIONS"
        title="Rasterweite in px der Seite"
        data-smgridstep
        @update:model-value="setStep"
      />
      <UiSwitch
        :model-value="lyUi.fpSnap"
        label="einrasten"
        title="Beim Ziehen rastet die Kante auf den Rasterlinien ein; Pfeiltasten bewegen um eine Rasterweite (Shift: fünf)"
        data-smsnap
        @update:model-value="lyUi.fpSnap = $event"
      />
      <span class="hint fp-live" data-smlive>{{ live }}</span>
      <span class="hint ly-m0">
        Hero-Modus: {{ model.grid ? 'Kachel-Raster' : 'Einzelbanner' }}, Seiten-Layout:
        <strong>{{ model.compact ? 'Kompakt' : 'Klassisch' }}</strong> (oben umschalten).{{
          model.compact
            ? ' Im Kompakt-Layout stehen Hero-Medium und Texte fest nebeneinander; Verschiebungen im Hero wirken dort nicht.'
            : ''
        }}
      </span>
    </div>
    <p class="hint fp-intro">
      Schematische Ansicht der {{ service.lang === 'de' ? 'deutschen' : 'englischen' }} Startseite.
      <strong>Hero-Medium</strong>, die drei <strong>Sektions-Medien</strong>, jede
      <strong>Tool-Karte</strong> und die <strong>Texte</strong> lassen sich mit der Maus
      <strong>verschieben</strong> (Pfeiltasten auf dem fokussierten Element: 1 px, Shift = 10 px)
      oder unten über die Felder setzen. Der Versatz gilt 1:1 in Pixeln auf der Seite; der Platz im
      Seitenfluss bleibt, nur das Element wandert.
    </p>

    <div class="fp-sel" data-smselpanel>
      <span class="fp-strong">🎯 Ausgewählt:</span>
      <select
        class="fp-selkey"
        data-smselkey
        :value="cur"
        title="Element wählen – oder in der Vorschau anklicken"
        @change="pickKey(($event.target as HTMLSelectElement).value)"
      >
        <option v-for="k in groups.media" :key="k.key" :value="k.key">{{ k.label }}</option>
        <optgroup v-for="g in groups.rest" :key="g.label" :label="g.label">
          <option v-for="k in g.items" :key="k.key" :value="k.key">{{ k.label }}</option>
        </optgroup>
      </select>
      <label
        class="fp-num"
        title="Absolute Position: linke Kante, gemessen vom linken Rand der Seite (1200 px) – zum bündigen Ausrichten"
        >Links <HdNum :value="abs.l" data-smsell @input="onAbs('x', $event)"
      /></label>
      <label
        class="fp-num"
        title="Absolute Position: obere Kante, gemessen vom oberen Rand der Seite"
        >Oben <HdNum :value="abs.t" data-smselt @input="onAbs('y', $event)"
      /></label>
      <span class="hint ly-m0">px absolut</span>
      <label
        class="fp-num fp-muted"
        title="Versatz gegenüber dem eigenen Ausgangsplatz (px): − links, + rechts"
        >Versatz X
        <HdNum
          :value="curOff.x"
          :min="-service.fullPage.offsetMax.x"
          :max="service.fullPage.offsetMax.x"
          data-smselx
          @input="onSpin('x', $event)"
      /></label>
      <label class="fp-num fp-muted" title="Versatz (px): − oben, + unten"
        >Y
        <HdNum
          :value="curOff.y"
          :min="-service.fullPage.offsetMax.y"
          :max="service.fullPage.offsetMax.y"
          data-smsely
          @input="onSpin('y', $event)"
      /></label>
      <span v-if="isCard(cur)" class="fp-scale" data-smselscale>
        <label class="fp-num" title="Skalierung der Breite in % (Inhalt skaliert mit)"
          >B
          <HdNum
            :value="curOff.w ?? 100"
            :min="service.fullPage.scaleMin"
            :max="service.fullPage.scaleMax"
            data-smselw
            @input="onScale('w', $event)"
          />
          %</label
        >
        <label class="fp-num" title="Breite in px der Seite (rechnet in Prozent um)"
          >=
          <HdNum :value="abs.wpx" :min="1" data-smselwpx @input="onScalePx('w', $event)" />
          px</label
        >
        <label class="fp-num" title="Skalierung der Höhe in % (Inhalt skaliert mit)"
          >H
          <HdNum
            :value="curOff.h ?? 100"
            :min="service.fullPage.scaleMin"
            :max="service.fullPage.scaleMax"
            data-smselh
            @input="onScale('h', $event)"
          />
          %</label
        >
        <label class="fp-num" title="Höhe in px der Seite (rechnet in Prozent um)"
          >=
          <HdNum :value="abs.hpx" :min="1" data-smselhpx @input="onScalePx('h', $event)" />
          px</label
        >
      </span>
      <button
        type="button"
        class="hd-reset"
        data-smselreset
        title="Verschiebung (0/0) und Größe (100 %) dieses Elements zurücksetzen"
        aria-label="Verschiebung und Größe zurücksetzen"
        @click="resetKey(cur)"
      >
        ↺
      </button>
      <span class="hint fp-full">
        Element in der Vorschau anklicken (oder hier wählen). <strong>Links/Oben</strong> = absolute
        Kante auf der Seite (gleiche Werte = bündig), <strong>Versatz</strong> = Abstand zum eigenen
        Ausgangsplatz (wird gespeichert). Tool-Karten: <strong>Skalierungspunkte</strong> ziehen –
        Ecken proportional, Kanten nur Breite/Höhe. Bei „Standard für alle Slots“ (Tab „Texte“)
        bewegen sich die drei Überschriften gemeinsam.
      </span>
    </div>

    <div class="fp-cards" data-smcardsinfo>
      <template v-if="cardList.length">
        <span class="hint ly-m0">🃏 Verschobene Tool-Karten:</span>
        <span v-for="co in cardList" :key="co.id" class="fp-card-item">
          {{ co.title }}
          <span class="hint ly-m0"
            >({{ co.x }}/{{ co.y }}{{ isScaled(co) ? ` · ${co.w}×${co.h} %` : '' }})</span
          >
          <button
            type="button"
            class="hd-reset"
            :data-smoffreset="`card:${co.id}`"
            title="Verschiebung und Größe dieser Karte zurücksetzen"
            aria-label="Karte zurücksetzen"
            @click="resetKey(`card:${co.id}`)"
          >
            ↺
          </button>
        </span>
        <button
          type="button"
          class="hd-reset"
          data-smcardsreset
          title="Verschiebung aller Tool-Karten zurücksetzen"
          @click="resetCards"
        >
          ↺ alle Karten
        </button>
      </template>
      <span v-else class="hint ly-m0"
        >🃏 Tool-Karten: keine verschoben – Karte in der Vorschau ziehen.</span
      >
    </div>

    <StyleTag :css="model.css" />
    <div ref="wrapEl" class="fp-wrap" data-smfullwrap :style="{ background: model.pageBg }">
      <div
        ref="pageEl"
        data-smpage
        :data-scale="scale"
        :style="pageStyle"
        @pointerdown="onDown"
        @pointermove="onMove"
        @pointerup="onUp"
        @pointercancel="onUp"
        @click="onClick"
        @keydown="onKey"
        @dragstart.prevent
      >
        <div
          data-fpbox
          :data-fplayout="model.compact ? 'compact' : 'classic'"
          :data-fpnomedia="model.heroHasMedia ? undefined : ''"
          :data-fpgrid="model.grid ? '' : undefined"
          :style="heroBoxStyle"
        >
          <div
            v-if="model.heroHasMedia || !model.compact"
            data-fpmedia
            data-smfullmedia="hero"
            role="button"
            tabindex="0"
            :title="`Ziehen: Hero-Medium verschieben (Pfeiltasten: 1 px, Shift 10 px)${model.compact ? ' – im Kompakt-Layout ohne Wirkung' : ''}`"
            :style="`display:flex;flex-direction:column;align-items:center;gap:16px;margin-bottom:32px;${ms('hero')}`"
          >
            <div
              v-if="model.hero.kind === 'grid'"
              :style="`display:grid;grid-template-columns:repeat(${model.hero.cols},1fr);gap:16px;width:100%;max-width:${model.hero.maxW}px;margin:0 auto`"
            >
              <div
                v-for="t in model.hero.tiles"
                :key="t.i"
                :style="`position:relative;aspect-ratio:1 / 1;border-radius:14px;overflow:hidden;background:${c.card};display:flex;align-items:center;justify-content:center`"
              >
                <template v-if="t.media">
                  <video
                    v-if="t.media.isVid"
                    :src="t.media.src"
                    muted
                    playsinline
                    preload="metadata"
                    :style="t.media.style"
                  ></video>
                  <img v-else :src="t.media.src" alt="" :style="t.media.style" />
                </template>
                <span v-else :style="`color:${c.muted};font-size:14px`">Kachel {{ t.i + 1 }}</span>
              </div>
              <span v-if="!model.hero.tiles.length" :style="`color:${c.muted}`"
                >Alle Kacheln ausgeblendet</span
              >
            </div>
            <template v-else-if="model.hero.kind === 'media'">
              <video
                v-if="model.hero.media.isVid"
                :src="model.hero.media.src"
                muted
                playsinline
                preload="metadata"
                :style="model.hero.media.style"
              ></video>
              <img v-else :src="model.hero.media.src" alt="" :style="model.hero.media.style" />
            </template>
            <div v-else :style="`color:${c.muted};font-size:14px;padding:12px`">
              {{ model.hero.text }}
            </div>
          </div>
          <div
            data-fptitle
            v-bind="textAttrs('hero.title')"
            :style="`font-size:40px;font-weight:800;line-height:1.2;margin-bottom:12px;color:${c.title};${ms('text:hero.title')}${hide(model.shown.title)}`"
          >
            {{ model.title }}
          </div>
          <div
            data-fpsub
            v-bind="textAttrs('hero.subtitle')"
            :style="`font-size:17.6px;max-width:600px;margin:0 auto;white-space:pre-line;color:${c.title};${ms('text:hero.subtitle')}${hide(model.shown.subtitle)}`"
          >
            {{ model.subtitle }}
          </div>
          <div
            data-fpchips
            :style="`display:grid;grid-template-columns:repeat(6,1fr);gap:9.6px;margin-top:32px${hide(model.shown.chips)}`"
          >
            <div
              v-for="ch in model.chips"
              :key="ch.key"
              data-fpchip
              :style="`padding:13.6px 8px;border-radius:12px;background:${c.card};font-size:15.2px;font-weight:600;text-align:center;color:${c.title}${hide(!ch.hidden)}`"
            >
              {{ ch.label }}
            </div>
          </div>
          <div
            data-fpcta
            v-bind="textAttrs('hero.cta')"
            :style="`display:inline-block;margin-top:32px;padding:13.6px 35.2px;border-radius:50px;background:${dark ? '#e8a945' : '#014f99'};color:${dark ? '#1e293b' : '#fff'};font-weight:700;font-size:16.8px;${ms('text:hero.cta')}${hide(model.shown.cta)}`"
          >
            {{ model.cta }}
          </div>
        </div>

        <section
          v-for="sec in model.sections"
          :key="sec.key"
          :data-smfullsection="sec.key"
          :style="`max-width:${model.pageW}px;margin:0 auto;padding:80px 32px;box-sizing:border-box`"
        >
          <h2
            v-bind="textAttrs(sec.slot)"
            :style="`text-align:center;font-size:40px;font-weight:600;letter-spacing:.04em;line-height:1.2;margin:0 0 40px;color:${c.title};${ms(`text:${sec.slot}`)}`"
          >
            {{ sec.title }}
          </h2>
          <div
            :data-smfullmedia="sec.key"
            role="button"
            tabindex="0"
            :title="`${sec.label} – Ziehen: verschieben (Pfeiltasten: 1 px, Shift 10 px)`"
            :style="`width:100%;max-width:720px;margin:0 auto 24px;aspect-ratio:16 / 9;overflow:hidden;box-sizing:border-box;background:#000;${sec.wrapCss};${ms(sec.key)}`"
          >
            <template v-if="sec.media">
              <video
                v-if="sec.media.isVid"
                :src="sec.media.src"
                muted
                playsinline
                preload="metadata"
                :style="sec.media.style"
              ></video>
              <img v-else :src="sec.media.src" alt="" :style="sec.media.style" />
            </template>
            <div v-else :style="`${MEDIA_EMPTY}`">
              <span style="color: #94a3b8; font-size: 14px">Kein Medium</span>
            </div>
            <div :style="sec.text.css">{{ sec.text.text }}</div>
          </div>
          <div
            :data-smfullgrid="sec.key"
            :style="`display:grid;grid-template-columns:${sec.centered ? 'repeat(auto-fit,minmax(210px,300px));justify-content:center' : 'repeat(4,1fr)'};gap:20px;grid-auto-rows:1fr;position:relative;z-index:1`"
          >
            <div
              v-for="card in sec.cards"
              :key="card.id"
              :data-smfullmedia="`card:${card.id}`"
              :data-smcard="card.id"
              role="button"
              tabindex="0"
              :title="`${card.title} – Ziehen: verschieben (Pfeiltasten: 1 px, Shift 10 px); Punkte: Größe`"
              :style="`z-index:1;${ms(`card:${card.id}`)}`"
            >
              <span
                data-smhandles
                :style="{ display: lyUi.fpActive === `card:${card.id}` ? 'contents' : 'none' }"
              >
                <span
                  v-for="hd in HANDLES"
                  :key="hd.h"
                  :data-smhandle="hd.h"
                  :title="hd.title"
                  :style="`position:absolute;width:12px;height:12px;box-sizing:border-box;background:var(--accent);border:2px solid #fff;border-radius:2px;z-index:5;${hd.pos}`"
                ></span>
              </span>
              <div
                :style="`background:${card.d.bg};border:${card.d.border};border-radius:${card.d.radius}px;padding:17.6px 17.6px 13.6px;display:flex;flex-direction:column;gap:7.2px;height:100%;box-sizing:border-box;overflow:hidden`"
              >
                <div
                  v-if="card.svg"
                  :style="`width:44px;height:44px;border-radius:9.6px;overflow:hidden;background:${dark ? '#eef1f5' : '#ffffff'};box-sizing:border-box;padding:5px;flex-shrink:0;align-self:${card.d.alignSelf};${vis(card.d.hidden.icon)}`"
                >
                  <img
                    :src="card.svg"
                    alt=""
                    style="width: 100%; height: 100%; object-fit: contain; display: block"
                  />
                </div>
                <span
                  v-if="card.badge"
                  :style="`display:inline-block;font-size:${card.d.badgeSize}px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:${dark ? '#ffffff' : '#014f99'};background:${dark ? 'rgba(255,255,255,.1)' : 'rgba(1,79,153,.08)'};border:1px solid ${dark ? 'rgba(255,255,255,.25)' : 'rgba(1,79,153,.14)'};border-radius:5.6px;padding:2.4px 6.72px;white-space:nowrap;align-self:${card.d.alignSelf};margin-bottom:4.8px;${vis(card.d.hidden.badge)}`"
                  >{{ card.badge }}</span
                >
                <h3
                  :style="`font-size:${card.d.titleSize}px;font-weight:${card.d.titleWeight};color:${c.title};line-height:1.3;min-height:2.6em;margin:0 0 5.6px;white-space:pre-line;text-align:${card.d.align};${card.d.titleFont}${vis(card.d.hidden.title)}`"
                >
                  {{ card.title }}
                </h3>
                <div
                  style="
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-top: 8.8px;
                    padding-top: 8.8px;
                  "
                >
                  <span
                    :style="`display:inline-block;width:28px;height:28px;border-radius:50%;color:${c.muted};${vis(card.d.hidden.fav)}`"
                    ><svg
                      viewBox="0 0 24 24"
                      width="28"
                      height="28"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      style="padding: 6px; box-sizing: border-box"
                    >
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg
                  ></span>
                  <span :style="`font-size:12px;opacity:0;${vis(card.d.hidden.open)}`">Öffnen</span>
                </div>
              </div>
            </div>
            <p
              v-if="!sec.cards.length"
              :style="`color:${c.muted};grid-column:1 / -1;text-align:center`"
            >
              Keine Karten
            </p>
          </div>
        </section>
        <div
          data-smgridoverlay
          :style="`position:absolute;inset:0;pointer-events:none;z-index:60;display:${lyUi.fpGrid ? 'block' : 'none'};${gridOverlayCss(lyUi.fpStep, mode)}`"
        ></div>
      </div>
    </div>
  </details>
</template>

<script setup lang="ts">
import { computed, h, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import type { ThemeMode } from '../../../types';
import { UiSelect, UiSwitch } from '../../components/ui';
import HdNum from '../hero/HdNum.vue';
import {
  ARROWS,
  GRID_STEPS,
  HANDLES,
  MODE_LABEL,
  gridOverlayCss,
  isScaled,
  moveStyle,
  nextLine,
  resizeTo,
  snapTo,
  type FpHistEntry,
  type FpOffset,
  type ResizeStart,
} from './fullPageData';
import { fpHist, lyUi } from './layoutUi';
import { useLayout } from './useLayout';

/**
 * Ganzseiten-Vorschau (wie `fullPageHtml`/`bindFullPage` in
 * `public/layout-fullpage.js`): schematische Startseite in Originalbreite
 * (1200 px, per `zoom` eingepasst). Hero-Medium, Sektions-Medien, Tool-Karten
 * und Texte werden per Maus, Pfeiltasten oder Feldern verschoben; Tool-Karten
 * zusätzlich skaliert. Eigener Verlauf (↶) je Sprache; Lesen ändert nichts.
 */
const { service, view, styles, toast } = useLayout();
const fp = service.fullPage;
const lang = service.lang;
const MODES: ThemeMode[] = ['light', 'dark'];
/** @font-face der Seitenschrift + Kompakt-CSS als <style> (feste Texte aus dem Service). */
const StyleTag = (p: { css: string }) => h('style', p.css);
StyleTag.props = ['css'];
const STEP_OPTIONS = GRID_STEPS.map((n) => ({ value: String(n), label: `${n} px` }));
const MEDIA_EMPTY =
  'position:absolute;inset:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#1e293b';

const mode = computed<ThemeMode>(() => (lyUi.fpMode === 'dark' ? 'dark' : 'light'));
const dark = computed(() => mode.value === 'dark');
// Neu lesen, wenn sich ändert, was die Vorschau zeigt (Tab-Einstellungen, Banner-Design).
const depKey = computed(() => {
  const m = view.value.m;
  return JSON.stringify([
    m.heroMode,
    m.heroBanner,
    m.heroBannerShow,
    view.value.page.homeLayout,
    m.heroLayout,
    m.heroGrid,
    m.heroGridHidden,
    styles(),
  ]);
});
const model = computed(() => {
  void depKey.value;
  return fp.model(mode.value);
});
const c = computed(() => model.value.colors);
const heroBoxStyle = computed(
  () =>
    `max-width:${model.value.pageW}px;margin:32px auto 40px;padding:64px 32px;border-radius:32px;` +
    `background:${dark.value ? 'rgba(14,28,50,.8)' : 'rgba(255,255,255,.7)'};` +
    `border:1px solid ${dark.value ? 'rgba(232,169,69,.28)' : 'rgba(1,79,153,.25)'};text-align:center;box-sizing:border-box`,
);
const hide = (shown: boolean) => (shown ? '' : ';visibility:hidden');
const vis = (hidden: boolean) => (hidden ? 'visibility:hidden;' : '');
const isCard = (key: string) => key.startsWith('card:');

// ---- Elemente, Versatz (lokal gespiegelt, damit Ziehen nicht alles neu liest) ----
const keys = computed(() => {
  void model.value;
  return fp.keys();
});
const offs = reactive<Record<string, FpOffset>>({});
function loadOffsets() {
  for (const k of keys.value) offs[k.key] = fp.offset(k.key);
}
watch(keys, loadOffsets, { immediate: true });
const off = (key: string): FpOffset => offs[key] ?? { x: 0, y: 0 };
const ms = (key: string) => moveStyle(off(key), lyUi.fpActive === key);
const textAttrs = (slot: string) => ({
  'data-smfullmedia': `text:${slot}`,
  role: 'button',
  tabindex: 0,
  title: `${fp.labels[slot] ?? slot} – Ziehen: verschieben (Pfeiltasten: 1 px, Shift 10 px)`,
});
const cur = computed(() =>
  lyUi.fpActive && keys.value.some((k) => k.key === lyUi.fpActive) ? lyUi.fpActive : 'hero',
);
const curOff = computed(() => off(cur.value));
const groups = computed(() => {
  const media = keys.value.filter((k) => !k.group);
  const rest: { label: string; items: typeof media }[] = [];
  for (const k of keys.value) {
    if (!k.group) continue;
    let g = rest.find((x) => x.label === k.group);
    if (!g) rest.push((g = { label: k.group, items: [] }));
    g.items.push(k);
  }
  return { media, rest };
});
const labelOf = (key: string) =>
  keys.value.find((k) => k.key === key)?.label ?? fp.labels[key.replace(/^text:/, '')] ?? key;

const cardRev = ref(0);
const cardList = computed(() => {
  void cardRev.value;
  void model.value;
  return fp.cardOffsets();
});
const histRev = ref(0);
const histN = computed(() => {
  void histRev.value;
  return fpHist.stack(lang).length;
});
const live = ref('');
const showLive = (key: string) => {
  const o = off(key);
  live.value = `${labelOf(key)}: ${o.x} / ${o.y} px`;
};

/** Versatz schreiben und Anzeige (inkl. gemeinsam bewegter Überschriften) nachziehen. */
function put(key: string, x: number, y: number, w?: number, h?: number) {
  fp.setOffset(key, x, y, w, h);
  for (const k of fp.linkedKeys(key)) offs[k] = fp.offset(k);
  offs[key] = fp.offset(key);
  if (isCard(key)) cardRev.value++;
  showLive(key);
  measureSoon();
}
const snapshot = (key: string): FpHistEntry => ({ key, ...off(key) });
function record(entries: FpHistEntry[], coalesce = false) {
  if (entries.length && fpHist.push(lang, entries, coalesce)) histRev.value++;
}

// ---- Auswahl, absolute Werte (brauchen das fertige Layout inkl. Zoom) ----------------
const wrapEl = ref<HTMLElement | null>(null);
const pageEl = ref<HTMLElement | null>(null);
const scale = ref(0.5);
const pageStyle = computed(
  () =>
    `position:relative;width:${model.value.pageW}px;zoom:${scale.value};padding:8px 0 24px;` +
    `color:${c.value.text};${model.value.fontCss}line-height:1.6;box-sizing:border-box`,
);
const elOf = (key: string) =>
  pageEl.value?.querySelector<HTMLElement>(`[data-smfullmedia="${CSS.escape(key)}"]`) ?? null;
/** Ausgangsplatz (ohne Versatz) in Seiten-px. */
function originOf(el: HTMLElement, key: string) {
  const r = el.getBoundingClientRect();
  const pr = pageEl.value!.getBoundingClientRect();
  const o = off(key);
  return { x: (r.left - pr.left) / scale.value - o.x, y: (r.top - pr.top) / scale.value - o.y };
}
function baseSize(el: HTMLElement, o: FpOffset) {
  const r = el.getBoundingClientRect();
  return {
    W: r.width / scale.value / ((o.w ?? 100) / 100),
    H: r.height / scale.value / ((o.h ?? 100) / 100),
  };
}
const abs = reactive<{ l: number | ''; t: number | ''; wpx: number | ''; hpx: number | '' }>({
  l: '',
  t: '',
  wpx: '',
  hpx: '',
});
function measure() {
  const key = cur.value;
  const el = elOf(key);
  if (!el || !pageEl.value) return;
  const o = off(key);
  const org = originOf(el, key);
  abs.l = Math.round(org.x + o.x);
  abs.t = Math.round(org.y + o.y);
  if (isCard(key)) {
    const b = baseSize(el, o);
    abs.wpx = Math.round((b.W * (o.w ?? 100)) / 100);
    abs.hpx = Math.round((b.H * (o.h ?? 100)) / 100);
  }
}
const measureSoon = () => void nextTick(measure);
watch([cur, model, scale], measureSoon);

function mark(key: string) {
  lyUi.fpActive = key;
  showLive(key);
  measureSoon();
}
function pickKey(key: string) {
  mark(key);
  // Gewähltes Element im Vorschau-Rahmen sichtbar machen (nur der Rahmen scrollt).
  void nextTick(() => {
    const el = elOf(key);
    const w = wrapEl.value;
    if (!el || !w) return;
    const r = el.getBoundingClientRect();
    const wr = w.getBoundingClientRect();
    w.scrollTo?.({
      top: w.scrollTop + (r.top - wr.top) - wr.height / 2 + r.height / 2,
      behavior: 'smooth',
    });
  });
}
const num = (raw: string) => {
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
};
function onSpin(axis: 'x' | 'y', raw: string) {
  const n = num(raw);
  if (n === null) return;
  const key = cur.value;
  record([snapshot(key)], true);
  const o = { ...off(key) };
  o[axis] = fp.normOffset(n, axis);
  put(key, o.x, o.y);
}
function onAbs(axis: 'x' | 'y', raw: string) {
  const n = num(raw);
  const key = cur.value;
  const el = elOf(key);
  if (n === null || !el) return;
  record([snapshot(key)], true);
  const org = originOf(el, key);
  const o = { ...off(key) };
  o[axis] = fp.normOffset(n - org[axis], axis);
  put(key, o.x, o.y);
}
function onScale(axis: 'w' | 'h', raw: string) {
  const n = num(raw);
  const key = cur.value;
  if (n === null || !isCard(key)) return;
  record([snapshot(key)], true);
  const o = off(key);
  put(key, o.x, o.y, axis === 'w' ? n : o.w, axis === 'h' ? n : o.h);
}
function onScalePx(axis: 'w' | 'h', raw: string) {
  const n = num(raw);
  const key = cur.value;
  const el = elOf(key);
  if (n === null || n <= 0 || !isCard(key) || !el) return;
  const o = off(key);
  const b = baseSize(el, o);
  const pct = Math.round((n / (axis === 'w' ? b.W : b.H)) * 100);
  record([snapshot(key)], true);
  put(key, o.x, o.y, axis === 'w' ? pct : o.w, axis === 'h' ? pct : o.h);
}
function resetKey(key: string) {
  record([snapshot(key)]);
  put(key, 0, 0, 100, 100);
  toast('Verschiebung zurückgesetzt');
}
function resetCards() {
  const ids = fp.cardOffsetIds().map((id) => `card:${id}`);
  record(ids.map(snapshot));
  for (const k of ids) put(k, 0, 0, 100, 100);
  cardRev.value++;
  toast('Alle Tool-Karten zurückgesetzt');
}
function resetAll() {
  const moved = fp.movedKeys();
  if (!moved.length) {
    toast('Nichts verschoben – die Seite zeigt bereits die ursprüngliche Anordnung', {
      type: 'info',
    });
    return;
  }
  record(moved.map(snapshot));
  for (const k of moved) put(k, 0, 0, 100, 100);
  toast('Ursprüngliche Anordnung wiederhergestellt');
}
function undo() {
  const grp = fpHist.pop(lang);
  if (!grp) return;
  histRev.value++;
  for (const e of grp) put(e.key, e.x, e.y, e.w, e.h);
  if (grp[0]) mark(grp[0].key);
  toast('Verschiebung rückgängig gemacht');
}
function setStep(v: string | number) {
  const n = parseInt(String(v), 10);
  lyUi.fpStep = (GRID_STEPS as readonly number[]).includes(n) ? n : 20;
}

// ---- Ziehen, Skalieren, Pfeiltasten (Ereignisse an der Seite gebündelt) ---------------
type Drag =
  | {
      kind: 'move';
      key: string;
      el: HTMLElement;
      x: number;
      y: number;
      ox: number;
      oy: number;
      moved: boolean;
      origin: { x: number; y: number };
    }
  | { kind: 'resize'; key: string; x: number; y: number; rs: ResizeStart; rec: boolean };
let drag: Drag | null = null;
let suppressClick = false;
const target = (e: Event) =>
  (e.target as Element | null)?.closest?.<HTMLElement>('[data-smfullmedia]') ?? null;

function onDown(e: PointerEvent) {
  if (e.button !== 0) return;
  const el = target(e);
  if (!el) return;
  const key = el.dataset.smfullmedia!;
  const handle = (e.target as Element).closest?.<HTMLElement>('[data-smhandle]');
  if (handle) {
    e.preventDefault();
    const o = off(key);
    const full = { x: o.x, y: o.y, w: o.w ?? 100, h: o.h ?? 100 };
    const b = baseSize(el, full);
    drag = {
      kind: 'resize',
      key,
      x: e.clientX,
      y: e.clientY,
      rs: { handle: handle.dataset.smhandle!, o: full, W: b.W, H: b.H },
      rec: false,
    };
    mark(key);
  } else {
    const o = off(key);
    drag = {
      kind: 'move',
      key,
      el,
      x: e.clientX,
      y: e.clientY,
      ox: o.x,
      oy: o.y,
      moved: false,
      origin: originOf(el, key),
    };
    showLive(key);
  }
  pageEl.value?.setPointerCapture?.(e.pointerId);
}
function onMove(e: PointerEvent) {
  if (!drag) return;
  const sc = scale.value;
  if (drag.kind === 'resize') {
    const dx = (e.clientX - drag.x) / sc;
    const dy = (e.clientY - drag.y) / sc;
    if (!drag.rec) {
      if (Math.abs(dx) < 2 && Math.abs(dy) < 2) return;
      drag.rec = true;
      record([{ key: drag.key, ...drag.rs.o }]);
    }
    const n = resizeTo(drag.rs, dx, dy, fp.normScale);
    put(drag.key, n.x, n.y, n.w, n.h);
    return;
  }
  const dx = e.clientX - drag.x;
  const dy = e.clientY - drag.y;
  if (!drag.moved && Math.abs(dx) < 3 && Math.abs(dy) < 3) return;
  if (!drag.moved) record([{ key: drag.key, ...off(drag.key), x: drag.ox, y: drag.oy }]);
  drag.moved = true;
  let nx = drag.ox + dx / sc;
  let ny = drag.oy + dy / sc;
  if (lyUi.fpSnap && lyUi.fpGrid) ({ x: nx, y: ny } = snapTo(drag.origin, nx, ny, lyUi.fpStep));
  put(drag.key, nx, ny);
}
function onUp(e: PointerEvent) {
  if (!drag) return;
  const d = drag;
  drag = null;
  if (pageEl.value?.hasPointerCapture?.(e.pointerId))
    pageEl.value.releasePointerCapture(e.pointerId);
  if (d.kind === 'resize' || d.moved) {
    suppressClick = true;
    setTimeout(() => (suppressClick = false), 0);
    mark(d.key);
  }
}
function onClick(e: MouseEvent) {
  if (suppressClick) return;
  const el = target(e);
  if (el && !(e.target as Element).closest?.('[data-smhandle]')) mark(el.dataset.smfullmedia!);
}
function onKey(e: KeyboardEvent) {
  const dir = ARROWS[e.key];
  const el = target(e);
  if (!dir || !el) return;
  e.preventDefault();
  const key = el.dataset.smfullmedia!;
  if (lyUi.fpActive !== key) mark(key);
  record([snapshot(key)], true);
  const o = off(key);
  if (lyUi.fpSnap && lyUi.fpGrid) {
    const origin = originOf(el, key);
    const lines = e.shiftKey ? 5 : 1;
    const nx = nextLine(origin.x + o.x, dir[0], lyUi.fpStep, lines);
    const ny = nextLine(origin.y + o.y, dir[1], lyUi.fpStep, lines);
    put(key, nx - origin.x, ny - origin.y);
  } else {
    const step = e.shiftKey ? 10 : 1;
    put(key, o.x + dir[0] * step, o.y + dir[1] * step);
  }
}

// ---- Zoom: 1200 px breite Seite in die Spalte einpassen (max. 1:1) --------------------
let ro: ResizeObserver | null = null;
function fit() {
  const w = (wrapEl.value?.clientWidth ?? 0) - 2;
  scale.value = w > 0 ? Math.min(1, w / model.value.pageW) : 0.5;
}
onMounted(() => {
  fit();
  if (typeof ResizeObserver !== 'undefined' && wrapEl.value) {
    ro = new ResizeObserver(fit);
    ro.observe(wrapEl.value);
  }
  measureSoon();
});
onBeforeUnmount(() => ro?.disconnect());
</script>

<style scoped>
.ly-m0 {
  margin: 0;
}
.fp {
  padding: 0.7rem 0.9rem;
}
.fp-sum {
  cursor: pointer;
  font-weight: 700;
  color: var(--text);
}
.fp-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem 0.8rem;
  flex-wrap: wrap;
  margin: 0.4rem 0 0.2rem;
}
.fp-live {
  margin: 0;
  min-width: 12rem;
}
.fp-intro {
  margin: 0.3rem 0;
}
.fp-sel {
  display: flex;
  align-items: center;
  gap: 0.4rem 0.6rem;
  flex-wrap: wrap;
  padding: 0.45rem 0.6rem;
  margin: 0.2rem 0 0.4rem;
  border: 1px solid var(--accent);
  border-radius: 8px;
}
.fp-strong {
  font-weight: 600;
  color: var(--text);
}
.fp-selkey {
  width: auto;
  max-width: 320px;
  padding: 0.3rem 0.5rem;
}
.fp-num {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  margin: 0;
  color: var(--text);
  font-size: 0.85rem;
}
.fp-num input {
  width: 80px;
  padding: 0.3rem 0.4rem;
}
.fp-muted {
  color: var(--muted);
}
.fp-scale {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem 0.6rem;
  flex-wrap: wrap;
}
.fp-full {
  margin: 0;
  flex-basis: 100%;
}
.fp-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem 0.6rem;
  align-items: center;
  margin: 0 0 0.6rem;
}
.fp-card-item {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.85rem;
  color: var(--text);
}
.fp-wrap {
  overflow: auto;
  max-height: 70vh;
  border: 1px solid var(--border);
  border-radius: 10px;
  resize: vertical;
}
</style>
