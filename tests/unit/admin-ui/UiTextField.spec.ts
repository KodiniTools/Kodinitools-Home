// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import UiTextField from '../../../server/admin/app/components/ui/UiTextField.vue';

describe('UiTextField', () => {
  it('verknüpft Label und Eingabe über eine generierte id', () => {
    const wrapper = mount(UiTextField, { props: { label: 'Name der Wiedergabeliste' } });
    const input = wrapper.get('input');
    const label = wrapper.get('label');
    expect(input.attributes('id')).toBeTruthy();
    expect(label.attributes('for')).toBe(input.attributes('id'));
    expect(label.text()).toBe('Name der Wiedergabeliste');
    expect(input.attributes('type')).toBe('text');
    expect(input.attributes('aria-invalid')).toBeUndefined();
    expect(input.attributes('aria-describedby')).toBeUndefined();
  });

  it('meldet Eingaben als v-model und respektiert eine eigene id', async () => {
    const wrapper = mount(UiTextField, {
      props: { label: 'Name', id: 'playlist-name', modelValue: '' },
    });
    const input = wrapper.get('input');
    expect(input.attributes('id')).toBe('playlist-name');
    await input.setValue('Sommer Mix 2026');
    expect(wrapper.emitted('update:modelValue')).toEqual([['Sommer Mix 2026']]);
  });

  it('beschreibt die Eingabe über Hinweis oder Fehler', async () => {
    const wrapper = mount(UiTextField, {
      props: { label: 'Name', hint: 'Wird als Dateiname verwendet' },
    });
    const input = wrapper.get('input');
    const hint = wrapper.get('.ui-field__hint');
    expect(input.attributes('aria-describedby')).toBe(hint.attributes('id'));

    await wrapper.setProps({ error: 'Darf keinen Schrägstrich enthalten' });
    const error = wrapper.get('.ui-field__error');
    expect(error.attributes('role')).toBe('alert');
    expect(input.attributes('aria-invalid')).toBe('true');
    expect(input.attributes('aria-describedby')).toBe(error.attributes('id'));
    expect(wrapper.find('.ui-field__hint').exists()).toBe(false);
    expect(wrapper.classes()).toContain('ui-field--error');
  });

  it('reicht weitere Attribute an das input durch und markiert Pflichtfelder', () => {
    const wrapper = mount(UiTextField, {
      props: { label: 'Name', required: true, disabled: true },
      attrs: { autocomplete: 'off', maxlength: '80' },
    });
    const input = wrapper.get('input');
    expect(input.attributes('autocomplete')).toBe('off');
    expect(input.attributes('maxlength')).toBe('80');
    expect(input.attributes('required')).toBeDefined();
    expect(input.attributes('disabled')).toBeDefined();
    expect(wrapper.get('.ui-field__required').attributes('aria-hidden')).toBe('true');
  });

  it('versteckt das Label nur visuell und kennt eine kompakte Größe', () => {
    const wrapper = mount(UiTextField, {
      props: { label: 'Link-Adresse', labelHidden: true, size: 'md' },
    });
    const label = wrapper.get('label');
    expect(label.classes()).toContain('ui-field__label--hidden');
    expect(label.text()).toBe('Link-Adresse');
    expect(label.attributes('for')).toBe(wrapper.get('input').attributes('id'));
    expect(wrapper.classes()).toContain('ui-field--md');
    const standard = mount(UiTextField, { props: { label: 'Name' } });
    expect(standard.get('label').classes()).not.toContain('ui-field__label--hidden');
    expect(standard.classes()).toContain('ui-field--lg');
  });
});
