import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  JwtPayload,
} from '../../utils/jwt.util';

const PAYLOAD: JwtPayload = { userId: 'user-1', role: 'DEVELOPER', email: 'dev@test.com' };

describe('signAccessToken / verifyAccessToken', () => {
  it('produces a verifiable token with correct payload', () => {
    const token = signAccessToken(PAYLOAD);
    const decoded = verifyAccessToken(token);
    expect(decoded.userId).toBe(PAYLOAD.userId);
    expect(decoded.role).toBe(PAYLOAD.role);
    expect(decoded.email).toBe(PAYLOAD.email);
  });

  it('returns a non-empty string', () => {
    const token = signAccessToken(PAYLOAD);
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3); // JWT has 3 parts
  });

  it('throws JsonWebTokenError for a tampered token', () => {
    const token = signAccessToken(PAYLOAD);
    const parts = token.split('.');
    parts[1] = Buffer.from('{"userId":"hacker","role":"OWNER"}').toString('base64url');
    expect(() => verifyAccessToken(parts.join('.'))).toThrow();
  });

  it('throws for a completely invalid token', () => {
    expect(() => verifyAccessToken('not.a.token')).toThrow();
  });

  it('throws for empty string', () => {
    expect(() => verifyAccessToken('')).toThrow();
  });
});

describe('signRefreshToken / verifyRefreshToken', () => {
  it('produces a verifiable token with correct payload', () => {
    const token = signRefreshToken(PAYLOAD);
    const decoded = verifyRefreshToken(token);
    expect(decoded.userId).toBe(PAYLOAD.userId);
    expect(decoded.role).toBe(PAYLOAD.role);
    expect(decoded.email).toBe(PAYLOAD.email);
  });

  it('access token and refresh token differ', () => {
    const access = signAccessToken(PAYLOAD);
    const refresh = signRefreshToken(PAYLOAD);
    expect(access).not.toBe(refresh);
  });

  it('throws when access token used for refresh verification', () => {
    const access = signAccessToken(PAYLOAD);
    // Access token is signed with a different secret than refresh token
    expect(() => verifyRefreshToken(access)).toThrow();
  });

  it('throws for invalid token', () => {
    expect(() => verifyRefreshToken('invalid')).toThrow();
  });
});

describe('role and email preservation', () => {
  it.each([
    ['DEVELOPER', 'dev@test.com'],
    ['EMPLOYER', 'emp@corp.com'],
    ['OWNER', 'owner@felovy.com'],
  ])('preserves role %s in access token', (role, email) => {
    const token = signAccessToken({ userId: 'x', role, email });
    expect(verifyAccessToken(token).role).toBe(role);
    expect(verifyAccessToken(token).email).toBe(email);
  });
});
