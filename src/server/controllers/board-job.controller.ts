import { Response } from 'express';
import type { AuthRequest } from '../middlewares/auth.middleware';
import type { BoardJobIngestPayload, BoardJobListQuery } from '@/lib/board-job-types';
import {
  getBoardJobById,
  getBoardJobFilters,
  getBoardJobStats,
  ingestBoardJobs,
  listBoardJobs,
} from '../services/board-job.service';

function parseIngestBody(body: unknown): BoardJobIngestPayload[] {
  if (!body || typeof body !== 'object') return [];
  const b = body as Record<string, unknown>;

  if (Array.isArray(b.jobs)) {
    return b.jobs as BoardJobIngestPayload[];
  }

  if (b.job && typeof b.job === 'object') {
    return [b.job as BoardJobIngestPayload];
  }

  if (typeof b.job_id === 'string' && typeof b.ats === 'string' && typeof b.board_token === 'string') {
    return [b as unknown as BoardJobIngestPayload];
  }

  return [];
}

function parseListQuery(body: unknown): BoardJobListQuery {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  return {
    title_q: b.title_q ? String(b.title_q) : undefined,
    title_mode: b.title_mode === 'OR' ? 'OR' : 'AND',
    content_q: b.content_q ? String(b.content_q) : undefined,
    content_mode: b.content_mode === 'OR' ? 'OR' : 'AND',
    board_token_q: b.board_token_q ? String(b.board_token_q) : undefined,
    ats: b.ats ? String(b.ats) : undefined,
    remote_status: b.remote_status ? String(b.remote_status) : undefined,
    region: b.region ? String(b.region) as BoardJobListQuery['region'] : undefined,
    posted_range: b.posted_range ? String(b.posted_range) as BoardJobListQuery['posted_range'] : undefined,
    updated_range: b.updated_range ? String(b.updated_range) as BoardJobListQuery['updated_range'] : undefined,
    sort_by: b.sort_by ? String(b.sort_by) as BoardJobListQuery['sort_by'] : undefined,
    sort_dir: b.sort_dir === 'asc' ? 'asc' : 'desc',
    page: b.page ? Number(b.page) : undefined,
    pageSize: b.pageSize ? Number(b.pageSize) : undefined,
  };
}

export const ingestBoardJobsHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const jobs = parseIngestBody(req.body);
    if (!jobs.length) {
      res.status(400).json({
        message: 'Request must include a job object, { job: {...} }, or { jobs: [...] }',
      });
      return;
    }

    if (jobs.length > 500) {
      res.status(400).json({ message: 'Maximum 500 jobs per request' });
      return;
    }

    const result = await ingestBoardJobs(jobs);
    res.status(result.failed === jobs.length ? 400 : 201).json({
      message: `Ingested ${result.created + result.updated} job(s) (${result.created} created, ${result.updated} updated)`,
      ...result,
    });
  } catch (err) {
    console.error('[ingestBoardJobs]', err);
    res.status(500).json({ message: 'Failed to ingest jobs' });
  }
};

export const listBoardJobsHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const query = parseListQuery(req.body);
    const result = await listBoardJobs(query);
    res.json(result);
  } catch (err) {
    console.error('[listBoardJobs]', err);
    res.status(500).json({ message: 'Failed to list board jobs' });
  }
};

export const boardJobFiltersHandler = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filters = await getBoardJobFilters();
    res.json(filters);
  } catch (err) {
    console.error('[boardJobFilters]', err);
    res.status(500).json({ message: 'Failed to load filters' });
  }
};

export const getBoardJobHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) {
      res.status(400).json({ message: 'Job id required' });
      return;
    }
    const job = await getBoardJobById(id);
    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }
    res.json({ job });
  } catch (err) {
    console.error('[getBoardJob]', err);
    res.status(500).json({ message: 'Failed to load job' });
  }
};

export const boardJobHealthHandler = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const stats = await getBoardJobStats();
    res.json({
      status: 'ok',
      service: 'Felovy Job Board API',
      totalJobs: stats.total,
    });
  } catch (err) {
    console.error('[boardJobHealth]', err);
    res.status(500).json({ message: 'Job board health check failed' });
  }
};
