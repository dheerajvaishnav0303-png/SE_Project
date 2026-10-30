import express from 'express';
import mongoose from 'mongoose';
import { configureSecurityMiddleware } from './middleware/securityMiddleware.js';
import { httpLogger } from './utils/logger.js';
import { globalLimiter } from './middleware/rateLimitMiddleware.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import plannerRoutes from './routes/plannerRoutes.js';
import investmentRoutes from './routes/investmentRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import sipRoutes from './routes/sipRoutes.js';
import goalRoutes from './routes/goalRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import cronRoutes from './routes/cronRoutes.js';

const app = express();

// Trust Vercel / reverse proxy for accurate IP determination & secure cookies
app.set('trust proxy', 1);

// 1. Security & Body Parsers
configureSecurityMiddleware(app);

// 2. Structured Request Logging
app.use(httpLogger);

// 3. Global Tiered Rate Limiting
app.use('/api', globalLimiter);

// 4. Operational Health & Readiness Probes
app.get(['/health', '/api/health'], (_req, res) => {
  const readyState = mongoose.connection.readyState;
  const stateMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.status(200).json({
    status: 'UP',
    service: 'IPS Wealth Management Backend',
    version: '2.0.0',
    database: stateMap[readyState] || 'unknown',
    readyState,
    host: mongoose.connection.host || null,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

// 5. Domain API Routes
app.use('/api/auth', authRoutes);
app.use('/api/planner', plannerRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/sips', sipRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cron', cronRoutes);

// 6. 404 Handler for Unrecognized Endpoints
app.use((req, res) => {
  res.status(404).json({
    type: 'https://api.ips-wealth.com/errors/not-found',
    title: 'Resource Not Found',
    status: 404,
    detail: `The requested path '${req.originalUrl}' does not exist on this server.`,
    instance: req.originalUrl,
    timestamp: new Date().toISOString(),
  });
});

// 7. Global RFC 7807 Error Handler
app.use(errorHandler);

export default app;
