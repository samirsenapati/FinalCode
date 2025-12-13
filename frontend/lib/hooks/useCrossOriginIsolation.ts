'use client';

import { useEffect, useState } from 'react';

export function useCrossOriginIsolation() {
  const [isIsolated, setIsIsolated] = useState<boolean>(false);

  useEffect(() => {
    // Cross-origin isolation required for WebContainers
    setIsIsolated(Boolean((globalThis as any).crossOriginIsolated));
  }, []);

  return { isIsolated };
}
