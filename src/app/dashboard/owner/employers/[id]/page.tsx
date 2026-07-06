'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loading } from '@/components/shared/Loading';
import { toast } from '@/components/ui/toaster';
import { api } from '@/lib/api';
import { Employer } from '@/types';
import { countryToFlagUrl } from '@/lib/countries';
import {
  MapPin, Mail, Globe, Users, Check, Clock, Calendar,
  BadgeCheck, BadgeMinus, VolumeX, Volume2, UserX, Ban, UserCheck,
  CreditCard, X, Maximize2, AlertTriangle, CheckCircle,
  Linkedin, Building2,
} from 'lucide-react';
import { StatusDot, CompletionBar } from '../../_shared';

type PendingConfirm = {
  title: string;
  desc: string;
  destructive: boolean;
  onConfirm: () => void;
};

function ConfirmDialog({
  title, desc, destructive, onConfirm, onCancel,
}: {
  title: string; desc: string; destructive: boolean;
  onConfirm: () => void; onCancel: () => void;
}) {
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onCancel}>
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
          <button onClick={onCancel} className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 h-11 rounded-xl text-sm font-semibold text-white transition-colors ${
              destructive ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200' : 'bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-200'
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

function ImageLightbox({ url, onClose }: { url: string; onClose: () => void }) {
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6" onClick={onClose}>
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />
      <div className="relative max-w-3xl w-full" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 h-9 w-9 rounded-full bg-white shadow-xl flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
        >
          <X className="h-4 w-4 text-gray-700" />
        </button>
        <img src={url} alt="Preview" className="w-full rounded-2xl shadow-2xl object-contain max-h-[82vh]" />
      </div>
    </div>,
    document.body,
  );
}

