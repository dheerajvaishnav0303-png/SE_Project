import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

function createRateLimitResponse(req, res, retryAfterSeconds, message) {
  res.status(429).json({
    type: 'https://api.ips-wealth.com/errors/rate-limit-exceeded',
    title: 'Too Many Requests',
    status: 429,
    detail: message,
    instance: req.originalUrl,
    retryAfterSeconds,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Strict rate limiter for Authentication endpoints (Login, Register, 2FA verify)
 * 5 attempts per 15 minutes per IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req, res, _next, options) => {
    const retryAfterSeconds = Math.ceil(options.windowMs / 1000);
    createRateLimitResponse(
      req,
      res,
      retryAfterSeconds,
      'Maximum authentication attempts exceeded. Please try again after 15 minutes.'
    );
  },
});

/**
 * High-value financial mutations rate limiter (Transactions, Redemptions, Mandates)
 * 30 requests per 1 minute
 */
export const mutationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip || 'anonymous',
  handler: (req, res, _next, options) => {
    const retryAfterSeconds = Math.ceil(options.windowMs / 1000);
    createRateLimitResponse(
      req,
      res,
      retryAfterSeconds,
      'Transaction mutation rate limit exceeded. Please wait a moment before retrying.'
    );
  },
});

/**
 * Global API rate limiter for standard reads & queries
 * 200 requests per 15 minutes
 */
export const globalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000,
  max: env.RATE_LIMIT_MAX || 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, _next, options) => {
    const retryAfterSeconds = Math.ceil(options.windowMs / 1000);
    createRateLimitResponse(
      req,
      res,
      retryAfterSeconds,
      'Global request quota exceeded. Please reduce request frequency.'
    );
  },
});

