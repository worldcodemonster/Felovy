'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { GenderAvatar } from '@/components/shared/GenderAvatar';
import { resolvePublicDeveloperPlace } from '@/lib/developer-location';
import type { CAROUSEL_GRADS } from '@/lib/developer-carousel';
import {
  DeveloperPortraitColorGrad,
  DeveloperPortraitNeutralGrad,
  DeveloperPortraitTextScrim,
} from '@/components/home/DeveloperPortraitGradients';

export function DeveloperPortraitCard({
  id,
  name,
  title,
  location,
  country,
  photoUrl,
  gender,
  grad,
  className,
}: {
  id: string;
  name: string;
  title?: string | null;
  location?: string | null;
  country?: string | null;
  photoUrl?: string | null;
  gender?: string | null;
  grad: (typeof CAROUSEL_GRADS)[number];
  className?: string;
}) {
  const role = title?.trim() || 'Developer';
  const place = resolvePublicDeveloperPlace({ id, fullName: name, location, country });

  return (
    <Link
      href={`/developers/${id}`}
      className={cn('group block w-full', className)}
    >
      <article className="relative w-full aspect-[170/240] rounded-xl overflow-hidden shadow-md shadow-gray-200/80">
        <div
          className={cn(
            'absolute inset-0 bg-gray-100 transition-[filter] duration-300 ease-out',
            '[filter:grayscale(1)_contrast(0.92)_brightness(0.95)]',
            'group-hover:[filter:contrast(1.2)_brightness(1.06)]',
          )}
        >
          <GenderAvatar
            src={photoUrl}
            name={name}
            gender={gender}
            variant="cover"
            className="object-cover object-top"
          />

          <DeveloperPortraitNeutralGrad className="transition-opacity duration-300 ease-out group-hover:opacity-0" />

          <DeveloperPortraitColorGrad
            grad={grad}
            className="opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-90"
          />

          <DeveloperPortraitTextScrim />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
          <p className="font-bold text-white text-lg leading-tight line-clamp-2">{name}</p>
          <p className="text-white text-sm mt-0.5 font-semibold line-clamp-1">{role}</p>
          {place && <p className="text-white/65 text-xs mt-0.5 line-clamp-1">{place}</p>}
        </div>
      </article>
    </Link>
  );
}
