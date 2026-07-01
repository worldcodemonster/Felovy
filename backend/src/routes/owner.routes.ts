import { Router } from 'express';
import { authenticate, requireRole, asHandler } from '../middlewares/auth.middleware';
import {
  getDashboardStats, listUsers, moderateUser,
  listAllDevelopers, listAllEmployers, listAllJobs,
  reviewJobOwner, verifyDeveloper, verifyEmployer,
} from '../controllers/owner.controller';

const router = Router();

router.use(authenticate);
router.use(requireRole('OWNER'));

router.post('/stats', asHandler(getDashboardStats));
router.post('/users', asHandler(listUsers));
router.post('/moderate', asHandler(moderateUser));
router.post('/developers', asHandler(listAllDevelopers));
router.post('/employers', asHandler(listAllEmployers));
router.post('/jobs', asHandler(listAllJobs));
router.patch('/jobs/:id/review', asHandler(reviewJobOwner));
router.post('/verify/developer', asHandler(verifyDeveloper));
router.post('/verify/employer', asHandler(verifyEmployer));

export default router;
