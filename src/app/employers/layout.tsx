import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Company Profile',
  description: 'View company profile on Felovy.',
  path: '/employers',
  noIndex: true,
});

export default function EmployersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
