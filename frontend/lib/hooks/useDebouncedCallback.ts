'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';

export function useDebouncedCallback<T extends (...args: any[]) => any>(callback: T, delayMs: number) {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const debounced = useMemo(() => {
    return (...args: Parameters<T>) => {
      cancel();
      timeoutRef.current = window.setTimeout(() => {
        callbackRef.current(...args);
      }, delayMs);
    };
  }, [cancel, delayMs]);

  return { debounced, cancel };
}
