<template>
  <div
    :class="[
      'ui-field',
      `ui-field--${size}`,
      { 'ui-field--error': Boolean(error), 'ui-field--disabled': disabled },
    ]"
  >
    <label :for="inputId" :class="['ui-field__label', { 'ui-field__label--hidden': labelHidden }]">
      {{ label }}<span v-if="required" class="ui-field__required" aria-hidden="true"> *</span>
    </label>
    <input
      :id="inputId"
      v-model="model"
      class="ui-field__input"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="describedBy"
      v-bind="$attrs"
    />
    <p v-if="error" :id="errorId" class="ui-field__error" role="alert">{{ error }}</p>
    <p v-else-if="hint" :id="hintId" class="ui-field__hint">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue';

/**
 * Einzeiliges Textfeld mit sichtbarem Label, optionalem Hinweis und Fehlertext.
 * Weitere Attribute (autocomplete, maxlength, …) landen auf dem <input>.
 * `labelHidden` versteckt das Label nur visuell; `size="md"` passt die Höhe an
 * Knöpfe der Größe md/sm in Werkzeugleisten an.
 */
defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    label: string;
    id?: string;
    type?: 'text' | 'search' | 'email' | 'url' | 'password' | 'time' | 'datetime-local';
    placeholder?: string;
    hint?: string;
    error?: string;
    disabled?: boolean;
    required?: boolean;
    labelHidden?: boolean;
    size?: 'md' | 'lg';
  }>(),
  {
    id: undefined,
    type: 'text',
    placeholder: undefined,
    hint: undefined,
    error: undefined,
    disabled: false,
    required: false,
    labelHidden: false,
    size: 'lg',
  },
);

const model = defineModel<string>({ default: '' });

const generatedId = useId();
const inputId = computed(() => props.id ?? `ui-field-${generatedId}`);
const hintId = computed(() => `${inputId.value}-hint`);
const errorId = computed(() => `${inputId.value}-error`);
const describedBy = computed(() => {
  if (props.error) return errorId.value;
  if (props.hint) return hintId.value;
  return undefined;
});
</script>

<style scoped>
.ui-field {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
}

.ui-field__label {
  font-size: var(--ds-text-sm);
  font-weight: var(--ds-weight-medium);
  color: var(--ds-text-2);
}

.ui-field__label--hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}

.ui-field__required {
  color: var(--ds-danger);
}

.ui-field__input {
  height: var(--ds-control-lg);
  width: 100%;
  box-sizing: border-box;
  padding: 0 var(--ds-space-3);
  border: var(--ds-border-width) solid var(--ds-border-strong);
  border-radius: var(--ds-radius-md);
  background: var(--ds-surface-2);
  color: var(--ds-text);
  font: inherit;
  font-size: var(--ds-text-md);
  transition:
    border-color var(--ds-duration) var(--ds-ease),
    box-shadow var(--ds-duration) var(--ds-ease);
}

.ui-field--md .ui-field__input {
  height: var(--ds-control-md);
  font-size: var(--ds-text-sm);
}

.ui-field__input::placeholder {
  color: var(--ds-text-3);
}

.ui-field__input:focus-visible {
  outline: none;
  border-color: var(--ds-accent);
  box-shadow: var(--ds-focus-ring);
}

.ui-field__input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.ui-field--error .ui-field__input {
  border-color: var(--ds-danger);
}

.ui-field__hint,
.ui-field__error {
  margin: 0;
  font-size: var(--ds-text-sm);
  line-height: var(--ds-leading);
}

.ui-field__hint {
  color: var(--ds-text-3);
}

.ui-field__error {
  color: var(--ds-danger);
}
</style>
