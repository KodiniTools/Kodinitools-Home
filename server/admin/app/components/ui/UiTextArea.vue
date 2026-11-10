<template>
  <div :class="['ui-textarea', { 'ui-textarea--disabled': disabled }]">
    <label :for="inputId" class="ui-textarea__label">{{ label }}</label>
    <textarea
      :id="inputId"
      ref="field"
      v-model="model"
      class="ui-textarea__input"
      :rows="rows"
      :placeholder="placeholder"
      :disabled="disabled"
      :aria-describedby="hint ? hintId : undefined"
      v-bind="$attrs"
    ></textarea>
    <p v-if="hint" :id="hintId" class="ui-textarea__hint">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, useId, useTemplateRef } from 'vue';

/**
 * Mehrzeiliges Textfeld mit sichtbarem Label (Anatomie wie UiTextField).
 * Weitere Attribute (maxlength, @change, …) landen auf dem <textarea>.
 */
defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    label: string;
    id?: string;
    rows?: number;
    placeholder?: string;
    hint?: string;
    disabled?: boolean;
  }>(),
  { id: undefined, rows: 2, placeholder: undefined, hint: undefined, disabled: false },
);

const model = defineModel<string>({ default: '' });

const generatedId = useId();
const inputId = computed(() => props.id ?? `ui-textarea-${generatedId}`);
const hintId = computed(() => `${inputId.value}-hint`);

// Für Fokus und Cursor-Position von außen (z. B. Text-Editor nach Tastendruck)
const field = useTemplateRef<HTMLTextAreaElement>('field');
defineExpose({ textarea: field });
</script>

<style scoped>
.ui-textarea {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
}

.ui-textarea__label {
  font-size: var(--ds-text-sm);
  font-weight: var(--ds-weight-medium);
  color: var(--ds-text-2);
}

.ui-textarea__input {
  width: 100%;
  min-height: 64px;
  box-sizing: border-box;
  padding: var(--ds-space-2) var(--ds-space-3);
  border: var(--ds-border-width) solid var(--ds-border-strong);
  border-radius: var(--ds-radius-md);
  background: var(--ds-surface-2);
  color: var(--ds-text);
  font: inherit;
  font-size: var(--ds-text-md);
  line-height: var(--ds-leading);
  resize: vertical;
  transition:
    border-color var(--ds-duration) var(--ds-ease),
    box-shadow var(--ds-duration) var(--ds-ease);
}

.ui-textarea__input::placeholder {
  color: var(--ds-text-3);
}

.ui-textarea__input:focus-visible {
  outline: none;
  border-color: var(--ds-accent);
  box-shadow: var(--ds-focus-ring);
}

.ui-textarea__input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.ui-textarea__hint {
  margin: 0;
  font-size: var(--ds-text-sm);
  line-height: var(--ds-leading);
  color: var(--ds-text-3);
}
</style>
