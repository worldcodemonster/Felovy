import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Browse Verified Developers',
  description:
    'Discover verified remote software developers on Felovy. Filter by skills, country, and experience — hire AI, web, mobile, and full-stack talent worldwide.',
  path: '/developers',
  keywords: [
    'hire developers',
    'verified developers',
    'remote developers',
    'software engineers',
    'freelance developers',
    'Felovy developers',
    'outsource development team',
  ],
});

export default function DevelopersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
