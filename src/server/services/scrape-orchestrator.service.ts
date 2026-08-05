import type { AgentStatus, RotationStatus, ScrapeEvent } from '@/lib/board-search-types';
import { boardSearchEvents } from './board-search-events';
import {
  listPlatforms,
  getPlatformConfig,
  setPlatformConcurrency,
  setAgentEnabled,
} from './board-platform.service';
import {
  listEnabledTokens,
  updateBoardScrapeResult,
  boardHasLogo,
  updateBoardLogo,
  getBoardLogoUrl,
} from './board-token.service';
import { upsertJobsAndPruneMissing } from './board-job.service';
import { cacheRemoteLogo } from './board-logo.service';
import { scrapeBoard, type PlatformConfig } from '../scraper/fetchBoard';
import { resolveBoardLogoUrl } from '../scraper/fetchLogo';

interface AgentState {
  ats: string;
  running: boolean;
  paused: boolean;
  stopRequested: boolean;
  concurrency: number;
  totalTokens: number;
  doneTokens: number;
  activeTokens: number;
  jobsFound: number;
  jobsPruned: number;
  errors: number;
  currentToken: string | null;
  lastMessage: string | null;
  queue: string[];
  inFlight: Set<string>;
}

interface RotationState {
  active: boolean;
  paused: boolean;
  currentAts: string | null;
  cycle: number;
}

const agents = new Map<string, AgentState>();
const rotation: RotationState = {
  active: false,
  paused: false,
  currentAts: null,
  cycle: 1,
};

let agentsEmitTimer: NodeJS.Timeout | null = null;
let agentsEmitPending = false;

function emit(event: ScrapeEvent): void {
  boardSearchEvents.emitScrape(event);
}

function emitAgents(): void {
  agentsEmitPending = true;
  if (agentsEmitTimer) return;
  agentsEmitTimer = setTimeout(() => {
    agentsEmitTimer = null;
    if (!agentsEmitPending) return;
    agentsEmitPending = false;
    boardSearchEvents.emitAgents();
    boardSearchEvents.emitRotation();
  }, 350);
}

function emitAgentsNow(): void {
  if (agentsEmitTimer) {
    clearTimeout(agentsEmitTimer);
    agentsEmitTimer = null;
  }
  agentsEmitPending = false;
  boardSearchEvents.emitAgents();
  boardSearchEvents.emitRotation();
}

function ensureAgent(ats: string): AgentState {
  let a = agents.get(ats);
  if (!a) {
    a = {
      ats,
      running: false,
      paused: false,
      stopRequested: false,
      concurrency: 5,
      totalTokens: 0,
      doneTokens: 0,
      activeTokens: 0,
      jobsFound: 0,
      jobsPruned: 0,
      errors: 0,
      currentToken: null,
      lastMessage: null,
      queue: [],
      inFlight: new Set(),
    };
    agents.set(ats, a);
  }
  return a;
}

async function rotationQueue(): Promise<{ slug: string; label: string }[]> {
  const platforms = await listPlatforms();
  const result: { slug: string; label: string }[] = [];
  for (const p of platforms) {
    if (!p.scrapeable) continue;
    const tokens = await listEnabledTokens(p.slug);
    if (tokens.length > 0) result.push({ slug: p.slug, label: p.label });
  }
  return result;
}

export async function getAgentStatuses(): Promise<AgentStatus[]> {
  const platforms = await listPlatforms();
  return platforms.map(p => {
    const a = agents.get(p.slug);
    return {
      ats: p.slug,
      label: p.label,
      running: a?.running ?? false,
      paused: a?.paused ?? false,
      concurrency: a?.concurrency ?? p.concurrency,
      totalTokens: a?.totalTokens ?? p.token_count,
      doneTokens: a?.doneTokens ?? 0,
      activeTokens: a?.activeTokens ?? 0,
      jobsFound: a?.jobsFound ?? 0,
      jobsPruned: a?.jobsPruned ?? 0,
      errors: a?.errors ?? 0,
      currentToken: a?.currentToken ?? null,
      lastMessage: a?.lastMessage ?? null,
    };
  });
}

export async function getRotationStatus(): Promise<RotationStatus> {
  const queue = await rotationQueue();
  const current = queue.find(p => p.slug === rotation.currentAts);
  return {
    active: rotation.active,
    paused: rotation.paused,
    currentAts: rotation.currentAts,
    currentLabel: current?.label ?? null,
    cycle: rotation.cycle,
    queue: queue.map(p => p.slug),
  };
}

export async function setConcurrency(ats: string, concurrency: number): Promise<void> {
  await setPlatformConcurrency(ats, concurrency);
  const a = ensureAgent(ats);
  a.concurrency = Math.max(1, Math.min(100, concurrency));
  emitAgents();
  if (a.running && !a.paused) pump(ats);
}

