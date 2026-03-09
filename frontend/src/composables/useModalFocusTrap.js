// Traps keyboard focus within a modal and restores focus after close.
 

import { nextTick, onBeforeUnmount, ref, watch } from 'vue';

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const useModalFocusTrap = ({ isOpen, modalRef, onRequestClose }) => {
  const lastFocusedElement = ref(null);

  const captureTriggerFocus = () => {
    lastFocusedElement.value = document.activeElement;
  };

  const getFocusableElements = () =>
    Array.from(modalRef.value?.querySelectorAll(FOCUSABLE_SELECTOR) || []);

  const focusModal = async () => {
    await nextTick();

    const firstFocusable = getFocusableElements()[0];
    if (firstFocusable) {
      firstFocusable.focus();
      return;
    }

    modalRef.value?.focus();
  };

  const restorePreviousFocus = () => {
    const element = lastFocusedElement.value;
    if (element && typeof element.focus === 'function') {
      element.focus();
    }
  };

  const trapFocus = (event) => {
    if (!isOpen.value || event.key !== 'Tab') return;

    const focusable = getFocusableElements();
    if (focusable.length === 0) {
      event.preventDefault();
      modalRef.value?.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const handleKeydown = (event) => {
    if (!isOpen.value) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      onRequestClose();
      return;
    }

    trapFocus(event);
  };

  watch(isOpen, (modalIsOpen) => {
    if (modalIsOpen) {
      focusModal();
      window.addEventListener('keydown', handleKeydown);
      return;
    }

    window.removeEventListener('keydown', handleKeydown);
    restorePreviousFocus();
  });

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleKeydown);
  });

  return {
    captureTriggerFocus
  };
};

export { useModalFocusTrap };
