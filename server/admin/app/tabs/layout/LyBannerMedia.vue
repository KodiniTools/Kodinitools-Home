<template>
  <div class="panel" data-bannermediablock>
    <h2 class="ly-h2">🖼️ Banner (Bild oder Video)</h2>
    <p class="hint">
      Erscheint ganz oben im Hero-Bereich der
      {{ service.lang === 'de' ? 'deutschen' : 'englischen' }} Startseite. Bild aus der
      Zwischenablage (Strg/Cmd+V oder Button), aus der Mediathek oder per Pfad/URL.
    </p>
    <div class="ly-row">
      <div class="bg-thumb ly-thumb" data-bannerthumb>
        <template v-if="med">
          <video v-if="med.isVid" :src="med.src" muted class="ly-cover"></video>
          <img v-else :src="med.src" alt="" />
        </template>
        <span v-else class="hint ly-m0">Kein Banner</span>
      </div>
      <div class="ly-col">
        <p v-if="med && med.localName" class="st local ly-st" data-bannerstatus="local">
          ● {{ med.localName }}{{ med.bytes ? ` · ${service.fmtBytes(med.bytes)}` : '' }} – lokal,
          wird beim Veröffentlichen hochgeladen.
        </p>
        <template v-else-if="med">
          <p class="st pub ly-st" data-bannerstatus="pub">● {{ val }}</p>
          <p v-if="missing" class="st ly-warn" data-bannermissing>
            ⚠ Datei fehlt auf dem Server – bitte über „📂 Aus Mediathek“ neu zuweisen und
            veröffentlichen.
          </p>
        </template>
        <p v-else-if="val" class="st ly-st ly-warn" data-bannerstatus="missing-local">
          ⚠ Lokales Medium nicht gefunden – bitte neu zuweisen.
        </p>
        <p v-else class="hint ly-st">
          Leer = kein Banner. 📐 Empfohlen: breites Format, ca. <strong>1800 × 480 px</strong>
          (Anzeige bis 900 × 240 px).
        </p>
        <label :for="`${uid}-slot`">Pfad/URL</label>
        <input
          :id="`${uid}-slot`"
          :value="slotShown"
          placeholder="/uploads/mein-banner.jpg"
          :disabled="staged"
          :title="staged ? 'Lokales Medium – wird beim Veröffentlichen hochgeladen' : undefined"
          data-bannerslot
          @input="onSlotInput(($event.target as HTMLInputElement).value)"
          @blur="slotDraft = null"
        />
        <div class="ly-btns">
          <UiButton
            size="sm"
            title="Bild aus der Zwischenablage als Banner einsetzen (oder Strg/Cmd+V)"
            data-bannerpaste
            @click="service.paste('banner')"
            >📋 Aus Zwischenablage einfügen</UiButton
          >
          <UiButton size="sm" data-bannerpick @click="pick">📂 Aus Mediathek</UiButton>
          <UiButton size="sm" variant="danger" :disabled="!val" data-bannerclear @click="clear"
            >Entfernen</UiButton
          >
        </div>
        <label :for="`${uid}-link`" class="ly-mt"
          >🔗 Verlinkung (optional) — öffnet beim Klick auf das Banner</label
        >
        <input
          :id="`${uid}-link`"
          :value="linkShown"
          placeholder="https://… oder /faq/"
          data-bannerlink
          @input="onLinkInput(($event.target as HTMLInputElement).value)"
          @blur="linkDraft = null"
        />
        <p class="hint ly-m0 ly-mt-s">
          Leer = nicht klickbar. Externe Links (http/https) öffnen in neuem Tab; interne Pfade (z.B.
          <code>/faq/</code>) im selben Tab.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useId } from 'vue';
import { UiButton } from '../../components/ui';
import { useUploadCheck } from '../media/useUploadCheck';
import { useLayout } from './useLayout';

/**
 * Panel „Banner (Bild oder Video)“ (wie `bannerMediaBlock` in
 * `public/layout-banner.js`): Zuweisung aus Zwischenablage, Mediathek oder per
 * Pfad/URL, Entfernen, Verlinkung; HEAD-Prüfung der /uploads-Datei. Das
 * Attribut `data-bannermediablock` nutzt der globale Einfügen-Handler
 * (`public/layout-paste.js`).
 */
const { view, service, toast } = useLayout();
const uid = `ly-bm-${useId()}`;

const val = computed(() => view.value.m.heroBanner || '');
const staged = computed(() => val.value.startsWith('staged:'));
const med = computed(() => service.resolve(val.value));
const pubUrl = computed(() => (med.value && !med.value.localName ? val.value : ''));
const { missing } = useUploadCheck(pubUrl);

// Entwurf beim Tippen: gespeichert wird getrimmt, das Feld zeigt die Eingabe.
const slotDraft = ref<string | null>(null);
const slotShown = computed(() => slotDraft.value ?? (staged.value ? '' : val.value));
function onSlotInput(v: string) {
  slotDraft.value = v;
  view.value.m.heroBanner = v.trim();
}
const linkDraft = ref<string | null>(null);
const linkShown = computed(() => linkDraft.value ?? (view.value.m.heroBannerLink || ''));
function onLinkInput(v: string) {
  linkDraft.value = v;
  view.value.m.heroBannerLink = v.trim();
}

function pick() {
  const ok = service.pick('banner', 'Bild/Video für das Banner wählen', (url) => {
    view.value.m.heroBanner = url;
    toast('Banner zugewiesen');
  });
  if (!ok)
    toast('Keine Medien vorhanden — Bild einfügen oder im Tab „Dateien“ hochladen.', {
      type: 'info',
    });
}
function clear() {
  view.value.m.heroBanner = '';
  toast('Banner entfernt');
}
</script>

<style scoped>
.ly-m0 {
  margin: 0;
}
.ly-h2 {
  font-size: 1rem;
  margin: 0 0 0.3rem;
}
.ly-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: var(--ds-space-3);
}
.ly-thumb {
  width: 220px;
  max-width: 100%;
  height: 110px;
}
.ly-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.ly-col {
  flex: 1 1 260px;
  min-width: 0;
}
.ly-st {
  margin: 0.2rem 0 0.4rem;
}
.ly-warn {
  color: #f87171;
  font-weight: 600;
}
.ly-btns {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
  margin-top: 0.5rem;
}
.ly-mt {
  margin-top: 0.6rem;
}
.ly-mt-s {
  margin-top: 0.3rem;
}
</style>
