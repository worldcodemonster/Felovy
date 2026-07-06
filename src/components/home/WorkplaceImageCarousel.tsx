'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import type { WorkplaceImage } from '@/lib/workplace-images';
import { HOME_IMAGE_QUALITY } from '@/lib/home-image';

const GAP_PX = 12;

interface WorkplaceImageCarouselProps {
  images: WorkplaceImage[];
  visibleCount?: number;
  durationSec?: number;
}

export function WorkplaceImageCarousel({
  images,
  visibleCount = 4,
  durationSec = 100,
}: WorkplaceImageCarouselProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [itemWidth, setItemWidth] = useState(280);
  const track = useMemo(() => [...images, ...images], [images]);

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;

    const update = () => {
      const width = node.clientWidth;
      const next = (width - GAP_PX * (visibleCount - 1)) / visibleCount;
      setItemWidth(Math.max(160, next));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [visibleCount]);

  return (
    <div ref={viewportRef} className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-white to-transparent sm:w-12"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-white to-transparent sm:w-12"
        aria-hidden
      />

      <div className="overflow-hidden py-1">
        <div
          className="services-carousel-track flex will-change-transform"
          style={{
            gap: GAP_PX,
            width: 'max-content',
            animation: `servicesCarouselScroll ${durationSec}s linear infinite`,
          }}
        >
          {track.map((img, index) => (
            <figure
              key={`${img.id}-${index}`}
              className="group relative shrink-0 overflow-hidden rounded-2xl bg-gray-100 shadow-sm shadow-gray-200/60"
              style={{ width: itemWidth }}
            >
              <div className="relative aspect-[16/10] w-full">
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  quality={HOME_IMAGE_QUALITY.grid}
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  sizes={`(max-width: 1280px) 25vw, ${Math.round(itemWidth)}px`}
                />
              </div>
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
}
