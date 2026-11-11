<template>
  <div class="tc-layout" data-vue-tab="media">
    <!-- Links: Sprache übertragen, Design je Modus, Diashow -->
    <aside class="tc-side" data-tcside="left">
      <div class="tc-side-head left">🖼️ Design &amp; Diashow – {{ SECTION_LABEL[section] }}</div>
      <p class="hint">
        Umriss, Eckenradius, Deckkraft und Verdunkelung des Sektions-Mediums, getrennt für
        <strong>Hell</strong> und <strong>Dunkel</strong>; der Umschalter über der Vorschau (oder
        die zugeklappte Leiste hier) wählt den bearbeiteten Modus, der andere ist zugeklappt.
        Darunter die Diashow (nur bei Bildern).
      </p>
      <div class="panel md-copylang">
        <UiButton
          size="sm"
          class="md-wrap"
          :data-md-copylang="otherLang"
          :title="`Design (Hell + Dunkel), Diashow-Einstellungen und Text-Design dieser Sektion in die andere Sprache übernehmen – Medium, Bilder und Text bleiben`"
          @click="ask('copyLang')"
          >📋 Sektions-Design nach
          {{ otherLang === 'de' ? 'Deutsch' : 'English' }} übertragen</UiButton
        >
        <span class="hint md-m0"
          >(Hell + Dunkel, Diashow-Takt, Text-Design – Medium, Bilder und Text bleiben je
          Sprache)</span
        >
      </div>

      <template v-for="m in MODES" :key="m">
        <div
          v-if="m !== prevMode"
          class="panel tc-mode-collapsed"
          :data-md-design="m"
          :data-md-showmode="m"
          role="button"
          tabindex="0"
          :title="`${MODE_LABEL[m]}-Modus anzeigen und bearbeiten`"
          @click="prevMode = m"
          @keydown.enter.prevent="prevMode = m"
          @keydown.space.prevent="prevMode = m"
        >
          <span class="md-icon" aria-hidden="true">{{ m === 'dark' ? '🌙' : '☀️' }}</span>
          <span>{{ m === 'dark' ? 'Dunkelmodus' : 'Hellmodus' }} – anklicken zum Bearbeiten</span>
        </div>
        <div v-else class="panel" :data-md-design="m">
          <div class="md-head">
            <strong class="md-modetitle"
              >{{ MODE_LABEL[m] }} <span class="hint md-m0">👁</span></strong
            >
            <span class="md-btns">
              <button
                type="button"
                class="hd-reset"
                :data-md-copyside="m"
                :title="`Diese Werte in den ${MODE_LABEL[other(m)]}-Modus kopieren`"
                @click="copySide(m)"
              >
                → {{ other(m) === 'dark' ? 'Dunkel' : 'Hell' }} kopieren
              </button>
              <button
                type="button"
                class="hd-reset"
                :data-md-applyall="m"
                :title="`Dieses ${MODE_LABEL[m]}-Design als Standard für alle drei Sektionen übernehmen (Audio, Bild, Diverse)`"
                @click="ask('applyAll', m)"
              >
                ★ Für alle Sektionen
              </button>
              <button
                type="button"
                class="hd-reset"
                :data-md-resetall="m"
                title="Design dieses Modus auf Standard zurücksetzen"
                @click="ask('resetAll', m)"
              >
                ↺ Alles
              </button>
            </span>
          </div>
          <UiSwitch
            :model-value="side.customBorder"
            label="Eigener Umriss (aus = Standard-Rahmen)"
            data-md-customborder
            @update:model-value="side.customBorder = $event"
          />
          <div class="md-field">
            <span class="md-flabel">Umriss-Farbe</span>
            <span class="md-inline">
              <ColorField
                :model-value="side.borderColor"
                :disabled="!side.customBorder"
                label="Umriss-Farbe"
                data-md-bordercolor
                @update:model-value="side.borderColor = $event"
              />
              <button
                type="button"
                class="hd-reset"
                :disabled="!side.customBorder"
                title="Auf Standard zurücksetzen"
                aria-label="Umriss-Farbe zurücksetzen"
                data-md-sidereset="borderColor"
                @click="side.borderColor = service.defaultSide().borderColor"
              >
                ↺
              </button>
            </span>
          </div>
          <SliderControl
            v-for="s in SIDE_SLIDERS"
            :key="s.field"
            :model-value="side[s.field]"
            :label="s.label"
            :min="0"
            :max="s.max"
            :default-value="sideDefaults[s.field]"
            :disabled="s.needsBorder && !side.customBorder"
            :value-text="`${side[s.field]} ${s.unit}`"
            :input-class="`md-side-${s.field}`"
            @update:model-value="side[s.field] = clampSide(s.field, $event)"
          />
        </div>
      </template>

      <!-- Diashow -->
      <div v-if="mainRes?.isVid" class="panel" data-md-slides>
        <h2 class="md-h2sm">🎞️ Diashow</h2>
        <p class="hint md-m0">
          Das Medium dieser Sektion ist ein <strong>Video</strong> – die Diashow gilt nur für
          Bilder. Video bleibt wie bisher möglich.
        </p>
        <p v-if="cfg.slides.length" class="hint md-mt">
          {{ cfg.slides.length }} weitere Bild(er) sind hinterlegt und werden bei einem Bild-Medium
          wieder verwendet.
        </p>
      </div>
      <div v-else class="panel" data-md-slides>
        <h2 class="md-h2sm">🎞️ Diashow – weitere Bilder</h2>
        <p class="hint">
          Wechseln sich mit dem Sektions-Bild ab (Format 16:9 empfohlen). Bis zu
          {{ service.slidesMax }} weitere Bilder.
        </p>
        <p v-if="!cfg.slides.length" class="hint">
          Noch keine weiteren Bilder – das Bild bleibt statisch.
        </p>
        <div v-for="(v, i) in cfg.slides" :key="i + ':' + v" class="md-sliderow" data-md-sliderow>
          <span class="hint md-m0 md-slidenr">{{ i + 2 }}.</span>
          <div
            :class="['bg-thumb', 'md-slidethumb', { 'md-slidethumb--on': slideIdx === i + 1 }]"
            :title="slideTitle(v)"
          >
            <img v-if="service.resolve(v)" :src="service.resolve(v)!.src" alt="" />
            <span v-else class="hint md-m0">?</span>
          </div>
          <span class="md-btns md-push">
            <button
              type="button"
              class="hd-reset"
              :disabled="i === 0"
              title="Nach vorn"
              aria-label="Nach vorn"
              data-md-slideup
              @click="moveSlide(cfg.slides, i, -1)"
            >
              ↑
            </button>
            <button
              type="button"
              class="hd-reset"
              :disabled="i === cfg.slides.length - 1"
              title="Nach hinten"
              aria-label="Nach hinten"
              data-md-slidedown
              @click="moveSlide(cfg.slides, i, 1)"
            >
              ↓
            </button>
            <button
              type="button"
              class="hd-reset danger"
              title="Entfernen"
              aria-label="Entfernen"
              data-md-slideremove
              @click="cfg.slides.splice(i, 1)"
            >
              ✕
            </button>
          </span>
        </div>
        <div class="md-row">
          <UiButton
            size="sm"
            :disabled="cfg.slides.length >= service.slidesMax"
            data-md-slideadd
            @click="addSlide"
            >📂 Aus Zwischenspeicher anhängen</UiButton
          >
          <UiButton
            v-if="cfg.slides.length"
            size="sm"
            variant="danger"
            data-md-slideclear
            @click="ask('clearSlides')"
            >Alle entfernen</UiButton
          >
        </div>
        <div class="md-ss">
          <SliderControl
            :model-value="cfg.slideshow.interval"
            label="Anzeigedauer je Bild"
            :min="1"
            :max="30"
            :default-value="ssDefaults.interval"
            :disabled="!cfg.slides.length"
            :value-text="`${cfg.slideshow.interval} s`"
            input-class="md-ss-interval"
            @update:model-value="cfg.slideshow.interval = clampSlideshow('interval', $event)"
          />
          <SliderControl
            :model-value="cfg.slideshow.duration"
            label="Übergangsdauer"
            :min="0"
            :max="5000"
            :step="50"
            :default-value="ssDefaults.duration"
            :disabled="!cfg.slides.length"
            :value-text="`${cfg.slideshow.duration} ms`"
            input-class="md-ss-duration"
            @update:model-value="cfg.slideshow.duration = clampSlideshow('duration', $event)"
          />
          <UiSelect
            :model-value="cfg.slideshow.transition"
            label="Übergang"
            size="sm"
            :disabled="!cfg.slides.length"
            :options="transitionOptions"
            data-md-transition
            @update:model-value="setTransition(String($event))"
          />
          <UiSwitch
            :model-value="cfg.slideshow.pauseOnHover"
            label="Pause bei Mauszeiger"
            :disabled="!cfg.slides.length"
            @update:model-value="cfg.slideshow.pauseOnHover = $event"
          />
          <UiSwitch
            :model-value="cfg.slideshow.dots"
            label="Punkte zum Umschalten"
            :disabled="!cfg.slides.length"
            @update:model-value="cfg.slideshow.dots = $event"
          />
        </div>
      </div>
    </aside>

    <!-- Mitte: Sektionswahl, Vorschau, Medium, Hero -->
    <div class="tc-main">
      <div class="panel md-langhead">
        <h2 class="md-m0">
          {{ lang === 'de' ? '🇩🇪 Deutsche Startseite' : '🇬🇧 English homepage' }}
        </h2>
        <p class="hint">
          Diese Medien gelten nur für die {{ lang === 'de' ? 'deutsche' : 'englische' }} Startseite.
        </p>
      </div>

      <div class="panel">
        <h2>
          Sektions-Medien <span class="lang-badge">{{ lang.toUpperCase() }}</span>
        </h2>
        <p class="hint">
          Video oder Bild über den drei Tool-Sektionen der
          {{ lang === 'de' ? 'deutschen' : 'englischen' }} Startseite. Links Design (Hell/Dunkel)
          und Diashow, rechts der Text über dem Medium.
        </p>
        <UiSelect
          v-model="section"
          label="Sektion bearbeiten"
          :options="sectionOptions"
          class="md-sectionsel"
          data-md-section
        />
      </div>

      <div class="md-preview" data-md-preview>
        <div class="md-prevhead">
          <span class="hint md-m0">👁 Live-Vorschau ({{ SECTION_LABEL[section] }}):</span>
          <UiSegmentedControl
            v-model="prevMode"
            label="Vorschau-Modus"
            size="sm"
            :options="MODE_OPTIONS"
            data-md-prevmode
          />
          <span class="hint md-m0">– der andere Modus ist links zugeklappt.</span>
        </div>
        <div class="md-prevbox" :data-prevmode="prevMode" :style="{ background: prevBg }">
          <span :class="['md-prevlabel', `md-prevlabel--${prevMode}`]">{{
            MODE_VIEW[prevMode]
          }}</span>
          <div ref="wrapEl" class="md-wrap-box" :style="css.wrap" data-md-wrap>
            <div v-if="!mainRes" class="md-empty">
              <span class="hint md-m0">Kein Medium – unten zuweisen.</span>
            </div>
            <video
              v-else-if="mainRes.isVid"
              :src="mainRes.src"
              muted
              loop
              autoplay
              playsinline
              :style="MEDIA_BASE + ';' + css.media"
              data-md-media
            ></video>
            <img
              v-else
              :src="currentSrc"
              alt=""
              :style="MEDIA_BASE + ';' + css.media"
              data-md-media
            />
            <div
              v-if="cfg.text.text"
              title="Zum Verschieben ziehen"
              :style="overlay"
              data-md-overlay
              @pointerdown="dragStart"
              @pointermove="dragMove"
              @pointerup="dragEnd"
              @pointercancel="dragEnd"
            >
              {{ cfg.text.text }}
            </div>
          </div>
        </div>
      </div>

      <SlotPanel
        :slot-key="section"
        :title="`🎬 Medium: ${SECTION_LABEL[section]} Sektion`"
        :val="mainVal"
        :res="mainRes"
        :placeholder="service.defaultVal(section)"
        :empty-value="service.defaultVal(section)"
        reset-label="↺ Standard"
        small
        data-md-sectionslot
        @update:val="setSlotVal(media, section, $event)"
        @pick="pickSection"
        @reset="setSlotVal(media, section, service.defaultVal(section))"
      >
        <template #hint
          >Video <strong>oder</strong> Bild – wird je nach Datei automatisch passend angezeigt. Bei
          einem Bild ist links zusätzlich eine Diashow möglich.</template
        >
      </SlotPanel>

      <!-- Hero-Bereich -->
      <div class="panel" data-md-hero>
        <h2>Hero-Bereich (oben auf der Seite)</h2>
        <p class="hint">
          Anordnung, Form &amp; Kachel-Design stellst du im Tab <strong>Layout</strong> ein.
          <template v-if="heroGrid"
            >Hier (oder im Layout-Tab je Kachel) weist du den Plätzen die Bilder/Videos
            zu.</template
          >
          <template v-else
            >Das Banner samt Verlinkung und Design bearbeitest du im Tab
            <strong>Layout</strong>.</template
          >
        </p>
      </div>
      <template v-if="heroGrid">
        <SlotPanel
          v-for="c in heroCells"
          :key="c.key"
          :slot-key="c.key"
          :title="c.title"
          :val="getSlotVal(media, c.key)"
          :res="resolveVal(getSlotVal(media, c.key))"
          placeholder="/uploads/bild.jpg"
          empty-value=""
          reset-label="↺ Entfernen"
          with-link
          thumb
          :link="getHeroLink(media, c.key)"
          @update:val="setSlotVal(media, c.key, $event)"
          @update:link="setHeroLink(media, c.key, $event)"
          @pick="pickHero(c.key)"
          @reset="setSlotVal(media, c.key, '')"
        >
          <template #hint>Wird im Raster oben angezeigt. Leer = Feld bleibt frei.</template>
        </SlotPanel>
      </template>
      <div v-else class="panel" data-md-banner>
        <h2>Banner (ein Bild oder Video)</h2>
        <p class="hint">
          Das Banner-Bild/-Video, seine Verlinkung und das Banner-Design (Rahmen, Schatten,
          Deckkraft, Verdunkelung – Hell/Dunkel) bearbeitest du jetzt gesammelt im Tab
          <strong>Layout</strong>.
        </p>
        <template v-if="bannerRes">
          <video v-if="bannerRes.isVid" :src="bannerRes.src" muted class="md-thumb"></video>
          <img v-else :src="bannerRes.src" alt="" class="md-thumb" />
          <p :class="['st', 'md-break', bannerRes.localName ? 'local' : 'pub']">
            ●
            {{
              bannerRes.localName
                ? `lokal – wird beim Veröffentlichen hochgeladen (${bannerRes.localName})`
                : bannerVal
            }}
          </p>
        </template>
        <p v-else class="hint">Aktuell kein Banner gewählt.</p>
        <div class="md-row">
          <UiButton size="sm" data-md-gotolayout @click="gotoLayout()"
            >➡️ Zum Tab „Layout“</UiButton
          >
        </div>
      </div>
    </div>

    <!-- Rechts: Text-Overlay -->
    <aside class="tc-side" data-tcside="right">
      <div class="tc-side-head right">✍️ Text – {{ SECTION_LABEL[section] }}</div>
      <p class="hint">
        Optionaler Text über dem Sektions-Medium: Schriftart (aus <code>/fonts</code>), Farbe,
        Größe, Position (in der Vorschau mit der Maus ziehen), Deckkraft, Schatten und Umriss. Leer
        = kein Text.
      </p>
      <div class="panel">
        <div class="md-inline md-end">
          <UiTextField
            :model-value="cfg.text.text"
            label="Text"
            placeholder="z.B. Neu"
            maxlength="200"
            class="md-grow"
            :style="textFont"
            data-md-text
            @update:model-value="cfg.text.text = $event.slice(0, 200)"
          />
          <ResetBtn field="text" @reset="resetText" />
        </div>
        <label class="md-label">Schriftart</label>
        <span class="md-inline">
          <!-- Natives Select: Optionen erscheinen in ihrer eigenen Schrift. -->
          <select
            :value="cfg.text.font"
            :style="textFont"
            aria-label="Schriftart"
            data-md-font
            @change="cfg.text.font = ($event.target as HTMLSelectElement).value"
          >
            <option value="">Standard (System)</option>
            <option
              v-for="o in fontOptions"
              :key="o.name"
              :value="o.name"
              :style="o.family ? { fontFamily: `'${o.family}', system-ui, sans-serif` } : {}"
            >
              {{ o.label }}
            </option>
          </select>
          <ResetBtn field="font" @reset="resetText" />
        </span>
        <div class="md-row md-end">
          <div class="md-field">
            <span class="md-flabel">Textfarbe</span>
            <span class="md-inline">
              <ColorField
                :model-value="cfg.text.color"
                label="Textfarbe"
                data-md-textcolor
                @update:model-value="cfg.text.color = $event"
              />
              <ResetBtn field="color" @reset="resetText" />
            </span>
          </div>
          <TextNum
            :value="cfg.text.size"
            field="size"
            label="Größe (px, 0=auto)"
            @set="setTextNum"
            @reset="resetText"
          />
        </div>
        <span class="md-flabel md-mt"
          >Position <span class="hint md-m0">— in der Vorschau ziehen</span></span
        >
        <div class="md-inline md-wrapflex">
          <button
            v-for="p in POS_BUTTONS"
            :key="p.pos"
            type="button"
            class="hd-reset"
            :title="p.title"
            :aria-label="p.title"
            :data-md-pos="p.pos"
            @click="setPos(p.pos)"
          >
            {{ p.icon }}
          </button>
          <span class="hint md-m0" data-md-posval>{{ cfg.text.x }} / {{ cfg.text.y }} %</span>
          <ResetBtn field="pos" @reset="resetText" />
        </div>
        <SliderControl
          :model-value="cfg.text.opacity"
          label="Deckkraft"
          :min="0"
          :max="100"
          :default-value="textDefaults.opacity"
          :value-text="`${cfg.text.opacity} %`"
          input-class="md-text-opacity"
          @update:model-value="cfg.text.opacity = clampText('opacity', $event)"
        />
      </div>
      <div class="panel">
        <strong>Schatten</strong>
        <div class="md-mt">
          <UiSwitch
            :model-value="cfg.text.shadow"
            label="Textschatten anzeigen"
            data-md-shadow
            @update:model-value="cfg.text.shadow = $event"
          />
        </div>
        <div class="md-field">
          <span class="md-flabel">Schattenfarbe</span>
          <span class="md-inline">
            <ColorField
              :model-value="cfg.text.shadowColor"
              label="Schattenfarbe"
              @update:model-value="cfg.text.shadowColor = $event"
            />
            <ResetBtn field="shadowColor" @reset="resetText" />
          </span>
        </div>
        <div class="md-row md-end">
          <TextNum
            :value="cfg.text.shadowX"
            field="shadowX"
            label="Versatz X (px)"
            @set="setTextNum"
            @reset="resetText"
          />
          <TextNum
            :value="cfg.text.shadowY"
            field="shadowY"
            label="Versatz Y (px)"
            @set="setTextNum"
            @reset="resetText"
          />
        </div>
        <SliderControl
          :model-value="cfg.text.shadowBlur"
          label="Weichzeichnung"
          :min="0"
          :max="40"
          :default-value="textDefaults.shadowBlur"
          :value-text="`${cfg.text.shadowBlur} px`"
          @update:model-value="cfg.text.shadowBlur = clampText('shadowBlur', $event)"
        />
      </div>
      <div class="panel">
        <strong>Umriss</strong>
        <div class="md-field">
          <span class="md-flabel">Umriss-Farbe</span>
          <span class="md-inline">
            <ColorField
              :model-value="cfg.text.strokeColor"
              label="Umriss-Farbe"
              @update:model-value="cfg.text.strokeColor = $event"
            />
            <ResetBtn field="strokeColor" @reset="resetText" />
          </span>
        </div>
        <TextNum
          :value="cfg.text.strokeWidth"
          field="strokeWidth"
          label="Umriss-Dicke (px, 0=aus)"
          @set="setTextNum"
          @reset="resetText"
        />
      </div>
    </aside>

    <UiDialog
      :open="!!pending"
      :title="pending?.title ?? ''"
      :description="pending?.description"
      @close="pending = null"
    >
      <template #footer>
        <UiButton variant="ghost" @click="pending = null">Abbrechen</UiButton>
        <UiButton
          :variant="pending?.danger ? 'danger' : 'primary'"
          data-md-confirm
          @click="confirmPending"
          >{{ pending?.confirmLabel ?? 'OK' }}</UiButton
        >
      </template>
    </UiDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, shallowRef, watch } from 'vue';
