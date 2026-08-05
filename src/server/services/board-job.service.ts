import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { inferRegion } from '@/lib/board-job-region';
import type {
  BoardJobIngestPayload,
  BoardJobIngestResult,
  BoardJobListQuery,
  BoardJobListResponse,
  BoardJobRow,
} from '@/lib/board-job-types';

const MAX_BATCH = 500;

function parseDate(value: string | null | undefined): Date | null {
  if (!value?.trim()) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function normalizeRemoteStatus(value: string | null | undefined): string | null {
  if (!value) return null;
  const v = value.trim().toLowerCase();
  if (v === 'remote' || v === 'hybrid' || v === 'onsite') return v;
  return null;
}

function toRow(record: {
  id: string;
  ats: string;
  boardToken: string;
  externalJobId: string;
  title: string | null;
  companyName: string | null;
  locationName: string | null;
  absoluteUrl: string | null;
  firstPublished: Date | null;
  sourceUpdatedAt: Date | null;
  contentHtml: string | null;
  contentText: string | null;
  departmentsJson: string | null;
  officesJson: string | null;
  metadataJson: string | null;
  remoteStatus: string | null;
  language: string | null;
  employmentType: string | null;
  countryCode: string | null;
  region: string | null;
  logoUrl: string | null;
  scrapedAt: Date;
  seenInLastScrape: boolean;
}): BoardJobRow {
  return {
    id: record.id,
    ats: record.ats,
    boardToken: record.boardToken,
    externalJobId: record.externalJobId,
    title: record.title,
    companyName: record.companyName,
    locationName: record.locationName,
    absoluteUrl: record.absoluteUrl,
    firstPublished: record.firstPublished?.toISOString() ?? null,
    sourceUpdatedAt: record.sourceUpdatedAt?.toISOString() ?? null,
    contentHtml: record.contentHtml,
    contentText: record.contentText,
    departmentsJson: record.departmentsJson,
    officesJson: record.officesJson,
    metadataJson: record.metadataJson,
    remoteStatus: record.remoteStatus,
    language: record.language,
    employmentType: record.employmentType,
    countryCode: record.countryCode,
    region: record.region,
    logoUrl: record.logoUrl,
    scrapedAt: record.scrapedAt.toISOString(),
    seenInLastScrape: record.seenInLastScrape,
  };
}

function buildTextFilter(
  field: 'title' | 'contentText' | 'boardToken',
  query: string | undefined,
  mode: 'AND' | 'OR' = 'AND',
): Prisma.BoardJobWhereInput | undefined {
  if (!query?.trim()) return undefined;
  const terms = query.trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return undefined;

  const clauses = terms.map((term) => ({
    [field]: { contains: term, mode: 'insensitive' as const },
  }));

  return mode === 'OR' ? { OR: clauses } : { AND: clauses };
}

function dateCutoff(preset: string | undefined): Date | null {
  if (!preset || preset === 'all') return null;
  const days: Record<string, number> = {
    today: 1,
    '2d': 2,
    '3d': 3,
    '7d': 7,
    '15d': 15,
    '30d': 30,
  };
  const d = days[preset];
  if (!d) return null;
  return new Date(Date.now() - d * 24 * 60 * 60 * 1000);
}

function buildWhere(query: BoardJobListQuery): Prisma.BoardJobWhereInput {
  const and: Prisma.BoardJobWhereInput[] = [];

  const titleFilter = buildTextFilter('title', query.title_q, query.title_mode ?? 'AND');
  if (titleFilter) and.push(titleFilter);

  const contentFilter = buildTextFilter('contentText', query.content_q, query.content_mode ?? 'AND');
  if (contentFilter) and.push(contentFilter);

  const boardFilter = buildTextFilter('boardToken', query.board_token_q, 'OR');
  if (boardFilter) and.push(boardFilter);

  if (query.ats?.trim()) and.push({ ats: query.ats.trim() });
  if (query.remote_status?.trim()) and.push({ remoteStatus: query.remote_status.trim().toLowerCase() });

  if (query.region && query.region !== 'ANY') {
    and.push({ region: query.region });
  }

  const postedCutoff = dateCutoff(query.posted_range);
  if (postedCutoff) {
    and.push({
      OR: [
        { firstPublished: { gte: postedCutoff } },
        { sourceUpdatedAt: { gte: postedCutoff } },
      ],
    });
  }

  const updatedCutoff = dateCutoff(query.updated_range);
  if (updatedCutoff) {
    and.push({ sourceUpdatedAt: { gte: updatedCutoff } });
  }

  return and.length ? { AND: and } : {};
}

function buildOrderBy(query: BoardJobListQuery): Prisma.BoardJobOrderByWithRelationInput {
  const dir = query.sort_dir === 'asc' ? 'asc' : 'desc';
  switch (query.sort_by) {
    case 'title': return { title: dir };
    case 'company_name': return { companyName: dir };
    case 'location_name': return { locationName: dir };
    case 'source_updated_at': return { sourceUpdatedAt: dir };
    case 'board_token': return { boardToken: dir };
    case 'scraped_at': return { scrapedAt: dir };
    case 'first_published':
    default: return { firstPublished: dir };
  }
}

export function normalizeIngestPayload(raw: BoardJobIngestPayload) {
  const ats = String(raw.ats ?? '').trim();
  const boardToken = String(raw.board_token ?? '').trim();
  const externalJobId = String(raw.job_id ?? '').trim();

  if (!ats || !boardToken || !externalJobId) {
    throw new Error('Each job requires ats, board_token, and job_id');
  }

  const countryCode = raw.country_code?.trim() || null;
  const locationName = raw.location_name?.trim() || null;
  const region = inferRegion(countryCode, locationName);

  return {
    ats,
    boardToken,
    externalJobId,
    title: raw.title?.trim() || null,
    companyName: raw.company_name?.trim() || null,
    locationName,
    absoluteUrl: raw.absolute_url?.trim() || null,
    firstPublished: parseDate(raw.first_published),
    sourceUpdatedAt: parseDate(raw.updated_at),
    contentHtml: raw.content_html ?? null,
    contentText: raw.content_text ?? null,
    departmentsJson: raw.departments_json ?? null,
    officesJson: raw.offices_json ?? null,
    metadataJson: raw.metadata_json ?? null,
    remoteStatus: normalizeRemoteStatus(raw.remote_status ?? undefined),
    language: raw.language?.trim() || null,
    employmentType: raw.employment_type?.trim() || null,
    countryCode,
    region,
    logoUrl: raw.logo_url?.trim() || null,
    scrapedAt: parseDate(raw.scraped_at) ?? new Date(),
    seenInLastScrape: raw.seen_in_last_scrape === false || raw.seen_in_last_scrape === 0 ? false : true,
  };
}

export async function ingestBoardJobs(jobs: BoardJobIngestPayload[]): Promise<BoardJobIngestResult> {
  const batch = jobs.slice(0, MAX_BATCH);
  const result: BoardJobIngestResult = { created: 0, updated: 0, failed: 0, errors: [] };

  for (let i = 0; i < batch.length; i++) {
    try {
      const data = normalizeIngestPayload(batch[i]);
      const existing = await prisma.boardJob.findUnique({
        where: {
          ats_boardToken_externalJobId: {
            ats: data.ats,
            boardToken: data.boardToken,
            externalJobId: data.externalJobId,
          },
        },
        select: { id: true },
      });

      await prisma.boardJob.upsert({
        where: {
          ats_boardToken_externalJobId: {
            ats: data.ats,
            boardToken: data.boardToken,
            externalJobId: data.externalJobId,
          },
        },
        create: data,
        update: {
          ...data,
          updatedAt: new Date(),
        },
      });

      if (existing) result.updated += 1;
      else result.created += 1;
    } catch (err) {
      result.failed += 1;
      const msg = err instanceof Error ? err.message : 'Unknown error';
      result.errors.push(`Job ${i + 1}: ${msg}`);
    }
  }

  return result;
}

export async function listBoardJobs(query: BoardJobListQuery): Promise<BoardJobListResponse> {
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = Math.min(200, Math.max(1, Number(query.pageSize) || 50));
  const skip = (page - 1) * pageSize;
  const where = buildWhere(query);
  const orderBy = buildOrderBy(query);

  const [items, total] = await Promise.all([
    prisma.boardJob.findMany({ where, skip, take: pageSize, orderBy }),
    prisma.boardJob.count({ where }),
  ]);

  return {
    items: items.map(toRow),
    total,
    page,
    pageSize,
  };
}

export async function getBoardJobFilters(): Promise<{ ats: string[] }> {
  const rows = await prisma.boardJob.findMany({
    distinct: ['ats'],
    select: { ats: true },
    orderBy: { ats: 'asc' },
  });
  return { ats: rows.map(r => r.ats) };
}

export async function getBoardJobById(id: string): Promise<BoardJobRow | null> {
  const row = await prisma.boardJob.findUnique({ where: { id } });
  return row ? toRow(row) : null;
}

export async function getBoardJobStats(): Promise<{ total: number }> {
  const total = await prisma.boardJob.count();
  return { total };
}

/** Upsert scraped jobs for one board and prune jobs missing from the latest scrape. */
export async function upsertJobsAndPruneMissing(
  ats: string,
  boardToken: string,
  jobs: import('@/lib/board-search-types').UnifiedJob[],
  logoUrl?: string | null,
): Promise<{ upserted: number; pruned: number }> {
  const now = new Date();

  await prisma.boardJob.updateMany({
    where: { ats, boardToken },
    data: { seenInLastScrape: false },
  });

  for (const job of jobs) {
    const region = inferRegion(job.country_code, job.location_name);
    const data = {
      title: job.title,
      companyName: job.company_name,
      locationName: job.location_name,
      absoluteUrl: job.absolute_url,
      firstPublished: job.first_published ? parseDate(job.first_published) : null,
      sourceUpdatedAt: job.updated_at ? parseDate(job.updated_at) : null,
      contentHtml: job.content_html,
      contentText: job.content_text,
      departmentsJson: job.departments_json,
      officesJson: job.offices_json,
      metadataJson: job.metadata_json,
      remoteStatus: normalizeRemoteStatus(job.remote_status),
      language: job.language,
      employmentType: job.employment_type,
      countryCode: job.country_code,
      region,
      logoUrl: logoUrl ?? undefined,
      scrapedAt: now,
      seenInLastScrape: true,
    };

    await prisma.boardJob.upsert({
      where: {
        ats_boardToken_externalJobId: {
          ats,
          boardToken,
          externalJobId: job.job_id,
        },
      },
      create: {
        ats,
        boardToken,
        externalJobId: job.job_id,
        ...data,
      },
      update: {
        ...data,
        firstPublished: data.firstPublished ?? undefined,
        sourceUpdatedAt: data.sourceUpdatedAt ?? undefined,
        contentHtml: data.contentHtml ?? undefined,
        contentText: data.contentText ?? undefined,
        updatedAt: now,
      },
    });
  }

  const stale = await prisma.boardJob.findMany({
    where: { ats, boardToken, seenInLastScrape: false },
    select: { id: true },
  });

  if (stale.length) {
    await prisma.boardJob.deleteMany({
      where: { id: { in: stale.map(s => s.id) } },
    });
  }

  return { upserted: jobs.length, pruned: stale.length };
}
