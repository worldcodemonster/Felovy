'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toaster';
import { api } from '@/lib/api';
import { Job } from '@/types';
import { Briefcase, Search, Pin, ToggleLeft, ToggleRight, ArrowUpRight, Check, X } from 'lucide-react';
import { StatusBadge, Pagination } from '../_shared';

const COLS = ['Job Title', 'Company', 'Type', 'Status', 'Apps', 'Posted', 'Actions'];

function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b border-gray-50 last:border-0">
      {COLS.map(c => (
        <td key={c} className="px-4 py-3">
          <div className="h-3 bg-gray-100 rounded-full w-3/4" />
        </td>
      ))}
    </tr>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function JobsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['owner-jobs', page, search, statusFilter],
    queryFn: async () => {
      const body: Record<string, unknown> = { page: String(page), limit: '20' };
      if (search)       body.search = search;
      if (statusFilter) body.status = statusFilter;
      const r = await api.post('/owner/jobs', body);
      return r.json() as Promise<{ jobs: Job[]; total: number }>;
    },
  });

  const { mutate: updateJob } = useMutation({
    mutationFn: ({ id, ...body }: { id: string; status?: string; isPinned?: boolean; isEnabled?: boolean }) =>
      api.patch(`/owner/jobs/${id}/review`, body),
    onMutate: async ({ id, status, isPinned, isEnabled }) => {
      await qc.cancelQueries({ queryKey: ['owner-jobs'] });
      const snap = qc.getQueriesData<{ jobs: Job[]; total: number }>({ queryKey: ['owner-jobs'] });
      qc.setQueriesData<{ jobs: Job[]; total: number }>({ queryKey: ['owner-jobs'] }, old =>
        old ? {
          ...old,
          jobs: old.jobs.map(j => j.id === id ? {
            ...j,
            ...(status   !== undefined && { status: status as any }),
            ...(isPinned !== undefined && { isPinned }),
            ...(isEnabled !== undefined && { isEnabled }),
          } : j),
        } : old
      );
      return { snap };
    },
    onError: (_e, _v, ctx) => {
      ctx?.snap.forEach(([k, v]) => qc.setQueryData(k, v));
      toast({ title: 'Failed', variant: 'destructive' });
    },
    onSuccess: () => toast({ title: 'Job updated' }),
    onSettled: () => qc.invalidateQueries({ queryKey: ['owner-jobs'] }),
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_16px_rgba(0,0,0,0.06)] overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2 font-semibold text-gray-800 text-sm">
          <Briefcase className="h-4 w-4 text-felovy-red" /> All Jobs
        </div>
        <div className="flex-1 flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search title…"
              className="pl-8 h-8 text-sm w-48"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="h-8 rounded-lg border border-gray-200 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-felovy-red bg-white"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="DISABLED">Disabled</option>
          </select>
        </div>
        {data?.total !== undefined && (
          <span className="text-xs text-gray-400 ml-auto">{data.total} job{data.total !== 1 ? 's' : ''}</span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              {COLS.map(col => (
                <th key={col} className="px-4 py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
            ) : !data?.jobs.length ? (
              <tr>
                <td colSpan={COLS.length} className="px-4 py-12 text-center text-gray-400 text-sm">
                  No jobs found
                </td>
              </tr>
            ) : data.jobs.map(job => {
              const apps = (job._count as any)?.applications ?? 0;
              return (
                <tr
                  key={job.id}
                  className="hover:bg-gray-50/70 transition-colors cursor-pointer group"
                  onClick={() => window.location.href = `/dashboard/owner/jobs/${job.id}`}
                >
                  {/* Title */}
                  <td className="px-4 py-3 max-w-[220px]">
                    <div className="flex items-start gap-1.5">
                      {job.isPinned && <Pin className="h-3 w-3 text-felovy-red shrink-0 mt-0.5" />}
                      <div className="min-w-0">
                        <Link
                          href={`/dashboard/owner/jobs/${job.id}`}
                          className="font-medium text-gray-800 hover:text-felovy-red transition-colors line-clamp-1 flex items-center gap-1"
                          onClick={e => e.stopPropagation()}
                        >
                          {job.title}
                          <ArrowUpRight className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                        {!job.isEnabled && (
                          <span className="text-[10px] text-gray-400">Disabled</span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Company */}
                  <td className="px-4 py-3 max-w-[180px]">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="shrink-0 h-7 w-7 rounded-lg overflow-hidden ring-1 ring-black/5 flex items-center justify-center bg-gradient-to-br from-purple-500 via-fuchsia-500 to-pink-500">
                        {job.employer?.companyLogoUrl ? (
                          <img src={job.employer.companyLogoUrl} alt={job.employer.companyName ?? ''} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-white font-black text-[10px] select-none">
                            {(job.employer?.companyName?.[0] ?? '?').toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-600 line-clamp-1 font-medium">
                        {job.employer?.companyName ?? '-'}
                      </span>
                    </div>
                  </td>

                  {/* Type */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-xs text-gray-500">{job.locationType ?? '-'}</span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <StatusBadge status={job.status} />
                  </td>

                  {/* Apps */}
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold ${apps > 0 ? 'text-felovy-red' : 'text-gray-300'}`}>
                      {apps}
                    </span>
                  </td>

                  {/* Posted */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-xs text-gray-400">
                      {job.createdAt ? formatDate(job.createdAt as unknown as string) : '-'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      {job.status === 'PENDING' && (
                        <>
                          <button
                            title="Approve"
                            onClick={() => updateJob({ id: job.id, status: 'APPROVED' })}
                            className="h-7 w-7 flex items-center justify-center rounded-lg border border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-colors"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            title="Reject"
                            onClick={() => updateJob({ id: job.id, status: 'REJECTED' })}
                            className="h-7 w-7 flex items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                      {job.status === 'APPROVED' && (
                        <button
                          title="Reject"
                          onClick={() => updateJob({ id: job.id, status: 'REJECTED' })}
                          className="h-7 w-7 flex items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {job.status === 'REJECTED' && (
                        <button
                          title="Re-approve"
                          onClick={() => updateJob({ id: job.id, status: 'APPROVED' })}
                          className="h-7 w-7 flex items-center justify-center rounded-lg border border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-colors"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        title={job.isPinned ? 'Unpin' : 'Pin to top'}
                        onClick={() => updateJob({ id: job.id, isPinned: !job.isPinned })}
                        className={`h-7 w-7 flex items-center justify-center rounded-lg border transition-colors ${
                          job.isPinned
                            ? 'border-felovy-red text-felovy-red bg-felovy-light'
                            : 'border-gray-200 text-gray-400 hover:bg-gray-50'
                        }`}
                      >
                        <Pin className="h-3.5 w-3.5" />
                      </button>
                      <button
                        title={job.isEnabled ? 'Disable' : 'Enable'}
                        onClick={() => updateJob({ id: job.id, isEnabled: !job.isEnabled })}
                        className="h-7 w-7 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                      >
                        {job.isEnabled
                          ? <ToggleRight className="h-3.5 w-3.5 text-emerald-500" />
                          : <ToggleLeft className="h-3.5 w-3.5 text-gray-400" />}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {(data?.total ?? 0) > 20 && (
        <div className="px-5 py-3 border-t border-gray-100">
          <Pagination page={page} total={data?.total ?? 0} limit={20} onChange={setPage} />
        </div>
      )}
    </div>
  );
}
