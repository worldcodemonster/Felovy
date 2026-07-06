'use client';

import { useEffect, useState } from 'react';
import { FloatingAIGuide } from '@/components/home/FloatingAIGuide';

/** Site-wide overlay UI (AI guide orb, etc.) — mounted from root layout. */
export function AppOverlays() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) return null;

  return <FloatingAIGuide />;
}
