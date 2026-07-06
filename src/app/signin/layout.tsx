import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Sign In',
  description: 'Sign in to your Felovy developer or employer account to manage jobs, applications, and messages.',
  path: '/signin',
  keywords: ['Felovy login', 'Felovy sign in', 'developer login', 'employer login'],
});

export default function SigninLayout({ children }: { children: React.ReactNode }) {
  return children;
}
