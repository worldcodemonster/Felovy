'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loading } from '@/components/shared/Loading';
import { toast } from '@/components/ui/toaster';
import { api } from '@/lib/api';
import { Developer } from '@/types';
import { countryToFlagUrl } from '@/lib/countries';
import { computeAge, parseDeveloperLanguages } from '@/lib/developer-profile';
import { formatDeveloperPlace } from '@/lib/developer-location';
import {
  MapPin, Mail, Phone, Github, Linkedin,
  Briefcase, GraduationCap, Globe, Check, Clock, Calendar,
  BadgeCheck, BadgeMinus, VolumeX, Volume2, UserX, Ban, UserCheck, Bot,
  CreditCard, X, Maximize2, AlertTriangle, CheckCircle,
} from 'lucide-react';
import { UserAvatar, StatusDot, SkillChip, CompletionBar } from '../../_shared';

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

function IdCardLightbox({ url, onClose }: { url: string; onClose: () => void }) {
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6" onClick={onClose}>
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />
      <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 h-9 w-9 rounded-full bg-white shadow-xl flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
        >
          <X className="h-4 w-4 text-gray-700" />
        </button>
        <img
          src={url}
          alt="ID Card"
          className="w-full rounded-2xl shadow-2xl object-contain max-h-[82vh]"
        />
      </div>
    </div>,
    document.body,
  );
}

