import { Router } from 'express';
import { authenticate, requireRole, asHandler } from '../middlewares/auth.middleware';
import { singleUpload } from '../middlewares/upload.middleware';
import {
  createJob, listJobs, getJob, updateJob, deleteJob,
  reviewJob, toggleFavorite, listMyJobs,
} from '../controllers/job.controller';

const router = Router();

// Public routes — POST /list avoids conflict with POST / (createJob)
router.post('/list', listJobs);
router.post('/:id', getJob);

// Authenticated routes
router.use(authenticate);
router.post('/', requireRole('EMPLOYER'), singleUpload('logo'), asHandler(createJob));
router.post('/employer/mine', requireRole('EMPLOYER'), asHandler(listMyJobs));
router.put('/:id', requireRole('EMPLOYER'), singleUpload('logo'), asHandler(updateJob));
router.delete('/:id', requireRole('EMPLOYER'), asHandler(deleteJob));
router.post('/:id/favorite', requireRole('DEVELOPER', 'EMPLOYER'), asHandler(toggleFavorite));

// Admin routes
router.patch('/:id/review', requireRole('OWNER'), asHandler(reviewJob));

export default router;
