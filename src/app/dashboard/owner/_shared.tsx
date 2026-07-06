'use client';

import { type ReactNode, useEffect, useRef, useState } from 'react';
import React from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Developer, Employer } from '@/types';
import { countryToFlagUrl, COUNTRY_NAMES } from '@/lib/countries';
import {
  Check, CheckCircle, ChevronLeft, ChevronRight, ChevronDown,
  MapPin, Search, Clock, AlertTriangle, Globe,
  UserX, UserCheck, Ban, VolumeX, Volume2, Calendar,
  BadgeCheck, BadgeMinus,
} from 'lucide-react';

function formatJoinDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const STATUS_MAP: Record<string, string> = {
  mute: 'MUTED', unmute: 'ACTIVE', ban: 'BANNED', unban: 'ACTIVE',
};

// ─── Confirm dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({
  title, desc, destructive, onConfirm, onCancel,
}: {
  title: string;
  desc: string;
  destructive: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.28)] max-w-xs w-full p-8 flex flex-col items-center text-center"
        onClick={e => e.stopPropagation()}
      >
        <div className={`h-16 w-16 rounded-2xl flex items-center justify-center mb-5 ${
          destructive
            ? 'bg-red-50 ring-8 ring-red-50/60 shadow-lg shadow-red-100'
            : 'bg-emerald-50 ring-8 ring-emerald-50/60 shadow-lg shadow-emerald-100'
        }`}>
          {destructive
            ? <AlertTriangle className="h-7 w-7 text-red-500" />
            : <CheckCircle className="h-7 w-7 text-emerald-500" />}
        </div>
        <h3 className="text-[17px] font-bold text-gray-900 mb-2 leading-tight">{title}</h3>
        <p className="text-sm text-gray-500 leading-relaxed mb-7">{desc}</p>
        <div className="flex gap-2.5 w-full">
          <button
            onClick={onCancel}
            className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 h-11 rounded-xl text-sm font-semibold text-white transition-colors ${
              destructive
                ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200'
                : 'bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-200'
            }`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ─── Primitives ───────────────────────────────────────────────────────────────

export function Bone({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-gray-100 ${className}`} />;
}

export function StatusDot({ status }: { status: string }) {
  const cfg: Record<string, { dot: string; bg: string; text: string; label: string }> = {
    ACTIVE:  { dot: 'bg-emerald-400', bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Active' },
    MUTED:   { dot: 'bg-amber-400',   bg: 'bg-amber-50',   text: 'text-amber-700',   label: 'Muted' },
    BANNED:  { dot: 'bg-red-400',     bg: 'bg-red-50',     text: 'text-red-600',     label: 'Banned' },
  };
  const s = cfg[status] ?? { dot: 'bg-gray-300', bg: 'bg-gray-50', text: 'text-gray-500', label: status };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${s.bg}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot} shrink-0`} />
      <span className={`text-[11px] font-semibold tracking-wide uppercase ${s.text}`}>{s.label}</span>
    </span>
  );
}

function SmallStatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { dot: string; bg: string; text: string; label: string }> = {
    ACTIVE:  { dot: 'bg-emerald-400', bg: 'bg-white/95 ring-1 ring-emerald-200', text: 'text-emerald-700', label: 'Active' },
    MUTED:   { dot: 'bg-amber-400',   bg: 'bg-white/95 ring-1 ring-amber-200',   text: 'text-amber-700',   label: 'Muted'  },
    BANNED:  { dot: 'bg-red-400',     bg: 'bg-white/95 ring-1 ring-red-200',     text: 'text-red-600',     label: 'Banned' },
  };
  const s = cfg[status] ?? { dot: 'bg-gray-300', bg: 'bg-white/95 ring-1 ring-gray-200', text: 'text-gray-500', label: status };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-[3px] shadow-sm ${s.bg}`}>
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${s.dot}`} />
      <span className={`text-[10px] font-semibold ${s.text}`}>{s.label}</span>
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE:   'bg-emerald-50 text-emerald-700 ring-emerald-200',
    MUTED:    'bg-amber-50 text-amber-700 ring-amber-200',
    BANNED:   'bg-red-50 text-red-600 ring-red-200',
    APPROVED: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    PENDING:  'bg-amber-50 text-amber-700 ring-amber-200',
    REJECTED: 'bg-red-50 text-red-600 ring-red-200',
    DISABLED: 'bg-gray-50 text-gray-500 ring-gray-200',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${map[status] ?? 'bg-gray-50 text-gray-500 ring-gray-200'}`}>
      {status}
    </span>
  );
}

