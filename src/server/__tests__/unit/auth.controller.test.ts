import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';

// ─── JWT mock (isolates controller logic from JWT library details) ────────────

jest.mock('../../utils/jwt.util', () => ({
  signAccessToken: jest.fn(() => 'mock-access-token'),
  signRefreshToken: jest.fn(() => 'mock-refresh-token'),
  verifyRefreshToken: jest.fn((token: string) => {
    if (token === 'valid-refresh-token') return { userId: 'u1', role: 'DEVELOPER', email: 'dev@test.com' };
    throw new Error('invalid token');
  }),
  verifyAccessToken: jest.fn((token: string) => {
    if (!token) throw new Error('invalid token');
    return { userId: 'u1', role: 'DEVELOPER', email: 'dev@test.com' };
  }),
}));

// ─── Prisma mock ──────────────────────────────────────────────────────────────

const prismaMock = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  developer: { create: jest.fn() },
  employer: { create: jest.fn() },
  otpCode: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
  },
};

jest.mock('../../config/database', () => ({ prisma: prismaMock }));
jest.mock('../../services/email.service', () => ({ sendOtpEmail: jest.fn() }));
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$hashed$'),
  compare: jest.fn(),
}));

import bcrypt from 'bcryptjs';
import { sendOtpEmail } from '../../services/email.service';
import { initiateSignup, verifySignupOtp, signin, refresh } from '../../controllers/auth.controller';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mockRes(): any {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function req(body: Record<string, any> = {}, extra: Record<string, any> = {}): any {
  return { body, params: {}, query: {}, headers: {}, user: undefined, ...extra };
}

// ─── initiateSignup ───────────────────────────────────────────────────────────

describe('initiateSignup', () => {
  it('rejects an invalid role', async () => {
    const res = mockRes();
    await initiateSignup(req({ email: 'a@b.com', password: 'pass', role: 'ADMIN' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid role' });
  });

  it('rejects employer with personal email (gmail)', async () => {
    const res = mockRes();
    await initiateSignup(req({ email: 'user@gmail.com', password: 'pass', role: 'EMPLOYER' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Employers must use a company email address' });
  });

  it('returns 409 when email already registered and verified', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'u1', email: 'a@corp.com', role: 'DEVELOPER' });
    prismaMock.otpCode.findFirst.mockResolvedValue(null); // no pending OTP = already verified
    const res = mockRes();
    await initiateSignup(req({ email: 'a@corp.com', password: 'pass', role: 'DEVELOPER' }), res);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('creates user and sends OTP for a new developer', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({ id: 'u2', email: 'new@corp.com', role: 'DEVELOPER' });
    prismaMock.developer.create.mockResolvedValue({ id: 'd1' });
    prismaMock.otpCode.create.mockResolvedValue({ id: 'otp1' });
    (sendOtpEmail as jest.Mock).mockResolvedValue(undefined);
    const res = mockRes();
    await initiateSignup(req({ email: 'new@corp.com', password: 'password123', role: 'DEVELOPER' }), res);
    expect(prismaMock.user.create).toHaveBeenCalled();
    expect(prismaMock.developer.create).toHaveBeenCalled();
    expect(sendOtpEmail).toHaveBeenCalledWith('new@corp.com', expect.any(String), 'signup');
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('creates employer record for EMPLOYER role', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({ id: 'u3', email: 'hr@corp.com', role: 'EMPLOYER' });
    prismaMock.employer.create.mockResolvedValue({ id: 'e1' });
    prismaMock.otpCode.create.mockResolvedValue({ id: 'otp2' });
    (sendOtpEmail as jest.Mock).mockResolvedValue(undefined);
    const res = mockRes();
    await initiateSignup(req({ email: 'hr@corp.com', password: 'pass', role: 'EMPLOYER' }), res);
    expect(prismaMock.employer.create).toHaveBeenCalled();
    expect(prismaMock.developer.create).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('normalises email to lowercase before storing', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({ id: 'u4', email: 'dev@corp.com', role: 'DEVELOPER' });
    prismaMock.developer.create.mockResolvedValue({});
    prismaMock.otpCode.create.mockResolvedValue({});
    (sendOtpEmail as jest.Mock).mockResolvedValue(undefined);
    const res = mockRes();
    await initiateSignup(req({ email: '  DEV@CORP.COM  ', password: 'pass', role: 'DEVELOPER' }), res);
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { email: 'dev@corp.com' } });
  });

  it('rolls back user and returns 500 when email sending fails', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({ id: 'u5', email: 'x@corp.com', role: 'DEVELOPER' });
    prismaMock.developer.create.mockResolvedValue({});
    prismaMock.otpCode.create.mockResolvedValue({});
    (sendOtpEmail as jest.Mock).mockRejectedValue(new Error('SMTP error'));
    prismaMock.user.delete.mockResolvedValue({});
    const res = mockRes();
    await initiateSignup(req({ email: 'x@corp.com', password: 'pass', role: 'DEVELOPER' }), res);
    expect(prismaMock.user.delete).toHaveBeenCalledWith({ where: { id: 'u5' } });
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ─── verifySignupOtp ──────────────────────────────────────────────────────────

describe('verifySignupOtp', () => {
  it('returns 400 for an invalid or expired OTP', async () => {
    prismaMock.otpCode.findFirst.mockResolvedValue(null);
    const res = mockRes();
    await verifySignupOtp(req({ userId: 'u1', code: '000000' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired OTP' });
  });

  it('returns 400 for an expired (past expiresAt) OTP', async () => {
    prismaMock.otpCode.findFirst.mockResolvedValue({
      id: 'otp1',
      expiresAt: new Date(Date.now() - 60_000), // expired 1 min ago
    });
    const res = mockRes();
    await verifySignupOtp(req({ userId: 'u1', code: '123456' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('marks OTP as used and returns tokens on success', async () => {
    const futureDate = new Date(Date.now() + 600_000);
    prismaMock.otpCode.findFirst.mockResolvedValue({ id: 'otp1', expiresAt: futureDate });
    prismaMock.otpCode.update.mockResolvedValue({});
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'u1', email: 'dev@test.com', role: 'DEVELOPER',
    });
    const res = mockRes();
    await verifySignupOtp(req({ userId: 'u1', code: '123456' }), res);
    expect(prismaMock.otpCode.update).toHaveBeenCalledWith({
      where: { id: 'otp1' }, data: { used: true },
    });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Signup complete',
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
      user: expect.objectContaining({ id: 'u1', role: 'DEVELOPER' }),
    }));
  });
});

// ─── signin ───────────────────────────────────────────────────────────────────

describe('signin', () => {
  it('returns 401 when user not found', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const res = mockRes();
    await signin(req({ email: 'nobody@test.com', password: 'pass' }), res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
  });

  it('returns 403 when user is banned', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'u1', email: 'banned@test.com', role: 'DEVELOPER', status: 'BANNED', password: '$hash$',
    });
    const res = mockRes();
    await signin(req({ email: 'banned@test.com', password: 'pass' }), res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Account is banned' });
  });

  it('returns 401 when password is wrong', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'u1', email: 'dev@test.com', role: 'DEVELOPER', status: 'ACTIVE', password: '$hash$',
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    const res = mockRes();
    await signin(req({ email: 'dev@test.com', password: 'wrongpass' }), res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
  });

  it('returns tokens on successful signin', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'u1', email: 'dev@test.com', role: 'DEVELOPER', status: 'ACTIVE', password: '$hash$',
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    const res = mockRes();
    await signin(req({ email: 'dev@test.com', password: 'correct' }), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
      user: expect.objectContaining({ id: 'u1', role: 'DEVELOPER' }),
    }));
  });

  it('normalises email before lookup', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const res = mockRes();
    await signin(req({ email: '  DEV@TEST.COM  ', password: 'pass' }), res);
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { email: 'dev@test.com' } });
  });

  it('returns 401 when user has no password set', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'u1', email: 'dev@test.com', role: 'DEVELOPER', status: 'ACTIVE', password: null,
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    const res = mockRes();
    await signin(req({ email: 'dev@test.com', password: 'any' }), res);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});

// ─── refresh ──────────────────────────────────────────────────────────────────

describe('refresh', () => {
  it('returns 401 for an invalid refresh token', async () => {
    const res = mockRes();
    await refresh(req({ refreshToken: 'bad.token.here' }), res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid refresh token' });
  });

  it('returns a new access token for a valid refresh token', async () => {
    const res = mockRes();
    await refresh(req({ refreshToken: 'valid-refresh-token' }), res);
    expect(res.json).toHaveBeenCalledWith({ accessToken: expect.any(String) });
  });
});
