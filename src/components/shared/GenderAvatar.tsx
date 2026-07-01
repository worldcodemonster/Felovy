'use client';

import Image from 'next/image';

type GenderKey = 'male' | 'female' | 'other';

const MALE_ICON = (
  <svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="7" r="4.5" />
    <path d="M4 22v-2a8 8 0 0116 0v2" />
  </svg>
);

const FEMALE_ICON = (
  <svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="6.5" r="4" />
    <path d="M7.5 12L5 22h14l-2.5-10C16 14 14 15.5 12 15.5S8 14 7.5 12z" />
  </svg>
);

const OTHER_ICON = (
  <svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="8.5" r="4" />
    <path d="M5 22v-2a7 7 0 0114 0v2" />
    <path d="M12 1.5v2.5M10.5 2.5h3" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.8" />
  </svg>
);

const CONFIGS: Record<GenderKey, { gradient: string; icon: React.ReactNode }> = {
  male:   { gradient: 'bg-gradient-to-br from-sky-400 to-blue-600',    icon: MALE_ICON   },
  female: { gradient: 'bg-gradient-to-br from-pink-400 to-rose-600',   icon: FEMALE_ICON },
  other:  { gradient: 'bg-gradient-to-br from-violet-400 to-purple-600', icon: OTHER_ICON },
};

import type React from 'react';

export function GenderAvatar({
  src,
  name,
  gender,
  size = 88,
}: {
  src?: string | null;
  name: string;
  gender?: string | null;
  size?: number;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  const cfg = gender ? CONFIGS[gender as GenderKey] : null;

  if (cfg) {
    const iconSize = Math.round(size * 0.56);
    return (
      <div
        className={`rounded-full ${cfg.gradient} flex items-center justify-center`}
        style={{ width: size, height: size }}
      >
        <div style={{ width: iconSize, height: iconSize }}>{cfg.icon}</div>
      </div>
    );
  }

  // Fallback: initial letter
  const initial = (name[0] ?? '?').toUpperCase();
  const fontSize = size >= 80 ? 'text-3xl' : 'text-base';
  return (
    <div
      className={`rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 flex items-center justify-center text-white font-black select-none ${fontSize}`}
      style={{ width: size, height: size }}
    >
      {initial}
    </div>
  );
}
