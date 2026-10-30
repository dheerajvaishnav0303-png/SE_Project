import { Router } from 'express';
import {
  getUserGoals,
  createGoal,
  deleteGoal,
  topUpGoal,
  rebalanceGoalToDebt,
} from '../controllers/goalController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateMiddleware.js';
import { createGoalSchema } from '../validators/financialValidators.js';

const router = Router();

router.use(protect);

router.get('/', getUserGoals);
router.post('/', validateRequest({ body: createGoalSchema }), createGoal);
router.delete('/:id', deleteGoal);
router.post('/:id/top-up', topUpGoal);
router.post('/:id/rebalance', rebalanceGoalToDebt);

export default router;
