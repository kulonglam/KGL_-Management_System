import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ConfirmDialog from '../../src/components/common/ConfirmDialog.vue';
import { expectNoA11yViolations, runA11yAudit } from './a11y-utils.mjs';

describe('ConfirmDialog', () => {
  it('emits cancel and confirm actions', async () => {
    const wrapper = mount(ConfirmDialog, {
      props: {
        show: true,
        title: 'Delete Record',
        message: 'Delete this record permanently?',
        confirmText: 'Delete'
      }
    });

    const buttons = wrapper.findAll('button');
    await buttons[0].trigger('click');
    await buttons[2].trigger('click');

    expect(wrapper.emitted('cancel')).toHaveLength(1);
    expect(wrapper.emitted('confirm')).toHaveLength(1);
  });

  it('has no detectable accessibility violations when visible', async () => {
    const wrapper = mount(ConfirmDialog, {
      props: {
        show: true,
        title: 'Delete Record',
        message: 'Delete this record permanently?',
        confirmText: 'Delete'
      }
    });

    const results = await runA11yAudit(wrapper.element);
    expectNoA11yViolations(results);
  });
});
