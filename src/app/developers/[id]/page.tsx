'use client';

import { useMemo, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/shared/Navbar';
import { api } from '@/lib/api';
import { Developer } from '@/types';
import {
  CEFR_META,
  computeAge,
  experienceDurationYears,
  formatExperienceDates,
  parseDeveloperLanguages,
} from '@/lib/developer-profile';
import { resolvePublicDeveloperPlace } from '@/lib/developer-location';
import {
  MapPin, Github, Linkedin, GraduationCap,
  Loader2, Calendar, FileText, ExternalLink, Phone, Mail,
} from 'lucide-react';
import { GenderAvatar } from '@/components/shared/GenderAvatar';
import { cn } from '@/lib/utils';

/** Profile page palette: black, white, green only */
const G = {
  page: 'bg-white',
  card: 'bg-white border border-gray-200 rounded-lg',
  title: 'text-black',
  body: 'text-gray-600',
  muted: 'text-gray-400',
  accent: 'text-[#15803d]',
  accentBg: 'bg-[#15803d]',
  accentLight: 'bg-[#ecfdf5]',
  accentBorder: 'border-[#15803d]',
};

function CvCard({
  title,
  children,
  className,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn(G.card, 'overflow-hidden', className)}>
      {title && (
        <div className="px-4 py-3 border-b border-gray-200 bg-white">
          <h2 className="text-sm font-semibold text-black">{title}</h2>
        </div>
      )}
      <div className={title ? 'p-4' : 'p-4'}>{children}</div>
    </section>
  );
}

function ProfileDetailsPanel({
  developerId,
  fullName,
  age,
  country,
  location,
  phone,
  email,
}: {
  developerId: string;
  fullName?: string | null;
  age: number | null;
  country?: string | null;
  location?: string | null;
  phone?: string | null;
  email?: string | null;
}) {
  const hasAge = age != null;
  const hasPlace = !!(country || location);
  const placeLabel = resolvePublicDeveloperPlace({
    id: developerId,
    fullName,
    location,
    country,
  });

  const detailIcon = 'h-4 w-4 shrink-0';
  const detailText = cn('text-sm leading-snug', G.body);

  return (
    <div className="border-t border-gray-200 px-4 py-4 space-y-3">
      {hasPlace && (
        <div className="flex items-center gap-2">
          <MapPin className={cn(detailIcon, G.muted)} />
          <span className={detailText}>{placeLabel}</span>
        </div>
      )}

      {hasAge && (
        <div className="flex items-center gap-2">
          <Calendar className={cn(detailIcon, G.muted)} />
          <span className={detailText}>{age} years</span>
        </div>
      )}

      {phone && (
        <div className="flex items-center gap-2 min-w-0">
          <Phone className={cn(detailIcon, G.muted)} />
          <a href={`tel:${phone}`} className={cn(detailText, 'hover:underline truncate')}>
            {phone}
          </a>
        </div>
      )}

      {email && (
        <div className="flex items-center gap-2 min-w-0">
          <Mail className={cn(detailIcon, G.muted)} />
          <a href={`mailto:${email}`} className={cn(detailText, 'hover:underline truncate')}>
            {email}
          </a>
        </div>
      )}
    </div>
  );
}

function LanguageRow({ name, level }: { name: string; level: keyof typeof CEFR_META }) {
  const meta = CEFR_META[level];
  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-sm font-medium text-black">{name}</span>
        <span className={cn('text-[10px] font-bold uppercase tracking-wider', G.accent)}>{level}</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
        <div
          className={cn('h-full rounded-full', G.accentBg)}
          style={{ width: `${meta.pct}%` }}
        />
      </div>
      <p className={cn('text-[10px] mt-1', G.muted)}>{meta.label}</p>
    </div>
  );
}

