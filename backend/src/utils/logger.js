import pino from 'pino';
import { pinoHttp } from 'pino-http';
import { env } from '../config/env.js';

const redactPaths = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["x-idempotency-key"]',
  'password',
  'passwordHash',
  'twoFactorSecret',
  'totpSecret',
  'panNumber',
  'bankAccountNumber',
  'aadhaarNumber',
  '*.password',
  '*.passwordHash',
  '*.twoFactorSecret',
  '*.panNumber',
  '*.bankAccountNumber',
];

export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  redact: {
    paths: redactPaths,
    censor: '[REDACTED_CONFIDENTIAL]',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  transport:
    env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
});

export const httpLogger = pinoHttp({
  logger,
  customLogLevel: function (req, res, err) {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  serializers: {
    req(req) {
      return {
        id: req.id,
        method: req.method,
        url: req.url,
        query: req.query,
        headers: {
          host: req.headers.host,
          'user-agent': req.headers['user-agent'],
        },
      };
    },
    res(res) {
      return {
        statusCode: res.statusCode,
      };
    },
  },
});

