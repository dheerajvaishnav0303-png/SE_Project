import mongoose from 'mongoose';
import { isReplicaSet } from '../config/db.js';

export async function withOptionalTransaction(callback) {
  if (isReplicaSet()) {
    const session = await mongoose.startSession();
    try {
      let result;
      await session.withTransaction(async () => {
        result = await callback(session);
      });
      return result;
    } finally {
      await session.endSession();
    }
  } else {
    return callback(null);
  }
}

