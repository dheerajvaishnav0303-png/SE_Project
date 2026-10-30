import { Router } from 'express';
import {
  getUserTransactions,
  depositFunds,
  withdrawFunds,
  getLedgerStatement,
  cancelPendingWithdrawal,
  exportTransactionsCsv,
} from '../controllers/transactionController.js';
import { protect, require2FA } from '../middleware/authMiddleware.js';
import { idempotencyGuard } from '../middleware/idempotencyMiddleware.js';
import { mutationLimiter } from '../middleware/rateLimitMiddleware.js';
import { validateRequest } from '../middleware/validateMiddleware.js';
import { depositSchema, withdrawalSchema } from '../validators/financialValidators.js';

const router = Router();

router.use(protect);

router.get('/', getUserTransactions);
router.get('/ledger', getLedgerStatement);
router.get('/export', exportTransactionsCsv);

router.post(
  '/deposit',
  mutationLimiter,
  idempotencyGuard({ required: true }),
  validateRequest({ body: depositSchema }),
  depositFunds
);

router.post(
  '/withdraw',
  mutationLimiter,
  require2FA,
  idempotencyGuard({ required: true }),
  validateRequest({ body: withdrawalSchema }),
  withdrawFunds
);

router.post(
  '/:id/cancel-pending',
  mutationLimiter,
  cancelPendingWithdrawal
);

export default router;
