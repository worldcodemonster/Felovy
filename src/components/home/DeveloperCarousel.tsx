'use client';

import Image from 'next/image';

interface Person {
  src: string;
  name: string;
  role: string;
  country: string;
  grad: string;
  quote?: string;
}

export function DeveloperCarousel({ people }: { people: Person[] }) {
  const track = [...people, ...people];

  return (
    <div className="relative overflow-hidden">
      {/* Fade edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-28 z-10 bg-gradient-to-r from-gray-50/90 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-28 z-10 bg-gradient-to-l from-gray-50/90 to-transparent" />

      <div
        className="flex items-start gap-4 py-8"
        style={{ width: 'max-content', animation: 'devCarouselScroll 90s linear infinite' }}
        onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.animationPlayState = 'paused')}
        onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.animationPlayState = 'running')}
      >
        {track.map((person, i) => {
          const shift = i % 2 === 0 ? 'mt-0' : 'mt-12';
          return (
            <div
              key={i}
              className={`group relative flex-shrink-0 rounded-2xl overflow-hidden cursor-default transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl ${shift}`}
              style={{ width: 190, height: 265 }}
            >
              {/* Photo */}
              <Image
                src={person.src}
                alt={person.name}
                fill
                className="object-cover object-top transition-transform duration-700 group-hover:scale-110"
              />

              {/* Always-on dark gradient at bottom */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />

              {/* Colored tint that intensifies on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${person.grad} opacity-10 group-hover:opacity-35 transition-opacity duration-500`} />

              {/* Shimmer sweep on hover */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

              {/* Info — slides up on hover */}
              <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
                <p className="font-bold text-white text-sm leading-tight">{person.name}</p>
                <p className="text-white/70 text-[11px] mt-0.5">{person.role}, {person.country}</p>

                {/* Animated underline */}
                <div className={`mt-2 h-0.5 w-0 group-hover:w-full bg-gradient-to-r ${person.grad} transition-all duration-500 rounded-full`} />
              </div>

              {/* Verified badge */}
              <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg scale-0 group-hover:scale-100 transition-transform duration-300 delay-100">
                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              {/* Glow ring on hover */}
              <div className={`absolute inset-0 rounded-2xl ring-0 group-hover:ring-2 ring-white/20 transition-all duration-300`} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
