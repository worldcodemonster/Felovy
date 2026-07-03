'use client';

import { useEffect, useState, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  delayMs?: number;
  fallback?: ReactNode;
}

export function DeferredMount({ children, delayMs = 0, fallback = null }: Props) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const mount = () => {
      if (!cancelled) setReady(true);
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(mount, { timeout: delayMs + 1500 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(idleId);
      };
    }

    const timer = window.setTimeout(mount, delayMs);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [delayMs]);

  return ready ? <>{children}</> : <>{fallback}</>;
}
