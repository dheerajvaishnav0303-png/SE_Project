import mongoose from 'mongoose';
import Decimal from 'decimal.js';
import { InvestmentPlan } from '../models/InvestmentPlan.js';
import { Investment } from '../models/Investment.js';
import { LedgerEntry } from '../models/LedgerEntry.js';
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';
import { Notification } from '../models/Notification.js';
import { runDailyMarkToMarket } from '../services/marketDataService.js';
import { seedInstitutionalData } from '../services/dataSeeder.js';
import { logAuditEvent } from '../utils/auditLogger.js';

export async function createCatalogPlan(req, res, next) {
  try {
    const { assetWeights } = req.body;
    if (assetWeights) {
      const sum = (assetWeights.equity || 0) + (assetWeights.debt || 0) + (assetWeights.gold || 0) + (assetWeights.cash || 0);
      if (sum !== 100) {
        return res.status(400).json({ status: 'fail', message: `Asset allocation weights must sum to exactly 100% (currently ${sum}%).` });
      }
    }
    const plan = await InvestmentPlan.create(req.body);
    await logAuditEvent({ req, category: 'CATALOG_CHANGE', action: 'PLAN_CREATED', targetEntity: { entityType: 'InvestmentPlan', entityId: plan._id.toString(), label: plan.name }, diffPayload: { newState: plan.toObject() } });
    return res.status(201).json({ status: 'success', data: { plan } });
  } catch (err) {
    return next(err);
  }
}

export async function updateCatalogPlan(req, res, next) {
  try {
    const { id } = req.params;
    const oldPlan = await InvestmentPlan.findById(id);
    const plan = await InvestmentPlan.findByIdAndUpdate(id, req.body, { new: true });
    await logAuditEvent({ req, category: 'CATALOG_CHANGE', action: 'PLAN_UPDATED', targetEntity: { entityType: 'InvestmentPlan', entityId: id, label: plan?.name }, diffPayload: { previousState: oldPlan?.toObject(), newState: plan?.toObject() } });
    return res.status(200).json({ status: 'success', data: { plan } });
  } catch (err) {
    return next(err);
  }
}

export async function updatePlanNavAndRecalculate(req, res, next) {
  try {
    const { id } = req.params;
    const { navPaise } = req.body;
    if (!navPaise || navPaise <= 0) return res.status(400).json({ status: 'fail', message: 'Valid navPaise is mandatory.' });

    const plan = await InvestmentPlan.findById(id);
    if (!plan) return res.status(404).json({ status: 'fail', message: 'Plan not found.' });

    const oldNav = plan.navPaise;
    plan.navPaise = parseInt(navPaise, 10);
    plan.navDate = new Date();
    await plan.save();

    const holdings = await Investment.find({ plan: id, status: 'ACTIVE' });
    let totalUpdated = 0;
    for (const h of holdings) {
      const units = new Decimal(h.units.toString());
      h.currentValuePaise = units.times(plan.navPaise).round().toNumber();
      await h.save();
      totalUpdated++;
    }

    await logAuditEvent({ req, category: 'CATALOG_CHANGE', action: 'NAV_UPDATED', targetEntity: { entityType: 'InvestmentPlan', entityId: id, label: plan.name }, diffPayload: { oldNav, newNav: plan.navPaise, totalHoldersRecalculated: totalUpdated } });
    return res.status(200).json({ status: 'success', message: `NAV updated to ₹${plan.navPaise / 100}. Recalculated ${totalUpdated} holding portfolios.`, data: { plan, totalUpdated } });
  } catch (err) {
    return next(err);
  }
}

export async function togglePlanInflowStatus(req, res, next) {
  try {
    const { id } = req.params;
    const plan = await InvestmentPlan.findById(id);
    if (!plan) return res.status(404).json({ status: 'fail', message: 'Plan not found.' });

    plan.allowNewInflows = !plan.allowNewInflows;
    await plan.save();

    await logAuditEvent({ req, category: 'CATALOG_CHANGE', action: plan.allowNewInflows ? 'PLAN_INFLOWS_RESUMED' : 'PLAN_SOFT_CLOSED', targetEntity: { entityType: 'InvestmentPlan', entityId: id, label: plan.name } });
    return res.status(200).json({ status: 'success', message: `Plan ${plan.allowNewInflows ? 're-opened for inflows' : 'soft-closed (inflows paused)'}.`, data: { plan } });
  } catch (err) {
    return next(err);
  }
}

export async function getPlanHolders(req, res, next) {
  try {
    const { id } = req.params;
    const holdings = await Investment.find({ plan: id, status: 'ACTIVE' }).populate('user', 'email firstName lastName');
    const totalAum = holdings.reduce((s, h) => s + (h.currentValuePaise || 0), 0);
    const holders = holdings.map((h) => ({
      holdingId: h._id,
      user: h.user,
      units: h.units?.toString(),
      currentValuePaise: h.currentValuePaise,
      investedPaise: h.investedPaise,
      aumSharePct: totalAum > 0 ? Number(((h.currentValuePaise / totalAum) * 100).toFixed(2)) : 0,
    }));
    return res.status(200).json({ status: 'success', data: { totalAumPaise: totalAum, holdersCount: holders.length, holders } });
  } catch (err) {
    return next(err);
  }
}