import type { FontEntry, Lang, ThemeMode } from '../../../types';
import {
  ColorField,
  SliderControl,
  UiButton,
  UiDialog,
  UiSegmentedControl,
  UiSelect,
  UiSwitch,
  UiTextField,
} from '../../components/ui';
import { useToastStore } from '../../stores/toast';
import ResetBtn from './ResetBtn.vue';
import SlotPanel from './SlotPanel.vue';
import TextNum from './TextNum.vue';
import {
  MEDIA_BASE,
  MODE_LABEL,
  MODE_VIEW,
  POS_PRESET_Y,
  QUESTION,
  SECTION_KEYS,
  SECTION_LABEL,
  TRANSITION_LABEL,
  clamp,
  clampSide,
  clampSlideshow,
  clampText,
  copySectionDesign,
  designCss,
  fontFF,
  getHeroLink,
  getSlotVal,
  moveSlide,
  setHeroLink,
  setSlotVal,
  slideSources,
  textOverlayStyle,
  type MediaHost,
  type MediaService,
  type PosPreset,
  type SectionKey,
  type SectionSide,
  type SectionText,
  type SideNumField,
  type SlotKey,
  type TextNumField,
} from './mediaData';
import { mediaUi } from './mediaUi';

/**
 * Tab „Medien“ einer Sprache (Vue-Fassung von `renderMedia` in `public/media.ts`
 * und `public/sectionmedia.ts`): Sektions-Medien (Design je Modus, Diashow,
 * Text-Overlay) und die Plätze des Hero-Bereichs. Bearbeitet `state.media[lang]`
 * und dessen `sectionMedia[key]` direkt (Snapshot-Autosave/Undo bleiben
 * zuständig); Zwischenspeicher, Medien-Auswahl und Standardwerte kommen als
 * `service` von der Vanilla-Seite.
 */
