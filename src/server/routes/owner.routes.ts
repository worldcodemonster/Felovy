import { Router } from 'express';
import { authenticate, requireRole, asHandler } from '../middlewares/auth.middleware';
import {
  getDashboardStats, listUsers, moderateUser,
  listAllDevelopers, listAllEmployers, listAllJobs,
  reviewJobOwner, verifyDeveloper, verifyEmployer,
  deleteDevelopers,
  generateBotDevelopers,
  generateBotDevelopersStream,
  generateHomeCarouselBotsStream,
  listPortraitProviders,
  syncBotDeveloperPasswords,
  syncDeveloperLocations,
} from '../controllers/owner.controller';

const router = Router();

router.use(authenticate);
router.use(requireRole('OWNER'));

router.post('/stats', asHandler(getDashboardStats));
router.post('/users', asHandler(listUsers));
router.post('/moderate', asHandler(moderateUser));
router.post('/developers', asHandler(listAllDevelopers));
router.post('/developers/delete', asHandler(deleteDevelopers));
router.post('/developers/bot/providers', asHandler(listPortraitProviders));
router.post('/developers/bot/sync-passwords', asHandler(syncBotDeveloperPasswords));
router.post('/developers/sync-locations', asHandler(syncDeveloperLocations));
router.post('/developers/bot/home-carousel', asHandler(generateHomeCarouselBotsStream));
router.post('/developers/bot', asHandler(generateBotDevelopers));
router.post('/developers/bot/stream', asHandler(generateBotDevelopersStream));
router.post('/employers', asHandler(listAllEmployers));
router.post('/jobs', asHandler(listAllJobs));
router.patch('/jobs/:id/review', asHandler(reviewJobOwner));
router.post('/verify/developer', asHandler(verifyDeveloper));
router.post('/verify/employer', asHandler(verifyEmployer));

export default router;
