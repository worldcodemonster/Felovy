import request from 'supertest';
import { signAccessToken } from '../../utils/jwt.util';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const prismaMock = {
  developer: { count: jest.fn(), update: jest.fn(), findMany: jest.fn() },
  employer: { count: jest.fn(), update: jest.fn(), findMany: jest.fn() },
  job: { count: jest.fn(), update: jest.fn(), findMany: jest.fn() },
  user: { count: jest.fn(), findUnique: jest.fn(), update: jest.fn(), findMany: jest.fn() },
};

jest.mock('../../config/database', () => ({ prisma: prismaMock }));
jest.mock('../../services/email.service', () => ({ sendOtpEmail: jest.fn() }));
jest.mock('../../services/upload.service', () => ({
  uploadImage: jest.fn().mockResolvedValue('https://cdn.example.com/test.jpg'),
  uploadVideo: jest.fn().mockResolvedValue('https://cdn.example.com/test.mp4'),
  uploadFile: jest.fn().mockResolvedValue('https://cdn.example.com/test.pdf'),
}));

import app from '../../index';

// ─── Token helpers ────────────────────────────────────────────────────────────

const ownerToken = () => `Bearer ${signAccessToken({ userId: 'owner-1', role: 'OWNER', email: 'owner@felovy.com' })}`;
const devToken = () => `Bearer ${signAccessToken({ userId: 'dev-1', role: 'DEVELOPER', email: 'dev@test.com' })}`;

// ─── Auth guard tests ─────────────────────────────────────────────────────────

describe('Owner routes – auth guards', () => {
  it('returns 401 for unauthenticated requests', async () => {
    const res = await request(app).get('/api/owner/stats');
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-owner role', async () => {
    const res = await request(app)
      .get('/api/owner/stats')
      .set('Authorization', devToken());
    expect(res.status).toBe(403);
  });
});

// ─── GET /api/owner/stats ─────────────────────────────────────────────────────

describe('GET /api/owner/stats', () => {
  it('returns stats for authenticated owner', async () => {
    prismaMock.developer.count.mockResolvedValue(10);
    prismaMock.employer.count.mockResolvedValue(5);
    prismaMock.job.count.mockResolvedValue(20);
    prismaMock.user.count.mockResolvedValue(50);

    const res = await request(app)
      .get('/api/owner/stats')
      .set('Authorization', ownerToken());

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      developers: expect.any(Number),
      employers: expect.any(Number),
      activeJobs: expect.any(Number),
    });
  });
});

// ─── GET /api/owner/users ─────────────────────────────────────────────────────

describe('GET /api/owner/users', () => {
  it('returns paginated users', async () => {
    prismaMock.user.findMany.mockResolvedValue([
      { id: 'u1', email: 'a@test.com', role: 'DEVELOPER', status: 'ACTIVE', createdAt: new Date() },
    ]);
    prismaMock.user.count.mockResolvedValue(1);

    const res = await request(app)
      .get('/api/owner/users')
      .set('Authorization', ownerToken());

    expect(res.status).toBe(200);
    expect(res.body.users).toHaveLength(1);
    expect(res.body.total).toBe(1);
  });
});

// ─── POST /api/owner/moderate ────────────────────────────────────────────────

describe('POST /api/owner/moderate', () => {
  it('returns 404 for unknown user', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const res = await request(app)
      .post('/api/owner/moderate')
      .set('Authorization', ownerToken())
      .send({ email: 'ghost@test.com', action: 'ban' });
    expect(res.status).toBe(404);
  });

  it('returns 403 when trying to moderate owner', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'o1', role: 'OWNER' });
    const res = await request(app)
      .post('/api/owner/moderate')
      .set('Authorization', ownerToken())
      .send({ userId: 'o1', action: 'ban' });
    expect(res.status).toBe(403);
  });

  it('bans a user successfully', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'u2', role: 'DEVELOPER' });
    prismaMock.user.update.mockResolvedValue({ id: 'u2', status: 'BANNED' });
    const res = await request(app)
      .post('/api/owner/moderate')
      .set('Authorization', ownerToken())
      .send({ userId: 'u2', action: 'ban' });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/ban/i);
  });
});

// ─── POST /api/owner/verify/developer ────────────────────────────────────────

describe('POST /api/owner/verify/developer', () => {
  it('approves a developer', async () => {
    prismaMock.developer.update.mockResolvedValue({ id: 'd1', isVerified: true });
    const res = await request(app)
      .post('/api/owner/verify/developer')
      .set('Authorization', ownerToken())
      .send({ developerId: 'd1', approved: true });
    expect(res.status).toBe(200);
    expect(res.body.isVerified).toBe(true);
  });

  it('rejects (un-verifies) a developer', async () => {
    prismaMock.developer.update.mockResolvedValue({ id: 'd1', isVerified: false });
    const res = await request(app)
      .post('/api/owner/verify/developer')
      .set('Authorization', ownerToken())
      .send({ developerId: 'd1', approved: false });
    expect(res.status).toBe(200);
    expect(res.body.isVerified).toBe(false);
  });
});

// ─── POST /api/owner/verify/employer ─────────────────────────────────────────

describe('POST /api/owner/verify/employer', () => {
  it('approves an employer', async () => {
    prismaMock.employer.update.mockResolvedValue({ id: 'e1', isVerified: true });
    const res = await request(app)
      .post('/api/owner/verify/employer')
      .set('Authorization', ownerToken())
      .send({ employerId: 'e1', approved: true });
    expect(res.status).toBe(200);
    expect(res.body.isVerified).toBe(true);
  });
});

// ─── GET /api/owner/jobs ──────────────────────────────────────────────────────

describe('GET /api/owner/jobs', () => {
  it('returns all jobs', async () => {
    prismaMock.job.findMany.mockResolvedValue([
      { id: 'j1', title: 'Dev', status: 'PENDING' },
      { id: 'j2', title: 'PM', status: 'APPROVED' },
    ]);
    prismaMock.job.count.mockResolvedValue(2);
    const res = await request(app)
      .get('/api/owner/jobs')
      .set('Authorization', ownerToken());
    expect(res.status).toBe(200);
    expect(res.body.jobs).toHaveLength(2);
  });
});

// ─── PATCH /api/owner/jobs/:id/review ────────────────────────────────────────

describe('PATCH /api/owner/jobs/:id/review', () => {
  it('approves a job', async () => {
    prismaMock.job.update.mockResolvedValue({ id: 'j1', status: 'APPROVED' });
    const res = await request(app)
      .patch('/api/owner/jobs/j1/review')
      .set('Authorization', ownerToken())
      .send({ status: 'APPROVED' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('APPROVED');
  });
});
