import app from './app.js';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { logger } from './utils/logger.js';
import { seedInstitutionalData } from './services/dataSeeder.js';

app.set('trust proxy', 1);

let server;

export async function startServer() {
  try {
    // 1. Establish database connection pool
    await connectDB();

    // 2. Seed initial institutional datasets if empty
    await seedInstitutionalData();

    // 3. Start HTTP listener
    server = app.listen(env.PORT, () => {
      logger.info(
        { port: env.PORT, env: env.NODE_ENV },
        `IPS Wealth Management Platform API running on port ${env.PORT}`
      );
    });

    // 4. Graceful shutdown handler
    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received. Initiating graceful shutdown...`);

      if (server) {
        server.close(async () => {
          logger.info('HTTP server closed.');
          await disconnectDB();
          logger.info('Process terminated gracefully.');
          process.exit(0);
        });
      } else {
        await disconnectDB();
        process.exit(0);
      }

      // Force terminate after 10s timeout
      setTimeout(() => {
        logger.fatal('Forcefully shutting down due to timeout.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    logger.fatal({ error }, 'Fatal exception during server boot.');
    process.exit(1);
  }
}

// Only listen directly when running in standalone server mode (not serverless)
if (!process.env.VERCEL) {
  startServer();
}

export { app };
export default app;
