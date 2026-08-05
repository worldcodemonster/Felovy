'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '@/components/shared/Navbar';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import type { BoardJobRow } from '@/lib/board-job-types';
import { ArrowLeft, ExternalLink, Loader2 } from 'lucide-react';

function formatDate(v: string | null | undefined): string {
  if (!v) return '—';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleString();
}

export default function JobBoardDetailPage({ params }: { params: { id: string } }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['job-board-detail', params.id],
    queryFn: async () => {
      const res = await api.post(`/job-board/${params.id}`, {});
      if (!res.ok) throw new Error('Job not found');
      return res.json() as Promise<{ job: BoardJobRow }>;
    },
  });

  const job = data?.job;

  return (
    <div className="min-h-screen bg-[#f8f8fb]">
      <Navbar />
      <div className="container mx-auto max-w-3xl px-4 py-8 pt-[4.5rem]">
        <Link href="/job-board" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-felovy-red mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Job Board
        </Link>

        {isLoading ? (
          <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-felovy-red" /></div>
        ) : isError || !job ? (
          <div className="bg-white rounded-2xl border p-8 text-center text-gray-500">Job not found.</div>
        ) : (
          <article className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">{job.ats} · {job.boardToken}</p>
                  <h1 className="text-2xl font-bold text-gray-900">{job.title || 'Untitled role'}</h1>
                  <p className="text-gray-600 mt-1">{job.companyName}{job.locationName ? ` · ${job.locationName}` : ''}</p>
                </div>
                {job.absoluteUrl && (
                  <a href={job.absoluteUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="gradient" className="gap-2">
                      Apply on company site <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                )}
              </div>
              <dl className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div><dt className="text-gray-400 text-xs">Region</dt><dd className="font-medium">{job.region || '—'}</dd></div>
                <div><dt className="text-gray-400 text-xs">Remote</dt><dd className="font-medium capitalize">{job.remoteStatus || '—'}</dd></div>
                <div><dt className="text-gray-400 text-xs">Employment</dt><dd className="font-medium">{job.employmentType || '—'}</dd></div>
                <div><dt className="text-gray-400 text-xs">Posted</dt><dd className="font-medium">{formatDate(job.firstPublished)}</dd></div>
              </dl>
            </div>
            <div className="p-6 prose prose-sm max-w-none text-gray-700">
              {job.contentHtml ? (
                <div dangerouslySetInnerHTML={{ __html: job.contentHtml }} />
              ) : job.contentText ? (
                <pre className="whitespace-pre-wrap font-sans text-sm">{job.contentText}</pre>
              ) : (
                <p className="text-gray-400 italic">No description synced for this listing.</p>
              )}
            </div>
          </article>
        )}
      </div>
    </div>
  );
}
