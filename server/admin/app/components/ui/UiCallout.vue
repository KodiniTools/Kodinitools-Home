<template>
  <div :class="['ui-callout', `ui-callout--${type}`]" role="note">
    <span class="ui-callout__icon" aria-hidden="true">
      <svg
        v-if="type === 'success'"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
      <svg
        v-else-if="type === 'warning' || type === 'danger'"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path
          d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <svg
        v-else
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    </span>
    <div class="ui-callout__content">
      <p v-if="title" class="ui-callout__title">{{ title }}</p>
      <div class="ui-callout__text">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/** Ruhiger Hinweis im Textfluss: Fläche 2, Status nur im Icon, keine Rahmenfarbe. */
withDefaults(
  defineProps<{
    type?: 'info' | 'success' | 'warning' | 'danger';
    title?: string;
  }>(),
  { type: 'info', title: undefined },
);
</script>

<style scoped>
.ui-callout {
  display: flex;
  align-items: flex-start;
  gap: var(--ds-space-2);
  padding: var(--ds-space-2) var(--ds-space-3);
  border-radius: var(--ds-radius-md);
  background: var(--ds-surface-2);
  color: var(--ds-text-2);
  font-size: var(--ds-text-sm);
  line-height: var(--ds-leading);
}

.ui-callout__icon {
  display: inline-flex;
  width: var(--ds-icon-sm);
  height: var(--ds-icon-sm);
  margin-top: 2px;
  flex-shrink: 0;
  color: var(--ds-info);
}

.ui-callout__icon svg {
  width: 100%;
  height: 100%;
}

.ui-callout--success .ui-callout__icon {
  color: var(--ds-success);
}

.ui-callout--warning .ui-callout__icon {
  color: var(--ds-warning);
}

.ui-callout--danger .ui-callout__icon {
  color: var(--ds-danger);
}

.ui-callout__content {
  min-width: 0;
}

.ui-callout__title {
  margin: 0 0 2px;
  font-weight: var(--ds-weight-semibold);
  color: var(--ds-text);
}

.ui-callout__text :deep(p) {
  margin: 0;
}
</style>
