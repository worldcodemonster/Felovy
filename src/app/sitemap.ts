import type { MetadataRoute } from 'next';
import { SITE_URL, STATIC_SITEMAP_ROUTES } from '@/lib/seo';
import { getApprovedJobIds, getPublicDeveloperIds } from '@/lib/seo-server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_SITEMAP_ROUTES.map(({ path, changeFrequency, priority }) => ({
    url: `${SITE_URL}${path === '/' ? '' : path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));

  const [jobs, developers] = await Promise.all([getApprovedJobIds(), getPublicDeveloperIds()]);

  const jobEntries: MetadataRoute.Sitemap = jobs.map((job) => ({
    url: `${SITE_URL}/jobs/${job.id}`,
    lastModified: job.updatedAt || job.publishedAt || now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const developerEntries: MetadataRoute.Sitemap = developers.map((dev) => ({
    url: `${SITE_URL}/developers/${dev.id}`,
    lastModified: dev.updatedAt || now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...staticEntries, ...jobEntries, ...developerEntries];
}
