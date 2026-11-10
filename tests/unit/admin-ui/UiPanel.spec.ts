// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import UiPanel from '../../../server/admin/app/components/ui/UiPanel.vue';

describe('UiPanel', () => {
  it('rendert Titel als Überschrift und verknüpft ihn mit der Section', () => {
    const wrapper = mount(UiPanel, {
      props: { title: 'Dateien', count: 4 },
      slots: { default: '<p>Inhalt</p>' },
    });
    const heading = wrapper.get('h2');
    expect(heading.text()).toBe('Dateien');
    expect(wrapper.attributes('aria-labelledby')).toBe(heading.attributes('id'));
    expect(wrapper.get('.ui-panel__count').text()).toBe('4');
    expect(wrapper.get('.ui-panel__body').text()).toBe('Inhalt');
  });

  it('nutzt die gewünschte Überschriftenebene und zeigt Aktionen rechts', () => {
    const wrapper = mount(UiPanel, {
      props: { title: 'Vorschau', headingLevel: 3 },
      slots: { actions: '<button data-test="action">Kopieren</button>' },
    });
    expect(wrapper.find('h2').exists()).toBe(false);
    expect(wrapper.get('h3').text()).toBe('Vorschau');
    expect(wrapper.get('.ui-panel__actions [data-test="action"]').text()).toBe('Kopieren');
  });

  it('kommt ohne Kopfzeile aus und kann ohne Innenabstand rendern', () => {
    const wrapper = mount(UiPanel, { props: { padded: false }, slots: { default: 'Liste' } });
    expect(wrapper.find('.ui-panel__header').exists()).toBe(false);
    expect(wrapper.attributes('aria-labelledby')).toBeUndefined();
    expect(wrapper.get('.ui-panel__body').classes()).toContain('ui-panel__body--flush');
  });
});
