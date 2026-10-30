import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

export async function connectDB() {
  // 1. Immediately reuse active ready connection
  if (mongoose.connection.readyState === 1) {
    cached.conn = mongoose.connection;
    return cached.conn;
  }

  // 2. Return cached instance if available
  if (cached.conn) {
    return cached.conn;
  }

  // 3. Initiate cached promise if not currently connecting
  if (!cached.promise) {
    const opts = {
      maxPoolSize: 10,
      minPoolSize: 1,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false, // Fail fast on cold starts
      retryWrites: true,
      w: 'majority',
    };

    cached.promise = mongoose
      .connect(env.MONGO_URI, opts)
      .then((mongooseInstance) => {
        logger.info(
          { host: mongooseInstance.connection.host, name: mongooseInstance.connection.name },
          'MongoDB connection established successfully.'
        );
        return mongooseInstance.connection;
      })
      .catch((err) => {
        cached.promise = null;
        logger.error({ err: err.message }, 'Failed to initialize MongoDB connection.');
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (global.mongooseCache) {
    global.mongooseCache.conn = null;
    global.mongooseCache.promise = null;
  }
  logger.info('MongoDB connection closed.');
}

export function isReplicaSet() {
  const replicaSetName = mongoose.connection.client?.topology?.s?.description?.setName;
  return Boolean(replicaSetName);
}
