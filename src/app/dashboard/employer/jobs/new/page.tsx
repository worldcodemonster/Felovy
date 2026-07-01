'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { Navbar } from '@/components/shared/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/toaster';
import { api } from '@/lib/api';
import { ArrowLeft, Plus, X, Loader2 } from 'lucide-react';

const schema = z.object({
  title: z.string().min(3, 'Job title required'),
  companyLocation: z.string().optional(),
  locationType: z.enum(['REMOTE', 'HYBRID', 'ONSITE']),
  salaryMin: z.string().optional(),
  salaryMax: z.string().optional(),
  salaryType: z.enum(['HOURLY', 'MONTHLY', 'YEARLY']).optional(),
  currency: z.string().optional(),
  industry: z.string().optional(),
  description: z.string().min(50, 'Please add at least 50 characters of description'),
});
type Form = z.infer<typeof schema>;

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'SGD'];

export default function PostJobPage() {
  const router = useRouter();
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [niceSkills, setNiceSkills] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [newNice, setNewNice] = useState('');
  const [newLang, setNewLang] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { locationType: 'REMOTE', currency: 'USD', salaryType: 'MONTHLY' },
  });

  const { mutate: post, isPending } = useMutation({
    mutationFn: (data: Form) => {
      const fd = new FormData();
      Object.entries(data).forEach(([k, v]) => v && fd.append(k, String(v)));
      fd.append('requiredSkills', JSON.stringify(requiredSkills));
      fd.append('niceToHaveSkills', JSON.stringify(niceSkills));
      fd.append('languages', JSON.stringify(languages));
      if (logoFile) fd.append('logo', logoFile);
      return api.post('/jobs', fd);
    },
    onSuccess: () => {
      toast({ title: 'Job submitted!', description: 'Awaiting admin approval before going live.' });
      router.push('/dashboard/employer');
    },
    onError: () => toast({ title: 'Failed to post job', variant: 'destructive' }),
  });

  const addTag = (list: string[], setList: (v: string[]) => void, val: string, setVal: (v: string) => void) => {
    if (val.trim() && !list.includes(val.trim())) { setList([...list, val.trim()]); setVal(''); }
  };
  const removeTag = (list: string[], setList: (v: string[]) => void, tag: string) => setList(list.filter(t => t !== tag));

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <Link href="/dashboard/employer" className="flex items-center gap-1 text-sm text-gray-500 hover:text-felovy-red mb-6">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Post a New Job</h1>
        <p className="text-gray-500 text-sm mb-8">Jobs go live after admin approval.</p>

        <form onSubmit={handleSubmit(d => post(d))} className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Basic Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Job Title *</label>
                <Input {...register('title')} placeholder="Senior React Developer" className="mt-1" />
                {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Company Location</label>
                  <Input {...register('companyLocation')} placeholder="New York, USA" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Location Type *</label>
                  <select {...register('locationType')} className="mt-1 w-full h-10 rounded-lg border border-input px-3 text-sm focus:ring-2 focus:ring-felovy-red focus:outline-none">
                    <option value="REMOTE">Remote</option>
                    <option value="HYBRID">Hybrid</option>
                    <option value="ONSITE">Onsite</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Industry</label>
                <Input {...register('industry')} placeholder="Technology, Finance, Healthcare..." className="mt-1" />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Job Logo</label>
                <input type="file" accept="image/*" className="mt-1 text-sm" onChange={e => setLogoFile(e.target.files?.[0] || null)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Salary</CardTitle></CardHeader>
            <CardContent className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Min Salary</label>
                <Input {...register('salaryMin')} type="number" placeholder="50000" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Max Salary</label>
                <Input {...register('salaryMax')} type="number" placeholder="80000" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Pay Period</label>
                <select {...register('salaryType')} className="mt-1 w-full h-10 rounded-lg border border-input px-3 text-sm focus:ring-2 focus:ring-felovy-red focus:outline-none">
                  <option value="MONTHLY">Monthly</option>
                  <option value="YEARLY">Yearly</option>
                  <option value="HOURLY">Hourly</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Currency</label>
                <select {...register('currency')} className="mt-1 w-full h-10 rounded-lg border border-input px-3 text-sm focus:ring-2 focus:ring-felovy-red focus:outline-none">
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Skills & Languages</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: 'Required Skills *', list: requiredSkills, setList: setRequiredSkills, val: newSkill, setVal: setNewSkill },
                { label: 'Nice to Have Skills', list: niceSkills, setList: setNiceSkills, val: newNice, setVal: setNewNice },
                { label: 'Languages', list: languages, setList: setLanguages, val: newLang, setVal: setNewLang },
              ].map(({ label, list, setList, val, setVal }) => (
                <div key={label}>
                  <label className="text-sm font-medium text-gray-700">{label}</label>
                  <div className="flex gap-2 mt-1">
                    <Input value={val} onChange={e => setVal(e.target.value)} placeholder="Type and press Enter" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag(list, setList, val, setVal))} />
                    <Button type="button" variant="outline" size="icon" onClick={() => addTag(list, setList, val, setVal)}><Plus className="h-4 w-4" /></Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {list.map(t => (
                      <Badge key={t} variant="default" className="gap-1">
                        {t} <button type="button" onClick={() => removeTag(list, setList, t)}><X className="h-2.5 w-2.5" /></button>
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Job Description *</CardTitle></CardHeader>
            <CardContent>
              <textarea
                {...register('description')}
                rows={8}
                placeholder="Describe the role, responsibilities, requirements..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-felovy-red"
              />
              {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Link href="/dashboard/employer"><Button variant="outline" type="button">Cancel</Button></Link>
            <Button type="submit" variant="gradient" disabled={isPending} className="gap-2">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit for Review'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
