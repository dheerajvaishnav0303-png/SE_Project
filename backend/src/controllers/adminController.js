import crypto from 'crypto';
import { User } from '../models/User.js';
import { Investment } from '../models/Investment.js';
import { SIP } from '../models/SIP.js';
import { Goal } from '../models/Goal.js';
import { Transaction } from '../models/Transaction.js';
import { LedgerEntry } from '../models/LedgerEntry.js';
import { AuditLog } from '../models/AuditLog.js';
import { logAuditEvent } from '../utils/auditLogger.js';

export async function getAdminKPIs(req, res, next) {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeHoldings,
      pendingSettlements,
      pendingKycUsers,
      activeSips,
      userWallets,
      recentDeposits,
      recentWithdrawals,
    ] = await Promise.all([
      User.countDocuments(),
      Investment.find({ status: 'ACTIVE' }).select('currentValuePaise'),
      Transaction.find({ type: 'WITHDRAWAL', status: 'LOCKED_IN_ESCROW' }).select('amountPaise'),
      User.countDocuments({ kycStatus: 'PENDING' }),
      SIP.find({ status: 'ACTIVE' }).select('amountPaise'),
      User.find().select('walletBalancePaise'),
      Transaction.aggregate([
        { $match: { type: 'DEPOSIT', status: 'SETTLED', createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: null, total: { $sum: '$amountPaise' } } },
      ]),
      Transaction.aggregate([
        { $match: { type: 'WITHDRAWAL', status: 'SETTLED', createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: null, total: { $sum: '$amountPaise' } } },
      ]),
    ]);

    const totalAumPaise = activeHoldings.reduce((sum, h) => sum + (h.currentValuePaise || 0), 0);
    const walletLiquidityPaise = userWallets.reduce((sum, u) => sum + (u.walletBalancePaise || 0), 0);
    const escrowLockedPaise = pendingSettlements.reduce((sum, s) => sum + (s.amountPaise || 0), 0);
    const activeMonthlySipBookPaise = activeSips.reduce((sum, s) => sum + (s.amountPaise || 0), 0);

    const depositSum = recentDeposits[0]?.total || 0;
    const withdrawSum = recentWithdrawals[0]?.total || 0;
    const netMonthlyFlowPaise = depositSum - withdrawSum;

    return res.status(200).json({
      status: 'success',
      data: {
        totalAumPaise,
        walletLiquidityPaise,
        escrowLockedPaise,
        activeMonthlySipBookPaise,
        netMonthlyFlowPaise,
        totalUsers,
        actionRequired: {
          pendingWithdrawalsCount: pendingSettlements.length,
          pendingKycCount: pendingKycUsers,
          failedSipsCount: 0,
        },
      },
    });
  } catch (err) {
    return next(err);
  }
}

export { getPendingSettlements, authorizeSettlement, batchApproveSettlements } from './adminSettlementController.js';

export async function getAdminUsers(req, res, next) {
  try {
    const users = await User.find().select('-twoFactorSecret -panEncrypted').sort({ createdAt: -1 });
    return res.status(200).json({ status: 'success', data: { users } });
  } catch (err) {
    return next(err);
  }
}

export async function updateKycStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { kycStatus, notes } = req.body;

    if (!['UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED'].includes(kycStatus)) {
      return res.status(400).json({ status: 'fail', message: 'Invalid KYC status.' });
    }

    const oldUser = await User.findById(id);
    const user = await User.findByIdAndUpdate(id, { kycStatus }, { new: true });

    await logAuditEvent({
      req,
      category: 'KYC_COMPLIANCE',
      action: 'KYC_STATUS_UPDATED',
      targetEntity: { entityType: 'User', entityId: id, label: `${user.firstName} ${user.lastName}` },
      diffPayload: { previousState: { kycStatus: oldUser?.kycStatus }, newState: { kycStatus }, reason: notes },
    });

    return res.status(200).json({ status: 'success', data: { user: user.toSafeObject() } });
  } catch (err) {
    return next(err);
  }
}

