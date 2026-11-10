// @vitest-environment happy-dom
import { mount, type VueWrapper } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import UiSegmentedControl from '../../../server/admin/app/components/ui/UiSegmentedControl.vue';

const options = [
  { value: 'alpha', label: 'Alphabetisch' },
  { value: 'date', label: 'Datum' },
  { value: 'random', label: 'Zufällig', disabled: true },
  { value: 'manual', label: 'Manuell' },
];

function mountControl(modelValue = 'alpha') {
  return mount(UiSegmentedControl, { props: { options, label: 'Sortierung', modelValue } });
}

function emittedValues(wrapper: VueWrapper) {
  return (wrapper.emitted('update:modelValue') ?? []).map((args) => String((args as unknown[])[0]));
}

describe('UiSegmentedControl', () => {
  it('rendert eine Radiogroup mit genau einer gewählten Option und rovendem Tabindex', () => {
    const wrapper = mountControl();
    expect(wrapper.attributes('role')).toBe('radiogroup');
    expect(wrapper.attributes('aria-label')).toBe('Sortierung');

    const radios = wrapper.findAll('[role="radio"]');
    expect(radios).toHaveLength(4);
    expect(radios.map((radio) => radio.attributes('aria-checked'))).toEqual([
      'true',
      'false',
      'false',
      'false',
    ]);
    expect(radios.map((radio) => radio.attributes('tabindex'))).toEqual(['0', '-1', '-1', '-1']);
    expect(wrapper.get('[data-value="random"]').attributes('disabled')).toBeDefined();
  });

  it('wählt per Klick und meldet den Wert', async () => {
    const wrapper = mountControl();
    await wrapper.get('[data-value="date"]').trigger('click');
    expect(emittedValues(wrapper)).toEqual(['date']);
  });

  it('wechselt per Pfeiltasten, überspringt deaktivierte Optionen und läuft um', async () => {
    const wrapper = mountControl();
    // Jeder Schritt wechselt den Wert; derselbe Wert würde von defineModel nicht erneut gemeldet.
    await wrapper.get('[data-value="alpha"]').trigger('keydown', { key: 'ArrowRight' });
    await wrapper.get('[data-value="date"]').trigger('keydown', { key: 'ArrowRight' });
    await wrapper.get('[data-value="manual"]').trigger('keydown', { key: 'ArrowRight' });
    await wrapper.get('[data-value="alpha"]').trigger('keydown', { key: 'ArrowLeft' });
    await wrapper.get('[data-value="manual"]').trigger('keydown', { key: 'Home' });
    await wrapper.get('[data-value="alpha"]').trigger('keydown', { key: 'End' });
    expect(emittedValues(wrapper)).toEqual([
      'date',
      'manual',
      'alpha',
      'manual',
      'alpha',
      'manual',
    ]);
  });

  it('ignoriert andere Tasten', async () => {
    const wrapper = mountControl();
    await wrapper.get('[data-value="alpha"]').trigger('keydown', { key: 'Enter' });
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });

  it('wrap: volle Breite mit Zeilenumbruch, ohne wrap unverändert', () => {
    expect(mountControl().classes()).not.toContain('ui-segmented--wrap');
    const wrapper = mount(UiSegmentedControl, {
      props: { options, label: 'Kategorien', modelValue: 'alpha', wrap: true },
    });
    expect(wrapper.classes()).toContain('ui-segmented--wrap');
    expect(wrapper.attributes('role')).toBe('radiogroup');
  });
});
