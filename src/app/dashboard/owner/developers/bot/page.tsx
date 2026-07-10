'use client';

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/toaster';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { COUNTRY_NAMES } from '@/lib/countries';
import { BOT_DOMAINS, type BotDomainId } from '@/lib/developer-bot-data';
import {
  DEFAULT_PORTRAIT_PROVIDERS,
  PORTRAIT_PROVIDERS,
  type PortraitProviderId,
} from '@/lib/portrait-providers';
import { HOME_CAROUSEL_BOT_SPECS } from '@/lib/home-carousel-bots';
import {
  ArrowLeft, Bot, Globe, ImageIcon, ImageOff, Loader2, Sparkles, CheckCircle2, XCircle,
  Circle, AlertCircle, MinusCircle,
} from 'lucide-react';

type PhotoMode = 'none' | 'online';

type BotStepStatus = 'pending' | 'running' | 'done' | 'skipped' | 'error';

type BotStep = {
  step: string;
  label: string;
  detail?: string;
  status: BotStepStatus;
};

type PersonProgress = {
  index: number;
  status: 'pending' | 'running' | 'done' | 'error';
  steps: BotStep[];
  developer?: { id: string; fullName: string; email: string; country: string; isVerified: boolean };
  error?: string;
};

type GenerateResult = {
  message: string;
  created: number;
  developers: { id: string; fullName: string; email: string; country: string; isVerified: boolean }[];
  errors: string[];
};

type BotProgressEvent =
  | { type: 'batch_start'; total: number }
  | { type: 'person_start'; index: number; total: number }
  | {
      type: 'step';
      index: number;
      step: string;
      label: string;
      detail?: string;
      status: 'running' | 'done' | 'skipped' | 'error';
    }
  | {
      type: 'person_complete';
      index: number;
      developer: { id: string; fullName: string; email: string; country: string; isVerified: boolean };
    }
  | { type: 'person_failed'; index: number; error: string }
  | { type: 'batch_complete'; created: number; errors: string[] };

type PortraitProviderStatus = {
  id: PortraitProviderId;
  label: string;
  description: string;
  worksWithoutKey: boolean;
  apiKeyConfigured: boolean;
  available: boolean;
};

function ProviderChip({
  active,
  label,
  badge,
  disabled,
  onClick,
}: {
  active: boolean;
  label: string;
  badge?: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-start gap-0.5 text-left px-3 py-2 rounded-xl border transition-colors min-w-[7.5rem] ${
        disabled
          ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-400'
          : active
            ? 'bg-felovy-light border-felovy-red text-felovy-red'
            : 'bg-white border-gray-200 text-gray-600 hover:border-felovy-red/40'
      }`}
    >
      <span className="text-xs font-semibold">{label}</span>
      {badge && (
        <span className={`text-[10px] font-medium ${active ? 'text-felovy-red/80' : 'text-gray-400'}`}>
          {badge}
        </span>
      )}
    </button>
  );
}

function Chip({
  active, label, onClick,
}: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
        active
          ? 'bg-felovy-red text-white border-felovy-red shadow-sm shadow-green-200'
          : 'bg-white text-gray-600 border-gray-200 hover:border-felovy-red/40 hover:text-felovy-red'
      }`}
    >
      {label}
    </button>
  );
}

function StepIcon({ status }: { status: BotStepStatus }) {
  if (status === 'running') return <Loader2 className="h-3.5 w-3.5 animate-spin text-felovy-red shrink-0" />;
  if (status === 'done') return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />;
  if (status === 'error') return <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />;
  if (status === 'skipped') return <MinusCircle className="h-3.5 w-3.5 text-gray-400 shrink-0" />;
  return <Circle className="h-3.5 w-3.5 text-gray-300 shrink-0" />;
}

