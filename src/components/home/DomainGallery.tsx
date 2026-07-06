'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { DOMAIN_ITEMS, type DomainItem } from '@/lib/domain-illustrations';
import { storysetDomainSrc } from '@/lib/storyset';
import { HOME_IMAGE_SIZES } from '@/lib/home-image';
import { HomeStorysetIllustration } from '@/components/home/HomeStorysetIllustration';

const VISIBLE_COUNT = 6;
const GAP_PX = 12;

function DomainCard({ domain, width }: { domain: DomainItem; width: number }) {
  return (
    <article
      className="group flex shrink-0 flex-col min-w-0 transition-transform duration-300 hover:-translate-y-0.5"
      style={{ width }}
    >
      <HomeStorysetIllustration
        src={storysetDomainSrc(domain.id)}
        sizes={HOME_IMAGE_SIZES.domainTile}
      />

      <div className="flex flex-1 flex-col p-1.5 sm:p-2.5 lg:p-2">
        <h3 className="mb-0.5 text-[10px] font-bold leading-snug text-gray-900 sm:text-xs lg:text-[11px]">
          {domain.title}
        </h3>
        <p className="text-[9px] leading-relaxed text-gray-500 line-clamp-2 sm:text-[11px] sm:leading-relaxed lg:text-[10px] lg:line-clamp-3">
          {domain.label}
        </p>
      </div>
    </article>
  );
}

export function DomainGallery() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [cardWidth, setCardWidth] = useState(180);
  const track = useMemo(() => [...DOMAIN_ITEMS, ...DOMAIN_ITEMS], []);

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;

    const update = () => {
      const width = node.clientWidth;
      const next = (width - GAP_PX * (VISIBLE_COUNT - 1)) / VISIBLE_COUNT;
      setCardWidth(Math.max(120, next));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

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
            animation: 'servicesCarouselScroll 105s linear infinite',
          }}
        >
          {track.map((domain, index) => (
            <DomainCard
              key={`${domain.id}-${index}`}
              domain={domain}
              width={cardWidth}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
