import { Request, Response, NextFunction } from 'express';
import { authenticate, requireRole, AuthRequest } from '../../middlewares/auth.middleware';
import { signAccessToken } from '../../utils/jwt.util';

function mockReq(headers: Record<string, string> = {}, user?: any): Partial<AuthRequest> {
  return { headers, user } as Partial<AuthRequest>;
}

function mockRes() {
  const res: any = { statusCode: 200 };
  res.status = jest.fn((code: number) => { res.statusCode = code; return res; });
  res.json = jest.fn(() => res);
  return res;
}

describe('authenticate', () => {
  it('returns 401 when Authorization header is missing', () => {
    const req = mockReq();
    const res = mockRes();
    const next = jest.fn();

    authenticate(req as Request, res as Response, next as NextFunction);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'No token provided' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when Authorization header does not start with Bearer', () => {
    const req = mockReq({ authorization: 'Basic abc123' });
    const res = mockRes();
    const next = jest.fn();

    authenticate(req as Request, res as Response, next as NextFunction);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for an invalid/malformed token', () => {
    const req = mockReq({ authorization: 'Bearer this.is.invalid' });
    const res = mockRes();
    const next = jest.fn();

    authenticate(req as Request, res as Response, next as NextFunction);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('sets req.user and calls next() for a valid token', () => {
    const payload = { userId: 'u1', role: 'DEVELOPER', email: 'dev@test.com' };
    const token = signAccessToken(payload);
    const req = mockReq({ authorization: `Bearer ${token}` });
    const res = mockRes();
    const next = jest.fn();

    authenticate(req as Request, res as Response, next as NextFunction);

    expect(next).toHaveBeenCalled();
    expect((req as AuthRequest).user?.userId).toBe('u1');
    expect((req as AuthRequest).user?.role).toBe('DEVELOPER');
    expect((req as AuthRequest).user?.email).toBe('dev@test.com');
  });

  it('returns 401 for a "Bearer " with no token value', () => {
    const req = mockReq({ authorization: 'Bearer ' });
    const res = mockRes();
    const next = jest.fn();

    authenticate(req as Request, res as Response, next as NextFunction);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('requireRole', () => {
  it('calls next() when user has a matching role', () => {
    const req = mockReq({}, { userId: 'u1', role: 'DEVELOPER', email: 'dev@test.com' });
    const res = mockRes();
    const next = jest.fn();

    requireRole('DEVELOPER')(req as Request, res as Response, next as NextFunction);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('calls next() when multiple roles are allowed and user matches one', () => {
    const req = mockReq({}, { userId: 'u1', role: 'EMPLOYER', email: 'emp@test.com' });
    const res = mockRes();
    const next = jest.fn();

    requireRole('DEVELOPER', 'EMPLOYER')(req as Request, res as Response, next as NextFunction);

    expect(next).toHaveBeenCalled();
  });

  it('returns 403 when user role does not match', () => {
    const req = mockReq({}, { userId: 'u1', role: 'DEVELOPER', email: 'dev@test.com' });
    const res = mockRes();
    const next = jest.fn();

    requireRole('OWNER')(req as Request, res as Response, next as NextFunction);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when req.user is undefined', () => {
    const req = mockReq();
    const res = mockRes();
    const next = jest.fn();

    requireRole('DEVELOPER')(req as Request, res as Response, next as NextFunction);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() for OWNER role', () => {
    const req = mockReq({}, { userId: 'o1', role: 'OWNER', email: 'owner@felovy.com' });
    const res = mockRes();
    const next = jest.fn();

    requireRole('OWNER')(req as Request, res as Response, next as NextFunction);

    expect(next).toHaveBeenCalled();
  });
});
