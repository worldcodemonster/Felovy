import Link from 'next/link';
import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Page Not Found',
  description: 'The page you are looking for does not exist on Felovy.',
  path: '/404',
  noIndex: true,
});

export default function NotFound() {
  return (
    <main id="main-content" className="min-h-screen bg-white flex flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-semibold tracking-widest uppercase text-felovy-red mb-3">404</p>
      <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">Page not found</h1>
      <p className="text-gray-500 max-w-md mb-8">
        This page doesn&apos;t exist or may have moved. Browse jobs, developers, or return home.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-xl bg-felovy-red px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
        >
          Go home
        </Link>
        <Link
          href="/jobs"
          className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Browse jobs
        </Link>
      </div>
    </main>
  );
}
