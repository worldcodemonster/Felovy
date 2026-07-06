'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Job } from '@/types';
import { api } from '@/lib/api';
import { formatSalary, timeAgo, cn } from '@/lib/utils';
import { toast } from '@/components/ui/toaster';
import { Users, CheckCircle2 } from 'lucide-react';
import { FavoriteButton } from './FavoriteButton';

const SKILL_COLORS = [
  'bg-violet-50 text-violet-600',
  'bg-sky-50 text-sky-600',
  'bg-amber-50 text-amber-700',
  'bg-emerald-50 text-emerald-600',
  'bg-rose-50 text-rose-600',
  'bg-indigo-50 text-indigo-600',
];

const locationStyle: Record<string, string> = {
  REMOTE: 'text-emerald-600',
  HYBRID: 'text-amber-600',
  ONSITE: 'text-sky-600',
};

function PinnedBorder({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative p-[1.5px] rounded-xl overflow-hidden h-full">
      <div
        className="absolute animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_0deg_at_50%_50%,#fb7185_0%,#a855f7_35%,#818cf8_65%,#fb7185_100%)]"
        style={{ inset: '-100%' }}
      />
      <div className="relative h-full">{children}</div>
    </div>
  );
}

interface Props {
  job: Job;
  userId?: string;
  applied?: boolean;
}

export function JobCard({ job, userId, applied }: Props) {
  const queryClient = useQueryClient();
  const [optimisticFav, setOptimisticFav] = useState<boolean | null>(null);
  const isFavorited = optimisticFav !== null ? optimisticFav : !!job.favorites?.length;

  const { mutate: toggleFav } = useMutation({
    mutationFn: () => api.post(`/jobs/${job.id}/favorite`, {}),
    onMutate: () => setOptimisticFav(!isFavorited),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: () => {
      setOptimisticFav(null);
      toast({ title: 'Failed to update saved jobs', variant: 'destructive' });
    },
  });

  const logoLetter = (job.employer?.companyName || job.title)[0]?.toUpperCase() ?? '?';
  const logoUrl    = job.employer?.companyLogoUrl;
  const salary     = (job.salaryMin || job.salaryMax)
    ? formatSalary(job.salaryMin, job.salaryMax, job.currency, job.salaryType)
    : null;
  const appCount   = job._count?.applications ?? 0;

  const card = (
    <div className={cn(
      'group flex flex-col bg-white p-5 h-full cursor-pointer',
      job.isPinned
        ? 'rounded-[10px]'
        : 'rounded-xl border border-gray-200 hover:border-gray-400 hover:shadow-[0_0_0_1px_#9ca3af]'
    )}>

      {/* Top: title + location */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-gray-900 text-[15px] leading-snug line-clamp-2 flex-1">
          {job.title}
        </h3>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={cn(
            'text-[11px]',
            job.isPinned ? 'text-felovy-rose font-medium' : (locationStyle[job.locationType] ?? 'text-gray-400')
          )}>
            {job.isPinned ? '✦ Featured' : job.locationType}
          </span>
          {applied && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
              <CheckCircle2 className="h-2.5 w-2.5" /> Applied
            </span>
          )}
        </div>
      </div>

      {/* Salary */}
      <p className="text-sm text-gray-600 mb-auto">
        {salary ?? <span className="text-gray-300">Salary not listed</span>}
      </p>

      {/* Skills */}
      {job.requiredSkills?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {job.requiredSkills.slice(0, 2).map((s, i) => (
            <span key={s} className={cn('text-[11px] px-2 py-0.5 rounded-full font-medium', SKILL_COLORS[i % SKILL_COLORS.length])}>
              {s}
            </span>
          ))}
          {job.requiredSkills.length > 2 && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">
              +{job.requiredSkills.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-end justify-between mt-4 pt-3 border-t border-gray-100">
        {/* Company + meta */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="shrink-0 h-7 w-7 rounded-lg overflow-hidden ring-1 ring-gray-100 flex items-center justify-center bg-gradient-to-br from-gray-600 to-gray-800">
            {logoUrl ? (
              <img src={logoUrl} alt={job.employer?.companyName ?? ''} className="h-full w-full object-cover" />
            ) : (
              <span className="text-white text-[10px] font-medium select-none">{logoLetter}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-medium text-gray-700 truncate leading-tight">
              {job.employer?.companyName ?? '-'}
            </p>
            {appCount > 0 ? (
              <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                <Users className="h-3 w-3" />{appCount} applicant{appCount !== 1 ? 's' : ''}
              </p>
            ) : (
              <p className="mt-0.5 leading-tight">
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />
                  New
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Right: date + save */}
        <div className="flex items-center gap-0.5 shrink-0">
          <span className="text-[11px] text-gray-300">
            {timeAgo(job.publishedAt || job.createdAt)}
          </span>
          {userId && (
            <FavoriteButton
              isFavorited={isFavorited}
              onToggle={toggleFav}
              size="sm"
            />
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Link href={`/jobs/${job.id}`} className="block h-full">
      {job.isPinned ? <PinnedBorder>{card}</PinnedBorder> : card}
    </Link>
  );
}
