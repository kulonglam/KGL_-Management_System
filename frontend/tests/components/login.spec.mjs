/** Component tests for login interactions, remembered credentials, and accessibility behavior. */
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Login from '../../src/views/Login.vue';
import { authAPI } from '../../src/services/api';
import { expectNoA11yViolations, runA11yAudit } from './a11y-utils.mjs';

vi.mock('../../src/services/api', () => ({
  authAPI: {
    login: vi.fn(),
    verifyMfa: vi.fn(),
    getRememberedUsername: vi.fn().mockResolvedValue({ data: { username: '' } })
  }
}));

describe('Login view', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    authAPI.getRememberedUsername.mockResolvedValue({ data: { username: '' } });
  });

  it('preloads remembered username from the server cookie endpoint', async () => {
    authAPI.getRememberedUsername.mockResolvedValue({ data: { username: 'saved-user' } });
    const wrapper = mount(Login, {
      global: {
        mocks: {
          $router: { push: vi.fn() }
        }
      }
    });
    await flushPromises();

    const usernameInput = wrapper.find('#username');
    expect(usernameInput.element.value).toBe('saved-user');
    expect(localStorage.getItem('rememberedUsername')).toBeNull();
  });

  it('opens the recovery page when forgot password is clicked', async () => {
    const push = vi.fn();
    const wrapper = mount(Login, {
      global: {
        mocks: {
          $router: { push }
        }
      }
    });

    const forgotButton = wrapper.find('button.btn-link');
    await forgotButton.trigger('click');

    expect(push).toHaveBeenCalledWith('/reset-password');
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
      password: 'secret123',
      rememberMe: true
    });
    expect(sessionStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('rememberedUsername')).toBeNull();
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

