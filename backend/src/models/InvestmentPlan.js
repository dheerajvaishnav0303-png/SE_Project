import mongoose from 'mongoose';

const investmentPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      enum: ['EQUITY', 'DEBT', 'HYBRID', 'GOLD'],
      required: true,
      index: true,
    },
    subCategory: {
      type: String,
      default: 'General',
      trim: true,
    },
    riskLevel: {
      type: String,
      enum: ['LOW', 'MODERATE', 'HIGH', 'VERY_HIGH'],
      default: 'MODERATE',
    },
    navPaise: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: 'navPaise must be an integer minor unit.',
      },
    },
    navDate: {
      type: Date,
      default: Date.now,
    },
    isin: {
      type: String,
      trim: true,
      uppercase: true,
      sparse: true,
      index: true,
    },
    schemeCode: {
      type: String,
      trim: true,
      sparse: true,
      index: true,
    },
    amc: {
      type: String,
      trim: true,
      default: 'Direct Asset Management',
    },
    benchmarkIndex: {
      type: String,
      default: 'NIFTY 50 TRI',
    },
    expenseRatio: {
      type: Number,
      default: 0.0075, // 0.75%
    },
    cagr1Y: {
      type: Number,
      default: 0.15,
    },
    cagr3Y: {
      type: Number,
      default: 0.18,
    },
    cagr5Y: {
      type: Number,
      default: 0.16,
    },
    minInvestmentPaise: {
      type: Number,
      default: 50000, // ₹500
    },
    minSipPaise: {
      type: Number,
      default: 50000, // ₹500
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    allowNewInflows: {
      type: Boolean,
      default: true,
    },
    assetWeights: {
      equity: { type: Number, default: 100 },
      debt: { type: Number, default: 0 },
      gold: { type: Number, default: 0 },
      cash: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

export const InvestmentPlan = mongoose.model('InvestmentPlan', investmentPlanSchema);

