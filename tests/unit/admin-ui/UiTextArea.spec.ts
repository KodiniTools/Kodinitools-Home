// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import UiTextArea from '../../../server/admin/app/components/ui/UiTextArea.vue';

describe('UiTextArea', () => {
  it('verknüpft Label und Feld und unterstützt v-model', async () => {
    const wrapper = mount(UiTextArea, {
      props: { label: 'Text', modelValue: 'Hallo', rows: 3, placeholder: 'Text eingeben' },
    });
    const textarea = wrapper.find<HTMLTextAreaElement>('textarea');
    expect(wrapper.find('label').attributes('for')).toBe(textarea.attributes('id'));
    expect(textarea.element.value).toBe('Hallo');
    expect(textarea.attributes('rows')).toBe('3');
    expect(textarea.attributes('placeholder')).toBe('Text eingeben');

    await textarea.setValue('Zeile 1\nZeile 2');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['Zeile 1\nZeile 2']);
  });

  it('reicht Attribute an das Feld durch und zeigt einen Hinweis', () => {
    const wrapper = mount(UiTextArea, {
      props: { label: 'Text', hint: 'Mehrzeilig', id: 'feld' },
      attrs: { maxlength: '20', 'data-x': '1' },
    });
    const textarea = wrapper.find<HTMLTextAreaElement>('textarea');
    expect(textarea.attributes('id')).toBe('feld');
    expect(textarea.attributes('maxlength')).toBe('20');
    expect(textarea.attributes('data-x')).toBe('1');
    expect(textarea.attributes('aria-describedby')).toBe('feld-hint');
    expect(wrapper.find('#feld-hint').text()).toBe('Mehrzeilig');
  });
});
