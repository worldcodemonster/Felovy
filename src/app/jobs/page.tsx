'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { Navbar } from '@/components/shared/Navbar';
import { JobCard } from '@/components/jobs/JobCard';
import { api } from '@/lib/api';
import { Job, Developer, Application } from '@/types';
import { Search, Loader2, Lock, Sparkles, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/EmptyState';
import { Illustration } from '@/components/shared/Illustration';
import { cn } from '@/lib/utils';

const PREVIEW_COUNT = 8;
const PAGE_LIMIT    = 20;

function PaginationBar({ page, total, limit, onChange }: { page: number; total: number; limit: number; onChange: (p: number) => void }) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;

  const getPages = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1, 2, 3);
      if (page > 5) pages.push('...');
      if (page > 4 && page < totalPages - 3) { pages.push(page - 1, page, page + 1); }
      if (page < totalPages - 4) pages.push('...');
      pages.push(totalPages - 1, totalPages);
    }
    return Array.from(new Set(pages));
  };

  return (
    <div className="flex items-center justify-center gap-1 mt-10">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="h-4 w-4" /> Previous
      </button>

      {getPages().map((p, i) =>
        p === '...' ? (
          <span key={`dot-${i}`} className="px-2 text-gray-400 text-sm">···</span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p as number)}
            className={cn(
              'w-8 h-8 rounded-lg text-sm font-medium transition-all',
              page === p
                ? 'bg-gray-900 text-white'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
            )}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        Next <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

const TABS = [
  { label: 'All Jobs',   value: false },
  { label: 'Saved',      value: true  },
];

export default function JobsPage() {
  const { user } = useAuthStore();
  const [search,    setSearch]    = useState('');
  const [page,      setPage]      = useState(1);
  const [savedOnly, setSavedOnly] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['jobs', page, search, savedOnly, user?.id],
    queryFn: async () => {
      const body: Record<string, unknown> = {
        page:   String(page),
        limit:  String(PAGE_LIMIT),
        sortBy: 'latest',
      };
      if (search)              body.search      = search;
      if (user?.id)            body.userId      = user.id;
      if (savedOnly && user?.id) body.favoriteOnly = 'true';
      const res = await api.post('/jobs/list', body);
      return res.json() as Promise<{ jobs: Job[]; total: number }>;
    },
  });

  const { data: devProfile } = useQuery({
    queryKey: ['developer-me'],
    queryFn: async () => {
      const res = await api.post('/developers/me', {});
      return res.json() as Promise<Developer>;
    },
    enabled: user?.role === 'DEVELOPER',
  });

  const { data: myApplications } = useQuery({
    queryKey: ['my-applications'],
    queryFn: async () => {
      const res = await api.post('/applications/mine', {});
      return res.json() as Promise<Application[]>;
    },
    enabled: user?.role === 'DEVELOPER',
  });

  const appliedJobIds = new Set((myApplications ?? []).map(a => a.jobId));

  const isGuest   = !user;
  const allJobs   = data?.jobs ?? [];
  const visibleJobs = isGuest ? allJobs.slice(0, PREVIEW_COUNT) : allJobs;
  const hiddenJobs  = isGuest ? allJobs.slice(PREVIEW_COUNT) : [];
  const hiddenCount = Math.max(0, (data?.total ?? 0) - PREVIEW_COUNT);
  const isIncompleteDevProfile = user?.role === 'DEVELOPER' && devProfile && devProfile.profileStep < 4;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="container mx-auto max-w-7xl px-6 pt-8 pb-16">

        {/* ── Title ─────────────────────────────────────────────── */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Explore opportunities</h1>

        {/* ── Tabs ──────────────────────────────────────────────── */}
        {user && (
          <div className="flex border-b border-gray-200 mb-5">
            {TABS.map(tab => (
              <button
                key={String(tab.value)}
                onClick={() => { setSavedOnly(tab.value); setPage(1); }}
                className={cn(
                  'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                  savedOnly === tab.value
                    ? 'border-felovy-red text-felovy-red'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* ── Search + sort row ─────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Type to search"
              className="w-full pl-9 pr-4 h-9 rounded-lg border border-gray-200 text-sm bg-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
            />
          </div>
          <div className="ml-auto flex items-center gap-2 text-sm text-gray-500">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <span>{data?.total ?? 0} open roles</span>
            )}
          </div>
        </div>

        {/* ── Incomplete profile nudge ──────────────────────────── */}
        {isIncompleteDevProfile && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 mb-5 text-sm text-amber-800">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              Complete your profile to apply for jobs.{' '}
              <Link href="/dashboard/developer/profile" className="font-semibold underline underline-offset-2">
                Finish setup →
              </Link>
            </span>
          </div>
        )}

        {/* ── Cards ─────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="flex justify-center py-32">
            <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
          </div>
        ) : allJobs.length === 0 ? (
          <EmptyState
            illustration="empty-jobs"
            title={savedOnly ? 'No saved jobs yet' : 'No roles found'}
            description={savedOnly ? "Save jobs you like and they'll appear here" : 'Try a different search or filter'}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {visibleJobs.map(job => (
                <JobCard key={job.id} job={job} userId={user?.id} applied={appliedJobIds.has(job.id)} />
              ))}
            </div>

            {/* Guest blur overlay */}
            {hiddenJobs.length > 0 && (
              <div className="relative mt-3">
                <div className="absolute -top-12 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-white pointer-events-none z-10" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 blur-sm select-none pointer-events-none opacity-60">
                  {hiddenJobs.map(job => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center z-20">
                  <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 px-8 py-10 text-center max-w-sm w-full mx-4">
                    <Illustration name="auth-developer" className="w-36 h-auto mx-auto mb-4" width={144} height={108} />
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-900 mb-3">
                      <Lock className="h-6 w-6 text-white" />
                    </div>
                    <Badge variant="secondary" className="mb-3">
                      <Sparkles className="h-3 w-3 mr-1" />
                      {hiddenCount} more role{hiddenCount !== 1 ? 's' : ''} available
                    </Badge>
                    <h3 className="text-xl font-bold text-gray-900 mt-2 mb-1">Unlock All Roles</h3>
                    <p className="text-sm text-gray-500 mb-6">
                      Sign in to browse all{' '}
                      <span className="font-semibold text-gray-800">{data?.total}</span> open positions.
                    </p>
                    <div className="flex flex-col gap-2">
                      <Link href="/signin"><Button variant="gradient" className="w-full">Sign In</Button></Link>
                      <Link href="/signup"><Button variant="outline" className="w-full">Create Free Account</Button></Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Pagination */}
            {!isGuest && (
              <PaginationBar
                page={page}
                total={data?.total ?? 0}
                limit={PAGE_LIMIT}
                onChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
