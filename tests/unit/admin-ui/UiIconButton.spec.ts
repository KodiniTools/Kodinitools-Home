// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import UiIconButton from '../../../server/admin/app/components/ui/UiIconButton.vue';

describe('UiIconButton', () => {
  it('braucht ein Label und setzt es als aria-label und title', () => {
    const wrapper = mount(UiIconButton, {
      props: { label: 'Schließen' },
      slots: { default: '<svg></svg>' },
    });
    expect(wrapper.attributes('aria-label')).toBe('Schließen');
    expect(wrapper.attributes('title')).toBe('Schließen');
    expect(wrapper.attributes('aria-pressed')).toBeUndefined();
    expect(wrapper.classes()).toContain('ui-icon-button--ghost');
    expect(wrapper.classes()).toContain('ui-icon-button--md');
  });

  it('wird mit pressed zum Umschalter mit aria-pressed', async () => {
    const wrapper = mount(UiIconButton, { props: { label: 'Wiederholen', pressed: false } });
    expect(wrapper.attributes('aria-pressed')).toBe('false');
    expect(wrapper.classes()).not.toContain('ui-icon-button--pressed');

    await wrapper.setProps({ pressed: true });
    expect(wrapper.attributes('aria-pressed')).toBe('true');
    expect(wrapper.classes()).toContain('ui-icon-button--pressed');
  });

  it('setzt Varianten-, Größen- und Rund-Klassen', () => {
    const wrapper = mount(UiIconButton, {
      props: { label: 'Abspielen', variant: 'primary', size: 'sm', round: true },
    });
    expect(wrapper.classes()).toContain('ui-icon-button--primary');
    expect(wrapper.classes()).toContain('ui-icon-button--sm');
    expect(wrapper.classes()).toContain('ui-icon-button--round');
  });
});
