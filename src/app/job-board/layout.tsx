import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Job Board',
  description: 'Browse aggregated ATS job listings synced from Felovy Search.',
  path: '/job-board',
});

export default function JobBoardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