export function UserAvatar({
  src, name, gradient, size = 88, shape = 'circle',
}: {
  src?: string | null;
  name: string;
  gradient: string;
  size?: number;
  shape?: 'circle' | 'square';
}) {
  const rounded = shape === 'square' ? 'rounded-[18px]' : 'rounded-full';
  const initial = (name[0] ?? '?').toUpperCase();
  const fontSize = size >= 80 ? 'text-3xl' : 'text-base';
  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={size}
        height={size}
        className={`${rounded} object-cover`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className={`${rounded} ${gradient} flex items-center justify-center text-white font-black select-none ${fontSize}`}
      style={{ width: size, height: size }}
    >
      {initial}
    </div>
  );
}

export function SkillChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-md bg-slate-50 border border-slate-200/80 px-2 py-0.5 text-[11px] font-medium text-slate-600 leading-none">
      {label}
    </span>
  );
}

export function CompletionBar({ step, total }: { step: number; total: number }) {
  const pct = Math.round((step / total) * 100);
  const color = pct === 100 ? 'from-emerald-400 to-emerald-500' : pct >= 75 ? 'from-blue-400 to-indigo-500' : pct >= 50 ? 'from-amber-400 to-orange-400' : 'from-gray-300 to-gray-400';
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] text-gray-400 font-medium">Profile completion</span>
        <span className="text-[11px] font-bold text-gray-600">{pct}%</span>
      </div>
      <div className="h-[5px] w-full bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function Pagination({ page, total, limit, onChange }: {
  page: number; total: number; limit: number; onChange: (p: number) => void;
}) {
  const pages = Math.ceil(total / limit);
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-6">
      <span className="text-xs text-gray-400">{total} total</span>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" className="h-8 w-8 p-0 rounded-lg" disabled={page === 1} onClick={() => onChange(page - 1)}>
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <span className="text-xs font-medium text-gray-600 tabular-nums">{page} / {pages}</span>
        <Button size="sm" variant="outline" className="h-8 w-8 p-0 rounded-lg" disabled={page === pages} onClick={() => onChange(page + 1)}>
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

const STATUS_OPTIONS: { value: string; label: string; dot?: string }[] = [
  { value: '',        label: 'All' },
  { value: 'ACTIVE',  label: 'Active',  dot: 'bg-emerald-400' },
  { value: 'MUTED',   label: 'Muted',   dot: 'bg-amber-400'   },
  { value: 'BANNED',  label: 'Banned',  dot: 'bg-red-400'     },
];

function CountryFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = search.trim()
    ? COUNTRY_NAMES.filter(c => c.toLowerCase().includes(search.toLowerCase()))
    : COUNTRY_NAMES;

  const flagUrl = value ? countryToFlagUrl(value) : '';

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`h-9 inline-flex items-center gap-2 rounded-lg border bg-white px-3 text-sm transition-colors ${
          value ? 'border-felovy-red text-gray-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
        }`}
      >
        {value && flagUrl ? (
          <img src={flagUrl} alt={value} width={18} height={13} className="rounded-[2px] object-cover shadow-sm shrink-0" />
        ) : (
          <Globe className="h-3.5 w-3.5 text-gray-400 shrink-0" />
        )}
        <span className="max-w-[110px] truncate">{value || 'Country'}</span>
        <ChevronDown className={`h-3 w-3 text-gray-400 shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1.5 z-50 bg-white rounded-xl border border-gray-200 shadow-xl w-60 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search country…"
                className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-felovy-red"
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto">
            {!search && (
              <button
                type="button"
                onClick={() => { onChange(''); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                  !value ? 'bg-felovy-light text-felovy-red font-semibold' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Globe className="h-4 w-4 text-gray-300 shrink-0" />
                All Countries
              </button>
            )}
            {filtered.map(c => (
              <button
                type="button"
                key={c}
                onClick={() => { onChange(c); setOpen(false); setSearch(''); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                  value === c ? 'bg-felovy-light text-felovy-red font-semibold' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {countryToFlagUrl(c) && (
                  <img src={countryToFlagUrl(c)} alt={c} width={18} height={13} className="rounded-[2px] object-cover shadow-sm shrink-0" />
                )}
                <span>{c}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No countries found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function FilterBar({
  icon: Icon, title, search, onSearch, filter, onFilter, options,
  status, onStatus, country, onCountry,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  search: string;
  onSearch: (v: string) => void;
  filter: string;
  onFilter: (v: string) => void;
  options: { value: string; label: string }[];
  status?: string;
  onStatus?: (v: string) => void;
  country?: string;
  onCountry?: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <div className="flex items-center gap-2 shrink-0">
        <div className="h-8 w-8 rounded-lg bg-felovy-light flex items-center justify-center">
          <Icon className="h-4 w-4 text-felovy-red" />
        </div>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          <Input
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder="Search…"
            className="pl-9 h-9 w-44 rounded-lg bg-white border-gray-200 text-sm focus-visible:ring-felovy-red"
          />
        </div>

        {onStatus && (
          <div className="flex items-center gap-1">
            {STATUS_OPTIONS.map(s => (
              <button
                key={s.value}
                type="button"
                onClick={() => onStatus(s.value)}
                className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-medium border transition-all duration-150 ${
                  status === s.value
                    ? 'bg-gray-900 border-gray-900 text-white'
                    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {s.dot && <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${s.dot}`} />}
                {s.label}
              </button>
            ))}
          </div>
        )}

        <select
          value={filter}
          onChange={e => onFilter(e.target.value)}
          className="h-9 rounded-lg border border-gray-200 bg-white px-3 pr-8 text-sm text-gray-600 focus:outline-none focus:ring-1 focus:ring-felovy-red appearance-none cursor-pointer"
        >
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {onCountry && (
          <CountryFilter value={country ?? ''} onChange={onCountry} />
        )}
      </div>
    </div>
  );
}

