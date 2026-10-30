import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['EDUCATION', 'RETIREMENT', 'REAL_ESTATE', 'HEALTHCARE', 'GENERAL'],
      default: 'GENERAL',
      index: true,
    },
    targetCorpusPaise: {
      type: Number,
      required: true,
      min: 100000, // ₹1,000 minimum
      validate: {
        validator: Number.isInteger,
        message: 'targetCorpusPaise must be an integer minor unit.',
      },
    },
    currentCorpusPaise: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: 'currentCorpusPaise must be an integer minor unit.',
      },
    },
    targetDate: {
      type: Date,
      required: true,
      index: true,
    },
    inflationRate: {
      type: Number,
      default: 0.06,
    },
    expectedReturn: {
      type: Number,
      default: 0.12,
    },
    glidepathStage: {
      type: String,
      enum: ['ACCUMULATION', 'TRANSITION', 'PRESERVATION'],
      default: 'ACCUMULATION',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'ACHIEVED', 'PAUSED'],
      default: 'ACTIVE',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Goal = mongoose.model('Goal', goalSchema);

