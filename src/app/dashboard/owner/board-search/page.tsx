'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import type { BoardTokenRow, PlatformRow, TokenVerifyProgress } from '@/lib/board-search-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Upload, Search, Trash2, CheckCircle, AlertCircle, Database, Loader2, RefreshCw,
} from 'lucide-react';

const PAGE_SIZE = 100;

async function readApiError(res: Response): Promise<string> {
  try {
    const data = await res.json() as { message?: string };
    return data.message || `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

export default function BoardSearchPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [platforms, setPlatforms] = useState<PlatformRow[]>([]);
  const [ats, setAts] = useState('');
  const [q, setQ] = useState('');
  const [items, setItems] = useState<BoardTokenRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [newToken, setNewToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState<TokenVerifyProgress | null>(null);
  const [concurrencyDraft, setConcurrencyDraft] = useState('20');
  const [migrating, setMigrating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selected = platforms.find(p => p.slug === ats);

  const refreshPlatforms = useCallback(async () => {
    const res = await apiFetch('/board-search/platforms', { method: 'POST', body: '{}' });
    if (!res.ok) throw new Error(await readApiError(res));
    const data = await res.json();
    setPlatforms(data.platforms ?? []);
    if (!ats && data.platforms?.[0]) {
      setAts(data.platforms[0].slug);
      setConcurrencyDraft(String(data.platforms[0].concurrency || 20));
    }
  }, [ats]);

  const bootstrap = useCallback(async () => {
    const initRes = await apiFetch('/board-search/init', { method: 'POST', body: '{}' });
    if (!initRes.ok) throw new Error(await readApiError(initRes));
    await refreshPlatforms();
  }, [refreshPlatforms]);

  const reloadTokens = useCallback(async (nextPage = page) => {
    if (!ats) return;
    const res = await apiFetch('/board-search/tokens/search', {
      method: 'POST',
      body: JSON.stringify({ ats, q, limit: PAGE_SIZE, offset: (nextPage - 1) * PAGE_SIZE }),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    setItems(data.items);
    setTotal(data.total);
    setPage(nextPage);
  }, [ats, q, page]);

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) setHydrated(true);
    return useAuthStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  const authReady = hydrated && isAuthenticated && user?.role === 'OWNER';

  useEffect(() => {
    if (!authReady) {
      if (hydrated && (!isAuthenticated || user?.role !== 'OWNER')) {
        setLoading(false);
        setMessage('Sign in as an owner to manage board tokens.');
      }
      return;
    }

    setLoading(true);
    void bootstrap()
      .catch(err => setMessage(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, [authReady, hydrated, isAuthenticated, user?.role, bootstrap]);

  useEffect(() => {
    if (!ats) return;
    void reloadTokens(1).catch(err => setMessage(String(err)));
  }, [ats, q]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const p = platforms.find(x => x.slug === ats);
    if (p) setConcurrencyDraft(String(p.concurrency || 20));
  }, [ats, platforms]);

  async function commitConcurrency() {
    const n = Math.max(1, Math.min(100, Math.floor(Number(concurrencyDraft) || 20)));
    setConcurrencyDraft(String(n));
    if (ats) {
      await apiFetch('/board-search/platforms/concurrency', {
        method: 'POST',
        body: JSON.stringify({ slug: ats, concurrency: n }),
      });
      await refreshPlatforms();
    }
    return n;
  }

  async function onAdd(e: FormEvent) {
    e.preventDefault();
    if (!ats || !newToken.trim()) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await apiFetch('/board-search/tokens/add', {
        method: 'POST',
        body: JSON.stringify({ ats, token: newToken.trim() }),
      });
      if (!res.ok) throw new Error((await res.json()).message || res.statusText);
      setMessage(`Verified & added ${newToken.trim()}`);
      setNewToken('');
      await reloadTokens(1);
      await refreshPlatforms();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function onImportFile(file: File | null) {
    if (!file || !ats) return;
    const conc = await commitConcurrency();
    setBusy(true);
    setMessage(null);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/);
      const res = await apiFetch('/board-search/tokens/import', {
        method: 'POST',
        body: JSON.stringify({ ats, lines, concurrency: conc }),
      });
      if (!res.ok) throw new Error((await res.json()).message || res.statusText);
      const result = await res.json();
      setMessage(
        result.cancelled
          ? `Import cancelled · added ${result.added.toLocaleString()}`
          : `Import done · added ${result.added.toLocaleString()} · invalid ${result.invalid.toLocaleString()} · already in DB ${result.skippedExisting.toLocaleString()}`,
      );
      await reloadTokens(1);
      await refreshPlatforms();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err));
      setProgress(null);
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function onVerifyTokens() {
    if (!ats || !selected) return;
    const conc = await commitConcurrency();
    if (!confirm(`Verify all ${selected.token_count.toLocaleString()} ${selected.label} tokens (${conc} concurrent) and remove invalid ones?`)) {
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const res = await apiFetch('/board-search/tokens/verify', {
        method: 'POST',
        body: JSON.stringify({ ats, concurrency: conc }),
      });
      if (!res.ok) throw new Error((await res.json()).message || res.statusText);
      const result = await res.json();
      setMessage(
        result.cancelled
          ? `Verify cancelled · removed ${result.removed?.toLocaleString() ?? 0}`
          : `Verify done · ${result.valid?.toLocaleString() ?? 0} valid · removed ${result.removed?.toLocaleString() ?? 0} invalid`,
      );
      await reloadTokens(1);
      await refreshPlatforms();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  async function toggleEnabled(token: string, enabled: boolean) {
    await apiFetch('/board-search/tokens/enable', {
      method: 'POST',
      body: JSON.stringify({ ats, token, enabled }),
    });
    await reloadTokens(page);
  }

  async function deleteToken(token: string) {
    if (!confirm(`Delete token ${token} and all its scraped jobs?`)) return;
    await apiFetch('/board-search/tokens/delete', {
      method: 'POST',
      body: JSON.stringify({ ats, token }),
    });
    await reloadTokens(page);
    await refreshPlatforms();
  }

  async function migrateSqlite() {
    if (!confirm('Migrate platforms, tokens, and jobs from felovy-search SQLite DB to Postgres? This may take several minutes.')) {
      return;
    }
    setMigrating(true);
    setMessage(null);
    try {
      const res = await apiFetch('/board-search/migrate/sqlite', {
        method: 'POST',
        body: JSON.stringify({ includeJobs: true, uploadLogos: true }),
      });
      if (!res.ok) throw new Error((await res.json()).message || res.statusText);
      const result = await res.json();
      setMessage(
        `Migration complete · ${result.platforms} platforms · ${result.tokens.toLocaleString()} tokens · ${result.jobs.toLocaleString()} jobs · ${result.logosUploaded} logos uploaded`,
      );
      await refreshPlatforms();
      await reloadTokens(1);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setMigrating(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (!hydrated || loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading board tokens…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Board Tokens</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage ATS board tokens — import from TXT, verify via API, enable/disable.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void migrateSqlite()} disabled={migrating}>
            {migrating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Database className="h-4 w-4 mr-2" />}
            Migrate from SQLite
          </Button>
          <Link href="/dashboard/owner/board-search/scrape">
            <Button variant="gradient">Open Scrape</Button>
          </Link>
        </div>
      </div>

      {message && (
        <div className={`rounded-xl px-4 py-3 text-sm flex items-start gap-2 ${
          message.includes('done') || message.includes('complete') || message.includes('added')
            ? 'bg-emerald-50 text-emerald-800'
            : 'bg-amber-50 text-amber-800'
        }`}>
          {message.includes('Invalid') || message.includes('error') ? (
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          ) : (
            <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
          )}
          {message}
        </div>
      )}

      {progress?.running && (
        <div className="rounded-xl border bg-white p-4 text-sm">
          <div className="font-medium">{progress.mode} — {progress.atsLabel || progress.ats}</div>
          <div className="text-gray-500 mt-1">
            {progress.checked.toLocaleString()} / {progress.total.toLocaleString()} ·
            valid {progress.valid.toLocaleString()} · invalid {progress.invalid.toLocaleString()} ·
            added {progress.added.toLocaleString()}
          </div>
          {progress.currentToken && (
            <div className="text-xs text-gray-400 mt-1 truncate">{progress.currentToken}</div>
          )}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <div className="rounded-2xl border bg-white p-3 max-h-[520px] overflow-y-auto">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 py-1">Platforms</div>
          {!platforms.length ? (
            <div className="px-2 py-6 text-center text-xs text-gray-400 space-y-2">
              <p>No platforms loaded.</p>
              <Button variant="outline" size="sm" onClick={() => void bootstrap().catch(err => setMessage(String(err)))}>
                <RefreshCw className="h-3 w-3 mr-1" /> Retry init
              </Button>
            </div>
          ) : platforms.map(p => (
            <button
              key={p.slug}
              type="button"
              onClick={() => { setAts(p.slug); setPage(1); }}
              className={`w-full text-left rounded-xl px-3 py-2.5 mb-1 text-sm transition-colors ${
                ats === p.slug ? 'bg-felovy-fill text-felovy-ink font-medium' : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div>{p.label}</div>
              <div className="text-xs text-gray-400">{p.token_count.toLocaleString()} tokens · {p.job_count.toLocaleString()} jobs</div>
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {selected && (
            <div className="rounded-2xl border bg-white p-4 flex flex-wrap gap-3 items-end">
              <form onSubmit={onAdd} className="flex gap-2 flex-1 min-w-[200px]">
                <Input
                  placeholder="Add token (verified via API)"
                  value={newToken}
                  onChange={e => setNewToken(e.target.value)}
                  disabled={busy}
                />
                <Button type="submit" disabled={busy || !newToken.trim()}>Add</Button>
              </form>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Concurrency</span>
                <Input
                  className="w-16 h-9"
                  value={concurrencyDraft}
                  onChange={e => setConcurrencyDraft(e.target.value)}
                  onBlur={() => void commitConcurrency()}
                />
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,text/plain"
                className="hidden"
                onChange={e => void onImportFile(e.target.files?.[0] ?? null)}
              />
              <Button variant="outline" disabled={busy} onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" /> Import TXT
              </Button>
              <Button variant="outline" disabled={busy} onClick={() => void onVerifyTokens()}>
                Verify all
              </Button>
            </div>
          )}

          <div className="rounded-2xl border bg-white overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tokens…"
                value={q}
                onChange={e => { setQ(e.target.value); setPage(1); }}
                className="border-0 shadow-none focus-visible:ring-0"
              />
              <span className="text-xs text-gray-400 whitespace-nowrap">{total.toLocaleString()} total</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50/80 text-left text-xs text-gray-500">
                    <th className="px-4 py-2 font-medium">Token</th>
                    <th className="px-4 py-2 font-medium">Enabled</th>
                    <th className="px-4 py-2 font-medium">Last scrape</th>
                    <th className="px-4 py-2 font-medium">Jobs</th>
                    <th className="px-4 py-2 font-medium">Logo</th>
                    <th className="px-4 py-2 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {items.map(row => (
                    <tr key={row.board_token} className="border-b last:border-0 hover:bg-gray-50/50">
                      <td className="px-4 py-2 font-mono text-xs">{row.board_token}</td>
                      <td className="px-4 py-2">
                        <button
                          type="button"
                          onClick={() => void toggleEnabled(row.board_token, !row.enabled)}
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            row.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {row.enabled ? 'On' : 'Off'}
                        </button>
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-500">
                        {row.last_status === 'ok' && <span className="text-emerald-600">ok</span>}
                        {row.last_status === 'error' && <span className="text-red-600" title={row.last_error ?? ''}>error</span>}
                        {!row.last_status && '—'}
                      </td>
                      <td className="px-4 py-2">{row.last_job_count ?? '—'}</td>
                      <td className="px-4 py-2">
                        {row.logo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={row.logo_url} alt="" className="h-6 w-6 rounded object-contain bg-gray-50" />
                        ) : '—'}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button
                          type="button"
                          className="text-gray-400 hover:text-red-500"
                          onClick={() => void deleteToken(row.board_token)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!items.length && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-400">No tokens</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t flex justify-between items-center text-sm">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => void reloadTokens(page - 1)}>
                  Previous
                </Button>
                <span className="text-gray-500">Page {page} / {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => void reloadTokens(page + 1)}>
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
