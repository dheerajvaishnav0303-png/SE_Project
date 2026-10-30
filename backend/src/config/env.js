import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGO_URI: z.string({
    required_error: 'MONGO_URI is strictly required for database connectivity.',
  }).min(1, 'MONGO_URI cannot be empty.'),
  REDIS_URL: z.string().optional().default(process.env.REDIS_URL || ''),
  CRON_SECRET: z.string().optional().default(process.env.CRON_SECRET || ''),
  JWT_ACCESS_SECRET: z.string({
    required_error: 'JWT_ACCESS_SECRET is required to sign access tokens.',
  }).min(32, 'JWT_ACCESS_SECRET must be at least 32 characters long for cryptographic security.'),
  JWT_REFRESH_SECRET: z.string({
    required_error: 'JWT_REFRESH_SECRET is required to sign refresh tokens.',
  }).min(32, 'JWT_REFRESH_SECRET must be at least 32 characters long for cryptographic security.'),
  ENCRYPTION_KEY: z.string({
    required_error: 'ENCRYPTION_KEY is required for AES-256-GCM field-level encryption.',
  }).length(64, 'ENCRYPTION_KEY must be exactly 64 hexadecimal characters (32 bytes).')
    .regex(/^[0-9a-fA-F]{64}$/, 'ENCRYPTION_KEY must be a valid hexadecimal string.'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  COOKIE_DOMAIN: z.string().optional().default(process.env.COOKIE_DOMAIN || ''),
  COOKIE_SECURE: z.string().default('false').transform((val) => val === 'true'),
  RATE_LIMIT_MAX: z.string().default('200').transform((val) => parseInt(val, 10)),
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform((val) => parseInt(val, 10)),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('[FATAL CONFIG EXCEPTION] Environment configuration validation failed:');
  parsedEnv.error.issues.forEach((issue) => {
    console.error(`  - Field: ${issue.path.join('.')} | Error: ${issue.message}`);
  });
  process.exit(1);
}

export const env = parsedEnv.data;

