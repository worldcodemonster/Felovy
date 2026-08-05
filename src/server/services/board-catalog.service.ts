import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { prisma } from '../config/database';
import { EXCLUDED_PLATFORM_SLUGS } from '@/lib/excluded-platforms';

interface CatalogPlatform {
  slug: string;
  label?: string;
  domain?: string;
  integration?: string;
  request?: {
    list_url_template?: string | null;
    headers?: Record<string, string>;
    pagination?: unknown;
  };
  response?: {
    format?: string;
    jobs_path?: string;
    description_from_list?: boolean;
  };
  concurrency?: { global?: number; per_host_token?: number };
  board_tokens?: string[];
}

interface Catalog {
  platforms: Record<string, CatalogPlatform>;
}

function resolveCatalogPath(): string {
  const candidates = [
    join(process.cwd(), 'data', 'search-catalog.json'),
    join(process.cwd(), 'data.json'),
    join(process.cwd(), '..', 'felovy-search', 'data.json'),
  ];
  for (const p of candidates) {
    if (p && existsSync(p)) return p;
  }
  throw new Error('search-catalog.json not found. Place it in data/search-catalog.json');
}

function isScrapeable(p: CatalogPlatform): boolean {
  return Boolean(p.request?.list_url_template);
}

function defaultConcurrency(p: CatalogPlatform): number {
  const g = p.concurrency?.global;
  if (typeof g === 'number' && g > 0) return Math.min(g, 50);
  const integ = (p.integration || '').toLowerCase();
  if (integ.includes('xml') || integ.includes('rss')) return 5;
  if (integ.includes('html') || integ.includes('js-render')) return 8;
  return 10;
}

export async function getMeta(key: string): Promise<string | null> {
  const row = await prisma.appMeta.findUnique({ where: { key } });
  return row?.value ?? null;
}

export async function setMeta(key: string, value: string): Promise<void> {
  await prisma.appMeta.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

export async function importCatalogIfNeeded(force = false): Promise<{ platforms: number; tokens: number }> {
  if (!force && (await getMeta('catalog_imported')) === '1') {
    return { platforms: 0, tokens: 0 };
  }

  const raw = readFileSync(resolveCatalogPath(), 'utf8');
  const catalog = JSON.parse(raw) as Catalog;

  let platforms = 0;
  let tokens = 0;
  let sortOrder = 0;

  for (const [slug, p] of Object.entries(catalog.platforms)) {
    if (EXCLUDED_PLATFORM_SLUGS.has(slug)) continue;

    await prisma.boardPlatform.upsert({
      where: { slug },
      create: {
        slug,
        label: p.label || slug,
        domain: p.domain ?? null,
        integration: p.integration ?? null,
        listUrlTemplate: p.request?.list_url_template ?? null,
        headersJson: JSON.stringify(p.request?.headers ?? { 'User-Agent': 'Felovy/1.0' }),
        paginationJson: p.request?.pagination ? JSON.stringify(p.request.pagination) : null,
        jobsPath: p.response?.jobs_path ?? null,
        responseFormat: p.response?.format ?? null,
        descriptionFromList: Boolean(p.response?.description_from_list),
        scrapeable: isScrapeable(p),
        concurrency: defaultConcurrency(p),
        sortOrder: sortOrder++,
        catalogJson: JSON.stringify(p),
      },
      update: {
        label: p.label || slug,
        domain: p.domain ?? null,
        integration: p.integration ?? null,
        listUrlTemplate: p.request?.list_url_template ?? null,
        headersJson: JSON.stringify(p.request?.headers ?? { 'User-Agent': 'Felovy/1.0' }),
        paginationJson: p.request?.pagination ? JSON.stringify(p.request.pagination) : null,
        jobsPath: p.response?.jobs_path ?? null,
        responseFormat: p.response?.format ?? null,
        descriptionFromList: Boolean(p.response?.description_from_list),
        scrapeable: isScrapeable(p),
        catalogJson: JSON.stringify(p),
      },
    });
    platforms++;

    for (const token of p.board_tokens ?? []) {
      const normalized = String(token).trim().toLowerCase();
      if (!normalized) continue;
      await prisma.boardToken.upsert({
        where: { ats_boardToken: { ats: slug, boardToken: normalized } },
        create: { ats: slug, boardToken: normalized, enabled: true },
        update: { enabled: true },
      });
      tokens++;
    }
  }

  await setMeta('catalog_imported', '1');
  await setMeta('catalog_imported_at', new Date().toISOString());

  return { platforms, tokens };
}

export async function purgeExcludedPlatforms(): Promise<number> {
  const slugs = Array.from(EXCLUDED_PLATFORM_SLUGS);
  let removed = 0;
  for (const slug of slugs) {
    const exists = await prisma.boardPlatform.findUnique({ where: { slug } });
    if (!exists) continue;
    await prisma.boardPlatform.delete({ where: { slug } });
    removed++;
  }
  return removed;
}
