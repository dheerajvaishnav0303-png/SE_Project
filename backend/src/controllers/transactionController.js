import { Transaction } from '../models/Transaction.js';
import { LedgerEntry } from '../models/LedgerEntry.js';
import { User } from '../models/User.js';
import crypto from 'crypto';
import { executeDeposit, executeWithdrawalRequest } from '../services/ledgerService.js';

export async function getUserTransactions(req, res, next) {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const skip = (page - 1) * limit;

    const [transactions, totalCount] = await Promise.all([
      Transaction.find({ user: userId })
        .populate('plan', 'name isin schemeCode')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Transaction.countDocuments({ user: userId }),
    ]);

    return res.status(200).json({
      status: 'success',
      data: {
        transactions,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (err) {
    return next(err);
  }
}

export async function depositFunds(req, res, next) {
  try {
    const { amountPaise, narration } = req.body;
    const userId = req.user._id;
    const idempotencyKey = req.headers['x-idempotency-key'];

    const tx = await executeDeposit({
      userId,
      amountPaise,
      idempotencyKey,
      narration: narration || 'Instant NetBanking deposit',
    });

    return res.status(201).json({
      status: 'success',
      message: `Successfully credited ₹${amountPaise / 100} to wallet.`,
      data: { transaction: tx, newWalletBalancePaise: req.user.walletBalancePaise + amountPaise },
    });
  } catch (err) {
    return next(err);
  }
}

export async function withdrawFunds(req, res, next) {
  try {
    const { amountPaise, narration } = req.body;
    const userId = req.user._id;
    const idempotencyKey = req.headers['x-idempotency-key'];

    const tx = await executeWithdrawalRequest({
      userId,
      amountPaise,
      idempotencyKey,
      narration: narration || 'Bank payout transfer',
    });

    const isHighValue = tx.status === 'LOCKED_IN_ESCROW';

    return res.status(201).json({
      status: 'success',
      message: isHighValue
        ? `Withdrawal of ₹${amountPaise / 100} initiated. Pending compliance maker-checker review.`
        : `Withdrawal of ₹${amountPaise / 100} dispatched to bank.`,
      data: { transaction: tx },
    });
  } catch (err) {
    return next(err);
  }
}

export async function getLedgerStatement(req, res, next) {
  try {
    const userId = req.user._id;
    const entries = await LedgerEntry.find({ user: userId }).sort({ recordedAt: -1 }).limit(100);

    return res.status(200).json({
      status: 'success',
      data: {
        entries,
        statementGeneratedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    return next(err);
  }
}

export async function cancelPendingWithdrawal(req, res, next) {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const tx = await Transaction.findOne({
      _id: id,
      user: userId,
      type: 'WITHDRAWAL',
      status: 'LOCKED_IN_ESCROW',
    });

    if (!tx) {
      return res.status(404).json({
        status: 'fail',
        message: 'No pending escrow withdrawal found with this identifier.',
      });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ status: 'fail', message: 'User not found.' });

    user.walletBalancePaise += tx.amountPaise;
    await user.save();

    const reverseTxId = `rev_${crypto.randomUUID()}`;
    await LedgerEntry.create([
      {
        transactionId: reverseTxId,
        user: userId,
        accountType: 'ESCROW_CLEARING',
        direction: 'DEBIT',
        amountPaise: tx.amountPaise,
        balanceAfterPaise: 0,
        referenceType: 'WITHDRAWAL',
        referenceId: tx.transactionId,
        narration: `Reversal of escrow hold for cancelled withdrawal ${tx.transactionId}`,
      },
      {
        transactionId: reverseTxId,
        user: userId,
        accountType: 'USER_WALLET',
        direction: 'CREDIT',
        amountPaise: tx.amountPaise,
        balanceAfterPaise: user.walletBalancePaise,
        referenceType: 'WITHDRAWAL',
        referenceId: tx.transactionId,
        narration: `Wallet balance restored from cancelled withdrawal ${tx.transactionId}`,
      },
    ]);

    tx.status = 'REVERSED';
    tx.narration = `${tx.narration} (Cancelled by user - funds refunded)`;
    await tx.save();

    return res.status(200).json({
      status: 'success',
      message: `Pending withdrawal of ₹${tx.amountPaise / 100} has been cancelled and refunded to your wallet.`,
      data: { transaction: tx, walletBalancePaise: user.walletBalancePaise },
    });
  } catch (err) {
    return next(err);
  }
}

export async function exportTransactionsCsv(req, res, next) {
  try {
    const userId = req.user._id;
    const transactions = await Transaction.find({ user: userId }).sort({ createdAt: -1 });

    const headers = ['Date', 'Transaction ID', 'Type', 'Amount (INR)', 'Status', 'Narration'];
    const rows = transactions.map((t) => [
      new Date(t.createdAt).toISOString(),
      `"${t.transactionId}"`,
      t.type,
      (t.amountPaise / 100).toFixed(2),
      t.status,
      `"${(t.narration || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="ips-statement-${Date.now()}.csv"`);
    return res.status(200).send(csvContent);
  } catch (err) {
    return next(err);
  }
}
