import { runDailyMarkToMarket } from '../services/marketDataService.js';
import { executeInvestmentPurchase } from '../services/ledgerService.js';
import { SIP } from '../models/SIP.js';
import { User } from '../models/User.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import { logger } from '../utils/logger.js';

export async function executeMtmValuation(req, res, next) {
  try {
    const startTime = Date.now();
    logger.info('Initiating daily Mark-to-Market valuation cron job...');

    await runDailyMarkToMarket();

    const durationMs = Date.now() - startTime;

    await logAuditEvent({
      req,
      category: 'SYSTEM_CRON',
      action: 'CRON_MTM_VALUATION_EXECUTED',
      severity: 'INFO',
      diffPayload: { durationMs, timestamp: new Date().toISOString() },
    });

    return res.status(200).json({
      status: 'success',
      message: 'Daily Mark-to-Market valuation and portfolio snapshots completed successfully.',
      data: { durationMs, timestamp: new Date().toISOString() },
    });
  } catch (err) {
    logger.error({ err: err.message }, 'Error executing daily MTM valuation cron job.');
    return next(err);
  }
}

export async function executeScheduledSips(req, res, next) {
  try {
    const startTime = Date.now();
    logger.info('Initiating scheduled SIP mandate batch cron execution...');

    const now = new Date();
    const dueSips = await SIP.find({
      status: 'ACTIVE',
      nextExecutionDate: { $lte: now },
    }).populate('plan');

    let processedCount = 0;
    let failedCount = 0;
    const failures = [];

    for (const sip of dueSips) {
      if (!sip.plan || !sip.plan.isActive) {
        failedCount++;
        failures.push({ sipId: sip._id, reason: 'Plan inactive or missing' });
        continue;
      }

      const user = await User.findById(sip.user);
      if (!user || user.isFrozen || user.walletBalancePaise < sip.amountPaise) {
        failedCount++;
        failures.push({
          sipId: sip._id,
          userId: sip.user,
          reason: !user ? 'User not found' : user.isFrozen ? 'User frozen' : 'Insufficient wallet balance',
        });
        continue;
      }

      try {
        const idempotencyKey = `cron_sip_${sip._id}_${now.toISOString().split('T')[0]}`;
        await executeInvestmentPurchase({
          userId: sip.user,
          planId: sip.plan._id,
          amountPaise: sip.amountPaise,
          idempotencyKey,
          narration: `Vercel Cron SIP execution: ${sip.plan.name}`,
        });

        // Advance nextExecutionDate by 30 days
        const nextDate = new Date(sip.nextExecutionDate || now);
        nextDate.setMonth(nextDate.getMonth() + 1);
        sip.nextExecutionDate = nextDate;
        sip.installmentsPaid = (sip.installmentsPaid || 0) + 1;
        await sip.save();

        processedCount++;
      } catch (purchaseErr) {
        logger.error({ sipId: sip._id, err: purchaseErr.message }, 'Failed to execute SIP purchase.');
        failedCount++;
        failures.push({ sipId: sip._id, reason: purchaseErr.message });
      }
    }

    const durationMs = Date.now() - startTime;

    await logAuditEvent({
      req,
      category: 'SYSTEM_CRON',
      action: 'CRON_SIP_BATCH_EXECUTED',
      severity: failedCount > 0 ? 'WARNING' : 'INFO',
      diffPayload: { processedCount, failedCount, durationMs, failures },
    });

    return res.status(200).json({
      status: 'success',
      message: `SIP batch execution complete: ${processedCount} processed, ${failedCount} skipped/failed.`,
      data: { processedCount, failedCount, durationMs, failures },
    });
  } catch (err) {
    logger.error({ err: err.message }, 'Error executing scheduled SIP cron job.');
    return next(err);
  }
}

