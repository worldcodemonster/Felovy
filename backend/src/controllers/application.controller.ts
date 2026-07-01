import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';

// ─── Apply to a job ───────────────────────────────────────────────────────────

export const applyToJob = async (req: AuthRequest, res: Response): Promise<void> => {
  const developer = await prisma.developer.findUnique({ where: { userId: req.user!.userId } });
  if (!developer) { res.status(404).json({ message: 'Developer profile not found' }); return; }
  if (!developer.isVerified) { res.status(403).json({ message: 'Profile must be verified to apply' }); return; }

  const job = await prisma.job.findUnique({ where: { id: req.params.jobId } });
  if (!job || job.status !== 'APPROVED') { res.status(404).json({ message: 'Job not found or not active' }); return; }

  const existing = await prisma.application.findUnique({
    where: { jobId_developerId: { jobId: job.id, developerId: developer.id } },
  });
  if (existing) { res.status(409).json({ message: 'Already applied to this job' }); return; }

  const { coverLetter } = req.body;

  // Snapshot the developer profile at time of application
  const appliedData = {
    fullName: developer.fullName,
    title: developer.title,
    location: developer.location,
    skills: developer.skills,
    summary: developer.summary,
    linkedin: developer.linkedin,
    github: developer.github,
    workExperience: developer.workExperience,
    education: developer.education,
    languages: developer.languages,
    photoUrl: developer.photoUrl,
  };

  const application = await prisma.application.create({
    data: { jobId: job.id, developerId: developer.id, coverLetter, appliedData },
  });
  res.status(201).json(application);
};

// ─── Get my applications (developer) ─────────────────────────────────────────

export const getMyApplications = async (req: AuthRequest, res: Response): Promise<void> => {
  const developer = await prisma.developer.findUnique({ where: { userId: req.user!.userId } });
  if (!developer) { res.status(404).json({ message: 'Developer not found' }); return; }

  const applications = await prisma.application.findMany({
    where: { developerId: developer.id },
    include: {
      job: {
        select: { title: true, locationType: true, salaryMin: true, salaryMax: true, currency: true,
          employer: { select: { companyName: true, companyLogoUrl: true } } },
      },
      conversation: { select: { id: true, isBlocked: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(applications);
};

// ─── Get applications for a job (employer) ────────────────────────────────────

export const getJobApplications = async (req: AuthRequest, res: Response): Promise<void> => {
  const employer = await prisma.employer.findUnique({ where: { userId: req.user!.userId } });
  const job = await prisma.job.findUnique({ where: { id: req.params.jobId } });
  if (!job || job.employerId !== employer?.id) { res.status(403).json({ message: 'Forbidden' }); return; }

  const applications = await prisma.application.findMany({
    where: { jobId: job.id },
    include: {
      developer: {
        select: {
          id: true, fullName: true, title: true, photoUrl: true, skills: true,
          location: true, isVerified: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(applications);
};

// ─── Update application status (employer) ────────────────────────────────────

export const updateApplicationStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const employer = await prisma.employer.findUnique({ where: { userId: req.user!.userId } });
  const application = await prisma.application.findUnique({
    where: { id: req.params.id },
    include: { job: true },
  });
  if (!application || application.job.employerId !== employer?.id) {
    res.status(403).json({ message: 'Forbidden' }); return;
  }

  const { status } = req.body;
  const updated = await prisma.application.update({ where: { id: application.id }, data: { status } });
  res.json(updated);
};
