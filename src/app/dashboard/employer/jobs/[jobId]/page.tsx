'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Navbar } from '@/components/shared/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { Application, ApplicationStatus, Job } from '@/types';
import { toast } from '@/components/ui/toaster';
import { cn, timeAgo, formatSalary } from '@/lib/utils';
import {
  ArrowLeft, Users, MapPin, Briefcase, CheckCircle2,
  ChevronDown, ChevronUp, Loader2, MessageSquare, ExternalLink,
  FileText, Inbox,
} from 'lucide-react';

// ─── Status config ────────────────────────────────────────────────────────────

type StatusCfg = { label: string; pill: string };

const STATUS_CFG: Record<ApplicationStatus, StatusCfg> = {
  PENDING:     { label: 'Pending',     pill: 'bg-gray-100 text-gray-600 border-gray-200' },
  REVIEWING:   { label: 'Reviewing',   pill: 'bg-blue-50 text-blue-600 border-blue-200' },
  SHORTLISTED: { label: 'Shortlisted', pill: 'bg-purple-50 text-purple-600 border-purple-200' },
  ACCEPTED:    { label: 'Accepted',    pill: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  REJECTED:    { label: 'Rejected',    pill: 'bg-red-50 text-red-600 border-red-200' },
};

const NEXT_STATUSES: Record<ApplicationStatus, ApplicationStatus[]> = {
  PENDING:     ['REVIEWING', 'SHORTLISTED', 'REJECTED'],
  REVIEWING:   ['SHORTLISTED', 'ACCEPTED', 'REJECTED'],
  SHORTLISTED: ['ACCEPTED', 'REJECTED'],
  ACCEPTED:    [],
  REJECTED:    ['REVIEWING'],
};

const JOB_STATUS_VARIANT: Record<string, string> = {
  PENDING:  'warning',
  APPROVED: 'success',
  REJECTED: 'destructive',
  DISABLED: 'secondary',
};

const FILTER_TABS: { label: string; value: ApplicationStatus | 'ALL' }[] = [
  { label: 'All',         value: 'ALL' },
  { label: 'Pending',     value: 'PENDING' },
  { label: 'Reviewing',   value: 'REVIEWING' },
  { label: 'Shortlisted', value: 'SHORTLISTED' },
  { label: 'Accepted',    value: 'ACCEPTED' },
  { label: 'Rejected',    value: 'REJECTED' },
];

// ─── Applicant card ───────────────────────────────────────────────────────────

function ApplicantCard({
  application,
  onStatusChange,
  isPending,
}: {
  application: Application;
  onStatusChange: (id: string, status: ApplicationStatus) => void;
  isPending: boolean;
}) {
  const [coverOpen, setCoverOpen] = useState(true);

  const snap     = application.appliedData;        // profile snapshot at apply time
  const dev      = application.developer;           // current developer reference
  const status   = application.status;
  const cfg      = STATUS_CFG[status];
  const nexts    = NEXT_STATUSES[status];

  const name     = snap.fullName  || dev?.fullName  || 'Unknown';
  const title    = snap.title     || dev?.title     || '';
  const location = snap.location  || dev?.location  || '';
  const skills   = (snap.skills   as string[] | undefined) ?? dev?.skills ?? [];
  const photoUrl = snap.photoUrl  || dev?.photoUrl;
  const verified = dev?.isVerified ?? false;
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const cardBorder =
    status === 'ACCEPTED'    ? 'border-emerald-200 bg-emerald-50/20' :
    status === 'REJECTED'    ? 'border-gray-100 opacity-60'          :
    status === 'SHORTLISTED' ? 'border-purple-200 bg-purple-50/10'   :
    'border-gray-200 bg-white';

  return (
    <div className={cn('rounded-xl border p-5 transition-all', cardBorder)}>
      <div className="flex items-start gap-4">

        {/* Avatar */}
        <div className="shrink-0 h-12 w-12 rounded-full overflow-hidden ring-2 ring-white shadow-sm flex items-center justify-center bg-gradient-to-br from-gray-500 to-gray-800 select-none">
          {photoUrl ? (
            <img src={photoUrl} alt={name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-white text-sm font-semibold">{initials}</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-semibold text-gray-900 truncate">{name}</span>
              {verified && (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" aria-label="Verified" />
              )}
            </div>
            <span className={cn(
              'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border shrink-0',
              cfg.pill
            )}>
              {cfg.label}
            </span>
          </div>

          {title && <p className="text-sm text-gray-500 mt-0.5">{title}</p>}

          <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-gray-400">
            {location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {location}
              </span>
            )}
            <span>Applied {timeAgo(application.createdAt)}</span>
          </div>

          {/* Skills */}
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {skills.slice(0, 6).map((s, i) => (
                <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                  {s}
                </span>
              ))}
              {skills.length > 6 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">
                  +{skills.length - 6}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cover letter */}
      {application.coverLetter && (
        <div className="mt-4">
          <button
            onClick={() => setCoverOpen(v => !v)}
            className="flex items-center gap-1.5 text-[12px] text-gray-500 hover:text-gray-800 font-medium transition-colors"
          >
            <FileText className="h-3.5 w-3.5" />
            Cover Letter
            {coverOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          {coverOpen && (
            <p className="mt-2 text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-lg p-4 border border-gray-100 whitespace-pre-wrap">
              {application.coverLetter}
            </p>
          )}
        </div>
      )}

      {/* Actions row */}
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100 flex-wrap">

        {/* Status transition */}
        {nexts.length > 0 && (
          <select
            disabled={isPending}
            defaultValue=""
            onChange={e => {
              if (e.target.value) {
                onStatusChange(application.id, e.target.value as ApplicationStatus);
                e.target.value = '';
              }
            }}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 bg-white cursor-pointer hover:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 disabled:opacity-50"
          >
            <option value="" disabled>Move to…</option>
            {nexts.map(s => (
              <option key={s} value={s}>{STATUS_CFG[s].label}</option>
            ))}
          </select>
        )}

        <div className="ml-auto flex items-center gap-2">
          {/* Message */}
          <Link
            href={
              application.conversation
                ? `/dashboard/employer/messages?conversationId=${application.conversation.id}`
                : `/dashboard/employer/messages`
            }
          >
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
              <MessageSquare className="h-3.5 w-3.5" /> Message
            </Button>
          </Link>

          {/* View public profile */}
          {dev?.id && (
            <Link href={`/developers/${dev.id}`} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="gap-1.5 text-xs h-8 bg-gray-900 hover:bg-gray-700 text-white">
                <ExternalLink className="h-3.5 w-3.5" /> View Profile
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function JobApplicationsPage() {
  const params  = useParams();
  const jobId   = params.jobId as string;
  const qc      = useQueryClient();
  const [activeTab, setActiveTab] = useState<ApplicationStatus | 'ALL'>('ALL');

  const { data: job } = useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      const res = await api.post(`/jobs/${jobId}`, {});
      return res.json() as Promise<Job>;
    },
  });

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['job-applications', jobId],
    queryFn: async () => {
      const res = await api.post(`/applications/jobs/${jobId}`, {});
      return res.json() as Promise<Application[]>;
    },
  });

  const { mutate: updateStatus, isPending } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApplicationStatus }) =>
      api.patch(`/applications/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['job-applications', jobId] });
      toast({ title: 'Application status updated' });
    },
    onError: () => {
      toast({ title: 'Failed to update status', variant: 'destructive' });
    },
  });

  const countFor = (s: ApplicationStatus) => applications.filter(a => a.status === s).length;
  const filtered = activeTab === 'ALL'
    ? applications
    : applications.filter(a => a.status === activeTab);

  const salary = job && (job.salaryMin || job.salaryMax)
    ? formatSalary(job.salaryMin, job.salaryMax, job.currency, job.salaryType)
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto max-w-4xl px-4 py-8">

        {/* Back */}
        <Link
          href="/dashboard/employer"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        {/* Job header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{job?.title ?? '-'}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
                {job?.locationType && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5" /> {job.locationType}
                  </span>
                )}
                {salary && <span>{salary}</span>}
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" /> {applications.length} applicant{applications.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            {job?.status && (
              <Badge variant={(JOB_STATUS_VARIANT[job.status] ?? 'secondary') as any} className="shrink-0">
                {job.status}
              </Badge>
            )}
          </div>
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-1 bg-white rounded-xl p-1 border border-gray-200 mb-5 overflow-x-auto">
          {FILTER_TABS.map(tab => {
            const count = tab.value === 'ALL' ? applications.length : countFor(tab.value);
            const active = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
                  active ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                )}
              >
                {tab.label}
                {count > 0 && (
                  <span className={cn(
                    'text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none',
                    active ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Applications */}
        {isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 mb-4">
              <Inbox className="h-7 w-7 text-gray-400" />
            </div>
            <p className="text-base font-semibold text-gray-600">
              {activeTab === 'ALL' ? 'No applications yet' : `No ${STATUS_CFG[activeTab as ApplicationStatus].label.toLowerCase()} applications`}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {activeTab === 'ALL' ? 'Applications from developers will appear here' : 'Try a different filter'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(app => (
              <ApplicantCard
                key={app.id}
                application={app}
                onStatusChange={(id, status) => updateStatus({ id, status })}
                isPending={isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
