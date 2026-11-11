<template>
  <div class="hd-texts" data-hd-texts>
    <p class="hint hd-m0">
      Texte des Hero-Bereichs. Leer lassen = Standardtext der Sprachdatei; mehrere Zeilen mit Enter.
      Die <strong>Feinabstimmung</strong> je Text geht den allgemeinen Einstellungen vor; Schriftart
      „Standard“ bzw. Größe 0 = allgemeine Einstellung. Die <strong>Textfarbe</strong> je Modus
      steht in den Seitenleisten unter „Hero-Texte – Farbe je Text“; Effekte wirken auf der
      veröffentlichten Seite. <strong>Verschieben:</strong> Text in der Vorschau oben mit der Maus
      ziehen, mit den Pfeiltasten bewegen (Shift = 10 px) oder unter „Verschiebung X / Y“ eintragen
      – der Platz im Hero bleibt, nur der Text wandert.
    </p>
    <div
      v-for="sl in service.textSlots"
      :key="sl.key"
      :class="['hd-txtrow', { 'hd-sel': selTxt === sl.key }]"
      :data-hdtxtrow="sl.key"
    >
      <div class="hd-line">
        <label class="hd-flabel hd-m0" :for="`${uid}-${sl.key}`">{{ sl.label }}</label>
        <button
          type="button"
          class="hd-reset"
          title="Text auf Standard zurücksetzen"
          aria-label="Text zurücksetzen"
          data-hdtxtreset="text"
          @click="resetText(sl)"
        >
          ↺ Text
        </button>
      </div>
      <TcDraftInput
        :id="`${uid}-${sl.key}`"
        multiline
        :rows="sl.key === 'hero.cta' ? 1 : 2"
        :value="overrideOf(sl)"
        :placeholder="defaultOf(sl)"
        :style="fieldFont(sl.key)"
        :data-hdtxt="sl.key"
        @input="setText(sl, $event)"
      />
      <details class="hd-tune" :open="tuneOpen(sl.key)" @toggle="onTuneToggle(sl.key, $event)">
        <summary :class="{ 'hd-tune--on': slotTuned(style(sl.key)) }">
          Feinabstimmung – Schriftart, Größe, Effekte (beide Modi){{
            slotTuned(style(sl.key)) ? ' •' : ''
          }}
        </summary>
        <div class="hd-line hd-end hd-mt">
          <UiSelect
            :model-value="style(sl.key).font"
            label="Schriftart"
            size="sm"
            :options="fontOptions(style(sl.key).font)"
            :data-txtfont="sl.key"
            @update:model-value="editStyle(sl.key).font = String($event)"
          />
          <button
            type="button"
            class="hd-reset"
            title="Schriftart zurücksetzen"
            aria-label="Schriftart zurücksetzen"
            data-hdtxtreset="font"
            @click="reset(sl.key, 'font')"
          >
            ↺
          </button>
          <label class="hd-field">
            <span>Textgröße (px, 0=Standard)</span>
            <span class="hd-line">
              <HdNum
                class="hd-num"
                :value="style(sl.key).size || 0"
                :min="0"
                :max="120"
                :data-txtsize="sl.key"
                @input="editStyle(sl.key).size = clampTextSize($event)"
              />
              <button
                type="button"
                class="hd-reset"
                title="Auf Standard zurücksetzen"
                aria-label="Größe zurücksetzen"
                data-hdtxtreset="size"
                @click="reset(sl.key, 'size')"
              >
                ↺
              </button>
            </span>
          </label>
          <div class="hd-field">
            <span
              title="Verschiebung gegenüber der normalen Position – in der Vorschau ziehen, Pfeiltasten (Shift = 10 px) oder hier eintragen"
              >Verschiebung X / Y (px)</span
            >
            <span class="hd-line">
              <HdNum
                class="hd-num hd-num--s"
                :value="style(sl.key).offsetX || 0"
                :min="-service.offsetMax.x"
                :max="service.offsetMax.x"
                title="Waagerecht: − nach links, + nach rechts"
                aria-label="Verschiebung X"
                :data-txtoff="`${sl.key}:x`"
                @input="setOff(sl.key, 'x', $event)"
              />
              <HdNum
                class="hd-num hd-num--s"
                :value="style(sl.key).offsetY || 0"
                :min="-service.offsetMax.y"
                :max="service.offsetMax.y"
                title="Senkrecht: − nach oben, + nach unten"
                aria-label="Verschiebung Y"
                :data-txtoff="`${sl.key}:y`"
                @input="setOff(sl.key, 'y', $event)"
              />
              <button
                type="button"
                class="hd-reset"
                title="Verschiebung zurücksetzen (0/0)"
                aria-label="Verschiebung zurücksetzen"
                data-hdtxtreset="off"
                @click="reset(sl.key, 'off')"
              >
                ↺
              </button>
            </span>
          </div>
        </div>
        <TextFxFields
          :st="style(sl.key)"
          :label="sl.label"
          :open="fxOpen(sl.key)"
          @set="(field, v) => setFx(sl.key, field, v)"
          @set-num="(field, v) => (editStyle(sl.key)[field] = clampFx(field, v))"
          @reset="reset(sl.key, 'fx')"
          @toggle="fxOpenState[sl.key] = $event"
        />
      </details>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, useId } from 'vue';
