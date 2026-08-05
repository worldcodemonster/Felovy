import type { Request, Response } from 'express';
import { importCatalogIfNeeded, purgeExcludedPlatforms } from '../services/board-catalog.service';
import {
  listPlatforms,
  movePlatform,
  reorderPlatforms,
  setPlatformConcurrency,
} from '../services/board-platform.service';
import {
  searchBoardTokens,
  setBoardTokenEnabled,
  deleteBoardToken,
} from '../services/board-token.service';
import {
  addVerifiedBoardToken,
  verifyExistingBoardTokens,
  importAndVerifyBoardTokens,
  importAndVerifyAllAts,
  cancelTokenVerify,
  isTokenVerifyRunning,
} from '../services/verify-tokens.service';
import {
  getAgentStatuses,
  getRotationStatus,
  setConcurrency,
  startAgent,
  pauseAgent,
  stopAgent,
  toggleAgent,
  startRotation,
  pauseRotation,
  stopRotation,
  toggleRotation,
} from '../services/scrape-orchestrator.service';
import { boardSearchEvents } from '../services/board-search-events';
import { runFelovySearchMigration } from '../services/board-migration.service';

export async function initBoardSearch(_req: Request, res: Response): Promise<void> {
  const catalog = await importCatalogIfNeeded();
  res.json({ ok: true, catalog });
}

export async function forceImportCatalog(_req: Request, res: Response): Promise<void> {
  const catalog = await importCatalogIfNeeded(true);
  res.json({ ok: true, catalog });
}

export async function purgeExcluded(_req: Request, res: Response): Promise<void> {
  const removed = await purgeExcludedPlatforms();
  res.json({ ok: true, removed });
}

export async function getPlatforms(_req: Request, res: Response): Promise<void> {
  await importCatalogIfNeeded();
  const platforms = await listPlatforms();
  res.json({ platforms });
}

export async function reorderPlatformsHandler(req: Request, res: Response): Promise<void> {
  const slugs = req.body?.slugs as string[];
  if (!Array.isArray(slugs) || !slugs.length) {
    res.status(400).json({ message: 'slugs array required' });
    return;
  }
  await reorderPlatforms(slugs);
  res.json({ ok: true, platforms: await listPlatforms() });
}

export async function movePlatformHandler(req: Request, res: Response): Promise<void> {
  const { slug, direction } = req.body as { slug?: string; direction?: 'up' | 'down' };
  if (!slug || (direction !== 'up' && direction !== 'down')) {
    res.status(400).json({ message: 'slug and direction (up|down) required' });
    return;
  }
  const platforms = await movePlatform(slug, direction);
  res.json({ platforms });
}

export async function searchTokens(req: Request, res: Response): Promise<void> {
  const { ats, q = '', limit = 100, offset = 0 } = req.body as {
    ats?: string;
    q?: string;
    limit?: number;
    offset?: number;
  };
  if (!ats) {
    res.status(400).json({ message: 'ats required' });
    return;
  }
  const result = await searchBoardTokens(ats, q, Number(limit), Number(offset));
  res.json(result);
}

export async function addToken(req: Request, res: Response): Promise<void> {
  const { ats, token } = req.body as { ats?: string; token?: string };
  if (!ats || !token?.trim()) {
    res.status(400).json({ message: 'ats and token required' });
    return;
  }
  await addVerifiedBoardToken(ats, token.trim());
  res.json({ ok: true });
}

export async function importTokens(req: Request, res: Response): Promise<void> {
  const { ats, lines, concurrency } = req.body as {
    ats?: string;
    lines?: string[];
    concurrency?: number;
  };
  if (!ats || !Array.isArray(lines)) {
    res.status(400).json({ message: 'ats and lines array required' });
    return;
  }
  const result = await importAndVerifyBoardTokens(ats, lines, concurrency);
  res.json(result);
}

export async function importTokensAllAts(req: Request, res: Response): Promise<void> {
  const { lines, concurrency } = req.body as { lines?: string[]; concurrency?: number };
  if (!Array.isArray(lines)) {
    res.status(400).json({ message: 'lines array required' });
    return;
  }
  const result = await importAndVerifyAllAts(lines, concurrency);
  res.json(result);
}

export async function verifyTokens(req: Request, res: Response): Promise<void> {
  const { ats, concurrency } = req.body as { ats?: string; concurrency?: number };
  if (!ats) {
    res.status(400).json({ message: 'ats required' });
    return;
  }
  const result = await verifyExistingBoardTokens(ats, concurrency);
  res.json(result);
}

export async function cancelVerify(_req: Request, res: Response): Promise<void> {
  cancelTokenVerify();
  res.json({ ok: true });
}

export async function verifyStatus(_req: Request, res: Response): Promise<void> {
  res.json({ running: isTokenVerifyRunning() });
}

