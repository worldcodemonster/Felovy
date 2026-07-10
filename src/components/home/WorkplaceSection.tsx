'use client';

import Image from 'next/image';
import { FileSignature, MessageSquare, Laptop, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  WORKPLACE_GROUPS,
  WORKPLACE_IMAGES,
  type WorkplaceCategory,
} from '@/lib/workplace-images';
import { HOME_IMAGE_QUALITY, workplaceImageSizes } from '@/lib/home-image';
import { WorkplaceImageCarousel } from '@/components/home/WorkplaceImageCarousel';

const GROUP_ICONS = {
  contract: FileSignature,
  'interview-inperson': MessageSquare,
  'interview-remote': Laptop,
  'team-meeting': Users,
} as const;

const CAROUSEL_GROUPS = new Set<WorkplaceCategory>(['interview-remote', 'team-meeting']);

function imagesFor(category: WorkplaceCategory) {
  return WORKPLACE_IMAGES.filter((img) => img.category === category);
}

function gridClass(count: number) {
  if (count <= 2) return 'grid-cols-1 sm:grid-cols-2';
  if (count === 3) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
  if (count <= 4) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
  return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
}

export function WorkplaceSection() {
  return (
    <section className="relative pt-10 md:pt-14 pb-12 md:pb-16 bg-white overflow-hidden border-t border-gray-100">
      <div className="container relative mx-auto max-w-7xl px-4">
        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
          <p
            data-animate="fade-up"
            className="text-xs font-bold tracking-[0.16em] uppercase text-felovy-pink mb-2"
          >
            How Felovy works
          </p>
          <h2
            data-animate="fade-up"
            data-delay="50"
            className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2 leading-tight tracking-tight"
          >
            Contracts, interviews, and collaboration
          </h2>
          <p
            data-animate="fade-up"
            data-delay="100"
            className="text-gray-500 text-sm md:text-base leading-relaxed"
          >
            From signing with companies to interviewing developers in person or remotely,
            then aligning as a team. Felovy supports every step.
          </p>
        </div>

        <div className="space-y-12 md:space-y-16">
          {WORKPLACE_GROUPS.map((group, groupIndex) => {
            const Icon = GROUP_ICONS[group.key];
            const images = imagesFor(group.key);

            return (
              <div key={group.key}>
                <div
                  data-animate="fade-up"
                  data-delay={String(groupIndex * 80)}
                  className="flex items-start gap-3 mb-5 md:mb-6"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-felovy-pink">
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
                      {group.label}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 max-w-2xl leading-relaxed">
                      {group.description}
                    </p>
                  </div>
                </div>

                {CAROUSEL_GROUPS.has(group.key) ? (
                  <WorkplaceImageCarousel
                    images={images}
                    visibleCount={4}
                    durationSec={group.key === 'interview-remote' ? 120 : 90}
                  />
                ) : (
                  <div className={cn('grid gap-3 md:gap-4', gridClass(images.length))}>
                    {images.map((img, i) => (
                      <figure
                        key={img.id}
                        data-animate="fade-up"
                        data-delay={String(groupIndex * 80 + i * 40 + 100)}
                        className="group relative overflow-hidden rounded-2xl bg-gray-100 shadow-sm shadow-gray-200/60"
                      >
                        <div className="relative w-full aspect-[16/10]">
                          <Image
                            src={img.src}
                            alt={img.alt}
                            fill
                            quality={HOME_IMAGE_QUALITY.grid}
                            className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                            sizes={workplaceImageSizes(images.length)}
                          />
                        </div>
                      </figure>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
