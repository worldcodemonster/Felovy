import Link from 'next/link';
import dynamic from 'next/dynamic';
import { FelovyLogo } from '@/components/shared/FelovyLogo';
import { Navbar } from '@/components/shared/Navbar';
import { Badge } from '@/components/ui/badge';
import { LazyWhenVisible } from '@/components/home/LazyWhenVisible';
import { DomainGallery } from '@/components/home/DomainGallery';
import { FAQSection } from '@/components/home/FAQSection';
import { HowFelovyWorksSection } from '@/components/home/HowFelovyWorksSection';
import { StorysetAttribution } from '@/components/shared/StorysetAttribution';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DEVELOPER_CAROUSEL } from '@/lib/developer-carousel';
import { buildPageMetadata } from '@/lib/seo';
import { HomeStructuredData } from '@/components/seo/HomeStructuredData';

export const metadata = buildPageMetadata({
  title: 'Remote Software Jobs & Verified Developer Hiring',
  description:
    'Felovy — For Every Life, Our Value Yields. Hire verified remote developers or find high-paying software jobs worldwide. AI, web, mobile, cloud & 12 service domains.',
  path: '/',
  keywords: [
    'Felovy',
    'software outsourcing platform',
    'remote developer jobs',
    'hire verified developers',
    'global software talent',
    'remote hiring platform',
  ],
});

const ScrollReveal = dynamic(
  () => import('@/components/home/ScrollReveal').then((m) => ({ default: m.ScrollReveal })),
  { ssr: false },
);
const WorldMap = dynamic(() => import('@/components/home/WorldMap'), {
  ssr: false,
});
const DeveloperCarousel = dynamic(
  () => import('@/components/home/DeveloperCarousel').then((m) => ({ default: m.DeveloperCarousel })),
  { ssr: false },
);
const CompaniesSection = dynamic(
  () => import('@/components/home/CompaniesSection').then(m => ({ default: m.CompaniesSection })),
  { ssr: false }
);
const WorkplaceSection = dynamic(
  () => import('@/components/home/WorkplaceSection').then(m => ({ default: m.WorkplaceSection })),
  { ssr: false }
);
const TechStackSection = dynamic(
  () => import('@/components/home/TechStackSection').then(m => ({ default: m.TechStackSection })),
  { ssr: false }
);
const TestimonialsSection = dynamic(
  () => import('@/components/home/TestimonialsSection').then(m => ({ default: m.TestimonialsSection })),
  { ssr: false }
);

