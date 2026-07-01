'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loading } from '@/components/shared/Loading';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toaster';
import { api } from '@/lib/api';
import { Job } from '@/types';
import {
  MapPin, Briefcase, DollarSign, Pin, ToggleLeft, ToggleRight,
  Check, X, Globe, Users, Calendar, Languages,
} from 'lucide-react';
import { StatusBadge } from '../../_shared';

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const qc = useQueryClient();

  const { data: job, isLoading, isError } = useQuery({
    queryKey: ['owner-job-detail', id],
    queryFn: async () => {
      const r = await api.post(`/jobs/${id}`, {});
      return r.json() as Promise<Job>;
    },
  });

  const { mutate: updateJob } = useMutation({
    mutationFn: (body: { status?: string; isPinned?: boolean; isEnabled?: boolean }) =>
      api.patch(`/owner/jobs/${id}/review`, body),
    onMutate: async (changes) => {
      await qc.cancelQueries({ queryKey: ['owner-job-detail', id] });
      const snap = qc.getQueryData<Job>(['owner-job-detail', id]);
      qc.setQueryData<Job>(['owner-job-detail', id], old =>
        old ? { ...old, ...changes, status: (changes.status ?? old.status) as any } : old
      );
      return { snap };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.snap) qc.setQueryData(['owner-job-detail', id], ctx.snap);
      toast({ title: 'Failed', variant: 'destructive' });
    },
    onSuccess: () => toast({ title: 'Job updated' }),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['owner-job-detail', id] });
      qc.invalidateQueries({ queryKey: ['owner-jobs'] });
    },
  });

  if (isLoading) return <Loading size="md" text="Loading job…" />;
  if (isError || !job) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400">
        <p className="text-sm">Job not found.</p>
      </div>
    );
  }

  const salary = job.salaryMin && job.salaryMax
    ? `${job.currency ?? ''}${job.salaryMin.toLocaleString()} – ${job.salaryMax.toLocaleString()} / ${job.salaryType ?? ''}`
    : null;

  const appCount = (job._count as any)?.applications ?? 0;

  return (
    <div className="max-w-5xl flex gap-5 items-start">

      {/* ── Main content ──────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-4">

        {/* Header card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-felovy-red via-rose-400 to-pink-400" />
          <div className="p-6">
            <div className="flex items-start gap-4">
              {/* Logo */}
              <div className="shrink-0 h-14 w-14 rounded-xl overflow-hidden ring-1 ring-gray-200 shadow-sm flex items-center justify-center bg-gradient-to-br from-felovy-red to-pink-500">
                {job.employer?.companyLogoUrl ? (
                  <img src={job.employer.companyLogoUrl} alt={job.employer.companyName ?? ''} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-white font-bold text-xl select-none">
                    {(job.employer?.companyName?.[0] ?? '?').toUpperCase()}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <StatusBadge status={job.status} />
                  {job.isPinned && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-felovy-red bg-felovy-light px-2 py-0.5 rounded-full ring-1 ring-red-100">
                      <Pin className="h-3 w-3" /> Pinned
                    </span>
                  )}
                  {!job.isEnabled && (
                    <span className="text-[11px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Disabled</span>
                  )}
                </div>
                <h1 className="text-xl font-bold text-gray-900 leading-snug">{job.title}</h1>
                {job.employer?.companyName && (
                  <p className="text-sm text-gray-500 mt-0.5">{job.employer.companyName}</p>
                )}
              </div>
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-5 pt-4 border-t border-gray-100 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-gray-400" /> {job.locationType}
              </span>
              {job.companyLocation && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-gray-400" /> {job.companyLocation}
                </span>
              )}
              {salary && (
                <span className="flex items-center gap-1.5 font-semibold text-gray-700">
                  <DollarSign className="h-3.5 w-3.5 text-felovy-red" /> {salary}
                </span>
              )}
              {job.industry && (
                <span className="flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-gray-400" /> {job.industry}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {job.description && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-xs font-bold text-felovy-red uppercase tracking-widest mb-3">Description</h2>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{job.description}</p>
          </div>
        )}

        {/* Skills & Languages */}
        {(job.requiredSkills.length > 0 || job.niceToHaveSkills.length > 0 || job.languages.length > 0) && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">

            {job.requiredSkills.length > 0 && (
              <div>
                <h2 className="text-xs font-bold text-felovy-red uppercase tracking-widest mb-3">Required Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {job.requiredSkills.map(s => (
                    <span key={s} className="px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-felovy-red to-pink-500 text-white shadow-sm">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {job.niceToHaveSkills.length > 0 && (
              <div>
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Nice to Have</h2>
                <div className="flex flex-wrap gap-2">
                  {job.niceToHaveSkills.map(s => (
                    <span key={s} className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 ring-1 ring-gray-200">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {job.languages.length > 0 && (
              <div>
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Languages className="h-3.5 w-3.5" /> Languages
                </h2>
                <div className="flex flex-wrap gap-2">
                  {job.languages.map(l => (
                    <span key={l} className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 ring-1 ring-gray-200">
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Sidebar ───────────────────────────────────────────────── */}
      <div className="w-56 shrink-0 sticky top-6 space-y-3">

        {/* Actions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2">
          <p className="text-[11px] font-bold text-felovy-red uppercase tracking-widest mb-3">Actions</p>

          {job.status === 'PENDING' && (
            <>
              <Button size="sm" className="w-full gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white border-0"
                onClick={() => updateJob({ status: 'APPROVED' })}>
                <Check className="h-3.5 w-3.5" /> Approve
              </Button>
              <Button size="sm" variant="outline" className="w-full gap-1.5 border-gray-200 text-gray-500 hover:bg-gray-50"
                onClick={() => updateJob({ status: 'REJECTED' })}>
                <X className="h-3.5 w-3.5" /> Reject
              </Button>
            </>
          )}
          {job.status === 'APPROVED' && (
            <Button size="sm" variant="outline" className="w-full gap-1.5 border-gray-200 text-gray-500 hover:bg-gray-50"
              onClick={() => updateJob({ status: 'REJECTED' })}>
              <X className="h-3.5 w-3.5" /> Reject
            </Button>
          )}
          {job.status === 'REJECTED' && (
            <Button size="sm" className="w-full gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white border-0"
              onClick={() => updateJob({ status: 'APPROVED' })}>
              <Check className="h-3.5 w-3.5" /> Re-approve
            </Button>
          )}

          <Button
            size="sm" variant="outline"
            className={`w-full gap-1.5 ${job.isPinned ? 'border-felovy-red text-felovy-red bg-felovy-light' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
            onClick={() => updateJob({ isPinned: !job.isPinned })}
          >
            <Pin className="h-3.5 w-3.5" />
            {job.isPinned ? 'Unpin' : 'Pin to top'}
          </Button>

          <Button
            size="sm" variant="outline" className="w-full gap-1.5 border-gray-200 text-gray-500 hover:bg-gray-50"
            onClick={() => updateJob({ isEnabled: !job.isEnabled })}
          >
            {job.isEnabled
              ? <><ToggleRight className="h-3.5 w-3.5 text-emerald-500" /> Disable</>
              : <><ToggleLeft className="h-3.5 w-3.5 text-gray-400" /> Enable</>}
          </Button>
        </div>

        {/* Info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Info</p>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-gray-500 text-xs">
                <Users className="h-3.5 w-3.5 text-gray-400" /> Applications
              </span>
              <span className={`font-bold text-sm ${appCount > 0 ? 'text-felovy-red' : 'text-gray-300'}`}>
                {appCount}
              </span>
            </div>
            {job.createdAt && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-gray-500 text-xs">
                  <Calendar className="h-3.5 w-3.5 text-gray-400" /> Posted
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(job.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
