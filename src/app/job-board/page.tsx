'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '@/components/shared/Navbar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import type {
  BoardJobDateRange,
  BoardJobListResponse,
  BoardJobRow,
  BoardJobSearchMode,
} from '@/lib/board-job-types';
import {
  ArrowDown, ArrowUp, ArrowUpDown, ExternalLink, Loader2, RefreshCw, Search,
} from 'lucide-react';

const PAGE_SIZE = 50;

type SortBy = 'title' | 'company_name' | 'location_name' | 'first_published' | 'source_updated_at' | 'board_token' | 'scraped_at';
type JobBadge = 'top' | 'new' | 'hot';

const DATE_OPTIONS: { value: BoardJobDateRange; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: '2d', label: 'Last 2 days' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'all', label: 'All jobs' },
];

function formatDate(v: string | null | undefined): string {
  if (!v) return '—';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v.slice(0, 10);
  return d.toLocaleDateString();
}

function withinDays(iso: string | null | undefined, days: number): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  return t >= Date.now() - days * 24 * 60 * 60 * 1000;
}

function jobBadge(job: BoardJobRow): JobBadge | null {
  const isNew = withinDays(job.firstPublished, 2) || withinDays(job.sourceUpdatedAt, 2);
  const isHot = job.remoteStatus === 'remote' && job.region === 'US';
  if (isNew && isHot) return 'top';
  if (isNew) return 'new';
  if (isHot) return 'hot';
  return null;
}

function buildQuery(state: {
  titleQ: string;
  titleMode: BoardJobSearchMode;
  contentQ: string;
  contentMode: BoardJobSearchMode;
  boardTokenQ: string;
  ats: string;
  remote: string;
  region: string;
  postedRange: BoardJobDateRange;
  sortBy: SortBy;
  sortDir: 'asc' | 'desc';
  page: number;
}) {
  return {
    title_q: state.titleQ || undefined,
    title_mode: state.titleMode,
    content_q: state.contentQ || undefined,
    content_mode: state.contentMode,
    board_token_q: state.boardTokenQ || undefined,
    ats: state.ats || undefined,
    remote_status: state.remote || undefined,
    region: state.region === 'ANY' ? undefined : state.region,
    posted_range: state.postedRange,
    sort_by: state.sortBy,
    sort_dir: state.sortDir,
    page: state.page,
    pageSize: PAGE_SIZE,
  };
}

function ModeToggle({ value, onChange }: { value: BoardJobSearchMode; onChange: (m: BoardJobSearchMode) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(value === 'AND' ? 'OR' : 'AND')}
      className={`shrink-0 h-9 min-w-[2.25rem] rounded-lg border text-xs font-bold transition-colors ${
        value === 'AND'
          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
          : 'bg-amber-50 border-amber-200 text-amber-700'
      }`}
      title={value === 'AND' ? 'AND (click for OR)' : 'OR (click for AND)'}
    >
      {value === 'AND' ? '&&' : '||'}
    </button>
  );
}

function SortHeader({
  label, column, sortBy, sortDir, onSort,
}: {
  label: string;
  column: SortBy;
  sortBy: SortBy;
  sortDir: 'asc' | 'desc';
  onSort: (col: SortBy) => void;
}) {
  const active = sortBy === column;
  return (
    <th
      className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 cursor-pointer select-none whitespace-nowrap hover:text-felovy-red"
      onClick={() => onSort(column)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active
          ? (sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)
          : <ArrowUpDown className="h-3 w-3 opacity-40" />}
      </span>
    </th>
  );
}

function BadgePill({ kind }: { kind: JobBadge }) {
  const styles = {
    new: 'bg-sky-100 text-sky-700 border-sky-200',
    hot: 'bg-orange-100 text-orange-700 border-orange-200',
    top: 'bg-violet-100 text-violet-700 border-violet-200',
  };
  return (
    <span className={`inline-flex text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border ${styles[kind]}`}>
      {kind}
    </span>
  );
}

