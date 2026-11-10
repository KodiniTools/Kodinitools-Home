// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import SliderControl from '../../../server/admin/app/components/ui/SliderControl.vue';

// Ui-Bausteine übersetzen über den i18n-Store (lib/i18n.ts)
beforeEach(() => {
  setActivePinia(createPinia());
});

describe('SliderControl', () => {
  it('kompakt: Label · Wert, darunter schlanke Spur mit Füllung + ↺, ohne Zahlenfeld', async () => {
    const w = mount(SliderControl, {
      props: {
        label: 'Anzeigedauer',
        modelValue: 3000,
        min: 500,
        max: 30000,
        step: 500,
        defaultValue: 3000,
        valueText: '3.0s',
        inputClass: 'my-range',
      },
    });
    expect(w.classes()).toEqual(expect.arrayContaining(['control-group', 'slider']));
    expect(w.find('label').text()).toBe('Anzeigedauer');
    const range = w.find<HTMLInputElement>('input[type="range"]');
    expect(range.classes()).toContain('my-range');
    expect(range.attributes('aria-label')).toBe('Anzeigedauer');
    expect(w.find('input[type="number"]').exists()).toBe(false);
    // 3000 auf 500…30000 → 8,5 % gefüllt
    expect(range.attributes('style')).toContain('--sf-fill: 8.5%');
    expect(w.find('.slider-field__reset').exists()).toBe(true);
    expect(w.find('.slider-control__value').text()).toBe('3.0s');

    range.element.value = '5000';
    await range.trigger('input');
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual([5000]);
    await w.setProps({ modelValue: 30000 });
    expect(range.attributes('style')).toContain('--sf-fill: 100%');
  });
});
