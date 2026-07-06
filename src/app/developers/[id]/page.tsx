'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/shared/Navbar';
import { api } from '@/lib/api';
import { Developer } from '@/types';
import { countryToFlagUrl } from '@/lib/countries';
import {
  MapPin, Github, Linkedin, Briefcase, GraduationCap,
  Globe, Check, Clock, X, Maximize2, Loader2,
} from 'lucide-react';
import { SkillChip } from '@/app/dashboard/owner/_shared';
import { GenderAvatar } from '@/components/shared/GenderAvatar';

function IdCardLightbox({ url, onClose }: { url: string; onClose: () => void }) {
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6" onClick={onClose}>
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />
      <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-4 -right-4 h-9 w-9 rounded-full bg-white shadow-xl flex items-center justify-center hover:bg-gray-50 z-10">
          <X className="h-4 w-4 text-gray-700" />
        </button>
        <img src={url} alt="ID Card" className="w-full rounded-2xl shadow-2xl object-contain max-h-[82vh]" />
      </div>
    </div>,
    document.body,
  );
}

export default function DeveloperPublicProfilePage() {
  const params = useParams<{ id: string }>();
  const id = String(params?.id ?? '');
  const [idCardOpen, setIdCardOpen] = useState(false);

  const { data: dev, isLoading, isError } = useQuery({
    queryKey: ['dev-profile', id],
    queryFn: async () => {
      const r = await api.post(`/developers/${id}`, {});
      if (!r.ok) throw new Error('Not found');
      return r.json() as Promise<Developer>;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex justify-center pt-40">
          <Loader2 className="h-7 w-7 animate-spin text-gray-300" />
        </div>
      </div>
    );
  }

  if (isError || !dev) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-40 gap-3 text-gray-400">
          <p className="text-sm">Developer not found.</p>
          <Link href="/jobs" className="text-sm font-semibold text-felovy-red hover:underline">← Browse jobs</Link>
        </div>
      </div>
    );
  }

  const name    = dev.fullName || 'Developer';
  const flagUrl = dev.country ? countryToFlagUrl(dev.country) : '';

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="container mx-auto max-w-5xl px-4 py-10">
        <div className="flex gap-5 items-start">

          {/* ── Sidebar ──────────────────────────────────────────── */}
          <aside className="w-72 shrink-0 sticky top-6 space-y-3">
            <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden">
              <div className="px-6 pt-7 pb-5 flex flex-col items-center text-center border-b border-gray-100">
                <div className="relative mb-4">
                  <div className="rounded-full ring-4 ring-white shadow-[0_4px_20px_rgba(0,0,0,0.12)] overflow-hidden">
                    <GenderAvatar src={dev.photoUrl} name={name} gender={dev.gender} size={104} />
                  </div>
                  {dev.isVerified && (
                    <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow">
                      <Check className="h-3.5 w-3.5 text-white stroke-[2.5]" />
                    </div>
                  )}
                </div>

                <h1 className="text-[17px] font-bold text-gray-900 leading-tight">{name}</h1>
                {dev.title && <p className="text-sm text-gray-500 mt-0.5">{dev.title}</p>}

                <div className="mt-3">
                  {dev.isVerified ? (
                    <span className="inline-flex items-center gap-1 bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm shadow-emerald-200">
                      <Check className="h-3 w-3 stroke-[2.5]" /> Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-500 text-xs font-semibold px-2.5 py-1 rounded-full border border-amber-200">
                      <Clock className="h-3 w-3" /> Pending verification
                    </span>
                  )}
                </div>
              </div>

              <div className="px-5 py-4 space-y-2.5 text-sm border-b border-gray-100">
                {dev.country && (
                  <div className="flex items-center gap-2.5 text-gray-700 font-medium">
                    {flagUrl && <img src={flagUrl} alt={dev.country} width={20} height={15} className="rounded-[2px] object-cover shadow-sm shrink-0" />}
                    {dev.country}
                  </div>
                )}
                {dev.location && (
                  <div className="flex items-center gap-2.5 text-gray-500">
                    <MapPin className="h-4 w-4 text-gray-300 shrink-0" />
                    {dev.location}
                  </div>
                )}
              </div>

              {dev.skills.length > 0 && (
                <div className="px-5 py-4 border-b border-gray-100">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {dev.skills.map(s => <SkillChip key={s} label={s} />)}
                  </div>
                </div>
              )}

              {dev.languages.length > 0 && (
                <div className="px-5 py-4">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Languages</p>
                  <div className="space-y-2">
                    {dev.languages.map(l => (
                      <div key={l} className="flex items-center gap-2 text-sm text-gray-600">
                        <Globe className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                        {l}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {(dev.github || dev.linkedin) && (
              <div className="bg-white rounded-2xl border border-gray-200/80 px-5 py-4">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Profiles</p>
                <div className="space-y-2.5">
                  {dev.github && (
                    <a href={dev.github} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2.5 text-sm text-gray-600 hover:text-felovy-red transition-colors group"
                    >
                      <Github className="h-4 w-4 text-gray-400 group-hover:text-felovy-red shrink-0" />
                      <span className="truncate">{dev.github.replace(/^https?:\/\/(www\.)?github\.com\//, '')}</span>
                    </a>
                  )}
                  {dev.linkedin && (
                    <a href={dev.linkedin} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2.5 text-sm text-gray-600 hover:text-felovy-red transition-colors group"
                    >
                      <Linkedin className="h-4 w-4 text-gray-400 group-hover:text-felovy-red shrink-0" />
                      <span>LinkedIn Profile</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </aside>

          {/* ── Main content ─────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-4">
            {dev.summary && (
              <section className="bg-white rounded-2xl border border-gray-200/80 px-7 py-6">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-4">Overview</p>
                <p className="text-sm text-gray-700 leading-[1.8] whitespace-pre-line">{dev.summary}</p>
              </section>
            )}

            {dev.workExperience && dev.workExperience.length > 0 && (
              <section className="bg-white rounded-2xl border border-gray-200/80 px-7 py-6">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-5 flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5" /> Work Experience
                </p>
                <div className="space-y-0">
                  {dev.workExperience.map((w, i) => (
                    <div key={i} className={`relative pl-6 ${i < dev.workExperience!.length - 1 ? 'pb-7' : ''}`}>
                      {i < dev.workExperience!.length - 1 && <div className="absolute left-[5px] top-4 bottom-0 w-px bg-gray-100" />}
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
                      {w.description && <p className="text-sm text-gray-500 mt-2 leading-relaxed">{w.description}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {dev.education && dev.education.length > 0 && (
              <section className="bg-white rounded-2xl border border-gray-200/80 px-7 py-6">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-5 flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5" /> Education
                </p>
                <div className="space-y-0">
                  {dev.education.map((e, i) => (
                    <div key={i} className={`relative pl-6 ${i < dev.education!.length - 1 ? 'pb-7' : ''}`}>
                      {i < dev.education!.length - 1 && <div className="absolute left-[5px] top-4 bottom-0 w-px bg-gray-100" />}
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

            {!dev.summary && !dev.workExperience?.length && !dev.education?.length && (
              <div className="bg-white rounded-2xl border border-gray-200/80 px-7 py-16 flex flex-col items-center text-center gap-3 text-gray-400">
                <p className="text-sm">This developer hasn't filled out their profile yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {idCardOpen && dev.idCardUrl && (
        <IdCardLightbox url={dev.idCardUrl} onClose={() => setIdCardOpen(false)} />
      )}
    </div>
  );
}
