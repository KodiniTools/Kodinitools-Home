<template>
  <div class="tc-card tc-hov" :style="cardStyle(side, theme)">
    <span v-if="imgCss" class="tc-img" :style="imgCss"></span>
    <div
      v-if="card.svg"
      class="tc-icon"
      :style="`background:${iconBg};${ts.alignSelf}${hiddenCss(show, 'icon')}`"
    >
      <span v-if="tintColor" class="tc-mask" :style="maskCss"></span>
      <img v-else :src="card.svg" alt="" loading="lazy" />
    </div>
    <span v-if="card.badge" class="tc-badge" :style="ts.badge + hiddenCss(show, 'badge')">{{
      card.badge
    }}</span>
    <h3 class="tc-title" :style="ts.title + hiddenCss(show, 'title')">{{ card.title }}</h3>
    <div class="tc-footer">
      <span class="tc-fav" :style="`color:${PAGE[theme].muted};${hiddenCss(show, 'fav')}`">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          width="14"
          height="14"
        >
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      </span>
      <span class="tc-open" :style="ts.open + hiddenCss(show, 'open')"
        >{{ open }}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          width="12"
          height="12"
        >
          <path d="M5 12h14M12 5l7 7-7 7" /></svg
      ></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ThemeMode } from '../../../types';
import {
  PAGE,
  cardStyle,
  hiddenCss,
  imageStyle,
  textStyles,
  type CardInfo,
  type TcShow,
  type TcSide,
  type TcText,
} from './tcData';

/**
 * Vorschaukarte im Look der echten Tool-Karte (Icon, Badge, Titel, Fußzeile
 * mit Favoriten-Symbol und „Öffnen“) – wie `cardHtml` in `public/toolcards.ts`.
 * Hover echt per :hover (Werte als CSS-Variablen aus `cardStyle`).
 */
const props = defineProps<{
  card: CardInfo;
  theme: ThemeMode;
  side: TcSide;
  text?: TcText;
  show?: TcShow;
  /** Beschriftung des „Öffnen“-Links. */
  open: string;
  resolveUrl: (val: string) => string;
  ensureFontFace: (file: string) => string;
}>();

const ts = computed(() => textStyles(props.side, props.theme, props.text, props.ensureFontFace));
// Icon-Färbung (Tab „Icons“): Farbe als Maske, eigener Kasten-Hintergrund.
const tintColor = computed(() =>
  props.theme === 'dark' ? props.card.tint.dark : props.card.tint.light,
);
const iconBg = computed(
  () =>
    (props.theme === 'dark' ? props.card.tint.bgDark : props.card.tint.bg) ||
    PAGE[props.theme].iconBg,
);
const maskCss = computed(() => {
  const svg = String(props.card.svg || '').replace(/['"]/g, '');
  return `background:${tintColor.value};-webkit-mask:url('${svg}') center / contain no-repeat;mask:url('${svg}') center / contain no-repeat`;
});
const imgCss = computed(() =>
  imageStyle(props.side, props.side.bgImage ? props.resolveUrl(props.side.bgImage) : ''),
);
</script>

<style>
/* Echter Hover der Vorschaukarten (Inline-Styles brauchen !important). */
.tc-card.tc-hov:hover {
  border-color: var(--tc-hbc) !important;
  background: var(--tc-hbg) !important;
  box-shadow: var(--tc-hsh);
  transform: translateY(-5px);
}
.tc-mask {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
