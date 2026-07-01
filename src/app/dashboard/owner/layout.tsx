'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/shared/Navbar';
import { Loading } from '@/components/shared/Loading';

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return <Loading fullPage size="lg" text="Loading dashboard…" />;

  return (
    <div className="min-h-screen bg-[#f8f8fb]">
      <Navbar />
      <div className="container mx-auto max-w-7xl px-4 py-10">
        {children}
      </div>
    </div>
  );
}