export default function DeveloperProfilePage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const qc = useQueryClient();
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const [idCardOpen, setIdCardOpen] = useState(false);

  const { data: dev, isLoading, isError } = useQuery({
    queryKey: ['owner-dev-profile', id],
    queryFn: async () => {
      const r = await api.post(`/developers/${id}`, {});
      return r.json() as Promise<Developer>;
    },
  });

  const { mutate: verify } = useMutation({
    mutationFn: ({ approved }: { approved: boolean }) =>
      api.post('/owner/verify/developer', { developerId: id, approved }),
    onSuccess: () => {
      toast({ title: 'Verification updated' });
      qc.invalidateQueries({ queryKey: ['owner-dev-profile', id] });
      qc.invalidateQueries({ queryKey: ['owner-devs'] });
    },
    onError: () => toast({ title: 'Failed', variant: 'destructive' }),
  });

  const { mutate: moderate } = useMutation({
    mutationFn: ({ userId, action }: { userId: string; action: string }) =>
      api.post('/owner/moderate', { userId, action }),
    onSuccess: (_d, vars) => {
      if (vars.action === 'kick') {
        toast({ title: 'Developer removed' });
        router.push('/dashboard/owner/developers');
      } else {
        toast({ title: `Developer ${vars.action}d` });
        qc.invalidateQueries({ queryKey: ['owner-dev-profile', id] });
        qc.invalidateQueries({ queryKey: ['owner-devs'] });
      }
    },
    onError: () => toast({ title: 'Action failed', variant: 'destructive' }),
  });

  const ask = (title: string, desc: string, destructive: boolean, onConfirm: () => void) =>
    setPending({ title, desc, destructive, onConfirm });

  if (isLoading) return <Loading size="md" text="Loading profile…" />;
  if (isError || !dev) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-gray-400">
        <p className="text-sm">Developer not found.</p>
        <Link href="/dashboard/owner/developers" className="text-sm font-semibold text-felovy-red hover:underline">
          ← Back to list
        </Link>
      </div>
    );
  }

  const name    = dev.fullName || dev.user?.email || 'Developer';
  const age     = computeAge(dev.birthYear);
  const langs   = parseDeveloperLanguages(dev.languages);
  const status  = dev.user?.status ?? 'ACTIVE';
  const flagUrl = dev.country ? countryToFlagUrl(dev.country) : '';

  return (
    <div className="max-w-5xl">
      <div className="flex gap-5 items-start">

        {/* ── Sidebar ─────────────────────────────────────────────── */}
        <aside className="w-72 shrink-0 sticky top-6 space-y-3">

          {/* Profile card */}
          <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden">
            <div className="px-6 pt-7 pb-5 flex flex-col items-center text-center border-b border-gray-100">
              <div className="relative mb-4">
                <div className="rounded-full ring-4 ring-white shadow-[0_4px_20px_rgba(0,0,0,0.12)] overflow-hidden">
                  <UserAvatar
                    src={dev.photoUrl}
                    name={name}
                    gradient="bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600"
                    size={104}
                  />
                </div>
                {dev.isVerified && (
                  <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow">
                    <Check className="h-3.5 w-3.5 text-white stroke-[2.5]" />
                  </div>
                )}
              </div>

              <h1 className="text-[17px] font-bold text-gray-900 leading-tight">{name}</h1>
              {dev.title && <p className="text-sm text-gray-500 mt-0.5">{dev.title}</p>}

              <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
                <StatusDot status={status} />
                {dev.isBot && (
                  <span className="inline-flex items-center gap-1 bg-violet-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm shadow-violet-200">
                    <Bot className="h-3 w-3" /> Bot
                  </span>
                )}
                {dev.isVerified ? (
                  <span className="inline-flex items-center gap-1 bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm shadow-emerald-200">
                    <Check className="h-3 w-3 stroke-[2.5]" /> Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-white text-amber-500 text-xs font-semibold px-2.5 py-1 rounded-full border border-amber-200">
                    <Clock className="h-3 w-3" /> Pending
                  </span>
                )}
              </div>
            </div>

            {/* Meta */}
            <div className="px-5 py-4 space-y-2.5 text-sm border-b border-gray-100">
              {(dev.country || dev.location) && (
                <div className="flex items-center gap-2.5 text-gray-700 font-medium min-w-0">
                  {flagUrl && (
                    <img src={flagUrl} alt={dev.country ?? ''} width={20} height={15} className="rounded-[2px] object-cover shadow-sm shrink-0" />
                  )}
                  <MapPin className="h-4 w-4 text-gray-300 shrink-0" />
                  <span className="truncate">{formatDeveloperPlace(dev.location, dev.country)}</span>
                </div>
              )}
              {dev.user?.email && (
                <div className="flex items-center gap-2.5 text-gray-500 min-w-0">
                  <Mail className="h-4 w-4 text-gray-300 shrink-0" />
                  <span className="truncate">{dev.user.email}</span>
                </div>
              )}
              {dev.phone && (
                <div className="flex items-center gap-2.5 text-gray-500">
                  <Phone className="h-4 w-4 text-gray-300 shrink-0" />
                  {dev.phone}
                </div>
              )}
              {age != null && (
                <div className="flex items-center gap-2.5 text-gray-500">
                  <Calendar className="h-4 w-4 text-gray-300 shrink-0" />
                  {age} years old
                </div>
              )}
              {dev.user?.createdAt && (
                <div className="flex items-center gap-2.5 text-gray-500">
                  <Calendar className="h-4 w-4 text-gray-300 shrink-0" />
                  <span>
                    Joined{' '}
                    {new Date(dev.user.createdAt).toLocaleDateString('en-US', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* Completion */}
            <div className="px-5 py-4 border-b border-gray-100">
              <CompletionBar step={dev.profileStep} total={4} />
            </div>

            {/* Skills */}
            {dev.skills.length > 0 && (
              <div className="px-5 py-4 border-b border-gray-100">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {dev.skills.map(s => <SkillChip key={s} label={s} />)}
                </div>
              </div>
            )}

            {/* Languages */}
            {langs.length > 0 && (
              <div className="px-5 py-4">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Languages · CEFR</p>
                <div className="space-y-2">
                  {langs.map(l => (
                    <div key={l.name} className="flex items-center justify-between gap-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Globe className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                        {l.name}
                      </div>
                      <span className="text-xs font-semibold text-gray-400">{l.level}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* External links */}
          {(dev.github || dev.linkedin) && (
            <div className="bg-white rounded-2xl border border-gray-200/80 px-5 py-4">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Profiles</p>
              <div className="space-y-2.5">
                {dev.github && (
                  <a
                    href={dev.github}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2.5 text-sm text-gray-600 hover:text-felovy-red transition-colors group"
                  >
                    <Github className="h-4 w-4 text-gray-400 group-hover:text-felovy-red shrink-0" />
                    <span className="truncate">{dev.github.replace(/^https?:\/\/(www\.)?github\.com\//, '')}</span>
                  </a>
                )}
                {dev.linkedin && (
                  <a
                    href={dev.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2.5 text-sm text-gray-600 hover:text-felovy-red transition-colors group"
                  >
                    <Linkedin className="h-4 w-4 text-gray-400 group-hover:text-felovy-red shrink-0" />
                    <span>LinkedIn Profile</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* ── Moderation panel ──────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-200/80 px-5 py-4">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Moderation</p>
            <div className="space-y-1.5">

              {/* Verify / Revoke */}
              {dev.isVerified ? (
                <button
                  onClick={() => ask('Revoke Verification', `Remove the Verified badge from ${name}?`, false, () => verify({ approved: false }))}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                >
                  <BadgeCheck className="h-4 w-4 shrink-0" />
                  Revoke Verification
                </button>
              ) : (
                <button
                  onClick={() => ask('Verify Profile', `Grant the Verified badge to ${name}?`, false, () => verify({ approved: true }))}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <BadgeMinus className="h-4 w-4 shrink-0" />
                  Verify Profile
                </button>
              )}

              {/* Mute / Unmute */}
              {status === 'MUTED' ? (
                <button
                  onClick={() => ask('Unmute Developer', `Restore ${name}'s ability to interact?`, false, () => moderate({ userId: dev.userId, action: 'unmute' }))}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
                >
                  <VolumeX className="h-4 w-4 shrink-0" />
                  Unmute Developer
                </button>
              ) : (
                <button
                  onClick={() => ask('Mute Developer', `Mute ${name} from interacting on the platform?`, false, () => moderate({ userId: dev.userId, action: 'mute' }))}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <Volume2 className="h-4 w-4 shrink-0" />
                  Mute Developer
                </button>
              )}

              {/* Ban / Unban */}
              {status === 'BANNED' ? (
                <button
                  onClick={() => ask('Unban Developer', `Lift the ban on ${name} and restore their access?`, false, () => moderate({ userId: dev.userId, action: 'unban' }))}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                >
                  <Ban className="h-4 w-4 shrink-0" />
                  Unban Developer
                </button>
              ) : (
                <button
                  onClick={() => ask('Ban Developer', `Ban ${name} from the platform? They will be unable to log in.`, true, () => moderate({ userId: dev.userId, action: 'ban' }))}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <UserCheck className="h-4 w-4 shrink-0" />
                  Ban Developer
                </button>
              )}

              {/* Kick */}
              <button
                onClick={() => ask('Kick Developer', `Permanently delete ${name}'s account and all their data? This cannot be undone.`, true, () => moderate({ userId: dev.userId, action: 'kick' }))}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 transition-colors mt-1"
              >
                <UserX className="h-4 w-4 shrink-0" />
                Kick &amp; Delete Account
              </button>
            </div>
          </div>
        </aside>

        {/* ── Main content ─────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Overview */}
          {dev.summary && (
            <section className="bg-white rounded-2xl border border-gray-200/80 px-7 py-6">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-4">Overview</p>
              <p className="text-sm text-gray-700 leading-[1.8] whitespace-pre-line">{dev.summary}</p>
            </section>
          )}

          {/* ID Verification */}
          <section className="bg-white rounded-2xl border border-gray-200/80 px-7 py-6">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5" /> ID Verification
            </p>
            {dev.idCardUrl ? (
              <div className="relative group w-full max-w-sm">
                <img
                  src={dev.idCardUrl}
                  alt="Developer ID card"
                  className="w-full rounded-xl border border-gray-200 object-cover shadow-sm"
                />
                <button
                  onClick={() => setIdCardOpen(true)}
                  className="absolute inset-0 rounded-xl flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-all duration-200"
                >
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-2 bg-white/95 text-gray-800 text-sm font-medium px-4 py-2 rounded-full shadow-lg">
                    <Maximize2 className="h-3.5 w-3.5" /> View full size
                  </span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 rounded-xl border border-dashed border-gray-200 text-center gap-2">
                <CreditCard className="h-8 w-8 text-gray-200" />
                <p className="text-sm text-gray-400">No ID card uploaded yet</p>
                <p className="text-xs text-gray-300">Developer needs to complete step 4 of their profile</p>
              </div>
            )}
          </section>

          {/* Work Experience */}
          {dev.workExperience && dev.workExperience.length > 0 && (
            <section className="bg-white rounded-2xl border border-gray-200/80 px-7 py-6">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-5 flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5" /> Work Experience
              </p>
              <div className="space-y-0">
                {dev.workExperience.map((w, i) => (
                  <div key={i} className={`relative pl-6 ${i < dev.workExperience!.length - 1 ? 'pb-7' : ''}`}>
                    {i < dev.workExperience!.length - 1 && (
                      <div className="absolute left-[5px] top-4 bottom-0 w-px bg-gray-100" />
                    )}
                    <div className="absolute left-0 top-1 h-3 w-3 rounded-full bg-indigo-100 border-[2.5px] border-indigo-400" />
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{w.role}</p>
                        <p className="text-sm text-gray-500 mt-0.5">{w.company}</p>
                      </div>
                      <span className="text-[11px] text-gray-400 bg-gray-50 border border-gray-100 rounded-full px-2.5 py-1 shrink-0 mt-0.5">
                        {w.startDate} to {w.current ? 'Present' : (w.endDate ?? '')}
                      </span>
                    </div>
                    {w.description && (
                      <p className="text-sm text-gray-500 mt-2 leading-relaxed">{w.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Education */}
          {dev.education && dev.education.length > 0 && (
            <section className="bg-white rounded-2xl border border-gray-200/80 px-7 py-6">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-5 flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5" /> Education
              </p>
              <div className="space-y-0">
                {dev.education.map((e, i) => (
                  <div key={i} className={`relative pl-6 ${i < dev.education!.length - 1 ? 'pb-7' : ''}`}>
                    {i < dev.education!.length - 1 && (
                      <div className="absolute left-[5px] top-4 bottom-0 w-px bg-gray-100" />
                    )}
                    <div className="absolute left-0 top-1 h-3 w-3 rounded-full bg-violet-100 border-[2.5px] border-violet-400" />
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{e.degree} in {e.field}</p>
                        <p className="text-sm text-gray-500 mt-0.5">{e.institution}</p>
                      </div>
                      <span className="text-[11px] text-gray-400 bg-gray-50 border border-gray-100 rounded-full px-2.5 py-1 shrink-0 mt-0.5">
                        {e.startDate} to {e.current ? 'Present' : (e.endDate ?? '')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Empty state */}
          {!dev.summary && !dev.workExperience?.length && !dev.education?.length && (
            <div className="bg-white rounded-2xl border border-gray-200/80 px-7 py-16 flex flex-col items-center text-center gap-3">
              <p className="text-sm text-gray-400">This developer hasn't filled out their profile yet.</p>
              <div className="w-full max-w-xs">
                <CompletionBar step={dev.profileStep} total={4} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirm dialog */}
      {pending && (
        <ConfirmDialog
          title={pending.title}
          desc={pending.desc}
          destructive={pending.destructive}
          onConfirm={() => { pending.onConfirm(); setPending(null); }}
          onCancel={() => setPending(null)}
        />
      )}

      {/* ID card lightbox */}
      {idCardOpen && dev.idCardUrl && (
        <IdCardLightbox url={dev.idCardUrl} onClose={() => setIdCardOpen(false)} />
      )}
    </div>
  );
}
