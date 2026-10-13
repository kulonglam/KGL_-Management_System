const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const focusTrap = {
  mounted(el, binding) {
    const previous = document.activeElement;
    if (!el.hasAttribute('tabindex')) {
      el.setAttribute('tabindex', '-1');
    }

    const focusable = () => Array.from(el.querySelectorAll(FOCUSABLE_SELECTOR));

    const onKeydown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (typeof binding.value === 'function') binding.value();
        return;
      }

      if (event.key !== 'Tab') return;

      const items = focusable();
      if (items.length === 0) {
        event.preventDefault();
        el.focus();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || !el.contains(active))) {
        event.preventDefault();
        last.focus();
        return;
      }

      if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    el.__focusTrapCleanup = () => {
      window.removeEventListener('keydown', onKeydown);
      if (previous && typeof previous.focus === 'function') {
        previous.focus();
      }
    };

    window.addEventListener('keydown', onKeydown);
    queueMicrotask(() => {
      const first = el.querySelector(FOCUSABLE_SELECTOR);
      (first || el).focus();
    });
  },
  unmounted(el) {
    el.__focusTrapCleanup?.();
    delete el.__focusTrapCleanup;
  }
};

export { focusTrap };
