'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '@/components/shared/Navbar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/EmptyState';
import { api } from '@/lib/api';
import { Application } from '@/types';
import { timeAgo } from '@/lib/utils';
import {
  ArrowLeft, Briefcase, Loader2, MessageSquare,
} from 'lucide-react';

const statusColors: Record<string, string> = {
  PENDING: 'secondary',
  REVIEWING: 'warning',
  SHORTLISTED: 'purple',
  REJECTED: 'destructive',
  ACCEPTED: 'success',
};

export default function DeveloperApplicationsPage() {
  const { data: applications, isLoading, isError } = useQuery({
    queryKey: ['my-applications'],
    queryFn: async () => {
      const res = await api.post('/applications/mine', {});
      if (!res.ok) throw new Error('Failed to load applications');
      return res.json() as Promise<Application[]>;
    },
  });

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <Link
          href="/dashboard/developer"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-felovy-red mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        <Card>
          <CardHeader className="flex-row items-center justify-between gap-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-felovy-red" />
              My Applications
            </CardTitle>
            <Link href="/jobs">
              <Button variant="outline" size="sm">Browse Jobs</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-felovy-red" />
              </div>
            ) : isError ? (
              <p className="text-sm text-red-500 text-center py-12">
                Could not load applications. Please try again later.
              </p>
            ) : !applications?.length ? (
              <EmptyState
                illustration="empty-applications"
                title="No applications yet"
                description="Browse open roles and apply to track your progress here."
              >
                <Link href="/jobs"><Button variant="gradient" size="sm">Find Jobs</Button></Link>
              </EmptyState>
            ) : (
              <ul className="divide-y divide-gray-100">
                {applications.map(app => (
                  <li key={app.id} className="py-4 flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900">{app.job?.title || 'Job application'}</p>
                      <p className="text-sm text-gray-500">{app.job?.employer?.companyName}</p>
                      <p className="text-xs text-gray-400 mt-1">Applied {timeAgo(app.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={statusColors[app.status] as any || 'secondary'} className="text-xs">
                        {app.status}
                      </Badge>
                      {app.job?.id && (
                        <Link href={`/jobs/${app.job.id}`}>
                          <Button variant="outline" size="sm">View job</Button>
                        </Link>
                      )}
                      {app.conversation && (
                        <Link href={`/dashboard/developer/messages?c=${app.conversation.id}`}>
                          <Button variant="ghost" size="icon" title="Open messages">
                            <MessageSquare className="h-4 w-4 text-felovy-red" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
