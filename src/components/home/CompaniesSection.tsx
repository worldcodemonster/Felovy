'use client';

import { CompaniesCarousel } from '@/components/home/CompaniesCarousel';
import { COMPANY_LOGOS } from '@/lib/company-logos';

export function CompaniesSection() {
  return (
    <section className="relative pt-1 md:pt-2 pb-8 md:pb-10 bg-white overflow-hidden">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="text-center mb-0 md:mb-1 max-w-2xl mx-auto">
          <p
            data-animate="fade-up"
            className="text-xs font-bold tracking-[0.16em] uppercase text-felovy-pink mb-2"
          >
            Trusted worldwide
          </p>
          <h2
            data-animate="fade-up"
            data-delay="50"
            className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2 leading-tight tracking-tight"
          >
            Companies on Felovy
          </h2>
          <p
            data-animate="fade-up"
            data-delay="100"
            className="text-gray-500 text-sm md:text-base leading-relaxed"
          >
            {COMPANY_LOGOS.length}+ global brands hire verified developers through our platform.
          </p>
        </div>
      </div>

      <CompaniesCarousel companies={COMPANY_LOGOS} />
    </section>
  );
}
