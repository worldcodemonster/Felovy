'use client';

import { Navbar } from '@/components/shared/Navbar';

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8f8fb]">
      <Navbar />
      <div className="container mx-auto max-w-7xl px-4 py-10">
        {children}
      </div>
    </div>
  );
}
