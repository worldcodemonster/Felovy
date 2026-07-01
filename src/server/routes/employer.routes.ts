import { Router } from 'express';
import { authenticate, requireRole, asHandler } from '../middlewares/auth.middleware';
import { multiUpload, singleUpload } from '../middlewares/upload.middleware';
import {
  getMyProfile, updateProfileStep2, updateProfileStep3,
  updateProfileStep4, getEmployerProfile,
} from '../controllers/employer.controller';

const router = Router();

router.use(authenticate);

router.post('/me', requireRole('EMPLOYER'), asHandler(getMyProfile));
router.put('/me/step2', requireRole('EMPLOYER'), asHandler(updateProfileStep2));
router.put('/me/step3', requireRole('EMPLOYER'),
  multiUpload([
    { name: 'companyLogo', maxCount: 1 },
    { name: 'companyBrand', maxCount: 1 },
    { name: 'companyAdImages', maxCount: 5 },
    { name: 'contactPhoto', maxCount: 1 },
    { name: 'introVideo', maxCount: 1 },
  ]),
  asHandler(updateProfileStep3),
);
router.put('/me/step4', requireRole('EMPLOYER'), singleUpload('idCard'), asHandler(updateProfileStep4));
router.post('/:id', requireRole('EMPLOYER', 'DEVELOPER', 'OWNER'), asHandler(getEmployerProfile));

export default router;
