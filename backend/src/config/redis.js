import Redis from 'ioredis';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

class InMemoryRedisFallback {
  constructor() {
    this.store = new Map();
    this.ttls = new Map();
    this.isFallback = true;
  }

  async get(key) {
    this._purgeExpired(key);
    return this.store.get(key) ?? null;
  }

  async set(key, value, ...args) {
    this._purgeExpired(key);
    const upperArgs = args.map((a) => String(a).toUpperCase());
    const isNx = upperArgs.includes('NX');
    const isXx = upperArgs.includes('XX');

    if (isNx && this.store.has(key)) {
      return null;
    }
    if (isXx && !this.store.has(key)) {
      return null;
    }

    this.store.set(key, String(value));

    for (let i = 0; i < args.length; i++) {
      const mode = String(args[i]).toUpperCase();
      if (mode === 'EX' && args[i + 1] !== undefined) {
        const duration = parseInt(args[i + 1], 10);
        if (!isNaN(duration)) this.ttls.set(key, Date.now() + duration * 1000);
      } else if (mode === 'PX' && args[i + 1] !== undefined) {
        const duration = parseInt(args[i + 1], 10);
        if (!isNaN(duration)) this.ttls.set(key, Date.now() + duration);
      }
    }
    return 'OK';
  }

  async setnx(key, value) {
    this._purgeExpired(key);
    if (this.store.has(key)) return 0;
    this.store.set(key, String(value));
    return 1;
  }

  async del(...keys) {
    let deletedCount = 0;
    for (const key of keys) {
      if (this.store.delete(key)) deletedCount++;
      this.ttls.delete(key);
    }
    return deletedCount;
  }

  async expire(key, seconds) {
    if (!this.store.has(key)) return 0;
    this.ttls.set(key, Date.now() + seconds * 1000);
    return 1;
  }

  async exists(...keys) {
    let count = 0;
    for (const key of keys) {
      this._purgeExpired(key);
      if (this.store.has(key)) count++;
    }
    return count;
  }

  _purgeExpired(key) {
    const expireAt = this.ttls.get(key);
    if (expireAt && Date.now() > expireAt) {
      this.store.delete(key);
      this.ttls.delete(key);
    }
  }

  async ping() {
    return 'PONG';
  }

  async quit() {
    this.store.clear();
    this.ttls.clear();
    return 'OK';
  }
}

let redisInstance = null;
const inMemoryFallback = global.inMemoryRedisStore || (global.inMemoryRedisStore = new InMemoryRedisFallback());
let usingFallback = false;

const redisUrl = env.REDIS_URL || process.env.REDIS_URL || '';

if (!redisUrl || redisUrl === 'none') {
  usingFallback = true;
  logger.info('REDIS_URL not configured. Operating in serverless in-memory fallback mode.');
} else {
  try {
    const isTls = redisUrl.startsWith('rediss://');
    redisInstance = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
      tls: isTls ? { rejectUnauthorized: false } : undefined,
      retryStrategy(times) {
        if (times > 3) {
          logger.warn('Redis reconnection limit exceeded. Activating in-memory fallback.');
          usingFallback = true;
          return null;
        }
        return Math.min(times * 100, 2000);
      },
      reconnectOnError() {
        return true;
      },
      lazyConnect: true,
    });

    redisInstance.on('connect', () => {
      usingFallback = false;
      logger.info('Redis connection established successfully.');
    });

    redisInstance.on('error', (err) => {
      logger.warn({ message: err.message }, 'Redis connection error. Utilizing in-memory state fallback.');
      usingFallback = true;
    });

    redisInstance.connect().catch((err) => {
      logger.warn({ message: err.message }, 'Initial Redis connection failed. Defaulting to in-memory fallback.');
      usingFallback = true;
    });
  } catch (err) {
    logger.warn({ message: err.message }, 'Redis initialization failed. Defaulting to in-memory fallback.');
    usingFallback = true;
  }
}

export const redis = new Proxy({}, {
  get(_target, prop) {
    if (usingFallback || !redisInstance || redisInstance.status !== 'ready') {
      if (prop in inMemoryFallback) {
        return typeof inMemoryFallback[prop] === 'function'
          ? inMemoryFallback[prop].bind(inMemoryFallback)
          : inMemoryFallback[prop];
      }
    }
    if (redisInstance && prop in redisInstance) {
      return typeof redisInstance[prop] === 'function'
        ? redisInstance[prop].bind(redisInstance)
        : redisInstance[prop];
    }
    return inMemoryFallback[prop]?.bind(inMemoryFallback);
  },
});
