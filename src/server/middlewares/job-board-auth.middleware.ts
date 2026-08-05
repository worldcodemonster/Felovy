import { Request, Response, NextFunction, RequestHandler } from 'express';

/** Validates felovy-search ingest API key via header. */
export const requireJobBoardIngestKey: RequestHandler = (req, res, next) => {
  const expected = process.env.JOB_BOARD_INGEST_KEY?.trim();
  if (!expected) {
    res.status(503).json({
      message: 'Job board ingest is not configured (JOB_BOARD_INGEST_KEY missing on server)',
    });
    return;
  }

  const headerKey = req.headers['x-job-board-key'];
  const authHeader = req.headers.authorization;
  let provided = typeof headerKey === 'string' ? headerKey.trim() : '';

  if (!provided && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    provided = authHeader.slice(7).trim();
  }

  if (!provided || provided !== expected) {
    res.status(401).json({ message: 'Invalid or missing job board ingest API key' });
    return;
  }

  next();
};