function PersonStatusCard({ person }: { person: PersonProgress }) {
  const border =
    person.status === 'running'
      ? 'border-felovy-red/40 ring-1 ring-felovy-red/20'
      : person.status === 'done'
        ? 'border-emerald-200'
        : person.status === 'error'
          ? 'border-red-200'
          : 'border-gray-100';

  return (
    <div className={`rounded-xl border bg-white p-4 transition-colors ${border}`}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {person.status === 'running' && <Loader2 className="h-4 w-4 animate-spin text-felovy-red shrink-0" />}
          {person.status === 'done' && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
          {person.status === 'error' && <XCircle className="h-4 w-4 text-red-500 shrink-0" />}
          {person.status === 'pending' && <Circle className="h-4 w-4 text-gray-300 shrink-0" />}
          <span className="text-sm font-semibold text-gray-900 truncate">
            Developer {person.index + 1}
            {person.developer ? ` — ${person.developer.fullName}` : ''}
          </span>
        </div>
        {person.developer && (
          <Link
            href={`/dashboard/owner/developers/${person.developer.id}`}
            className="text-xs text-felovy-red hover:underline shrink-0"
          >
            View
          </Link>
        )}
      </div>

      {person.error && (
        <p className="text-xs text-red-600 mb-3 bg-red-50 rounded-lg px-3 py-2">{person.error}</p>
      )}

      <ul className="space-y-2">
        {person.steps.map((s) => (
          <li key={s.step} className="flex items-start gap-2 text-xs">
            <StepIcon status={s.status} />
            <div className="min-w-0 flex-1">
              <span className={`font-medium ${
                s.status === 'running' ? 'text-felovy-red' :
                s.status === 'error' ? 'text-red-600' :
                s.status === 'skipped' ? 'text-gray-400' :
                s.status === 'done' ? 'text-gray-800' : 'text-gray-400'
              }`}>
                {s.label}
              </span>
              {s.detail && (
                <p className="text-gray-500 mt-0.5 break-words leading-relaxed">{s.detail}</p>
              )}
            </div>
          </li>
        ))}
        {person.status === 'pending' && person.steps.length === 0 && (
          <li className="text-xs text-gray-400">Waiting to start…</li>
        )}
      </ul>
    </div>
  );
}

function initPersonProgress(total: number): PersonProgress[] {
  return Array.from({ length: total }, (_, index) => ({
    index,
    status: 'pending' as const,
    steps: [],
  }));
}

function applyProgressEvent(people: PersonProgress[], event: BotProgressEvent): PersonProgress[] {
  const next = people.map((p) => ({ ...p, steps: [...p.steps] }));

  if (event.type === 'person_start') {
    const p = next[event.index];
    if (p) {
      p.status = 'running';
    }
    return next;
  }

  if (event.type === 'step') {
    const p = next[event.index];
    if (!p) return next;
    p.status = 'running';
    const existing = p.steps.findIndex((s) => s.step === event.step);
    const step: BotStep = {
      step: event.step,
      label: event.label,
      detail: event.detail,
      status: event.status,
    };
    if (existing >= 0) {
      p.steps[existing] = step;
    } else {
      p.steps.push(step);
    }
    return next;
  }

  if (event.type === 'person_complete') {
    const p = next[event.index];
    if (p) {
      p.status = 'done';
      p.developer = event.developer;
    }
    return next;
  }

  if (event.type === 'person_failed') {
    const p = next[event.index];
    if (p) {
      p.status = 'error';
      p.error = event.error;
    }
    return next;
  }

  return next;
}

async function* readNdjsonStream(res: Response): AsyncGenerator<BotProgressEvent> {
  const reader = res.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      yield JSON.parse(trimmed) as BotProgressEvent;
    }
  }

  if (buffer.trim()) {
    yield JSON.parse(buffer.trim()) as BotProgressEvent;
  }
}

