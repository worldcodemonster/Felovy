import type { Metadata } from 'next';

export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'Felovy';

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
).replace(/\/$/, '');

export const SITE_TAGLINE = 'For Every Life, Our Value Yields';

export const DEFAULT_DESCRIPTION =
  'Felovy connects verified remote developers with companies worldwide. Browse software jobs, hire vetted talent, and build global teams across AI, web, mobile, cloud, and 12 service domains.';

export const DEFAULT_KEYWORDS = [
  'Felovy',
  'software development outsourcing',
  'hire remote developers',
  'developer jobs',
  'remote software jobs',
  'verified developers',
  'global talent platform',
  'freelance developers',
  'remote hiring',
  'software engineer jobs',
  'outsource development',
  'AI developers',
  'full stack developers',
  'remote work platform',
];

export const DEFAULT_OG_IMAGE = '/logo.png';

/** Site logo — also used as favicon (see src/app/icon.png) */
export const SITE_LOGO = '/logo.png';

export function absoluteUrl(path = ''): string {
  if (!path) return SITE_URL;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function truncate(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trim()}…`;
}

type PageMetadataOptions = {
  title: string;
  description?: string;
  path?: string;
  keywords?: string[];
  image?: string;
  noIndex?: boolean;
  type?: 'website' | 'article' | 'profile';
};

export function buildPageMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path = '/',
  keywords = DEFAULT_KEYWORDS,
  image = DEFAULT_OG_IMAGE,
  noIndex = false,
  type = 'website',
}: PageMetadataOptions): Metadata {
  const url = absoluteUrl(path);
  const ogImage = absoluteUrl(image);

  return {
    title,
    description: truncate(description, 160),
    keywords,
    alternates: { canonical: url },
    robots: noIndex
      ? { index: false, follow: false, googleBot: { index: false, follow: false } }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        },
    openGraph: {
      type,
      locale: 'en_US',
      url,
      siteName: SITE_NAME,
      title,
      description: truncate(description, 200),
      images: [{ url: ogImage, width: 512, height: 512, alt: `${SITE_NAME} logo` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: truncate(description, 200),
      images: [ogImage],
    },
  };
}

export const rootMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Remote Software Jobs & Verified Developer Hiring`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: DEFAULT_KEYWORDS,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: 'technology',
  formatDetection: { email: false, address: false, telephone: false },
  icons: {
    icon: [
      { url: SITE_LOGO, type: 'image/png' },
      { url: '/favicon.png', type: 'image/png' },
    ],
    shortcut: SITE_LOGO,
    apple: [{ url: SITE_LOGO, type: 'image/png', sizes: '180x180' }],
  },
  manifest: '/manifest.webmanifest',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: DEFAULT_DESCRIPTION,
    images: [{ url: absoluteUrl(DEFAULT_OG_IMAGE), width: 512, height: 512, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: DEFAULT_DESCRIPTION,
    images: [absoluteUrl(DEFAULT_OG_IMAGE)],
  },
  alternates: {
    canonical: SITE_URL,
  },
};

/** Public routes included in sitemap (static) */
export const STATIC_SITEMAP_ROUTES: { path: string; changeFrequency: 'daily' | 'weekly' | 'monthly'; priority: number }[] = [
  { path: '/', changeFrequency: 'daily', priority: 1 },
  { path: '/jobs', changeFrequency: 'daily', priority: 0.9 },
  { path: '/developers', changeFrequency: 'daily', priority: 0.9 },
  { path: '/signup', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/signin', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/signup?role=developer', changeFrequency: 'monthly', priority: 0.75 },
  { path: '/signup?role=employer', changeFrequency: 'monthly', priority: 0.75 },
];
