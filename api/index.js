import app from '../backend/src/app.js';
import { connectDB } from '../backend/src/config/db.js';
import { User } from '../backend/src/models/User.js';
import { seedInstitutionalData } from '../backend/src/services/dataSeeder.js';
import { logger } from '../backend/src/utils/logger.js';

app.set('trust proxy', 1);

let isSeeded = false;

export default async function handler(req, res) {
  try {
    // 1. Establish/reuse cached serverless MongoDB connection
    await connectDB();

    // 2. Perform one-time initial seed check if User collection is unpopulated
    if (!isSeeded) {
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        logger.info('Empty database detected on Vercel cold start. Initializing institutional seed...');
        await seedInstitutionalData();
      }
      isSeeded = true;
    }
  } catch (err) {
    logger.error({ err: err.message }, 'Failed during serverless initialization hook.');
    // Fail fast with clear diagnostic info instead of letting controllers crash on null connection
    if (!req.url.includes('/api/health')) {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 503;
      return res.end(
        JSON.stringify({
          type: 'https://api.ips-wealth.com/errors/database-unavailable',
          title: 'Database Connection Failed',
          status: 503,
          detail: err.message,
          hint: 'Ensure MongoDB Atlas Network Access has 0.0.0.0/0 allowed and MONGO_URI is correctly configured on Vercel.',
        })
      );
    }
  }

  // 3. Delegate request execution to Express app
  return new Promise((resolve, reject) => {
    res.on('finish', resolve);
    res.on('close', resolve);
    res.on('error', reject);
    app(req, res);
  });
}
