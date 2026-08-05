'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/components/ui/toaster';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { COUNTRY_NAMES } from '@/lib/countries';
import { COMPANY_SIZES } from '@/lib/employer-creation-data';
import { OWNER_EMPLOYER_DEFAULT_PASSWORD } from '@/lib/employer-bot-constants';
import {
  ArrowLeft, Building2, Loader2, Sparkles, UserPlus, Bot,
} from 'lucide-react';

const DEFAULT_PASSWORD = OWNER_EMPLOYER_DEFAULT_PASSWORD;

const manualSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'At least 8 characters'),
  companyName: z.string().min(2, 'Company name required'),
  contactName: z.string().min(2, 'Contact name required'),
  companyWebsite: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  companySummary: z.string().optional(),
  companySize: z.string().optional(),
  companyLocation: z.string().optional(),
  country: z.string().optional(),
  companyLinkedin: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  contactRole: z.string().optional(),
  contactInfo: z.string().optional(),
  isVerified: z.boolean().optional(),
});
type ManualForm = z.infer<typeof manualSchema>;

type CreatedEmployer = {
  id: string;
  companyName: string;
  email: string;
  country: string;
  isVerified: boolean;
};

function Chip({
  active, label, onClick,
}: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
        active
          ? 'bg-felovy-red text-white border-felovy-red shadow-sm shadow-green-200'
          : 'bg-white text-gray-600 border-gray-200 hover:border-felovy-red/40 hover:text-felovy-red'
      }`}
    >
      {label}
    </button>
  );
}

export default function CreateEmployerPage() {
  const qc = useQueryClient();
  const [batchCount, setBatchCount] = useState(5);
  const [batchPassword, setBatchPassword] = useState(DEFAULT_PASSWORD);
  const [batchVerified, setBatchVerified] = useState(true);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [countrySearch, setCountrySearch] = useState('');
  const [created, setCreated] = useState<CreatedEmployer[]>([]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ManualForm>({
    resolver: zodResolver(manualSchema),
    defaultValues: {
      password: DEFAULT_PASSWORD,
      isVerified: true,
    },
  });

  const filteredCountries = countrySearch.trim()
    ? COUNTRY_NAMES.filter(c => c.toLowerCase().includes(countrySearch.toLowerCase()))
    : COUNTRY_NAMES;

  const toggleCountry = (country: string) => {
    setSelectedCountries(prev =>
      prev.includes(country) ? prev.filter(c => c !== country) : [...prev, country],
    );
  };

  const { mutate: createOne, isPending: creatingOne } = useMutation({
    mutationFn: async (data: ManualForm) => {
      const res = await api.post('/owner/employers/create', data);
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || 'Failed to create employer');
      return body as { message: string; employer: CreatedEmployer };
    },
    onSuccess: (result) => {
      setCreated(prev => [result.employer, ...prev]);
      toast({ title: result.message });
      qc.invalidateQueries({ queryKey: ['owner-emps'] });
      reset({ password: DEFAULT_PASSWORD, isVerified: true });
    },
    onError: (err: Error) => toast({ title: err.message, variant: 'destructive' }),
  });

  const { mutate: createBatch, isPending: creatingBatch } = useMutation({
    mutationFn: async () => {
      const res = await api.post('/owner/employers/create/batch', {
        count: batchCount,
        password: batchPassword,
        countries: selectedCountries.length ? selectedCountries : undefined,
        isVerified: batchVerified,
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || 'Failed to generate employers');
      return body as { message: string; employers: CreatedEmployer[]; errors: string[] };
    },
    onSuccess: (result) => {
      setCreated(prev => [...result.employers, ...prev]);
      toast({ title: result.message });
      if (result.errors?.length) {
        toast({
          title: `${result.errors.length} error(s) during batch`,
          description: result.errors.slice(0, 3).join(' · '),
          variant: 'destructive',
        });
      }
      qc.invalidateQueries({ queryKey: ['owner-emps'] });
    },
    onError: (err: Error) => toast({ title: err.message, variant: 'destructive' }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/dashboard/owner/employers"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-felovy-red"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Employers
          </Link>
          <Link
            href="/dashboard/owner/employers/bot"
            className="inline-flex items-center gap-2 text-sm font-semibold text-violet-600 hover:underline"
          >
            <Bot className="h-4 w-4" />
            Company Bot (bulk)
          </Link>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Building2 className="h-6 w-6 text-felovy-red" />
          Create Employer Accounts
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Owner-created accounts skip signup OTP. Default password: <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{DEFAULT_PASSWORD}</code>
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-felovy-red" />
              Create one employer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(d => createOne(d))} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Email *</label>
                  <Input {...register('email')} placeholder="hr@company.com" className="mt-1" />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Password *</label>
                  <Input {...register('password')} type="password" className="mt-1" />
                  {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Company Name *</label>
                  <Input {...register('companyName')} placeholder="Acme Corp" className="mt-1" />
                  {errors.companyName && <p className="text-xs text-red-500 mt-1">{errors.companyName.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Contact Name *</label>
                  <Input {...register('contactName')} placeholder="Jane Smith" className="mt-1" />
                  {errors.contactName && <p className="text-xs text-red-500 mt-1">{errors.contactName.message}</p>}
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
                  <label className="text-sm font-medium text-gray-700">Location</label>
                  <Input {...register('companyLocation')} placeholder="San Francisco, CA" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Company Size</label>
                  <select
                    {...register('companySize')}
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-felovy-red"
                  >
                    <option value="">Select size</option>
                    {COMPANY_SIZES.map(s => <option key={s} value={s}>{s} employees</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Contact Role</label>
                  <Input {...register('contactRole')} placeholder="HR Manager" className="mt-1" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Website</label>
                  <Input {...register('companyWebsite')} placeholder="https://acme.com" className="mt-1" />
                  {errors.companyWebsite && <p className="text-xs text-red-500 mt-1">{errors.companyWebsite.message}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Company Summary</label>
                  <textarea
                    {...register('companySummary')}
                    rows={3}
                    placeholder="Brief description of the company…"
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-felovy-red"
                  />
                </div>
              </div>

              <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" {...register('isVerified')} className="rounded border-gray-300 accent-felovy-red" />
                Mark as verified
              </label>

              <Button type="submit" variant="gradient" disabled={creatingOne} className="gap-2">
                {creatingOne ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                Create employer
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-felovy-red" />
              Generate test employers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-gray-500">
              Creates up to 20 employers with random company names, contacts, and test emails.
            </p>

            <div>
              <label className="text-sm font-medium text-gray-700">How many</label>
              <Input
                type="number"
                min={1}
                max={20}
                value={batchCount}
                onChange={e => setBatchCount(Math.min(20, Math.max(1, Number(e.target.value) || 1)))}
                className="mt-1 max-w-[8rem]"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Shared password</label>
              <Input
                type="password"
                value={batchPassword}
                onChange={e => setBatchPassword(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Countries (optional)</label>
              <Input
                value={countrySearch}
                onChange={e => setCountrySearch(e.target.value)}
                placeholder="Search countries…"
                className="mb-2"
              />
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {filteredCountries.slice(0, 24).map(c => (
                  <Chip key={c} active={selectedCountries.includes(c)} label={c} onClick={() => toggleCountry(c)} />
                ))}
              </div>
              {selectedCountries.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedCountries([])}
                  className="text-xs text-gray-400 hover:text-felovy-red mt-2"
                >
                  Clear countries
                </button>
              )}
            </div>

            <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={batchVerified}
                onChange={e => setBatchVerified(e.target.checked)}
                className="rounded border-gray-300 accent-felovy-red"
              />
              Mark as verified
            </label>

            <Button
              type="button"
              variant="gradient"
              disabled={creatingBatch || batchPassword.length < 8}
              onClick={() => createBatch()}
              className="gap-2"
            >
              {creatingBatch ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generate {batchCount} employer{batchCount === 1 ? '' : 's'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {created.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recently created</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-gray-100">
              {created.map(emp => (
                <li key={emp.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{emp.companyName}</p>
                    <p className="text-xs text-gray-500">{emp.email} · {emp.country}{emp.isVerified ? ' · Verified' : ''}</p>
                  </div>
                  <Link href={`/dashboard/owner/employers/${emp.id}`} className="text-xs font-semibold text-felovy-red hover:underline">
                    View profile
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
