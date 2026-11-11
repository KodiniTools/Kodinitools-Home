<template>
  <aside class="tc-side" :data-tcside="mode">
    <div :class="['tc-side-head', mode]">{{ dark ? '🌙 Dunkelmodus' : '☀️ Hellmodus' }}</div>

    <p v-if="!view.editsOwn" class="hint tc-mt" data-tc-sidestd>
      Diese Karte nutzt das Standard-Design. In der Mitte „Eigenes Design für diese Karte“
      aktivieren, um sie einzeln zu gestalten.
    </p>
    <template v-else>
      <div class="tc-line tc-mt">
        <button
          type="button"
          class="hd-reset"
          title="Rahmen, Hintergrund, Bild, Hover und Text-Farben dieses Modus in den anderen Modus übertragen"
          data-tccopyside
          @click="copySide"
        >
          {{ dark ? '⬅️ Nach Hell kopieren' : '➡️ Nach Dunkel kopieren' }}
        </button>
      </div>

      <TcDetails>
        <template #title>🖼️ Rahmen</template>
        <TcColor
          field="borderColor"
          label="Rahmenfarbe"
          :value="s.borderColor"
          @update="set({ borderColor: $event })"
          @reset="reset(['borderColor'])"
        />
        <SliderControl
          :model-value="s.borderOpacity"
          label="Rahmenfarbe – Transparenz"
          :default-value="src.borderOpacity"
          :value-text="`${s.borderOpacity} %`"
          @update:model-value="set({ borderOpacity: pct($event, s.borderOpacity) })"
        />
        <SliderControl
          :model-value="s.borderWidth"
          label="Breite"
          :max="8"
          :default-value="src.borderWidth"
          :value-text="`${s.borderWidth} px`"
          input-class="tc-bw"
          @update:model-value="set({ borderWidth: clampInt($event, 0, 8, s.borderWidth) })"
        />
        <div class="tc-line tc-end">
          <UiSelect
            :model-value="s.borderStyle"
            label="Linienart"
            size="sm"
            :options="borderOptions"
            data-tc-borderstyle
            @update:model-value="setBorderStyle(String($event))"
          />
          <button
            type="button"
            class="hd-reset"
            title="Auf Standard zurücksetzen"
            aria-label="Linienart auf Standard zurücksetzen"
            @click="reset(['borderStyle'])"
          >
            ↺
          </button>
        </div>
        <SliderControl
          :model-value="s.borderRadius"
          label="Eckenradius"
          :max="40"
          :default-value="src.borderRadius"
          :value-text="`${s.borderRadius} px`"
          @update:model-value="set({ borderRadius: clampInt($event, 0, 40, s.borderRadius) })"
        />
        <p class="hint tc-m0">
          Breite 0 = kein Rahmen. Transparenz 0 % = unsichtbarer Rahmen (Platz bleibt erhalten).
        </p>
      </TcDetails>

      <TcDetails>
        <template #title>🎨 Hintergrund</template>
        <TcColor
          field="bgColor"
          :label="s.gradient ? 'Startfarbe' : 'Hintergrundfarbe'"
          :value="s.bgColor"
          @update="set({ bgColor: $event })"
          @reset="reset(['bgColor'])"
        />
        <SliderControl
          :model-value="s.bgOpacity"
          label="Hintergrund – Transparenz"
          :default-value="src.bgOpacity"
          :value-text="`${s.bgOpacity} %`"
          @update:model-value="set({ bgOpacity: pct($event, s.bgOpacity) })"
        />
        <div class="tc-line">
          <UiSwitch
            :model-value="s.gradient"
            label="Farbverlauf"
            data-tc-gradient
            @update:model-value="set({ gradient: $event })"
          />
          <button
            type="button"
            class="hd-reset"
            title="Verlauf auf Standard zurücksetzen"
            aria-label="Verlauf auf Standard zurücksetzen"
            @click="reset(['gradient', 'bgColor2', 'gradientAngle'])"
          >
            ↺
          </button>
        </div>
        <div :class="['tc-col', { 'tc-dim': !s.gradient }]" data-tcgradrow>
          <TcColor
            field="bgColor2"
            label="Endfarbe"
            :value="s.bgColor2"
            :disabled="!s.gradient"
            @update="set({ bgColor2: $event })"
            @reset="reset(['bgColor2'])"
          />
          <SliderControl
            :model-value="s.gradientAngle"
            label="Richtung"
            :max="360"
            :default-value="src.gradientAngle"
            :disabled="!s.gradient"
            :value-text="`${s.gradientAngle}°`"
            @update:model-value="set({ gradientAngle: clampInt($event, 0, 360, s.gradientAngle) })"
          />
        </div>
        <p class="hint tc-m0">
          Die Transparenz gilt für beide Verlaufsfarben. 0° = von unten nach oben, 90° = von links
          nach rechts.
        </p>
      </TcDetails>

      <TcDetails>
        <template #title>🖼️ Hintergrundbild</template>
        <div class="tc-line tc-start">
          <div class="bg-thumb" data-tcimgthumb>
            <img v-if="imgUrl" :src="imgUrl" alt="" />
            <span v-else class="hint tc-m0">Kein Bild</span>
          </div>
          <div class="tc-line">
            <UiButton size="sm" data-tcimgpick @click="pickImage">📂 Mediathek</UiButton>
            <UiButton
              size="sm"
              variant="danger"
              :disabled="!s.bgImage"
              data-tcimgclear
              @click="setRaw({ bgImage: '' })"
              >Entfernen</UiButton
            >
            <button
              type="button"
              class="hd-reset"
              title="Bild auf Standard zurücksetzen"
              aria-label="Bild auf Standard zurücksetzen"
              @click="reset(['bgImage', 'bgImageOpacity', 'bgImageDarken'])"
            >
              ↺
            </button>
          </div>
        </div>
        <label class="tc-flabel" :for="urlId"
          >Bild-URL <span class="hint tc-m0">(/uploads/… oder https://…)</span></label
        >
        <input
          :id="urlId"
          type="text"
          :value="staged ? '' : s.bgImage"
          :placeholder="
            staged ? 'Lokales Medium (wird beim Veröffentlichen hochgeladen)' : '/uploads/…'
          "
          data-tc-imageurl
          @change="setImageUrl($event)"
        />
        <div :class="['tc-col', { 'tc-dim': !s.bgImage }]">
          <SliderControl
            :model-value="s.bgImageOpacity"
            label="Deckkraft"
            :default-value="src.bgImageOpacity"
            :disabled="!s.bgImage"
            :value-text="`${s.bgImageOpacity} %`"
            @update:model-value="set({ bgImageOpacity: pct($event, s.bgImageOpacity) })"
          />
          <SliderControl
            :model-value="s.bgImageDarken"
            label="Abdunkelung"
            :default-value="src.bgImageDarken"
            :disabled="!s.bgImage"
            :value-text="`${s.bgImageDarken} %`"
            @update:model-value="set({ bgImageDarken: pct($event, s.bgImageDarken) })"
          />
        </div>
        <p class="hint tc-m0">
          Liegt über Farbe/Verlauf und unter Text und Icon; wird auf die Kartengröße zugeschnitten
          (mittig). Empfehlung: 600 × 400 px (3:2), WebP unter 60 KB, ruhiges Motiv; Abdunkelung
          30–50 % für lesbaren Text.<strong v-if="staged">
            ● lokal – wird beim Veröffentlichen hochgeladen.</strong
          >
        </p>
      </TcDetails>

      <TcDetails>
        <template #title>✨ Hover (beim Überfahren)</template>
        <TcColor
          field="hoverBorderColor"
          label="Rahmenfarbe (Hover)"
          :value="s.hoverBorderColor"
          @update="set({ hoverBorderColor: $event })"
          @reset="reset(['hoverBorderColor'])"
        />
        <SliderControl
          :model-value="s.hoverBorderOpacity"
          label="Rahmenfarbe (Hover) – Transparenz"
          :default-value="src.hoverBorderOpacity"
          :value-text="`${s.hoverBorderOpacity} %`"
          @update:model-value="set({ hoverBorderOpacity: pct($event, s.hoverBorderOpacity) })"
        />
        <TcColor
          field="hoverBgColor"
          label="Hintergrund (Hover)"
          :value="s.hoverBgColor"
          @update="set({ hoverBgColor: $event })"
          @reset="reset(['hoverBgColor'])"
        />
        <SliderControl
          :model-value="s.hoverBgOpacity"
          label="Hintergrund (Hover) – Transparenz"
          :default-value="src.hoverBgOpacity"
          :value-text="`${s.hoverBgOpacity} %`"
          @update:model-value="set({ hoverBgOpacity: pct($event, s.hoverBgOpacity) })"
        />
        <p class="hint tc-m0">
          Hintergrund-Transparenz 0 % = der Hintergrund bleibt beim Überfahren unverändert
          (Standard).
        </p>
      </TcDetails>

      <TcDetails>
        <template #title>🔤 Text-Farben</template>
        <template v-for="f in TEXT_COLORS" :key="f.field">
          <TcColor
            :field="f.field"
            :label="f.label"
            toggle
            :on="!!s[f.field]"
            :value="s[f.field] || TEXT_COLOR_SUGGEST[mode][f.field]"
            :disabled="!s[f.field]"
            @toggle="set({ [f.field]: $event ? TEXT_COLOR_SUGGEST[mode][f.field] : '' })"
            @update="set({ [f.field]: $event })"
            @reset="reset([f.field])"
          />
          <SliderControl
            v-if="f.field === 'badgeBgColor'"
            :model-value="s.badgeBgOpacity"
            label="Badge-Hintergrund – Transparenz"
            :default-value="src.badgeBgOpacity"
            :disabled="!s.badgeBgColor"
            :value-text="`${s.badgeBgOpacity} %`"
            @update:model-value="set({ badgeBgOpacity: pct($event, s.badgeBgOpacity) })"
          />
        </template>
        <p class="hint tc-m0">
          Schalter aus = Standardfarbe der Seite (passt sich dem Modus an). Popup = Beschreibung
          beim Überfahren der Karte.
        </p>
      </TcDetails>
    </template>
  </aside>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue';
import type { ThemeMode } from '../../../types';
import { normSiteMediaUrl } from '../../../public/model-core';
import { SliderControl, UiButton, UiSelect, UiSwitch } from '../../components/ui';
import TcColor from './TcColor.vue';
import TcDetails from './TcDetails.vue';
import {
  BORDER_STYLE_LABEL,
  TEXT_COLOR_SUGGEST,
  THEME_LABEL,
  clampInt,
  clone,
  type TcSide,
  type TextColorField,
} from './tcData';
import { useTc } from './useTc';

/**
 * Seitenleiste eines Modus im Tab „Tool-Karten“: Rahmen, Hintergrund,
 * Hintergrundbild, Hover und Text-Farben (wie `sideBlock` in
 * `public/toolcards.ts`).
 */
const props = defineProps<{ mode: ThemeMode }>();
const { service, view, setSide, resetSide, resetSource, ensureEnabled, toast } = useTc();
const dark = computed(() => props.mode === 'dark');
const urlId = `tc-url-${useId()}`;

const TEXT_COLORS: readonly { field: TextColorField; label: string }[] = [
  { field: 'titleColor', label: 'Titel' },
  { field: 'openColor', label: '„Öffnen“-Link' },
  { field: 'badgeColor', label: 'Badge-Text' },
  { field: 'badgeBgColor', label: 'Badge-Hintergrund' },
  { field: 'descColor', label: 'Popup-Text' },
  { field: 'descBgColor', label: 'Popup-Hintergrund' },
];
const borderOptions = service.borderStyles.map((v) => ({
  value: v,
  label: BORDER_STYLE_LABEL[v] ?? v,
}));

const s = computed<TcSide>(() => view.value.style[props.mode]);
const src = computed<TcSide>(() => resetSource(props.mode));
const staged = computed(() => s.value.bgImage.startsWith('staged:'));
const imgUrl = computed(() => (s.value.bgImage ? service.resolveUrl(s.value.bgImage) : ''));

const pct = (v: unknown, def: number) => clampInt(v, 0, 100, def);
const set = (patch: Partial<TcSide>) => setSide(props.mode, patch);
/** Schreiben ohne automatisches Einschalten (Entfernen, wie in der früheren Vanilla-Fassung). */
function setRaw(patch: Partial<TcSide>) {
  Object.assign(view.value.style[props.mode], patch);
}
const reset = (fields: (keyof TcSide)[]) => resetSide(props.mode, fields);

function setBorderStyle(v: string) {
  set({ borderStyle: service.borderStyles.includes(v) ? v : 'solid' });
}
function setImageUrl(e: Event) {
  const input = e.target as HTMLInputElement;
  const v = normSiteMediaUrl(input.value);
  set({ bgImage: v });
  if (input.value.trim() && !v)
    toast('Ungültige Bild-URL – erlaubt sind /pfad oder https://…', { type: 'warning' });
  input.value = staged.value ? '' : s.value.bgImage;
}
function pickImage() {
  const ok = service.pick(`Hintergrundbild der Karte (${THEME_LABEL[props.mode]}) wählen`, (url) =>
    set({ bgImage: url }),
  );
  if (!ok)
    toast('Keine Medien vorhanden — zuerst im Tab „Mediathek“ eine Datei hinzufügen.', {
      type: 'info',
    });
}
function copySide() {
  ensureEnabled();
  const other: ThemeMode = dark.value ? 'light' : 'dark';
  view.value.style[other] = clone(view.value.style[props.mode]);
  toast(`Werte nach ${other === 'dark' ? 'Dunkel' : 'Hell'} kopiert`);
}
</script>

<style scoped>
.tc-m0 {
  margin: 0;
}
.tc-mt {
  margin-top: var(--ds-space-2);
}
.tc-line {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  flex-wrap: wrap;
}
.tc-start {
  align-items: flex-start;
}
.tc-end {
  align-items: flex-end;
}
.tc-col {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
}
.tc-flabel {
  display: block;
  font-size: 0.8rem;
  color: var(--ds-text-2);
}
.tc-dim {
  opacity: 0.45;
}
</style>
