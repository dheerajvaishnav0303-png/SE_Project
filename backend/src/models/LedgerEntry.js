import mongoose from 'mongoose';

const ledgerEntrySchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    accountType: {
      type: String,
      enum: ['USER_WALLET', 'ESCROW_CLEARING', 'ASSET_HOLDING', 'FEE_REVENUE', 'BANK_SETTLEMENT'],
      required: true,
      index: true,
    },
    direction: {
      type: String,
      enum: ['DEBIT', 'CREDIT'],
      required: true,
    },
    amountPaise: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: 'amountPaise must be a strictly integer quantity in minor units.',
      },
    },
    balanceAfterPaise: {
      type: Number,
      required: true,
      validate: {
        validator: Number.isInteger,
        message: 'balanceAfterPaise must be an integer quantity in minor units.',
      },
    },
    referenceType: {
      type: String,
      enum: ['DEPOSIT', 'WITHDRAWAL', 'INVESTMENT_BUY', 'INVESTMENT_SELL', 'SIP_DEBIT', 'FEE'],
      required: true,
    },
    referenceId: {
      type: String,
      required: true,
    },
    narration: {
      type: String,
      required: true,
      trim: true,
    },
    recordedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

// High-speed compound indexes for double-entry ledger audits and statements
ledgerEntrySchema.index({ user: 1, accountType: 1, recordedAt: -1 });
ledgerEntrySchema.index({ transactionId: 1, direction: 1 });

export const LedgerEntry = mongoose.model('LedgerEntry', ledgerEntrySchema);

