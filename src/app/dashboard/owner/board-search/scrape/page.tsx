'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import type { AgentStatus, PlatformRow, RotationStatus } from '@/lib/board-search-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Play, Pause, Square, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';

export default function BoardScrapePage() {
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [platforms, setPlatforms] = useState<PlatformRow[]>([]);
  const [rotation, setRotation] = useState<RotationStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [concurrencyDraft, setConcurrencyDraft] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const refreshAll = useCallback(async () => {
    const [agentsRes, platformsRes] = await Promise.all([
      apiFetch('/board-search/scrape/agents', { method: 'POST', body: '{}' }),
      apiFetch('/board-search/platforms', { method: 'POST', body: '{}' }),
    ]);
    if (!agentsRes.ok || !platformsRes.ok) throw new Error('Failed to load scrape state');
    const agentsData = await agentsRes.json();
    const platformsData = await platformsRes.json();
    setAgents(agentsData.agents);
    setRotation(agentsData.rotation);
    setPlatforms(platformsData.platforms);
  }, []);

  useEffect(() => {
    void refreshAll()
      .catch(err => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));

    const poll = setInterval(() => {
      void refreshAll().catch(() => {});
    }, 3000);

    return () => clearInterval(poll);
  }, [refreshAll]);

  useEffect(() => {
    setConcurrencyDraft(prev => {
      const next = { ...prev };
      let changed = false;
      for (const a of agents) {
        if (next[a.ats] === undefined) {
          next[a.ats] = String(a.concurrency);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [agents]);

  const scrapeable = new Map(platforms.map(p => [p.slug, p.scrapeable]));

  async function onToggle(ats: string) {
    setError(null);
    try {
      await apiFetch('/board-search/scrape/toggle', { method: 'POST', body: JSON.stringify({ ats }) });
      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function onStop(ats: string) {
    await apiFetch('/board-search/scrape/stop', { method: 'POST', body: JSON.stringify({ ats }) });
    await refreshAll();
  }

  async function commitConcurrency(ats: string) {
    const raw = concurrencyDraft[ats];
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 1) return;
    const clamped = Math.max(1, Math.min(100, Math.round(n)));
    setConcurrencyDraft(d => ({ ...d, [ats]: String(clamped) }));
    await apiFetch('/board-search/scrape/concurrency', {
      method: 'POST',
      body: JSON.stringify({ ats, concurrency: clamped }),
    });
    await refreshAll();
  }

  async function onMove(ats: string, direction: 'up' | 'down') {
    setError(null);
    try {
      await apiFetch('/board-search/platforms/move', {
        method: 'POST',
        body: JSON.stringify({ slug: ats, direction }),
      });
      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function onRotationToggle() {
    setError(null);
    try {
      await apiFetch('/board-search/scrape/rotation/toggle', { method: 'POST', body: '{}' });
      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function onRotationStop() {
    await apiFetch('/board-search/scrape/rotation/stop', { method: 'POST', body: '{}' });
    await refreshAll();
  }

  const running = agents.filter(a => a.running && !a.paused).length;
  const jobsFound = agents.reduce((s, a) => s + a.jobsFound, 0);
  const rotationRunning = !!rotation?.active && !rotation?.paused;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading scrape agents…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Scraping</h1>
          <p className="text-sm text-gray-500 mt-1">
            Per-ATS scrape agents with concurrency control and rotation mode.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/owner/board-search">
            <Button variant="outline">Board Tokens</Button>
          </Link>
          <Button variant={rotationRunning ? 'outline' : 'default'} onClick={() => void onRotationToggle()}>
            {rotationRunning ? <><Pause className="h-4 w-4 mr-2" /> Pause rotation</> : <><Play className="h-4 w-4 mr-2" /> Start rotation</>}
          </Button>
          <Button variant="destructive" disabled={!rotation?.active} onClick={() => void onRotationStop()}>
            <Square className="h-4 w-4 mr-2" /> Stop rotation
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 text-red-800 px-4 py-3 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Rotation', value: rotation?.active ? (rotation.paused ? 'Paused' : 'Running') : 'Idle' },
          { label: 'Current ATS', value: rotation?.currentLabel || rotation?.currentAts || '—' },
          { label: 'Cycle', value: String(rotation?.cycle ?? 1) },
          { label: 'Active agents', value: String(running) },
          { label: 'Jobs this session', value: jobsFound.toLocaleString() },
        ].map(stat => (
          <div key={stat.label} className="rounded-2xl border bg-white p-4">
            <div className="text-lg font-semibold text-gray-900">{stat.value}</div>
            <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50/80 text-left text-xs text-gray-500">
              <th className="px-4 py-2 font-medium">ATS</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Progress</th>
              <th className="px-4 py-2 font-medium">Jobs / Pruned</th>
              <th className="px-4 py-2 font-medium">Concurrency</th>
              <th className="px-4 py-2 font-medium">Order</th>
              <th className="px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {agents.map(a => {
              const canScrape = scrapeable.get(a.ats);
              const status = a.running ? (a.paused ? 'Paused' : 'Running') : 'Idle';
              return (
                <tr key={a.ats} className="border-b last:border-0 hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{a.label}</div>
                    <div className="text-xs text-gray-400 font-mono">{a.ats}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      status === 'Running' ? 'bg-emerald-100 text-emerald-700' :
                      status === 'Paused' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {status}
                    </span>
                    {!canScrape && <div className="text-xs text-gray-400 mt-1">Not scrapeable</div>}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <div>{a.doneTokens} / {a.totalTokens} tokens</div>
                    {a.currentToken && <div className="text-gray-400 truncate max-w-[160px]">{a.currentToken}</div>}
                    {a.lastMessage && <div className="text-gray-400 truncate max-w-[200px] mt-0.5">{a.lastMessage}</div>}
                  </td>
                  <td className="px-4 py-3">{a.jobsFound} / {a.jobsPruned}</td>
                  <td className="px-4 py-3">
                    <Input
                      className="w-16 h-8 text-xs"
                      value={concurrencyDraft[a.ats] ?? String(a.concurrency)}
                      onChange={e => setConcurrencyDraft(d => ({ ...d, [a.ats]: e.target.value }))}
                      onBlur={() => void commitConcurrency(a.ats)}
                      disabled={!canScrape}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button type="button" className="p-1 rounded hover:bg-gray-100" onClick={() => void onMove(a.ats, 'up')}>
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button type="button" className="p-1 rounded hover:bg-gray-100" onClick={() => void onMove(a.ats, 'down')}>
                        <ArrowDown className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" disabled={!canScrape} onClick={() => void onToggle(a.ats)}>
                        {a.running && !a.paused ? 'Pause' : 'Start'}
                      </Button>
                      <Button size="sm" variant="ghost" disabled={!a.running} onClick={() => void onStop(a.ats)}>
                        Stop
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
