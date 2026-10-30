import mongoose from 'mongoose';

const portfolioSnapshotSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    investedPaise: {
      type: Number,
      required: true,
      min: 0,
    },
    currentValuePaise: {
      type: Number,
      required: true,
      min: 0,
    },
    unrealizedPnlPaise: {
      type: Number,
      required: true,
    },
    xirr: {
      type: Number,
      default: 0,
    },
    benchmarkValue: {
      type: Number,
      default: 100.0, // Base 100 comparative normalized value
    },
    assetAllocation: {
      equityPaise: { type: Number, default: 0 },
      debtPaise: { type: Number, default: 0 },
      hybridPaise: { type: Number, default: 0 },
      goldPaise: { type: Number, default: 0 },
      cashPaise: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to query historical time-series ranges in sub-15ms
portfolioSnapshotSchema.index({ user: 1, date: -1 });

export const PortfolioSnapshot = mongoose.model('PortfolioSnapshot', portfolioSnapshotSchema);

