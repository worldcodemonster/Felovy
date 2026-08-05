import { probeBoardToken, type PlatformConfig } from '../scraper/fetchBoard';
import { boardSearchEvents } from './board-search-events';
import {
  getPlatformConfig,
  getPlatform,
  listPlatforms,
} from './board-platform.service';
import {
  addBoardToken,
  addBoardTokensBatch,
  deleteBoardToken,
  listAllBoardTokens,
} from './board-token.service';
import type { TokenVerifyProgress, TokenVerifyResult } from '@/lib/board-search-types';

const DEFAULT_CONCURRENCY = 20;
const MAX_CONCURRENCY = 100;
const FLUSH_EVERY = 10_000;

const ATS_MAX_CONCURRENCY: Record<string, number> = {
  greenhouse: 25,
  smartrecruiters: 30,
  ashby: 35,
  lever: 45,
  bamboohr: 60,
  breezy_hr: 60,
};

let activeJob: { stop: boolean } | null = null;

function clampConcurrency(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_CONCURRENCY;
  return Math.max(1, Math.min(MAX_CONCURRENCY, Math.floor(n)));
}

function maxConcurrencyForAts(ats: string): number {
  const mapped = ATS_MAX_CONCURRENCY[ats];
  if (mapped) return clampConcurrency(mapped);
  return clampConcurrency(40);
}

async function resolveConcurrency(ats: string, override?: number): Promise<number> {
  if (override != null) return clampConcurrency(override);
  const p = await getPlatform(ats);
  const fromPlatform = Number(p?.concurrency);
  return clampConcurrency(fromPlatform > 0 ? fromPlatform : DEFAULT_CONCURRENCY);
}

async function platformConfig(ats: string): Promise<PlatformConfig & { label: string }> {
  const p = await getPlatform(ats);
  if (!p) throw new Error(`Unknown platform: ${ats}`);
  if (!p.listUrlTemplate) throw new Error(`Platform ${ats} is not scrapeable`);
  const cfg = await getPlatformConfig(ats);
  return { ...cfg, label: p.label };
}

function normalizeTokenList(rawTokens: string[]): {
  tokens: string[];
  skippedEmpty: number;
  skippedDupInFile: number;
} {
  const seen = new Set<string>();
  const tokens: string[] = [];
  let skippedEmpty = 0;
  let skippedDupInFile = 0;
  for (const raw of rawTokens) {
    const token = String(raw ?? '').trim().toLowerCase();
    if (!token) {
      skippedEmpty += 1;
      continue;
    }
    if (seen.has(token)) {
      skippedDupInFile += 1;
      continue;
    }
    seen.add(token);
    tokens.push(token);
  }
  return { tokens, skippedEmpty, skippedDupInFile };
}

async function runPool<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
  shouldStop: () => boolean,
): Promise<void> {
  const limit = clampConcurrency(concurrency);
  let next = 0;
  const runners = Array.from({ length: Math.min(limit, Math.max(1, items.length)) }, async () => {
    while (true) {
      if (shouldStop()) return;
      const i = next++;
      if (i >= items.length) return;
      await worker(items[i]);
    }
  });
  await Promise.all(runners);
}

function emitProgress(progress: TokenVerifyProgress): void {
  boardSearchEvents.emitProgress(progress);
}

export function isTokenVerifyRunning(): boolean {
  return activeJob !== null;
}

export function cancelTokenVerify(): void {
  if (activeJob) activeJob.stop = true;
}

export async function addVerifiedBoardToken(ats: string, token: string): Promise<void> {
  const platform = await platformConfig(ats);
  const normalized = token.trim().toLowerCase();
  if (!normalized) throw new Error('board_token is required');
  const probe = await probeBoardToken(platform, normalized);
  if (!probe.ok) {
    throw new Error(`Invalid board token "${normalized}"${probe.error ? ` (${probe.error})` : ''}`);
  }
  const existing = new Set((await listAllBoardTokens(ats)).map(t => t.toLowerCase()));
  if (existing.has(normalized)) {
    throw new Error(`Token already exists for ${ats}: ${normalized}`);
  }
  await addBoardToken(ats, normalized);
}

