'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Illustration } from '@/components/shared/Illustration';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/toaster';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import { Eye, EyeOff, Loader2, CheckCircle2, Code2, Building2 } from 'lucide-react';

const step1Schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, { message: "Passwords don't match", path: ['confirmPassword'] });

const otpSchema = z.object({ code: z.string().length(6, 'Enter the 6-digit code') });

type Step1Form = z.infer<typeof step1Schema>;
type OtpForm = z.infer<typeof otpSchema>;

function SignUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuthStore();
  const [role, setRole] = useState(
    searchParams.get('role') === 'employer' ? 'EMPLOYER' : 'DEVELOPER'
  );
  const [step, setStep] = useState<'form' | 'otp' | 'success'>('form');
  const [userId, setUserId] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    if (step !== 'otp') return;
    setResendCountdown(60);
    const iv = setInterval(() => setResendCountdown(n => (n <= 1 ? (clearInterval(iv), 0) : n - 1)), 1000);
    return () => clearInterval(iv);
  }, [step]);

  const { register: reg1, handleSubmit: hs1, formState: { errors: e1 } } = useForm<Step1Form>({
    resolver: zodResolver(step1Schema),
  });
  const { register: reg2, handleSubmit: hs2, formState: { errors: e2 } } = useForm<OtpForm>({
    resolver: zodResolver(otpSchema),
  });

  const onStep1 = async (data: Step1Form) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/signup/initiate', {
        email: data.email.trim().toLowerCase(), password: data.password, role,
      });
      const body = await res.json();
      if (!res.ok) { toast({ title: body.message, variant: 'destructive' }); return; }
      setUserId(body.userId);
      setStep('otp');
      toast({ title: 'Code sent!', description: 'Check your email for the 6-digit code.' });
    } catch {
      toast({ title: 'Network error', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const onOtp = async (data: OtpForm) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/signup/verify', { userId, code: data.code.trim() });
      const body = await res.json();
      if (!res.ok) { toast({ title: body.message, variant: 'destructive' }); return; }
      login(body.user, body.accessToken, body.refreshToken);
      setStep('success');
      setTimeout(() => {
        const map: Record<string, string> = { DEVELOPER: '/dashboard/developer', EMPLOYER: '/dashboard/employer' };
        router.push(map[body.user.role] || '/');
      }, 1500);
    } catch {
      toast({ title: 'Network error', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    setResendLoading(true);
    try {
      const res = await api.post('/auth/signup/resend', { userId });
      const body = await res.json();
      if (!res.ok) { toast({ title: body.message, variant: 'destructive' }); return; }
      toast({ title: 'New code sent!', description: 'Check your email for a fresh 6-digit code.' });
      setResendCountdown(60);
    } catch {
      toast({ title: 'Network error', variant: 'destructive' });
    } finally {
      setResendLoading(false);
    }
  };

  const illustration =
    step === 'success' ? 'celebrate' :
    step === 'otp' ? 'mail-sent' :
    role === 'DEVELOPER' ? 'auth-developer' : 'auth-employer';

  const title =
    step === 'success' ? 'You\'re all set!' :
    step === 'otp' ? 'Almost there' :
    'Create account';

  const subtitle =
    step === 'success' ? 'Redirecting to your dashboard...' :
    step === 'otp' ? 'Verify your email to continue' :
    'Join the Felovy community';

  return (
    <AuthLayout illustration={illustration} title={title} subtitle={subtitle}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="shadow-xl border-felovy-light/30">
          <CardContent className="p-6">
            <AnimatePresence mode="wait">
              {step === 'form' && (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                  {/* Role toggle */}
                  <div className="grid grid-cols-2 gap-2">
                    {(['DEVELOPER', 'EMPLOYER'] as const).map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`rounded-lg border-2 p-3 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                          role === r ? 'border-felovy-red bg-felovy-light text-felovy-red' : 'border-gray-200 text-gray-700'
                        }`}
                      >
                        {r === 'DEVELOPER' ? <Code2 className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                        {r === 'DEVELOPER' ? 'Developer' : 'Employer'}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={hs1(onStep1)} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        {role === 'EMPLOYER' ? 'Company Email' : 'Email'}
                      </label>
                      <Input {...reg1('email')} type="email" placeholder={role === 'EMPLOYER' ? 'you@company.com' : 'you@example.com'} className="mt-1" />
                      {e1.email && <p className="text-xs text-red-500 mt-1">{e1.email.message}</p>}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Password</label>
                      <div className="relative mt-1">
                        <Input {...reg1('password')} type={showPw ? 'text' : 'password'} placeholder="Min 8 characters" />
                        <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                          {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {e1.password && <p className="text-xs text-red-500 mt-1">{e1.password.message}</p>}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Confirm Password</label>
                      <Input {...reg1('confirmPassword')} type="password" placeholder="••••••••" className="mt-1" />
                      {e1.confirmPassword && <p className="text-xs text-red-500 mt-1">{e1.confirmPassword.message}</p>}
                    </div>
                    <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Continue'}
                    </Button>
                  </form>

                  <p className="text-center text-sm text-gray-500">
                    Already have an account?{' '}
                    <Link href="/signin" className="text-felovy-red hover:underline font-medium">Sign in</Link>
                  </p>
                </motion.div>
              )}

              {step === 'otp' && (
                <motion.div key="otp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                  <div className="text-center lg:hidden">
                    <Illustration name="mail-sent" className="w-40 h-auto mx-auto mb-4" width={160} height={120} />
                  </div>
                  <div className="text-center">
                    <h2 className="font-semibold text-gray-900 text-lg">Check your email</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      We sent a 6-digit verification code. Enter it below.
                    </p>
                  </div>
                  <form onSubmit={hs2(onOtp)} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Verification Code</label>
                      <Input
                        {...reg2('code')}
                        placeholder="000000"
                        maxLength={6}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        className="mt-1 text-center text-2xl tracking-widest font-mono"
                      />
                      {e2.code && <p className="text-xs text-red-500 mt-1">{e2.code.message}</p>}
                    </div>
                    <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify & Create Account'}
                    </Button>
                    <button
                      type="button"
                      onClick={onResend}
                      disabled={resendCountdown > 0 || resendLoading}
                      className="w-full text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {resendLoading
                        ? 'Sending...'
                        : resendCountdown > 0
                          ? `Resend code in ${resendCountdown}s`
                          : 'Resend code'}
                    </button>
                  </form>
                </motion.div>
              )}

              {step === 'success' && (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
                  <Illustration name="celebrate" className="w-44 h-auto mx-auto mb-4 lg:hidden" width={176} height={132} />
                  <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto mb-4 hidden lg:block" />
                  <h2 className="text-xl font-bold text-gray-900">Account created!</h2>
                  <p className="text-gray-500 text-sm mt-1">Redirecting to your dashboard...</p>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </AuthLayout>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen gradient-bg flex items-center justify-center"><div className="animate-pulse text-felovy-red">Loading...</div></div>}>
      <SignUpContent />
    </Suspense>
  );
}