import { delPath, getPath, setPath } from '../../../public/model-core';
import { UiSelect } from '../../components/ui';
import TextFxFields from '../texts/TextFxFields.vue';
import {
  TEXT_FX_DEFAULTS,
  clampFx,
  clampTextSize,
  fxActive,
  type FxField,
  type TextStyle,
} from '../texts/textStyle';
import TcDraftInput from '../toolcards/TcDraftInput.vue';
import HdNum from './HdNum.vue';
import { clampOffset, slotTuned, type HeroSlotKey, type HeroTextSlot } from './heroData';
import { hdUi } from './heroUi';
import { useHero } from './useHero';

/**
 * Sektion „Hero-Texte“ (wie `heroTextsBody` in `public/design.js`): je Slot
 * (Titel, Untertitel, Button-Text) der Text als Override und die
 * Feinabstimmung für beide Modi – Schriftart, Größe, Verschiebung, Effekte.
 * Die Textfarbe je Modus steht in den Seitenleisten.
 */
const { service, view, style, editStyle, fontOptions, toast } = useHero();
const uid = `hd-tx-${useId()}`;

const TXT_OF = { cta: 'hero.cta', title: 'hero.title', subtitle: 'hero.subtitle' } as const;
const selTxt = computed(() => {
  const k = hdUi.selected?.kind;
  return k && k !== 'chip' ? TXT_OF[k] : '';
});

// ---- Texte (Overrides) -----------------------------------------------------------------
function overrideOf(sl: HeroTextSlot): string {
  const cur = getPath(view.value.ov, sl.path);
  return cur != null ? String(cur) : '';
}
function defaultOf(sl: HeroTextSlot): string {
  const d = getPath(view.value.defs, sl.path);
  return d != null ? String(d) : '';
}
function setText(sl: HeroTextSlot, v: string) {
  if (v.trim() === '') delPath(view.value.ov, sl.path);
  else setPath(view.value.ov, sl.path, v);
}
function resetText(sl: HeroTextSlot) {
  delPath(view.value.ov, sl.path);
  toast('Auf Standard zurückgesetzt');
}
function fieldFont(key: HeroSlotKey) {
  const font = style(key).font;
  const fam = font ? service.ensureFontFace(font) : '';
  return {
    minHeight: '48px',
    fontSize: '.95rem',
    ...(fam ? { fontFamily: `'${fam}', system-ui, sans-serif` } : {}),
  };
}

// ---- Feinabstimmung -------------------------------------------------------------------
function setOff(key: HeroSlotKey, axis: 'x' | 'y', raw: string) {
  const n = parseInt(raw, 10);
  const v = Number.isFinite(n) ? clampOffset(n, service.offsetMax[axis]) : 0;
  editStyle(key)[axis === 'y' ? 'offsetY' : 'offsetX'] = v;
}
function setFx(key: HeroSlotKey, field: FxField, v: string | boolean) {
  const s = editStyle(key);
  if (field === 'shadow') s.shadow = v === true;
  else if (field === 'anim') s.anim = v as TextStyle['anim'];
  else if (field === 'animSpeed') s.animSpeed = v as TextStyle['animSpeed'];
  else s[field] = String(v);
}
type ResetWhat = 'font' | 'size' | 'off' | 'fx';
function reset(key: HeroSlotKey, what: ResetWhat) {
  const st = editStyle(key);
  if (what === 'font') st.font = '';
  else if (what === 'size') st.size = 0;
  else if (what === 'off') {
    st.offsetX = 0;
    st.offsetY = 0;
  } else Object.assign(st, TEXT_FX_DEFAULTS);
  toast('Auf Standard zurückgesetzt');
}

// Auf-/zugeklappt: Startwert = „ist eingestellt“, danach wie vom Admin geklickt (sonst
// klappte der Bereich beim Zurücksetzen eines Werts unter der Maus zu).
const tuneOpenState = reactive<Record<string, boolean>>(
  Object.fromEntries(service.textSlots.map((sl) => [sl.key, slotTuned(style(sl.key))])),
);
const fxOpenState = reactive<Record<string, boolean>>(
  Object.fromEntries(service.textSlots.map((sl) => [sl.key, fxActive(style(sl.key))])),
);
const tuneOpen = (key: HeroSlotKey) => tuneOpenState[key] === true;
const fxOpen = (key: HeroSlotKey) => fxOpenState[key] === true;
function onTuneToggle(key: HeroSlotKey, e: Event) {
  tuneOpenState[key] = (e.target as HTMLDetailsElement).open;
}
</script>

<style scoped>
.hd-texts {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
}
.hd-m0 {
  margin: 0;
}
.hd-mt {
  margin-top: var(--ds-space-2);
}
.hd-line {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  flex-wrap: wrap;
}
.hd-end {
  align-items: flex-end;
}
.hd-flabel {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text);
}
.hd-txtrow {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
  margin-top: var(--ds-space-2);
  padding: var(--ds-space-2) var(--ds-space-1) 0;
  border-top: 1px dashed var(--border);
  border-radius: 6px;
}
.hd-sel {
  outline: 2px solid var(--accent);
}
.hd-field {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
  margin: 0;
  color: var(--ds-text-2);
  font-size: var(--ds-text-sm);
}
.hd-num {
  width: 110px;
}
.hd-num--s {
  width: 90px;
}
.hd-tune summary {
  cursor: pointer;
  color: var(--ds-text-3);
  font-size: 0.82rem;
  user-select: none;
}
.hd-tune summary.hd-tune--on {
  color: var(--ds-accent);
}
</style>
