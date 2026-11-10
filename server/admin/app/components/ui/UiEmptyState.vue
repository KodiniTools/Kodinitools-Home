<template>
  <div class="ui-empty">
    <span v-if="$slots.icon" class="ui-empty__icon" aria-hidden="true">
      <slot name="icon" />
    </span>
    <p class="ui-empty__title">{{ title }}</p>
    <p v-if="text" class="ui-empty__text">{{ text }}</p>
    <div v-if="$slots.action" class="ui-empty__action">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup lang="ts">
/** Leerzustand für Listen und Vorschau: Icon, Titel, Erklärung, eine Aktion. */
withDefaults(defineProps<{ title: string; text?: string }>(), { text: undefined });
</script>

<style scoped>
.ui-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--ds-space-2);
  padding: var(--ds-space-8) var(--ds-space-4);
  text-align: center;
  color: var(--ds-text-2);
}

.ui-empty__icon {
  display: inline-flex;
  width: 40px;
  height: 40px;
  margin-bottom: var(--ds-space-1);
  color: var(--ds-text-3);
}

.ui-empty__icon :deep(svg) {
  width: 100%;
  height: 100%;
}

.ui-empty__title {
  margin: 0;
  font-size: var(--ds-text-lg);
  font-weight: var(--ds-weight-semibold);
  color: var(--ds-text);
}

.ui-empty__text {
  margin: 0;
  max-width: 40ch;
  font-size: var(--ds-text-sm);
  line-height: var(--ds-leading);
}

.ui-empty__action {
  margin-top: var(--ds-space-2);
}
</style>
