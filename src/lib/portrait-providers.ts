/** Portrait image provider registry — shared between bot UI and server. */

export type PortraitProviderId =
  | 'pexels'
  | 'pixabay'
  | 'unsplash'
  | 'randomuser'
  | 'pravatar'
  | 'loremflickr';

export type PortraitProviderMeta = {
  id: PortraitProviderId;
  label: string;
  description: string;
  /** Env var name for live API search (optional — static pool used when missing). */
  apiKeyEnv?: string;
  /** Works without an API key (static URLs or public endpoint). */
  worksWithoutKey: boolean;
};

export const PORTRAIT_PROVIDERS: PortraitProviderMeta[] = [
  {
    id: 'pexels',
    label: 'Pexels',
    description: 'Royalty-free portraits via Pexels API search (curated pool fallback).',
    apiKeyEnv: 'PEXELS_API_KEY',
    worksWithoutKey: true,
  },
  {
    id: 'pixabay',
    label: 'Pixabay',
    description: 'Royalty-free portraits via Pixabay API search (curated pool fallback).',
    apiKeyEnv: 'PIXABAY_API_KEY',
    worksWithoutKey: true,
  },
  {
    id: 'unsplash',
    label: 'Unsplash',
    description: 'High-quality portraits via Unsplash API search (curated pool fallback).',
    apiKeyEnv: 'UNSPLASH_ACCESS_KEY',
    worksWithoutKey: true,
  },
  {
    id: 'randomuser',
    label: 'RandomUser',
    description: 'Random faces from randomuser.me API & CDN (~128–256px).',
    worksWithoutKey: true,
  },
  {
    id: 'pravatar',
    label: 'Pravatar',
    description: 'Diverse avatar-style faces from i.pravatar.cc (no API key).',
    worksWithoutKey: true,
  },
  {
    id: 'loremflickr',
    label: 'Lorem Flickr',
    description: 'Random CC-licensed Flickr portraits (no API key).',
    worksWithoutKey: true,
  },
];

export const PORTRAIT_PROVIDER_IDS = PORTRAIT_PROVIDERS.map((p) => p.id);

export const DEFAULT_PORTRAIT_PROVIDERS: PortraitProviderId[] = [
  'pexels',
  'pixabay',
  'unsplash',
  'pravatar',
];

export function isPortraitProviderId(value: string): value is PortraitProviderId {
  return PORTRAIT_PROVIDER_IDS.includes(value as PortraitProviderId);
}

export function normalizePortraitProviders(
  input?: string[] | null,
): PortraitProviderId[] {
  if (!input?.length) return [...DEFAULT_PORTRAIT_PROVIDERS];
  const valid = input.filter(isPortraitProviderId);
  return valid.length ? valid : [...DEFAULT_PORTRAIT_PROVIDERS];
}
