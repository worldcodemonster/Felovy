'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Navbar } from '@/components/shared/Navbar';
import { api } from '@/lib/api';
import { Developer } from '@/types';
import { UserAvatar, SkillChip } from '@/app/dashboard/owner/_shared';
import { cn } from '@/lib/utils';
import { resolvePublicDeveloperPlace } from '@/lib/developer-location';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  Search, Users, MapPin, Loader2, ExternalLink,
  Check, ChevronLeft, ChevronRight,
} from 'lucide-react';

// ─── Developer card ───────────────────────────────────────────────────────────

function DeveloperCard({ dev }: { dev: Developer }) {
  const name   = dev.fullName || 'Developer';
  const skills = dev.skills?.slice(0, 4) ?? [];

  return (
    <Link
      href={`/developers/${dev.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col bg-white rounded-2xl border border-gray-200 p-5 hover:border-gray-400 hover:shadow-md transition-all cursor-pointer"
    >
      {/* Avatar */}
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-3">
          <div className="rounded-full ring-4 ring-white shadow overflow-hidden">
            <UserAvatar
              src={dev.photoUrl}
              name={name}
              gradient="bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600"
              size={72}
            />
          </div>
          {dev.isVerified && (
            <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-sm">
              <Check className="h-2.5 w-2.5 text-white stroke-[3]" />
            </div>
          )}
        </div>

        <p className="font-semibold text-gray-900 text-[15px] leading-tight line-clamp-1">{name}</p>
        {dev.title && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{dev.title}</p>
        )}

        {(dev.country || dev.location) && (
          <div className="flex items-center justify-center gap-1 mt-1.5 text-[11px] text-gray-400">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate max-w-[140px]">
              {resolvePublicDeveloperPlace({
                id: dev.id,
                fullName: dev.fullName,
                location: dev.location,
                country: dev.country,
              })}
            </span>
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1 justify-center mt-3">
            {skills.map(s => <SkillChip key={s} label={s} />)}
            {dev.skills.length > 4 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 font-medium">
                +{dev.skills.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-center gap-1.5 text-xs text-gray-400 group-hover:text-felovy-red transition-colors font-medium">
        <ExternalLink className="h-3 w-3" /> View Profile
      </div>
    </Link>
  );
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
      <div className="flex flex-col items-center gap-2">
        <div className="h-[72px] w-[72px] rounded-full bg-gray-100" />
        <div className="h-4 w-28 rounded bg-gray-100" />
        <div className="h-3 w-20 rounded bg-gray-100" />
        <div className="h-3 w-24 rounded bg-gray-100 mt-1" />
        <div className="flex gap-1 mt-2">
          {[40, 52, 36].map(w => (
            <div key={w} className="h-5 rounded-full bg-gray-100" style={{ width: w }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({ page, total, limit, onChange }: {
  page: number; total: number; limit: number; onChange: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;

  const pages: (number | '…')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    [1, 2, 3].forEach(p => pages.push(p));
    if (page > 5) pages.push('…');
    if (page > 4 && page < totalPages - 3) pages.push(page - 1, page, page + 1);
    if (page < totalPages - 4) pages.push('…');
    pages.push(totalPages - 1, totalPages);
  }
  const unique = Array.from(new Set(pages));

  return (
    <div className="flex items-center justify-center gap-1 mt-10">
      <button
        onClick={() => onChange(page - 1)} disabled={page === 1}
        className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="h-4 w-4" /> Previous
      </button>

      {unique.map((p, i) =>
        p === '…' ? (
          <span key={`d${i}`} className="px-2 text-gray-400 text-sm">···</span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p as number)}
            className={cn(
              'w-8 h-8 rounded-lg text-sm font-medium transition-all',
              page === p ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800',
            )}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onChange(page + 1)} disabled={page === totalPages}
        className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        Next <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const LIMIT = 12;

export default function EmployerDevelopersPage() {
  const [page,   setPage]   = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['employer-developers', page, search],
    queryFn: async () => {
      const body: Record<string, unknown> = { page: String(page), limit: String(LIMIT) };
      if (search.trim()) body.search = search.trim();
      const r = await api.post('/developers', body);
      return r.json() as Promise<{ developers: Developer[]; total: number }>;
    },
    placeholderData: prev => prev,
  });

  const devs  = data?.developers ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto max-w-7xl px-4 py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-felovy-red" />
            Verified Developers
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Browse profiles of verified developers available for hire
          </p>
        </div>

        {/* Search bar + count */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name or title…"
              className="w-full pl-9 pr-4 h-9 rounded-lg border border-gray-200 text-sm bg-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
            />
          </div>
          <span className="text-sm text-gray-400 shrink-0">
            {isLoading ? '-' : `${total} developer${total !== 1 ? 's' : ''}`}
          </span>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: LIMIT }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : devs.length === 0 ? (
          <EmptyState
            illustration="empty-developers"
            title="No developers found"
            description={search ? 'Try a different search term' : 'Adjust your filters to see more results'}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {devs.map(dev => <DeveloperCard key={dev.id} dev={dev} />)}
            </div>
            <Pagination
              page={page}
              total={total}
              limit={LIMIT}
              onChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            />
          </>
        )}
      </div>
    </div>
  );
}
