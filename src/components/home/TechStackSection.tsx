'use client';

import { TechStackGrid } from '@/components/home/TechStackGrid';
import { DEVICON_STACKS } from '@/lib/devicon-stacks';

export function TechStackSection() {
  return (
    <section className="relative pt-1 md:pt-2 pb-8 md:pb-10 bg-white overflow-hidden border-t border-gray-100">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="text-center mb-6 md:mb-8 max-w-2xl mx-auto">
          <p
            data-animate="fade-up"
            className="text-xs font-bold tracking-[0.16em] uppercase text-felovy-pink mb-2"
          >
            Built with modern tools
          </p>
          <h2
            data-animate="fade-up"
            data-delay="50"
            className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2 leading-tight tracking-tight"
          >
            Tech Stacks
          </h2>
          <p
            data-animate="fade-up"
            data-delay="100"
            className="text-gray-500 text-sm md:text-base leading-relaxed"
          >
            {DEVICON_STACKS.length}+ languages, frameworks, and platforms our developers work with.
          </p>
        </div>

        <TechStackGrid />
      </div>
    </section>
  );
}