export default function DeveloperPublicProfilePage() {
  const params = useParams<{ id: string }>();
  const id = String(params?.id ?? '');

  const { data: dev, isLoading, isError } = useQuery({
    queryKey: ['dev-profile', id],
    queryFn: async () => {
      const r = await api.post(`/developers/${id}`, {});
      if (!r.ok) throw new Error('Not found');
      return r.json() as Promise<Developer>;
    },
  });

  const languages = useMemo(
    () => (dev ? parseDeveloperLanguages(dev.languages) : []),
    [dev],
  );
  const age = dev ? computeAge(dev.birthYear) : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex justify-center pt-40">
          <Loader2 className={cn('h-8 w-8 animate-spin', G.accent, 'opacity-40')} />
        </div>
      </div>
    );
  }

  if (isError || !dev) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-40 gap-4">
          <p className={cn('text-base', G.body)}>Developer not found.</p>
          <Link href="/jobs" className={cn('text-sm font-semibold hover:underline', G.accent)}>
            ← Browse jobs
          </Link>
        </div>
      </div>
    );
  }

  const name = dev.fullName || 'Developer';
  const hasBody = !!(dev.summary || dev.workExperience?.length || dev.education?.length);
  const hasDetails = !!(dev.country || dev.location || age != null || dev.phone || dev.user?.email);

  return (
    <div className={cn('min-h-screen', G.page)}>
      <Navbar />

      <div className="container mx-auto max-w-5xl px-4 py-8 lg:py-10">
        <div className="grid lg:grid-cols-[272px_1fr] gap-4 items-start">
          {/* ── Left column ───────────────────────────────────── */}
          <div className="space-y-4 lg:sticky lg:top-20">
            <section className={cn(G.card, 'overflow-hidden')}>
              <div className="relative w-full aspect-square bg-gray-100">
                <GenderAvatar
                  src={dev.photoUrl}
                  name={name}
                  gender={dev.gender}
                  variant="cover"
                  className="object-cover object-top"
                />

                <div className="absolute inset-x-0 bottom-0 h-[38%] bg-gradient-to-t from-[#15803d]/70 via-emerald-600/25 to-transparent opacity-45" />
                <div className="absolute inset-x-0 bottom-0 h-[32%] bg-gradient-to-t from-black/30 via-black/8 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-3 z-10 [text-shadow:0_1px_3px_rgba(0,0,0,0.55)]">
                  <h1 className="font-bold text-white text-lg leading-tight">{name}</h1>
                  {dev.title && (
                    <p className="text-white text-sm mt-0.5 font-semibold leading-snug">{dev.title}</p>
                  )}
                </div>
              </div>

              {hasDetails && (
                <ProfileDetailsPanel
                  developerId={dev.id}
                  fullName={dev.fullName}
                  age={age}
                  country={dev.country}
                  location={dev.location}
                  phone={dev.phone}
                  email={dev.user?.email}
                />
              )}
            </section>

            {(dev.github || dev.linkedin) && (
              <CvCard title="Links">
                <div className="space-y-2">
                  {dev.github && (
                    <a
                      href={dev.github}
                      target="_blank"
                      rel="noreferrer"
                      className={cn('flex items-center gap-2 text-sm font-medium hover:underline', G.accent)}
                    >
                      <Github className="h-4 w-4" />
                      <span className="truncate flex-1">GitHub</span>
                      <ExternalLink className="h-3 w-3 opacity-50" />
                    </a>
                  )}
                  {dev.linkedin && (
                    <a
                      href={dev.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className={cn('flex items-center gap-2 text-sm font-medium hover:underline', G.accent)}
                    >
                      <Linkedin className="h-4 w-4" />
                      <span className="truncate flex-1">LinkedIn</span>
                      <ExternalLink className="h-3 w-3 opacity-50" />
                    </a>
                  )}
                </div>
              </CvCard>
            )}

            {dev.skills.length > 0 && (
              <CvCard title="Skills">
                <div className="flex flex-wrap gap-1.5">
                  {dev.skills.map(s => (
                    <span
                      key={s}
                      className="text-xs font-medium text-black px-2.5 py-1 rounded-md border border-gray-200 bg-white"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </CvCard>
            )}

            {languages.length > 0 && (
              <CvCard title="Languages">
                <div className="space-y-4">
                  {languages.map(l => (
                    <LanguageRow key={l.name} name={l.name} level={l.level} />
                  ))}
                </div>
              </CvCard>
            )}
          </div>

          {/* ── Right column — CV sections as cards ───────────── */}
          <div className="space-y-4 min-w-0">
            {!hasBody ? (
              <CvCard title="Profile">
                <div className="py-12 text-center">
                  <FileText className={cn('h-10 w-10 mx-auto mb-3', G.muted)} />
                  <p className={cn('text-sm', G.body)}>This developer hasn&apos;t filled out their profile yet.</p>
                </div>
              </CvCard>
            ) : (
              <>
                {dev.summary && (
                  <CvCard title="Summary">
                    <p className={cn('text-sm leading-relaxed whitespace-pre-line', G.body)}>
                      {dev.summary}
                    </p>
                  </CvCard>
                )}

                {dev.workExperience && dev.workExperience.length > 0 && (
                  <CvCard title="Work Experience">
                    <div className="divide-y divide-gray-200 -mx-4 -mb-4">
                      {dev.workExperience.map((w, i) => {
                        const years = experienceDurationYears(w.startDate, w.endDate, w.current);
                        return (
                          <div key={`${w.company}-${w.role}-${i}`} className="px-4 py-4 first:pt-0">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                              <div>
                                <h3 className="text-sm font-bold text-black">{w.role}</h3>
                                <p className={cn('text-sm font-medium mt-0.5', G.accent)}>{w.company}</p>
                              </div>
                              <div className="sm:text-right shrink-0">
                                <p className={cn('text-xs font-medium tabular-nums', G.body)}>
                                  {formatExperienceDates(w.startDate, w.endDate, w.current)}
                                </p>
                                {years > 0 && (
                                  <p className={cn('text-[10px] mt-0.5', G.muted)}>
                                    {years} yr{years !== 1 ? 's' : ''}
                                  </p>
                                )}
                              </div>
                            </div>
                            {w.current && (
                              <span className={cn('inline-block mt-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border bg-white', G.accentBorder, G.accent)}>
                                Current
                              </span>
                            )}
                            {w.description && (
                              <p className={cn('text-sm mt-3 leading-relaxed', G.body)}>{w.description}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CvCard>
                )}

                {dev.education && dev.education.length > 0 && (
                  <CvCard title="Education">
                    <div className="divide-y divide-gray-200 -mx-4 -mb-4">
                      {dev.education.map((e, i) => (
                        <div key={i} className="px-4 py-4 first:pt-0 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                          <div className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-md flex items-center justify-center shrink-0 border border-gray-200 bg-white">
                              <GraduationCap className={cn('h-4 w-4', G.accent)} />
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-black">
                                {e.degree} in {e.field}
                              </h3>
                              <p className={cn('text-sm mt-0.5', G.body)}>{e.institution}</p>
                            </div>
                          </div>
                          <p className={cn('text-xs font-medium tabular-nums shrink-0 sm:ml-2', G.body)}>
                            {formatExperienceDates(e.startDate, e.endDate, e.current)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CvCard>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
