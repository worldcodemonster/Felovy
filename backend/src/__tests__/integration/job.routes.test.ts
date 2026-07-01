import request from 'supertest';
import { signAccessToken } from '../../utils/jwt.util';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const prismaMock = {
  employer: { findUnique: jest.fn() },
  job: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  favoriteJob: { findUnique: jest.fn(), create: jest.fn(), delete: jest.fn() },
};

jest.mock('../../config/database', () => ({ prisma: prismaMock }));
jest.mock('../../services/email.service', () => ({ sendOtpEmail: jest.fn() }));
jest.mock('../../services/upload.service', () => ({
  uploadImage: jest.fn().mockResolvedValue('https://cdn.example.com/logo.png'),
}));

import app from '../../index';

const empToken = () => `Bearer ${signAccessToken({ userId: 'emp-1', role: 'EMPLOYER', email: 'emp@corp.com' })}`;
const devToken = () => `Bearer ${signAccessToken({ userId: 'dev-1', role: 'DEVELOPER', email: 'dev@test.com' })}`;
const ownerToken = () => `Bearer ${signAccessToken({ userId: 'owner-1', role: 'OWNER', email: 'owner@felovy.com' })}`;

const sampleJob = {
  id: 'j1',
  title: 'Backend Dev',
  locationType: 'REMOTE',
  status: 'APPROVED',
  isEnabled: true,
  isPinned: false,
  requiredSkills: ['Node.js'],
  niceToHaveSkills: [],
  languages: ['English'],
  createdAt: new Date().toISOString(),
  publishedAt: new Date().toISOString(),
  employer: { companyName: 'Acme', companyLogoUrl: null, companyLocation: 'US' },
  favorites: [],
  _count: { applications: 3 },
};

// ─── GET /api/jobs (public) ───────────────────────────────────────────────────

describe('GET /api/jobs', () => {
  it('returns jobs list without auth', async () => {
    prismaMock.job.findMany.mockResolvedValue([sampleJob]);
    prismaMock.job.count.mockResolvedValue(1);
    const res = await request(app).get('/api/jobs');
    expect(res.status).toBe(200);
    expect(res.body.jobs).toHaveLength(1);
    expect(res.body.total).toBe(1);
  });

  it('supports search query param', async () => {
    prismaMock.job.findMany.mockResolvedValue([]);
    prismaMock.job.count.mockResolvedValue(0);
    await request(app).get('/api/jobs?search=react');
    expect(prismaMock.job.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ title: expect.objectContaining({ contains: 'react' }) }),
      })
    );
  });
});

// ─── GET /api/jobs/:id (public) ───────────────────────────────────────────────

describe('GET /api/jobs/:id', () => {
  it('returns job details', async () => {
    prismaMock.job.findUnique.mockResolvedValue(sampleJob);
    const res = await request(app).get('/api/jobs/j1');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('j1');
  });

  it('returns 404 when job not found', async () => {
    prismaMock.job.findUnique.mockResolvedValue(null);
    const res = await request(app).get('/api/jobs/nonexistent');
    expect(res.status).toBe(404);
  });
});

// ─── POST /api/jobs (employer only) ──────────────────────────────────────────

describe('POST /api/jobs', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).post('/api/jobs').send({ title: 'Dev' });
    expect(res.status).toBe(401);
  });

  it('returns 403 for developer role', async () => {
    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', devToken())
      .send({ title: 'Dev' });
    expect(res.status).toBe(403);
  });

  it('returns 404 when employer profile not found', async () => {
    prismaMock.employer.findUnique.mockResolvedValue(null);
    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', empToken())
      .send({ title: 'Dev', locationType: 'REMOTE' });
    expect(res.status).toBe(404);
  });

  it('returns 403 when employer is not verified', async () => {
    prismaMock.employer.findUnique.mockResolvedValue({ id: 'e1', isVerified: false });
    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', empToken())
      .send({ title: 'Dev', locationType: 'REMOTE' });
    expect(res.status).toBe(403);
  });

  it('creates job for verified employer', async () => {
    prismaMock.employer.findUnique.mockResolvedValue({ id: 'e1', isVerified: true });
    prismaMock.job.create.mockResolvedValue({ id: 'j2', title: 'Dev', status: 'PENDING' });
    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', empToken())
      .send({
        title: 'Dev',
        locationType: 'REMOTE',
        requiredSkills: '["React"]',
        niceToHaveSkills: '[]',
        languages: '["English"]',
      });
    expect(res.status).toBe(201);
    expect(res.body.id).toBe('j2');
  });
});

// ─── DELETE /api/jobs/:id ─────────────────────────────────────────────────────

describe('DELETE /api/jobs/:id', () => {
  it('returns 403 when employer does not own the job', async () => {
    prismaMock.employer.findUnique.mockResolvedValue({ id: 'e1' });
    prismaMock.job.findUnique.mockResolvedValue({ id: 'j1', employerId: 'e-other' });
    const res = await request(app)
      .delete('/api/jobs/j1')
      .set('Authorization', empToken());
    expect(res.status).toBe(403);
  });
});

// ─── PATCH /api/jobs/:id/review (owner) ──────────────────────────────────────

describe('PATCH /api/jobs/:id/review', () => {
  it('returns 403 for employer role', async () => {
    const res = await request(app)
      .patch('/api/jobs/j1/review')
      .set('Authorization', empToken())
      .send({ status: 'APPROVED' });
    expect(res.status).toBe(403);
  });

  it('approves job as owner', async () => {
    prismaMock.job.update.mockResolvedValue({ id: 'j1', status: 'APPROVED' });
    const res = await request(app)
      .patch('/api/jobs/j1/review')
      .set('Authorization', ownerToken())
      .send({ status: 'APPROVED' });
    expect(res.status).toBe(200);
  });
});

// ─── POST /api/jobs/:id/favorite ─────────────────────────────────────────────

describe('POST /api/jobs/:id/favorite', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app).post('/api/jobs/j1/favorite');
    expect(res.status).toBe(401);
  });

  it('adds job to favorites when not already favorited', async () => {
    prismaMock.favoriteJob.findUnique.mockResolvedValue(null);
    prismaMock.favoriteJob.create.mockResolvedValue({ id: 'fav1' });
    const res = await request(app)
      .post('/api/jobs/j1/favorite')
      .set('Authorization', devToken());
    expect(res.status).toBe(200);
  });

  it('removes job from favorites when already favorited', async () => {
    prismaMock.favoriteJob.findUnique.mockResolvedValue({ id: 'fav1' });
    prismaMock.favoriteJob.delete.mockResolvedValue({});
    const res = await request(app)
      .post('/api/jobs/j1/favorite')
      .set('Authorization', devToken());
    expect(res.status).toBe(200);
  });
});
