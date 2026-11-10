<template>
  <aside class="tc-side" data-tcside="right">
    <div class="tc-side-head right">✍️ Banner-Text</div>
    <p class="hint">
      Optionaler Text über dem Banner: Schriftart (aus <code>/fonts</code>), Farbe, Größe, Position
      sowie Schatten, Umriss, Deckkraft und Animation. Leer = kein Text.
    </p>
    <div class="panel ly-copybox">
      <button
        type="button"
        class="hd-reset ly-wrapbtn"
        title="Schrift, Farbe, Größe, Position und Effekte in die andere Sprache übernehmen – der Text selbst bleibt je Sprache"
        :data-bannertextcopylang="OTHER"
        @click="emit('askCopyText')"
      >
        📋 Text-Design nach {{ LANG_LABEL[OTHER] }} übertragen<br /><span class="hint ly-m0"
          >(Schrift, Farbe, Größe, Position, Effekte – der Text selbst bleibt)</span
        >
      </button>
    </div>

    <div class="panel ly-col">
      <label class="ly-field" :for="`${uid}-text`">
        <span>Text</span>
      </label>
      <div class="ly-inline ly-grow">
        <textarea
          :id="`${uid}-text`"
          class="ly-text"
          rows="3"
          placeholder="z.B. Willkommen (Enter = neue Zeile)"
          :value="t.text"
          :style="fontStyle"
          data-bannerfield="text"
          @input="set('text', ($event.target as HTMLTextAreaElement).value)"
        ></textarea>
        <ResetBtn field="text" @reset="reset('text')" />
      </div>
      <div class="ly-inline ly-end">
        <UiSelect
          :model-value="t.font"
          label="Schriftart des Textes"
          size="sm"
          :options="fontOptions(t.font)"
          :style="fontStyle"
          data-bannerfont
          @update:model-value="set('font', String($event))"
        />
        <ResetBtn field="font" @reset="reset('font')" />
      </div>
      <TcColor
        field="textColor"
        label="Textfarbe"
        :value="t.textColor"
        @update="set('textColor', $event)"
        @reset="reset('textColor')"
      />
      <label class="ly-field">
        <span>Textgröße (px, 0=auto)</span>
        <span class="ly-inline">
          <HdNum
            class="ly-num"
            :value="t.textSize"
            :min="0"
            :max="96"
            data-bannerfield="textSize"
            @input="set('textSize', $event)"
          />
          <ResetBtn field="textSize" @reset="reset('textSize')" />
        </span>
      </label>
      <div class="ly-field">
        <span
          >Textposition <span class="ly-muted">— in der Vorschau mit der Maus ziehen</span></span
        >
        <span class="ly-inline">
          <button
            v-for="(lbl, p) in PRESETS"
            :key="p"
            type="button"
            class="hd-reset"
            :title="lbl.title"
            :aria-label="lbl.title"
            :data-bannerpospreset="p"
            @click="preset(p)"
          >
            {{ lbl.icon }}
          </button>
          <span class="hint ly-m0" data-bannerposval>{{ t.textX }} / {{ t.textY }} %</span>
          <ResetBtn field="pos" @reset="reset('pos')" />
        </span>
      </div>
    </div>

    <div class="panel ly-col">
      <strong>Text-Effekte</strong>
      <UiSwitch
        :model-value="t.textShadow"
        label="Textschatten anzeigen"
        data-bannerfield="textShadow"
        @update:model-value="set('textShadow', $event)"
      />
      <TcColor
        field="textShadowColor"
        label="Schattenfarbe"
        :value="t.textShadowColor"
        @update="set('textShadowColor', $event)"
        @reset="reset('textShadowColor')"
      />
      <div class="ly-inline ly-end">
        <label v-for="f in ['textShadowX', 'textShadowY'] as const" :key="f" class="ly-field">
          <span>Schatten-Versatz {{ f === 'textShadowX' ? 'X' : 'Y' }} (px)</span>
          <span class="ly-inline">
            <HdNum
              class="ly-num"
              :value="t[f]"
              :min="-50"
              :max="50"
              :data-bannerfield="f"
              @input="set(f, $event)"
            />
            <ResetBtn :field="f" @reset="reset(f)" />
          </span>
        </label>
      </div>
      <SliderControl
        :model-value="t.textShadowBlur"
        label="Schatten-Weichzeichnung"
        :min="0"
        :max="40"
        :default-value="6"
        :value-text="`${t.textShadowBlur} px`"
        input-class="ly-bt-textShadowBlur"
        @update:model-value="set('textShadowBlur', String($event))"
      />
      <div class="ly-sep"></div>
      <TcColor
        field="textStrokeColor"
        label="Umriss-Farbe"
        :value="t.textStrokeColor"
        @update="set('textStrokeColor', $event)"
        @reset="reset('textStrokeColor')"
      />
      <label class="ly-field">
        <span>Umriss-Dicke (px, 0=aus)</span>
        <span class="ly-inline">
          <HdNum
            class="ly-num"
            :value="t.textStrokeWidth"
            :min="0"
            :max="10"
            :step="0.5"
            data-bannerfield="textStrokeWidth"
            @input="set('textStrokeWidth', $event)"
          />
          <ResetBtn field="textStrokeWidth" @reset="reset('textStrokeWidth')" />
        </span>
      </label>
      <SliderControl
        :model-value="t.textOpacity"
        label="Deckkraft"
        :min="0"
        :max="100"
        :default-value="100"
        :value-text="`${t.textOpacity} %`"
        input-class="ly-bt-textOpacity"
        @update:model-value="set('textOpacity', String($event))"
      />
      <div class="ly-sep"></div>
      <div class="ly-inline ly-end">
        <UiSelect
          :model-value="t.textAnim"
          label="Animation"
          size="sm"
          :options="ANIM_OPTIONS"
          data-bannerfield="textAnim"
          @update:model-value="set('textAnim', String($event))"
        />
        <ResetBtn field="textAnim" @reset="reset('textAnim')" />
      </div>
      <label class="ly-field">
        <span>Intensität (1–10)</span>
        <span class="ly-inline">
          <HdNum
            class="ly-num"
            :value="t.textAnimIntensity"
            :min="1"
            :max="10"
            data-bannerfield="textAnimIntensity"
            @input="set('textAnimIntensity', $event)"
          />
          <ResetBtn field="textAnimIntensity" @reset="reset('textAnimIntensity')" />
        </span>
      </label>
      <div class="ly-inline ly-end">
        <UiSelect
          :model-value="t.textAnimSpeed"
          label="Geschwindigkeit"
          size="sm"
          :options="SPEED_OPTIONS"
          data-bannerfield="textAnimSpeed"
          @update:model-value="set('textAnimSpeed', String($event))"
        />
        <ResetBtn field="textAnimSpeed" @reset="reset('textAnimSpeed')" />
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue';
import { SliderControl, UiSelect, UiSwitch } from '../../components/ui';
import HdNum from '../hero/HdNum.vue';
import ResetBtn from '../media/ResetBtn.vue';
import TcColor from '../toolcards/TcColor.vue';
import {
  ANIM_LABEL,
  ANIM_SPEED_LABEL,
  LANG_LABEL,
  POS_PRESET_Y,
  otherLang,
  resetBannerText,
  setBannerText,
  type BannerTextField,
  type PosPreset,
} from './layoutData';
import { useLayout } from './useLayout';

