import { randomUUID } from 'node:crypto';
import type { BotGender } from '@/lib/portrait-sources';
import {
  PEXELS_PORTRAITS,
  PIXABAY_PORTRAITS,
  PortraitSession,
  REGION_PORTRAIT_POOLS,
  UNSPLASH_PORTRAITS,
  isLowResPortraitSource,
  randomUserCdnPortraits,
} from '@/lib/portrait-sources';
import {
  type PortraitProviderId,
  PORTRAIT_PROVIDERS,
  normalizePortraitProviders,
} from '@/lib/portrait-providers';
import { COUNTRY_PORTRAIT_REGION } from '@/lib/developer-bot-data';

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, Math.min(n, arr.length));
}

function genderKey(gender: BotGender): 'male' | 'female' {
  return gender === 'Female' ? 'female' : 'male';
}

function genderApi(gender: BotGender): 'male' | 'female' {
  return gender === 'Female' ? 'female' : 'male';
}

function portraitQuery(gender: BotGender): string {
  return gender === 'Female'
    ? 'professional woman portrait headshot'
    : 'professional man portrait headshot';
}

function filterUnused(urls: string[], session?: PortraitSession): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const url of urls) {
    if (!url || seen.has(url) || session?.isUsed(url)) continue;
    seen.add(url);
    out.push(url);
  }
  return out;
}

function staticUrlsForProvider(provider: PortraitProviderId, gender: BotGender): string[] {
  const key = genderKey(gender);
  switch (provider) {
    case 'pexels':
      return [...PEXELS_PORTRAITS[key]];
    case 'pixabay':
      return [...PIXABAY_PORTRAITS[key]];
    case 'unsplash':
      return [...UNSPLASH_PORTRAITS[key]];
    default:
      return [];
  }
}

function regionalUrls(country: string, gender: BotGender): string[] {
  const key = genderKey(gender);
  const region = COUNTRY_PORTRAIT_REGION[country] ?? 'europe';
  return [...(REGION_PORTRAIT_POOLS[region]?.[key] ?? [])];
}

// ─── Live API providers ───────────────────────────────────────────────────────

async function fetchPexelsApi(gender: BotGender, count: number): Promise<string[]> {
  const key = process.env.PEXELS_API_KEY?.trim();
  if (!key) return [];

  const page = 1 + Math.floor(Math.random() * 8);
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(portraitQuery(gender))}&orientation=portrait&per_page=${Math.min(count, 15)}&page=${page}`,
      { headers: { Authorization: key }, signal: AbortSignal.timeout(12000) },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as {
      photos?: { src?: { original?: string; large2x?: string; large?: string } }[];
    };
    return (data.photos ?? [])
      .map((p) => p.src?.original || p.src?.large2x || p.src?.large)
      .filter((u): u is string => Boolean(u));
  } catch {
    return [];
  }
}

async function fetchPixabayApi(gender: BotGender, count: number): Promise<string[]> {
  const key = process.env.PIXABAY_API_KEY?.trim();
  if (!key) return [];

  const q = gender === 'Female' ? 'woman+portrait+face' : 'man+portrait+face';
  const page = 1 + Math.floor(Math.random() * 5);
  try {
    const res = await fetch(
      `https://pixabay.com/api/?key=${encodeURIComponent(key)}&q=${q}&image_type=photo&orientation=vertical&per_page=${Math.min(count, 20)}&page=${page}&safesearch=true`,
      { signal: AbortSignal.timeout(12000) },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { hits?: { largeImageURL?: string; webformatURL?: string }[] };
    return (data.hits ?? [])
      .map((h) => h.largeImageURL || h.webformatURL)
      .filter((u): u is string => Boolean(u));
  } catch {
    return [];
  }
}

async function fetchUnsplashApi(gender: BotGender, count: number): Promise<string[]> {
  const key = process.env.UNSPLASH_ACCESS_KEY?.trim();
  if (!key) return [];

  const page = 1 + Math.floor(Math.random() * 8);
  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(portraitQuery(gender))}&orientation=portrait&per_page=${Math.min(count, 15)}&page=${page}`,
      { headers: { Authorization: `Client-ID ${key}` }, signal: AbortSignal.timeout(12000) },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as {
      results?: { urls?: { full?: string; regular?: string } }[];
    };
    return (data.results ?? [])
      .map((r) => r.urls?.full || r.urls?.regular)
      .filter((u): u is string => Boolean(u));
  } catch {
    return [];
  }
}

async function fetchRandomUserApi(gender: BotGender, count: number): Promise<string[]> {
  const urls: string[] = [];
  const nats = ['us', 'gb', 'de', 'fr', 'in', 'au', 'br', 'mx', 'es', 'it', 'nl', 'se'];

  for (let i = 0; i < count; i++) {
    try {
      const seed = randomUUID();
      const nat = pick(nats);
      const res = await fetch(
        `https://randomuser.me/api/?nat=${nat}&gender=${genderApi(gender)}&inc=picture&results=1&seed=${seed}`,
        { signal: AbortSignal.timeout(10000) },
      );
      if (!res.ok) continue;
      const data = (await res.json()) as { results?: { picture?: { large?: string } }[] };
      const url = data.results?.[0]?.picture?.large;
      if (url) urls.push(url);
    } catch {
      /* try next */
    }
  }
  return urls;
}

