import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';
import { COUNTRY_NAMES } from '@/lib/countries';
import type { BotDomainId } from '@/lib/developer-bot-data';
import {
  createBotDevelopers,
  createHomeCarouselBotDevelopers,
  syncAllBotDeveloperPasswords,
  syncAllDeveloperLocations,
  type BotProgressEvent,
  type PhotoMode,
} from '../services/developer-bot.service';
import { getPortraitProviderStatuses } from '../services/portrait-api.service';
import { isPortraitProviderId, normalizePortraitProviders } from '@/lib/portrait-providers';

// ─── Dashboard stats ──────────────────────────────────────────────────────────

export const getDashboardStats = async (_req: AuthRequest, res: Response): Promise<void> => {
  const [developers, employers, jobs, pendingDevs, pendingEmps, pendingJobs, totalUsers, bannedUsers] = await Promise.all([
    prisma.developer.count(),
    prisma.employer.count(),
    prisma.job.count({ where: { status: 'APPROVED' } }),
    prisma.developer.count({ where: { profileStep: 4, isVerified: false } }),
    prisma.employer.count({ where: { profileStep: 4, isVerified: false } }),
    prisma.job.count({ where: { status: 'PENDING' } }),
    prisma.user.count(),
    prisma.user.count({ where: { status: 'BANNED' } }),
  ]);
  res.json({ developers, employers, activeJobs: jobs, pendingDevs, pendingEmps, pendingJobs, totalUsers, bannedUsers });
};

// ─── List all users ───────────────────────────────────────────────────────────

export const listUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = '1', limit = '20', role, status, search } = req.body;
  const skip = (Number(page) - 1) * Number(limit);
  const where: any = {};
  if (role) where.role = String(role);
  if (status) where.status = String(status);
  if (search) where.email = { contains: String(search), mode: 'insensitive' };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: { id: true, email: true, role: true, status: true, createdAt: true },
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);
  res.json({ users, total, page: Number(page), limit: Number(limit) });
};

// ─── Moderate users ───────────────────────────────────────────────────────────

export const moderateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId, email, action } = req.body as { userId?: string; email?: string; action: 'mute' | 'unmute' | 'kick' | 'ban' | 'unban' };
  const target = userId
    ? await prisma.user.findUnique({ where: { id: userId } })
    : email
    ? await prisma.user.findUnique({ where: { email } })
    : null;
  if (!target) { res.status(404).json({ message: 'User not found' }); return; }
  if (target.role === 'OWNER') {
    res.status(403).json({ message: 'Cannot moderate the owner' }); return;
  }

  if (action === 'kick') {
    await prisma.user.delete({ where: { id: target.id } });
    res.json({ message: 'User kicked and deleted' });
    return;
  }

  const statusMap: Record<string, any> = { mute: 'MUTED', unmute: 'ACTIVE', ban: 'BANNED', unban: 'ACTIVE' };
  const messageMap: Record<string, string> = { mute: 'muted', unmute: 'unmuted', ban: 'banned', unban: 'unbanned' };
  await prisma.user.update({ where: { id: target.id }, data: { status: statusMap[action] } });
  res.json({ message: `User ${messageMap[action] ?? action}` });
};

// ─── List all developers ──────────────────────────────────────────────────────

