'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { Navbar } from '@/components/shared/Navbar';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { Developer } from '@/types';
import { FilterBar, Pagination } from '@/app/dashboard/owner/_shared';
import { DeveloperPortraitCard } from '@/components/home/DeveloperPortraitCard';
import { CAROUSEL_GRADS } from '@/lib/developer-carousel';
import { EmptyState } from '@/components/shared/EmptyState';
import { Users } from 'lucide-react';

function DeveloperPortraitCardSkeleton() {
  return (
    <div className="w-full aspect-[170/240] rounded-xl bg-gray-200 animate-pulse shadow-md shadow-gray-200/80" />
  );
}

const LIMIT = 30;

const GRID_CLASS = 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4';

export default function DevelopersPage() {
  const { isAuthenticated } = useAuthStore();
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
    enabled: isAuthenticated,
    placeholderData: prev => prev,
  });

  const devs  = data?.developers ?? [];
  const total = data?.total ?? 0;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50/60">
        <Navbar />
        <div className="container mx-auto max-w-7xl px-4 py-8">
          <EmptyState
            illustration="auth-developer"
            title="Sign in to see the developer list"
            description="Create a free account or sign in to browse verified developers on Felovy."
          >
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Link href="/signin?redirect=/developers">
                <Button variant="gradient">Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button variant="outline">Create Free Account</Button>
              </Link>
            </div>
          </EmptyState>
        </div>
      </div>
    );
  }

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
          <div className={GRID_CLASS}>
            {Array.from({ length: LIMIT }).map((_, i) => <DeveloperPortraitCardSkeleton key={i} />)}
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
            <div className={GRID_CLASS}>
              {devs.map((dev, i) => (
                <DeveloperPortraitCard
                  key={dev.id}
                  id={dev.id}
                  name={dev.fullName || 'Developer'}
                  title={dev.title}
                  location={dev.location}
                  country={dev.country}
                  photoUrl={dev.photoUrl}
                  gender={dev.gender}
                  grad={CAROUSEL_GRADS[i % CAROUSEL_GRADS.length]}
                />
              ))}
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
