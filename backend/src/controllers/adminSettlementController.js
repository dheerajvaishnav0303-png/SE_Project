import crypto from 'crypto';
import { User } from '../models/User.js';
import { Transaction } from '../models/Transaction.js';
import { LedgerEntry } from '../models/LedgerEntry.js';
import { logAuditEvent } from '../utils/auditLogger.js';

export async function getPendingSettlements(req, res, next) {
  try {
    const { status } = req.query;
    const filter = { type: 'WITHDRAWAL' };

    if (status && status !== 'ALL') {
      filter.status = status;
    } else if (!status) {
      filter.status = 'LOCKED_IN_ESCROW';
    }

    const pendingWithdrawals = await Transaction.find(filter)
      .populate('user', 'email firstName lastName kycStatus walletBalancePaise')
      .sort({ createdAt: -1 });

    return res.status(200).json({ status: 'success', data: { pendingWithdrawals } });
  } catch (err) {
    return next(err);
  }
}

export async function authorizeSettlement(req, res, next) {
  try {
    const { id } = req.params;
    const { action, reviewNotes } = req.body;

    const tx = await Transaction.findById(id);
    if (!tx || tx.status !== 'LOCKED_IN_ESCROW') {
      return res.status(404).json({ status: 'fail', message: 'Withdrawal settlement not awaiting action.' });
    }

    const txId = `settle_${crypto.randomUUID()}`;

    if (action === 'APPROVE') {
      tx.status = 'SETTLED';
      tx.metadata = { ...tx.metadata, approvedBy: req.user._id, reviewNotes, approvedAt: new Date() };
      await tx.save();

      await LedgerEntry.create([
        {
          transactionId: txId,
          user: tx.user,
          accountType: 'ESCROW_CLEARING',
          direction: 'DEBIT',
          amountPaise: tx.amountPaise,
          balanceAfterPaise: 0,
          referenceType: 'WITHDRAWAL',
          referenceId: tx._id.toString(),
          narration: `Escrow released: Approved by checker ${req.user.email}`,
        },
        {
          transactionId: txId,
          user: tx.user,
          accountType: 'BANK_SETTLEMENT',
          direction: 'CREDIT',
          amountPaise: tx.amountPaise,
          balanceAfterPaise: 0,
          referenceType: 'WITHDRAWAL',
          referenceId: tx._id.toString(),
          narration: 'Bank settlement transfer cleared',
        },
      ]);
    } else {
      tx.status = 'REJECTED';
      tx.metadata = { ...tx.metadata, rejectedBy: req.user._id, reviewNotes, rejectedAt: new Date() };
      await tx.save();

      const user = await User.findById(tx.user);
      user.walletBalancePaise += tx.amountPaise;
      await user.save();

      await LedgerEntry.create([
        {
          transactionId: txId,
          user: tx.user,
          accountType: 'ESCROW_CLEARING',
          direction: 'DEBIT',
          amountPaise: tx.amountPaise,
          balanceAfterPaise: 0,
          referenceType: 'WITHDRAWAL',
          referenceId: tx._id.toString(),
          narration: `Escrow reversed: Rejected by checker ${req.user.email}`,
        },
        {
          transactionId: txId,
          user: tx.user,
          accountType: 'USER_WALLET',
          direction: 'CREDIT',
          amountPaise: tx.amountPaise,
          balanceAfterPaise: user.walletBalancePaise,
          referenceType: 'WITHDRAWAL',
          referenceId: tx._id.toString(),
          narration: `Refunded withdrawal to wallet: ${reviewNotes}`,
        },
      ]);
    }

    await logAuditEvent({
      req,
      category: 'TREASURY_SETTLEMENT',
      action: action === 'APPROVE' ? 'WITHDRAWAL_APPROVED' : 'WITHDRAWAL_REJECTED',
      targetEntity: { entityType: 'Transaction', entityId: tx._id.toString(), label: tx.transactionId },
      diffPayload: { amountPaise: tx.amountPaise, action, reviewNotes },
    });

    return res.status(200).json({
      status: 'success',
      message: `Withdrawal ${action.toLowerCase()}d successfully.`,
      data: { transaction: tx },
    });
  } catch (err) {
    return next(err);
  }
}

export async function batchApproveSettlements(req, res, next) {
  try {
    const { transactionIds = [], reviewNotes = 'Batch maker-checker verification' } = req.body;
    const results = [];

    for (const txId of transactionIds) {
      const tx = await Transaction.findById(txId);
      if (tx && tx.status === 'LOCKED_IN_ESCROW') {
        tx.status = 'SETTLED';
        tx.metadata = { ...tx.metadata, approvedBy: req.user._id, reviewNotes, approvedAt: new Date() };
        await tx.save();

        const settleBatchId = `batch_settle_${crypto.randomUUID()}`;
        await LedgerEntry.create([
          {
            transactionId: settleBatchId,
            user: tx.user,
            accountType: 'ESCROW_CLEARING',
            direction: 'DEBIT',
            amountPaise: tx.amountPaise,
            balanceAfterPaise: 0,
            referenceType: 'WITHDRAWAL',
            referenceId: tx._id.toString(),
            narration: `Batch escrow release: Authorized by ${req.user.email}`,
          },
          {
            transactionId: settleBatchId,
            user: tx.user,
            accountType: 'BANK_SETTLEMENT',
            direction: 'CREDIT',
            amountPaise: tx.amountPaise,
            balanceAfterPaise: 0,
            referenceType: 'WITHDRAWAL',
            referenceId: tx._id.toString(),
            narration: 'Batch bank settlement transfer cleared',
          },
        ]);
        results.push(tx._id);
      }
    }

    await logAuditEvent({
      req,
      category: 'TREASURY_SETTLEMENT',
      action: 'BATCH_WITHDRAWAL_APPROVED',
      diffPayload: { count: results.length, transactionIds: results },
    });

    return res.status(200).json({
      status: 'success',
      message: `Batch processed ${results.length} settlements.`,
      data: { processedIds: results },
    });
  } catch (err) {
    return next(err);
  }
}