export default function JobBoardPage() {
  const [titleQ, setTitleQ] = useState('');
  const [titleMode, setTitleMode] = useState<BoardJobSearchMode>('AND');
  const [contentQ, setContentQ] = useState('');
  const [contentMode, setContentMode] = useState<BoardJobSearchMode>('AND');
  const [boardTokenQ, setBoardTokenQ] = useState('');
  const [ats, setAts] = useState('');
  const [remote, setRemote] = useState('');
  const [region, setRegion] = useState('ANY');
  const [postedRange, setPostedRange] = useState<BoardJobDateRange>('all');
  const [sortBy, setSortBy] = useState<SortBy>('first_published');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  const queryBody = useMemo(
    () => buildQuery({ titleQ, titleMode, contentQ, contentMode, boardTokenQ, ats, remote, region, postedRange, sortBy, sortDir, page }),
    [titleQ, titleMode, contentQ, contentMode, boardTokenQ, ats, remote, region, postedRange, sortBy, sortDir, page],
  );

  const { data: filters } = useQuery({
    queryKey: ['job-board-filters'],
    queryFn: async () => {
      const res = await api.post('/job-board/filters', {});
      return res.json() as Promise<{ ats: string[] }>;
    },
  });

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['job-board-list', queryBody],
    queryFn: async () => {
      const res = await api.post('/job-board/list', queryBody);
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(body.message || 'Failed to load jobs');
      }
      return res.json() as Promise<BoardJobListResponse>;
    },
    placeholderData: (prev) => prev,
  });

  const pages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));

  const handleSort = useCallback((col: SortBy) => {
    setSortBy((prev: SortBy) => {
      if (prev === col) {
        setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortDir('desc');
      return col;
    });
    setPage(1);
  }, []);

  useEffect(() => { setPage(1); }, [titleQ, contentQ, boardTokenQ, ats, remote, region, postedRange]);

  return (
    <div className="min-h-screen bg-[#f8f8fb]">
      <Navbar />
      <div className="container mx-auto max-w-[1400px] px-4 py-8 pt-[4.5rem]">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Job Board</h1>
          <p className="text-sm text-gray-500 mt-1">
            Aggregated roles from ATS boards synced via Felovy Search.
            {(data?.total ?? 0) > 0 && (
              <span className="ml-1 font-medium text-gray-700">{data!.total.toLocaleString()} jobs</span>
            )}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[220px]">
              <label className="text-xs font-medium text-gray-500 mb-1 block">Title search</label>
              <div className="flex gap-1.5">
                <Input value={titleQ} onChange={e => setTitleQ(e.target.value)} placeholder="e.g. senior react" className="h-9" />
                <ModeToggle value={titleMode} onChange={setTitleMode} />
              </div>
            </div>
            <div className="flex-1 min-w-[220px]">
              <label className="text-xs font-medium text-gray-500 mb-1 block">Content search</label>
              <div className="flex gap-1.5">
                <Input value={contentQ} onChange={e => setContentQ(e.target.value)} placeholder="Keywords in description" className="h-9" />
                <ModeToggle value={contentMode} onChange={setContentMode} />
              </div>
            </div>
            <div className="min-w-[140px]">
              <label className="text-xs font-medium text-gray-500 mb-1 block">Board token</label>
              <Input value={boardTokenQ} onChange={e => setBoardTokenQ(e.target.value)} placeholder="company slug" className="h-9" />
            </div>
            <div className="min-w-[120px]">
              <label className="text-xs font-medium text-gray-500 mb-1 block">ATS</label>
              <select
                value={ats}
                onChange={e => setAts(e.target.value)}
                className="h-9 w-full rounded-lg border border-gray-200 bg-white px-2 text-sm"
              >
                <option value="">All ATS</option>
                {(filters?.ats ?? []).map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div className="min-w-[110px]">
              <label className="text-xs font-medium text-gray-500 mb-1 block">Remote</label>
              <select
                value={remote}
                onChange={e => setRemote(e.target.value)}
                className="h-9 w-full rounded-lg border border-gray-200 bg-white px-2 text-sm"
              >
                <option value="">Any</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">On-site</option>
              </select>
            </div>
            <div className="min-w-[100px]">
              <label className="text-xs font-medium text-gray-500 mb-1 block">Region</label>
              <select
                value={region}
                onChange={e => setRegion(e.target.value)}
                className="h-9 w-full rounded-lg border border-gray-200 bg-white px-2 text-sm"
              >
                <option value="ANY">Any</option>
                <option value="US">US</option>
                <option value="EU">EU</option>
                <option value="LATAM">LATAM</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div className="min-w-[120px]">
              <label className="text-xs font-medium text-gray-500 mb-1 block">Posted</label>
              <select
                value={postedRange}
                onChange={e => setPostedRange(e.target.value as BoardJobDateRange)}
                className="h-9 w-full rounded-lg border border-gray-200 bg-white px-2 text-sm"
              >
                {DATE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Refresh
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50/60">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Search className="h-4 w-4 text-gray-400" />
              Page {page} / {pages}
              {data?.total !== undefined && (
                <span className="text-gray-400">· {data.total.toLocaleString()} total</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
              <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>

          {isLoading && !data ? (
            <div className="flex justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-felovy-red" />
            </div>
          ) : isError ? (
            <div className="py-24 text-center text-sm text-red-500 px-4">
              {(error as Error)?.message || 'Failed to load job board'}
            </div>
          ) : !data?.items.length ? (
            <div className="py-24 text-center text-gray-400 text-sm">
              No jobs yet. Sync jobs from Felovy Search using the ingest API.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-white">
                  <tr>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 w-8">#</th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Badge</th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">ATS</th>
                    <SortHeader label="Title" column="title" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="Company" column="company_name" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="Token" column="board_token" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="Location" column="location_name" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Region</th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Remote</th>
                    <SortHeader label="Posted" column="first_published" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 w-20">Open</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.items.map((job, idx) => {
                    const badge = jobBadge(job);
                    const rowNum = (page - 1) * PAGE_SIZE + idx + 1;
                    return (
                      <tr key={job.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-3 py-2.5 text-xs text-gray-400 tabular-nums">{rowNum}</td>
                        <td className="px-3 py-2.5">{badge ? <BadgePill kind={badge} /> : null}</td>
                        <td className="px-3 py-2.5">
                          <span className="inline-flex text-[10px] font-semibold uppercase tracking-wide bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            {job.ats}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 max-w-[260px]">
                          <Link href={`/job-board/${job.id}`} className="font-medium text-gray-900 hover:text-felovy-red line-clamp-2">
                            {job.title || '(Untitled)'}
                          </Link>
                        </td>
                        <td className="px-3 py-2.5 text-gray-700 max-w-[140px] truncate">{job.companyName || '—'}</td>
                        <td className="px-3 py-2.5 text-gray-500 text-xs max-w-[120px] truncate">{job.boardToken}</td>
                        <td className="px-3 py-2.5 text-gray-600 max-w-[160px] truncate">{job.locationName || '—'}</td>
                        <td className="px-3 py-2.5">
                          {job.region && (
                            <span className="text-[10px] font-semibold uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                              {job.region}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 capitalize text-gray-600">{job.remoteStatus || '—'}</td>
                        <td className="px-3 py-2.5 text-gray-500 text-xs whitespace-nowrap">{formatDate(job.firstPublished || job.sourceUpdatedAt)}</td>
                        <td className="px-3 py-2.5">
                          {job.absoluteUrl ? (
                            <a
                              href={job.absoluteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-felovy-red hover:underline"
                            >
                              Apply <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!!data?.items.length && (
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 bg-gray-50/40">
              <span className="text-xs text-gray-500">Showing {data.items.length} of {data.total.toLocaleString()}</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
