// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import UiEmptyState from '../../../server/admin/app/components/ui/UiEmptyState.vue';

describe('UiEmptyState', () => {
  it('rendert Titel, Text, Icon und Aktion', () => {
    const wrapper = mount(UiEmptyState, {
      props: { title: 'Noch keine Dateien', text: 'Zieh Audiodateien hierher.' },
      slots: { icon: '<svg data-test="icon"></svg>', action: '<button>Dateien wählen</button>' },
    });
    expect(wrapper.get('.ui-empty__title').text()).toBe('Noch keine Dateien');
    expect(wrapper.get('.ui-empty__text').text()).toBe('Zieh Audiodateien hierher.');
    expect(wrapper.get('.ui-empty__icon').attributes('aria-hidden')).toBe('true');
    expect(wrapper.get('.ui-empty__action button').text()).toBe('Dateien wählen');
  });

  it('lässt Text, Icon und Aktion weg, wenn sie fehlen', () => {
    const wrapper = mount(UiEmptyState, { props: { title: 'Leer' } });
    expect(wrapper.find('.ui-empty__text').exists()).toBe(false);
    expect(wrapper.find('.ui-empty__icon').exists()).toBe(false);
    expect(wrapper.find('.ui-empty__action').exists()).toBe(false);
  });
});
