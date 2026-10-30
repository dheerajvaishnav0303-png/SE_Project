import { Router } from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  setup2FA,
  verify2FA,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimitMiddleware.js';
import { validateRequest } from '../middleware/validateMiddleware.js';
import {
  registerSchema,
  loginSchema,
  twoFactorVerifySchema,
} from '../validators/authValidators.js';

const router = Router();

// Public Authentication Endpoints
router.post('/register', authLimiter, validateRequest({ body: registerSchema }), register);
router.post('/login', authLimiter, validateRequest({ body: loginSchema }), login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);

// Authenticated User Session Endpoints
router.get('/me', protect, getMe);
router.post('/2fa/setup', protect, setup2FA);
router.post('/2fa/verify', protect, validateRequest({ body: twoFactorVerifySchema }), verify2FA);

export default router;

