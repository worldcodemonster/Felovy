import { Response } from 'express';
import { prisma } from '../config/database';
import { uploadImage, uploadVideo, uploadFile } from '../services/upload.service';
import { AuthRequest } from '../middlewares/auth.middleware';

function stripBotField<T extends { isBot?: boolean }>(dev: T, role?: string): T | Omit<T, 'isBot'> {
  if (role === 'OWNER') return dev;
  const { isBot: _bot, ...rest } = dev;
  return rest;
}

// ─── Get own profile ──────────────────────────────────────────────────────────

export const getMyProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const developer = await prisma.developer.findUnique({
    where: { userId: req.user!.userId },
    include: { user: { select: { email: true, status: true, createdAt: true } } },
  });
  if (!developer) { res.status(404).json({ message: 'Profile not found' }); return; }
  res.json(developer);
};

// ─── Step 2: Update detailed info ────────────────────────────────────────────

export const updateProfileStep2 = async (req: AuthRequest, res: Response): Promise<void> => {
  const {
    fullName, title, phone, location, country, gender, birthYear, linkedin, github,
    summary, skills, workExperience, education, languages,
  } = req.body;

  const parsedBirthYear = birthYear != null && birthYear !== ''
    ? Number(birthYear)
    : undefined;

  const developer = await prisma.developer.update({
    where: { userId: req.user!.userId },
    data: {
      fullName, title, phone, location, country, gender: gender || null, linkedin, github,
      birthYear: parsedBirthYear && parsedBirthYear > 1940 ? parsedBirthYear : null,
      summary,
      skills: Array.isArray(skills) ? skills : JSON.parse(skills || '[]'),
      workExperience: workExperience
        ? (typeof workExperience === 'string' ? JSON.parse(workExperience) : workExperience)
        : undefined,
      education: education
        ? (typeof education === 'string' ? JSON.parse(education) : education)
        : undefined,
      languages: languages
        ? (typeof languages === 'string' ? JSON.parse(languages) : languages)
        : [],
      profileStep: 2,
    },
  });
  res.json(developer);
};

// ─── Step 3: Upload photo & intro video ───────────────────────────────────────

export const updateProfileStep3 = async (req: AuthRequest, res: Response): Promise<void> => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const { introVideoType, introVideoLink } = req.body;
  const updates: Record<string, unknown> = { profileStep: 3, introVideoType };

  if (files?.photo?.[0]) {
    updates.photoUrl = await uploadImage(files.photo[0].buffer, files.photo[0].originalname, 'felovy/profiles');
  }

  if (introVideoType === 'upload' && files?.introVideo?.[0]) {
    updates.introVideoUrl = await uploadVideo(files.introVideo[0].buffer, 'felovy/intros');
  } else if (introVideoType === 'link' && introVideoLink) {
    updates.introVideoUrl = introVideoLink;
  }

  const developer = await prisma.developer.update({
    where: { userId: req.user!.userId },
    data: updates as any,
  });
  res.json(developer);
};

// ─── Step 4: Upload ID card ───────────────────────────────────────────────────

export const updateProfileStep4 = async (req: AuthRequest, res: Response): Promise<void> => {
  const file = req.file;
  if (!file) { res.status(400).json({ message: 'ID card file required' }); return; }

  const idCardUrl = await uploadFile(file.buffer, file.originalname, 'felovy/id-cards');
  const developer = await prisma.developer.update({
    where: { userId: req.user!.userId },
    data: { idCardUrl, profileStep: 4 },
  });
  res.json(developer);
};

// ─── Get public developer profile (for employers/admins) ─────────────────────

export const getDeveloperProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const developer = await prisma.developer.findUnique({
    where: { id },
    include: { user: { select: { email: true } } },
  });
  if (!developer) { res.status(404).json({ message: 'Developer not found' }); return; }
  res.json(stripBotField(developer, req.user?.role));
};

// ─── Public: map data for landing page (developers + employers + jobs) ────────

export const getMapData = async (_req: AuthRequest, res: Response): Promise<void> => {
  const toCounts = (items: (string | null | undefined)[]) => {
    const counts: Record<string, number> = {};
    for (const c of items) {
      if (c) counts[c] = (counts[c] || 0) + 1;
    }
    return Object.entries(counts).map(([country, count]) => ({ country, count }));
  };

  const [devs, emps, jobs] = await Promise.all([
    prisma.developer.findMany({
      where: { country: { not: null } },
      select: { country: true },
    }),
    prisma.employer.findMany({
      where: { country: { not: null } },
      select: { country: true },
    }),
    prisma.job.findMany({
      where: { status: { notIn: ['REJECTED', 'DISABLED'] } },
      select: { employer: { select: { country: true } } },
    }),
  ]);

  res.json({
    developers: toCounts(devs.map(d => d.country)),
    employers:  toCounts(emps.map(e => e.country)),
    jobs:       toCounts(jobs.map(j => j.employer?.country)),
  });
};

// ─── Search developers (employer/owner — for DM) ─────────────────────────────

export const searchDevelopers = async (req: AuthRequest, res: Response): Promise<void> => {
  const { q } = req.body;
  const where: any = { isVerified: true };
  if (q && String(q).trim().length >= 2) {
    where.OR = [
      { fullName: { contains: String(q), mode: 'insensitive' } },
      { title:    { contains: String(q), mode: 'insensitive' } },
    ];
  }
  const developers = await prisma.developer.findMany({
    where,
    select: { id: true, fullName: true, title: true, photoUrl: true, location: true },
    take: 10,
    orderBy: { fullName: 'asc' },
  });
  res.json(developers);
};

// ─── List developers (admin + employer view) ──────────────────────────────────

export const listDevelopers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '20', verified, search, country } = req.body;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    if (verified !== undefined) {
      where.isVerified = verified === 'true';
    }

    if (search && String(search).trim()) {
      where.OR = [
        { fullName: { contains: String(search), mode: 'insensitive' } },
        { title:    { contains: String(search), mode: 'insensitive' } },
      ];
    }

    if (country) where.country = { contains: String(country), mode: 'insensitive' };

    const [developers, total] = await Promise.all([
      prisma.developer.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.developer.count({ where }),
    ]);

    res.json({
      developers: developers.map((d) => stripBotField(d, req.user?.role)),
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (err) {
    console.error('[listDevelopers]', err);
    res.status(500).json({ message: 'Failed to fetch developers' });
  }
};
