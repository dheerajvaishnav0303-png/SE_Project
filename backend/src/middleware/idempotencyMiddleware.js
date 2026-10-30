import { redis } from '../config/redis.js';
import { logger } from '../utils/logger.js';

const IDEMPOTENCY_TTL_SECONDS = 86400; // 24 hours retention
const LOCK_TIMEOUT_SECONDS = 120; // 2 minutes in-flight lock

/**
 * Middleware that guarantees idempotent execution for state-mutating requests.
 * Reads X-Idempotency-Key header.
 */
export function idempotencyGuard(options = { required: true }) {
  return async (req, res, next) => {
    // Only apply to mutating HTTP methods
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      return next();
    }

    const idempotencyKey = req.headers['x-idempotency-key'];

    if (!idempotencyKey) {
      if (options.required) {
        return res.status(400).json({
          type: 'https://api.ips-wealth.com/errors/missing-idempotency-key',
          title: 'Missing Idempotency-Key Header',
          status: 400,
          detail: 'Mutating financial endpoints mandate an X-Idempotency-Key header (UUIDv4) to prevent duplicate processing.',
          instance: req.originalUrl,
          timestamp: new Date().toISOString(),
        });
      }
      return next();
    }

    const userId = req.user?._id?.toString() || 'anonymous';
    const redisKey = `idemp:${userId}:${idempotencyKey}`;

    try {
      // 1. Check if key already exists
      const cached = await redis.get(redisKey);

      if (cached) {
        let entry;
        try {
          entry = JSON.parse(cached);
        } catch {
          entry = null;
        }

        if (entry?.status === 'IN_PROGRESS') {
          return res.status(409).json({
            type: 'https://api.ips-wealth.com/errors/concurrent-mutation',
            title: 'Concurrent Request In-Flight',
            status: 409,
            detail: 'A mutation with this X-Idempotency-Key is currently being processed. Please await completion.',
            instance: req.originalUrl,
            timestamp: new Date().toISOString(),
          });
        }

        if (entry?.status === 'COMPLETED') {
          logger.info({ idempotencyKey, userId }, 'Serving cached idempotent response.');
          res.setHeader('X-Cache-Lookup', 'HIT-IDEMPOTENT');
          res.setHeader('Content-Type', 'application/json');
          return res.status(entry.statusCode || 200).send(entry.body);
        }
      }

      // 2. Acquire in-flight lock atomically
      const acquired = await redis.set(
        redisKey,
        JSON.stringify({ status: 'IN_PROGRESS', startedAt: Date.now() }),
        'EX',
        LOCK_TIMEOUT_SECONDS,
        'NX'
      );

      if (!acquired && acquired !== 'OK') {
        return res.status(409).json({
          type: 'https://api.ips-wealth.com/errors/concurrent-mutation',
          title: 'Concurrent Request In-Flight',
          status: 409,
          detail: 'Another process acquired the idempotency lock for this key.',
          instance: req.originalUrl,
          timestamp: new Date().toISOString(),
        });
      }

      // 3. Intercept response to cache upon completion
      const originalSend = res.send.bind(res);

      res.send = (body) => {
        // Only cache successful or client error responses (don't lock 5xx errors forever)
        if (res.statusCode < 500) {
          redis.set(
            redisKey,
            JSON.stringify({
              status: 'COMPLETED',
              statusCode: res.statusCode,
              body,
              completedAt: Date.now(),
            }),
            'EX',
            IDEMPOTENCY_TTL_SECONDS
          ).catch((err) => {
            logger.error({ err, idempotencyKey }, 'Failed to cache completed idempotency record.');
          });
        } else {
          // Allow client retry on server 500 error
          redis.del(redisKey).catch(() => {});
        }

        return originalSend(body);
      };

      return next();
    } catch (err) {
      logger.error({ err, idempotencyKey }, 'Idempotency middleware encountered an internal error.');
      // If redis fails, do not block the financial pipeline
      return next();
    }
  };
}

