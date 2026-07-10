'use client';

import { DeveloperCarousel } from '@/components/home/DeveloperCarousel';

export interface DeveloperProfile {
  src: string;
  name: string;
  role: string;
  /** City for DB-backed profiles; carousel uses `place` for display */
  location?: string;
  country: string;
  /** Formatted "City, Country" for display */
  place?: string;
  grad: string;
  quote?: string;
}

export function DeveloperCommunitySection({ people }: { people: DeveloperProfile[] }) {
  return (
    <section className="relative pt-8 md:pt-12 pb-16 md:pb-20 -mt-6 md:-mt-10 overflow-hidden bg-white">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="text-center mb-4 md:mb-6 max-w-2xl mx-auto">
          <p
            data-animate="fade-up"
            className="text-xs font-bold tracking-[0.16em] uppercase text-felovy-pink mb-2"
          >
            Global talent
          </p>
          <h2
            data-animate="fade-up"
            data-delay="50"
            className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2 leading-tight tracking-tight"
          >
            Developers on Felovy
          </h2>
          <p
            data-animate="fade-up"
            data-delay="100"
            className="text-gray-500 text-sm md:text-base leading-relaxed"
          >
            Verified engineers across 12 disciplines, building for clients worldwide.
          </p>
        </div>
      </div>

      <DeveloperCarousel people={people} />
    </section>
  );
}