export const listAllDevelopers = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = '1', limit = '20', verified, search, status, country, isBot } = req.body;
  const skip = (Number(page) - 1) * Number(limit);
  const where: any = {};
  if (verified !== undefined && verified !== '') where.isVerified = verified === 'true';
  if (country) where.country = String(country);
  if (isBot !== undefined && isBot !== '') where.isBot = isBot === 'true';
  if (status) where.user = { status: String(status) };
  if (search) where.OR = [
    { fullName: { contains: String(search), mode: 'insensitive' } },
    { user: { email: { contains: String(search), mode: 'insensitive' } } },
  ];

  const [developers, total] = await Promise.all([
    prisma.developer.findMany({
      where,
      include: { user: { select: { email: true, status: true, createdAt: true } } },
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.developer.count({ where }),
  ]);
  res.json({ developers, total, page: Number(page), limit: Number(limit) });
};

// ─── List all employers ───────────────────────────────────────────────────────

export const listAllEmployers = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = '1', limit = '20', verified, search, status, country } = req.body;
  const skip = (Number(page) - 1) * Number(limit);
  const where: any = {};
  if (verified !== undefined && verified !== '') where.isVerified = verified === 'true';
  if (country) where.country = String(country);
  if (status) where.user = { status: String(status) };
  if (search) where.OR = [
    { companyName: { contains: String(search), mode: 'insensitive' } },
    { user: { email: { contains: String(search), mode: 'insensitive' } } },
  ];

  const [employers, total] = await Promise.all([
    prisma.employer.findMany({
      where,
      include: { user: { select: { email: true, status: true, createdAt: true } } },
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.employer.count({ where }),
  ]);
  res.json({ employers, total, page: Number(page), limit: Number(limit) });
};

// ─── List all jobs (any status) ───────────────────────────────────────────────

export const listAllJobs = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = '1', limit = '20', status, search } = req.body;
  const skip = (Number(page) - 1) * Number(limit);
  const where: any = {};
  if (status) where.status = String(status);
  if (search) where.title = { contains: String(search), mode: 'insensitive' };

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      include: {
        employer: { select: { companyName: true, companyLogoUrl: true } },
        _count: { select: { applications: true } },
      },
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.job.count({ where }),
  ]);
  res.json({ jobs, total, page: Number(page), limit: Number(limit) });
};

// ─── Review / pin job ─────────────────────────────────────────────────────────

export const reviewJobOwner = async (req: AuthRequest, res: Response): Promise<void> => {
  const { status, isPinned, isEnabled } = req.body;
  const data: any = {};
  if (status) { data.status = status; if (status === 'APPROVED') data.publishedAt = new Date(); }
  if (isPinned !== undefined) data.isPinned = isPinned;
  if (isEnabled !== undefined) data.isEnabled = isEnabled;

  const job = await prisma.job.update({ where: { id: req.params.id }, data });
  res.json(job);
};

// ─── Verify developer / employer profile ──────────────────────────────────────

export const verifyDeveloper = async (req: AuthRequest, res: Response): Promise<void> => {
  const { developerId, approved } = req.body as { developerId: string; approved: boolean };
  const developer = await prisma.developer.update({
    where: { id: developerId },
    data: { isVerified: approved, verifiedAt: approved ? new Date() : null },
  });
  res.json(developer);
};

export const verifyEmployer = async (req: AuthRequest, res: Response): Promise<void> => {
  const { employerId, approved } = req.body as { employerId: string; approved: boolean };
  const employer = await prisma.employer.update({
    where: { id: employerId },
    data: { isVerified: approved, verifiedAt: approved ? new Date() : null },
  });
  res.json(employer);
};

// ─── Bulk delete developers ───────────────────────────────────────────────────

export const deleteDevelopers = async (req: AuthRequest, res: Response): Promise<void> => {
  const { developerIds } = req.body as { developerIds?: string[] };
  if (!Array.isArray(developerIds) || developerIds.length === 0) {
    res.status(400).json({ message: 'developerIds array is required' });
    return;
  }
  if (developerIds.length > 100) {
    res.status(400).json({ message: 'Maximum 100 developers per request' });
    return;
  }

  const developers = await prisma.developer.findMany({
    where: { id: { in: developerIds } },
    select: { userId: true, user: { select: { role: true } } },
  });

  const userIds = developers
    .filter((d) => d.user.role === 'DEVELOPER')
    .map((d) => d.userId);

  if (userIds.length === 0) {
    res.status(404).json({ message: 'No developers found to delete' });
    return;
  }

  const { count } = await prisma.user.deleteMany({
    where: { id: { in: userIds }, role: 'DEVELOPER' },
  });

  res.json({ deleted: count, message: `Removed ${count} developer${count === 1 ? '' : 's'}` });
};

// ─── Generate bot developers (owner testing) ─────────────────────────────────

