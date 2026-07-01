'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/toaster';
import { api } from '@/lib/api';
import { Developer } from '@/types';
import { Users } from 'lucide-react';
import {
  STATUS_MAP, DeveloperCard, DeveloperCardSkeleton, FilterBar, Pagination,
} from '../_shared';

export default function DevelopersPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [status, setStatus] = useState('');
  const [country, setCountry] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['owner-devs', page, search, filter, status, country],
    queryFn: async () => {
      const body: Record<string, unknown> = { page: String(page), limit: '12' };
      if (search)      body.search   = search;
      if (filter !== '') body.verified = filter;
      if (status)      body.status   = status;
      if (country)     body.country  = country;
      const r = await api.post('/owner/developers', body);
      return r.json() as Promise<{ developers: Developer[]; total: number }>;
    },
  });

  const { mutate: verify } = useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) =>
      api.post('/owner/verify/developer', { developerId: id, approved }),
    onMutate: async ({ id, approved }) => {
      await qc.cancelQueries({ queryKey: ['owner-devs'] });
      const snap = qc.getQueriesData<{ developers: Developer[]; total: number }>({ queryKey: ['owner-devs'] });
      qc.setQueriesData<{ developers: Developer[]; total: number }>({ queryKey: ['owner-devs'] }, old =>
        old ? { ...old, developers: old.developers.map(d => d.id === id ? { ...d, isVerified: approved } : d) } : old
      );
      return { snap };
    },
    onError: (_e, _v, ctx) => {
      ctx?.snap.forEach(([k, v]) => qc.setQueryData(k, v));
      toast({ title: 'Failed', variant: 'destructive' });
    },
    onSuccess: () => toast({ title: 'Verification updated' }),
    onSettled: () => qc.invalidateQueries({ queryKey: ['owner-devs'] }),
  });

  const { mutate: moderate } = useMutation({
    mutationFn: ({ userId, action }: { userId: string; action: string }) =>
      api.post('/owner/moderate', { userId, action }),
    onMutate: async ({ userId, action }) => {
      await qc.cancelQueries({ queryKey: ['owner-devs'] });
      const snap = qc.getQueriesData<{ developers: Developer[]; total: number }>({ queryKey: ['owner-devs'] });
      if (action === 'kick') {
        qc.setQueriesData<{ developers: Developer[]; total: number }>({ queryKey: ['owner-devs'] }, old =>
          old ? { ...old, developers: old.developers.filter(d => d.userId !== userId), total: old.total - 1 } : old
        );
      } else {
        const newStatus = STATUS_MAP[action] ?? 'ACTIVE';
        qc.setQueriesData<{ developers: Developer[]; total: number }>({ queryKey: ['owner-devs'] }, old =>
          old ? { ...old, developers: old.developers.map(d => d.userId === userId ? { ...d, user: { ...d.user, status: newStatus as any } } : d) } : old
        );
      }
      return { snap };
    },
    onError: (_e, _v, ctx) => {
      ctx?.snap.forEach(([k, v]) => qc.setQueryData(k, v));
      toast({ title: 'Action failed', variant: 'destructive' });
    },
    onSuccess: (_d, vars) => toast({ title: `Developer ${vars.action}d` }),
    onSettled: () => qc.invalidateQueries({ queryKey: ['owner-devs'] }),
  });

  return (
    <div>
      <FilterBar
        icon={Users}
        title="Developers"
        search={search}
        onSearch={v => { setSearch(v); setPage(1); }}
        filter={filter}
        onFilter={v => { setFilter(v); setPage(1); }}
        options={[
          { value: '', label: 'All' },
          { value: 'false', label: 'Unverified' },
          { value: 'true', label: 'Verified' },
        ]}
        status={status}
        onStatus={v => { setStatus(v); setPage(1); }}
        country={country}
        onCountry={v => { setCountry(v); setPage(1); }}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <DeveloperCardSkeleton key={i} />)}
        </div>
      ) : !data?.developers.length ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-2">
          <Users className="h-10 w-10 text-gray-200" />
          <p className="text-sm">No developers found</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {data.developers.map(dev => (
              <DeveloperCard
                key={dev.id}
                dev={dev}
                onVerify={(id, approved) => verify({ id, approved })}
                onModerate={(userId, action) => moderate({ userId, action })}
              />
            ))}
          </div>
          <Pagination page={page} total={data.total} limit={12} onChange={setPage} />
        </>
      )}
    </div>
  );
}
