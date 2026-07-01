'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { LogOut, Users, Building2, Briefcase, MessageSquare } from 'lucide-react';
import { Breadcrumb } from './Breadcrumb';

const dashboardHref: Record<string, string> = {
  DEVELOPER: '/dashboard/developer',
  EMPLOYER:  '/dashboard/employer',
  OWNER:     '/dashboard/owner',
};

const OWNER_NAV = [
  { label: 'Developers', icon: Users,         href: '/dashboard/owner/developers' },
  { label: 'Employers',  icon: Building2,     href: '/dashboard/owner/employers'  },
  { label: 'Jobs',       icon: Briefcase,     href: '/dashboard/owner/jobs'       },
  { label: 'Messages',   icon: MessageSquare, href: '/dashboard/owner/messages'   },
];

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router   = useRouter();
  const pathname = usePathname();

  const { data: devProfile } = useQuery({
    queryKey: ['developer-me'],
    queryFn: async () => {
      const res = await api.post('/developers/me', {});
      return res.json() as Promise<{ fullName?: string }>;
    },
    enabled: user?.role === 'DEVELOPER',
  });

  const { data: empProfile } = useQuery({
    queryKey: ['employer-me'],
    queryFn: async () => {
      const res = await api.post('/employers/me', {});
      return res.json() as Promise<{ companyName?: string; contactName?: string }>;
    },
    enabled: user?.role === 'EMPLOYER',
  });

  const displayName = user?.role === 'DEVELOPER'
    ? (devProfile?.fullName || user.email)
    : user?.role === 'EMPLOYER'
    ? (empProfile?.companyName || empProfile?.contactName || user.email)
    : null;

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const isOwner = isAuthenticated && user?.role === 'OWNER';

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 w-full border-b border-transparent bg-transparent backdrop-blur-sm">
        <div className="container mx-auto flex h-20 max-w-7xl items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Felovy" width={36} height={36} className="rounded-lg" />
            <span className="text-xl font-bold gradient-text">Felovy</span>
          </Link>

          {/* Nav links */}
          <nav className="hidden items-center gap-1 md:flex">
            <Link href="/jobs" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-felovy-red transition-colors">
              Jobs
            </Link>
            <Link href="/developers" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-felovy-red transition-colors">
              Developers
            </Link>
            {!isOwner && (
              <>
                <Link href="/#about" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-felovy-red transition-colors">
                  About
                </Link>
                <Link href="/#services" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-felovy-red transition-colors">
                  Services
                </Link>
              </>
            )}
            {isOwner && (
              <>
                <span className="w-px h-4 bg-gray-200 mx-1" />
                {OWNER_NAV.map(item => {
                  const active = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        active
                          ? 'text-felovy-red bg-felovy-light'
                          : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </>
            )}
          </nav>

          {/* Auth buttons */}
          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <>
                {displayName ? (
                  <Link
                    href={dashboardHref[user.role] || '/dashboard/developer'}
                    className="text-sm font-medium text-gray-700 hover:text-felovy-red transition-colors truncate max-w-[160px]"
                  >
                    {displayName}
                  </Link>
                ) : (
                  <Link href={dashboardHref[user.role] || '/dashboard/developer'}>
                    <Button variant="outline" size="sm">Dashboard</Button>
                  </Link>
                )}
                <Badge variant="default" className="text-xs hidden sm:inline-flex">
                  {user.role}
                </Badge>
                <Button variant="ghost" size="icon" onClick={handleLogout} title="Sign out">
                  <LogOut className="h-4 w-4 text-gray-500" />
                </Button>
              </>
            ) : (
              <>
                <Link href="/signin">
                  <Button variant="outline" size="sm">Sign In</Button>
                </Link>
                <Link href="/signup">
                  <Button variant="gradient" size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <div className="h-20" />
      <Breadcrumb excludePrefix="/dashboard/owner" />
    </>
  );
}
