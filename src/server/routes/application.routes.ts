import { Router } from 'express';
import { authenticate, requireRole, asHandler } from '../middlewares/auth.middleware';
import {
  applyToJob, getMyApplications, getJobApplications, updateApplicationStatus,
} from '../controllers/application.controller';

const router = Router();

router.use(authenticate);

router.post('/jobs/:jobId/apply', requireRole('DEVELOPER'), asHandler(applyToJob));
router.post('/mine', requireRole('DEVELOPER'), asHandler(getMyApplications));
router.post('/jobs/:jobId', requireRole('EMPLOYER'), asHandler(getJobApplications));
router.patch('/:id/status', requireRole('EMPLOYER'), asHandler(updateApplicationStatus));

export default router;
