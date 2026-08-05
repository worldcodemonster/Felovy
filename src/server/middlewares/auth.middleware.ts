import { Request, Response, NextFunction, RequestHandler } from 'express';
import { verifyAccessToken, JwtPayload } from '../utils/jwt.util';

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

// Wrap async route handlers so rejected promises reach Express error middleware.
export const asHandler = (
  fn: (req: AuthRequest, res: Response, next?: NextFunction) => void | Promise<void>,
): RequestHandler =>
  ((req, res, next) => {
    Promise.resolve(fn(req as AuthRequest, res, next)).catch(next);
  }) as RequestHandler;

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

/** SSE clients (EventSource) cannot send Authorization headers — accept ?token= as fallback. */
export const authenticateQueryOrHeader: RequestHandler = (req, res, next) => {
  const header = req.headers.authorization;
  const queryToken = typeof req.query.token === 'string' ? req.query.token : null;
  const raw = header?.startsWith('Bearer ') ? header.slice(7) : queryToken;
  if (!raw) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }
  try {
    (req as AuthRequest).user = verifyAccessToken(raw);
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
