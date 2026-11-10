<template>
  <div
    :class="['media-tile', 'fl-tile', { 'fl-tile--inmode': inCurrent }]"
    :data-fl-tile="file.key"
    :data-inmode="inCurrent ? '1' : undefined"
  >
    <video v-if="file.isVid" :src="file.src" muted preload="metadata"></video>
    <img v-else :src="file.src" alt="" loading="lazy" />
    <div class="nm">{{ file.name }}</div>
    <template v-if="file.kind === 'server'">
      <div class="st pub">
        ✓ Server{{ file.ext ? ' · ' + file.ext : '' }} · {{ fmtBytes(file.bytes) }}
      </div>
    </template>
    <template v-else>
      <div v-if="meta" class="st fl-muted">{{ meta }}</div>
      <div v-if="file.published" class="st pub">✓ veröffentlicht</div>
      <div v-else class="st local">● nur lokal</div>
    </template>
    <div v-if="mark" class="st fl-mark" data-fl-modemark>{{ mark }}</div>
    <div v-if="!file.usage.length" class="st fl-muted">↪ nicht zugewiesen</div>
    <div
      v-else
      class="st fl-usage"
      title="Zugewiesene Plätze (☀️ nur Hell, 🌙 nur Dunkel, ohne Symbol: beide Modi)"
    >
      ↪
      <template v-for="(u, i) in file.usage" :key="i">
        <span :class="{ 'fl-dim': !inMode(u, mode) }"
          >{{ MODE_ICON[u.mode] ? MODE_ICON[u.mode] + ' ' : '' }}{{ u.label }}</span
        ><template v-if="i < file.usage.length - 1">, </template>
      </template>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ThemeMode } from '../../../types';
import { MODE_ICON, fmtBytes, inMode, modeMark, type FileView } from './filesData';

/** Kachel einer Datei (Server oder Zwischenspeicher) mit Plätzen und Modus-Markierung. */
const props = defineProps<{ file: FileView; mode: ThemeMode }>();

const inCurrent = computed(() => props.file.usage.some((u) => inMode(u, props.mode)));
const mark = computed(() => modeMark(props.file.usage, props.mode));
const meta = computed(() =>
  [props.file.ext, fmtBytes(props.file.bytes)].filter(Boolean).join(' · '),
);
</script>

<style scoped>
.fl-tile {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.fl-tile--inmode {
  outline: 2px solid var(--ds-accent);
  outline-offset: -1px;
}
.fl-muted {
  color: var(--ds-text-3);
}
.fl-mark {
  font-weight: 600;
  color: var(--ds-text);
}
.fl-usage {
  color: var(--ds-accent);
}
.fl-dim {
  opacity: 0.55;
}
</style>
