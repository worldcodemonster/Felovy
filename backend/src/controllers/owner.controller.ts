import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';

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
  const { page = '1', limit = '20', verified, search, status, country } = req.body;
  const skip = (Number(page) - 1) * Number(limit);
  const where: any = {};
  if (verified !== undefined && verified !== '') where.isVerified = verified === 'true';
  if (country) where.country = String(country);
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
