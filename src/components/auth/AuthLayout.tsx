'use client';

import Link from 'next/link';
import { type ReactNode } from 'react';
import { Illustration } from '@/components/shared/Illustration';
import { FelovyLogo } from '@/components/shared/FelovyLogo';
import { type IllustrationName } from '@/lib/illustrations';

interface AuthLayoutProps {
  children: ReactNode;
  illustration: IllustrationName;
  title: string;
  subtitle: string;
}

export function AuthLayout({ children, illustration, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex items-center justify-center p-6 sm:p-8 lg:p-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 lg:text-left">
            <Link href="/" className="inline-block">
              <FelovyLogo size={56} className="mx-auto lg:mx-0 mb-4" />
            </Link>
            <h1 className="text-3xl font-bold brand-text">{title}</h1>
            <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>

      <div className="hidden lg:flex relative items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-green-50 border-l border-gray-100">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-16 right-12 h-72 w-72 rounded-full bg-felovy-red/10 blur-3xl" />
          <div className="absolute bottom-16 left-8 h-56 w-56 rounded-full bg-green-200/40 blur-3xl" />
        </div>
        <Illustration
          name={illustration}
          priority
          className="relative z-10 w-[88%] max-w-lg h-auto drop-shadow-sm"
          width={520}
          height={390}
        />
      </div>
    </div>
  );
}
