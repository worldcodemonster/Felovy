import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Browse Remote Software Jobs',
  description:
    'Find remote software developer jobs on Felovy. Browse verified listings from global companies — filter by skills, salary, location type, and industry.',
  path: '/jobs',
  keywords: [
    'remote developer jobs',
    'software engineer jobs',
    'remote programming jobs',
    'Felovy jobs',
    'hire remote',
    'full stack jobs',
    'AI developer jobs',
  ],
});

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