function parseBotDevelopersBody(body: unknown):
  | { ok: true; input: Parameters<typeof createBotDevelopers>[0] }
  | { ok: false; message: string } {
  const {
    count = 1,
    countries,
    domains,
    photoMode = 'none',
    imageProviders,
    verifiedStatuses,
  } = (body ?? {}) as {
    count?: number;
    countries?: string[];
    domains?: BotDomainId[];
    photoMode?: PhotoMode;
    imageProviders?: string[];
    verifiedStatuses?: boolean[];
  };

  const parsedCount = Number(count);
  if (!Number.isFinite(parsedCount) || parsedCount < 1 || parsedCount > 50) {
    return { ok: false, message: 'count must be between 1 and 50' };
  }

  if (photoMode !== 'none' && photoMode !== 'online') {
    return { ok: false, message: 'photoMode must be "none" or "online"' };
  }

  if (photoMode === 'online' && imageProviders?.length) {
    const invalid = imageProviders.filter((p) => !isPortraitProviderId(p));
    if (invalid.length) {
      return { ok: false, message: `Unknown image provider(s): ${invalid.join(', ')}` };
    }
  }

  return {
    ok: true,
    input: {
      count: parsedCount,
      countries: Array.isArray(countries) ? countries.filter(Boolean) : undefined,
      domains: Array.isArray(domains) ? domains : undefined,
      photoMode,
      imageProviders:
        photoMode === 'online' && Array.isArray(imageProviders) && imageProviders.length
          ? normalizePortraitProviders(imageProviders)
          : undefined,
      verifiedStatuses: Array.isArray(verifiedStatuses) ? verifiedStatuses : undefined,
    },
  };
}

export const listPortraitProviders = async (_req: AuthRequest, res: Response): Promise<void> => {
  res.json({ providers: getPortraitProviderStatuses() });
};

export const generateHomeCarouselBotsStream = async (req: AuthRequest, res: Response): Promise<void> => {
  res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const write = (event: BotProgressEvent) => {
    res.write(`${JSON.stringify(event)}\n`);
  };

  try {
    const result = await createHomeCarouselBotDevelopers(write);
    res.write(`${JSON.stringify({
      type: 'batch_complete',
      created: result.created,
      errors: result.errors,
      message: `Created ${result.created} homepage developer(s)`,
      developers: result.developers,
    })}\n`);
    res.end();
  } catch (err) {
    console.error('[generateHomeCarouselBotsStream]', err);
    const msg = err instanceof Error ? err.message : 'Failed to create homepage developers';
    write({ type: 'batch_complete', created: 0, errors: [msg] });
    res.end();
  }
};

export const syncBotDeveloperPasswords = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const updated = await syncAllBotDeveloperPasswords();
    res.json({ updated, message: `Password synced for ${updated} bot developer account(s)` });
  } catch (err) {
    console.error('[syncBotDeveloperPasswords]', err);
    res.status(500).json({ message: 'Failed to sync bot developer passwords' });
  }
};

export const syncDeveloperLocations = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const updated = await syncAllDeveloperLocations();
    res.json({ updated, message: `Location updated for ${updated} developer profile(s)` });
  } catch (err) {
    console.error('[syncDeveloperLocations]', err);
    res.status(500).json({ message: 'Failed to sync developer locations' });
  }
};

export const generateBotDevelopers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = parseBotDevelopersBody(req.body);
    if (!parsed.ok) {
      res.status(400).json({ message: parsed.message });
      return;
    }

    const result = await createBotDevelopers(parsed.input, COUNTRY_NAMES);

    res.status(201).json({
      message: `Created ${result.created} bot developer${result.created === 1 ? '' : 's'}`,
      ...result,
    });
  } catch (err) {
    console.error('[generateBotDevelopers]', err);
    res.status(500).json({ message: 'Failed to generate bot developers' });
  }
};

export const generateBotDevelopersStream = async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = parseBotDevelopersBody(req.body);
  if (!parsed.ok) {
    res.status(400).json({ message: parsed.message });
    return;
  }

  res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const write = (event: BotProgressEvent) => {
    res.write(`${JSON.stringify(event)}\n`);
  };

  try {
    await createBotDevelopers(parsed.input, COUNTRY_NAMES, write);
    res.end();
  } catch (err) {
    console.error('[generateBotDevelopersStream]', err);
    const msg = err instanceof Error ? err.message : 'Failed to generate bot developers';
    write({ type: 'batch_complete', created: 0, errors: [msg] });
    res.end();
  }
};
