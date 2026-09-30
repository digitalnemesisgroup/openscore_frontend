import { useRef, useCallback } from 'react';

/**
 * Custom hook to throttle function execution (prevent rapid multi-clicking)
 * @param callback Function to execute
 * @param limit Time limit in milliseconds (default: 800ms)
 */
export function useThrottleCallback<T extends (...args: any[]) => any>(
  callback: T,
  limit: number = 800
): T {
  const inThrottle = useRef(false);

  return useCallback(
    (...args: Parameters<T>) => {
      if (!inThrottle.current) {
        callback(...args);
        inThrottle.current = true;
        setTimeout(() => {
          inThrottle.current = false;
        }, limit);
      }
    },
    [callback, limit]
  ) as T;
}