export function ActionIcon({
  children, title, onClick, colorClass,
}: {
  children: ReactNode;
  title: string;
  onClick: () => void;
  colorClass: string;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`h-[30px] w-[30px] rounded-lg border bg-white flex items-center justify-center transition-all duration-150 active:scale-95 ${colorClass}`}
    >
      {children}
    </button>
  );
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

export function DeveloperCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/70 shadow-[0_2px_12px_rgba(0,0,0,0.05)] flex flex-col overflow-hidden">
      <div className="flex flex-col items-center px-6 pt-8 pb-5 gap-3">
        <Bone className="h-[88px] w-[88px] rounded-full" />
        <div className="flex flex-col items-center gap-2 w-full">
          <Bone className="h-[18px] w-32" />
          <Bone className="h-3.5 w-24" />
          <Bone className="h-3 w-28" />
          <Bone className="h-7 w-20 rounded-full" />
        </div>
      </div>
      <div className="px-6 pb-5 flex flex-col gap-4">
        <div className="w-full space-y-2">
          <div className="flex justify-between">
            <Bone className="h-3 w-28" />
            <Bone className="h-3 w-8" />
          </div>
          <Bone className="h-[5px] w-full rounded-full" />
        </div>
        <div className="space-y-1.5">
          <Bone className="h-3 w-full" />
          <Bone className="h-3 w-4/5" />
        </div>
        <div className="flex gap-1.5">
          <Bone className="h-6 w-14 rounded-md" />
          <Bone className="h-6 w-16 rounded-md" />
          <Bone className="h-6 w-12 rounded-md" />
        </div>
      </div>
      <div className="mt-auto px-5 py-3.5 border-t border-gray-100 flex items-center justify-between bg-gray-50/40">
        <Bone className="h-4 w-24" />
        <div className="flex gap-1">
          <Bone className="h-[30px] w-[30px] rounded-lg" />
          <Bone className="h-[30px] w-[30px] rounded-lg" />
          <Bone className="h-[30px] w-[30px] rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function EmployerCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/70 shadow-[0_2px_12px_rgba(0,0,0,0.05)] flex flex-col overflow-hidden">
      <div className="flex flex-col items-center px-6 pt-8 pb-5 gap-3">
        <Bone className="h-[88px] w-[88px] rounded-[18px]" />
        <div className="flex flex-col items-center gap-2 w-full">
          <Bone className="h-[18px] w-32" />
          <Bone className="h-3.5 w-40" />
          <Bone className="h-3 w-28" />
          <Bone className="h-7 w-16 rounded-full" />
        </div>
      </div>
      <div className="px-6 pb-5 flex flex-col gap-3">
        <div className="w-full space-y-2">
          <div className="flex justify-between">
            <Bone className="h-3 w-28" />
            <Bone className="h-3 w-8" />
          </div>
          <Bone className="h-[5px] w-full rounded-full" />
        </div>
        <div className="space-y-1.5">
          <Bone className="h-3 w-full" />
          <Bone className="h-3 w-3/4" />
        </div>
        <div className="flex gap-1.5">
          <Bone className="h-6 w-24 rounded-md" />
          <Bone className="h-6 w-20 rounded-md" />
        </div>
      </div>
      <div className="mt-auto px-5 py-3.5 border-t border-gray-100 flex items-center justify-between bg-gray-50/40">
        <Bone className="h-4 w-16" />
        <div className="flex gap-1">
          <Bone className="h-[30px] w-[30px] rounded-lg" />
          <Bone className="h-[30px] w-[30px] rounded-lg" />
          <Bone className="h-[30px] w-[30px] rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// ─── Cards ────────────────────────────────────────────────────────────────────

