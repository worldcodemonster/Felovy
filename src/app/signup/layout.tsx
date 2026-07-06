import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Create Your Felovy Account',
  description:
    'Sign up for Felovy as a developer or employer. Developers find verified remote jobs; employers hire vetted global software talent.',
  path: '/signup',
  keywords: ['Felovy signup', 'create developer account', 'create employer account', 'join Felovy'],
});

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
