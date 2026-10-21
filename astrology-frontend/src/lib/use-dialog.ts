'use client';

import { useEffect, useRef } from 'react';

/**
 * Standard dialog behaviour: Escape closes, the page behind stops scrolling, and focus returns to
 * whatever opened the dialog. Pass `open=false` for dialogs that stay mounted while hidden.
 */
export function useDialog(onClose: () => void, open = true) {
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      opener?.focus?.();
    };
  }, [open]);
}
