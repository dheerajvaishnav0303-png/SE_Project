import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['DEPOSIT', 'WITHDRAWAL', 'PURCHASE', 'REDEMPTION', 'SIP_INSTALLMENT'],
      required: true,
      index: true,
    },
    amountPaise: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: 'amountPaise must be an integer minor unit.',
      },
    },
    units: {
      type: mongoose.Schema.Types.Decimal128,
      default: 0,
    },
    navPaise: {
      type: Number,
      default: 0,
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InvestmentPlan',
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'LOCKED_IN_ESCROW', 'SETTLED', 'REJECTED', 'REVERSED'],
      default: 'PENDING',
      index: true,
    },
    idempotencyKey: {
      type: String,
      index: true,
      sparse: true,
    },
    narration: {
      type: String,
      default: '',
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

transactionSchema.index({ user: 1, createdAt: -1 });

export const Transaction = mongoose.model('Transaction', transactionSchema);

