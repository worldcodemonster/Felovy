import { Router } from 'express';
import { authenticate, requireRole, asHandler } from '../middlewares/auth.middleware';
import { multiUpload, singleUpload } from '../middlewares/upload.middleware';
import {
  getMyProfile, updateProfileStep2, updateProfileStep3,
  updateProfileStep4, getDeveloperProfile, listDevelopers, searchDevelopers,
  getMapData,
} from '../controllers/developer.controller';

const router = Router();

// Public endpoints — no auth (must come before /:id)
router.post('/map', asHandler(getMapData));

// Fixed paths first so they're not shadowed by /:id
router.post('/me', authenticate, requireRole('DEVELOPER'), asHandler(getMyProfile));
router.put('/me/step2', authenticate, requireRole('DEVELOPER'), asHandler(updateProfileStep2));
router.put('/me/step3', authenticate, requireRole('DEVELOPER'),
  multiUpload([{ name: 'photo', maxCount: 1 }, { name: 'introVideo', maxCount: 1 }]),
  asHandler(updateProfileStep3),
);
router.put('/me/step4', authenticate, requireRole('DEVELOPER'), singleUpload('idCard'), asHandler(updateProfileStep4));

router.post('/search', authenticate, requireRole('EMPLOYER', 'OWNER'), asHandler(searchDevelopers));
router.post('/', asHandler(listDevelopers));

// Dynamic /:id is last and public — any authenticated or unauthenticated user can view a profile
router.post('/:id', asHandler(getDeveloperProfile));

export default router;
