<template>
  <details
    :open="open"
    :class="['hd-sec', { 'hd-sec--hl': hl }]"
    :data-hdsection="sec || undefined"
  >
    <summary class="hd-sec-sum"><slot name="title" /></summary>
    <div class="hd-sec-body"><slot /></div>
  </details>
</template>

<script setup lang="ts">
/**
 * Aufklappbarer Bereich des Tabs „Hero-Design“ (wie `section()` in
 * `public/design.ts`). `sec` = Kennung für das Anspringen aus der Vorschau
 * (`data-hdsection`), `hl` = hervorgehoben. `open` gilt nur beim Anlegen.
 */
withDefaults(defineProps<{ open?: boolean; sec?: string; hl?: boolean }>(), {
  open: true,
  sec: '',
  hl: false,
});
</script>

<style scoped>
.hd-sec {
  border-top: 1px solid var(--border);
  margin-top: var(--ds-space-2);
  padding-top: var(--ds-space-2);
  border-radius: 6px;
}
.hd-sec--hl {
  box-shadow: 0 0 0 2px var(--accent);
}
.hd-sec-sum {
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
}
.hd-sec-body {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
  padding-top: var(--ds-space-2);
}
</style>
