'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/shared/Navbar';
import { api } from '@/lib/api';
import { Developer } from '@/types';
import { countryToFlagUrl } from '@/lib/countries';
import {
  SkillChip, CompletionBar, DeveloperCardSkeleton,
  FilterBar, Pagination,
} from '@/app/dashboard/owner/_shared';
import { GenderAvatar } from '@/components/shared/GenderAvatar';
import { EmptyState } from '@/components/shared/EmptyState';
import { Users } from 'lucide-react';

// ─── Public developer card ────────────────────────────────────────────────────

function PublicDeveloperCard({ dev }: { dev: Developer }) {
  const router = useRouter();
  const name = dev.fullName || 'Developer';

  return (
    <div
      className="relative group cursor-pointer hover:-translate-y-1.5 transition-all duration-250"
      onClick={() => router.push(`/developers/${dev.id}`)}
    >
      <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.05)] flex flex-col overflow-hidden border border-gray-200/70 hover:shadow-[0_12px_40px_rgba(0,0,0,0.13)]">

        {/* Header */}
        <div className="flex flex-col items-center px-6 pt-8 pb-5">
          <div className="rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.14)] ring-1 ring-white overflow-hidden mb-3">
            <GenderAvatar src={dev.photoUrl} name={name} gender={dev.gender} size={88} />
          </div>

          <Link
            href={`/developers/${dev.id}`}
            className="group/name mt-1 text-center"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-[17px] font-bold text-gray-900 group-hover/name:text-felovy-red transition-colors leading-tight line-clamp-1">
              {name}
            </h3>
          </Link>

          {dev.title ? (
            <p className="text-[13px] text-gray-500 mt-1 line-clamp-1 text-center">{dev.title}</p>
          ) : (
            <p className="text-[13px] text-gray-400 mt-1">Developer</p>
          )}

          {(dev.country || dev.location) && (
            <div className="flex items-center gap-1.5 mt-2.5 text-[12px] text-gray-500 max-w-[180px]">
              {dev.country && countryToFlagUrl(dev.country) && (
                <img
                  src={countryToFlagUrl(dev.country)}
                  alt={dev.country}
                  width={20}
                  height={15}
                  className="rounded-[2px] object-cover shadow-sm shrink-0"
                />
              )}
              <span className="line-clamp-1">{dev.location || dev.country}</span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="px-6 pb-5 flex flex-col gap-4 flex-1">
          <CompletionBar step={dev.profileStep} total={4} />

          {dev.summary && (
            <p className="text-[12px] text-gray-400 leading-[1.7] line-clamp-2">
              {dev.summary}
            </p>
          )}

          {dev.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {dev.skills.slice(0, 4).map(s => <SkillChip key={s} label={s} />)}
              {dev.skills.length > 4 && (
                <span className="text-[11px] text-gray-400 self-center font-medium">
                  +{dev.skills.length - 4} more
                </span>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const LIMIT = 12;

export default function DevelopersPage() {
  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState('');
  const [country, setCountry] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['developers-list', page, search, country],
    queryFn: async () => {
      const body: Record<string, unknown> = {
        page: String(page),
        limit: String(LIMIT),
        verified: 'true',
      };
      if (search.trim())  body.search  = search.trim();
      if (country.trim()) body.country = country.trim();
      const r = await api.post('/developers', body);
      if (!r.ok) throw new Error(`${r.status}`);
      return r.json() as Promise<{ developers: Developer[]; total: number }>;
    },
    placeholderData: prev => prev,
  });

  const devs  = data?.developers ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="min-h-screen bg-gray-50/60">
      <Navbar />

      <div className="container mx-auto max-w-7xl px-4 py-8">
        <FilterBar
          icon={Users}
          title={`Developers${!isLoading ? ` · ${total}` : ''}`}
          search={search}
          onSearch={v => { setSearch(v); setPage(1); }}
          filter=""
          onFilter={() => {}}
          options={[{ value: '', label: 'All' }]}
          country={country}
          onCountry={v => { setCountry(v); setPage(1); }}
        />

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: LIMIT }).map((_, i) => <DeveloperCardSkeleton key={i} />)}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-2">
            <Users className="h-10 w-10 text-gray-200" />
            <p className="text-sm">Could not load developers. Please try again later.</p>
          </div>
        ) : devs.length === 0 ? (
          <EmptyState
            illustration="empty-developers"
            title="No developers found"
            description="Try adjusting your search or filters"
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {devs.map(dev => <PublicDeveloperCard key={dev.id} dev={dev} />)}
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
