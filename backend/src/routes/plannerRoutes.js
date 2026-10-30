import { Router } from 'express';
import { getPlannerSummary, getAdvisoryPlan } from '../controllers/plannerController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/summary', protect, getPlannerSummary);
router.get('/plan', protect, getAdvisoryPlan);

export default router;

