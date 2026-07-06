'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

const LABELS: Record<string, string> = {
  jobs: 'Jobs',
  developers: 'Developers',
  employers: 'Employers',
  owner: 'Owner Dashboard',
  developer: 'My Dashboard',
  employer: 'My Dashboard',
  profile: 'Profile',
  messages: 'Messages',
  settings: 'Settings',
  applications: 'Applications',
  new: 'New Job',
};

const DYNAMIC_LABELS: Record<string, string> = {
  developers: 'Developer Profile',
  employers: 'Employer Profile',
  jobs: 'Job Details',
  messages: 'Conversation',
};

const SKIP = new Set(['dashboard']);

function isUUID(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

function buildCrumbs(pathname: string) {
  const allSegs = pathname.split('/').filter(Boolean);
  const crumbs: { label: string; href: string }[] = [];

  for (let i = 0; i < allSegs.length; i++) {
    const seg = allSegs[i];
    const prev = allSegs[i - 1];
    if (SKIP.has(seg)) continue;

    const href = '/' + allSegs.slice(0, i + 1).join('/');
    const label = isUUID(seg)
      ? (DYNAMIC_LABELS[prev] ?? 'Details')
      : (LABELS[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '));

    crumbs.push({ label, href });
  }

  return crumbs;
}

function CrumbList({ crumbs }: { crumbs: { label: string; href: string }[] }) {
  return (
    <ol className="flex items-center gap-1 flex-wrap">
      <li className="shrink-0">
        <Link href="/" className="text-gray-400 hover:text-felovy-red transition-colors flex items-center">
          <Home className="h-3.5 w-3.5" />
        </Link>
      </li>
      {crumbs.map((c, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <li key={c.href} className="flex items-center gap-1 min-w-0">
            <ChevronRight className="h-3.5 w-3.5 text-gray-300 shrink-0" />
            {isLast ? (
              <span className="text-[13px] font-medium text-gray-800 truncate">{c.label}</span>
            ) : (
              <Link href={c.href} className="text-[13px] text-gray-400 hover:text-felovy-red transition-colors truncate">
                {c.label}
              </Link>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * variant="bar"    — full-width bar with border-b and backdrop, used in Navbar
 * variant="inline" — plain nav, used inside page containers/layouts
 */
export function Breadcrumb({
  variant = 'bar',
  excludePrefix,
}: {
  variant?: 'bar' | 'inline';
  excludePrefix?: string;
}) {
  const pathname = usePathname() ?? '';

  if (
    !pathname ||
    pathname === '/' ||
    pathname.startsWith('/signin') ||
    pathname.startsWith('/signup') ||
    (excludePrefix && pathname.startsWith(excludePrefix))
  ) return null;

  const crumbs = buildCrumbs(pathname);
  if (crumbs.length < 2) return null;

  if (variant === 'bar') {
    return (
      <div className="w-full border-b border-white/40 bg-white/30 backdrop-blur-sm">
        <nav aria-label="Breadcrumb" className="container mx-auto max-w-7xl px-4 py-2.5">
          <CrumbList crumbs={crumbs} />
        </nav>
      </div>
    );
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-5">
      <CrumbList crumbs={crumbs} />
    </nav>
  );
}
