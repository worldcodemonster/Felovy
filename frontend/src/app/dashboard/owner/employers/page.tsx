'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/toaster';
import { api } from '@/lib/api';
import { Employer } from '@/types';
import { Building2 } from 'lucide-react';
import {
  STATUS_MAP, EmployerRow, EmployerTableSkeleton, FilterBar, Pagination,
} from '../_shared';

export default function EmployersPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [status, setStatus] = useState('');
  const [country, setCountry] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['owner-emps', page, search, filter, status, country],
    queryFn: async () => {
      const body: Record<string, unknown> = { page: String(page), limit: '12' };
      if (search)      body.search   = search;
      if (filter !== '') body.verified = filter;
      if (status)      body.status   = status;
      if (country)     body.country  = country;
      const r = await api.post('/owner/employers', body);
      return r.json() as Promise<{ employers: Employer[]; total: number }>;
    },
  });

  const { mutate: verify } = useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) =>
      api.post('/owner/verify/employer', { employerId: id, approved }),
    onMutate: async ({ id, approved }) => {
      await qc.cancelQueries({ queryKey: ['owner-emps'] });
      const snap = qc.getQueriesData<{ employers: Employer[]; total: number }>({ queryKey: ['owner-emps'] });
      qc.setQueriesData<{ employers: Employer[]; total: number }>({ queryKey: ['owner-emps'] }, old =>
        old ? { ...old, employers: old.employers.map(e => e.id === id ? { ...e, isVerified: approved } : e) } : old
      );
      return { snap };
    },
    onError: (_e, _v, ctx) => {
      ctx?.snap.forEach(([k, v]) => qc.setQueryData(k, v));
      toast({ title: 'Failed', variant: 'destructive' });
    },
    onSuccess: () => toast({ title: 'Verification updated' }),
    onSettled: () => qc.invalidateQueries({ queryKey: ['owner-emps'] }),
  });

  const { mutate: moderate } = useMutation({
    mutationFn: ({ userId, action }: { userId: string; action: string }) =>
      api.post('/owner/moderate', { userId, action }),
    onMutate: async ({ userId, action }) => {
      await qc.cancelQueries({ queryKey: ['owner-emps'] });
      const snap = qc.getQueriesData<{ employers: Employer[]; total: number }>({ queryKey: ['owner-emps'] });
      if (action === 'kick') {
        qc.setQueriesData<{ employers: Employer[]; total: number }>({ queryKey: ['owner-emps'] }, old =>
          old ? { ...old, employers: old.employers.filter(e => e.userId !== userId), total: old.total - 1 } : old
        );
      } else {
        const newStatus = STATUS_MAP[action] ?? 'ACTIVE';
        qc.setQueriesData<{ employers: Employer[]; total: number }>({ queryKey: ['owner-emps'] }, old =>
          old ? { ...old, employers: old.employers.map(e => e.userId === userId ? { ...e, user: { ...e.user, status: newStatus as any } } : e) } : old
        );
      }
      return { snap };
    },
    onError: (_e, _v, ctx) => {
      ctx?.snap.forEach(([k, v]) => qc.setQueryData(k, v));
      toast({ title: 'Action failed', variant: 'destructive' });
    },
    onSuccess: (_d, vars) => toast({ title: `Employer ${vars.action}d` }),
    onSettled: () => qc.invalidateQueries({ queryKey: ['owner-emps'] }),
  });

  return (
    <div>
      <FilterBar
        icon={Building2}
        title="Employers"
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

      {!isLoading && !data?.employers.length ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-2">
          <Building2 className="h-10 w-10 text-gray-200" />
          <p className="text-sm">No employers found</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Company', 'Contact', 'Location', 'Status', 'Verified', 'Profile', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading
                  ? Array.from({ length: 8 }).map((_, i) => <EmployerTableSkeleton key={i} />)
                  : data!.employers.map(emp => (
                      <EmployerRow
                        key={emp.id}
                        emp={emp}
                        onVerify={(id, approved) => verify({ id, approved })}
                        onModerate={(userId, action) => moderate({ userId, action })}
                      />
                    ))
                }
              </tbody>
            </table>
          </div>
          {!isLoading && <Pagination page={page} total={data!.total} limit={12} onChange={setPage} />}
        </>
      )}
    </div>
  );
}
