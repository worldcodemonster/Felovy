'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { toast } from '@/components/ui/toaster';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Employer } from '@/types';
import { ArrowRight, Loader2, Mail, Lock, CheckCircle2 } from 'lucide-react';

export default function CredentialsPage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();

  const { data: profile } = useQuery({
    queryKey: ['employer-me'],
    queryFn: async () => {
      const res = await api.post('/employers/me', {});
      return res.json() as Promise<Employer>;
    },
  });

  // ── Email change state ──────────────────────────────────────────────
  const [emailStep, setEmailStep] = useState<'idle' | 'otp'>('idle');
  const [newEmail,  setNewEmail]  = useState('');
  const [otp,       setOtp]       = useState('');

  const { mutate: sendOtp, isPending: sendingOtp } = useMutation({
    mutationFn: () => api.post('/auth/email/change/initiate', { newEmail }).then(r => r.json()),
    onSuccess: () => {
      toast({ title: 'OTP sent', description: `Check ${user?.email} for the verification code.` });
      setEmailStep('otp');
    },
    onError: (e: any) => toast({ title: e.message ?? 'Failed to send OTP', variant: 'destructive' }),
  });

  const { mutate: verifyOtp, isPending: verifyingOtp } = useMutation({
    mutationFn: () => api.post('/auth/email/change/verify', { newEmail, code: otp }).then(r => r.json()),
    onSuccess: () => {
      toast({ title: 'Email updated!' });
      if (user) setUser({ ...user, email: newEmail });
      setEmailStep('idle');
      setNewEmail('');
      setOtp('');
    },
    onError: (e: any) => toast({ title: e.message ?? 'Invalid OTP', variant: 'destructive' }),
  });

  // ── Password change state ───────────────────────────────────────────
  const [currentPw, setCurrentPw] = useState('');
  const [newPw,     setNewPw]     = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  const { mutate: changePw, isPending: changingPw } = useMutation({
    mutationFn: () =>
      api.post('/auth/password/change', { currentPassword: currentPw, newPassword: newPw }).then(r => r.json()),
    onSuccess: () => {
      toast({ title: 'Password updated!' });
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    },
    onError: (e: any) => toast({ title: e.message ?? 'Failed to change password', variant: 'destructive' }),
  });

  const handlePasswordChange = () => {
    if (newPw !== confirmPw) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (newPw.length < 8) {
      toast({ title: 'Password must be at least 8 characters', variant: 'destructive' });
      return;
    }
    changePw();
  };

  return (
    <div className="space-y-4">
      {/* Email */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Mail className="h-4 w-4" /> Email Address</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
            <Mail className="h-4 w-4 text-gray-400 shrink-0" />
            <span className="text-sm text-gray-700">{user?.email ?? profile?.user?.email ?? '-'}</span>
            <span className="ml-auto text-xs text-gray-400 font-medium">Current email</span>
          </div>

          {emailStep === 'idle' && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">New Email Address</label>
                <Input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="new@example.com"
                  className="mt-1"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={!newEmail || newEmail === (user?.email) || sendingOtp}
                onClick={() => sendOtp()}
                className="gap-2"
              >
                {sendingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Send Verification Code
              </Button>
            </div>
          )}

          {emailStep === 'otp' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                Enter the 6-digit code sent to <strong>{user?.email}</strong>.
              </p>
              <div>
                <label className="text-sm font-medium text-gray-700">Verification Code</label>
                <Input
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  className="mt-1 tracking-widest text-center text-lg font-mono w-40"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="gradient"
                  size="sm"
                  disabled={otp.length < 6 || verifyingOtp}
                  onClick={() => verifyOtp()}
                  className="gap-2"
                >
                  {verifyingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Verify &amp; Update Email
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setEmailStep('idle'); setOtp(''); }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Lock className="h-4 w-4" /> Password</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Current Password</label>
            <Input
              type="password"
              value={currentPw}
              onChange={e => setCurrentPw(e.target.value)}
              placeholder="Enter current password"
              className="mt-1"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">New Password</label>
              <Input
                type="password"
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                placeholder="Min. 8 characters"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
              <Input
                type="password"
                value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)}
                placeholder="Repeat new password"
                className="mt-1"
              />
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={!currentPw || !newPw || !confirmPw || changingPw}
            onClick={handlePasswordChange}
            className="gap-2"
          >
            {changingPw ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            Update Password
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="gradient" onClick={() => router.push('/dashboard/employer/profile/company-info')} className="gap-2">
          Next: Company Info <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
