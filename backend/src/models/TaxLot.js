import mongoose from 'mongoose';

const taxLotSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    investment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Investment',
      required: true,
      index: true,
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InvestmentPlan',
      required: true,
      index: true,
    },
    schemeName: {
      type: String,
      required: true,
      trim: true,
    },
    schemeCode: {
      type: String,
      required: true,
      trim: true,
    },
    assetCategory: {
      type: String,
      enum: ['EQUITY', 'DEBT', 'HYBRID', 'GOLD'],
      default: 'EQUITY',
      index: true,
    },
    units: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
    },
    remainingUnits: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      index: true,
    },
    purchaseNavPaise: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: 'purchaseNavPaise must be an integer minor unit.',
      },
    },
    purchaseAmountPaise: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: 'purchaseAmountPaise must be an integer minor unit.',
      },
    },
    purchaseDate: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'EXHAUSTED'],
      default: 'ACTIVE',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for strict chronological FIFO lot matching
taxLotSchema.index({ user: 1, plan: 1, status: 1, purchaseDate: 1 });

export const TaxLot = mongoose.model('TaxLot', taxLotSchema);

