import request from 'supertest';
import { signAccessToken } from '../../utils/jwt.util';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const prismaMock = {
  developer: { findUnique: jest.fn(), update: jest.fn(), findMany: jest.fn(), count: jest.fn() },
  user: { findUnique: jest.fn() },
};

jest.mock('../../config/database', () => ({ prisma: prismaMock }));
jest.mock('../../services/email.service', () => ({ sendOtpEmail: jest.fn() }));
jest.mock('../../services/upload.service', () => ({
  uploadImage: jest.fn().mockResolvedValue('https://cdn.example.com/photo.jpg'),
  uploadVideo: jest.fn().mockResolvedValue('https://cdn.example.com/video.mp4'),
  uploadFile: jest.fn().mockResolvedValue('https://cdn.example.com/id.pdf'),
}));

import app from '../../index';

const devToken = () => `Bearer ${signAccessToken({ userId: 'dev-1', role: 'DEVELOPER', email: 'dev@test.com' })}`;
const empToken = () => `Bearer ${signAccessToken({ userId: 'emp-1', role: 'EMPLOYER', email: 'emp@corp.com' })}`;
const ownerToken = () => `Bearer ${signAccessToken({ userId: 'owner-1', role: 'OWNER', email: 'owner@felovy.com' })}`;

const sampleDeveloper = {
  id: 'd1',
  userId: 'dev-1',
  fullName: 'Jane Dev',
  title: 'Full Stack Engineer',
  skills: ['React', 'Node.js'],
  languages: [{ name: 'English', level: 'Native' }],
  profileStep: 2,
  isVerified: true,
  user: { email: 'dev@test.com', status: 'ACTIVE', createdAt: new Date().toISOString() },
};

// ─── GET /api/developers/me ───────────────────────────────────────────────────

describe('GET /api/developers/me', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/developers/me');
    expect(res.status).toBe(401);
  });

  it('returns 403 for employer role', async () => {
    const res = await request(app)
      .get('/api/developers/me')
      .set('Authorization', empToken());
    expect(res.status).toBe(403);
  });

  it('returns 404 when profile does not exist', async () => {
    prismaMock.developer.findUnique.mockResolvedValue(null);
    const res = await request(app)
      .get('/api/developers/me')
      .set('Authorization', devToken());
    expect(res.status).toBe(404);
  });

  it('returns developer profile', async () => {
    prismaMock.developer.findUnique.mockResolvedValue(sampleDeveloper);
    const res = await request(app)
      .get('/api/developers/me')
      .set('Authorization', devToken());
    expect(res.status).toBe(200);
    expect(res.body.fullName).toBe('Jane Dev');
  });
});

// ─── GET /api/developers (owner only) ────────────────────────────────────────

describe('GET /api/developers', () => {
  it('returns 403 for developer role', async () => {
    const res = await request(app)
      .get('/api/developers')
      .set('Authorization', devToken());
    expect(res.status).toBe(403);
  });

  it('returns 403 for employer role', async () => {
    const res = await request(app)
      .get('/api/developers')
      .set('Authorization', empToken());
    expect(res.status).toBe(403);
  });

  it('returns paginated developers for owner', async () => {
    prismaMock.developer.findMany.mockResolvedValue([sampleDeveloper]);
    prismaMock.developer.count.mockResolvedValue(1);
    const res = await request(app)
      .get('/api/developers')
      .set('Authorization', ownerToken());
    expect(res.status).toBe(200);
    expect(res.body.developers).toHaveLength(1);
  });

  it('filters by verified=false', async () => {
    prismaMock.developer.findMany.mockResolvedValue([]);
    prismaMock.developer.count.mockResolvedValue(0);
    await request(app)
      .get('/api/developers?verified=false')
      .set('Authorization', ownerToken());
    expect(prismaMock.developer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isVerified: false } })
    );
  });
});

// ─── GET /api/developers/:id (employer or owner) ──────────────────────────────

describe('GET /api/developers/:id', () => {
  it('returns 403 for developer role (cannot view other profiles)', async () => {
    const res = await request(app)
      .get('/api/developers/d1')
      .set('Authorization', devToken());
    expect(res.status).toBe(403);
  });

  it('returns developer profile for employer', async () => {
    prismaMock.developer.findUnique.mockResolvedValue(sampleDeveloper);
    const res = await request(app)
      .get('/api/developers/d1')
      .set('Authorization', empToken());
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('d1');
  });

  it('returns 404 when developer not found', async () => {
    prismaMock.developer.findUnique.mockResolvedValue(null);
    const res = await request(app)
      .get('/api/developers/nonexistent')
      .set('Authorization', empToken());
    expect(res.status).toBe(404);
  });
});

// ─── PUT /api/developers/me/step2 ────────────────────────────────────────────

describe('PUT /api/developers/me/step2', () => {
  it('returns 403 for non-developer', async () => {
    const res = await request(app)
      .put('/api/developers/me/step2')
      .set('Authorization', empToken())
      .send({ fullName: 'Jane' });
    expect(res.status).toBe(403);
  });

  it('updates developer profile step 2', async () => {
    const updated = { ...sampleDeveloper, fullName: 'Updated Name', profileStep: 2 };
    prismaMock.developer.update.mockResolvedValue(updated);
    const res = await request(app)
      .put('/api/developers/me/step2')
      .set('Authorization', devToken())
      .send({
        fullName: 'Updated Name',
        skills: ['React'],
        languages: [{ name: 'English', level: 'Native' }],
      });
    expect(res.status).toBe(200);
    expect(res.body.fullName).toBe('Updated Name');
  });
});
