import { Router } from 'express';
import { chatWithFeli } from '../controllers/ai.controller';

const router = Router();

router.post('/chat', chatWithFeli);

export default router;
