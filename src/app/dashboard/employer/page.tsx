'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from '@/components/shared/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import { Employer, Job } from '@/types';
import { EmptyState } from '@/components/shared/EmptyState';
import { Plus, Briefcase, Users, MessageSquare, Settings, Loader2, AlertCircle, CheckCircle, Search } from 'lucide-react';

const jobStatusColors: Record<string, string> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'destructive',
  DISABLED: 'secondary',
};

export default function EmployerDashboard() {
  const { user } = useAuthStore();

  const { data: profile, isLoading: pLoading } = useQuery({
    queryKey: ['employer-me'],
    queryFn: async () => { const r = await api.post('/employers/me', {}); return r.json() as Promise<Employer>; },
  });

  const { data: jobs } = useQuery({
    queryKey: ['employer-jobs'],
    queryFn: async () => { const r = await api.post('/jobs/employer/mine', {}); return r.json() as Promise<Job[]>; },
  });

  if (pLoading) return (
    <div className="min-h-screen"><Navbar />
      <div className="flex justify-center pt-20"><Loader2 className="h-8 w-8 animate-spin text-felovy-red" /></div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <div className="relative glass-card rounded-2xl p-6 mb-8 overflow-hidden">
          <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-felovy-red/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-felovy-purple/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex items-center gap-4">
            {profile?.companyLogoUrl ? (
              <Image src={profile.companyLogoUrl} alt="Logo" width={60} height={60} className="rounded-xl ring-2 ring-felovy-red/30 object-cover flex-shrink-0" />
            ) : (
              <div className="h-[60px] w-[60px] rounded-xl bg-gradient-to-br from-felovy-red to-felovy-purple flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
                {(profile?.companyName || user?.email || 'C')[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 truncate">{profile?.companyName || 'Your Company'}</h1>
              <p className="text-gray-500 text-sm">{profile?.contactName} · {profile?.contactRole}</p>
              {profile?.isVerified && (
                <Badge className="mt-1 gap-1 text-xs" variant="success">
                  <CheckCircle className="h-3 w-3" /> Verified Employer
                </Badge>
              )}
            </div>
            <div className="ml-auto flex-shrink-0">
              <Link href="/dashboard/employer/jobs/new">
                <Button variant="gradient" className="gap-2" disabled={!profile?.isVerified}>
                  <Plus className="h-4 w-4" /> Post Job
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {!profile?.isVerified && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 mb-6">
            <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Complete your company profile to post jobs</p>
              <p className="text-sm text-amber-600 mt-0.5">Your profile needs admin approval before you can post jobs or view developer profiles.</p>
              <Link href="/dashboard/employer/profile">
                <Button variant="outline" size="sm" className="mt-2 border-amber-300">Complete Profile</Button>
              </Link>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Job postings */}
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-felovy-red" /> My Job Postings
                </CardTitle>
                <Link href="/dashboard/employer/jobs/new">
                  <Button variant="gradient" size="sm" className="gap-1" disabled={!profile?.isVerified}>
                    <Plus className="h-3 w-3" /> Post Job
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {!jobs?.length ? (
                  <EmptyState
                    illustration="empty-jobs"
                    title="No jobs posted yet"
                    description="Post your first role to start receiving applications"
                    compact
                  />
                ) : (
                  <div className="space-y-3">
                    {jobs.map(job => (
                      <div key={job.id} className="flex items-center justify-between p-3 rounded-lg bg-white/50 hover:bg-white/80 transition-colors">
                        <div>
                          <p className="font-medium text-sm text-gray-900">{job.title}</p>
                          <p className="text-xs text-gray-500">{job._count?.applications} applicants · {job.locationType}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={jobStatusColors[job.status] as any || 'secondary'} className="text-xs">{job.status}</Badge>
                          <Link href={`/dashboard/employer/jobs/${job.id}`}>
                            <Button variant="outline" size="sm">Manage</Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 text-sm mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <Link href="/dashboard/employer/profile"><Button variant="outline" size="sm" className="w-full gap-2 justify-start"><Settings className="h-4 w-4" /> Company Profile</Button></Link>
                  <Link href="/dashboard/employer/messages"><Button variant="outline" size="sm" className="w-full gap-2 justify-start"><MessageSquare className="h-4 w-4" /> Messages</Button></Link>
                  <Link href="/dashboard/employer/developers"><Button variant="outline" size="sm" className="w-full gap-2 justify-start"><Search className="h-4 w-4" /> Browse Developers</Button></Link>
                  <Link href="/dashboard/employer/jobs/new"><Button variant="outline" size="sm" className="w-full gap-2 justify-start" disabled={!profile?.isVerified}><Plus className="h-4 w-4" /> Post New Job</Button></Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-gray-900 text-sm">Stats</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Active Jobs</span><span className="font-semibold">{jobs?.filter(j => j.status === 'APPROVED' && j.isEnabled).length || 0}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Total Jobs</span><span className="font-semibold">{jobs?.length || 0}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Profile Step</span><span className="font-semibold">{profile?.profileStep || 1}/4</span></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
