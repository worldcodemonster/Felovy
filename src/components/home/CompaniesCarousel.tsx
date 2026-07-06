'use client';

import type { CompanyLogo } from '@/lib/company-logos';

export function CompaniesCarousel({ companies }: { companies: CompanyLogo[] }) {
  return (
    <div className="mx-auto mt-4 w-[80%] md:mt-6">
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-5 sm:gap-x-8 sm:gap-y-6">
        {companies.map((company) => (
          <div
            key={company.id}
            className="flex h-12 items-center justify-center sm:h-14"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={company.src}
              alt={company.name}
              className="h-10 w-auto max-w-[88px] object-contain object-center opacity-50 grayscale brightness-0 sm:h-12 sm:max-w-[92px]"
              loading="lazy"
              decoding="async"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