export default function HomePage() {
  return (
    <>
      <HomeStructuredData />
      <div className="min-h-screen bg-white overflow-x-hidden">
      <ScrollReveal />
      <Navbar />

      <main id="main-content">

      <section id="hero" className="relative min-h-[92vh] flex flex-col justify-center overflow-hidden -mt-14 pt-14 pointer-events-none bg-white">
        <div className="absolute inset-0 z-0 pointer-events-none select-none" aria-hidden>
          <div className="absolute inset-x-0 top-0 bottom-0 overflow-hidden opacity-90 translate-y-0.5 md:translate-y-1.5">
            <WorldMap mode="hero" />
          </div>
        </div>

        <div className="relative z-10 w-full pointer-events-auto">
          <div className="container mx-auto max-w-7xl px-4 pt-14 pb-4 md:pt-20 md:pb-5 text-center">
            <Badge className="mb-6 gap-2 px-4 py-2 text-sm text-gray-900" variant="outline">
              <Sparkles className="h-3.5 w-3.5 text-[#15803d]" />
              The Future of Software Outsourcing
            </Badge>

            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
              <span className="hero-map-label">For Every Life,</span>
              <br />
              <span className="text-gray-900">Our Value Yields</span>
            </h1>

            <p className="mx-auto max-w-2xl text-lg md:text-xl text-gray-800 leading-relaxed">
              Felovy is the premier software development outsourcing platform connecting global
              clients with verified developers and helping talent find high-paying opportunities.
            </p>

            <div className="mt-8 flex justify-center">
              <Button asChild variant="gradient" size="lg" className="gap-2">
                <Link href="/jobs">
                  View Opportunities
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <DeveloperCarousel people={DEVELOPER_CAROUSEL} className="-mt-1 md:mt-0 pb-10 md:pb-14" />
        </div>
      </section>

      <LazyWhenVisible minHeight="280px">
        <CompaniesSection />
      </LazyWhenVisible>

      <LazyWhenVisible minHeight="1400px">
        <WorkplaceSection />
      </LazyWhenVisible>

      <LazyWhenVisible minHeight="520px">
        <TechStackSection />
      </LazyWhenVisible>

      <LazyWhenVisible id="services" minHeight="640px">
      <section className="pt-8 md:pt-10 pb-12 md:pb-14 -mt-10 md:-mt-16 bg-white relative overflow-hidden">
        <div className="container mx-auto max-w-7xl px-4 relative">
          <div className="relative text-center mb-8 md:mb-10 max-w-2xl mx-auto">
            <h2 data-animate="fade-up" className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-3 leading-[1.15] tracking-tight">
              Our Services
            </h2>
            <p data-animate="fade-up" data-delay="100" className="text-gray-500 text-sm md:text-base leading-relaxed">
              Twelve core disciplines. Verified developers ready to build.
            </p>
          </div>

          <DomainGallery />
        </div>
      </section>
      </LazyWhenVisible>

      <HowFelovyWorksSection />

      <LazyWhenVisible minHeight="420px">
        <TestimonialsSection />
      </LazyWhenVisible>

      <FAQSection />
      </main>

      <footer className="bg-white border-t border-gray-200 text-gray-500">
        <div className="container mx-auto max-w-7xl px-4 pt-12 pb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-14">
            <div className="col-span-2 md:col-span-1 space-y-4">
              <Link href="/" className="flex items-center gap-3 mb-1">
                <FelovyLogo size={32} />
                <span className="text-lg font-bold text-felovy-purple">Felovy</span>
              </Link>
              <p className="text-sm leading-relaxed text-gray-500">
                For Every Life, Our Value Yields. The premier platform connecting global software talent
                with world-class opportunities.
              </p>
              <div className="flex gap-2 pt-1">
                {[
                  { label: 'Twitter',  path: 'M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84' },
                  { label: 'LinkedIn', path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
                  { label: 'GitHub',   path: 'M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z' },
                ].map(({ label, path }) => (
                  <a key={label} href="#" aria-label={label} className="h-9 w-9 rounded-xl border border-felovy-ink/20 bg-gray-100 hover:border-felovy-ink hover:bg-felovy-light flex items-center justify-center transition-colors group">
                    <svg className="h-4 w-4 text-gray-500 group-hover:text-felovy-red transition-colors" fill="currentColor" viewBox="0 0 24 24">
                      <path d={path} />
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold tracking-[0.14em] uppercase text-gray-700 mb-5">Platform</h4>
              <ul className="space-y-3">
                {[['Browse Jobs', '/jobs'], ['Find Developers', '/developers'], ['Post a Job', '/signup?role=employer'], ['Services', '/#services']].map(([l, h]) => (
                  <li key={l}><Link href={h} className="text-sm hover:text-gray-900 transition-colors">{l}</Link></li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold tracking-[0.14em] uppercase text-gray-700 mb-5">For Developers</h4>
              <ul className="space-y-3">
                {[
                  ['Create Account', '/signup?role=developer'],
                  ['Complete Profile', '/dashboard/developer/profile'],
                  ['Browse Jobs', '/jobs'],
                  ['Get Verified', '/dashboard/developer/profile?step=4'],
                ].map(([l, h]) => (
                  <li key={l}><Link href={h} className="text-sm hover:text-gray-900 transition-colors">{l}</Link></li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold tracking-[0.14em] uppercase text-gray-700 mb-5">For Employers</h4>
              <ul className="space-y-3">
                {[
                  ['Create Account', '/signup?role=employer'],
                  ['Browse Developers', '/developers'],
                  ['Post a Job', '/dashboard/employer'],
                  ['Sign In', '/signin'],
                ].map(([l, h]) => (
                  <li key={l}><Link href={h} className="text-sm hover:text-gray-900 transition-colors">{l}</Link></li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col items-center md:items-start gap-1">
              <span className="text-xs text-gray-400">© {new Date().getFullYear()} Felovy. All rights reserved.</span>
              <StorysetAttribution />
            </div>
            <div className="flex gap-6 text-xs text-gray-400">
              <a href="#" className="hover:text-gray-700 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-gray-700 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-gray-700 transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}
