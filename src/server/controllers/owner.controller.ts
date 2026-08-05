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
import {
  createEmployerAccount,
  createEmployerAccountsBatch,
  OWNER_EMPLOYER_DEFAULT_PASSWORD,
  type CreateEmployerManualInput,
  type CreateEmployersBatchInput,
} from '../services/employer-creation.service';
import {
  createBotEmployers,
  syncAllBotEmployerPasswords,
  type EmployerBotProgressEvent,
} from '../services/employer-bot.service';

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
  try {
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
  } catch (err) {
    console.error('[listAllDevelopers]', err);
    res.status(500).json({ message: 'Failed to load developers. The database may be unavailable or out of sync.' });
  }
};

// ─── List all employers ───────────────────────────────────────────────────────

export const listAllEmployers = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = '1', limit = '20', verified, search, status, country, isBot } = req.body;
  const skip = (Number(page) - 1) * Number(limit);
  const where: any = {};
  if (verified !== undefined && verified !== '') where.isVerified = verified === 'true';
  if (isBot !== undefined && isBot !== '') where.isBot = isBot === 'true';
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

function parseCreateEmployerBody(body: unknown):
  | { ok: true; input: CreateEmployerManualInput }
  | { ok: false; message: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, message: 'Invalid request body' };
  }

  const b = body as Record<string, unknown>;
  const email = String(b.email ?? '').trim();
  const password = String(b.password ?? OWNER_EMPLOYER_DEFAULT_PASSWORD).trim();
  const companyName = String(b.companyName ?? '').trim();
  const contactName = String(b.contactName ?? '').trim();

  if (!email) return { ok: false, message: 'Email is required' };
  if (!companyName) return { ok: false, message: 'Company name is required' };
  if (!contactName) return { ok: false, message: 'Contact name is required' };
  if (password.length < 8) return { ok: false, message: 'Password must be at least 8 characters' };

  return {
    ok: true,
    input: {
      email,
      password,
      companyName,
      contactName,
      companyWebsite: b.companyWebsite ? String(b.companyWebsite) : undefined,
      companySummary: b.companySummary ? String(b.companySummary) : undefined,
      companySize: b.companySize ? String(b.companySize) : undefined,
      companyLocation: b.companyLocation ? String(b.companyLocation) : undefined,
      country: b.country ? String(b.country) : undefined,
      companyLinkedin: b.companyLinkedin ? String(b.companyLinkedin) : undefined,
      contactRole: b.contactRole ? String(b.contactRole) : undefined,
      contactInfo: b.contactInfo ? String(b.contactInfo) : undefined,
      isVerified: b.isVerified === true || b.isVerified === 'true',
      profileStep: b.profileStep ? Number(b.profileStep) : undefined,
    },
  };
}

function parseCreateEmployersBatchBody(body: unknown):
  | { ok: true; input: CreateEmployersBatchInput }
  | { ok: false; message: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, message: 'Invalid request body' };
  }

  const b = body as Record<string, unknown>;
  const count = Number(b.count);
  if (!Number.isFinite(count) || count < 1 || count > 20) {
    return { ok: false, message: 'count must be between 1 and 20' };
  }

  const password = String(b.password ?? OWNER_EMPLOYER_DEFAULT_PASSWORD).trim();
  if (password.length < 8) {
    return { ok: false, message: 'Password must be at least 8 characters' };
  }

  return {
    ok: true,
    input: {
      count,
      password,
      countries: Array.isArray(b.countries) ? b.countries.map(String).filter(Boolean) : undefined,
      isVerified: b.isVerified === true || b.isVerified === 'true',
    },
  };
}

export const createEmployer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = parseCreateEmployerBody(req.body);
    if (!parsed.ok) {
      res.status(400).json({ message: parsed.message });
      return;
    }

    const employer = await createEmployerAccount(parsed.input);
    res.status(201).json({
      message: `Created employer account for ${employer.companyName}`,
      employer,
    });
  } catch (err) {
    console.error('[createEmployer]', err);
    const msg = err instanceof Error ? err.message : 'Failed to create employer';
    res.status(500).json({ message: msg });
  }
};

export const createEmployersBatch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = parseCreateEmployersBatchBody(req.body);
    if (!parsed.ok) {
      res.status(400).json({ message: parsed.message });
      return;
    }

    const result = await createEmployerAccountsBatch(parsed.input, COUNTRY_NAMES);
    res.status(201).json({
      message: `Created ${result.created} employer account${result.created === 1 ? '' : 's'}`,
      ...result,
    });
  } catch (err) {
    console.error('[createEmployersBatch]', err);
    res.status(500).json({ message: 'Failed to create employer accounts' });
  }
};

function parseBotEmployersBody(body: unknown):
  | { ok: true; input: Parameters<typeof createBotEmployers>[0] }
  | { ok: false; message: string } {
  const {
    count = 1,
    countries,
    verifiedStatuses,
    password,
  } = (body ?? {}) as {
    count?: number;
    countries?: string[];
    verifiedStatuses?: (boolean | string)[];
    password?: string;
  };

  const parsedCount = Number(count);
  if (!Number.isFinite(parsedCount) || parsedCount < 1 || parsedCount > 50) {
    return { ok: false, message: 'count must be between 1 and 50' };
  }

  const sharedPassword = String(password ?? OWNER_EMPLOYER_DEFAULT_PASSWORD).trim();
  if (sharedPassword.length < 8) {
    return { ok: false, message: 'password must be at least 8 characters' };
  }

  let statuses: boolean[] | undefined;
  if (Array.isArray(verifiedStatuses) && verifiedStatuses.length) {
    statuses = verifiedStatuses.map((v) => v === true || v === 'true');
  }

  return {
    ok: true,
    input: {
      count: parsedCount,
      countries: Array.isArray(countries) ? countries.filter(Boolean) : undefined,
      verifiedStatuses: statuses,
      password: sharedPassword,
    },
  };
}

export const syncBotEmployerPasswords = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const updated = await syncAllBotEmployerPasswords();
    res.json({ updated, message: `Password synced for ${updated} bot employer account(s)` });
  } catch (err) {
    console.error('[syncBotEmployerPasswords]', err);
    res.status(500).json({ message: 'Failed to sync bot employer passwords' });
  }
};

export const generateBotEmployersStream = async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = parseBotEmployersBody(req.body);
  if (!parsed.ok) {
    res.status(400).json({ message: parsed.message });
    return;
  }

  res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const write = (event: EmployerBotProgressEvent) => {
    res.write(`${JSON.stringify(event)}\n`);
  };

  try {
    await createBotEmployers(parsed.input, COUNTRY_NAMES, write);
    res.end();
  } catch (err) {
    console.error('[generateBotEmployersStream]', err);
    const msg = err instanceof Error ? err.message : 'Failed to generate bot employers';
    write({ type: 'batch_complete', created: 0, errors: [msg] });
    res.end();
  }
};
