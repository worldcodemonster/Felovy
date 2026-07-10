import type { DeveloperProfile } from '@/components/home/DeveloperCommunitySection';
import { HOME_CAROUSEL_BOT_SPECS } from '@/lib/home-carousel-bots';
import { formatDeveloperPlace } from '@/lib/developer-location';

export const CAROUSEL_GRADS = [
  'from-green-500 to-emerald-600',
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-lime-500 to-green-600',
  'from-amber-500 to-orange-600',
  'from-cyan-500 to-blue-600',
  'from-amber-500 to-yellow-600',
  'from-sky-500 to-blue-600',
  'from-teal-500 to-green-600',
  'from-emerald-600 to-green-700',
  'from-teal-500 to-emerald-600',
  'from-indigo-500 to-violet-600',
  'from-orange-500 to-amber-600',
  'from-green-600 to-teal-600',
  'from-blue-500 to-cyan-600',
] as const;

/** Default list/card overlay — black & white until hover reveals a colorful grad. */
export const PORTRAIT_NEUTRAL_GRAD = 'from-black via-gray-600';

const GRADS = CAROUSEL_GRADS;

export const DEVELOPER_CAROUSEL: DeveloperProfile[] = HOME_CAROUSEL_BOT_SPECS.map((spec, i) => ({
  src: `/dev/${spec.photoFile}`,
  grad: GRADS[i % GRADS.length],
  name: spec.fullName,
  role: spec.title,
  location: spec.city,
  country: spec.country,
  place: formatDeveloperPlace(spec.city, spec.country),
}));
