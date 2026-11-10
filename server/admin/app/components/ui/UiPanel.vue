<template>
  <section class="ui-panel" :aria-labelledby="title ? titleId : undefined">
    <header v-if="title || $slots.actions" class="ui-panel__header">
      <component :is="headingTag" v-if="title" :id="titleId" class="ui-panel__title">
        {{ title }}
      </component>
      <span v-if="count !== undefined" class="ui-panel__count">{{ count }}</span>
      <div v-if="$slots.actions" class="ui-panel__actions">
        <slot name="actions" />
      </div>
    </header>
    <div :class="['ui-panel__body', { 'ui-panel__body--flush': !padded }]">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue';

/**
 * Flache Fläche mit optionaler Kopfzeile (Titel, Zähler, Aktionen rechts).
 */
const props = withDefaults(
  defineProps<{
    title?: string;
    headingLevel?: 2 | 3;
    count?: number;
    padded?: boolean;
  }>(),
  { title: undefined, headingLevel: 2, count: undefined, padded: true },
);

const titleId = `ui-panel-${useId()}`;
const headingTag = computed(() => `h${props.headingLevel}`);
</script>

<style scoped>
.ui-panel {
  background: var(--ds-surface-1);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-lg);
  overflow: hidden;
}

.ui-panel__header {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  padding: var(--ds-space-3) var(--ds-space-5);
  border-bottom: var(--ds-border-width) solid var(--ds-border);
  flex-wrap: wrap;
}

.ui-panel__title {
  margin: 0;
  font-size: var(--ds-text-lg);
  font-weight: var(--ds-weight-semibold);
  line-height: var(--ds-leading);
  color: var(--ds-text);
}

.ui-panel__count {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 calc(var(--ds-space-2) - 1px);
  border-radius: var(--ds-radius-full);
  background: var(--ds-surface-2);
  color: var(--ds-text-2);
  font-size: var(--ds-text-xs);
  font-weight: var(--ds-weight-semibold);
  font-variant-numeric: tabular-nums;
}

.ui-panel__actions {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  margin-left: auto;
}

.ui-panel__body {
  padding: var(--ds-space-4) var(--ds-space-5) var(--ds-space-5);
}

.ui-panel__body--flush {
  padding: 0;
}
</style>