export async function getInvestor360Dossier(req, res, next) {
  try {
    const { id } = req.params;
    const [user, holdings, sips, goals, ledgerEntries, auditLogs] = await Promise.all([
      User.findById(id).select('-twoFactorSecret -password'),
      Investment.find({ user: id }).populate('plan'),
      SIP.find({ user: id }).populate('plan'),
      Goal.find({ user: id }),
      LedgerEntry.find({ user: id }).sort({ recordedAt: -1 }).limit(50),
      AuditLog.find({ 'targetEntity.entityId': id }).sort({ createdAt: -1 }).limit(20),
    ]);

    if (!user) return res.status(404).json({ status: 'fail', message: 'Investor not found.' });

    const totalInvested = holdings.reduce((s, h) => s + (h.investedPaise || 0), 0);
    const currentValue = holdings.reduce((s, h) => s + (h.currentValuePaise || 0), 0);

    return res.status(200).json({
      status: 'success',
      data: {
        user: user.toSafeObject(),
        financialSummary: {
          walletBalancePaise: user.walletBalancePaise,
          totalInvestedPaise: totalInvested,
          currentValuePaise: currentValue,
          unrealizedPnlPaise: currentValue - totalInvested,
        },
        holdings,
        sips,
        goals,
        ledgerEntries,
        auditLogs,
      },
    });
  } catch (err) {
    return next(err);
  }
}

export async function moderateUserAccount(req, res, next) {
  try {
    const { id } = req.params;
    const { action, reason, amountPaise, direction } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ status: 'fail', message: 'User not found.' });

    if (action === 'TOGGLE_FREEZE') {
      user.isFrozen = !user.isFrozen;
      user.freezeReason = user.isFrozen ? (reason || 'Administrative hold') : null;
      await user.save();
      await logAuditEvent({ req, category: 'USER_MODERATION', action: user.isFrozen ? 'ACCOUNT_FROZEN' : 'ACCOUNT_UNFROZEN', targetEntity: { entityType: 'User', entityId: id, label: user.email }, diffPayload: { reason } });
      return res.status(200).json({ status: 'success', message: `Account ${user.isFrozen ? 'frozen' : 'reactivated'}.`, data: { user } });
    }

    if (action === 'RESET_2FA') {
      user.twoFactorEnabled = false;
      user.twoFactorSecret = null;
      await user.save();
      await logAuditEvent({ req, category: 'AUTH_SECURITY', action: '2FA_FORCE_RESET', targetEntity: { entityType: 'User', entityId: id, label: user.email }, diffPayload: { reason } });
      return res.status(200).json({ status: 'success', message: '2FA has been reset for user.', data: { user } });
    }

    if (action === 'LEDGER_ADJUSTMENT') {
      const val = parseInt(amountPaise, 10);
      if (!val || val <= 0) return res.status(400).json({ status: 'fail', message: 'Valid amountPaise is required.' });

      if (direction === 'CREDIT') {
        user.walletBalancePaise += val;
      } else {
        if (user.walletBalancePaise < val) return res.status(400).json({ status: 'fail', message: 'Insufficient balance for debit.' });
        user.walletBalancePaise -= val;
      }
      await user.save();

      const txId = `adj_${crypto.randomUUID()}`;
      await LedgerEntry.create([
        {
          transactionId: txId,
          user: user._id,
          accountType: 'USER_WALLET',
          direction: direction === 'CREDIT' ? 'CREDIT' : 'DEBIT',
          amountPaise: val,
          balanceAfterPaise: user.walletBalancePaise,
          referenceType: 'ADMIN_ADJUSTMENT',
          referenceId: txId,
          narration: `Manual Adjustment: ${reason || 'Admin credit/debit'}`,
        },
      ]);

      await logAuditEvent({ req, category: 'LEDGER_MUTATION', action: 'MANUAL_BALANCE_ADJUSTMENT', targetEntity: { entityType: 'User', entityId: id, label: user.email }, diffPayload: { direction, amountPaise: val, reason } });
      return res.status(200).json({ status: 'success', message: `Wallet adjusted by ₹${val / 100}.`, data: { walletBalancePaise: user.walletBalancePaise } });
    }

    return res.status(400).json({ status: 'fail', message: 'Unrecognized moderation action.' });
  } catch (err) {
    return next(err);
  }
}
