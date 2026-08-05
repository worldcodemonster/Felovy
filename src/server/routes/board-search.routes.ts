import { Router } from 'express';
import { authenticate, authenticateQueryOrHeader, requireRole, asHandler } from '../middlewares/auth.middleware';
import {
  initBoardSearch,
  forceImportCatalog,
  purgeExcluded,
  getPlatforms,
  reorderPlatformsHandler,
  movePlatformHandler,
  setPlatformConcurrencyHandler,
  searchTokens,
  addToken,
  importTokens,
  importTokensAllAts,
  verifyTokens,
  cancelVerify,
  verifyStatus,
  setTokenEnabled,
  removeToken,
  getScrapeAgents,
  setScrapeConcurrency,
  scrapeStart,
  scrapePause,
  scrapeStop,
  scrapeToggle,
  rotationStart,
  rotationPause,
  rotationStop,
  rotationToggle,
  scrapeEventsStream,
  migrateFromSqlite,
} from '../controllers/board-search.controller';

const router = Router();

router.get(
  '/scrape/events',
  authenticateQueryOrHeader,
  requireRole('OWNER'),
  asHandler(scrapeEventsStream),
);

router.use(authenticate);
router.use(requireRole('OWNER'));

router.post('/init', asHandler(initBoardSearch));
router.post('/catalog/import', asHandler(forceImportCatalog));
router.post('/catalog/purge-excluded', asHandler(purgeExcluded));
router.post('/platforms', asHandler(getPlatforms));
router.post('/platforms/reorder', asHandler(reorderPlatformsHandler));
router.post('/platforms/move', asHandler(movePlatformHandler));
router.post('/platforms/concurrency', asHandler(setPlatformConcurrencyHandler));

router.post('/tokens/search', asHandler(searchTokens));
router.post('/tokens/add', asHandler(addToken));
router.post('/tokens/import', asHandler(importTokens));
router.post('/tokens/import-all', asHandler(importTokensAllAts));
router.post('/tokens/verify', asHandler(verifyTokens));
router.post('/tokens/verify/cancel', asHandler(cancelVerify));
router.post('/tokens/verify/status', asHandler(verifyStatus));
router.post('/tokens/enable', asHandler(setTokenEnabled));
router.post('/tokens/delete', asHandler(removeToken));

router.post('/scrape/agents', asHandler(getScrapeAgents));
router.post('/scrape/concurrency', asHandler(setScrapeConcurrency));
router.post('/scrape/start', asHandler(scrapeStart));
router.post('/scrape/pause', asHandler(scrapePause));
router.post('/scrape/stop', asHandler(scrapeStop));
router.post('/scrape/toggle', asHandler(scrapeToggle));
router.post('/scrape/rotation/start', asHandler(rotationStart));
router.post('/scrape/rotation/pause', asHandler(rotationPause));
router.post('/scrape/rotation/stop', asHandler(rotationStop));
router.post('/scrape/rotation/toggle', asHandler(rotationToggle));

router.post('/migrate/sqlite', asHandler(migrateFromSqlite));

export default router;
