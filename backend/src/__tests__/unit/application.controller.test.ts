const prismaMock = {
  developer: { findUnique: jest.fn() },
  employer: { findUnique: jest.fn() },
  job: { findUnique: jest.fn() },
  application: {
    findUnique: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
};

jest.mock('../../config/database', () => ({ prisma: prismaMock }));

import {
  applyToJob,
  getMyApplications,
  getJobApplications,
  updateApplicationStatus,
} from '../../controllers/application.controller';

function mockRes(): any {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function req(body: any = {}, params: any = {}, user?: any): any {
  return { body, params, query: {}, user };
}

const devUser = { userId: 'user-dev', role: 'DEVELOPER', email: 'dev@test.com' };
const empUser = { userId: 'user-emp', role: 'EMPLOYER', email: 'emp@corp.com' };

// ─── applyToJob ───────────────────────────────────────────────────────────────

describe('applyToJob', () => {
  it('returns 404 when developer profile not found', async () => {
    prismaMock.developer.findUnique.mockResolvedValue(null);
    const res = mockRes();
    await applyToJob(req({}, { jobId: 'j1' }, devUser), res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Developer profile not found' });
  });

  it('returns 403 when developer is not verified', async () => {
    prismaMock.developer.findUnique.mockResolvedValue({ id: 'd1', isVerified: false });
    const res = mockRes();
    await applyToJob(req({}, { jobId: 'j1' }, devUser), res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Profile must be verified to apply' });
  });

  it('returns 404 when job is not found or not approved', async () => {
    prismaMock.developer.findUnique.mockResolvedValue({ id: 'd1', isVerified: true });
    prismaMock.job.findUnique.mockResolvedValue(null);
    const res = mockRes();
    await applyToJob(req({}, { jobId: 'nonexistent' }, devUser), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 404 when job status is PENDING', async () => {
    prismaMock.developer.findUnique.mockResolvedValue({ id: 'd1', isVerified: true });
    prismaMock.job.findUnique.mockResolvedValue({ id: 'j1', status: 'PENDING' });
    const res = mockRes();
    await applyToJob(req({}, { jobId: 'j1' }, devUser), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 409 when developer already applied', async () => {
    prismaMock.developer.findUnique.mockResolvedValue({ id: 'd1', isVerified: true });
    prismaMock.job.findUnique.mockResolvedValue({ id: 'j1', status: 'APPROVED' });
    prismaMock.application.findUnique.mockResolvedValue({ id: 'app1' });
    const res = mockRes();
    await applyToJob(req({}, { jobId: 'j1' }, devUser), res);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ message: 'Already applied to this job' });
  });

  it('creates application on success', async () => {
    const dev = { id: 'd1', isVerified: true, fullName: 'Dev Name', skills: ['React'] };
    prismaMock.developer.findUnique.mockResolvedValue(dev);
    prismaMock.job.findUnique.mockResolvedValue({ id: 'j1', status: 'APPROVED' });
    prismaMock.application.findUnique.mockResolvedValue(null);
    const created = { id: 'app1', jobId: 'j1', developerId: 'd1' };
    prismaMock.application.create.mockResolvedValue(created);
    const res = mockRes();
    await applyToJob(req({ coverLetter: 'My letter' }, { jobId: 'j1' }, devUser), res);
    expect(prismaMock.application.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ jobId: 'j1', developerId: 'd1' }) })
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(created);
  });
});

// ─── getMyApplications ────────────────────────────────────────────────────────

describe('getMyApplications', () => {
  it('returns 404 when developer not found', async () => {
    prismaMock.developer.findUnique.mockResolvedValue(null);
    const res = mockRes();
    await getMyApplications(req({}, {}, devUser), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns applications list', async () => {
    prismaMock.developer.findUnique.mockResolvedValue({ id: 'd1' });
    const apps = [{ id: 'app1', status: 'PENDING' }];
    prismaMock.application.findMany.mockResolvedValue(apps);
    const res = mockRes();
    await getMyApplications(req({}, {}, devUser), res);
    expect(res.json).toHaveBeenCalledWith(apps);
  });
});

// ─── getJobApplications ───────────────────────────────────────────────────────

describe('getJobApplications', () => {
  it('returns 403 when employer does not own the job', async () => {
    prismaMock.employer.findUnique.mockResolvedValue({ id: 'e1' });
    prismaMock.job.findUnique.mockResolvedValue({ id: 'j1', employerId: 'e-other' });
    const res = mockRes();
    await getJobApplications(req({}, { jobId: 'j1' }, empUser), res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('returns applications for owned job', async () => {
    prismaMock.employer.findUnique.mockResolvedValue({ id: 'e1' });
    prismaMock.job.findUnique.mockResolvedValue({ id: 'j1', employerId: 'e1' });
    const apps = [{ id: 'app1' }];
    prismaMock.application.findMany.mockResolvedValue(apps);
    const res = mockRes();
    await getJobApplications(req({}, { jobId: 'j1' }, empUser), res);
    expect(res.json).toHaveBeenCalledWith(apps);
  });
});

// ─── updateApplicationStatus ─────────────────────────────────────────────────

describe('updateApplicationStatus', () => {
  it('returns 403 when employer does not own the application', async () => {
    prismaMock.employer.findUnique.mockResolvedValue({ id: 'e1' });
    prismaMock.application.findUnique.mockResolvedValue({
      id: 'app1', job: { employerId: 'e-other' },
    });
    const res = mockRes();
    await updateApplicationStatus(req({ status: 'ACCEPTED' }, { id: 'app1' }, empUser), res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('returns 403 when application not found', async () => {
    prismaMock.employer.findUnique.mockResolvedValue({ id: 'e1' });
    prismaMock.application.findUnique.mockResolvedValue(null);
    const res = mockRes();
    await updateApplicationStatus(req({ status: 'ACCEPTED' }, { id: 'nope' }, empUser), res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('updates application status', async () => {
    prismaMock.employer.findUnique.mockResolvedValue({ id: 'e1' });
    prismaMock.application.findUnique.mockResolvedValue({
      id: 'app1', job: { employerId: 'e1' },
    });
    const updated = { id: 'app1', status: 'SHORTLISTED' };
    prismaMock.application.update.mockResolvedValue(updated);
    const res = mockRes();
    await updateApplicationStatus(req({ status: 'SHORTLISTED' }, { id: 'app1' }, empUser), res);
    expect(prismaMock.application.update).toHaveBeenCalledWith({
      where: { id: 'app1' }, data: { status: 'SHORTLISTED' },
    });
    expect(res.json).toHaveBeenCalledWith(updated);
  });
});