export async function setTokenEnabled(req: Request, res: Response): Promise<void> {
  const { ats, token, enabled } = req.body as { ats?: string; token?: string; enabled?: boolean };
  if (!ats || !token || typeof enabled !== 'boolean') {
    res.status(400).json({ message: 'ats, token, and enabled required' });
    return;
  }
  await setBoardTokenEnabled(ats, token, enabled);
  res.json({ ok: true });
}

export async function removeToken(req: Request, res: Response): Promise<void> {
  const { ats, token } = req.body as { ats?: string; token?: string };
  if (!ats || !token) {
    res.status(400).json({ message: 'ats and token required' });
    return;
  }
  await deleteBoardToken(ats, token);
  res.json({ ok: true });
}

export async function getScrapeAgents(_req: Request, res: Response): Promise<void> {
  await importCatalogIfNeeded();
  const [agents, rotation] = await Promise.all([getAgentStatuses(), getRotationStatus()]);
  res.json({ agents, rotation });
}

export async function setScrapeConcurrency(req: Request, res: Response): Promise<void> {
  const { ats, concurrency } = req.body as { ats?: string; concurrency?: number };
  if (!ats || concurrency == null) {
    res.status(400).json({ message: 'ats and concurrency required' });
    return;
  }
  await setConcurrency(ats, Number(concurrency));
  res.json({ ok: true });
}

export async function scrapeStart(req: Request, res: Response): Promise<void> {
  const { ats } = req.body as { ats?: string };
  if (!ats) {
    res.status(400).json({ message: 'ats required' });
    return;
  }
  await startAgent(ats);
  res.json({ ok: true });
}

export async function scrapePause(req: Request, res: Response): Promise<void> {
  const { ats } = req.body as { ats?: string };
  if (!ats) {
    res.status(400).json({ message: 'ats required' });
    return;
  }
  await pauseAgent(ats);
  res.json({ ok: true });
}

export async function scrapeStop(req: Request, res: Response): Promise<void> {
  const { ats } = req.body as { ats?: string };
  if (!ats) {
    res.status(400).json({ message: 'ats required' });
    return;
  }
  await stopAgent(ats);
  res.json({ ok: true });
}

export async function scrapeToggle(req: Request, res: Response): Promise<void> {
  const { ats } = req.body as { ats?: string };
  if (!ats) {
    res.status(400).json({ message: 'ats required' });
    return;
  }
  await toggleAgent(ats);
  res.json({ ok: true });
}

export async function rotationStart(_req: Request, res: Response): Promise<void> {
  await startRotation();
  res.json({ ok: true });
}

export async function rotationPause(_req: Request, res: Response): Promise<void> {
  await pauseRotation();
  res.json({ ok: true });
}

export async function rotationStop(_req: Request, res: Response): Promise<void> {
  await stopRotation();
  res.json({ ok: true });
}

export async function rotationToggle(_req: Request, res: Response): Promise<void> {
  await toggleRotation();
  res.json({ ok: true });
}

export async function scrapeEventsStream(req: Request, res: Response): Promise<void> {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = async (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  void send('agents', {
    agents: await getAgentStatuses(),
    rotation: await getRotationStatus(),
  });

  const onAgents = async () => {
    await send('agents', {
      agents: await getAgentStatuses(),
      rotation: await getRotationStatus(),
    });
  };
  const onScrape = (data: unknown) => void send('scrape', data);
  const onVerify = (data: unknown) => void send('verify', data);

  boardSearchEvents.on('scrape:agents', onAgents);
  boardSearchEvents.on('scrape:rotation', onAgents);
  boardSearchEvents.on('scrape:event', onScrape);
  boardSearchEvents.on('verify:progress', onVerify);

  req.on('close', () => {
    boardSearchEvents.off('scrape:agents', onAgents);
    boardSearchEvents.off('scrape:rotation', onAgents);
    boardSearchEvents.off('scrape:event', onScrape);
    boardSearchEvents.off('verify:progress', onVerify);
  });
}

export async function migrateFromSqlite(req: Request, res: Response): Promise<void> {
  const {
    sqlitePath,
    includeJobs = true,
    uploadLogos = true,
    batchSize = 500,
  } = req.body as {
    sqlitePath?: string;
    includeJobs?: boolean;
    uploadLogos?: boolean;
    batchSize?: number;
  };

  const result = await runFelovySearchMigration({
    sqlitePath,
    includeJobs,
    uploadLogos,
    batchSize,
  });
  res.json(result);
}

export async function setPlatformConcurrencyHandler(req: Request, res: Response): Promise<void> {
  const { slug, concurrency } = req.body as { slug?: string; concurrency?: number };
  if (!slug || concurrency == null) {
    res.status(400).json({ message: 'slug and concurrency required' });
    return;
  }
  await setPlatformConcurrency(slug, Number(concurrency));
  res.json({ ok: true });
}
