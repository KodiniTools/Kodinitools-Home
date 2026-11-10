// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import UiButton from '../../../server/admin/app/components/ui/UiButton.vue';

describe('UiButton', () => {
  it('rendert Slot-Text als native Schaltfläche vom Typ button', () => {
    const wrapper = mount(UiButton, { slots: { default: 'Speichern' } });
    expect(wrapper.element.tagName).toBe('BUTTON');
    expect(wrapper.attributes('type')).toBe('button');
    expect(wrapper.text()).toBe('Speichern');
    expect(wrapper.classes()).toContain('ui-button--secondary');
    expect(wrapper.classes()).toContain('ui-button--md');
  });

  it('setzt Varianten-, Größen- und Block-Klassen', () => {
    const wrapper = mount(UiButton, {
      props: { variant: 'primary', size: 'sm', block: true, type: 'submit' },
    });
    expect(wrapper.classes()).toContain('ui-button--primary');
    expect(wrapper.classes()).toContain('ui-button--sm');
    expect(wrapper.classes()).toContain('ui-button--block');
    expect(wrapper.attributes('type')).toBe('submit');
  });

  it('leitet Klicks durch und blockiert sie bei disabled', async () => {
    const onClick = vi.fn();
    const wrapper = mount(UiButton, { attrs: { onClick } });
    await wrapper.trigger('click');
    expect(onClick).toHaveBeenCalledTimes(1);

    await wrapper.setProps({ disabled: true });
    expect(wrapper.attributes('disabled')).toBeDefined();
    await wrapper.trigger('click');
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('rendert mit href als Link im selben Look', () => {
    const wrapper = mount(UiButton, {
      props: { href: 'https://kodinitools.com/', variant: 'primary' },
      attrs: { target: '_blank', rel: 'noopener noreferrer' },
      slots: { default: 'Ausprobieren' },
    });
    expect(wrapper.element.tagName).toBe('A');
    expect(wrapper.attributes('href')).toBe('https://kodinitools.com/');
    expect(wrapper.attributes('target')).toBe('_blank');
    expect(wrapper.attributes('type')).toBeUndefined();
    expect(wrapper.classes()).toContain('ui-button--primary');
  });

  it('versteckt das Icon aus dem icon-Slot vor Screenreadern', () => {
    const wrapper = mount(UiButton, {
      slots: { default: 'Dateien', icon: '<svg data-test="icon"></svg>' },
    });
    const icon = wrapper.get('.ui-button__icon');
    expect(icon.attributes('aria-hidden')).toBe('true');
    expect(icon.find('[data-test="icon"]').exists()).toBe(true);
  });
});
