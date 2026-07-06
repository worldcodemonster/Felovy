'use client';

import Image from 'next/image';
import type { ClientTestimonial } from '@/lib/client-testimonials';
import { HOME_IMAGE_QUALITY, HOME_IMAGE_SIZES } from '@/lib/home-image';

interface TestimonialCarouselProps {
  testimonials: ClientTestimonial[];
}

function splitIntoColumns(items: ClientTestimonial[], count: number) {
  const columns: ClientTestimonial[][] = Array.from({ length: count }, () => []);
  items.forEach((item, index) => {
    columns[index % count].push(item);
  });
  return columns;
}

function TestimonialCard({ testimonial }: { testimonial: ClientTestimonial }) {
  return (
    <article className="rounded-2xl bg-white p-5 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.12)]">
      <blockquote className="text-[14px] leading-relaxed text-gray-700">
        &ldquo;{testimonial.quote}&rdquo;
      </blockquote>

      <footer className="mt-4 flex items-center gap-3 pt-4">
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-100">
          <Image
            src={testimonial.photo}
            alt={testimonial.name}
            fill
            quality={HOME_IMAGE_QUALITY.avatarSm}
            className="object-cover"
            sizes={HOME_IMAGE_SIZES.avatarSm}
          />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">{testimonial.name}</p>
          <p className="truncate text-xs text-gray-500">
            {testimonial.role} · {testimonial.company}
          </p>
        </div>
      </footer>
    </article>
  );
}

function ScrollingColumn({
  items,
  durationSec,
  direction,
}: {
  items: ClientTestimonial[];
  durationSec: number;
  direction: 'up' | 'down';
}) {
  const track = [...items, ...items];

  return (
    <div className="relative h-[28rem] overflow-hidden md:h-[32rem] lg:h-[36rem]">
      <div
        className={`testimonial-wall-column flex flex-col gap-4 ${
          direction === 'up' ? 'testimonial-wall-up' : 'testimonial-wall-down'
        }`}
        style={{ animationDuration: `${durationSec}s` }}
      >
        {track.map((testimonial, index) => (
          <TestimonialCard key={`${testimonial.id}-${index}`} testimonial={testimonial} />
        ))}
      </div>
    </div>
  );
}

export function TestimonialCarousel({ testimonials }: TestimonialCarouselProps) {
  const mobileCol = splitIntoColumns(testimonials, 1)[0];
  const tabletCols = splitIntoColumns(testimonials, 2);
  const desktopCols = splitIntoColumns(testimonials, 3);

  return (
    <div className="relative mt-8 md:mt-10">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-20 bg-gradient-to-b from-white to-transparent md:h-24"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-20 bg-gradient-to-t from-white to-transparent md:h-24"
        aria-hidden
      />

      <div className="mx-auto max-w-7xl px-4">
        {/* Mobile: single column */}
        <div className="md:hidden">
          <ScrollingColumn items={mobileCol} durationSec={100} direction="up" />
        </div>

        {/* Tablet: 2 columns, opposite directions */}
        <div className="hidden md:grid md:grid-cols-2 md:gap-5 lg:hidden">
          <ScrollingColumn items={tabletCols[0]} durationSec={90} direction="up" />
          <ScrollingColumn items={tabletCols[1]} durationSec={105} direction="down" />
        </div>

        {/* Desktop: 3-column wall of love */}
        <div className="hidden lg:grid lg:grid-cols-3 lg:gap-5">
          <ScrollingColumn items={desktopCols[0]} durationSec={85} direction="up" />
          <ScrollingColumn items={desktopCols[1]} durationSec={100} direction="down" />
          <ScrollingColumn items={desktopCols[2]} durationSec={92} direction="up" />
        </div>
      </div>
    </div>
  );
}