/**
 * Rechte Seitenleiste „Banner-Text“ (wie `textSide` in
 * `public/layout-banner.js`): Text, Schrift, Farbe, Größe, Position und
 * Effekte (Schatten, Umriss, Deckkraft, Animation). Gilt für beide Modi.
 */
const emit = defineEmits<{ askCopyText: [] }>();
const { service, view, text: t, fontDecl, fontOptions, toast } = useLayout();
const uid = `ly-bt-${useId()}`;
const OTHER = otherLang(service.lang);

const fontStyle = computed(() => fontDecl(t.value.font));
const PRESETS: Record<PosPreset, { icon: string; title: string }> = {
  top: { icon: '⤒', title: 'Oben' },
  center: { icon: '◎', title: 'Mitte' },
  bottom: { icon: '⤓', title: 'Unten' },
};
const ANIM_OPTIONS = Object.entries(ANIM_LABEL).map(([value, label]) => ({ value, label }));
const SPEED_OPTIONS = Object.entries(ANIM_SPEED_LABEL).map(([value, label]) => ({
  value,
  label,
}));

function set(f: BannerTextField, raw: string | boolean) {
  setBannerText(view.value.m, f, raw);
}
function reset(f: BannerTextField | 'pos') {
  resetBannerText(view.value.m, f);
  toast('Auf Standard zurückgesetzt');
}
function preset(p: PosPreset) {
  const m = view.value.m;
  m.heroBannerTextX = 50;
  m.heroBannerTextY = POS_PRESET_Y[p];
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
.ly-col {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
}
.ly-inline {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.3rem;
}
.ly-grow > textarea {
  flex: 1 1 160px;
  min-width: 0;
}
.ly-end {
  align-items: flex-end;
  gap: var(--ds-space-2);
}
.ly-field {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
  margin: 0;
  color: var(--ds-text-2);
  font-size: var(--ds-text-sm);
}
.ly-muted {
  color: var(--muted);
  font-weight: 400;
}
.ly-num {
  width: 110px;
}
.ly-sep {
  border-top: 1px solid var(--border);
  margin: 0.4rem 0 0.2rem;
}
</style>
