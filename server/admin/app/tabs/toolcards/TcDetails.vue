<template>
  <details :open="open" class="tc-sec">
    <summary class="tc-sec-sum"><slot name="title" /></summary>
    <div class="tc-sec-body"><slot /></div>
  </details>
</template>

<script setup lang="ts">
/**
 * Aufklappbarer Bereich (wie `section()` in `public/toolcards.js`). `open` gilt
 * nur beim Anlegen; danach behält das native <details> seinen Zustand.
 */
withDefaults(defineProps<{ open?: boolean }>(), { open: true });
</script>

<style scoped>
.tc-sec {
  border-top: 1px solid var(--border);
  margin-top: var(--ds-space-2);
  padding-top: var(--ds-space-2);
}
.tc-sec-sum {
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
}
.tc-sec-body {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
  padding-top: var(--ds-space-2);
}
</style>
