'use client';
import { useEffect } from 'react';

// Browsers change a focused number input's value on mouse-wheel scroll.
// Blur it on wheel so scrolling the page never silently edits a field.
export default function NumberInputWheelFix() {
  useEffect(() => {
    function onWheel(e: WheelEvent) {
      const el = document.activeElement;
      if (el instanceof HTMLInputElement && el.type === 'number') {
        el.blur();
      }
    }
    document.addEventListener('wheel', onWheel, { passive: true });
    return () => document.removeEventListener('wheel', onWheel);
  }, []);
  return null;
}
