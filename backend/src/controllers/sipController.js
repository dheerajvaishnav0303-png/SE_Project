import { SIP } from '../models/SIP.js';
import { InvestmentPlan } from '../models/InvestmentPlan.js';
import { executeInvestmentPurchase } from '../services/ledgerService.js';
import { logger } from '../utils/logger.js';

export async function getUserSips(req, res, next) {
  try {
    const sips = await SIP.find({ user: req.user._id }).populate('plan linkedGoal').sort({ createdAt: -1 });
    return res.status(200).json({ status: 'success', data: { sips } });
  } catch (err) {
    return next(err);
  }
}

export async function createSip(req, res, next) {
  try {
    const { planId, amountPaise, stepUpPercentage, frequency, debitDay, linkedGoal } = req.body;
    const userId = req.user._id;

    const plan = await InvestmentPlan.findById(planId);
    if (!plan || !plan.isActive) {
      return res.status(404).json({
        type: 'https://api.ips-wealth.com/errors/plan-not-found',
        title: 'Plan Inactive',
        status: 404,
        detail: 'The requested plan is not active for SIP creation.',
      });
    }

    // Compute next execution date based on chosen debitDay
    const now = new Date();
    const nextDate = new Date(now.getFullYear(), now.getMonth(), debitDay, 4, 0, 0);
    if (nextDate <= now) {
      nextDate.setMonth(nextDate.getMonth() + 1);
    }

    const sip = await SIP.create({
      user: userId,
      plan: planId,
      amountPaise,
      stepUpPercentage: stepUpPercentage || 0,
      frequency: frequency || 'MONTHLY',
      debitDay,
      nextExecutionDate: nextDate,
      linkedGoal: linkedGoal || null,
      mandateLimitPaise: Math.max(amountPaise * 5, 5000000), // Max ceiling
      status: 'ACTIVE',
    });

    return res.status(201).json({
      status: 'success',
      message: `SIP mandate created. Next debit on ${nextDate.toISOString().split('T')[0]}.`,
      data: { sip },
    });
  } catch (err) {
    return next(err);
  }
}

export async function updateSipStatus(req, res, next) {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!['ACTIVE', 'PAUSED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({
        type: 'https://api.ips-wealth.com/errors/invalid-status',
        title: 'Invalid Status',
        status: 400,
        detail: "Status must be 'ACTIVE', 'PAUSED', or 'CANCELLED'.",
      });
    }

    // Strict owner scoping
    const sip = await SIP.findOne({ _id: id, user: req.user._id });
    if (!sip) {
      return res.status(404).json({
        type: 'https://api.ips-wealth.com/errors/sip-not-found',
        title: 'SIP Mandate Not Found',
        status: 404,
        detail: 'The requested SIP mandate does not exist or belong to this account.',
      });
    }

    sip.status = status;
    await sip.save();

    return res.status(200).json({
      status: 'success',
      message: `SIP mandate status updated to ${status}.`,
      data: { sip },
    });
  } catch (err) {
    return next(err);
  }
}

export async function processDueSips(req, res, next) {
  try {
    const now = new Date();
    const dueSips = await SIP.find({ status: 'ACTIVE', nextExecutionDate: { $lte: now } }).populate('plan');

    let processedCount = 0;
    const errors = [];

    for (const sip of dueSips) {
      try {
        await executeInvestmentPurchase({
          userId: sip.user,
          planId: sip.plan._id,
          amountPaise: sip.amountPaise,
          idempotencyKey: `sip_cron_${sip._id}_${sip.nextExecutionDate.toISOString().slice(0, 10)}`,
        });

        // Advance nextExecutionDate by 1 month
        const nextExec = new Date(sip.nextExecutionDate);
        nextExec.setMonth(nextExec.getMonth() + 1);
        sip.nextExecutionDate = nextExec;
        sip.consecutiveFailures = 0;
        await sip.save();
        processedCount++;
      } catch (err) {
        sip.consecutiveFailures += 1;
        if (sip.consecutiveFailures >= 3) {
          sip.status = 'PAUSED';
          logger.warn({ sipId: sip._id }, 'SIP auto-paused after 3 consecutive failures.');
        }
        await sip.save();
        errors.push({ sipId: sip._id, reason: err.message });
      }
    }

    return res.status(200).json({
      status: 'success',
      data: { processedCount, dueCount: dueSips.length, errors },
    });
  } catch (err) {
    return next(err);
  }
}

export async function skipNextSipMonth(req, res, next) {
  try {
    const { id } = req.params;
    const sip = await SIP.findOne({ _id: id, user: req.user._id });
    if (!sip) {
      return res.status(404).json({
        type: 'https://api.ips-wealth.com/errors/sip-not-found',
        title: 'SIP Not Found',
        status: 404,
        detail: 'The requested SIP was not found on your profile.',
      });
    }

    const currentNext = new Date(sip.nextExecutionDate);
    currentNext.setMonth(currentNext.getMonth() + 1);
    sip.nextExecutionDate = currentNext;
    await sip.save();

    return res.status(200).json({
      status: 'success',
      message: `Next installment skipped. Rescheduled to ${currentNext.toISOString().split('T')[0]}.`,
      data: { sip },
    });
  } catch (err) {
    return next(err);
  }
}

export async function modifySip(req, res, next) {
  try {
    const { id } = req.params;
    const { amountPaise, stepUpPercentage, debitDay } = req.body;
    const sip = await SIP.findOne({ _id: id, user: req.user._id });
    if (!sip) {
      return res.status(404).json({
        type: 'https://api.ips-wealth.com/errors/sip-not-found',
        title: 'SIP Not Found',
        status: 404,
        detail: 'The requested SIP was not found.',
      });
    }

    if (amountPaise) sip.amountPaise = amountPaise;
    if (stepUpPercentage !== undefined) sip.stepUpPercentage = stepUpPercentage;
    if (debitDay) {
      sip.debitDay = debitDay;
      const now = new Date();
      let nextDate = new Date(now.getFullYear(), now.getMonth(), debitDay, 4, 0, 0);
      if (nextDate <= now) nextDate.setMonth(nextDate.getMonth() + 1);
      sip.nextExecutionDate = nextDate;
    }

    await sip.save();
    return res.status(200).json({
      status: 'success',
      message: 'SIP mandate parameters updated.',
      data: { sip },
    });
  } catch (err) {
    return next(err);
  }
}

export async function executeSipNow(req, res, next) {
  try {
    const { id } = req.params;
    const sip = await SIP.findOne({ _id: id, user: req.user._id }).populate('plan');
    if (!sip) {
      return res.status(404).json({
        type: 'https://api.ips-wealth.com/errors/sip-not-found',
        title: 'SIP Not Found',
        status: 404,
        detail: 'The requested SIP was not found.',
      });
    }

    const result = await executeInvestmentPurchase({
      userId: req.user._id,
      planId: sip.plan._id,
      amountPaise: sip.amountPaise,
      idempotencyKey: `sip_manual_${sip._id}_${Date.now()}`,
    });

    return res.status(200).json({
      status: 'success',
      message: `Instant SIP installment of ₹${sip.amountPaise / 100} executed successfully.`,
      data: result,
    });
  } catch (err) {
    return next(err);
  }
}