export async function reconcileDoubleEntryLedger(req, res, next) {
  try {
    const [debitAgg, creditAgg, count] = await Promise.all([
      LedgerEntry.aggregate([{ $match: { direction: 'DEBIT' } }, { $group: { _id: null, total: { $sum: '$amountPaise' } } }]),
      LedgerEntry.aggregate([{ $match: { direction: 'CREDIT' } }, { $group: { _id: null, total: { $sum: '$amountPaise' } } }]),
      LedgerEntry.countDocuments(),
    ]);

    const totalDebits = debitAgg[0]?.total || 0;
    const totalCredits = creditAgg[0]?.total || 0;
    const variancePaise = Math.abs(totalDebits - totalCredits);
    const isBalanced = variancePaise === 0;

    await logAuditEvent({ req, category: 'LEDGER_MUTATION', action: 'RECONCILIATION_CHECK', severity: isBalanced ? 'INFO' : 'CRITICAL', diffPayload: { totalDebits, totalCredits, variancePaise, isBalanced } });
    return res.status(200).json({
      status: 'success',
      data: { isBalanced, totalDebitsPaise: totalDebits, totalCreditsPaise: totalCredits, variancePaise, totalJournalLegs: count, verifiedAt: new Date().toISOString() },
    });
  } catch (err) {
    return next(err);
  }
}

export async function getAuditLogs(req, res, next) {
  try {
    const { category, severity, search, limit = 50, page = 1 } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (severity) filter.severity = severity;
    if (search) filter.$or = [{ 'actor.email': { $regex: search, $options: 'i' } }, { action: { $regex: search, $options: 'i' } }];

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [logs, total] = await Promise.all([
      AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit, 10)),
      AuditLog.countDocuments(filter),
    ]);

    return res.status(200).json({ status: 'success', data: { logs, total, totalPages: Math.ceil(total / parseInt(limit, 10)) } });
  } catch (err) {
    return next(err);
  }
}

export async function broadcastNotification(req, res, next) {
  try {
    const { title, message, severity, targetType, targetRiskTier, targetEmail } = req.body;
    let targetUserId = null;
    if (targetEmail) {
      const u = await User.findOne({ email: targetEmail });
      if (u) targetUserId = u._id;
    }
    const note = await Notification.create({
      title,
      message,
      severity: severity || 'INFO',
      targetType: targetType || 'ALL',
      targetRiskTier,
      targetUserId,
      sentBy: req.user._id,
    });
    await logAuditEvent({ req, category: 'AUTH_SECURITY', action: 'BROADCAST_SENT', diffPayload: { title, targetType } });
    return res.status(201).json({ status: 'success', message: 'Broadcast dispatched successfully.', data: { notification: note } });
  } catch (err) {
    return next(err);
  }
}

export async function getSystemDiagnostics(req, res, next) {
  try {
    const start = Date.now();
    await mongoose.connection.db.admin().ping();
    const dbLatencyMs = Date.now() - start;

    const [userCount, holdingCount, txCount, auditCount] = await Promise.all([
      User.countDocuments(),
      Investment.countDocuments(),
      LedgerEntry.countDocuments(),
      AuditLog.countDocuments(),
    ]);

    return res.status(200).json({
      status: 'success',
      data: {
        status: 'HEALTHY',
        dbLatencyMs,
        counts: { users: userCount, holdings: holdingCount, journalEntries: txCount, auditLogs: auditCount },
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    return next(err);
  }
}

export async function reseedDemoData(req, res, next) {
  try {
    const { confirmCode } = req.body;
    if (confirmCode !== 'SEED') {
      return res.status(400).json({ status: 'fail', message: 'You must provide confirmCode: "SEED" to execute safe re-seeding.' });
    }
    await seedInstitutionalData();
    await logAuditEvent({ req, category: 'SYSTEM_CRON', action: 'DATABASE_RESEEDED', severity: 'WARNING' });
    return res.status(200).json({ status: 'success', message: 'Database safely refreshed with institutional demo dataset.' });
  } catch (err) {
    return next(err);
  }
}

export async function triggerManualMTM(req, res, next) {
  try {
    const summary = await runDailyMarkToMarket(null);
    await logAuditEvent({ req, category: 'SYSTEM_CRON', action: 'MTM_VALUATION_TRIGGERED', severity: 'INFO', diffPayload: { summary } });
    return res.status(200).json({
      status: 'success',
      message: 'Daily Mark-to-Market revaluation completed across all investor folios.',
      data: summary,
    });
  } catch (err) {
    return next(err);
  }
}

