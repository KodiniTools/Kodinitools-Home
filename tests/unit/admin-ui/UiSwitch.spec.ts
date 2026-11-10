// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import UiSwitch from '../../../server/admin/app/components/ui/UiSwitch.vue';

describe('UiSwitch', () => {
  it('ist ein Schalter mit sichtbarem Label und schaltet per Klick um', async () => {
    const wrapper = mount(UiSwitch, {
      props: {
        label: 'Füllung',
        modelValue: false,
        'onUpdate:modelValue': (v) => wrapper.setProps({ modelValue: v }),
      },
    });
    const button = wrapper.find('[role="switch"]');
    const label = wrapper.find('label');
    expect(button.attributes('aria-checked')).toBe('false');
    expect(label.text()).toBe('Füllung');
    expect(label.attributes('for')).toBe(button.attributes('id'));

    await button.trigger('click');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true]);
    expect(button.attributes('aria-checked')).toBe('true');
    expect(button.classes()).toContain('ui-switch__track--on');
  });

  it('labelHidden setzt das Label als aria-label und title', () => {
    const wrapper = mount(UiSwitch, { props: { label: 'An/Aus', labelHidden: true } });
    expect(wrapper.find('label').exists()).toBe(false);
    expect(wrapper.find('button').attributes('aria-label')).toBe('An/Aus');
    expect(wrapper.find('button').attributes('title')).toBe('An/Aus');
  });

  it('reagiert deaktiviert nicht', async () => {
    const wrapper = mount(UiSwitch, { props: { label: 'X', disabled: true } });
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(wrapper.classes()).toContain('ui-switch--disabled');
  });
});