export async function startAgent(ats: string): Promise<void> {
  const platform = await getPlatformConfig(ats);
  if (!platform.list_url_template) {
    throw new Error(`${ats} is not scrapeable (no list URL).`);
  }

  const a = ensureAgent(ats);
  if (a.running && !a.paused) return;

  if (!a.running) {
    const tokens = await listEnabledTokens(ats);
    a.queue = [...tokens];
    a.totalTokens = tokens.length;
    a.doneTokens = 0;
    a.jobsFound = 0;
    a.jobsPruned = 0;
    a.errors = 0;
    a.inFlight.clear();
    a.stopRequested = false;
  }

  const p = (await listPlatforms()).find(x => x.slug === ats);
  a.running = true;
  a.paused = false;
  a.concurrency = p?.concurrency ?? a.concurrency;
  await setAgentEnabled(ats, true);
  a.lastMessage =
    a.queue.length === 0 && a.doneTokens === 0
      ? 'No enabled board tokens'
      : `Started — ${a.queue.length} tokens queued`;
  emit({
    type: 'agent',
    ats,
    message: a.lastMessage,
    at: new Date().toISOString(),
    level: 'info',
  });
  emitAgents();

  if (a.queue.length === 0 && a.inFlight.size === 0) {
    finishAgent(ats);
    return;
  }

  pump(ats);
}

export async function pauseAgent(ats: string): Promise<void> {
  const a = ensureAgent(ats);
  if (!a.running) return;
  a.paused = true;
  await setAgentEnabled(ats, false);
  a.lastMessage = 'Paused';
  emit({ type: 'agent', ats, message: 'Paused', at: new Date().toISOString(), level: 'warn' });
  emitAgents();
}

export async function stopAgent(ats: string): Promise<void> {
  const a = ensureAgent(ats);
  a.stopRequested = true;
  a.paused = false;
  a.running = false;
  a.queue = [];
  await setAgentEnabled(ats, false);
  a.lastMessage = 'Stopped';
  emit({ type: 'agent', ats, message: 'Stopped', at: new Date().toISOString(), level: 'warn' });
  emitAgents();
}

export async function toggleAgent(ats: string): Promise<void> {
  const a = ensureAgent(ats);
  if (a.running && !a.paused) {
    await pauseAgent(ats);
    return;
  }
  await startAgent(ats);
}

export async function startRotation(): Promise<void> {
  const queue = await rotationQueue();
  if (queue.length === 0) {
    throw new Error('No scrapeable platforms with enabled board tokens');
  }

  if (rotation.active && !rotation.paused && rotation.currentAts) {
    const cur = ensureAgent(rotation.currentAts);
    if (cur.running && !cur.paused) return;
  }

  rotation.active = true;
  rotation.paused = false;

  if (rotation.currentAts) {
    const stillInQueue = queue.some(p => p.slug === rotation.currentAts);
    if (stillInQueue) {
      const a = ensureAgent(rotation.currentAts);
      if ((a.running && a.paused) || !a.running) {
        await startAgent(rotation.currentAts);
        emitAgents();
        return;
      }
    }
  }

  rotation.cycle = rotation.cycle || 1;
  rotation.currentAts = queue[0].slug;
  emit({
    type: 'log',
    message: `Rotation started — ${queue[0].label} first (cycle ${rotation.cycle})`,
    at: new Date().toISOString(),
    level: 'info',
  });
  await startAgent(queue[0].slug);
  emitAgents();
}

export async function pauseRotation(): Promise<void> {
  if (!rotation.active) return;
  rotation.paused = true;
  if (rotation.currentAts) await pauseAgent(rotation.currentAts);
  emit({
    type: 'log',
    message: 'Rotation paused',
    at: new Date().toISOString(),
    level: 'warn',
  });
  emitAgents();
}

export async function stopRotation(): Promise<void> {
  const wasActive = rotation.active;
  rotation.active = false;
  rotation.paused = false;
  if (rotation.currentAts) await stopAgent(rotation.currentAts);
  rotation.currentAts = null;
  if (wasActive) {
    emit({
      type: 'log',
      message: 'Rotation stopped',
      at: new Date().toISOString(),
      level: 'warn',
    });
  }
  emitAgents();
}

export async function toggleRotation(): Promise<void> {
  if (rotation.active && !rotation.paused) {
    await pauseRotation();
    return;
  }
  await startRotation();
}

