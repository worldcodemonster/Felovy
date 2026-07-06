'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { HOME_IMAGE_QUALITY, HOME_IMAGE_SIZES } from '@/lib/home-image';

interface Person {
  src: string;
  name: string;
  role: string;
  country: string;
  grad: string;
  quote?: string;
}

const CARD_WIDTH = 170;
const CARD_HEIGHT = 240;

const CENTER_RADIUS = 0.32;
const CONTRAST_BOOST = 0.2;
const BRIGHTNESS_BOOST = 0.06;

function smoothstep(t: number) {
  return t * t * (3 - 2 * t);
}

function shufflePeople<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

export function DeveloperCarousel({
  people,
  className,
}: {
  people: Person[];
  className?: string;
}) {
  const [shuffledPeople] = useState(() => shufflePeople(people));
  const track = [...shuffledPeople, ...shuffledPeople];
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frameId = 0;

    const tick = () => {
      const container = containerRef.current;
      const trackEl = trackRef.current;
      if (!container || !trackEl) {
        frameId = requestAnimationFrame(tick);
        return;
      }

      const { left, width } = container.getBoundingClientRect();
      const centerX = left + width / 2;
      const falloff = width * CENTER_RADIUS;

      const cards = trackEl.querySelectorAll<HTMLElement>('[data-carousel-card]');
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const cardCenter = rect.left + rect.width / 2;
        const dist = Math.abs(cardCenter - centerX);
        const raw = Math.max(0, 1 - dist / falloff);
        const influence = smoothstep(raw);

        const contrast = 1 + influence * CONTRAST_BOOST;
        const brightness = 1 + influence * BRIGHTNESS_BOOST;

        card.style.zIndex = String(Math.round(influence * 20));

        const visual = card.querySelector<HTMLElement>('[data-carousel-visual]');
        if (visual) {
          visual.style.filter = `contrast(${contrast}) brightness(${brightness})`;
        }
      });

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <div className={cn('mx-auto w-[97%] px-4', className)}>
      <div ref={containerRef} className="relative overflow-hidden py-8 md:py-10">
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-white to-transparent sm:w-12"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-white to-transparent sm:w-12"
        aria-hidden
      />

      <div
        ref={trackRef}
        className="flex items-start gap-3 md:gap-4 will-change-transform"
        style={{ width: 'max-content', animation: 'devCarouselScroll 100s linear infinite' }}
      >
        {track.map((person, i) => {
          const shift = i % 2 === 0 ? 'mt-0' : 'mt-8 md:mt-10';
          return (
            <article
              key={`${person.name}-${i}`}
              data-carousel-card
              className={cn(
                'relative flex-shrink-0 rounded-xl overflow-hidden cursor-default shadow-md shadow-gray-200/80',
                shift,
              )}
              style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
            >
              <div
                data-carousel-visual
                className="absolute inset-0"
                style={{ willChange: 'filter' }}
              >
                <Image
                  src={person.src}
                  alt={person.name}
                  fill
                  quality={HOME_IMAGE_QUALITY.card}
                  className="object-cover object-top"
                  sizes={HOME_IMAGE_SIZES.developerCard}
                />

                <div
                  className={cn(
                    'absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t opacity-90',
                    person.grad,
                    'to-transparent',
                  )}
                />

                <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-black/50 via-black/15 to-transparent" />
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
                <p className="font-bold text-white text-lg md:text-xl leading-tight">{person.name}</p>
                <p className="text-white text-sm md:text-base mt-0.5 font-semibold">{person.role}</p>
                <p className="text-white/65 text-xs mt-0.5">{person.country}</p>
              </div>
            </article>
          );
        })}
      </div>
      </div>
    </div>
  );
}
