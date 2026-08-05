import { Router } from 'express';
import { asHandler } from '../middlewares/auth.middleware';
import { requireJobBoardIngestKey } from '../middlewares/job-board-auth.middleware';
import {
  boardJobFiltersHandler,
  boardJobHealthHandler,
  getBoardJobHandler,
  ingestBoardJobsHandler,
  listBoardJobsHandler,
} from '../controllers/board-job.controller';

const router = Router();

router.get('/health', asHandler(boardJobHealthHandler));
router.post('/list', asHandler(listBoardJobsHandler));
router.post('/filters', asHandler(boardJobFiltersHandler));
router.post('/ingest', requireJobBoardIngestKey, asHandler(ingestBoardJobsHandler));
router.post('/:id', asHandler(getBoardJobHandler));

export default router;