function getCardTheme(status: string, isVerified: boolean) {
  if (status === 'BANNED') return {
    card:   'border-red-300 hover:shadow-[0_12px_40px_rgba(239,68,68,0.25)]',
    header: 'bg-gradient-to-b from-red-100/90 to-red-50/30',
    ring:   'ring-red-400',
    footer: 'border-red-200 bg-red-50',
  };
  if (status === 'MUTED') return {
    card:   'border-amber-300 hover:shadow-[0_12px_40px_rgba(245,158,11,0.25)]',
    header: 'bg-gradient-to-b from-amber-100/90 to-amber-50/30',
    ring:   'ring-amber-400',
    footer: 'border-amber-200 bg-amber-50',
  };
  if (isVerified) return {
    card:   'border-emerald-300 hover:shadow-[0_12px_40px_rgba(16,185,129,0.25)]',
    header: 'bg-gradient-to-b from-emerald-100/80 to-emerald-50/20',
    ring:   'ring-emerald-400',
    footer: 'border-emerald-200 bg-emerald-50',
  };
  return {
    card:   'border-gray-200/70 hover:shadow-[0_12px_40px_rgba(0,0,0,0.13)]',
    header: '',
    ring:   'ring-white',
    footer: 'border-gray-100 bg-gray-50/40',
  };
}

type PendingConfirm = {
  title: string;
  desc: string;
  destructive: boolean;
  onConfirm: () => void;
};

