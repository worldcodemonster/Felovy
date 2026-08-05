import { prisma } from '../config/database';
import type { BoardTokenRow } from '@/lib/board-search-types';

function toRow(r: {
  ats: string;
  boardToken: string;
  enabled: boolean;
  lastScrapedAt: Date | null;
  lastStatus: string | null;
  lastError: string | null;
  lastJobCount: number | null;
  logoUrl: string | null;
  logoFetchedAt: Date | null;
  openedCount: number;
}): BoardTokenRow {
  return {
    ats: r.ats,
    board_token: r.boardToken,
    enabled: r.enabled,
    last_scraped_at: r.lastScrapedAt?.toISOString() ?? null,
    last_status: r.lastStatus,
    last_error: r.lastError,
    last_job_count: r.lastJobCount,
    logo_url: r.logoUrl,
    logo_fetched_at: r.logoFetchedAt?.toISOString() ?? null,
    opened_count: r.openedCount,
  };
}

export async function searchBoardTokens(
  ats: string,
  q: string,
  limit = 100,
  offset = 0,
): Promise<{ items: BoardTokenRow[]; total: number }> {
  const where = q.trim()
    ? { ats, boardToken: { contains: q.trim(), mode: 'insensitive' as const } }
    : { ats };

  const [items, total] = await Promise.all([
    prisma.boardToken.findMany({
      where,
      orderBy: { boardToken: 'asc' },
      take: limit,
      skip: offset,
    }),
    prisma.boardToken.count({ where }),
  ]);

  return { items: items.map(toRow), total };
}

export async function addBoardToken(ats: string, boardToken: string): Promise<void> {
  const token = boardToken.trim().toLowerCase();
  if (!token) throw new Error('board_token is required');
  await prisma.boardToken.upsert({
    where: { ats_boardToken: { ats, boardToken: token } },
    create: { ats, boardToken: token, enabled: true },
    update: { enabled: true },
  });
}

export async function addBoardTokensBatch(ats: string, tokens: string[]): Promise<number> {
  let inserted = 0;
  for (const raw of tokens) {
    const token = raw.trim().toLowerCase();
    if (!token) continue;
    const existing = await prisma.boardToken.findUnique({
      where: { ats_boardToken: { ats, boardToken: token } },
    });
    if (existing) continue;
    await prisma.boardToken.create({ data: { ats, boardToken: token, enabled: true } });
    inserted++;
  }
  return inserted;
}

export async function deleteBoardToken(ats: string, boardToken: string): Promise<void> {
  await prisma.$transaction([
    prisma.boardJob.deleteMany({ where: { ats, boardToken } }),
    prisma.boardToken.delete({ where: { ats_boardToken: { ats, boardToken } } }),
  ]);
}

export async function setBoardTokenEnabled(
  ats: string,
  boardToken: string,
  enabled: boolean,
): Promise<void> {
  await prisma.boardToken.update({
    where: { ats_boardToken: { ats, boardToken } },
    data: { enabled },
  });
}

export async function listEnabledTokens(ats: string): Promise<string[]> {
  const rows = await prisma.boardToken.findMany({
    where: { ats, enabled: true },
    select: { boardToken: true },
    orderBy: { boardToken: 'asc' },
  });
  return rows.map(r => r.boardToken);
}

export async function listAllBoardTokens(ats: string): Promise<string[]> {
  const rows = await prisma.boardToken.findMany({
    where: { ats },
    select: { boardToken: true },
    orderBy: { boardToken: 'asc' },
  });
  return rows.map(r => r.boardToken);
}

export async function updateBoardScrapeResult(
  ats: string,
  boardToken: string,
  status: string,
  error: string | null,
  jobCount: number,
): Promise<void> {
  await prisma.boardToken.update({
    where: { ats_boardToken: { ats, boardToken } },
    data: {
      lastScrapedAt: new Date(),
      lastStatus: status,
      lastError: error,
      lastJobCount: jobCount,
    },
  });
}

export async function boardHasLogo(ats: string, boardToken: string): Promise<boolean> {
  const row = await prisma.boardToken.findUnique({
    where: { ats_boardToken: { ats, boardToken } },
    select: { logoUrl: true },
  });
  return Boolean(row?.logoUrl?.trim());
}

export async function updateBoardLogo(
  ats: string,
  boardToken: string,
  logoUrl: string,
): Promise<void> {
  await prisma.boardToken.update({
    where: { ats_boardToken: { ats, boardToken } },
    data: { logoUrl, logoFetchedAt: new Date() },
  });
}

export async function getBoardLogoUrl(ats: string, boardToken: string): Promise<string | null> {
  const row = await prisma.boardToken.findUnique({
    where: { ats_boardToken: { ats, boardToken } },
    select: { logoUrl: true },
  });
  return row?.logoUrl ?? null;
}
