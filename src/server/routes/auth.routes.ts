import { Router } from 'express';
import {
  initiateSignup, verifySignupOtp, resendSignupOtp, signin, refresh,
  initiateEmailChange, verifyEmailChange, changePassword,
} from '../controllers/auth.controller';
import { authenticate, asHandler } from '../middlewares/auth.middleware';

const router = Router();

router.post('/signup/initiate', initiateSignup);
router.post('/signup/verify', verifySignupOtp);
router.post('/signup/resend', resendSignupOtp);
router.post('/signin', signin);
router.post('/refresh', refresh);

// Email & password changes (requires auth)
router.post('/email/change/initiate', authenticate, asHandler(initiateEmailChange));
router.post('/email/change/verify', authenticate, asHandler(verifyEmailChange));
router.post('/password/change', authenticate, asHandler(changePassword));

export default router;
