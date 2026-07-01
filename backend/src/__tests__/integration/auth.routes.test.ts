import request from 'supertest';

// ─── Mock all external dependencies before importing app ─────────────────────

const prismaMock = {
  user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  developer: { create: jest.fn() },
  employer: { create: jest.fn() },
  otpCode: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), deleteMany: jest.fn() },
};

jest.mock('../../config/database', () => ({ prisma: prismaMock }));
jest.mock('../../services/email.service', () => ({ sendOtpEmail: jest.fn().mockResolvedValue(undefined) }));
jest.mock('../../services/upload.service', () => ({
  uploadImage: jest.fn().mockResolvedValue('https://cdn.example.com/test.jpg'),
  uploadVideo: jest.fn().mockResolvedValue('https://cdn.example.com/test.mp4'),
  uploadFile: jest.fn().mockResolvedValue('https://cdn.example.com/test.pdf'),
}));
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$2b$12$hashedpassword'),
  compare: jest.fn(),
}));

import bcrypt from 'bcryptjs';
import app from '../../index';
import { signRefreshToken } from '../../utils/jwt.util';

// ─── POST /api/auth/signup/initiate ──────────────────────────────────────────

describe('POST /api/auth/signup/initiate', () => {
  it('returns 400 for invalid role', async () => {
    const res = await request(app)
      .post('/api/auth/signup/initiate')
      .send({ email: 'a@test.com', password: 'pass123', role: 'ADMIN' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Invalid role');
  });

  it('returns 400 for employer using personal email', async () => {
    const res = await request(app)
      .post('/api/auth/signup/initiate')
      .send({ email: 'user@gmail.com', password: 'pass123', role: 'EMPLOYER' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/company email/i);
  });

  it('returns 409 for already-verified email', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'u1', email: 'dup@corp.com' });
    prismaMock.otpCode.findFirst.mockResolvedValue(null);
    const res = await request(app)
      .post('/api/auth/signup/initiate')
      .send({ email: 'dup@corp.com', password: 'pass', role: 'DEVELOPER' });
    expect(res.status).toBe(409);
  });

  it('returns 201 and sends OTP for new developer', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({ id: 'u2', email: 'new@corp.com', role: 'DEVELOPER' });
    prismaMock.developer.create.mockResolvedValue({});
    prismaMock.otpCode.create.mockResolvedValue({ id: 'otp1' });
    const res = await request(app)
      .post('/api/auth/signup/initiate')
      .send({ email: 'new@corp.com', password: 'pass123', role: 'DEVELOPER' });
    expect(res.status).toBe(201);
    expect(res.body.message).toMatch(/OTP sent/i);
    expect(res.body.userId).toBe('u2');
  });
});

// ─── POST /api/auth/signup/verify ────────────────────────────────────────────

describe('POST /api/auth/signup/verify', () => {
  it('returns 400 for invalid OTP', async () => {
    prismaMock.otpCode.findFirst.mockResolvedValue(null);
    const res = await request(app)
      .post('/api/auth/signup/verify')
      .send({ userId: 'u1', code: '000000' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Invalid or expired OTP');
  });

  it('returns 400 for expired OTP', async () => {
    prismaMock.otpCode.findFirst.mockResolvedValue({
      id: 'otp1',
      expiresAt: new Date(Date.now() - 1000),
    });
    const res = await request(app)
      .post('/api/auth/signup/verify')
      .send({ userId: 'u1', code: '123456' });
    expect(res.status).toBe(400);
  });

  it('returns tokens on valid OTP', async () => {
    prismaMock.otpCode.findFirst.mockResolvedValue({
      id: 'otp1',
      expiresAt: new Date(Date.now() + 600_000),
    });
    prismaMock.otpCode.update.mockResolvedValue({});
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'u1', email: 'dev@test.com', role: 'DEVELOPER',
    });
    const res = await request(app)
      .post('/api/auth/signup/verify')
      .send({ userId: 'u1', code: '123456' });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.message).toBe('Signup complete');
  });
});

// ─── POST /api/auth/signin ────────────────────────────────────────────────────

describe('POST /api/auth/signin', () => {
  it('returns 401 for unknown email', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const res = await request(app)
      .post('/api/auth/signin')
      .send({ email: 'ghost@test.com', password: 'pass' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid credentials');
  });

  it('returns 403 for banned user', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'u1', email: 'banned@test.com', role: 'DEVELOPER',
      status: 'BANNED', password: '$hash$',
    });
    const res = await request(app)
      .post('/api/auth/signin')
      .send({ email: 'banned@test.com', password: 'pass' });
    expect(res.status).toBe(403);
  });

  it('returns 401 for wrong password', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'u1', email: 'dev@test.com', role: 'DEVELOPER',
      status: 'ACTIVE', password: '$hash$',
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    const res = await request(app)
      .post('/api/auth/signin')
      .send({ email: 'dev@test.com', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('returns tokens on correct credentials', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'u1', email: 'dev@test.com', role: 'DEVELOPER',
      status: 'ACTIVE', password: '$hash$',
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    const res = await request(app)
      .post('/api/auth/signin')
      .send({ email: 'dev@test.com', password: 'correct' });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.user.role).toBe('DEVELOPER');
  });

  it('treats email as case-insensitive', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await request(app)
      .post('/api/auth/signin')
      .send({ email: '  DEV@TEST.COM  ', password: 'pass' });
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: 'dev@test.com' } })
    );
  });
});

// ─── POST /api/auth/refresh ───────────────────────────────────────────────────

describe('POST /api/auth/refresh', () => {
  it('returns 401 for an invalid refresh token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'bad.token' });
    expect(res.status).toBe(401);
  });

  it('returns a new access token for a valid refresh token', async () => {
    const refreshToken = signRefreshToken({ userId: 'u1', role: 'DEVELOPER', email: 'dev@test.com' });
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
  });
});

// ─── GET /api/health ─────────────────────────────────────────────────────────

describe('GET /api/health', () => {
  it('returns 200 OK', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
