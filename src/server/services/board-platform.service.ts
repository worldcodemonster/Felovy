import { prisma } from '../config/database';
import type { PlatformRow } from '@/lib/board-search-types';
import type { PlatformConfig } from '../scraper/fetchBoard';

function toPlatformRow(
  p: {
    slug: string;
    label: string;
    domain: string | null;
    integration: string | null;
    listUrlTemplate: string | null;
    scrapeable: boolean;
    concurrency: number;
    agentEnabled: boolean;
    sortOrder: number;
    headersJson: string;
    paginationJson: string | null;
    jobsPath: string | null;
    responseFormat: string | null;
    descriptionFromList: boolean;
  },
  tokenCount: number,
  jobCount: number,
): PlatformRow {
  return {
    slug: p.slug,
    label: p.label,
    domain: p.domain,
    integration: p.integration,
    list_url_template: p.listUrlTemplate,
    scrapeable: p.scrapeable,
    concurrency: p.concurrency,
    agent_enabled: p.agentEnabled,
    sort_order: p.sortOrder,
    token_count: tokenCount,
    job_count: jobCount,
  };
}

export async function listPlatforms(): Promise<PlatformRow[]> {
  const platforms = await prisma.boardPlatform.findMany({
    orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
  });

  const tokenCounts = await prisma.boardToken.groupBy({
    by: ['ats'],
    _count: { boardToken: true },
  });
  const jobCounts = await prisma.boardJob.groupBy({
    by: ['ats'],
    _count: { id: true },
  });

  const tokenMap = new Map(tokenCounts.map(r => [r.ats, r._count.boardToken]));
  const jobMap = new Map(jobCounts.map(r => [r.ats, r._count.id]));

  return platforms.map(p =>
    toPlatformRow(p, tokenMap.get(p.slug) ?? 0, jobMap.get(p.slug) ?? 0),
  );
}

export async function getPlatform(slug: string) {
  return prisma.boardPlatform.findUnique({ where: { slug } });
}

export async function getPlatformConfig(slug: string): Promise<PlatformConfig> {
  const p = await getPlatform(slug);
  if (!p) throw new Error(`Unknown platform: ${slug}`);
  if (!p.listUrlTemplate) throw new Error(`Platform ${slug} is not scrapeable`);
  return {
    slug: p.slug,
    label: p.label,
    list_url_template: p.listUrlTemplate,
    headers_json: p.headersJson,
    pagination_json: p.paginationJson,
    jobs_path: p.jobsPath,
    response_format: p.responseFormat,
    description_from_list: p.descriptionFromList ? 1 : 0,
    integration: p.integration,
  };
}

export async function setPlatformConcurrency(slug: string, concurrency: number): Promise<void> {
  await prisma.boardPlatform.update({
    where: { slug },
    data: { concurrency: Math.max(1, Math.min(100, Math.floor(concurrency))) },
  });
}

export async function setAgentEnabled(slug: string, enabled: boolean): Promise<void> {
  await prisma.boardPlatform.update({
    where: { slug },
    data: { agentEnabled: enabled },
  });
}

export async function reorderPlatforms(slugs: string[]): Promise<void> {
  await prisma.$transaction(
    slugs.map((slug, i) =>
      prisma.boardPlatform.update({
        where: { slug },
        data: { sortOrder: i },
      }),
    ),
  );
}

export async function movePlatform(slug: string, direction: 'up' | 'down'): Promise<PlatformRow[]> {
  const list = await listPlatforms();
  const idx = list.findIndex(p => p.slug === slug);
  if (idx < 0) return list;
  const swapWith = direction === 'up' ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= list.length) return list;
  const next = [...list];
  [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
  await reorderPlatforms(next.map(p => p.slug));
  return listPlatforms();
}
