import helmet from 'helmet';
import cors from 'cors';
import hpp from 'hpp';
import cookieParser from 'cookie-parser';
import express from 'express';
import { env } from '../config/env.js';

export function configureSecurityMiddleware(app) {
  // 1. HTTP Security Headers via Helmet
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", env.CORS_ORIGIN],
          fontSrc: ["'self'", 'https:'],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: env.NODE_ENV === 'production' ? [] : null,
        },
      },
      crossOriginEmbedderPolicy: false,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    })
  );

  // 2. Strict Cross-Origin Resource Sharing (CORS)
  const allowedOrigins = [
    env.CORS_ORIGIN,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  ].filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        if (
          !origin ||
          allowedOrigins.includes(origin) ||
          origin.endsWith('.vercel.app')
        ) {
          callback(null, true);
        } else {
          callback(new Error(`CORS blocked for origin: ${origin}`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Idempotency-Key',
        'X-MFA-Token',
        'X-Requested-With',
      ],
      exposedHeaders: ['X-Idempotency-Key', 'X-Total-Count'],
      maxAge: 86400, // 24 hours preflight cache
    })
  );

  // 3. HTTP Parameter Pollution Defense
  app.use(hpp());

  // 4. Secure Cookie Parser
  app.use(cookieParser());

  // 5. Body Parsers with Controlled Limits
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
}

