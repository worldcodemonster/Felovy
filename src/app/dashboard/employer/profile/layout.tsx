'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '@/components/shared/Navbar';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { Employer } from '@/types';
import { ArrowLeft, CheckCircle2, Eye } from 'lucide-react';

const TABS = [
  { label: 'Credentials',    href: '/dashboard/employer/profile/credentials',     step: 1 },
  { label: 'Company Info',   href: '/dashboard/employer/profile/company-info',    step: 2 },
  { label: 'Media',          href: '/dashboard/employer/profile/media',            step: 3 },
  { label: 'ID Verification',href: '/dashboard/employer/profile/id-verification', step: 4 },
];

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const { data: profile } = useQuery({
    queryKey: ['employer-me'],
    queryFn: async () => {
      const res = await api.post('/employers/me', {});
      return res.json() as Promise<Employer>;
    },
  });

  const profileStep = profile?.profileStep ?? 0;

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link href="/dashboard/employer" className="flex items-center gap-1 text-sm text-gray-500 hover:text-felovy-red transition-colors">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
          {profile?.id && (
            <Link href={`/employers/${profile.id}`} target="_blank">
              <Button variant="outline" size="sm" className="gap-2">
                <Eye className="h-4 w-4" /> Preview Profile
              </Button>
            </Link>
          )}
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">Company Profile</h1>
        <p className="text-gray-500 text-sm mb-6">Complete all steps to get verified and start posting jobs.</p>

        <div className="flex gap-1 mb-6 overflow-x-auto">
          {TABS.map((t, i) => {
            const isActive    = pathname.startsWith(t.href);
            const isCompleted = profileStep >= t.step;
            const isLocked    = t.step > profileStep + 1;

            return (
              <Link
                key={t.href}
                href={isLocked ? '#' : t.href}
                onClick={e => isLocked && e.preventDefault()}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-felovy-red text-white'
                    : isCompleted
                      ? 'bg-green-100 text-green-700'
                      : isLocked
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {isCompleted && !isActive && <CheckCircle2 className="h-3.5 w-3.5" />}
                {i + 1}. {t.label}
              </Link>
            );
          })}
        </div>

        {children}
      </div>
    </div>
  );
}