export function DeveloperCard({
  dev, onVerify, onModerate,
}: {
  dev: Developer;
  onVerify: (id: string, approved: boolean) => void;
  onModerate: (userId: string, action: string) => void;
}) {
  const status = dev.user?.status ?? 'ACTIVE';
  const name   = dev.fullName || dev.user?.email || 'Developer';
  const router = useRouter();
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const theme = getCardTheme(status, dev.isVerified);

  const ask = (title: string, desc: string, destructive: boolean, onConfirm: () => void) =>
    setPending({ title, desc, destructive, onConfirm });

  return (
    <>
      <div className="relative group cursor-pointer hover:-translate-y-1.5 transition-all duration-250">
        <div className="absolute top-2.5 right-2.5 z-20" onClick={e => e.stopPropagation()}>
          <SmallStatusBadge status={status} />
        </div>
        <div
          onClick={() => router.push(`/dashboard/owner/developers/${dev.id}`)}
          className={`bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.05)] flex flex-col overflow-hidden border ${theme.card}`}
        >
        <div className={`flex flex-col items-center px-6 pt-8 pb-5 ${theme.header}`}>
          <div className="relative mb-2">
            <div className={`rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.14)] ring-1 overflow-hidden ${theme.ring}`}>
              <UserAvatar
                src={dev.photoUrl}
                name={name}
                gradient="bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600"
                size={88}
              />
            </div>
            <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap z-10">
              {dev.isVerified ? (
                <span className="inline-flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-bold tracking-wider px-2.5 py-[3px] rounded-full shadow-md shadow-emerald-200 uppercase">
                  <Check className="h-2.5 w-2.5 stroke-[3]" /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-white text-amber-500 text-[10px] font-semibold tracking-wider px-2.5 py-[3px] rounded-full border border-amber-200 shadow-sm uppercase">
                  <Clock className="h-2.5 w-2.5" /> Pending
                </span>
              )}
            </div>
          </div>

          <div className="h-4" />

          <Link href={`/dashboard/owner/developers/${dev.id}`} className="group/name mt-1 text-center" onClick={e => e.stopPropagation()}>
            <h3 className="text-[17px] font-bold text-gray-900 group-hover/name:text-felovy-red transition-colors leading-tight line-clamp-1">
              {name}
            </h3>
          </Link>

          {dev.title ? (
            <p className="text-[13px] text-gray-500 mt-1 line-clamp-1 text-center">{dev.title}</p>
          ) : (
            <p className="text-[13px] text-gray-400 mt-1">Developer</p>
          )}

          <div className="flex flex-col items-center gap-1 mt-2.5">
            {(dev.country || dev.location) && (
              <span className="flex items-center gap-1.5 text-[12px] text-gray-500 max-w-[180px]">
                {dev.country && countryToFlagUrl(dev.country) && (
                  <img src={countryToFlagUrl(dev.country)} alt={dev.country} width={20} height={15} className="rounded-[2px] object-cover shadow-sm shrink-0" />
                )}
                <span className="line-clamp-1">{dev.location || dev.country}</span>
              </span>
            )}
            <span className="text-[11px] text-gray-300 truncate max-w-[180px]">{dev.user?.email}</span>
          </div>
        </div>

        <div className="px-6 pb-5 flex flex-col gap-4 flex-1">
          <CompletionBar step={dev.profileStep} total={4} />

          {dev.summary && (
            <p className="text-[12px] text-gray-400 leading-[1.7] line-clamp-2">
              {dev.summary}
            </p>
          )}

          {dev.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {dev.skills.slice(0, 4).map(s => <SkillChip key={s} label={s} />)}
              {dev.skills.length > 4 && (
                <span className="text-[11px] text-gray-400 self-center font-medium">+{dev.skills.length - 4} more</span>
              )}
            </div>
          )}
        </div>

        <div className={`mt-auto px-5 py-3.5 flex items-center justify-between gap-2 border-t ${theme.footer}`}>
          <div className="flex flex-col gap-0.5 min-w-0">
            {dev.user?.createdAt && (
              <span className="flex items-center gap-1 text-[10px] text-gray-400">
                <Calendar className="h-2.5 w-2.5 shrink-0" />
                Joined {formatJoinDate(dev.user.createdAt)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
            {dev.isVerified ? (
              <ActionIcon
                title="Revoke verification"
                onClick={() => ask('Revoke Verification', `Remove the Verified badge from ${name}?`, false, () => onVerify(dev.id, false))}
                colorClass="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
              >
                <BadgeCheck className="h-3.5 w-3.5" />
              </ActionIcon>
            ) : (
              <ActionIcon
                title="Verify profile"
                onClick={() => ask('Verify Profile', `Grant the Verified badge to ${name}?`, false, () => onVerify(dev.id, true))}
                colorClass="text-gray-400 border-gray-200 hover:bg-gray-50"
              >
                <BadgeMinus className="h-3.5 w-3.5" />
              </ActionIcon>
            )}

            {status === 'MUTED' ? (
              <ActionIcon
                title="Unmute"
                onClick={() => ask('Unmute Developer', `Restore ${name}'s ability to interact on the platform?`, false, () => onModerate(dev.userId, 'unmute'))}
                colorClass="text-amber-500 border-amber-200 hover:bg-amber-50"
              >
                <VolumeX className="h-3.5 w-3.5" />
              </ActionIcon>
            ) : (
              <ActionIcon
                title="Mute"
                onClick={() => ask('Mute Developer', `Mute ${name} from interacting on the platform?`, false, () => onModerate(dev.userId, 'mute'))}
                colorClass="text-gray-400 border-gray-200 hover:bg-gray-50"
              >
                <Volume2 className="h-3.5 w-3.5" />
              </ActionIcon>
            )}

            <ActionIcon
              title="Kick"
              onClick={() => ask('Kick Developer', `Permanently delete ${name}'s account and all their data? This cannot be undone.`, true, () => onModerate(dev.userId, 'kick'))}
              colorClass="text-orange-500 border-orange-200 hover:bg-orange-50"
            >
              <UserX className="h-3.5 w-3.5" />
            </ActionIcon>

            {status === 'BANNED' ? (
              <ActionIcon
                title="Unban"
                onClick={() => ask('Unban Developer', `Lift the ban on ${name} and restore their access?`, false, () => onModerate(dev.userId, 'unban'))}
                colorClass="text-red-500 border-red-200 hover:bg-red-50"
              >
                <Ban className="h-3.5 w-3.5" />
              </ActionIcon>
            ) : (
              <ActionIcon
                title="Ban"
                onClick={() => ask('Ban Developer', `Ban ${name} from the platform? They will be unable to log in.`, true, () => onModerate(dev.userId, 'ban'))}
                colorClass="text-gray-400 border-gray-200 hover:bg-gray-50"
              >
                <UserCheck className="h-3.5 w-3.5" />
              </ActionIcon>
            )}
          </div>
        </div>
        </div>
      </div>

      {pending && (
        <ConfirmDialog
          title={pending.title}
          desc={pending.desc}
          destructive={pending.destructive}
          onConfirm={() => { pending.onConfirm(); setPending(null); }}
          onCancel={() => setPending(null)}
        />
      )}
    </>
  );
}

export function EmployerCard({
  emp, onVerify, onModerate,
}: {
  emp: Employer;
  onVerify: (id: string, approved: boolean) => void;
  onModerate: (userId: string, action: string) => void;
}) {
  const status = emp.user?.status ?? 'ACTIVE';
  const name   = emp.companyName || emp.user?.email || 'Company';
  const router = useRouter();
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const theme = getCardTheme(status, emp.isVerified);

  const ask = (title: string, desc: string, destructive: boolean, onConfirm: () => void) =>
    setPending({ title, desc, destructive, onConfirm });

  return (
    <>
      <div className="relative group cursor-pointer hover:-translate-y-1.5 transition-all duration-250">
        <div className="absolute top-2.5 right-2.5 z-20" onClick={e => e.stopPropagation()}>
          <SmallStatusBadge status={status} />
        </div>
        <div
          onClick={() => router.push(`/dashboard/owner/employers/${emp.id}`)}
          className={`bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.05)] flex flex-col overflow-hidden border ${theme.card}`}
        >
        <div className={`flex flex-col items-center px-6 pt-8 pb-5 ${theme.header}`}>
          <div className="relative mb-2">
            <div className={`shadow-[0_4px_16px_rgba(0,0,0,0.14)] ring-4 overflow-hidden rounded-[18px] ${theme.ring}`}>
              <UserAvatar
                src={emp.companyLogoUrl}
                name={name}
                gradient="bg-gradient-to-br from-purple-500 via-fuchsia-500 to-pink-500"
                size={88}
                shape="square"
              />
            </div>
            <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap z-10">
              {emp.isVerified ? (
                <span className="inline-flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-bold tracking-wider px-2.5 py-[3px] rounded-full shadow-md shadow-emerald-200 uppercase">
                  <Check className="h-2.5 w-2.5 stroke-[3]" /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-white text-amber-500 text-[10px] font-semibold tracking-wider px-2.5 py-[3px] rounded-full border border-amber-200 shadow-sm uppercase">
                  <Clock className="h-2.5 w-2.5" /> Pending
                </span>
              )}
            </div>
          </div>

          <div className="h-4" />

          <Link href={`/dashboard/owner/employers/${emp.id}`} className="group/name mt-1 text-center" onClick={e => e.stopPropagation()}>
            <h3 className="text-[17px] font-bold text-gray-900 group-hover/name:text-felovy-red transition-colors leading-tight line-clamp-1">
              {name}
            </h3>
          </Link>

          {emp.contactName && (
            <p className="text-[13px] text-gray-500 mt-1 line-clamp-1 text-center">
              {emp.contactName}{emp.contactRole ? ` · ${emp.contactRole}` : ''}
            </p>
          )}

          <div className="flex flex-col items-center gap-1 mt-2.5">
            {(emp.country || emp.companyLocation) && (
              <span className="flex items-center gap-1.5 text-[12px] text-gray-500 max-w-[180px]">
                {emp.country && countryToFlagUrl(emp.country) && (
                  <img src={countryToFlagUrl(emp.country)} alt={emp.country} width={20} height={15} className="rounded-[2px] object-cover shadow-sm shrink-0" />
                )}
                <span className="line-clamp-1">{emp.companyLocation || emp.country}</span>
              </span>
            )}
            <span className="text-[11px] text-gray-300 truncate max-w-[180px]">{emp.user?.email}</span>
          </div>
        </div>

        <div className="px-6 pb-5 flex flex-col gap-3 flex-1">
          <CompletionBar step={emp.profileStep} total={4} />

          {emp.companySummary && (
            <p className="text-[12px] text-gray-400 leading-[1.7] line-clamp-2">
              {emp.companySummary}
            </p>
          )}

          <div className="flex flex-wrap gap-1.5">
            {emp.companySize && <SkillChip label={`${emp.companySize} employees`} />}
            {emp.companyWebsite && <SkillChip label="Has website" />}
          </div>
        </div>

        <div className={`mt-auto px-5 py-3.5 flex items-center justify-between gap-2 border-t ${theme.footer}`}>
          <div className="flex flex-col gap-0.5 min-w-0">
            {emp.user?.createdAt && (
              <span className="flex items-center gap-1 text-[10px] text-gray-400">
                <Calendar className="h-2.5 w-2.5 shrink-0" />
                Joined {formatJoinDate(emp.user.createdAt)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
            {emp.isVerified ? (
              <ActionIcon
                title="Revoke verification"
                onClick={() => ask('Revoke Verification', `Remove the Verified badge from ${name}?`, false, () => onVerify(emp.id, false))}
                colorClass="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
              >
                <BadgeCheck className="h-3.5 w-3.5" />
              </ActionIcon>
            ) : (
              <ActionIcon
                title="Verify company"
                onClick={() => ask('Verify Company', `Grant the Verified badge to ${name}?`, false, () => onVerify(emp.id, true))}
                colorClass="text-gray-400 border-gray-200 hover:bg-gray-50"
              >
                <BadgeMinus className="h-3.5 w-3.5" />
              </ActionIcon>
            )}

            {status === 'MUTED' ? (
              <ActionIcon
                title="Unmute"
                onClick={() => ask('Unmute Employer', `Restore ${name}'s ability to interact on the platform?`, false, () => onModerate(emp.userId, 'unmute'))}
                colorClass="text-amber-500 border-amber-200 hover:bg-amber-50"
              >
                <VolumeX className="h-3.5 w-3.5" />
              </ActionIcon>
            ) : (
              <ActionIcon
                title="Mute"
                onClick={() => ask('Mute Employer', `Mute ${name} from interacting on the platform?`, false, () => onModerate(emp.userId, 'mute'))}
                colorClass="text-gray-400 border-gray-200 hover:bg-gray-50"
              >
                <Volume2 className="h-3.5 w-3.5" />
              </ActionIcon>
            )}

            <ActionIcon
              title="Kick"
              onClick={() => ask('Kick Employer', `Permanently delete ${name}'s account and all their data? This cannot be undone.`, true, () => onModerate(emp.userId, 'kick'))}
              colorClass="text-orange-500 border-orange-200 hover:bg-orange-50"
            >
              <UserX className="h-3.5 w-3.5" />
            </ActionIcon>

            {status === 'BANNED' ? (
              <ActionIcon
                title="Unban"
                onClick={() => ask('Unban Employer', `Lift the ban on ${name} and restore their access?`, false, () => onModerate(emp.userId, 'unban'))}
                colorClass="text-red-500 border-red-200 hover:bg-red-50"
              >
                <Ban className="h-3.5 w-3.5" />
              </ActionIcon>
            ) : (
              <ActionIcon
                title="Ban"
                onClick={() => ask('Ban Employer', `Ban ${name} from the platform? They will be unable to log in.`, true, () => onModerate(emp.userId, 'ban'))}
                colorClass="text-gray-400 border-gray-200 hover:bg-gray-50"
              >
                <UserCheck className="h-3.5 w-3.5" />
              </ActionIcon>
            )}
          </div>
        </div>
        </div>
      </div>

      {pending && (
        <ConfirmDialog
          title={pending.title}
          desc={pending.desc}
          destructive={pending.destructive}
          onConfirm={() => { pending.onConfirm(); setPending(null); }}
          onCancel={() => setPending(null)}
        />
      )}
    </>
  );
}

const EMP_TABLE_COLS = ['Company', 'Contact', 'Location', 'Status', 'Verified', 'Profile', 'Joined', 'Actions'];

export function EmployerTableSkeleton() {
  return (
    <tr>
      {EMP_TABLE_COLS.map(col => (
        <td key={col} className="px-4 py-3.5">
          <div className="h-4 bg-gray-100 rounded-md animate-pulse" />
        </td>
      ))}
    </tr>
  );
}

export function EmployerRow({
  emp, onVerify, onModerate,
}: {
  emp: Employer;
  onVerify: (id: string, approved: boolean) => void;
  onModerate: (userId: string, action: string) => void;
}) {
  const status = emp.user?.status ?? 'ACTIVE';
  const name   = emp.companyName || emp.user?.email || 'Company';
  const router = useRouter();
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const ask = (title: string, desc: string, destructive: boolean, onConfirm: () => void) =>
    setPending({ title, desc, destructive, onConfirm });

  const statusStyle: Record<string, string> = {
    ACTIVE: 'bg-emerald-50 text-emerald-700',
    MUTED:  'bg-amber-50 text-amber-700',
    BANNED: 'bg-red-50 text-red-700',
  };

  return (
    <>
      <tr
        className="hover:bg-gray-50/60 cursor-pointer transition-colors group"
        onClick={() => router.push(`/dashboard/owner/employers/${emp.id}`)}
      >
        {/* Company */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="shrink-0 h-10 w-10 rounded-xl overflow-hidden shadow-sm ring-1 ring-black/5 flex items-center justify-center bg-gradient-to-br from-purple-500 via-fuchsia-500 to-pink-500">
              {emp.companyLogoUrl ? (
                <img
                  src={emp.companyLogoUrl}
                  alt={name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-white font-black text-base select-none">
                  {(name[0] ?? '?').toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 group-hover:text-felovy-red transition-colors truncate">{name}</p>
              <p className="text-[11px] text-gray-400 truncate">{emp.user?.email}</p>
            </div>
          </div>
        </td>

        {/* Contact */}
        <td className="px-4 py-3">
          {emp.contactName ? (
            <div className="min-w-0">
              <p className="text-[13px] text-gray-700 truncate">{emp.contactName}</p>
              {emp.contactRole && <p className="text-[11px] text-gray-400 truncate">{emp.contactRole}</p>}
            </div>
          ) : (
            <span className="text-[12px] text-gray-300">EMDASH</span>
          )}
        </td>

        {/* Location */}
        <td className="px-4 py-3">
          {(emp.country || emp.companyLocation) ? (
            <span className="flex items-center gap-1.5 text-[12px] text-gray-600">
              {emp.country && countryToFlagUrl(emp.country) && (
                <img src={countryToFlagUrl(emp.country)} alt={emp.country} width={18} height={14} className="rounded-[2px] object-cover shadow-sm shrink-0" />
              )}
              <span className="truncate max-w-[120px]">{emp.companyLocation || emp.country}</span>
            </span>
          ) : (
            <span className="text-[12px] text-gray-300">EMDASH</span>
          )}
        </td>

        {/* Status */}
        <td className="px-4 py-3">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${statusStyle[status] ?? statusStyle.ACTIVE}`}>
            {status.charAt(0) + status.slice(1).toLowerCase()}
          </span>
        </td>

        {/* Verified */}
        <td className="px-4 py-3">
          {emp.isVerified ? (
            <span className="inline-flex items-center gap-1 text-[12px] font-medium text-emerald-600">
              <CheckCircle className="h-3.5 w-3.5" /> Verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[12px] text-amber-500">
              <Clock className="h-3.5 w-3.5" /> Pending
            </span>
          )}
        </td>

        {/* Profile completion */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-felovy-red rounded-full" style={{ width: `${(emp.profileStep / 4) * 100}%` }} />
            </div>
            <span className="text-[11px] text-gray-400 shrink-0">{emp.profileStep}/4</span>
          </div>
        </td>

        {/* Joined */}
        <td className="px-4 py-3">
          {emp.user?.createdAt ? (
            <span className="text-[12px] text-gray-400 whitespace-nowrap">{formatJoinDate(emp.user.createdAt)}</span>
          ) : (
            <span className="text-[12px] text-gray-300">EMDASH</span>
          )}
        </td>

        {/* Actions */}
        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-1">
            {emp.isVerified ? (
              <ActionIcon title="Revoke verification" onClick={() => ask('Revoke Verification', `Remove the Verified badge from ${name}?`, false, () => onVerify(emp.id, false))} colorClass="text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                <BadgeCheck className="h-3.5 w-3.5" />
              </ActionIcon>
            ) : (
              <ActionIcon title="Verify company" onClick={() => ask('Verify Company', `Grant the Verified badge to ${name}?`, false, () => onVerify(emp.id, true))} colorClass="text-gray-400 border-gray-200 hover:bg-gray-50">
                <BadgeMinus className="h-3.5 w-3.5" />
              </ActionIcon>
            )}

            {status === 'MUTED' ? (
              <ActionIcon title="Unmute" onClick={() => ask('Unmute Employer', `Restore ${name}'s ability to interact on the platform?`, false, () => onModerate(emp.userId, 'unmute'))} colorClass="text-amber-500 border-amber-200 hover:bg-amber-50">
                <VolumeX className="h-3.5 w-3.5" />
              </ActionIcon>
            ) : (
              <ActionIcon title="Mute" onClick={() => ask('Mute Employer', `Mute ${name} from interacting on the platform?`, false, () => onModerate(emp.userId, 'mute'))} colorClass="text-gray-400 border-gray-200 hover:bg-gray-50">
                <Volume2 className="h-3.5 w-3.5" />
              </ActionIcon>
            )}

            <ActionIcon title="Kick" onClick={() => ask('Kick Employer', `Permanently delete ${name}'s account and all their data?`, true, () => onModerate(emp.userId, 'kick'))} colorClass="text-orange-500 border-orange-200 hover:bg-orange-50">
              <UserX className="h-3.5 w-3.5" />
            </ActionIcon>

            {status === 'BANNED' ? (
              <ActionIcon title="Unban" onClick={() => ask('Unban Employer', `Lift the ban on ${name} and restore their access?`, false, () => onModerate(emp.userId, 'unban'))} colorClass="text-red-500 border-red-200 hover:bg-red-50">
                <Ban className="h-3.5 w-3.5" />
              </ActionIcon>
            ) : (
              <ActionIcon title="Ban" onClick={() => ask('Ban Employer', `Ban ${name} from the platform?`, true, () => onModerate(emp.userId, 'ban'))} colorClass="text-gray-400 border-gray-200 hover:bg-gray-50">
                <UserCheck className="h-3.5 w-3.5" />
              </ActionIcon>
            )}
          </div>
        </td>
      </tr>

      {pending && (
        <ConfirmDialog
          title={pending.title}
          desc={pending.desc}
          destructive={pending.destructive}
          onConfirm={() => { pending.onConfirm(); setPending(null); }}
          onCancel={() => setPending(null)}
        />
      )}
    </>
  );
}