const props = defineProps<{
  lang: Lang;
  /** `state.media[lang]` */
  media: MediaHost;
  service: MediaService;
  /** Seitenhintergrund je Modus (Tab „Hintergrund“ bzw. Standard). */
  pageBg: Record<ThemeMode, string>;
  fonts: FontEntry[];
  ensureFontFace: (file: string) => string;
  /** Wechselt zum Tab „Layout“ dieser Sprache. */
  gotoLayout: () => void;
}>();

const media = reactive(props.media);
const toasts = useToastStore();
const info = (msg: string) => toasts.addToast(msg, { type: 'info' });
const ok = (msg: string) => toasts.addToast(msg, { type: 'success' });

const MODES: ThemeMode[] = ['light', 'dark'];
const MODE_OPTIONS = MODES.map((m) => ({ value: m, label: MODE_LABEL[m] }));
const other = (m: ThemeMode): ThemeMode => (m === 'light' ? 'dark' : 'light');
const otherLang = computed<Lang>(() => (props.lang === 'de' ? 'en' : 'de'));

// ---- UI-Zustand (übersteht Neu-Mounts) ------------------------------------------
const section = computed<SectionKey>({
  get: () => (SECTION_KEYS.includes(mediaUi.section) ? mediaUi.section : 'audio'),
  set: (k) => (mediaUi.section = SECTION_KEYS.includes(k) ? k : 'audio'),
});
const prevMode = computed<ThemeMode>({
  get: () => mediaUi.prevMode,
  set: (m) => (mediaUi.prevMode = m === 'dark' ? 'dark' : 'light'),
});

