import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    targetType: {
      type: String,
      enum: ['ALL', 'USER', 'RISK_TIER', 'KYC_PENDING'],
      default: 'ALL',
      index: true,
    },
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    targetRiskTier: {
      type: String,
      enum: ['CONSERVATIVE', 'MODERATE', 'AGGRESSIVE'],
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    severity: {
      type: String,
      enum: ['INFO', 'ACTION_REQUIRED', 'MARKET_ALERT'],
      default: 'INFO',
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    readBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        readAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);