function fetchPravatarUrls(gender: BotGender, count: number): string[] {
  const urls: string[] = [];
  // Pravatar img ids — rough gender split for better matching
  const maleIds = Array.from({ length: 35 }, (_, i) => i + 1);
  const femaleIds = Array.from({ length: 35 }, (_, i) => i + 36);
  const pool = gender === 'Female' ? femaleIds : maleIds;

  for (let i = 0; i < count; i++) {
    const img = pool[Math.floor(Math.random() * pool.length)];
    urls.push(`https://i.pravatar.cc/800?img=${img}`);
  }
  return urls;
}

function fetchLoremFlickrUrls(gender: BotGender, count: number): string[] {
  const tag = gender === 'Female' ? 'portrait,girl' : 'portrait,man';
  const urls: string[] = [];
  for (let i = 0; i < count; i++) {
    urls.push(`https://loremflickr.com/800/1000/${tag}?random=${randomUUID()}`);
  }
  return urls;
}

// ─── Per-provider fetch ───────────────────────────────────────────────────────

async function urlsFromProvider(
  provider: PortraitProviderId,
  gender: BotGender,
  country: string,
  session?: PortraitSession,
): Promise<{ urls: string[]; source: 'api' | 'static' | 'public' }> {
  const key = genderKey(gender);

  switch (provider) {
    case 'pexels': {
      const api = await fetchPexelsApi(gender, 8);
      if (api.length) return { urls: api, source: 'api' };
      return {
        urls: [...pickN(staticUrlsForProvider('pexels', gender), 4), ...pickN(regionalUrls(country, gender), 2)],
        source: 'static',
      };
    }
    case 'pixabay': {
      const api = await fetchPixabayApi(gender, 8);
      if (api.length) return { urls: api, source: 'api' };
      return { urls: pickN(staticUrlsForProvider('pixabay', gender), 6), source: 'static' };
    }
    case 'unsplash': {
      const api = await fetchUnsplashApi(gender, 8);
      if (api.length) return { urls: api, source: 'api' };
      return {
        urls: [...pickN(staticUrlsForProvider('unsplash', gender), 4), ...pickN(regionalUrls(country, gender), 2)],
        source: 'static',
      };
    }
    case 'randomuser': {
      const api = await fetchRandomUserApi(gender, 4);
      const cdn = session
        ? Array.from({ length: 4 }, () => session.claimRandomUserCdnPortrait(gender)).filter(Boolean) as string[]
        : randomUserCdnPortraits(gender, 4);
      return { urls: [...api, ...cdn], source: 'api' };
    }
    case 'pravatar':
      return { urls: fetchPravatarUrls(gender, 6), source: 'public' };
    case 'loremflickr':
      return { urls: fetchLoremFlickrUrls(gender, 4), source: 'public' };
    default:
      return { urls: [], source: 'static' };
  }
}

export type PortraitProviderStatus = {
  id: PortraitProviderId;
  label: string;
  description: string;
  worksWithoutKey: boolean;
  apiKeyConfigured: boolean;
  available: boolean;
};

export function getPortraitProviderStatuses(): PortraitProviderStatus[] {
  return PORTRAIT_PROVIDERS.map((p) => {
    const apiKeyConfigured = p.apiKeyEnv ? Boolean(process.env[p.apiKeyEnv]?.trim()) : false;
    return {
      id: p.id,
      label: p.label,
      description: p.description,
      worksWithoutKey: p.worksWithoutKey,
      apiKeyConfigured,
      available: p.worksWithoutKey || apiKeyConfigured,
    };
  });
}

export type FetchPortraitCandidatesOptions = {
  providers?: PortraitProviderId[] | null;
  country: string;
  gender: BotGender;
  session?: PortraitSession;
  preferredUrl?: string | null;
};

export type PortraitCandidateMeta = {
  url: string;
  provider: PortraitProviderId;
  source: 'api' | 'static' | 'public';
};

/** Fetch portrait URLs from selected providers — live API first, static/public fallback per provider. */
export async function fetchPortraitCandidates(
  options: FetchPortraitCandidatesOptions,
): Promise<PortraitCandidateMeta[]> {
  const providers = normalizePortraitProviders(options.providers);
  const { gender, country, session, preferredUrl } = options;

  const highRes: PortraitCandidateMeta[] = [];
  const lowRes: PortraitCandidateMeta[] = [];

  if (preferredUrl && !isLowResPortraitSource(preferredUrl) && !session?.isUsed(preferredUrl)) {
    highRes.push({ url: preferredUrl, provider: 'pexels', source: 'api' });
  }

  const orderedProviders = shuffle(providers);
  for (const provider of orderedProviders) {
    const { urls, source } = await urlsFromProvider(provider, gender, country, session);
    for (const url of filterUnused(urls, session)) {
      const entry: PortraitCandidateMeta = { url, provider, source };
      if (isLowResPortraitSource(url) || provider === 'randomuser') {
        lowRes.push(entry);
      } else {
        highRes.push(entry);
      }
    }
  }

  const dedupeMeta = (items: PortraitCandidateMeta[]) => {
    const seen = new Set<string>();
    const out: PortraitCandidateMeta[] = [];
    for (const item of items) {
      if (seen.has(item.url) || session?.isUsed(item.url)) continue;
      seen.add(item.url);
      out.push(item);
    }
    return out;
  };

  return [...shuffle(dedupeMeta(highRes)), ...dedupeMeta(lowRes)];
}
