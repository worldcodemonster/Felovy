'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from '@/components/shared/Navbar';
import { DeveloperProfileStepper } from '@/components/profile/DeveloperProfileStepper';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import { Developer, Application } from '@/types';
import {
  Briefcase, MessageSquare, User, CheckCircle,
  ChevronRight, Loader2, AlertCircle, Eye,
} from 'lucide-react';

const statusColors: Record<string, string> = {
  PENDING: 'secondary',
  REVIEWING: 'warning',
  SHORTLISTED: 'purple',
  REJECTED: 'destructive',
  ACCEPTED: 'success',
};

export default function DeveloperDashboard() {
  const { user } = useAuthStore();

  const { data: profile, isLoading: pLoading } = useQuery({
    queryKey: ['developer-me'],
    queryFn: async () => {
      const res = await api.post('/developers/me', {});
      return res.json() as Promise<Developer>;
    },
  });

  const { data: applications } = useQuery({
    queryKey: ['my-applications'],
    queryFn: async () => {
      const res = await api.post('/applications/mine', {});
      return res.json() as Promise<Application[]>;
    },
  });

  if (pLoading) {
    return (
      <div className="min-h-screen"><Navbar />
        <div className="flex justify-center pt-20"><Loader2 className="h-8 w-8 animate-spin text-felovy-red" /></div>
      </div>
    );
  }

  const profileComplete = profile?.profileStep === 4;
  const isVerified = profile?.isVerified;

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto max-w-5xl px-4 py-8">
        {/* Welcome banner */}
        <div className="relative glass-card rounded-2xl p-6 mb-8 overflow-hidden">
          <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-felovy-red/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-felovy-purple/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex items-center gap-4">
            {profile?.photoUrl ? (
              <Image src={profile.photoUrl} alt="Photo" width={60} height={60} className="rounded-full ring-2 ring-felovy-red/30 object-cover" />
            ) : (
              <div className="h-[60px] w-[60px] rounded-full bg-gradient-to-br from-felovy-red to-felovy-purple flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
                {(profile?.fullName || user?.email || 'D')[0].toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {profile?.fullName ? `Hi, ${profile.fullName.split(' ')[0]}!` : 'Welcome to Felovy!'}
              </h1>
              <p className="text-gray-500 text-sm">{profile?.title || 'Complete your profile to get started'}</p>
              {isVerified && (
                <Badge className="mt-1 gap-1 text-xs" variant="success">
                  <CheckCircle className="h-3 w-3" /> Verified Developer
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Profile stepper */}
            {!profileComplete && (
              <Card className="border-felovy-light/40">
                <CardHeader><CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500" /> Complete Your Profile
                </CardTitle></CardHeader>
                <CardContent>
                  <DeveloperProfileStepper currentStep={profile?.profileStep || 1} />
                </CardContent>
              </Card>
            )}

            {/* Applications */}
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-felovy-red" /> My Applications
                </CardTitle>
                <Link href="/jobs">
                  <Button variant="outline" size="sm">Browse Jobs</Button>
                </Link>
              </CardHeader>
              <CardContent>
                {!applications?.length ? (
                  <div className="text-center py-8 text-gray-400">
                    <Briefcase className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No applications yet</p>
                    <Link href="/jobs"><Button variant="gradient" size="sm" className="mt-3">Find Jobs</Button></Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {applications.slice(0, 5).map(app => (
                      <div key={app.id} className="flex items-center justify-between p-3 rounded-lg bg-white/50 hover:bg-white/80 transition-colors">
                        <div>
                          <p className="font-medium text-sm text-gray-900">{app.job?.title}</p>
                          <p className="text-xs text-gray-500">{app.job?.employer?.companyName}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={statusColors[app.status] as any || 'secondary'} className="text-xs">
                            {app.status}
                          </Badge>
                          {app.conversation && (
                            <Link href={`/dashboard/developer/messages/${app.conversation.id}`}>
                              <MessageSquare className="h-4 w-4 text-felovy-red" />
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                    {applications.length > 5 && (
                      <Link href="/dashboard/developer/applications" className="flex items-center justify-center text-sm text-felovy-red hover:underline pt-2">
                        View all {applications.length} applications <ChevronRight className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Stats sidebar */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-gray-900 text-sm">Profile Stats</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Applications</span>
                    <span className="font-semibold">{applications?.length || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Profile Step</span>
                    <span className="font-semibold">{profile?.profileStep || 1} / 4</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Status</span>
                    <Badge variant={isVerified ? 'success' : 'secondary'} className="text-xs">
                      {isVerified ? 'Verified' : 'Pending'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 text-sm mb-3">Quick Actions</h3>
                <div className="flex flex-col gap-1">
                  {[
                    {
                      href: '/dashboard/developer/profile',
                      icon: User,
                      label: 'Edit Profile',
                      desc: 'Update your info & media',
                      iconBg: 'bg-felovy-red/10 text-felovy-red',
                    },
                    {
                      href: '/jobs',
                      icon: Briefcase,
                      label: 'Browse Jobs',
                      desc: 'Find new opportunities',
                      iconBg: 'bg-blue-50 text-blue-600',
                    },
                    {
                      href: '/dashboard/developer/messages',
                      icon: MessageSquare,
                      label: 'Messages',
                      desc: 'Chat with employers',
                      iconBg: 'bg-purple-50 text-purple-600',
                    },
                    ...(profile?.id ? [{
                      href: `/developers/${profile.id}`,
                      icon: Eye,
                      label: 'Public Profile',
                      desc: 'See how others view you',
                      iconBg: 'bg-emerald-50 text-emerald-600',
                    }] : []),
                  ].map(({ href, icon: Icon, label, desc, iconBg }) => (
                    <Link
                      key={href}
                      href={href}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-gray-50 transition-colors group"
                    >
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 leading-tight">{label}</p>
                        <p className="text-xs text-gray-400 leading-tight mt-0.5">{desc}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
