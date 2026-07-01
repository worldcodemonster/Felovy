import { Router } from 'express';
import { authenticate, requireRole, asHandler } from '../middlewares/auth.middleware';
import {
  startConversation, startDirectConversation, getMessages,
  sendMessage, toggleBlock, getMyConversations,
} from '../controllers/message.controller';

const router = Router();

router.use(authenticate);

router.post('/conversations', asHandler(getMyConversations));
router.post('/conversations/:applicationId/start', requireRole('EMPLOYER'), asHandler(startConversation));
router.post('/direct/:developerId', requireRole('EMPLOYER', 'OWNER'), asHandler(startDirectConversation));
router.post('/conversations/:conversationId/messages/list', asHandler(getMessages));
router.post('/conversations/:conversationId/messages', requireRole('DEVELOPER', 'EMPLOYER', 'OWNER'), asHandler(sendMessage));
router.patch('/conversations/:conversationId/block', requireRole('EMPLOYER'), asHandler(toggleBlock));

export default router;
