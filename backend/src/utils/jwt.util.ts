import jwt from 'jsonwebtoken';

export interface JwtPayload {
  userId: string;
  role: string;
  email: string;
}

// Read env vars at call time so tests can set them in setupFiles without
// depending on module load order (jwt v30 + ts-jest timing issue)
const accessSecret = () => process.env.JWT_ACCESS_SECRET!;
const refreshSecret = () => process.env.JWT_REFRESH_SECRET!;

export const signAccessToken = (payload: JwtPayload): string =>
  jwt.sign(payload, accessSecret(), { expiresIn: '15m' });

export const signRefreshToken = (payload: JwtPayload): string =>
  jwt.sign(payload, refreshSecret(), { expiresIn: '30d' });

export const verifyAccessToken = (token: string): JwtPayload =>
  jwt.verify(token, accessSecret()) as JwtPayload;

export const verifyRefreshToken = (token: string): JwtPayload =>
  jwt.verify(token, refreshSecret()) as JwtPayload;