function finishAgent(ats: string): void {
  const a = ensureAgent(ats);
  a.running = false;
  a.paused = false;
  void setAgentEnabled(ats, false);
  a.lastMessage = `Finished — ${a.doneTokens} tokens, ${a.jobsFound} jobs, ${a.jobsPruned} pruned, ${a.errors} errors`;
  emit({
    type: 'agent',
    ats,
    message: a.lastMessage,
    at: new Date().toISOString(),
    level: 'success',
  });
  emitAgentsNow();
  void advanceRotation(ats);
}

async function advanceRotation(finishedAts: string): Promise<void> {
  if (!rotation.active || rotation.paused) return;
  if (rotation.currentAts !== finishedAts) return;

  const queue = await rotationQueue();
  if (queue.length === 0) {
    emit({
      type: 'log',
      message: 'Rotation idle — no scrapeable platforms with enabled tokens',
      at: new Date().toISOString(),
      level: 'warn',
    });
    emitAgents();
    return;
  }

  const idx = queue.findIndex(p => p.slug === finishedAts);
  let nextIdx = idx + 1;
  if (nextIdx >= queue.length || idx < 0) {
    nextIdx = 0;
    rotation.cycle += 1;
    emit({
      type: 'log',
      message: `Full cycle complete — starting cycle ${rotation.cycle}`,
      at: new Date().toISOString(),
      level: 'success',
    });
  }

  const next = queue[nextIdx];
  rotation.currentAts = next.slug;
  emit({
    type: 'log',
    message: `Moving to ${next.label} (${next.slug}) — cycle ${rotation.cycle}`,
    at: new Date().toISOString(),
    level: 'info',
  });
  emitAgents();
  try {
    await startAgent(next.slug);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    emit({
      type: 'log',
      ats: next.slug,
      message: `Failed to start ${next.slug}: ${message} — skipping`,
      at: new Date().toISOString(),
      level: 'error',
    });
    setTimeout(() => void advanceRotation(next.slug), 0);
  }
}

async function processToken(ats: string, boardToken: string): Promise<void> {
  const a = ensureAgent(ats);
  const platform = await getPlatformConfig(ats);
  if (!platform.list_url_template) throw new Error('Platform not scrapeable');

  a.currentToken = boardToken;
  a.activeTokens = a.inFlight.size;
  emitAgents();

  try {
    const { jobs, logoUrl: listLogo } = await scrapeBoard(
      platform as PlatformConfig,
      boardToken,
    );
    let storedLogo: string | null = null;
    const hasLogo = await boardHasLogo(ats, boardToken);

    if (!hasLogo) {
      try {
        const remote = await resolveBoardLogoUrl(ats, boardToken, listLogo);
        if (remote) {
          storedLogo = (await cacheRemoteLogo(ats, boardToken, remote)) || remote;
          await updateBoardLogo(ats, boardToken, storedLogo);
          a.lastMessage = `${boardToken}: logo saved`;
        }
      } catch {
        /* logo optional */
      }
    } else {
      storedLogo = await getBoardLogoUrl(ats, boardToken);
    }

    const { upserted, pruned } = await upsertJobsAndPruneMissing(
      ats,
      boardToken,
      jobs,
      storedLogo,
    );
    a.jobsFound += upserted;
    a.jobsPruned += pruned;
    await updateBoardScrapeResult(ats, boardToken, 'ok', null, upserted);
    a.lastMessage = `${boardToken}: +${upserted} jobs, pruned ${pruned}`;

    emit({
      type: 'token',
      ats,
      board_token: boardToken,
      message: a.lastMessage,
      at: new Date().toISOString(),
      level: 'success',
    });
  } catch (err) {
    a.errors += 1;
    const message = err instanceof Error ? err.message : String(err);
    await updateBoardScrapeResult(ats, boardToken, 'error', message, 0);
    a.lastMessage = `${boardToken}: ${message}`;
    emit({
      type: 'token',
      ats,
      board_token: boardToken,
      message: a.lastMessage,
      at: new Date().toISOString(),
      level: 'error',
    });
  } finally {
    a.inFlight.delete(boardToken);
    a.doneTokens += 1;
    a.activeTokens = a.inFlight.size;
    a.currentToken = Array.from(a.inFlight)[0] ?? null;
    emitAgents();
  }
}

function pump(ats: string): void {
  const a = ensureAgent(ats);
  if (!a.running || a.paused || a.stopRequested) return;

  while (a.inFlight.size < a.concurrency && a.queue.length > 0) {
    const token = a.queue.shift()!;
    a.inFlight.add(token);
    void processToken(ats, token).then(() => {
      if (a.stopRequested) return;
      if (a.queue.length === 0 && a.inFlight.size === 0) {
        finishAgent(ats);
      } else {
        pump(ats);
      }
    });
  }

  emitAgents();
}
