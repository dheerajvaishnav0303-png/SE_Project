import mongoose from 'mongoose';

const sipSchema = new mongoose.Schema(
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
    amountPaise: {
      type: Number,
      required: true,
      min: 50000, // ₹500 minimum installment
      validate: {
        validator: Number.isInteger,
        message: 'amountPaise must be an integer minor unit.',
      },
    },
    stepUpPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    frequency: {
      type: String,
      enum: ['MONTHLY', 'QUARTERLY'],
      default: 'MONTHLY',
    },
    debitDay: {
      type: Number,
      required: true,
      min: 1,
      max: 28,
    },
    nextExecutionDate: {
      type: Date,
      required: true,
      index: true,
    },
    linkedGoal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Goal',
      default: null,
    },
    mandateLimitPaise: {
      type: Number,
      required: true,
      default: 5000000, // ₹50,000 default eNACH ceiling
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'PAUSED', 'CANCELLED'],
      default: 'ACTIVE',
      index: true,
    },
    consecutiveFailures: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index to query all due active SIP mandates in automated recurring crons
sipSchema.index({ status: 1, nextExecutionDate: 1 });

export const SIP = mongoose.model('SIP', sipSchema);

