import { Router } from 'express';
import {
  getUserSips,
  createSip,
  updateSipStatus,
  processDueSips,
  skipNextSipMonth,
  modifySip,
  executeSipNow,
} from '../controllers/sipController.js';
import { protect, requireAdmin } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateMiddleware.js';
import { createSipSchema } from '../validators/financialValidators.js';

const router = Router();

router.use(protect);

router.get('/', getUserSips);
router.post('/', validateRequest({ body: createSipSchema }), createSip);
router.patch('/:id/status', updateSipStatus);
router.post('/:id/skip-month', skipNextSipMonth);
router.patch('/:id/modify', modifySip);
router.post('/:id/execute-now', executeSipNow);
router.post('/execute-due', requireAdmin, processDueSips);

export default router;