// ---- Daten der gewählten Sektion ------------------------------------------------
const cfgOf = (lang: Lang, k: SectionKey) => reactive(props.service.sectionMedia(lang, k));
const cfg = computed(() => cfgOf(props.lang, section.value));
const side = computed(() => cfg.value.style[prevMode.value]);
const sideDefaults = props.service.defaultSide();
const textDefaults = props.service.defaultText();
const ssDefaults = props.service.defaultSlideshow();

const sectionOptions = computed(() =>
  SECTION_KEYS.map((k) => {
    const c = cfgOf(props.lang, k);
    return {
      value: k,
      label: `${SECTION_LABEL[k]} Sektion${c.text.text ? ' ✍️' : ''}${c.slides.length ? ' 🎞️' : ''}`,
    };
  }),
);

const resolveVal = (v: string) => (v ? props.service.resolve(v) : null);
const mainVal = computed(() => getSlotVal(media, section.value));
const mainRes = computed(() => resolveVal(mainVal.value));

// ---- Vorschau ---------------------------------------------------------------------
const prevBg = computed(() => props.pageBg[prevMode.value]);
const css = computed(() => designCss(side.value));
const family = (font: string) => (font ? props.ensureFontFace(font) : '');
const overlay = computed(() => textOverlayStyle(cfg.value.text, family(cfg.value.text.font)));
const textFont = computed(() => fontFF(family(cfg.value.text.font)));

