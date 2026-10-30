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

    if (isNx && this.store.has(key)) return null;
    if (isXx && !this.store.has(key)) return null;

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

  async ping() {
    return 'PONG';
  }

  async quit() {
    this.store.clear();
    this.ttls.clear();
    return 'OK';
  }

  _purgeExpired(key) {
    const expireAt = this.ttls.get(key);
    if (expireAt && Date.now() > expireAt) {
      this.store.delete(key);
      this.ttls.delete(key);
    }
  }
}

class UpstashRestRedis {
  constructor(url, token, fallback) {
    this.url = url.replace(/\/$/, '');
    this.token = token;
    this.fallback = fallback;
    this.status = 'ready';
  }

  async _exec(cmd) {
    try {
      const res = await fetch(this.url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cmd),
      });
      if (!res.ok) {
        throw new Error(`Upstash HTTP ${res.status}`);
      }
      const data = await res.json();
      return data.result;
    } catch (err) {
      logger.warn({ err: err.message }, 'Upstash command failed, falling back to in-memory store');
      const [op, ...args] = cmd;
      const fn = this.fallback[op.toLowerCase()];
      return typeof fn === 'function' ? fn.apply(this.fallback, args) : null;
    }
  }

  async get(key) {
    return this._exec(['GET', key]);
  }

  async set(key, value, ...args) {
    return this._exec(['SET', key, String(value), ...args.map(String)]);
  }

  async setnx(key, value) {
    return this._exec(['SETNX', key, String(value)]);
  }

  async del(...keys) {
    return this._exec(['DEL', ...keys]);
  }

  async expire(key, seconds) {
    return this._exec(['EXPIRE', key, String(seconds)]);
  }

  async exists(...keys) {
    return this._exec(['EXISTS', ...keys]);
  }

  async ping() {
    return this._exec(['PING']);
  }

  async quit() {
    return 'OK';
  }
}

let redisInstance = null;
const inMemoryFallback = global.inMemoryRedisStore || (global.inMemoryRedisStore = new InMemoryRedisFallback());
let usingFallback = false;

const upstashUrl = env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_REST_URL || '';
const upstashToken = env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
const redisUrl = env.REDIS_URL || process.env.REDIS_URL || '';

if (upstashUrl && upstashToken) {
  logger.info('Upstash Redis REST client initialized for serverless operations.');
  redisInstance = new UpstashRestRedis(upstashUrl, upstashToken, inMemoryFallback);
} else if (redisUrl && redisUrl !== 'none') {
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
      lazyConnect: true,
    });
    redisInstance.on('connect', () => {
      usingFallback = false;
      logger.info('Redis connection established successfully.');
    });
    redisInstance.on('error', (err) => {
      logger.warn({ message: err.message }, 'Redis error. Utilizing in-memory fallback.');
      usingFallback = true;
    });
    redisInstance.connect().catch((err) => {
      logger.warn({ message: err.message }, 'Initial Redis connection failed. Defaulting to in-memory fallback.');
      usingFallback = true;
    });
  } catch (err) {
    logger.warn({ message: err.message }, 'Redis init failed. Defaulting to in-memory fallback.');
    usingFallback = true;
  }
} else {
  usingFallback = true;
  logger.info('REDIS_URL / UPSTASH not configured. Operating in serverless in-memory fallback mode.');
}

export const redis = new Proxy({}, {
  get(_target, prop) {
    if (usingFallback || !redisInstance) {
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
