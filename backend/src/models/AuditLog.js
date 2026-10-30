import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      email: { type: String, required: true },
      role: { type: String, default: 'SYSTEM' },
      ipAddress: { type: String, default: '127.0.0.1' },
      userAgent: { type: String, default: 'IPS-Internal' },
    },
    category: {
      type: String,
      required: true,
      enum: [
        'AUTH_SECURITY',
        'LEDGER_MUTATION',
        'KYC_COMPLIANCE',
        'CATALOG_CHANGE',
        'USER_MODERATION',
        'SYSTEM_CRON',
        'TREASURY_SETTLEMENT',
      ],
      index: true,
    },
    severity: {
      type: String,
      enum: ['INFO', 'WARNING', 'CRITICAL'],
      default: 'INFO',
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    targetEntity: {
      entityType: {
        type: String,
        enum: ['User', 'Transaction', 'InvestmentPlan', 'SIP', 'Goal', 'TaxLot', 'System', 'Broadcast'],
      },
      entityId: { type: String },
      label: { type: String },
    },
    diffPayload: {
      previousState: { type: mongoose.Schema.Types.Mixed },
      newState: { type: mongoose.Schema.Types.Mixed },
      reason: { type: String },
      metadata: { type: mongoose.Schema.Types.Mixed },
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

auditLogSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);