export async function verifyExistingBoardTokens(
  ats: string,
  concurrencyOverride?: number,
): Promise<TokenVerifyResult> {
  if (activeJob) throw new Error('A token verify/import is already running');

  const platform = await platformConfig(ats);
  const concurrency = await resolveConcurrency(ats, concurrencyOverride);
  const tokens = await listAllBoardTokens(ats);
  const ctrl = { stop: false };
  activeJob = ctrl;

  let checked = 0;
  let valid = 0;
  let invalid = 0;
  let removed = 0;
  let inFlight = 0;
  let lastEmit = 0;

  const progress = (extra?: Partial<TokenVerifyProgress>): TokenVerifyProgress => ({
    mode: 'verify',
    ats,
    atsLabel: platform.label,
    atsIndex: 1,
    atsTotal: 1,
    total: tokens.length,
    checked,
    valid,
    invalid,
    added: 0,
    skippedExisting: 0,
    skippedEmpty: 0,
    skippedDupInFile: 0,
    flowAdded: 0,
    flowInvalid: 0,
    flowSkippedExisting: 0,
    concurrency,
    active: inFlight,
    currentToken: null,
    running: true,
    finished: false,
    cancelled: false,
    message: null,
    ...extra,
  });

  const maybeEmit = (force: boolean, extra?: Partial<TokenVerifyProgress>): void => {
    const now = Date.now();
    if (!force && now - lastEmit < 80) return;
    lastEmit = now;
    emitProgress(progress(extra));
  };

  emitProgress(
    progress({
      message: `Verifying ${tokens.length.toLocaleString()} tokens with ${concurrency} concurrent APIs…`,
    }),
  );

  try {
    await runPool(
      tokens,
      concurrency,
      async token => {
        if (ctrl.stop) return;
        inFlight += 1;
        maybeEmit(false, { currentToken: token });
        try {
          const probe = await probeBoardToken(platform, token);
          checked += 1;
          if (probe.ok) {
            valid += 1;
          } else {
            invalid += 1;
            try {
              await deleteBoardToken(ats, token);
              removed += 1;
            } catch {
              /* ignore */
            }
          }
          maybeEmit(checked === tokens.length || !probe.ok, {
            currentToken: token,
            message: probe.ok
              ? `Valid: ${token}`
              : `Removed invalid: ${token}${probe.error ? ` (${probe.error})` : ''}`,
          });
        } finally {
          inFlight -= 1;
        }
      },
      () => ctrl.stop,
    );

    const cancelled = ctrl.stop;
    const result: TokenVerifyResult = {
      mode: 'verify',
      ats,
      total: tokens.length,
      checked,
      valid,
      invalid,
      removed,
      added: 0,
      skippedExisting: 0,
      skippedEmpty: 0,
      skippedDupInFile: 0,
      concurrency,
      cancelled,
    };
    emitProgress(
      progress({
        active: 0,
        running: false,
        finished: true,
        cancelled,
        currentToken: null,
        message: cancelled
          ? `Cancelled · removed ${removed.toLocaleString()} invalid`
          : `Done · ${valid.toLocaleString()} valid · removed ${removed.toLocaleString()} invalid`,
      }),
    );
    return result;
  } finally {
    activeJob = null;
  }
}

