'use client';

import { Star } from 'lucide-react';
import { TestimonialCarousel } from '@/components/home/TestimonialCarousel';
import { CLIENT_TESTIMONIALS } from '@/lib/client-testimonials';

export function TestimonialsSection() {
  return (
    <section className="relative overflow-hidden border-t border-gray-100 bg-white pt-10 md:pt-14 pb-10 md:pb-14">
      <div className="container relative mx-auto max-w-7xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p
            data-animate="fade-up"
            className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-felovy-pink"
          >
            Wall of love
          </p>
          <h2
            data-animate="fade-up"
            data-delay="50"
            className="mb-3 text-3xl font-extrabold leading-tight tracking-tight text-gray-900 md:text-4xl"
          >
            What clients say about Felovy
          </h2>
          <p
            data-animate="fade-up"
            data-delay="100"
            className="text-sm leading-relaxed text-gray-500 md:text-base"
          >
            Real feedback from founders and engineering leaders who hire through our platform.
          </p>

          <div
            data-animate="fade-up"
            data-delay="150"
            className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-gray-500"
          >
            <span className="inline-flex items-center gap-1 font-medium text-gray-800">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              4.9
            </span>
            <span aria-hidden>·</span>
            <span>{CLIENT_TESTIMONIALS.length} reviews</span>
            <span aria-hidden>·</span>
            <span>97% recommend</span>
          </div>
        </div>
      </div>

      <TestimonialCarousel testimonials={CLIENT_TESTIMONIALS} />
    </section>
  );
}
