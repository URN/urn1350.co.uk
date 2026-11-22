import { useEffect, useRef } from 'react';

const FOCUSABLE = 'a[href], button, input, textarea';
const tabbable = (root) => [...root.querySelectorAll(FOCUSABLE)].filter((el) => !el.disabled && el.tabIndex >= 0);

/**
 * Modal behaviour for a dialog element: locks page scroll, closes on Escape,
 * keeps Tab inside, focuses `initial` on open and returns focus to whatever
 * opened it on close. Attach the returned ref to the dialog container.
 */
export default function useDialog(open, onClose, initial) {
  const ref = useRef(null);
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const opener = document.activeElement;
    document.body.classList.add('is-locked');
    const t = setTimeout(() => (initial?.current || (ref.current && tabbable(ref.current)[0]))?.focus({ preventScroll: true }), 80);
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close.current();
        return;
      }
      const f = e.key === 'Tab' && ref.current ? tabbable(ref.current) : [];
      if (!f.length) return;
      const edge = e.shiftKey ? f[0] : f[f.length - 1];
      if (document.activeElement === edge) {
        e.preventDefault();
        (e.shiftKey ? f[f.length - 1] : f[0]).focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      document.body.classList.remove('is-locked');
      document.removeEventListener('keydown', onKey);
      if (opener && opener.focus) opener.focus({ preventScroll: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return ref;
}
