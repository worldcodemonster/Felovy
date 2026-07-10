import { COUNTRY_NAMES } from '@/lib/countries';
import { COUNTRY_CITIES } from '@/lib/developer-bot-data';
import { HOME_CAROUSEL_BOT_SPECS, normalizeHomeCarouselCountry } from '@/lib/home-carousel-bots';

const COUNTRY_NAME_SET = new Set(COUNTRY_NAMES);

/** Display label: "Istanbul, Turkey" or "San Francisco, CA, United States". */
export function formatDeveloperPlace(
  location?: string | null,
  country?: string | null,
): string {
  const city = location?.trim() ?? '';
  const ctry = normalizeCountryLabel(country?.trim() ?? '');
  if (!city && !ctry) return '';
  if (!city) return ctry;
  if (!ctry) return city;

  const cityLower = city.toLowerCase();
  const countryLower = ctry.toLowerCase();
  if (
    cityLower === countryLower
    || cityLower.endsWith(`, ${countryLower}`)
    || cityLower.endsWith(countryLower)
  ) {
    return city;
  }
  return `${city}, ${ctry}`;
}

function normalizeCountryLabel(country: string): string {
  if (country === 'USA') return 'United States';
  return country;
}

function hashStableKey(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** Pick a city for a country; stable when `stableKey` is provided (e.g. developer id). */
export function pickCityForCountry(country: string, stableKey?: string): string {
  const normalized = normalizeCountryLabel(country);
  const cities = COUNTRY_CITIES[normalized];
  if (!cities?.length) return '';
  if (!stableKey) return cities[Math.floor(Math.random() * cities.length)];
  return cities[hashStableKey(stableKey) % cities.length];
}

function stripCountrySuffix(city: string, country: string): string {
  const suffix = `, ${country}`;
  if (city.toLowerCase().endsWith(suffix.toLowerCase())) {
    return city.slice(0, -suffix.length).trim();
  }
  if (city.toLowerCase() === country.toLowerCase()) return '';
  return city;
}

/** Split combined "City, Country" strings and normalize country aliases. */
export function normalizeDeveloperLocationFields(
  location?: string | null,
  country?: string | null,
): { location: string | null; country: string | null } {
  let city = location?.trim() || null;
  let ctry = normalizeCountryLabel(country?.trim() || '') || null;

  if (city && !ctry) {
    const parts = city.split(',').map((s) => s.trim());
    if (parts.length >= 2) {
      const last = parts[parts.length - 1];
      const normalizedLast = normalizeCountryLabel(last);
      if (COUNTRY_NAME_SET.has(normalizedLast)) {
        ctry = normalizedLast;
        city = parts.slice(0, -1).join(', ');
      }
    }
  }

  if (city && ctry) {
    const stripped = stripCountrySuffix(city, ctry);
    city = stripped || null;
  }

  return { location: city, country: ctry };
}

function homeCarouselCityFor(fullName: string | null | undefined, country: string | null): string | null {
  if (!fullName || !country) return null;
  const normalized = normalizeHomeCarouselCountry(country);
  const spec = HOME_CAROUSEL_BOT_SPECS.find(
    (s) => s.fullName === fullName && normalizeHomeCarouselCountry(s.country) === normalized,
  );
  return spec?.city ?? null;
}

export function resolveDeveloperLocation(params: {
  id: string;
  fullName?: string | null;
  location?: string | null;
  country?: string | null;
}): { location: string; country: string } | null {
  const normalized = normalizeDeveloperLocationFields(params.location, params.country);
  const country = normalized.country;
  if (!country) return null;

  const carouselCity = homeCarouselCityFor(params.fullName, country);
  let city = carouselCity ?? normalized.location;

  if (!city || city.toLowerCase() === country.toLowerCase()) {
    city = pickCityForCountry(country, params.id);
  }

  if (!city) return null;
  return { location: city, country };
}

export function needsLocationUpdate(
  location?: string | null,
  country?: string | null,
): boolean {
  const normalized = normalizeDeveloperLocationFields(location, country);
  if (!normalized.country) return false;
  if (!normalized.location) return true;
  if (normalized.location.toLowerCase() === normalized.country.toLowerCase()) return true;
  return false;
}

/** City + country for public developer cards (infers city when only country is stored). */
export function resolvePublicDeveloperPlace(params: {
  id: string;
  fullName?: string | null;
  location?: string | null;
  country?: string | null;
}): string {
  const resolved = resolveDeveloperLocation(params);
  if (resolved) {
    return formatDeveloperPlace(resolved.location, resolved.country);
  }
  return formatDeveloperPlace(params.location, params.country);
}