// Vorschau-Diashow: Hauptbild + weitere Bilder im eingestellten Takt.
const srcs = computed(() => slideSources(mainRes.value, cfg.value.slides, props.service.resolve));
const slideIdx = ref(0);
const currentSrc = computed(() =>
  srcs.value.length ? srcs.value[slideIdx.value % srcs.value.length] : (mainRes.value?.src ?? ''),
);
let timer: ReturnType<typeof setInterval> | null = null;
function stopTimer() {
  if (timer !== null) clearInterval(timer);
  timer = null;
}
watch(
  () => [srcs.value.join('\n'), cfg.value.slideshow.interval] as const,
  () => {
    stopTimer();
    slideIdx.value = 0;
    const n = srcs.value.length;
    if (n < 2) return;
    timer = setInterval(
      () => (slideIdx.value = (slideIdx.value + 1) % n),
      Math.max(1, cfg.value.slideshow.interval) * 1000,
    );
  },
  { immediate: true },
);
onBeforeUnmount(stopTimer);

// Text in der Vorschau ziehen (wie `dragHandle` in `public/layout-shared.ts`).
const wrapEl = ref<HTMLElement | null>(null);
let dragging = false;
function dragStart(e: PointerEvent) {
  dragging = true;
  try {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  } catch {
    /* ignore */
  }
  e.preventDefault();
}
function dragMove(e: PointerEvent) {
  if (!dragging || !wrapEl.value) return;
  const r = wrapEl.value.getBoundingClientRect();
  if (!r.width || !r.height) return;
  cfg.value.text.x = Math.round(clamp(((e.clientX - r.left) / r.width) * 100, 0, 100));
  cfg.value.text.y = Math.round(clamp(((e.clientY - r.top) / r.height) * 100, 0, 100));
}
function dragEnd(e: PointerEvent) {
  if (!dragging) return;
  dragging = false;
  try {
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  } catch {
    /* ignore */
  }
}

