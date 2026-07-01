import { Request, Response, NextFunction, RequestHandler } from 'express';
import { verifyAccessToken, JwtPayload } from '../utils/jwt.util';

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

// Cast a handler that receives AuthRequest to a plain RequestHandler for Express router compatibility
export const asHandler = (fn: (req: AuthRequest, res: Response, next?: NextFunction) => void | Promise<void>): RequestHandler =>
  fn as unknown as RequestHandler;

export const authenticate: RequestHandler = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }
  try {
    (req as AuthRequest).user = verifyAccessToken(header.slice(7));
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const requireRole =
  (...roles: string[]): RequestHandler =>
  (req, res, next) => {
    const authReq = req as AuthRequest;
    if (!authReq.user || !roles.includes(authReq.user.role)) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    next();
  };
