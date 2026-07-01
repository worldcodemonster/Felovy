import request from 'supertest';
import { signAccessToken } from '../../utils/jwt.util';

// ─── Mocks ────────────────────────────────────────────────────────────────────

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
jest.mock('../../services/email.service', () => ({ sendOtpEmail: jest.fn() }));
jest.mock('../../services/upload.service', () => ({
  uploadImage: jest.fn().mockResolvedValue('https://cdn.example.com/test.jpg'),
  uploadVideo: jest.fn().mockResolvedValue('https://cdn.example.com/test.mp4'),
  uploadFile: jest.fn().mockResolvedValue('https://cdn.example.com/test.pdf'),
}));

import app from '../../index';

const devToken = () => `Bearer ${signAccessToken({ userId: 'dev-1', role: 'DEVELOPER', email: 'dev@test.com' })}`;
const empToken = () => `Bearer ${signAccessToken({ userId: 'emp-1', role: 'EMPLOYER', email: 'emp@corp.com' })}`;

// ─── POST /api/applications/jobs/:jobId/apply ─────────────────────────────────

describe('POST /api/applications/jobs/:jobId/apply', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app).post('/api/applications/jobs/j1/apply');
    expect(res.status).toBe(401);
  });

  it('returns 403 for employer role', async () => {
    const res = await request(app)
      .post('/api/applications/jobs/j1/apply')
      .set('Authorization', empToken());
    expect(res.status).toBe(403);
  });

  it('returns 404 when developer profile not found', async () => {
    prismaMock.developer.findUnique.mockResolvedValue(null);
    const res = await request(app)
      .post('/api/applications/jobs/j1/apply')
      .set('Authorization', devToken())
      .send({ coverLetter: 'Hi!' });
    expect(res.status).toBe(404);
  });

  it('returns 403 when developer is not verified', async () => {
    prismaMock.developer.findUnique.mockResolvedValue({ id: 'd1', isVerified: false });
    const res = await request(app)
      .post('/api/applications/jobs/j1/apply')
      .set('Authorization', devToken())
      .send({ coverLetter: 'Hi!' });
    expect(res.status).toBe(403);
  });

  it('returns 409 when already applied', async () => {
    prismaMock.developer.findUnique.mockResolvedValue({ id: 'd1', isVerified: true });
    prismaMock.job.findUnique.mockResolvedValue({ id: 'j1', status: 'APPROVED' });
    prismaMock.application.findUnique.mockResolvedValue({ id: 'app1' });
    const res = await request(app)
      .post('/api/applications/jobs/j1/apply')
      .set('Authorization', devToken())
      .send({ coverLetter: 'Hi!' });
    expect(res.status).toBe(409);
  });

  it('creates application successfully', async () => {
    prismaMock.developer.findUnique.mockResolvedValue({
      id: 'd1', isVerified: true, fullName: 'Dev', skills: [], languages: [],
    });
    prismaMock.job.findUnique.mockResolvedValue({ id: 'j1', status: 'APPROVED' });
    prismaMock.application.findUnique.mockResolvedValue(null);
    prismaMock.application.create.mockResolvedValue({ id: 'app1', status: 'PENDING' });
    const res = await request(app)
      .post('/api/applications/jobs/j1/apply')
      .set('Authorization', devToken())
      .send({ coverLetter: 'I am a great candidate' });
    expect(res.status).toBe(201);
    expect(res.body.id).toBe('app1');
  });
});

// ─── GET /api/applications/mine ───────────────────────────────────────────────

describe('GET /api/applications/mine', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/applications/mine');
    expect(res.status).toBe(401);
  });

  it('returns 403 for employer', async () => {
    const res = await request(app)
      .get('/api/applications/mine')
      .set('Authorization', empToken());
    expect(res.status).toBe(403);
  });

  it('returns applications for developer', async () => {
    prismaMock.developer.findUnique.mockResolvedValue({ id: 'd1' });
    prismaMock.application.findMany.mockResolvedValue([{ id: 'app1', status: 'PENDING' }]);
    const res = await request(app)
      .get('/api/applications/mine')
      .set('Authorization', devToken());
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});

// ─── GET /api/applications/jobs/:jobId (employer) ─────────────────────────────

describe('GET /api/applications/jobs/:jobId', () => {
  it('returns 403 for developer role', async () => {
    const res = await request(app)
      .get('/api/applications/jobs/j1')
      .set('Authorization', devToken());
    expect(res.status).toBe(403);
  });

  it('returns 403 when employer does not own the job', async () => {
    prismaMock.employer.findUnique.mockResolvedValue({ id: 'e1' });
    prismaMock.job.findUnique.mockResolvedValue({ id: 'j1', employerId: 'e-other' });
    const res = await request(app)
      .get('/api/applications/jobs/j1')
      .set('Authorization', empToken());
    expect(res.status).toBe(403);
  });

  it('returns applications for owned job', async () => {
    prismaMock.employer.findUnique.mockResolvedValue({ id: 'e1' });
    prismaMock.job.findUnique.mockResolvedValue({ id: 'j1', employerId: 'e1' });
    prismaMock.application.findMany.mockResolvedValue([{ id: 'app1', status: 'PENDING' }]);
    const res = await request(app)
      .get('/api/applications/jobs/j1')
      .set('Authorization', empToken());
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});

// ─── PATCH /api/applications/:id/status ──────────────────────────────────────

describe('PATCH /api/applications/:id/status', () => {
  it('returns 403 for developer role', async () => {
    const res = await request(app)
      .patch('/api/applications/app1/status')
      .set('Authorization', devToken())
      .send({ status: 'ACCEPTED' });
    expect(res.status).toBe(403);
  });

  it('updates application status for owning employer', async () => {
    prismaMock.employer.findUnique.mockResolvedValue({ id: 'e1' });
    prismaMock.application.findUnique.mockResolvedValue({
      id: 'app1', job: { employerId: 'e1' },
    });
    prismaMock.application.update.mockResolvedValue({ id: 'app1', status: 'SHORTLISTED' });
    const res = await request(app)
      .patch('/api/applications/app1/status')
      .set('Authorization', empToken())
      .send({ status: 'SHORTLISTED' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('SHORTLISTED');
  });
});
