import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Login from '../../src/views/Login.vue';
import { authAPI } from '../../src/services/api';
import { expectNoA11yViolations, runA11yAudit } from './a11y-utils.mjs';

vi.mock('../../src/services/api', () => ({
  authAPI: {
    login: vi.fn()
  }
}));

describe('Login view', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('preloads remembered username from localStorage', () => {
    localStorage.setItem('rememberedUsername', 'saved-user');
    const wrapper = mount(Login, {
      global: {
        mocks: {
          $router: { push: vi.fn() }
        }
      }
    });

    const usernameInput = wrapper.find('#username');
    expect(usernameInput.element.value).toBe('saved-user');
  });

  it('shows reset guidance when forgot password is clicked', async () => {
    const wrapper = mount(Login, {
      global: {
        mocks: {
          $router: { push: vi.fn() }
        }
      }
    });

    const forgotButton = wrapper.find('button.btn-link');
    await forgotButton.trigger('click');

    expect(wrapper.text()).toContain('Please contact your manager or system administrator');
  });

  it('submits credentials, remembers username, and redirects by role', async () => {
    const push = vi.fn();
    authAPI.login.mockResolvedValue({
      data: {
        token: 'token-1',
        role: 'manager',
        name: 'Manager One',
        branch: 'Maganjo'
      }
    });

    const wrapper = mount(Login, {
      global: {
        mocks: {
          $router: { push }
        }
      }
    });

    await wrapper.find('#username').setValue('manager-user');
    await wrapper.find('#password').setValue('secret123');
    await wrapper.find('#rememberMe').setValue(true);
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    expect(authAPI.login).toHaveBeenCalledWith({
      username: 'manager-user',
      password: 'secret123'
    });
    expect(localStorage.getItem('token')).toBe('token-1');
    expect(localStorage.getItem('rememberedUsername')).toBe('manager-user');
    expect(push).toHaveBeenCalledWith('/dashboard/manager');
  });

  it('has no detectable accessibility violations on initial render', async () => {
    const wrapper = mount(Login, {
      global: {
        mocks: {
          $router: { push: vi.fn() }
        }
      }
    });

    const results = await runA11yAudit(wrapper.element);
    expectNoA11yViolations(results);
  });
});