// ---- Design je Modus --------------------------------------------------------------
const SIDE_SLIDERS: {
  field: SideNumField;
  label: string;
  max: number;
  unit: string;
  needsBorder: boolean;
}[] = [
  {
    field: 'borderWidth',
    label: 'Umriss-Dicke (0 = kein Rahmen)',
    max: 20,
    unit: 'px',
    needsBorder: true,
  },
  { field: 'borderRadius', label: 'Eckenradius', max: 80, unit: 'px', needsBorder: false },
  { field: 'opacity', label: 'Deckkraft', max: 100, unit: '%', needsBorder: false },
  { field: 'darken', label: 'Verdunkelung', max: 100, unit: '%', needsBorder: false },
];
function copySide(from: ThemeMode) {
  const to = other(from);
  cfg.value.style[to] = { ...cfg.value.style[from] };
  prevMode.value = to;
  ok(`Design nach ${MODE_LABEL[to]} kopiert`);
}

// ---- Diashow ---------------------------------------------------------------------
const transitionOptions = computed(() =>
  props.service.transitions.map((t) => ({ value: t, label: TRANSITION_LABEL[t] ?? t })),
);
function setTransition(v: string) {
  cfg.value.slideshow.transition = props.service.transitions.includes(v) ? v : 'fade';
}
function slideTitle(v: string): string {
  const r = props.service.resolve(v);
  return r?.localName ? `${r.localName} – lokal` : v;
}
function addSlide() {
  const c = cfg.value;
  const label = SECTION_LABEL[section.value];
  const opened = props.service.pick(
    { title: `Weiteres Bild für die ${label} Sektion wählen`, imagesOnly: true },
    (url) => {
      if (c.slides.length >= props.service.slidesMax) {
        info(`Maximal ${props.service.slidesMax} weitere Bilder`);
        return;
      }
      c.slides.push(url);
      ok('Bild an die Diashow angehängt');
    },
  );
  if (!opened) info('Keine Bilder vorhanden — zuerst im Tab „Dateien“ hinzufügen.');
}

