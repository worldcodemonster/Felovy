'use client';

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/toaster';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { COUNTRY_NAMES } from '@/lib/countries';
import { OWNER_EMPLOYER_DEFAULT_PASSWORD } from '@/lib/employer-bot-constants';
import {
  ArrowLeft, Bot, Building2, Globe, Loader2, CheckCircle2, XCircle,
  Circle, AlertCircle, MinusCircle,
} from 'lucide-react';

type BotStepStatus = 'pending' | 'running' | 'done' | 'skipped' | 'error';

type BotStep = {
  step: string;
  label: string;
  detail?: string;
  status: BotStepStatus;
};

type CompanyProgress = {
  index: number;
  status: 'pending' | 'running' | 'done' | 'error';
  steps: BotStep[];
  employer?: { id: string; companyName: string; email: string; country: string; isVerified: boolean };
  error?: string;
};

type GenerateResult = {
  message: string;
  created: number;
  employers: { id: string; companyName: string; email: string; country: string; isVerified: boolean }[];
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
      employer: { id: string; companyName: string; email: string; country: string; isVerified: boolean };
    }
  | { type: 'person_failed'; index: number; error: string }
  | { type: 'batch_complete'; created: number; errors: string[] };

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

function CompanyStatusCard({ company }: { company: CompanyProgress }) {
  const border =
    company.status === 'running'
      ? 'border-felovy-red/40 ring-1 ring-felovy-red/20'
      : company.status === 'done'
        ? 'border-emerald-200'
        : company.status === 'error'
          ? 'border-red-200'
          : 'border-gray-100';

  return (
    <div className={`rounded-xl border bg-white p-4 transition-colors ${border}`}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {company.status === 'running' && <Loader2 className="h-4 w-4 animate-spin text-felovy-red shrink-0" />}
          {company.status === 'done' && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
          {company.status === 'error' && <XCircle className="h-4 w-4 text-red-500 shrink-0" />}
          {company.status === 'pending' && <Circle className="h-4 w-4 text-gray-300 shrink-0" />}
          <span className="text-sm font-semibold text-gray-900 truncate">
            Company {company.index + 1}
            {company.employer ? ` — ${company.employer.companyName}` : ''}
          </span>
        </div>
        {company.employer && (
          <Link
            href={`/dashboard/owner/employers/${company.employer.id}`}
            className="text-xs text-felovy-red hover:underline shrink-0"
          >
            View
          </Link>
        )}
      </div>

      {company.error && (
        <p className="text-xs text-red-600 mb-3 bg-red-50 rounded-lg px-3 py-2">{company.error}</p>
      )}

      <ul className="space-y-2">
        {company.steps.map((s) => (
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
        {company.status === 'pending' && company.steps.length === 0 && (
          <li className="text-xs text-gray-400">Waiting to start…</li>
        )}
      </ul>
    </div>
  );
}

function initCompanyProgress(total: number): CompanyProgress[] {
  return Array.from({ length: total }, (_, index) => ({
    index,
    status: 'pending' as const,
    steps: [],
  }));
}

function applyProgressEvent(companies: CompanyProgress[], event: BotProgressEvent): CompanyProgress[] {
  const next = companies.map((c) => ({ ...c, steps: [...c.steps] }));

  if (event.type === 'person_start') {
    const c = next[event.index];
    if (c) c.status = 'running';
    return next;
  }

  if (event.type === 'step') {
    const c = next[event.index];
    if (!c) return next;
    c.status = 'running';
    const existing = c.steps.findIndex((s) => s.step === event.step);
    const step: BotStep = {
      step: event.step,
      label: event.label,
      detail: event.detail,
      status: event.status,
    };
    if (existing >= 0) c.steps[existing] = step;
    else c.steps.push(step);
    return next;
  }

  if (event.type === 'person_complete') {
    const c = next[event.index];
    if (c) {
      c.status = 'done';
      c.employer = event.employer;
    }
    return next;
  }

  if (event.type === 'person_failed') {
    const c = next[event.index];
    if (c) {
      c.status = 'error';
      c.error = event.error;
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

export default function EmployerBotPage() {
  const qc = useQueryClient();
  const [count, setCount] = useState(10);
  const [countries, setCountries] = useState<string[]>([]);
  const [verifiedOn, setVerifiedOn] = useState(true);
  const [unverifiedOn, setUnverifiedOn] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [progress, setProgress] = useState<CompanyProgress[]>([]);
  const [batchTotal, setBatchTotal] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  useQuery({
    queryKey: ['employer-bot-password-sync'],
    queryFn: async () => {
      const res = await apiFetch('/owner/employers/bot/sync-passwords', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to sync bot passwords');
      return (await res.json()) as { updated: number; message: string };
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const toggleCountry = (name: string) => {
    setCountries((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name],
    );
  };

  const filteredCountries = COUNTRY_NAMES.filter((c) =>
    c.toLowerCase().includes(countrySearch.toLowerCase()),
  ).slice(0, 24);

  const generate = useCallback(async () => {
    const verifiedStatuses: boolean[] = [];
    if (verifiedOn) verifiedStatuses.push(true);
    if (unverifiedOn) verifiedStatuses.push(false);
    if (!verifiedStatuses.length) verifiedStatuses.push(true);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsPending(true);
    setResult(null);
    setBatchTotal(count);
    setProgress(initCompanyProgress(count));

    try {
      const res = await apiFetch('/owner/employers/bot/stream', {
        method: 'POST',
        signal: controller.signal,
        body: JSON.stringify({
          count,
          countries: countries.length ? countries : undefined,
          verifiedStatuses,
          password: OWNER_EMPLOYER_DEFAULT_PASSWORD,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message || 'Generation failed');
      }

      let finalCreated = 0;
      let finalErrors: string[] = [];
      const employers: GenerateResult['employers'] = [];

      for await (const event of readNdjsonStream(res)) {
        if (event.type === 'batch_start') {
          setBatchTotal(event.total);
        } else if (event.type === 'person_complete') {
          employers.push(event.employer);
        } else if (event.type === 'batch_complete') {
          finalCreated = event.created;
          finalErrors = event.errors;
        }

        setProgress((prev) => {
          if (event.type === 'batch_start') {
            return initCompanyProgress(event.total);
          }
          const base = prev.length ? prev : initCompanyProgress(batchTotal || count);
          return applyProgressEvent(base, event);
        });
      }

      const payload: GenerateResult = {
        message: `Created ${finalCreated} bot compan${finalCreated === 1 ? 'y' : 'ies'}`,
        created: finalCreated,
        employers,
        errors: finalErrors,
      };
      setResult(payload);
      qc.invalidateQueries({ queryKey: ['owner-emps'] });
      toast({ title: payload.message });
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
      const msg = e instanceof Error ? e.message : 'Failed to generate bot companies';
      toast({ title: msg, variant: 'destructive' });
    } finally {
      setIsPending(false);
      abortRef.current = null;
    }
  }, [count, countries, verifiedOn, unverifiedOn, batchTotal, qc]);

  const completedCount = progress.filter((p) => p.status === 'done').length;
  const runningCompany = progress.find((p) => p.status === 'running');

  return (
    <div className="max-w-3xl mx-auto pb-16">
      <Link
        href="/dashboard/owner/employers"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-felovy-red transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to employers
      </Link>

      <div className="flex items-start gap-4 mb-8">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-felovy-red to-felovy-purple flex items-center justify-center shadow-lg shadow-green-200 shrink-0">
          <Bot className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Company Bot</h1>
          <p className="text-sm text-gray-500 mt-1 leading-relaxed">
            Generate realistic test employer accounts in bulk. Each company gets a random name,
            contact person, location, and test email. Bot companies are flagged for owners only.
            All bot accounts share the password{' '}
            <span className="font-mono text-gray-600">{OWNER_EMPLOYER_DEFAULT_PASSWORD}</span>
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
        <section className="p-6">
          <label className="text-sm font-semibold text-gray-900">How many?</label>
          <p className="text-xs text-gray-400 mt-0.5 mb-3">Create 1–50 companies per run</p>
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
                {runningCompany ? ` — Company ${runningCompany.index + 1}` : ''}
              </>
            ) : (
              <>
                <Building2 className="h-4 w-4" />
                Generate {count} bot compan{count === 1 ? 'y' : 'ies'}
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
            {progress.map((company) => (
              <CompanyStatusCard key={company.index} company={company} />
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
