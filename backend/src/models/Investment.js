import mongoose from 'mongoose';

const investmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InvestmentPlan',
      required: true,
      index: true,
    },
    units: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      default: 0,
    },
    investedPaise: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: 'investedPaise must be an integer minor unit.',
      },
    },
    currentValuePaise: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: 'currentValuePaise must be an integer minor unit.',
      },
    },
    folioNumber: {
      type: String,
      required: true,
      trim: true,
    },
    linkedGoal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Goal',
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'REDEEMED'],
      default: 'ACTIVE',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

investmentSchema.index({ user: 1, plan: 1 }, { unique: true });

export const Investment = mongoose.model('Investment', investmentSchema);

