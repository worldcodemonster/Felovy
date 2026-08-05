'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { Loading } from '@/components/shared/Loading';

const dashboardHref: Record<string, string> = {
  DEVELOPER: '/dashboard/developer',
  EMPLOYER: '/dashboard/employer',
  OWNER: '/dashboard/owner',
  ADMIN: '/dashboard/admin',
};

export default function DashboardIndexPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.replace('/signin');
      return;
    }
    router.replace(dashboardHref[user.role] || '/dashboard/developer');
  }, [isAuthenticated, user, router]);

  return <Loading fullPage text="Loading dashboard…" />;
}
