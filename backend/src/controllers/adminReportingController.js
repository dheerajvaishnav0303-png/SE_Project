import { User } from '../models/User.js';
import { Investment } from '../models/Investment.js';
import { TaxLot } from '../models/TaxLot.js';
import { LedgerEntry } from '../models/LedgerEntry.js';
import { AuditLog } from '../models/AuditLog.js';
import { SIP } from '../models/SIP.js';
import { logAuditEvent } from '../utils/auditLogger.js';

export async function getAllSipsMonitor(req, res, next) {
  try {
    const { status, filter } = req.query;
    const query = {};
    if (status) query.status = status;

    const sips = await SIP.find(query)
      .populate('user', 'email firstName lastName walletBalancePaise')
      .populate('plan', 'name navPaise category')
      .sort({ nextExecutionDate: 1 });

    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const analyzed = sips.map((s) => {
      const userBalance = s.user?.walletBalancePaise || 0;
      const isDueSoon = s.nextExecutionDate <= in7Days;
      const isLowBalance = userBalance < s.amountPaise;
      return {
        ...s.toObject(),
        isDueSoon,
        isLowBalance,
      };
    });

    let filtered = analyzed;
    if (filter === 'DUE_7_DAYS') filtered = analyzed.filter((s) => s.isDueSoon);
    if (filter === 'LOW_BALANCE') filtered = analyzed.filter((s) => s.isLowBalance);

    return res.status(200).json({ status: 'success', data: { sips: filtered } });
  } catch (err) {
    return next(err);
  }
}

export async function triggerScheduledSipBatch(req, res, next) {
  try {
    const dueSips = await SIP.find({
      status: 'ACTIVE',
      nextExecutionDate: { $lte: new Date() },
    }).populate('plan');

    let processedCount = 0;
    let failedCount = 0;

    for (const sip of dueSips) {
      const user = await User.findById(sip.user);
      if (!user || user.walletBalancePaise < sip.amountPaise) {
        failedCount++;
        continue;
      }
      user.walletBalancePaise -= sip.amountPaise;
      await user.save();

      sip.nextExecutionDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await sip.save();
      processedCount++;
    }

    await logAuditEvent({
      req,
      category: 'SYSTEM_CRON',
      action: 'SIP_BATCH_TRIGGERED',
      severity: 'INFO',
      diffPayload: { processedCount, failedCount },
    });

    return res.status(200).json({
      status: 'success',
      message: `Batch complete: ${processedCount} SIPs processed, ${failedCount} skipped due to low balance.`,
      data: { processedCount, failedCount },
    });
  } catch (err) {
    return next(err);
  }
}

export async function exportAuditLogsCsv(req, res, next) {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(1000);
    const headers = ['Timestamp', 'Actor Email', 'Role', 'Category', 'Severity', 'Action', 'Entity Type', 'Entity ID', 'Reason'];
    const rows = logs.map((l) => [
      new Date(l.createdAt).toISOString(),
      `"${l.actor?.email || ''}"`,
      l.actor?.role || '',
      l.category,
      l.severity,
      l.action,
      l.targetEntity?.entityType || '',
      `"${l.targetEntity?.entityId || ''}"`,
      `"${(l.diffPayload?.reason || '').replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${Date.now()}.csv"`);
    return res.status(200).send(csv);
  } catch (err) {
    return next(err);
  }
}

export async function exportUsersCsv(req, res, next) {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    const headers = ['User ID', 'Email', 'First Name', 'Last Name', 'Role', 'KYC Status', 'Risk Profile', 'Wallet (INR)', '2FA Enabled', 'Created At'];
    const rows = users.map((u) => [
      `"${u._id}"`,
      `"${u.email}"`,
      `"${u.firstName}"`,
      `"${u.lastName}"`,
      u.role,
      u.kycStatus,
      u.riskProfile || 'UNSPECIFIED',
      (u.walletBalancePaise / 100).toFixed(2),
      u.twoFactorEnabled ? 'TRUE' : 'FALSE',
      new Date(u.createdAt).toISOString(),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="users-register-${Date.now()}.csv"`);
    return res.status(200).send(csv);
  } catch (err) {
    return next(err);
  }
}

export async function exportLedgerCsv(req, res, next) {
  try {
    const entries = await LedgerEntry.find().sort({ recordedAt: -1 }).limit(2000);
    const headers = ['Recorded At', 'Transaction ID', 'User ID', 'Account Type', 'Leg', 'Amount (INR)', 'Balance After (INR)', 'Narration'];
    const rows = entries.map((e) => [
      new Date(e.recordedAt).toISOString(),
      `"${e.transactionId}"`,
      `"${e.user}"`,
      e.accountType,
      e.direction,
      (e.amountPaise / 100).toFixed(2),
      (e.balanceAfterPaise / 100).toFixed(2),
      `"${(e.narration || '').replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="master-ledger-${Date.now()}.csv"`);
    return res.status(200).send(csv);
  } catch (err) {
    return next(err);
  }
}

export async function exportHoldingsCsv(req, res, next) {
  try {
    const holdings = await Investment.find({ status: 'ACTIVE' }).populate('user plan');
    const headers = ['Holding ID', 'Investor Email', 'Security Name', 'Units', 'Invested (INR)', 'Current Value (INR)', 'Folio Number'];
    const rows = holdings.map((h) => [
      `"${h._id}"`,
      `"${h.user?.email || ''}"`,
      `"${h.plan?.name || ''}"`,
      h.units?.toString() || '0',
      (h.investedPaise / 100).toFixed(2),
      (h.currentValuePaise / 100).toFixed(2),
      `"${h.folioNumber}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="aum-holdings-${Date.now()}.csv"`);
    return res.status(200).send(csv);
  } catch (err) {
    return next(err);
  }
}
