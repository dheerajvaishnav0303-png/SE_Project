import { Router } from 'express';
import { executeMtmValuation, executeScheduledSips } from '../controllers/cronController.js';
import { protect, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

export function verifyCronOrAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  // 1. Authorize via Vercel Cron Secret Bearer token
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    req.cronAuthorized = true;
    return next();
  }

  // 2. Authorize via logged-in Administrator fallback
  return protect(req, res, (err) => {
    if (err) return next(err);
    return requireAdmin(req, res, next);
  });
}

router.use(verifyCronOrAdmin);

// Vercel Cron Endpoints
router.get('/mtm-valuation', executeMtmValuation);
router.get('/execute-sips', executeScheduledSips);

export default router;

