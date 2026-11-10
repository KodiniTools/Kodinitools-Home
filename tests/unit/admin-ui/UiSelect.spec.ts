// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import UiSelect from '../../../server/admin/app/components/ui/UiSelect.vue';

const options = [
  { value: 'm3u', label: 'M3U' },
  { value: 'xspf', label: 'XSPF' },
  { value: 'json', label: 'JSON', disabled: true },
];

describe('UiSelect', () => {
  it('verknüpft Label und select und rendert die Optionen', () => {
    const wrapper = mount(UiSelect, { props: { options, label: 'Format', modelValue: 'm3u' } });
    const select = wrapper.get('select');
    expect(wrapper.get('label').attributes('for')).toBe(select.attributes('id'));
    expect(select.element.value).toBe('m3u');
    expect(wrapper.findAll('option').map((option) => option.text())).toEqual([
      'M3U',
      'XSPF',
      'JSON',
    ]);
    expect(wrapper.findAll('option').at(2)?.attributes('disabled')).toBeDefined();
  });

  it('meldet die Auswahl als v-model und reicht Attribute durch', async () => {
    const wrapper = mount(UiSelect, {
      props: { options, label: 'Format', modelValue: 'm3u', id: 'format', inline: true },
      attrs: { 'data-test': 'format-select' },
    });
    expect(wrapper.classes()).toContain('ui-select--inline');
    const select = wrapper.get('select');
    expect(select.attributes('id')).toBe('format');
    expect(select.attributes('data-test')).toBe('format-select');
    await select.setValue('xspf');
    expect(wrapper.emitted('update:modelValue')).toEqual([['xspf']]);
  });

  it('kann das Label visuell verstecken', () => {
    const wrapper = mount(UiSelect, {
      props: { options, label: 'Format', modelValue: 'm3u', labelHidden: true },
    });
    expect(wrapper.get('label').classes()).toContain('ui-select__label--hidden');
  });

  it('rendert Gruppen als optgroup und liefert Zahlenwerte zurück', async () => {
    const grouped = [
      { value: '', label: '— Keine —' },
      { label: 'Gruppe A', options: [{ value: 1, label: 'Eins' }] },
      { label: 'Gruppe B', options: [{ value: 2, label: 'Zwei', disabled: true }] },
    ];
    const wrapper = mount(UiSelect, { props: { options: grouped, label: 'Wahl', modelValue: '' } });
    const groups = wrapper.findAll('optgroup');
    expect(groups.map((g) => g.attributes('label'))).toEqual(['Gruppe A', 'Gruppe B']);
    expect(groups[0]!.findAll('option').map((o) => o.text())).toEqual(['Eins']);
    expect(groups[1]!.get('option').attributes('disabled')).toBeDefined();
    await wrapper.get('select').setValue('1');
    expect(wrapper.emitted('update:modelValue')).toEqual([[1]]);
  });
});
