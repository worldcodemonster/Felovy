/**
 * Storyset is Felovy's default illustration library (Rafiki style).
 * Assets live in /public/illustrations/storyset/ — refresh with:
 *   npm run storyset:fetch
 * Recolor existing assets: npm run storyset:recolor
 *
 * @see https://storyset.com/ — attribution required for free use
 */

export const STORYSET_STYLE = 'rafiki' as const;
/** Illustration accents: Felovy brand green — see scripts/storyset-recolor.mjs */
export const STORYSET_BRAND_ACCENT = '#15803d';
export const STORYSET_BRAND_ACCENT_DARK = '#166534';
export const STORYSET_ATTRIBUTION_URL = 'https://storyset.com/';

const BASE = '/illustrations/storyset';

/** Build a public URL for a Storyset SVG saved under public/illustrations/storyset/ */
export function storysetSrc(relativePath: string): string {
  const clean = relativePath.replace(/^\//, '').replace(/\.svg$/, '');
  return `${BASE}/${clean}.svg`;
}

/** Shared illustrations used by <Illustration name="…" /> */
export const STORYSET_ILLUSTRATIONS = {
  'auth-developer': storysetSrc('auth-developer'),
  'auth-employer': storysetSrc('auth-employer'),
  'mail-sent': storysetSrc('mail-sent'),
  'celebrate': storysetSrc('celebrate'),
  'empty-jobs': storysetSrc('empty-jobs'),
  'empty-applications': storysetSrc('empty-applications'),
  'empty-developers': storysetSrc('empty-developers'),
  'empty-messages': storysetSrc('empty-messages'),
  'remote-work': storysetSrc('remote-work'),
  'team-hiring': storysetSrc('team-hiring'),
} as const;

export type StorysetIllustrationName = keyof typeof STORYSET_ILLUSTRATIONS;

export function storysetDomainSrc(domainId: string): string {
  return storysetSrc(`domains/${domainId}`);
}

export function storysetWorkflowSrc(stepId: string): string {
  return storysetSrc(`workflows/${stepId}`);
}
