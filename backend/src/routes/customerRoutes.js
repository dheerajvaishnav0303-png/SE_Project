import { Router } from 'express';
import {
  getCustomerHoldings,
  purchasePlan,
  redeemPlan,
  getCustomerTaxLots,
  linkInvestmentToGoal,
  updateUserProfile,
} from '../controllers/investmentController.js';
import { protect } from '../middleware/authMiddleware.js';
import { idempotencyGuard } from '../middleware/idempotencyMiddleware.js';
import { mutationLimiter } from '../middleware/rateLimitMiddleware.js';
import { validateRequest } from '../middleware/validateMiddleware.js';
import { purchaseSchema, redemptionSchema } from '../validators/financialValidators.js';

const router = Router();

// Protect all customer routes
router.use(protect);

router.get('/investments', getCustomerHoldings);
router.post(
  '/investments/purchase',
  mutationLimiter,
  idempotencyGuard({ required: true }),
  validateRequest({ body: purchaseSchema }),
  purchasePlan
);
router.post(
  '/investments/redeem',
  mutationLimiter,
  idempotencyGuard({ required: true }),
  validateRequest({ body: redemptionSchema }),
  redeemPlan
);
router.get('/investments/tax-lots', getCustomerTaxLots);
router.patch('/investments/:id/link-goal', linkInvestmentToGoal);
router.patch('/profile', updateUserProfile);

export default router;

