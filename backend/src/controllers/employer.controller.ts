import { Response } from 'express';
import { prisma } from '../config/database';
import { uploadImage, uploadVideo, uploadFile } from '../services/upload.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getMyProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const employer = await prisma.employer.findUnique({
    where: { userId: req.user!.userId },
    include: { user: { select: { email: true, status: true, createdAt: true } } },
  });
  if (!employer) { res.status(404).json({ message: 'Profile not found' }); return; }
  res.json(employer);
};

export const updateProfileStep2 = async (req: AuthRequest, res: Response): Promise<void> => {
  const {
    companyName, companyWebsite, companySummary, companySize,
    companyLocation, country, companyLinkedin, contactName, contactRole, contactInfo,
  } = req.body;

  const employer = await prisma.employer.update({
    where: { userId: req.user!.userId },
    data: {
      companyName, companyWebsite, companySummary, companySize,
      companyLocation, country, companyLinkedin, contactName, contactRole, contactInfo,
      profileStep: 2,
    },
  });
  res.json(employer);
};

export const updateProfileStep3 = async (req: AuthRequest, res: Response): Promise<void> => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const { introVideoType, introVideoLink } = req.body;
  const updates: Record<string, unknown> = { profileStep: 3, introVideoType };

  if (files?.companyLogo?.[0]) {
    updates.companyLogoUrl = await uploadImage(
      files.companyLogo[0].buffer, files.companyLogo[0].originalname, 'felovy/company-logos'
    );
  }
  if (files?.companyBrand?.[0]) {
    updates.companyBrandUrl = await uploadImage(
      files.companyBrand[0].buffer, files.companyBrand[0].originalname, 'felovy/company-brands'
    );
  }
  if (files?.companyAdImages) {
    updates.companyAdImages = await Promise.all(
      files.companyAdImages.map(f => uploadImage(f.buffer, f.originalname, 'felovy/company-ads'))
    );
  }
  if (files?.contactPhoto?.[0]) {
    updates.contactPhotoUrl = await uploadImage(
      files.contactPhoto[0].buffer, files.contactPhoto[0].originalname, 'felovy/contacts'
    );
  }
  if (introVideoType === 'upload' && files?.introVideo?.[0]) {
    updates.introVideoUrl = await uploadVideo(files.introVideo[0].buffer, 'felovy/company-intros');
  } else if (introVideoType === 'link' && introVideoLink) {
    updates.introVideoUrl = introVideoLink;
  }

  const employer = await prisma.employer.update({
    where: { userId: req.user!.userId },
    data: updates as any,
  });
  res.json(employer);
};

export const updateProfileStep4 = async (req: AuthRequest, res: Response): Promise<void> => {
  const file = req.file;
  if (!file) { res.status(400).json({ message: 'ID card file required' }); return; }
  const idCardUrl = await uploadFile(file.buffer, file.originalname, 'felovy/id-cards');
  const employer = await prisma.employer.update({
    where: { userId: req.user!.userId },
    data: { idCardUrl, profileStep: 4 },
  });
  res.json(employer);
};

export const getEmployerProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const employer = await prisma.employer.findUnique({ where: { id } });
  if (!employer) { res.status(404).json({ message: 'Employer not found' }); return; }
  if (req.user?.role === 'OWNER') {
    res.json(employer);
  } else {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { idCardUrl, ...publicProfile } = employer;
    res.json(publicProfile);
  }
};
