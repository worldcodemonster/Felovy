'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { Navbar } from '@/components/shared/Navbar';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { Employer } from '@/types';
import {
  Globe, Linkedin, MapPin, Users, CheckCircle2, Loader2,
  ArrowLeft, ExternalLink, Play,
} from 'lucide-react';

function VideoEmbed({ url }: { url: string }) {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  const vmMatch = url.match(/vimeo\.com\/(\d+)/);

  if (ytMatch) {
    return (
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <iframe
          src={`https://www.youtube.com/embed/${ytMatch[1]}`}
          title="Company intro"
          className="absolute inset-0 w-full h-full rounded-xl"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  if (vmMatch) {
    return (
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <iframe
          src={`https://player.vimeo.com/video/${vmMatch[1]}`}
          title="Company intro"
          className="absolute inset-0 w-full h-full rounded-xl"
          allowFullScreen
        />
      </div>
    );
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-2 text-felovy-red hover:underline text-sm">
      <Play className="h-4 w-4" /> Watch intro video <ExternalLink className="h-3 w-3" />
    </a>
  );
}

export default function EmployerPublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: employer, isLoading, isError } = useQuery({
    queryKey: ['employer-profile', id],
    queryFn: async () => {
      const res = await api.post(`/employers/${id}`, {});
      if (!res.ok) throw new Error('Not found');
      return res.json() as Promise<Employer>;
    },
    retry: false,
  });

  if (isLoading) return (
    <div className="min-h-screen"><Navbar />
      <div className="flex justify-center pt-20"><Loader2 className="h-8 w-8 animate-spin text-felovy-red" /></div>
    </div>
  );

  if (isError || !employer) return (
    <div className="min-h-screen"><Navbar />
      <div className="container mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-4xl mb-4">🏢</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Company not found</h1>
        <p className="text-gray-500 mb-6">This company profile doesn't exist or has been removed.</p>
        <Link href="/jobs"><Button variant="gradient">Browse Jobs</Button></Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Link href="/jobs" className="flex items-center gap-1 text-sm text-gray-500 hover:text-felovy-red mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Jobs
        </Link>

        {/* Brand / Cover */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-felovy-light to-felovy-red/10 mb-6"
          style={{ height: 200 }}>
          {employer.companyBrandUrl && (
            <Image src={employer.companyBrandUrl} alt="Brand" fill className="object-cover" />
          )}
          {/* Logo overlay */}
          <div className="absolute -bottom-8 left-8">
            <div className="h-20 w-20 rounded-2xl border-4 border-white bg-white shadow-lg overflow-hidden">
              {employer.companyLogoUrl ? (
                <Image src={employer.companyLogoUrl} alt="Logo" width={80} height={80} className="object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-2xl font-bold text-felovy-red bg-felovy-light">
                  {employer.companyName?.[0] ?? '?'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="mt-10 mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{employer.companyName ?? 'Company'}</h1>
                {employer.isVerified && (
                  <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="h-3 w-3" /> Verified
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
                {employer.companyLocation && (
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{employer.companyLocation}</span>
                )}
                {employer.companySize && (
                  <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{employer.companySize} employees</span>
                )}
                {employer.companyWebsite && (
                  <a href={employer.companyWebsite} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-felovy-red hover:underline">
                    <Globe className="h-3.5 w-3.5" />{employer.companyWebsite.replace(/^https?:\/\/(www\.)?/, '')}
                  </a>
                )}
                {employer.companyLinkedin && (
                  <a href={employer.companyLinkedin} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-felovy-red hover:underline">
                    <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                  </a>
                )}
              </div>
            </div>
            <Link href={`/jobs?employer=${id}`}>
              <Button variant="gradient" size="sm">View Open Positions</Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="md:col-span-2 space-y-6">

            {/* About */}
            {employer.companySummary && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="font-semibold text-gray-900 mb-3">About {employer.companyName}</h2>
                <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{employer.companySummary}</p>
              </div>
            )}

            {/* Intro Video */}
            {employer.introVideoUrl && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="font-semibold text-gray-900 mb-4">Company Introduction</h2>
                <VideoEmbed url={employer.introVideoUrl} />
              </div>
            )}

            {/* Ad Gallery */}
            {employer.companyAdImages?.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="font-semibold text-gray-900 mb-4">Gallery</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {employer.companyAdImages.map((src, i) => (
                    <div key={i} className="relative aspect-video rounded-xl overflow-hidden bg-gray-100">
                      <Image src={src} alt={`Photo ${i + 1}`} fill className="object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar — contact */}
          <div className="space-y-4">
            {(employer.contactName || employer.contactPhotoUrl) && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h2 className="font-semibold text-gray-900 mb-4 text-sm">Contact Person</h2>
                <div className="flex items-center gap-3">
                  {employer.contactPhotoUrl ? (
                    <Image src={employer.contactPhotoUrl} alt={employer.contactName ?? ''} width={48} height={48} className="rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-felovy-light flex items-center justify-center flex-shrink-0 text-felovy-red font-bold">
                      {employer.contactName?.[0] ?? '?'}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{employer.contactName}</p>
                    {employer.contactRole && <p className="text-xs text-gray-500">{employer.contactRole}</p>}
                    {employer.contactInfo && <p className="text-xs text-gray-400 mt-0.5">{employer.contactInfo}</p>}
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h2 className="font-semibold text-gray-900 mb-3 text-sm">Quick Info</h2>
              <dl className="space-y-2 text-sm">
                {employer.companySize && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Size</dt>
                    <dd className="text-gray-800 font-medium">{employer.companySize}</dd>
                  </div>
                )}
                {employer.companyLocation && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Location</dt>
                    <dd className="text-gray-800 font-medium">{employer.companyLocation}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-gray-500">Status</dt>
                  <dd className={employer.isVerified ? 'text-green-600 font-medium' : 'text-amber-600 font-medium'}>
                    {employer.isVerified ? 'Verified' : 'Pending verification'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
