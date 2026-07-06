'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/shared/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/toaster';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { ArrowLeft, Loader2, Mail, Lock, CheckCircle2, Eye, EyeOff } from 'lucide-react';

// ── Email change ─────────────────────────────────────────────────────────────

const emailInitSchema = z.object({
  newEmail: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your current password'),
});
type EmailInitForm = z.infer<typeof emailInitSchema>;

const emailVerifySchema = z.object({ code: z.string().length(6, 'Enter the 6-digit code') });
type EmailVerifyForm = z.infer<typeof emailVerifySchema>;

// ── Password change ───────────────────────────────────────────────────────────

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password'),
  newPassword: z.string().min(8, 'At least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});
type PasswordForm = z.infer<typeof passwordSchema>;

// ── Component ─────────────────────────────────────────────────────────────────

export default function EmployerSettingsPage() {
  const { user, login } = useAuthStore();

  const [emailStep, setEmailStep] = useState<'idle' | 'otp' | 'done'>('idle');
  const [emailLoading, setEmailLoading] = useState(false);
  const [showCurrentPw, setShowCurrentPw]   = useState(false);
  const [showNewPw,     setShowNewPw]       = useState(false);
  const [pwLoading,     setPwLoading]       = useState(false);

  const emailInitForm = useForm<EmailInitForm>({ resolver: zodResolver(emailInitSchema) });
  const emailVerifyForm = useForm<EmailVerifyForm>({ resolver: zodResolver(emailVerifySchema) });
  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  // ── Email change, initiate ───────────────────────────────────────────────
  const onEmailInit = async (data: EmailInitForm) => {
    setEmailLoading(true);
    try {
      const res = await api.post('/auth/email/change/initiate', data);
      const body = await res.json();
      if (!res.ok) { toast({ title: body.message, variant: 'destructive' }); return; }
      toast({ title: 'Verification code sent', description: 'Check your new email address.' });
      setEmailStep('otp');
    } catch {
      toast({ title: 'Network error', variant: 'destructive' });
    } finally {
      setEmailLoading(false);
    }
  };

  // ── Email change, verify ─────────────────────────────────────────────────
  const onEmailVerify = async (data: EmailVerifyForm) => {
    setEmailLoading(true);
    try {
      const res = await api.post('/auth/email/change/verify', { code: data.code.trim() });
      const body = await res.json();
      if (!res.ok) { toast({ title: body.message, variant: 'destructive' }); return; }
      toast({ title: 'Email updated successfully!' });
      setEmailStep('done');
      // Refresh user in auth store so the displayed email updates
      if (body.accessToken && body.refreshToken && body.user) {
        login(body.user, body.accessToken, body.refreshToken);
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' });
    } finally {
      setEmailLoading(false);
    }
  };

  // ── Password change ────────────────────────────────────────────────────────
  const onPasswordChange = async (data: PasswordForm) => {
    setPwLoading(true);
    try {
      const res = await api.post('/auth/password/change', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      const body = await res.json();
      if (!res.ok) { toast({ title: body.message, variant: 'destructive' }); return; }
      toast({ title: 'Password changed!', description: 'Use your new password next time you sign in.' });
      passwordForm.reset();
    } catch {
      toast({ title: 'Network error', variant: 'destructive' });
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <Link href="/dashboard/employer/profile" className="flex items-center gap-1 text-sm text-gray-500 hover:text-felovy-red mb-6">
          <ArrowLeft className="h-4 w-4" /> Company Profile
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Account Settings</h1>
        <p className="text-gray-500 text-sm mb-8">Change your login credentials.</p>

        {/* ── Email Change ──────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-felovy-red" /> Email Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              {emailStep === 'done' ? (
                <div className="flex items-center gap-2 text-green-600 text-sm font-medium py-2">
                  <CheckCircle2 className="h-5 w-5" /> Email updated. Please sign out and back in to see the change.
                </div>
              ) : emailStep === 'idle' ? (
                <form onSubmit={emailInitForm.handleSubmit(onEmailInit)} className="space-y-4">
                  <p className="text-sm text-gray-500">
                    Current email: <span className="font-medium text-gray-700">{user?.email}</span>
                  </p>
                  <div>
                    <label className="text-sm font-medium text-gray-700">New Email Address</label>
                    <Input {...emailInitForm.register('newEmail')} type="email" placeholder="new@company.com" className="mt-1" />
                    {emailInitForm.formState.errors.newEmail && (
                      <p className="text-xs text-red-500 mt-1">{emailInitForm.formState.errors.newEmail.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Current Password</label>
                    <div className="relative mt-1">
                      <Input
                        {...emailInitForm.register('password')}
                        type={showCurrentPw ? 'text' : 'password'}
                        placeholder="Confirm it's you"
                      />
                      <button type="button" onClick={() => setShowCurrentPw(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {emailInitForm.formState.errors.password && (
                      <p className="text-xs text-red-500 mt-1">{emailInitForm.formState.errors.password.message}</p>
                    )}
                  </div>
                  <Button type="submit" variant="gradient" disabled={emailLoading} className="gap-2">
                    {emailLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Verification Code'}
                  </Button>
                </form>
              ) : (
                <form onSubmit={emailVerifyForm.handleSubmit(onEmailVerify)} className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700">
                    A 6-digit code was sent to your new email. Enter it below to confirm the change.
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Verification Code</label>
                    <Input
                      {...emailVerifyForm.register('code')}
                      placeholder="000000"
                      maxLength={6}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      className="mt-1 text-center text-2xl tracking-widest font-mono"
                    />
                    {emailVerifyForm.formState.errors.code && (
                      <p className="text-xs text-red-500 mt-1">{emailVerifyForm.formState.errors.code.message}</p>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" type="button" onClick={() => setEmailStep('idle')}>Back</Button>
                    <Button type="submit" variant="gradient" disabled={emailLoading} className="gap-2">
                      {emailLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm New Email'}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Password Change ───────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-felovy-red" /> Password
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={passwordForm.handleSubmit(onPasswordChange)} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Current Password</label>
                  <div className="relative mt-1">
                    <Input
                      {...passwordForm.register('currentPassword')}
                      type={showCurrentPw ? 'text' : 'password'}
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={() => setShowCurrentPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordForm.formState.errors.currentPassword && (
                    <p className="text-xs text-red-500 mt-1">{passwordForm.formState.errors.currentPassword.message}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">New Password</label>
                  <div className="relative mt-1">
                    <Input
                      {...passwordForm.register('newPassword')}
                      type={showNewPw ? 'text' : 'password'}
                      placeholder="Min 8 characters"
                    />
                    <button type="button" onClick={() => setShowNewPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordForm.formState.errors.newPassword && (
                    <p className="text-xs text-red-500 mt-1">{passwordForm.formState.errors.newPassword.message}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
                  <Input {...passwordForm.register('confirmPassword')} type="password" placeholder="••••••••" className="mt-1" />
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">{passwordForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>
                <Button type="submit" variant="gradient" disabled={pwLoading} className="gap-2">
                  {pwLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Change Password'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
