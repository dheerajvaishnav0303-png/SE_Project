import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email address is mandatory.'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is mandatory.'],
      minlength: [8, 'Password must be at least 8 characters long.'],
      select: false, // Hidden by default from queries
    },
    firstName: {
      type: String,
      required: [true, 'First name is mandatory.'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is mandatory.'],
      trim: true,
    },
    role: {
      type: String,
      enum: ['RETAIL_USER', 'HNI_USER', 'ADVISOR', 'COMPLIANCE_CHECKER', 'SUPER_ADMIN', 'ADMIN'],
      default: 'RETAIL_USER',
      index: true,
    },
    kycStatus: {
      type: String,
      enum: ['UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED'],
      default: 'UNVERIFIED',
      index: true,
    },
    riskProfile: {
      type: String,
      enum: ['CONSERVATIVE', 'MODERATE', 'AGGRESSIVE', 'UNSPECIFIED'],
      default: 'UNSPECIFIED',
    },
    walletBalancePaise: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Wallet balance cannot be negative.'],
      validate: {
        validator: Number.isInteger,
        message: 'walletBalancePaise must be a strictly integer quantity in minor units.',
      },
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: {
      type: String,
      select: false, // Field-level AES-256-GCM encrypted
    },
    panEncrypted: {
      type: String,
      select: false,
    },
    panBlindIndex: {
      type: String,
      index: true,
      sparse: true,
    },
    bankDetails: {
      accountNumberEncrypted: { type: String, select: false },
      ifsc: { type: String, uppercase: true, trim: true },
      accountHolderName: { type: String, trim: true },
      verifiedAt: { type: Date },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFrozen: {
      type: Boolean,
      default: false,
    },
    freezeReason: {
      type: String,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (_doc, ret) {
        delete ret.password;
        delete ret.twoFactorSecret;
        delete ret.panEncrypted;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Hash password before saving if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Safe JSON projection helper
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.twoFactorSecret;
  delete obj.panEncrypted;
  delete obj.__v;
  return obj;
};

export const User = mongoose.model('User', userSchema);

