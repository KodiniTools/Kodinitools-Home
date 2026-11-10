// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import UiCallout from '../../../server/admin/app/components/ui/UiCallout.vue';

describe('UiCallout', () => {
  it('ist standardmäßig ein Info-Hinweis mit role=note', () => {
    const wrapper = mount(UiCallout, { slots: { default: 'Nur Dateinamen enthalten.' } });
    expect(wrapper.attributes('role')).toBe('note');
    expect(wrapper.classes()).toContain('ui-callout--info');
    expect(wrapper.get('.ui-callout__text').text()).toBe('Nur Dateinamen enthalten.');
    expect(wrapper.find('.ui-callout__title').exists()).toBe(false);
    expect(wrapper.get('.ui-callout__icon').attributes('aria-hidden')).toBe('true');
  });

  it('rendert Typ und Titel', () => {
    const wrapper = mount(UiCallout, {
      props: { type: 'warning', title: 'Achtung' },
      slots: { default: 'Text' },
    });
    expect(wrapper.classes()).toContain('ui-callout--warning');
    expect(wrapper.get('.ui-callout__title').text()).toBe('Achtung');
  });
});
