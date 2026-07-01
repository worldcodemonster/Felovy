'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import { toast } from '@/components/ui/toaster';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Employer } from '@/types';
import { COUNTRY_NAMES } from '@/lib/countries';
import { ArrowLeft, ArrowRight, Loader2, Save } from 'lucide-react';

const schema = z.object({
  companyName:     z.string().min(2, 'Company name required'),
  companyWebsite:  z.string().url('Enter a valid URL').optional().or(z.literal('')),
  companySummary:  z.string().min(20, 'At least 20 characters').optional().or(z.literal('')),
  companySize:     z.string().optional(),
  companyLocation: z.string().optional(),
  country:         z.string().optional(),
  companyLinkedin: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  contactName:     z.string().min(2, 'Contact name required'),
  contactRole:     z.string().optional(),
  contactInfo:     z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const COMPANY_SIZES = ['1–10', '11–50', '51–200', '201–500', '500+'];

export default function CompanyInfoPage() {
  const router = useRouter();
  const qc = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['employer-me'],
    queryFn: async () => {
      const res = await api.post('/employers/me', {});
      return res.json() as Promise<Employer>;
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (profile) {
      reset({
        companyName:     profile.companyName     ?? '',
        companyWebsite:  profile.companyWebsite  ?? '',
        companySummary:  profile.companySummary  ?? '',
        companySize:     profile.companySize     ?? '',
        companyLocation: profile.companyLocation ?? '',
        country:         profile.country         ?? '',
        companyLinkedin: profile.companyLinkedin ?? '',
        contactName:     profile.contactName     ?? '',
        contactRole:     profile.contactRole     ?? '',
        contactInfo:     profile.contactInfo     ?? '',
      });
    }
  }, [profile, reset]);

  const { mutate: save, isPending } = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await api.put('/employers/me/step2', data);
      if (!res.ok) throw new Error((await res.json()).message || 'Save failed');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Company info saved!' });
      qc.invalidateQueries({ queryKey: ['employer-me'] });
      router.push('/dashboard/employer/profile/media');
    },
    onError: (e: Error) => toast({ title: e.message, variant: 'destructive' }),
  });

  return (
    <Card>
      <CardHeader><CardTitle>Company Information</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(d => save(d))} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Company Name *</label>
              <Input {...register('companyName')} placeholder="Acme Corp" className="mt-1" />
              {errors.companyName && <p className="text-xs text-red-500 mt-1">{errors.companyName.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Company Website</label>
              <Input {...register('companyWebsite')} placeholder="https://acme.com" className="mt-1" />
              {errors.companyWebsite && <p className="text-xs text-red-500 mt-1">{errors.companyWebsite.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Location</label>
              <Input {...register('companyLocation')} placeholder="San Francisco, CA" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Country</label>
              <select
                {...register('country')}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-felovy-red"
              >
                <option value="">Select country…</option>
                {COUNTRY_NAMES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Company Size</label>
              <select
                {...register('companySize')}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-felovy-red bg-white"
              >
                <option value="">Select size</option>
                {COMPANY_SIZES.map(s => <option key={s} value={s}>{s} employees</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">LinkedIn</label>
              <Input {...register('companyLinkedin')} placeholder="https://linkedin.com/company/..." className="mt-1" />
              {errors.companyLinkedin && <p className="text-xs text-red-500 mt-1">{errors.companyLinkedin.message}</p>}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Company Summary</label>
            <textarea
              {...register('companySummary')}
              rows={4}
              placeholder="Tell developers about your company, culture, and what you build..."
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-felovy-red"
            />
            {errors.companySummary && <p className="text-xs text-red-500 mt-1">{errors.companySummary.message}</p>}
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Contact Person</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Full Name *</label>
                <Input {...register('contactName')} placeholder="Jane Smith" className="mt-1" />
                {errors.contactName && <p className="text-xs text-red-500 mt-1">{errors.contactName.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Role / Title</label>
                <Input {...register('contactRole')} placeholder="Head of Engineering" className="mt-1" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-gray-700">Contact Info (email or phone)</label>
                <Input {...register('contactInfo')} placeholder="jane@acme.com" className="mt-1" />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => router.push('/dashboard/employer/profile/credentials')} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button type="submit" variant="gradient" disabled={isPending} className="gap-2">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Save &amp; Continue</>}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
