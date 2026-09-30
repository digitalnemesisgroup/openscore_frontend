'use client';

import { useEffect } from 'react';

/**
 * Prevents uncaught browser DOM 'releasePointerCapture' errors
 * caused by Next.js dev tools or slider drag release on unmounted/inactive pointer IDs.
 */
export default function PointerCaptureHandler() {
  useEffect(() => {
    if (typeof window !== 'undefined' && Element.prototype.releasePointerCapture) {
      const originalRelease = Element.prototype.releasePointerCapture;
      Element.prototype.releasePointerCapture = function (pointerId: number) {
        try {
          if (typeof this.hasPointerCapture === 'function' && !this.hasPointerCapture(pointerId)) {
            return;
          }
          originalRelease.call(this, pointerId);
        } catch (err) {
          // Suppress stale pointer capture release exception safely
        }
      };
    }
  }, []);

  return null;
}

