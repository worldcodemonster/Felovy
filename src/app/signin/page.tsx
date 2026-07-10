'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/toaster';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import { Eye, EyeOff, Loader2, Code2, Building2 } from 'lucide-react';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password required'),
});
type Form = z.infer<typeof schema>;

const roles = [
  { value: 'DEVELOPER', label: 'Developer', desc: 'Find jobs & freelance', icon: Code2 },
  { value: 'EMPLOYER',  label: 'Employer',  desc: 'Hire top talent',       icon: Building2 },
] as const;

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuthStore();
  const [role, setRole] = useState<'DEVELOPER' | 'EMPLOYER'>(
    searchParams?.get('role')?.toUpperCase() === 'EMPLOYER' ? 'EMPLOYER' : 'DEVELOPER'
  );
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: Form) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/signin', {
        email: data.email.trim().toLowerCase(),
        password: data.password,
      });
      if (!res.ok) {
        const err = await res.json();
        toast({ title: 'Sign in failed', description: err.message, variant: 'destructive' });
        return;
      }
      const { user, accessToken, refreshToken } = await res.json();
      login(user, accessToken, refreshToken);

      const redirect = searchParams?.get('redirect');
      const dashMap: Record<string, string> = {
        DEVELOPER: '/dashboard/developer',
        EMPLOYER:  '/dashboard/employer',
        OWNER:     '/dashboard/owner',
      };
      router.push(redirect || dashMap[user.role] || '/');
    } catch {
      toast({ title: 'Network error', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      illustration={role === 'DEVELOPER' ? 'auth-developer' : 'auth-employer'}
      title="Welcome back"
      subtitle="Sign in to your Felovy account"
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="shadow-xl">
          <CardContent className="p-6 space-y-5">
            {/* Role selector */}
            <div className="grid grid-cols-2 gap-2">
              {roles.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`rounded-lg border p-3 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    role === r.value
                      ? 'border-felovy-ink bg-felovy-fill text-felovy-ink'
                      : 'border-felovy-ink/25 text-gray-700 hover:border-felovy-ink bg-white'
                  }`}
                >
                  <r.icon className="h-4 w-4" />
                  {r.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  {role === 'EMPLOYER' ? 'Company Email' : 'Email'}
                </label>
                <Input
                  {...register('email')}
                  type="email"
                  placeholder={role === 'EMPLOYER' ? 'you@company.com' : 'you@example.com'}
                  className="mt-1"
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Password</label>
                <div className="relative mt-1">
                  <Input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
              </div>

              <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : `Sign In as ${role === 'DEVELOPER' ? 'Developer' : 'Employer'}`}
              </Button>
            </form>

            <p className="text-center text-sm text-gray-500">
              Don&apos;t have an account?{' '}
              <Link
                href={`/signup?role=${role.toLowerCase()}`}
                className="text-felovy-red hover:underline font-medium"
              >
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </AuthLayout>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-felovy-red">Loading...</div></div>}>
      <SignInContent />
    </Suspense>
  );
}