// ---- Medien-Plätze ---------------------------------------------------------------
function pickSection() {
  const key = section.value;
  const opened = props.service.pick(
    { title: `Medium für die ${SECTION_LABEL[key]} Sektion wählen` },
    (url) => {
      setSlotVal(media, key, url);
      ok('Medium zugewiesen');
    },
  );
  if (!opened) info('Keine Medien vorhanden — zuerst im Tab „Dateien“ eine Datei hinzufügen.');
}
function pickHero(key: SlotKey) {
  const opened = props.service.pick({ title: 'Medium auswählen' }, (url) =>
    setSlotVal(media, key, url),
  );
  if (!opened) info('Keine Medien vorhanden — zuerst eine Datei hinzufügen.');
}
const heroGrid = computed(() => media.heroMode === 'grid');
const heroCells = computed(() => {
  const layout = media.heroLayout ?? 'grid3';
  const n = props.service.heroCells(layout);
  return Array.from({ length: n }, (_, i) => ({
    key: `grid${i}` as SlotKey,
    title: layout === 'mosaic' && i === 0 ? 'Große Kachel (links)' : `Kachel ${i + 1}`,
  }));
});
const bannerVal = computed(() => getSlotVal(media, 'heroBanner'));
const bannerRes = computed(() => resolveVal(bannerVal.value));

// ---- Text-Overlay ----------------------------------------------------------------
const POS_BUTTONS: { pos: PosPreset; icon: string; title: string }[] = [
  { pos: 'top', icon: '⤒', title: 'Oben' },
  { pos: 'center', icon: '◎', title: 'Mitte' },
  { pos: 'bottom', icon: '⤓', title: 'Unten' },
];
function setPos(p: PosPreset) {
  cfg.value.text.x = 50;
  cfg.value.text.y = POS_PRESET_Y[p];
}
function setTextNum(f: TextNumField, v: number) {
  cfg.value.text[f] = v;
}
/** Feld des Text-Overlays auf Standard (`pos` = x und y). */
function resetText(f: string) {
  const d = props.service.defaultText();
  const t = cfg.value.text;
  if (f === 'pos') {
    t.x = d.x;
    t.y = d.y;
  } else if (f in d) {
    const k = f as keyof SectionText;
    (t as unknown as Record<string, unknown>)[k] = d[k];
  }
}

const fontOptions = computed(() => {
  const cur = cfg.value.text.font;
  const list = props.fonts.slice();
  if (cur && !list.some((x) => x.name === cur))
    list.unshift({ name: cur, label: `${cur} (nicht gefunden)`, url: '', bytes: 0 });
  return list.map((x) => ({
    name: x.name,
    label: x.label || x.name,
    family: props.ensureFontFace(x.name),
  }));
});

