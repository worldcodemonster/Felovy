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
    let idleId: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const mount = () => {
      if (!cancelled) setReady(true);
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(mount, { timeout: delayMs + 1500 });
    } else {
      timer = setTimeout(mount, delayMs);
    }

    return () => {
      cancelled = true;
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
      if (timer !== undefined) clearTimeout(timer);
    };
  }, [delayMs]);

  return ready ? <>{children}</> : <>{fallback}</>;
}
