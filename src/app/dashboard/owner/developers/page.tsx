'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/toaster';
import { api } from '@/lib/api';
import { Developer } from '@/types';
import { Users, Bot, Trash2 } from 'lucide-react';
import Link from 'next/link';
import {
  STATUS_MAP, DeveloperCard, DeveloperCardSkeleton, FilterBar, Pagination, ConfirmDialog,
} from '../_shared';

export default function DevelopersPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [status, setStatus] = useState('');
  const [country, setCountry] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmRemove, setConfirmRemove] = useState(false);

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

  const pageIds = useMemo(
    () => data?.developers.map(d => d.id) ?? [],
    [data?.developers],
  );
  const allOnPageSelected = pageIds.length > 0 && pageIds.every(id => selectedIds.has(id));
  const selectedCount = selectedIds.size;

  useEffect(() => {
    setSelectedIds(new Set());
  }, [page, search, filter, status, country]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllOnPage = () => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        pageIds.forEach(id => next.delete(id));
      } else {
        pageIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

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

  const { mutate: removeSelected, isPending: removing } = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await api.post('/owner/developers/delete', { developerIds: ids });
      if (!res.ok) throw new Error((await res.json()).message || 'Delete failed');
      return res.json() as Promise<{ deleted: number; message: string }>;
    },
    onSuccess: (result) => {
      setSelectedIds(new Set());
      setConfirmRemove(false);
      toast({ title: result.message });
      qc.invalidateQueries({ queryKey: ['owner-devs'] });
    },
    onError: (err: Error) => {
      toast({ title: err.message, variant: 'destructive' });
    },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <Link
          href="/dashboard/owner/developers/bot"
          className="inline-flex items-center gap-2 text-sm font-semibold text-felovy-red hover:underline"
        >
          <Bot className="h-4 w-4" />
          Developer Bot
        </Link>
      </div>
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

      {!!data?.developers.length && (
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 px-1">
          <label className="inline-flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={allOnPageSelected}
              onChange={toggleSelectAllOnPage}
              className="h-4 w-4 rounded border-gray-300 accent-felovy-red"
            />
            Select all on page
            {selectedCount > 0 && (
              <span className="text-gray-400">({selectedCount} selected)</span>
            )}
          </label>
          {selectedCount > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
              >
                Clear
              </button>
              <button
                type="button"
                disabled={removing}
                onClick={() => setConfirmRemove(true)}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-60 px-3.5 py-2 rounded-xl shadow-sm shadow-red-200 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove {selectedCount}
              </button>
            </div>
          )}
        </div>
      )}

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
                selected={selectedIds.has(dev.id)}
                onToggleSelect={toggleSelect}
                onVerify={(id, approved) => verify({ id, approved })}
                onModerate={(userId, action) => moderate({ userId, action })}
              />
            ))}
          </div>
          <Pagination page={page} total={data.total} limit={12} onChange={setPage} />
        </>
      )}

      {confirmRemove && (
        <ConfirmDialog
          title={`Remove ${selectedCount} developer${selectedCount === 1 ? '' : 's'}?`}
          desc="This permanently deletes the selected accounts and all their data. This cannot be undone."
          destructive
          onCancel={() => setConfirmRemove(false)}
          onConfirm={() => removeSelected(Array.from(selectedIds))}
        />
      )}
    </div>
  );
}