export async function importAndVerifyBoardTokens(
  ats: string,
  rawTokens: string[],
  concurrencyOverride?: number,
): Promise<TokenVerifyResult> {
  if (activeJob) throw new Error('A token verify/import is already running');

  const { tokens, skippedEmpty, skippedDupInFile } = normalizeTokenList(rawTokens);
  const platform = await platformConfig(ats);
  const concurrency = await resolveConcurrency(ats, concurrencyOverride);
  const ctrl = { stop: false };
  activeJob = ctrl;

  const existing = new Set((await listAllBoardTokens(ats)).map(t => t.toLowerCase()));

  let checked = 0;
  let valid = 0;
  let invalid = 0;
  let added = 0;
  let skippedExisting = 0;
  let inFlight = 0;
  let lastEmit = 0;
  let pendingAdds: string[] = [];
  let checksSinceFlush = 0;

  const flushPending = async (): Promise<void> => {
    if (!pendingAdds.length) return;
    const batch = pendingAdds;
    pendingAdds = [];
    const n = await addBoardTokensBatch(ats, batch);
    added += n;
    for (const t of batch) existing.add(t);
  };

  const progress = (extra?: Partial<TokenVerifyProgress>): TokenVerifyProgress => ({
    mode: 'import',
    ats,
    atsLabel: platform.label,
    atsIndex: 1,
    atsTotal: 1,
    total: tokens.length,
    checked,
    valid,
    invalid,
    added,
    skippedExisting,
    skippedEmpty,
    skippedDupInFile,
    flowAdded: added,
    flowInvalid: invalid,
    flowSkippedExisting: skippedExisting,
    concurrency,
    active: inFlight,
    currentToken: null,
    running: true,
    finished: false,
    cancelled: false,
    message: null,
    ...extra,
  });

  const maybeEmit = (force: boolean, extra?: Partial<TokenVerifyProgress>): void => {
    const now = Date.now();
    if (!force && now - lastEmit < 80) return;
    lastEmit = now;
    emitProgress(progress(extra));
  };

  emitProgress(
    progress({
      message: `Importing ${tokens.length.toLocaleString()} tokens (${concurrency} concurrent)…`,
    }),
  );

  try {
    await runPool(
      tokens,
      concurrency,
      async token => {
        if (ctrl.stop) return;

        if (existing.has(token)) {
          checked += 1;
          skippedExisting += 1;
          maybeEmit(false, { currentToken: token });
          return;
        }

        inFlight += 1;
        maybeEmit(false, { currentToken: token });
        try {
          const probe = await probeBoardToken(platform, token);
          checked += 1;
          checksSinceFlush += 1;
          if (probe.ok) {
            valid += 1;
            pendingAdds.push(token);
            if (pendingAdds.length >= 500 || checksSinceFlush >= FLUSH_EVERY) {
              checksSinceFlush = 0;
              await flushPending();
            }
          } else {
            invalid += 1;
          }
          maybeEmit(checked === tokens.length, {
            currentToken: token,
            message: probe.ok ? `Added candidate: ${token}` : `Invalid: ${token}`,
          });
        } finally {
          inFlight -= 1;
        }
      },
      () => ctrl.stop,
    );

    await flushPending();

    const cancelled = ctrl.stop;
    const result: TokenVerifyResult = {
      mode: 'import',
      ats,
      total: tokens.length,
      checked,
      valid,
      invalid,
      added,
      skippedExisting,
      skippedEmpty,
      skippedDupInFile,
      concurrency,
      cancelled,
    };
    emitProgress(
      progress({
        active: 0,
        running: false,
        finished: true,
        cancelled,
        currentToken: null,
        message: cancelled
          ? `Cancelled · added ${added.toLocaleString()}`
          : `Done · added ${added.toLocaleString()} · invalid ${invalid.toLocaleString()} · already in DB ${skippedExisting.toLocaleString()}`,
      }),
    );
    return result;
  } finally {
    activeJob = null;
  }
}

export async function importAndVerifyAllAts(
  rawTokens: string[],
  concurrencyOverride?: number,
): Promise<{
  cancelled: boolean;
  platformsDone: number;
  platformsTotal: number;
  added: number;
  invalid: number;
  skippedExisting: number;
  skippedEmpty: number;
  skippedDupInFile: number;
  results: TokenVerifyResult[];
}> {
  if (activeJob) throw new Error('A token verify/import is already running');

  const platforms = (await listPlatforms()).filter(p => p.scrapeable && p.list_url_template);
  if (!platforms.length) throw new Error('No scrapeable ATS platforms found');

  const { tokens, skippedEmpty, skippedDupInFile } = normalizeTokenList(rawTokens);
  const results: TokenVerifyResult[] = [];
  let flowAdded = 0;
  let flowInvalid = 0;
  let flowSkippedExisting = 0;
  let cancelled = false;

  for (let i = 0; i < platforms.length; i++) {
    if (cancelled) break;
    const p = platforms[i];
    const result = await importAndVerifyBoardTokens(p.slug, tokens, concurrencyOverride);
    results.push(result);
    flowAdded += result.added;
    flowInvalid += result.invalid ?? 0;
    flowSkippedExisting += result.skippedExisting;
    if (result.cancelled) {
      cancelled = true;
      break;
    }
  }

  return {
    cancelled,
    platformsDone: results.length,
    platformsTotal: platforms.length,
    added: flowAdded,
    invalid: flowInvalid,
    skippedExisting: flowSkippedExisting,
    skippedEmpty,
    skippedDupInFile,
    results,
  };
}
