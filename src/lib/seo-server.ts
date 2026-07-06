import { prisma } from '@/server/config/database';

export async function getApprovedJobIds(limit = 5000) {
  try {
    return await prisma.job.findMany({
      where: { status: 'APPROVED', isEnabled: true },
      select: { id: true, updatedAt: true, publishedAt: true },
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });
  } catch {
    return [];
  }
}

export async function getPublicDeveloperIds(limit = 5000) {
  try {
    return await prisma.developer.findMany({
      where: {
        isVerified: true,
        fullName: { not: null },
      },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
  } catch {
    return [];
  }
}

export async function getJobSeo(id: string) {
  try {
    return await prisma.job.findFirst({
      where: { id, status: 'APPROVED', isEnabled: true },
      select: {
        id: true,
        title: true,
        description: true,
        companyLocation: true,
        locationType: true,
        salaryMin: true,
        salaryMax: true,
        salaryType: true,
        currency: true,
        requiredSkills: true,
        industry: true,
        publishedAt: true,
        updatedAt: true,
        employer: {
          select: { companyName: true, companyLocation: true },
        },
      },
    });
  } catch {
    return null;
  }
}

export async function getDeveloperSeo(id: string) {
  try {
    return await prisma.developer.findFirst({
      where: { id, fullName: { not: null } },
      select: {
        id: true,
        fullName: true,
        title: true,
        summary: true,
        location: true,
        country: true,
        skills: true,
        isVerified: true,
        photoUrl: true,
        updatedAt: true,
      },
    });
  } catch {
    return null;
  }
}