export default function DeveloperBotPage() {
  const qc = useQueryClient();
  const [count, setCount] = useState(5);
  const [countries, setCountries] = useState<string[]>([]);
  const [domains, setDomains] = useState<BotDomainId[]>([]);
  const [photoMode, setPhotoMode] = useState<PhotoMode>('none');
  const [imageProviders, setImageProviders] = useState<PortraitProviderId[]>([...DEFAULT_PORTRAIT_PROVIDERS]);
  const [verifiedOn, setVerifiedOn] = useState(true);
  const [unverifiedOn, setUnverifiedOn] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [progress, setProgress] = useState<PersonProgress[]>([]);
  const [batchTotal, setBatchTotal] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const { data: providerData, isLoading: providersLoading } = useQuery({
    queryKey: ['bot-portrait-providers'],
    queryFn: async () => {
      const res = await apiFetch('/owner/developers/bot/providers', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to load image providers');
      return (await res.json()) as { providers: PortraitProviderStatus[] };
    },
    retry: 1,
  });

  useQuery({
    queryKey: ['bot-password-sync'],
    queryFn: async () => {
      const res = await apiFetch('/owner/developers/bot/sync-passwords', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to sync bot passwords');
      return (await res.json()) as { updated: number; message: string };
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  useQuery({
    queryKey: ['developer-location-sync'],
    queryFn: async () => {
      const res = await apiFetch('/owner/developers/sync-locations', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to sync developer locations');
      return (await res.json()) as { updated: number; message: string };
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const fallbackProviders: PortraitProviderStatus[] = PORTRAIT_PROVIDERS.map((p) => ({
    id: p.id,
    label: p.label,
    description: p.description,
    worksWithoutKey: p.worksWithoutKey,
    apiKeyConfigured: false,
    available: true,
  }));

  const providerList = providerData?.providers?.length
    ? providerData.providers
    : fallbackProviders;

  const providersEnabled = photoMode === 'online';

  const toggleImageProvider = (id: PortraitProviderId) => {
    setImageProviders((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const providerBadge = (p: PortraitProviderStatus) => {
    if (p.apiKeyConfigured) return 'Live API';
    if (p.worksWithoutKey) return 'No key needed';
    return 'API key missing';
  };

  const toggleCountry = (name: string) => {
    setCountries((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name],
    );
  };

  const toggleDomain = (id: BotDomainId) => {
    setDomains((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id],
    );
  };

  const filteredCountries = COUNTRY_NAMES.filter((c) =>
    c.toLowerCase().includes(countrySearch.toLowerCase()),
  ).slice(0, 24);

  const generate = useCallback(async () => {
    const verifiedStatuses: boolean[] = [];
    if (verifiedOn) verifiedStatuses.push(true);
    if (unverifiedOn) verifiedStatuses.push(false);
    if (!verifiedStatuses.length) verifiedStatuses.push(false);

    if (photoMode === 'online' && !imageProviders.length) {
      toast({ title: 'Select at least one image provider', variant: 'destructive' });
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsPending(true);
    setResult(null);
    setBatchTotal(count);
    setProgress(initPersonProgress(count));

    try {
      const res = await apiFetch('/owner/developers/bot/stream', {
        method: 'POST',
        signal: controller.signal,
        body: JSON.stringify({
          count,
          countries: countries.length ? countries : undefined,
          domains: domains.length ? domains : undefined,
          photoMode,
          imageProviders: photoMode === 'online' && imageProviders.length ? imageProviders : undefined,
          verifiedStatuses,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message || 'Generation failed');
      }

      let finalCreated = 0;
      let finalErrors: string[] = [];
      const developers: GenerateResult['developers'] = [];

      for await (const event of readNdjsonStream(res)) {
        if (event.type === 'batch_start') {
          setBatchTotal(event.total);
        } else if (event.type === 'person_complete') {
          developers.push(event.developer);
        } else if (event.type === 'batch_complete') {
          finalCreated = event.created;
          finalErrors = event.errors;
        }

        setProgress((prev) => {
          if (event.type === 'batch_start') {
            return initPersonProgress(event.total);
          }
          const base = prev.length ? prev : initPersonProgress(batchTotal || count);
          return applyProgressEvent(base, event);
        });
      }

      const payload: GenerateResult = {
        message: `Created ${finalCreated} bot developer${finalCreated === 1 ? '' : 's'}`,
        created: finalCreated,
        developers,
        errors: finalErrors,
      };
      setResult(payload);
      qc.invalidateQueries({ queryKey: ['owner-devs'] });
      toast({ title: payload.message });
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
      const msg = e instanceof Error ? e.message : 'Failed to generate bots';
      toast({ title: msg, variant: 'destructive' });
    } finally {
      setIsPending(false);
      abortRef.current = null;
    }
  }, [count, countries, domains, photoMode, imageProviders, verifiedOn, unverifiedOn, batchTotal, qc]);

  const generateHomeCarousel = useCallback(async () => {
    const total = HOME_CAROUSEL_BOT_SPECS.length;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsPending(true);
    setResult(null);
    setBatchTotal(total);
    setProgress(initPersonProgress(total));

    try {
      const res = await apiFetch('/owner/developers/bot/home-carousel', {
        method: 'POST',
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message || 'Homepage import failed');
      }

      let finalCreated = 0;
      let finalErrors: string[] = [];
      const developers: GenerateResult['developers'] = [];
      let message = `Created ${finalCreated} homepage developer(s)`;

      for await (const event of readNdjsonStream(res)) {
        if (event.type === 'batch_start') {
          setBatchTotal(event.total);
        } else if (event.type === 'person_complete') {
          developers.push(event.developer);
        } else if (event.type === 'batch_complete') {
          finalCreated = event.created;
          finalErrors = event.errors;
          if ('message' in event && typeof event.message === 'string') {
            message = event.message;
          }
        }

        setProgress((prev) => {
          if (event.type === 'batch_start') {
            return initPersonProgress(event.total);
          }
          const base = prev.length ? prev : initPersonProgress(total);
          return applyProgressEvent(base, event);
        });
      }

      const payload: GenerateResult = {
        message,
        created: finalCreated,
        developers,
        errors: finalErrors,
      };
      setResult(payload);
      qc.invalidateQueries({ queryKey: ['owner-devs'] });
      toast({ title: message });
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
      const msg = e instanceof Error ? e.message : 'Failed to import homepage developers';
      toast({ title: msg, variant: 'destructive' });
    } finally {
      setIsPending(false);
      abortRef.current = null;
    }
  }, [qc]);

  const completedCount = progress.filter((p) => p.status === 'done').length;
  const runningPerson = progress.find((p) => p.status === 'running');

  return (
    <div className="max-w-3xl mx-auto pb-16">
      <Link
        href="/dashboard/owner/developers"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-felovy-red transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to developers
      </Link>

      <div className="flex items-start gap-4 mb-8">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-felovy-red to-felovy-purple flex items-center justify-center shadow-lg shadow-green-200 shrink-0">
          <Bot className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Developer Bot</h1>
          <p className="text-sm text-gray-500 mt-1 leading-relaxed">
            Generate realistic test developers in bulk. Names and photos match nationality & gender
            (via RandomUser). Summaries and work history are written by AI. No LinkedIn or GitHub links.
            Bot profiles are flagged for owners only. All bot accounts share the password{' '}
            <span className="font-mono text-gray-600">123456!</span>
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
        {/* Count */}
        <section className="p-6">
          <label className="text-sm font-semibold text-gray-900">How many?</label>
          <p className="text-xs text-gray-400 mt-0.5 mb-3">Create 1–50 developers per run</p>
          <div className="flex items-center gap-4">
            <Input
              type="number"
              min={1}
              max={50}
              value={count}
              onChange={(e) => setCount(Math.min(50, Math.max(1, Number(e.target.value) || 1)))}
              className="w-24 h-10"
              disabled={isPending}
            />
            <input
              type="range"
              min={1}
              max={50}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="flex-1 accent-felovy-red"
              disabled={isPending}
            />
            <span className="text-sm font-bold text-felovy-red w-8 text-right">{count}</span>
          </div>
        </section>

        {/* Countries */}
        <section className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <Globe className="h-4 w-4 text-felovy-red" />
            <label className="text-sm font-semibold text-gray-900">Countries</label>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            Select specific countries or leave empty for random global distribution
          </p>
          <Input
            value={countrySearch}
            onChange={(e) => setCountrySearch(e.target.value)}
            placeholder="Search countries…"
            className="h-9 mb-3 text-sm"
            disabled={isPending}
          />
          <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
            {filteredCountries.map((c) => (
              <Chip key={c} active={countries.includes(c)} label={c} onClick={() => !isPending && toggleCountry(c)} />
            ))}
          </div>
          {countries.length > 0 && (
            <button
              type="button"
              onClick={() => setCountries([])}
              className="text-xs text-gray-400 hover:text-felovy-red mt-2"
              disabled={isPending}
            >
              Clear countries (use random)
            </button>
          )}
        </section>

        {/* Domains */}
        <section className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-felovy-red" />
            <label className="text-sm font-semibold text-gray-900">Domains</label>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            Pick service domains for skills & titles, or leave empty for random
          </p>
          <div className="flex flex-wrap gap-2">
            {BOT_DOMAINS.map((d) => (
              <Chip
                key={d.id}
                active={domains.includes(d.id)}
                label={d.title}
                onClick={() => !isPending && toggleDomain(d.id)}
              />
            ))}
          </div>
          {domains.length > 0 && (
            <button
              type="button"
              onClick={() => setDomains([])}
              className="text-xs text-gray-400 hover:text-felovy-red mt-2"
              disabled={isPending}
            >
              Clear domains (use random)
            </button>
          )}
        </section>

        {/* Photos */}
        <section className="p-6">
          <label className="text-sm font-semibold text-gray-900">Profile photos</label>
          <p className="text-xs text-gray-400 mt-0.5 mb-3">Choose how bot avatars are set</p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => !isPending && setPhotoMode('none')}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                photoMode === 'none'
                  ? 'border-felovy-red bg-felovy-light text-felovy-red'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <ImageOff className="h-4 w-4" />
              No photo
            </button>
            <button
              type="button"
              onClick={() => !isPending && setPhotoMode('online')}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                photoMode === 'online'
                  ? 'border-felovy-red bg-felovy-light text-felovy-red'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <ImageIcon className="h-4 w-4" />
              Fetch online portraits
            </button>
          </div>

          <div className={`mt-5 pt-5 border-t border-gray-100 space-y-3 ${!providersEnabled ? 'opacity-80' : ''}`}>
            <div>
              <p className="text-sm font-semibold text-gray-900">Image providers</p>
              <p className="text-xs text-gray-400 mt-0.5 mb-3">
                {providersEnabled
                  ? 'Select one or more services — portraits are fetched from your selection only (no repeats per batch).'
                  : 'Select “Fetch online portraits” above to enable provider selection.'}
              </p>
              {providersLoading && (
                <p className="text-xs text-gray-400 mb-2 flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading provider status…
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {providerList.map((p) => (
                  <ProviderChip
                    key={p.id}
                    active={imageProviders.includes(p.id)}
                    label={p.label}
                    badge={providerBadge(p)}
                    disabled={!providersEnabled || isPending}
                    onClick={() => providersEnabled && !isPending && toggleImageProvider(p.id)}
                  />
                ))}
              </div>
              {providersEnabled && imageProviders.length > 0 && (
                <button
                  type="button"
                  onClick={() => setImageProviders([...DEFAULT_PORTRAIT_PROVIDERS])}
                  className="text-xs text-gray-400 hover:text-felovy-red mt-2"
                  disabled={isPending}
                >
                  Reset to defaults
                </button>
              )}
              {providersEnabled && !imageProviders.length && (
                <p className="text-xs text-amber-600 mt-2">Select at least one provider.</p>
              )}
            </div>
            {providersEnabled && (
              <p className="text-xs text-gray-400">
                Add <code className="text-[10px] bg-gray-100 px-1 rounded">PEXELS_API_KEY</code>,{' '}
                <code className="text-[10px] bg-gray-100 px-1 rounded">PIXABAY_API_KEY</code>, or{' '}
                <code className="text-[10px] bg-gray-100 px-1 rounded">UNSPLASH_ACCESS_KEY</code> to .env for live API search.
                Without keys, curated high-res pools are used for those providers.
              </p>
            )}
          </div>
        </section>

        {/* Verification */}
        <section className="p-6">
          <label className="text-sm font-semibold text-gray-900">Verification status</label>
          <p className="text-xs text-gray-400 mt-0.5 mb-3">
            Select one or both — when creating multiple, statuses rotate through your selection
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => !isPending && setVerifiedOn((v) => !v)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                verifiedOn
                  ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                  : 'border-gray-200 text-gray-500'
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              Verified
            </button>
            <button
              type="button"
              onClick={() => !isPending && setUnverifiedOn((v) => !v)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                unverifiedOn
                  ? 'border-amber-400 bg-amber-50 text-amber-700'
                  : 'border-gray-200 text-gray-500'
              }`}
            >
              <XCircle className="h-4 w-4" />
              Unverified
            </button>
          </div>
        </section>

        {/* Homepage carousel */}
        <section className="p-6 bg-gray-50/80">
          <label className="text-sm font-semibold text-gray-900">Homepage developers</label>
          <p className="text-xs text-gray-500 mt-0.5 mb-3 leading-relaxed">
            Create the {HOME_CAROUSEL_BOT_SPECS.length} developers shown on the first-page carousel
            (Leyla K., Chris M., Arjun P., …) as verified bot profiles with the same names, roles,
            countries, and <code className="text-[10px] bg-white px-1 rounded">public/dev</code> photos.
          </p>
          <Button
            variant="outline"
            size="lg"
            className="w-full gap-2 border-felovy-red/30 text-felovy-red hover:bg-felovy-light"
            disabled={isPending}
            onClick={() => generateHomeCarousel()}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Importing homepage developers…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Add homepage carousel developers ({HOME_CAROUSEL_BOT_SPECS.length})
              </>
            )}
          </Button>
        </section>

        {/* Action */}
        <section className="p-6">
          <Button
            variant="gradient"
            size="lg"
            className="w-full gap-2"
            disabled={isPending}
            onClick={() => generate()}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating {completedCount}/{batchTotal || count}…
                {runningPerson ? ` — Developer ${runningPerson.index + 1}` : ''}
              </>
            ) : (
              <>
                <Bot className="h-4 w-4" />
                Generate {count} bot developer{count === 1 ? '' : 's'}
              </>
            )}
          </Button>
        </section>
      </div>

      {(isPending || progress.length > 0) && (
        <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Creation progress</h2>
            {isPending && (
              <span className="text-xs text-felovy-red font-medium">
                {completedCount} of {batchTotal || count} complete
              </span>
            )}
          </div>
          <div className="space-y-3 max-h-[32rem] overflow-y-auto pr-1">
            {progress.map((person) => (
              <PersonStatusCard key={person.index} person={person} />
            ))}
          </div>
        </div>
      )}

      {result && !isPending && (
        <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Results</h2>
          <p className="text-sm text-emerald-600 font-medium mb-4">
            Created {result.created} of {batchTotal || count} requested
          </p>
          {result.errors.length > 0 && (
            <div className="text-xs text-red-600 space-y-1 mb-4">
              {result.errors.map((e) => (
                <p key={e}>{e}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
