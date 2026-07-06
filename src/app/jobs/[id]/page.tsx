'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Navbar } from '@/components/shared/Navbar';
import { Button } from '@/components/ui/button';
import { JobApplyModal } from '@/components/jobs/JobApplyModal';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import { formatSalary, timeAgo } from '@/lib/utils';
import { Job, Developer } from '@/types';
import {
  MapPin, Globe, Users, Loader2, AlertCircle,
  DollarSign, Briefcase, ExternalLink, CheckCircle2,
  Building2, Clock, ShieldAlert,
} from 'lucide-react';



export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const id = String(params?.id ?? '');
  const { user } = useAuthStore();
  const [showApply, setShowApply]   = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  const { data: myApplications } = useQuery({
    queryKey: ['my-applications'],
    queryFn: async () => {
      const res = await api.post('/applications/mine', {});
      return res.json() as Promise<{ jobId: string }[]>;
    },
    enabled: user?.role === 'DEVELOPER',
  });

  const { data: devProfile } = useQuery({
    queryKey: ['developer-me'],
    queryFn: async () => {
      const res = await api.post('/developers/me', {});
      return res.json() as Promise<Developer>;
    },
    enabled: user?.role === 'DEVELOPER',
  });

  const alreadyApplied  = hasApplied || !!myApplications?.some(a => a.jobId === id);
  const isVerifiedDev   = !!devProfile?.isVerified;

  const { data: job, isLoading, isError } = useQuery({
    queryKey: ['job', id],
    queryFn: async () => {
      const res = await api.post(`/jobs/${id}`, {});
      if (!res.ok) throw new Error('Not found');
      return res.json() as Promise<Job>;
    },
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex justify-center pt-40">
          <Loader2 className="h-7 w-7 animate-spin text-gray-300" />
        </div>
      </div>
    );
  }

  if (isError || !job) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex flex-col items-center justify-center pt-40 gap-3">
          <AlertCircle className="h-10 w-10 text-gray-200" />
          <p className="text-gray-400">Job not found.</p>
          <Link href="/jobs" className="text-sm text-felovy-red hover:underline">← Back to jobs</Link>
        </div>
      </div>
    );
  }

  const logoLetter  = (job.employer?.companyName || job.title)[0]?.toUpperCase() ?? '?';
  const logoUrl     = job.employer?.companyLogoUrl;
  const salary      = (job.salaryMin || job.salaryMax)
    ? formatSalary(job.salaryMin, job.salaryMax, job.currency, job.salaryType)
    : null;
  const appCount    = job._count?.applications ?? 0;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="container mx-auto max-w-5xl px-6 pb-16">

        {/* ── Company identity card ────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-100 mb-3 overflow-hidden">

          {/* Banner, contained within the card */}
          <div className="h-40 w-full bg-gradient-to-r from-slate-300 to-slate-200">
            {job.employer?.companyBrandUrl && (
              <img src={job.employer.companyBrandUrl} alt="" className="w-full h-full object-cover" />
            )}
          </div>

          <div className="px-6 pb-5">
            {/* Logo + company name in the same row */}
            <div className="flex items-end gap-4 -mt-10 mb-4">
              <div className="shrink-0 h-20 w-20 rounded-xl border-4 border-white bg-white shadow-md overflow-hidden flex items-center justify-center">
                {logoUrl ? (
                  <img src={logoUrl} alt={job.employer?.companyName ?? ''} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-felovy-red to-pink-500 flex items-center justify-center">
                    <span className="text-white font-black text-3xl select-none">{logoLetter}</span>
                  </div>
                )}
              </div>
              <div className="pb-1">
                <p className="text-sm font-semibold text-felovy-red leading-tight">{job.employer?.companyName}</p>
              </div>
            </div>

            {/* Job title + Apply */}
            <div className="flex items-start justify-between gap-4 mb-3">
              <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
              <div className="shrink-0">
                {user?.role === 'DEVELOPER' ? (
                  alreadyApplied ? (
                    <Button disabled className="font-semibold rounded-full bg-emerald-500 text-white opacity-100 cursor-default gap-2">
                      <CheckCircle2 className="h-4 w-4" /> Applied
                    </Button>
                  ) : isVerifiedDev ? (
                    <Button variant="gradient" className="font-semibold rounded-full" onClick={() => setShowApply(true)}>
                      Apply Now
                    </Button>
                  ) : (
                    <Link href="/dashboard/developer/profile">
                      <Button variant="outline" className="font-semibold rounded-full gap-2 text-amber-600 border-amber-300 hover:bg-amber-50">
                        <ShieldAlert className="h-4 w-4" /> Verify Profile to Apply
                      </Button>
                    </Link>
                  )
                ) : !user ? (
                  <Link href={`/signin?role=developer&redirect=/jobs/${id}`}>
                    <Button variant="gradient" className="font-semibold rounded-full">Sign in to Apply</Button>
                  </Link>
                ) : null}
              </div>
            </div>

            {/* Chips left · meta right */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-600">
                  {job.locationType}
                </span>
                {job.industry && (
                  <span className="text-xs font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-600">
                    {job.industry}
                  </span>
                )}
                {salary && (
                  <span className="text-xs font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-600 flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />{salary}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                {job.companyLocation && (
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.companyLocation}</span>
                )}
                {(job.publishedAt || job.createdAt) && (
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{timeAgo(job.publishedAt || job.createdAt)}</span>
                )}
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />{appCount} applicant{appCount !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Two-column body ──────────────────────────────────────── */}
        <div className="flex gap-3 items-start">

          {/* ── Main column ─────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-3">

            {/* Description */}
            {job.description && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Job Description</h2>
                <div className="text-[15px] text-gray-700 leading-[1.9] whitespace-pre-line">
                  {job.description}
                </div>
              </div>
            )}

            {/* Skills & Languages */}
            {(job.requiredSkills?.length > 0 || job.niceToHaveSkills?.length > 0 || job.languages?.length > 0) && (
              <div className="bg-white rounded-xl p-6 shadow-sm space-y-6">
                {job.requiredSkills?.length > 0 && (
                  <section>
                    <h2 className="text-base font-semibold text-gray-900 mb-3">Required Skills</h2>
                    <div className="flex flex-wrap gap-2">
                      {job.requiredSkills.map(s => (
                        <span key={s} className="px-4 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                          {s}
                        </span>
                      ))}
                    </div>
                  </section>
                )}
                {job.niceToHaveSkills?.length > 0 && (
                  <section>
                    <h2 className="text-base font-semibold text-gray-900 mb-3">Nice to Have</h2>
                    <div className="flex flex-wrap gap-2">
                      {job.niceToHaveSkills.map(s => (
                        <span key={s} className="px-4 py-1.5 rounded-full text-sm font-medium border border-gray-200 text-gray-600">
                          {s}
                        </span>
                      ))}
                    </div>
                  </section>
                )}
                {job.languages?.length > 0 && (
                  <section>
                    <h2 className="text-base font-semibold text-gray-900 mb-3">Languages</h2>
                    <div className="flex flex-wrap gap-2">
                      {job.languages.map(l => (
                        <span key={l} className="px-4 py-1.5 rounded-full text-sm font-medium border border-gray-200 text-gray-600">
                          {l}
                        </span>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>

          {/* ── Sidebar ──────────────────────────────────────────── */}
          <div className="w-64 shrink-0 sticky top-6 space-y-3">

            {/* Overview */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Overview</p>
              <div className="space-y-4">
                {salary && (
                  <div className="flex gap-3">
                    <DollarSign className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] text-gray-400">Salary</p>
                      <p className="text-sm font-semibold text-gray-800 mt-0.5">{salary}</p>
                    </div>
                  </div>
                )}
                <div className="flex gap-3">
                  <Globe className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] text-gray-400">Work type</p>
                    <p className="text-sm font-medium text-gray-700 mt-0.5">{job.locationType}</p>
                  </div>
                </div>
                {job.companyLocation && (
                  <div className="flex gap-3">
                    <MapPin className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] text-gray-400">Location</p>
                      <p className="text-sm font-medium text-gray-700 mt-0.5">{job.companyLocation}</p>
                    </div>
                  </div>
                )}
                {job.industry && (
                  <div className="flex gap-3">
                    <Briefcase className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] text-gray-400">Industry</p>
                      <p className="text-sm font-medium text-gray-700 mt-0.5">{job.industry}</p>
                    </div>
                  </div>
                )}
                <div className="flex gap-3">
                  <Users className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] text-gray-400">Applicants</p>
                    <p className="text-sm font-semibold text-gray-800 mt-0.5">{appCount}</p>
                  </div>
                </div>
                {job.publishedAt && (
                  <div className="flex gap-3">
                    <Clock className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] text-gray-400">Posted</p>
                      <p className="text-sm font-medium text-gray-700 mt-0.5">{timeAgo(job.publishedAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Company */}
            {job.employer && (
              <div className="bg-white rounded-xl p-5 shadow-sm">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Company</p>
                <div className="flex items-center gap-3 mb-3">
                  <div className="shrink-0 h-9 w-9 rounded-lg overflow-hidden ring-1 ring-black/8 flex items-center justify-center bg-gradient-to-br from-felovy-red to-pink-500">
                    {logoUrl ? (
                      <img src={logoUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-white font-bold text-sm select-none">{logoLetter}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 leading-tight">{job.employer.companyName}</p>
                    {job.employer.companySize && (
                      <p className="text-xs text-gray-400">{job.employer.companySize} employees</p>
                    )}
                  </div>
                </div>
                {job.employer.companySummary && (
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-5 mb-3">{job.employer.companySummary}</p>
                )}
                <div className="space-y-2">
                  {job.employer.companyWebsite && (
                    <a href={job.employer.companyWebsite} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-800">
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{job.employer.companyWebsite.replace(/^https?:\/\//, '')}</span>
                    </a>
                  )}
                  {job.employer.companyLinkedin && (
                    <a href={job.employer.companyLinkedin} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-700">
                      <Building2 className="h-3.5 w-3.5 shrink-0" />LinkedIn
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showApply && (
        <JobApplyModal
          jobId={id}
          onClose={() => setShowApply(false)}
          onApplied={() => { setHasApplied(true); setShowApply(false); }}
        />
      )}
    </div>
  );
}