export default function EmployerProfilePage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const qc = useQueryClient();
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const { data: emp, isLoading, isError } = useQuery({
    queryKey: ['owner-emp-profile', id],
    queryFn: async () => {
      const r = await api.post(`/employers/${id}`, {});
      return r.json() as Promise<Employer>;
    },
  });

  const { mutate: verify } = useMutation({
    mutationFn: ({ approved }: { approved: boolean }) =>
      api.post('/owner/verify/employer', { employerId: id, approved }),
    onSuccess: () => {
      toast({ title: 'Verification updated' });
      qc.invalidateQueries({ queryKey: ['owner-emp-profile', id] });
      qc.invalidateQueries({ queryKey: ['owner-emps'] });
    },
    onError: () => toast({ title: 'Failed', variant: 'destructive' }),
  });

  const { mutate: moderate } = useMutation({
    mutationFn: ({ userId, action }: { userId: string; action: string }) =>
      api.post('/owner/moderate', { userId, action }),
    onSuccess: (_d, vars) => {
      if (vars.action === 'kick') {
        toast({ title: 'Employer removed' });
        router.push('/dashboard/owner/employers');
      } else {
        toast({ title: `Employer ${vars.action}d` });
        qc.invalidateQueries({ queryKey: ['owner-emp-profile', id] });
        qc.invalidateQueries({ queryKey: ['owner-emps'] });
      }
    },
    onError: () => toast({ title: 'Action failed', variant: 'destructive' }),
  });

  const ask = (title: string, desc: string, destructive: boolean, onConfirm: () => void) =>
    setPending({ title, desc, destructive, onConfirm });

  if (isLoading) return <Loading size="md" text="Loading profile…" />;
  if (isError || !emp) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-gray-400">
        <p className="text-sm">Employer not found.</p>
        <Link href="/dashboard/owner/employers" className="text-sm font-semibold text-felovy-red hover:underline">
          ← Back to list
        </Link>
      </div>
    );
  }

  const name    = emp.companyName || emp.user?.email || 'Company';
  const status  = emp.user?.status ?? 'ACTIVE';
  const flagUrl = emp.country ? countryToFlagUrl(emp.country) : '';

  return (
    <div className="max-w-5xl space-y-4">

      {/* ── LinkedIn-style profile card ───────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200/70 overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)]">

        {/* Banner image */}
        <div className="relative h-52 w-full overflow-hidden">
          {emp.companyBrandUrl ? (
            <img
              src={emp.companyBrandUrl}
              alt="Company banner"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`w-full h-full ${
              emp.isVerified
                ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-purple-500'
                : 'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-400'
            }`} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/5 to-transparent" />
        </div>

        {/* Header below banner */}
        <div className="px-8 pt-0 pb-6">

          {/* Logo row, overlaps banner */}
          <div className="flex items-end justify-between gap-4 -mt-12 mb-5">
            <div className="relative shrink-0">
              <div className="h-24 w-24 rounded-2xl ring-4 ring-white shadow-[0_4px_24px_rgba(0,0,0,0.18)] overflow-hidden bg-white">
                {emp.companyLogoUrl ? (
                  <img src={emp.companyLogoUrl} alt={name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-purple-500 via-fuchsia-500 to-pink-500 flex items-center justify-center text-white font-black text-3xl select-none">
                    {(name[0] ?? '?').toUpperCase()}
                  </div>
                )}
              </div>
              {emp.isVerified && (
                <div className="absolute -bottom-2 -right-2 h-7 w-7 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-md">
                  <Check className="h-3.5 w-3.5 text-white stroke-[2.5]" />
                </div>
              )}
            </div>

            <div className="mb-1">
              <StatusDot status={status} />
            </div>
          </div>

          {/* Company name + badges */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">{name}</h1>
            {emp.isVerified ? (
              <span className="inline-flex items-center gap-1 bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm shadow-emerald-200">
                <Check className="h-3 w-3 stroke-[2.5]" /> Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 text-xs font-semibold px-2.5 py-1 rounded-full border border-amber-200">
                <Clock className="h-3 w-3" /> Pending Verification
              </span>
            )}
          </div>

          {/* Tagline / contact subtitle */}
          {emp.contactName && (
            <p className="text-gray-500 text-sm mt-1">
              {emp.contactName}{emp.contactRole ? ` · ${emp.contactRole}` : ''}
            </p>
          )}

          {/* Info chips */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-4 text-[13px] text-gray-500">
            {emp.country && (
              <span className="flex items-center gap-1.5 font-semibold text-gray-700">
                {flagUrl && (
                  <img src={flagUrl} alt={emp.country} width={18} height={14} className="rounded-[2px] object-cover shadow-sm shrink-0" />
                )}
                {emp.country}
              </span>
            )}
            {emp.companyLocation && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" /> {emp.companyLocation}
              </span>
            )}
            {emp.companySize && (
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-gray-400 shrink-0" /> {emp.companySize} employees
              </span>
            )}
            {emp.companyWebsite && (
              <a
                href={emp.companyWebsite}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 hover:text-felovy-red transition-colors"
              >
                <Globe className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                {emp.companyWebsite.replace(/^https?:\/\//, '')}
              </a>
            )}
            {emp.companyLinkedin && (
              <a
                href={emp.companyLinkedin}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 hover:text-[#0a66c2] transition-colors"
              >
                <Linkedin className="h-3.5 w-3.5 text-gray-400 shrink-0" /> LinkedIn
              </a>
            )}
            {emp.user?.email && (
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" /> {emp.user.email}
              </span>
            )}
            {emp.user?.createdAt && (
              <span className="flex items-center gap-1.5 text-gray-400">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                Joined {new Date(emp.user.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>

          {/* Profile completion */}
          <div className="mt-5">
            <CompletionBar step={emp.profileStep} total={4} />
          </div>
        </div>
      </div>

      {/* ── Body: main + right sidebar ────────────────────────────── */}
      <div className="flex gap-4 items-start">

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* About */}
          {emp.companySummary && (
            <section className="bg-white rounded-2xl border border-gray-200/70 px-7 py-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" /> About
              </p>
              <p className="text-sm text-gray-700 leading-[1.85] whitespace-pre-line">{emp.companySummary}</p>
            </section>
          )}

          {/* Contact person */}
          {(emp.contactName || emp.contactInfo) && (
            <section className="bg-white rounded-2xl border border-gray-200/70 px-7 py-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-4">Contact Person</p>
              <div className="flex items-center gap-4">
                {emp.contactPhotoUrl ? (
                  <img
                    src={emp.contactPhotoUrl}
                    alt={emp.contactName ?? ''}
                    className="h-14 w-14 rounded-full object-cover ring-2 ring-gray-100 shadow-sm shrink-0"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-purple-400 to-fuchsia-500 flex items-center justify-center text-white font-bold text-xl shrink-0 select-none shadow-sm">
                    {(emp.contactName?.[0] ?? '?').toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  {emp.contactName && <p className="text-sm font-semibold text-gray-900">{emp.contactName}</p>}
                  {emp.contactRole && <p className="text-[13px] text-gray-500 mt-0.5">{emp.contactRole}</p>}
                  {emp.contactInfo && <p className="text-[12px] text-gray-400 mt-1 truncate">{emp.contactInfo}</p>}
                </div>
              </div>
            </section>
          )}

          {/* Ad images */}
          {emp.companyAdImages?.length > 0 && (
            <section className="bg-white rounded-2xl border border-gray-200/70 px-7 py-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-4">Media</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {emp.companyAdImages.map((url, i) => (
                  <div key={i} className="relative group aspect-video rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                    <img src={url} alt={`Media ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => setLightboxUrl(url)}
                      className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-all duration-200"
                    >
                      <Maximize2 className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ID Verification */}
          <section className="bg-white rounded-2xl border border-gray-200/70 px-7 py-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5" /> ID Verification
            </p>
            {emp.idCardUrl ? (
              <div className="relative group w-full max-w-sm">
                <img
                  src={emp.idCardUrl}
                  alt="Company ID"
                  className="w-full rounded-xl border border-gray-200 object-cover shadow-sm"
                />
                <button
                  onClick={() => setLightboxUrl(emp.idCardUrl!)}
                  className="absolute inset-0 rounded-xl flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-all duration-200"
                >
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 bg-white/95 text-gray-800 text-sm font-medium px-4 py-2 rounded-full shadow-lg">
                    <Maximize2 className="h-3.5 w-3.5" /> View full size
                  </span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 rounded-xl border border-dashed border-gray-200 text-center gap-2">
                <CreditCard className="h-8 w-8 text-gray-200" />
                <p className="text-sm text-gray-400">No ID document uploaded yet</p>
                <p className="text-xs text-gray-300">Employer needs to complete step 4 of their profile</p>
              </div>
            )}
          </section>

          {/* Intro video */}
          {emp.introVideoUrl && (
            <section className="bg-white rounded-2xl border border-gray-200/70 px-7 py-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-4">Intro Video</p>
              <video
                src={emp.introVideoUrl}
                controls
                className="w-full rounded-xl border border-gray-200 shadow-sm max-h-72"
              />
            </section>
          )}

          {/* Empty state */}
          {!emp.companySummary && !emp.contactName && !emp.companyAdImages?.length && (
            <div className="bg-white rounded-2xl border border-gray-200/70 px-7 py-16 flex flex-col items-center text-center gap-3 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
              <Building2 className="h-10 w-10 text-gray-200" />
              <p className="text-sm text-gray-400">This company hasn't filled out their profile yet.</p>
              <div className="w-full max-w-xs mt-1">
                <CompletionBar step={emp.profileStep} total={4} />
              </div>
            </div>
          )}
        </div>

        {/* ── Right sidebar: moderation ──────────────────────────── */}
        <aside className="w-56 shrink-0 sticky top-6 space-y-3">
          <div className="bg-white rounded-2xl border border-gray-200/70 px-4 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Moderation</p>
            <div className="space-y-1.5">

              {emp.isVerified ? (
                <button
                  onClick={() => ask('Revoke Verification', `Remove the Verified badge from ${name}?`, false, () => verify({ approved: false }))}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[13px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                >
                  <BadgeCheck className="h-4 w-4 shrink-0" /> Revoke Verification
                </button>
              ) : (
                <button
                  onClick={() => ask('Verify Company', `Grant the Verified badge to ${name}?`, false, () => verify({ approved: true }))}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[13px] font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <BadgeMinus className="h-4 w-4 shrink-0" /> Verify Company
                </button>
              )}

              {status === 'MUTED' ? (
                <button
                  onClick={() => ask('Unmute Employer', `Restore ${name}'s ability to interact?`, false, () => moderate({ userId: emp.userId, action: 'unmute' }))}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[13px] font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
                >
                  <VolumeX className="h-4 w-4 shrink-0" /> Unmute Employer
                </button>
              ) : (
                <button
                  onClick={() => ask('Mute Employer', `Mute ${name} from interacting?`, false, () => moderate({ userId: emp.userId, action: 'mute' }))}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[13px] font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <Volume2 className="h-4 w-4 shrink-0" /> Mute Employer
                </button>
              )}

              {status === 'BANNED' ? (
                <button
                  onClick={() => ask('Unban Employer', `Lift the ban on ${name}?`, false, () => moderate({ userId: emp.userId, action: 'unban' }))}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[13px] font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                >
                  <Ban className="h-4 w-4 shrink-0" /> Unban Employer
                </button>
              ) : (
                <button
                  onClick={() => ask('Ban Employer', `Ban ${name} from the platform?`, true, () => moderate({ userId: emp.userId, action: 'ban' }))}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[13px] font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <UserCheck className="h-4 w-4 shrink-0" /> Ban Employer
                </button>
              )}

              <button
                onClick={() => ask('Kick Employer', `Permanently delete ${name}'s account and all their data? This cannot be undone.`, true, () => moderate({ userId: emp.userId, action: 'kick' }))}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[13px] font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 transition-colors mt-1"
              >
                <UserX className="h-4 w-4 shrink-0" /> Kick &amp; Delete
              </button>
            </div>
          </div>
        </aside>
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

      {lightboxUrl && (
        <ImageLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
      )}
    </div>
  );
}
