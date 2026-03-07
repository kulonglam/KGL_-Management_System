import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import NotFound from '../../src/views/NotFound.vue';
import { pinia } from '../../src/stores';
import { useAuthStore } from '../../src/stores/auth';

const buildWrapper = ({ fullPath, matched }) => {
  const router = {
    push: vi.fn(),
    back: vi.fn()
  };

  const wrapper = mount(NotFound, {
    global: {
      mocks: {
        $route: {
          fullPath,
          matched
        },
        $router: router
      }
    }
  });

  return { wrapper, router };
};

describe('NotFound', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();
    useAuthStore(pinia).clearSession();
  });

  it('routes unauthenticated users back to sign in from the public 404 page', async () => {
    const { wrapper, router } = buildWrapper({
      fullPath: '/missing-page',
      matched: []
    });

    expect(wrapper.text()).toContain('This page does not exist in the system.');
    expect(wrapper.text()).toContain('/missing-page');

    const primaryButton = wrapper.findAll('button').find((button) => button.text().includes('Go to Sign In'));
    expect(primaryButton).toBeTruthy();

    await primaryButton.trigger('click');
    expect(router.push).toHaveBeenCalledWith('/');
  });

  it('routes authenticated users to their dashboard from the dashboard 404 page', async () => {
    useAuthStore(pinia).setSession('token-1', {
      role: 'manager',
      name: 'Kulong'
    });

    const { wrapper, router } = buildWrapper({
      fullPath: '/dashboard/unknown-page',
      matched: [{ path: '/dashboard' }, { path: '/dashboard/:pathMatch(.*)*' }]
    });

    expect(wrapper.text()).toContain('This dashboard page is not available.');

    const primaryButton = wrapper.findAll('button').find((button) => button.text().includes('Go to Dashboard'));
    expect(primaryButton).toBeTruthy();

    await primaryButton.trigger('click');
    expect(router.push).toHaveBeenCalledWith('/dashboard/manager');
  });
});