// ---- Rückfragen ------------------------------------------------------------------
interface Pending {
  title: string;
  description: string;
  confirmLabel: string;
  danger: boolean;
  action: () => void;
}
const pending = shallowRef<Pending | null>(null);
function confirmPending() {
  const p = pending.value;
  pending.value = null;
  p?.action();
}
function ask(
  kind: 'resetAll' | 'applyAll' | 'copyLang' | 'clearSlides',
  mode: ThemeMode = 'light',
) {
  const c = cfg.value;
  const key = section.value;
  if (kind === 'resetAll')
    pending.value = {
      title: 'Design zurücksetzen?',
      description: QUESTION.resetAll(mode),
      confirmLabel: 'Zurücksetzen',
      danger: true,
      action: () => {
        c.style[mode] = props.service.defaultSide() as SectionSide;
        prevMode.value = mode;
        ok('Design zurückgesetzt');
      },
    };
  else if (kind === 'applyAll')
    pending.value = {
      title: 'Für alle Sektionen übernehmen?',
      description: QUESTION.applyAll(mode, key),
      confirmLabel: 'Übernehmen',
      danger: false,
      action: () => {
        for (const k of SECTION_KEYS)
          if (k !== key) cfgOf(props.lang, k).style[mode] = { ...c.style[mode] };
        prevMode.value = mode;
        ok(`${MODE_LABEL[mode]}-Design gilt jetzt für alle Sektionen`);
      },
    };
  else if (kind === 'copyLang') {
    const to = otherLang.value;
    pending.value = {
      title: 'Sektions-Design übertragen?',
      description: QUESTION.copyLang(key, to),
      confirmLabel: 'Übertragen',
      danger: false,
      action: () => {
        copySectionDesign(c, cfgOf(to, key));
        ok(`Sektions-Design nach ${to === 'de' ? 'Deutsch' : 'English'} übertragen`);
      },
    };
  } else
    pending.value = {
      title: 'Diashow leeren?',
      description: QUESTION.clearSlides,
      confirmLabel: 'Alle entfernen',
      danger: true,
      action: () => {
        c.slides.length = 0;
      },
    };
}
</script>

<style scoped>
.md-m0 {
  margin: 0;
}
.md-mt {
  margin-top: var(--ds-space-2);
}
.md-h2sm {
  font-size: 1rem;
  margin: 0 0 var(--ds-space-1);
}
.md-icon {
  font-size: 1.2rem;
}
.md-wrap {
  white-space: normal;
  height: auto;
  min-height: 32px;
  text-align: left;
  max-width: 100%;
}
.md-copylang {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--ds-space-1);
}
.md-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
  margin-bottom: var(--ds-space-2);
}
.md-modetitle {
  padding: 0 var(--ds-space-1);
  border-radius: var(--ds-radius-sm);
  outline: 2px solid var(--ds-accent);
}
.md-btns {
  display: inline-flex;
  flex-wrap: wrap;
  gap: var(--ds-space-1);
}
.md-push {
  margin-left: auto;
}
.md-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
  margin-top: var(--ds-space-2);
}
.md-end {
  align-items: flex-end;
}
.md-inline {
  display: flex;
  align-items: center;
  gap: var(--ds-space-1);
}
.md-wrapflex {
  flex-wrap: wrap;
}
.md-grow {
  flex: 1 1 auto;
  min-width: 0;
}
.md-field {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
  margin-top: var(--ds-space-2);
}
.md-flabel,
.md-label {
  display: block;
  font-size: 0.8rem;
  color: var(--ds-text-2);
}
.md-label {
  margin-top: var(--ds-space-2);
}
.md-num {
  width: 100px;
}
.md-ss {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
  margin-top: var(--ds-space-3);
}
.md-sliderow {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  margin: var(--ds-space-1) 0;
}
.md-slidenr {
  flex: 0 0 1.6rem;
  text-align: right;
}
.md-slidethumb {
  width: 72px;
  height: 40px;
}
.md-slidethumb--on {
  outline: 2px solid var(--ds-accent);
}
.md-langhead {
  border-color: var(--ds-accent);
}
.md-sectionsel {
  max-width: 320px;
}
.md-preview {
  position: sticky;
  top: 0.5rem;
  z-index: 5;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0.6rem 0.9rem;
  margin: 0 0 0.9rem;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.4); /* ds-content: wie Vanilla-Vorschau */
}
.md-prevhead {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
  margin-bottom: var(--ds-space-2);
}
.md-prevbox {
  position: relative;
  padding: 1.6rem 1rem 1rem;
  border-radius: 10px;
}
.md-prevlabel {
  position: absolute;
  top: 0.35rem;
  left: 0.6rem;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
}
/* ds-content: Etikett auf dem (frei wählbaren) Seitenhintergrund der Vorschau */
.md-prevlabel--light {
  background: rgba(0, 0, 0, 0.08);
  color: #1e293b;
}
.md-prevlabel--dark {
  background: rgba(255, 255, 255, 0.14);
  color: #e2e8f0;
}
.md-wrap-box {
  position: relative;
  max-width: 520px;
  margin: 0 auto;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: #000; /* ds-content */
  box-sizing: border-box;
}
.md-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1e293b; /* ds-content */
}
.md-inline.md-end {
  align-items: flex-end;
}
.md-break {
  overflow-wrap: anywhere;
}
.md-thumb {
  display: block;
  max-width: 220px;
  max-height: 160px;
  border-radius: 6px;
}
</style>
