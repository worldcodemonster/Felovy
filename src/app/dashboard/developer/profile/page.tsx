'use client';

import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Navbar } from '@/components/shared/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/toaster';
import { api } from '@/lib/api';
import { COUNTRY_NAMES } from '@/lib/countries';
import { Developer, WorkExperience, Education } from '@/types';
import {
  CheckCircle2, Upload, Camera, Loader2, Plus, X, ArrowLeft, ArrowRight, Save,
  Eye, EyeOff, Mail, Lock, ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';

const step2Schema = z.object({
  fullName: z.string().min(2, 'Full name required'),
  title: z.string().min(2, 'Professional title required'),
  phone: z.string().optional(),
  location: z.string().optional(),
  country: z.string().optional(),
  gender: z.string().optional(),
  linkedin: z.string().url().optional().or(z.literal('')),
  github: z.string().url().optional().or(z.literal('')),
  summary: z.string().min(20, 'At least 20 characters').optional(),
});
type Step2Form = z.infer<typeof step2Schema>;

const STEPS = ['Credentials', 'Personal Info', 'Media', 'ID Verification'];

export default function DeveloperProfilePage() {
  return <Suspense><ProfilePageInner /></Suspense>;
}

function ProfilePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const urlStep = Number(searchParams.get('step'));
  const [activeStep, setActiveStep] = useState(urlStep >= 1 && urlStep <= 4 ? urlStep : 2);

  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [newLang, setNewLang] = useState('');
  const [workExp, setWorkExp] = useState<WorkExperience[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const idRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string>();
  const [idPreview, setIdPreview] = useState<string>();
  const [videoLink, setVideoLink] = useState('');
  const [videoType, setVideoType] = useState<'upload' | 'link'>('link');
  const formInitialized = useRef(false);

  // ── Credentials (step 1) state ─────────────────────────────────────────────
  const { user, logout } = useAuthStore();
  const [newEmail, setNewEmail] = useState('');
  const [emailOtpSentTo, setEmailOtpSentTo] = useState<string | null>(null); // non-null = OTP was sent
  const [emailOtp, setEmailOtp] = useState('');
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const { mutate: sendEmailOtp, isPending: sendingOtp } = useMutation({
    mutationFn: async () => {
      if (!newEmail.trim()) throw new Error('Enter a new email address');
      const res = await api.post('/auth/email/change/initiate', { newEmail: newEmail.trim() });
      if (!res.ok) throw new Error((await res.json()).message || 'Failed to send OTP');
    },
    onSuccess: () => {
      setEmailOtpSentTo(newEmail.trim());
      setEmailOtp('');
      toast({ title: 'Verification code sent', description: 'Check your current email inbox.' });
    },
    onError: (e: Error) => toast({ title: e.message, variant: 'destructive' }),
  });

  const { mutate: confirmEmailChange, isPending: confirmingEmail } = useMutation({
    mutationFn: async () => {
      if (!emailOtp.trim()) throw new Error('Enter the verification code');
      const res = await api.post('/auth/email/change/verify', { code: emailOtp.trim(), newEmail: emailOtpSentTo });
      if (!res.ok) throw new Error((await res.json()).message || 'Verification failed');
    },
    onSuccess: () => {
      toast({ title: 'Email updated!', description: 'Sign in again with your new email.' });
      logout();
      router.push('/signin');
    },
    onError: (e: Error) => toast({ title: e.message, variant: 'destructive' }),
  });

  const { mutate: submitPasswordChange, isPending: changingPw } = useMutation({
    mutationFn: async () => {
      if (!currentPw) throw new Error('Enter your current password');
      if (newPw.length < 8) throw new Error('New password must be at least 8 characters');
      if (newPw !== confirmPw) throw new Error('Passwords do not match');
      const res = await api.post('/auth/password/change', { currentPassword: currentPw, newPassword: newPw });
      if (!res.ok) throw new Error((await res.json()).message || 'Password change failed');
    },
    onSuccess: () => {
      toast({ title: 'Password changed successfully' });
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    },
    onError: (e: Error) => toast({ title: e.message, variant: 'destructive' }),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Step2Form>({
    resolver: zodResolver(step2Schema),
  });

  // Sync active step → URL so browser back/forward works between tabs
  const goToStep = useCallback((step: number) => {
    setActiveStep(step);
    router.push(`/dashboard/developer/profile?step=${step}`, { scroll: false });
  }, [router]);

  const { data: profile } = useQuery({
    queryKey: ['developer-me'],
    queryFn: async () => {
      const res = await api.post('/developers/me', {});
      return res.json() as Promise<Developer>;
    },
  });

  // Populate form + local state once on first data arrival.
  // Using a ref guard means background refetches (after save) won't wipe
  // anything the user has typed but not yet submitted.
  useEffect(() => {
    if (!profile || formInitialized.current) return;
    formInitialized.current = true;

    reset({
      fullName: profile.fullName || '',
      title: profile.title || '',
      phone: profile.phone || '',
      location: profile.location || '',
      country: profile.country || '',
      gender: profile.gender || '',
      linkedin: profile.linkedin || '',
      github: profile.github || '',
      summary: profile.summary || '',
    });
    setSkills(profile.skills || []);
    setLanguages(profile.languages || []);
    setWorkExp((profile.workExperience as WorkExperience[]) || []);
    setEducation((profile.education as Education[]) || []);

    // Only set step from profile when no ?step= param is in the URL
    if (!(urlStep >= 1 && urlStep <= 4)) {
      goToStep(profile.profileStep || 2);
    }
  }, [profile, reset, goToStep, urlStep]);

  const { mutate: saveStep2, isPending: s2Loading } = useMutation({
    mutationFn: (data: Step2Form) =>
      api.put('/developers/me/step2', { ...data, skills, languages, workExperience: workExp, education }),
    onSuccess: () => {
      toast({ title: 'Profile saved!', description: 'Your personal info has been updated.' });
      queryClient.invalidateQueries({ queryKey: ['developer-me'] });
      goToStep(3);
    },
    onError: () => toast({ title: 'Save failed', variant: 'destructive' }),
  });

  const { mutate: saveStep3, isPending: s3Loading } = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      if (photoRef.current?.files?.[0]) fd.append('photo', photoRef.current.files[0]);
      if (videoType === 'upload' && videoRef.current?.files?.[0]) fd.append('introVideo', videoRef.current.files[0]);
      fd.append('introVideoType', videoType);
      if (videoType === 'link') fd.append('introVideoLink', videoLink);
      return api.put('/developers/me/step3', fd);
    },
    onSuccess: () => {
      toast({ title: 'Media uploaded!' });
      queryClient.invalidateQueries({ queryKey: ['developer-me'] });
      goToStep(4);
    },
    onError: () => toast({ title: 'Upload failed', variant: 'destructive' }),
  });

  const { mutate: saveStep4, isPending: s4Loading } = useMutation({
    mutationFn: async () => {
      if (!idRef.current?.files?.[0]) throw new Error('Please select an ID card file to upload');
      const fd = new FormData();
      fd.append('idCard', idRef.current.files[0]);
      const res = await api.put('/developers/me/step4', fd);
      if (!res.ok) throw new Error((await res.json()).message || 'Upload failed');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Profile submitted for review!', description: 'Admins will review and verify your profile.' });
      setIdPreview(undefined);
      queryClient.invalidateQueries({ queryKey: ['developer-me'] });
    },
    onError: (e: Error) => toast({ title: e.message, variant: 'destructive' }),
  });

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills(s => [...s, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const addLang = () => {
    if (newLang.trim() && !languages.includes(newLang.trim())) {
      setLanguages(l => [...l, newLang.trim()]);
      setNewLang('');
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <Link href="/dashboard/developer" className="flex items-center gap-1 text-sm text-gray-500 hover:text-felovy-red mb-6">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
        <p className="text-gray-500 text-sm mb-8">Complete all steps to get verified and apply for jobs.</p>

        {/* Step tabs */}
        <div className="flex gap-1 mb-6 overflow-x-auto">
          {STEPS.map((s, i) => {
            const step = i + 1;
            const completed = (profile?.profileStep || 0) >= step;
            const reachable = step <= (profile?.profileStep || 0) + 1;
            return (
              <button
                key={s}
                disabled={!reachable}
                onClick={() => reachable && goToStep(step)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:cursor-not-allowed ${
                  activeStep === step
                    ? 'bg-felovy-red text-white'
                    : completed
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {completed && activeStep !== step ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
                {step}. {s}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Credentials */}
          {activeStep === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="space-y-4">
                {/* ── Change Email ─────────────────────────────────── */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Mail className="h-4 w-4 text-felovy-red" /> Change Email
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-500">
                      Current: <span className="font-medium text-gray-800">{user?.email}</span>
                    </div>

                    {!emailOtpSentTo ? (
                      <div className="flex gap-2">
                        <Input
                          type="email"
                          placeholder="New email address"
                          value={newEmail}
                          onChange={e => setNewEmail(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && sendEmailOtp()}
                        />
                        <Button variant="outline" onClick={() => sendEmailOtp()} disabled={sendingOtp} className="shrink-0">
                          {sendingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Code'}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-500">
                          A verification code was sent to <strong>{user?.email}</strong>. Enter it below to confirm the change to <strong>{emailOtpSentTo}</strong>.
                        </p>
                        <div className="flex gap-2">
                          <Input
                            placeholder="6-digit code"
                            maxLength={6}
                            value={emailOtp}
                            onChange={e => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                            onKeyDown={e => e.key === 'Enter' && confirmEmailChange()}
                            className="tracking-widest font-mono text-center"
                          />
                          <Button variant="gradient" onClick={() => confirmEmailChange()} disabled={confirmingEmail} className="shrink-0">
                            {confirmingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ShieldCheck className="h-4 w-4" /> Confirm</>}
                          </Button>
                        </div>
                        <button
                          className="text-xs text-felovy-red hover:underline"
                          onClick={() => { setEmailOtpSentTo(null); setEmailOtp(''); }}
                        >
                          ← Use a different email
                        </button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* ── Change Password ──────────────────────────────── */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Lock className="h-4 w-4 text-felovy-red" /> Change Password
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Current password */}
                    <div className="relative">
                      <Input
                        type={showCurrentPw ? 'text' : 'password'}
                        placeholder="Current password"
                        value={currentPw}
                        onChange={e => setCurrentPw(e.target.value)}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowCurrentPw(v => !v)}
                      >
                        {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    {/* New password */}
                    <div className="relative">
                      <Input
                        type={showNewPw ? 'text' : 'password'}
                        placeholder="New password (min 8 characters)"
                        value={newPw}
                        onChange={e => setNewPw(e.target.value)}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowNewPw(v => !v)}
                      >
                        {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    {/* Confirm password */}
                    <Input
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPw}
                      onChange={e => setConfirmPw(e.target.value)}
                    />

                    {newPw && confirmPw && newPw !== confirmPw && (
                      <p className="text-xs text-red-500">Passwords do not match</p>
                    )}

                    <Button
                      variant="gradient"
                      onClick={() => submitPasswordChange()}
                      disabled={changingPw || !currentPw || !newPw || !confirmPw}
                      className="gap-2"
                    >
                      {changingPw ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Change Password</>}
                    </Button>
                  </CardContent>
                </Card>

                <Button variant="gradient" onClick={() => goToStep(2)} className="w-full">
                  Next: Personal Info <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Personal Info */}
          {activeStep === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card>
                <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(d => saveStep2(d))} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Full Name *</label>
                        <Input {...register('fullName')} placeholder="John Doe" className="mt-1" />
                        {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName.message}</p>}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Professional Title *</label>
                        <Input {...register('title')} placeholder="Senior React Developer" className="mt-1" />
                        {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Phone</label>
                        <Input {...register('phone')} placeholder="+1 234 567 8900" className="mt-1" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Location</label>
                        <Input {...register('location')} placeholder="New York, USA" className="mt-1" />
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
                        <label className="text-sm font-medium text-gray-700">Gender</label>
                        <select
                          {...register('gender')}
                          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-felovy-red"
                        >
                          <option value="">Prefer not to say</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">LinkedIn URL</label>
                        <Input {...register('linkedin')} placeholder="https://linkedin.com/in/..." className="mt-1" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">GitHub URL</label>
                        <Input {...register('github')} placeholder="https://github.com/..." className="mt-1" />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">Professional Summary</label>
                      <textarea
                        {...register('summary')}
                        rows={4}
                        placeholder="Tell employers about yourself..."
                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-felovy-red"
                      />
                    </div>

                    {/* Skills */}
                    <div>
                      <label className="text-sm font-medium text-gray-700">Skills</label>
                      <div className="flex gap-2 mt-1">
                        <Input value={newSkill} onChange={e => setNewSkill(e.target.value)} placeholder="e.g. React" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())} />
                        <Button type="button" variant="outline" size="icon" onClick={addSkill}><Plus className="h-4 w-4" /></Button>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {skills.map(s => (
                          <Badge key={s} variant="default" className="gap-1">
                            {s} <button type="button" onClick={() => setSkills(sk => sk.filter(x => x !== s))}><X className="h-2.5 w-2.5" /></button>
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Languages */}
                    <div>
                      <label className="text-sm font-medium text-gray-700">Languages</label>
                      <div className="flex gap-2 mt-1">
                        <Input value={newLang} onChange={e => setNewLang(e.target.value)} placeholder="e.g. English" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addLang())} />
                        <Button type="button" variant="outline" size="icon" onClick={addLang}><Plus className="h-4 w-4" /></Button>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {languages.map(l => (
                          <Badge key={l} variant="secondary" className="gap-1">
                            {l} <button type="button" onClick={() => setLanguages(ls => ls.filter(x => x !== l))}><X className="h-2.5 w-2.5" /></button>
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => goToStep(1)} type="button">← Back</Button>
                      <Button type="submit" variant="gradient" className="gap-2" disabled={s2Loading}>
                        {s2Loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Save & Continue</>}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Media */}
          {activeStep === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card>
                <CardHeader><CardTitle>Photo & Introduction Video</CardTitle></CardHeader>
                <CardContent className="space-y-5">
                  {/* Photo */}
                  <div>
                    <label className="text-sm font-medium text-gray-700">Profile Photo</label>
                    <div className="mt-2 flex items-center gap-4">
                      {photoPreview ? (
                        <Image src={photoPreview} alt="Preview" width={72} height={72} className="rounded-full object-cover" />
                      ) : profile?.photoUrl ? (
                        <Image src={profile.photoUrl} alt="Current" width={72} height={72} className="rounded-full object-cover" />
                      ) : (
                        <div className="h-18 w-18 rounded-full bg-gray-100 flex items-center justify-center">
                          <Camera className="h-8 w-8 text-gray-300" />
                        </div>
                      )}
                      <div className="space-y-2">
                        <Button variant="outline" size="sm" type="button" onClick={() => photoRef.current?.click()} className="gap-2">
                          <Upload className="h-4 w-4" /> Upload Photo
                        </Button>
                        <p className="text-xs text-gray-400">JPG, PNG. Max 5MB.</p>
                        <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={e => {
                          const f = e.target.files?.[0];
                          if (f) setPhotoPreview(URL.createObjectURL(f));
                        }} />
                      </div>
                    </div>
                  </div>

                  {/* Intro Video */}
                  <div>
                    <label className="text-sm font-medium text-gray-700">Introduction Video (1 min)</label>
                    <div className="flex gap-2 mt-2">
                      {(['link', 'upload'] as const).map(t => (
                        <button key={t} type="button" onClick={() => setVideoType(t)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${videoType === t ? 'border-felovy-red bg-felovy-light text-felovy-red' : 'border-gray-200'}`}>
                          {t === 'link' ? '🔗 Paste Link' : '📤 Upload File'}
                        </button>
                      ))}
                    </div>
                    <div className="mt-3">
                      {videoType === 'link' ? (
                        <Input value={videoLink} onChange={e => setVideoLink(e.target.value)} placeholder="YouTube, Google Drive, or any video URL" />
                      ) : (
                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-felovy-red transition-colors" onClick={() => videoRef.current?.click()}>
                          <Upload className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">Click to upload video (MP4, max 100MB)</p>
                          <input ref={videoRef} type="file" accept="video/*" className="hidden" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-amber-600 mt-1">Adding a photo and video increases your chances of being hired by 2×</p>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => goToStep(2)}>← Back</Button>
                    <Button variant="gradient" onClick={() => saveStep3()} disabled={s3Loading} className="gap-2">
                      {s3Loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Save & Continue</>}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 4: ID Verification */}
          {activeStep === 4 && (
            <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card>
                <CardHeader><CardTitle>ID Verification</CardTitle></CardHeader>
                <CardContent className="space-y-5">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
                    <strong>Why we need this:</strong> Your ID helps us verify your identity and build trust with employers.
                    Your ID is stored securely and only visible to our admins.
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Upload National ID / Passport</label>
                    <div
                      className="mt-2 border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-felovy-red transition-colors"
                      onClick={() => idRef.current?.click()}
                    >
                      {(idPreview || profile?.idCardUrl) ? (
                        <div className="space-y-2">
                          <Image
                            src={idPreview || profile!.idCardUrl!}
                            alt="ID Card"
                            width={400}
                            height={240}
                            className="mx-auto rounded-lg object-contain max-h-60 w-auto"
                          />
                          <p className="text-xs text-gray-500">
                            {idPreview ? 'New file selected. Click Submit to save' : '✓ ID uploaded. Click to replace.'}
                          </p>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">Upload a clear photo of your government-issued ID</p>
                          <p className="text-xs text-gray-400 mt-1">JPG or PNG. Max 10MB.</p>
                        </>
                      )}
                      <input
                        ref={idRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          const f = e.target.files?.[0];
                          if (f) setIdPreview(URL.createObjectURL(f));
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => goToStep(3)}>← Back</Button>
                    <Button variant="gradient" onClick={() => saveStep4()} disabled={s4Loading} className="gap-2">
                      {s4Loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit for Review'}
                    </Button>
                  </div>

                  {profile?.isVerified && (
                    <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                      <CheckCircle2 className="h-4 w-4" /> Your profile is verified!
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
