import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { uploadImage } from '../services/upload.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { JobStatus, LocationType, SalaryType } from '@prisma/client';

// ─── Create job (employer) ────────────────────────────────────────────────────

export const createJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const employer = await prisma.employer.findUnique({ where: { userId: req.user!.userId } });
    if (!employer) { res.status(404).json({ message: 'Employer profile not found' }); return; }
    if (!employer.isVerified) { res.status(403).json({ message: 'Profile not verified yet' }); return; }

    const {
      title, companyLocation, locationType, salaryMin, salaryMax, salaryType, currency,
      requiredSkills, niceToHaveSkills, languages, industry, description,
    } = req.body;

    const file = req.file;
    let logoUrl: string | undefined;
    if (file) logoUrl = await uploadImage(file.buffer, file.originalname, 'felovy/job-logos');

    const job = await prisma.job.create({
      data: {
        employerId: employer.id,
        title,
        logoUrl,
        companyLocation,
        locationType: locationType as LocationType,
        salaryMin: salaryMin ? Number(salaryMin) : undefined,
        salaryMax: salaryMax ? Number(salaryMax) : undefined,
        salaryType: salaryType as SalaryType | undefined,
        currency,
        requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : JSON.parse(requiredSkills || '[]'),
        niceToHaveSkills: Array.isArray(niceToHaveSkills) ? niceToHaveSkills : JSON.parse(niceToHaveSkills || '[]'),
        languages: Array.isArray(languages) ? languages : JSON.parse(languages || '[]'),
        industry,
        description,
      },
    });
    res.status(201).json(job);
  } catch (err) {
    console.error('[createJob]', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── Get jobs (job board) ─────────────────────────────────────────────────────

export const listJobs = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = '1', limit = '20',
      search, locationType, salaryType, industry,
      skills, sortBy = 'latest', order = 'desc',
      favoriteOnly, userId,
    } = req.body;

    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { status: 'APPROVED', isEnabled: true };

    if (search) where.title = { contains: String(search), mode: 'insensitive' };
    if (locationType) where.locationType = String(locationType);
    if (salaryType) where.salaryType = String(salaryType);
    if (industry) where.industry = { contains: String(industry), mode: 'insensitive' };
    if (skills) {
      const skillArr = String(skills).split(',');
      where.requiredSkills = { hasSome: skillArr };
    }
    if (favoriteOnly === 'true' && userId) {
      where.favorites = { some: { userId: String(userId) } };
    }

    const orderBy: any[] = [{ isPinned: 'desc' }];
    if (sortBy === 'latest') orderBy.push({ publishedAt: order });
    else if (sortBy === 'salary') orderBy.push({ salaryMax: order });

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          employer: { select: { companyName: true, companyLogoUrl: true, companyLocation: true } },
          favorites: userId ? { where: { userId: String(userId) } } : false,
          _count: { select: { applications: true } },
        },
        orderBy,
        skip,
        take: Number(limit),
      }),
      prisma.job.count({ where }),
    ]);

    res.json({ jobs, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('[listJobs]', err);
    res.status(500).json({ message: 'Could not load jobs — database may be unavailable', jobs: [], total: 0 });
  }
};

// ─── Get single job ───────────────────────────────────────────────────────────

export const getJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.body;
    const job = await prisma.job.findUnique({
      where: { id: req.params.id },
      include: {
        employer: {
          select: {
            companyName: true, companyLogoUrl: true, companyBrandUrl: true,
            companyLocation: true, companySummary: true, companyWebsite: true,
            companyLinkedin: true, companySize: true,
          },
        },
        favorites: userId ? { where: { userId: String(userId) } } : false,
        _count: { select: { applications: true } },
      },
    });
    if (!job) { res.status(404).json({ message: 'Job not found' }); return; }
    res.json(job);
  } catch (err) {
    console.error('[getJob]', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── Update job (employer) ────────────────────────────────────────────────────

export const updateJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const employer = await prisma.employer.findUnique({ where: { userId: req.user!.userId } });
    const job = await prisma.job.findUnique({ where: { id: req.params.id } });
    if (!job || job.employerId !== employer?.id) { res.status(403).json({ message: 'Forbidden' }); return; }

    const { title, companyLocation, locationType, salaryMin, salaryMax, salaryType,
      currency, requiredSkills, niceToHaveSkills, languages, industry, description, isEnabled } = req.body;

    const updated = await prisma.job.update({
      where: { id: job.id },
      data: {
        title, companyLocation,
        locationType: locationType as LocationType | undefined,
        salaryMin: salaryMin ? Number(salaryMin) : undefined,
        salaryMax: salaryMax ? Number(salaryMax) : undefined,
        salaryType: salaryType as SalaryType | undefined,
        currency,
        requiredSkills: requiredSkills ? JSON.parse(requiredSkills) : undefined,
        niceToHaveSkills: niceToHaveSkills ? JSON.parse(niceToHaveSkills) : undefined,
        languages: languages ? JSON.parse(languages) : undefined,
        industry, description,
        isEnabled: isEnabled !== undefined ? isEnabled === 'true' : undefined,
        status: job.status === 'APPROVED' ? 'PENDING' : undefined,
      },
    });
    res.json(updated);
  } catch (err) {
    console.error('[updateJob]', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── Delete job (employer) ────────────────────────────────────────────────────

export const deleteJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const employer = await prisma.employer.findUnique({ where: { userId: req.user!.userId } });
    const job = await prisma.job.findUnique({ where: { id: req.params.id } });
    if (!job || job.employerId !== employer?.id) { res.status(403).json({ message: 'Forbidden' }); return; }
    await prisma.job.delete({ where: { id: job.id } });
    res.json({ message: 'Job deleted' });
  } catch (err) {
    console.error('[deleteJob]', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── Admin: approve / reject / pin job ───────────────────────────────────────

export const reviewJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, isPinned } = req.body as { status?: JobStatus; isPinned?: boolean };
    const data: any = {};
    if (status) { data.status = status; if (status === 'APPROVED') data.publishedAt = new Date(); }
    if (isPinned !== undefined) data.isPinned = isPinned;

    const job = await prisma.job.update({ where: { id: req.params.id }, data });
    res.json(job);
  } catch (err) {
    console.error('[reviewJob]', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── Favorite / unfavorite job ────────────────────────────────────────────────

export const toggleFavorite = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const jobId = req.params.id;

    const existing = await prisma.favoriteJob.findUnique({ where: { userId_jobId: { userId, jobId } } });
    if (existing) {
      await prisma.favoriteJob.delete({ where: { id: existing.id } });
      res.json({ favorited: false });
    } else {
      await prisma.favoriteJob.create({ data: { userId, jobId } });
      res.json({ favorited: true });
    }
  } catch (err) {
    console.error('[toggleFavorite]', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── Employer: list own jobs ──────────────────────────────────────────────────

export const listMyJobs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const employer = await prisma.employer.findUnique({ where: { userId: req.user!.userId } });
    if (!employer) { res.status(404).json({ message: 'Employer not found' }); return; }

    const jobs = await prisma.job.findMany({
      where: { employerId: employer.id },
      include: { _count: { select: { applications: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(jobs);
  } catch (err) {
    console.error('[listMyJobs]', err);
    res.status(500).json({ message: 'Server error' });
  }
};
