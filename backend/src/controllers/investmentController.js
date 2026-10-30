import Decimal from 'decimal.js';
import { InvestmentPlan } from '../models/InvestmentPlan.js';
import { Investment } from '../models/Investment.js';
import { TaxLot } from '../models/TaxLot.js';
import { Goal } from '../models/Goal.js';
import { executeInvestmentPurchase, executeFIFORedemption } from '../services/ledgerService.js';
import { fetchLiveNav } from '../services/marketDataService.js';
import { analyzeTaxLotsAndHarvesting } from '../services/quant/taxHarvestingEngine.js';

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_EVEN });

export async function getCatalog(req, res, next) {
  try {
    const { category, riskLevel, search } = req.query;
    const filter = { isActive: true };

    if (category) filter.category = category.toUpperCase();
    if (riskLevel) filter.riskLevel = riskLevel.toUpperCase();
    if (search) filter.name = { $regex: search, $options: 'i' };

    const plans = await InvestmentPlan.find(filter).sort({ name: 1 });
    return res.status(200).json({ status: 'success', data: { plans } });
  } catch (err) {
    return next(err);
  }
}

export async function getPlanById(req, res, next) {
  try {
    const plan = await InvestmentPlan.findById(req.params.id);
    if (!plan || !plan.isActive) {
      return res.status(404).json({
        type: 'https://api.ips-wealth.com/errors/plan-not-found',
        title: 'Plan Not Found',
        status: 404,
        detail: 'The requested investment plan does not exist or has been retired.',
      });
    }

    // Attempt live NAV refresh
    const liveNavPaise = await fetchLiveNav(plan.schemeCode, plan.navPaise);
    if (liveNavPaise !== plan.navPaise) {
      plan.navPaise = liveNavPaise;
      plan.navDate = new Date();
      await plan.save();
    }

    return res.status(200).json({ status: 'success', data: { plan } });
  } catch (err) {
    return next(err);
  }
}

export async function getCustomerHoldings(req, res, next) {
  try {
    const userId = req.user._id;
    const holdings = await Investment.find({ user: userId, status: 'ACTIVE' }).populate('plan linkedGoal');

    const mapped = holdings.map((inv) => {
      const units = new Decimal(inv.units.toString());
      const navPaise = inv.plan?.navPaise || 0;
      const currentValuePaise = units.times(navPaise).round().toNumber();
      const unrealizedPnlPaise = currentValuePaise - inv.investedPaise;
      const returnsPct = inv.investedPaise > 0 ? (unrealizedPnlPaise / inv.investedPaise) * 100 : 0;

      return {
        _id: inv._id,
        plan: inv.plan,
        units: units.toString(),
        folioNumber: inv.folioNumber,
        investedPaise: inv.investedPaise,
        currentValuePaise,
        unrealizedPnlPaise,
        returnsPercentage: Number(returnsPct.toFixed(2)),
        linkedGoal: inv.linkedGoal ? { _id: inv.linkedGoal._id, title: inv.linkedGoal.title } : null,
      };
    });

    return res.status(200).json({ status: 'success', data: { holdings: mapped } });
  } catch (err) {
    return next(err);
  }
}

export async function linkInvestmentToGoal(req, res, next) {
  try {
    const { id } = req.params;
    const { goalId } = req.body;
    const userId = req.user._id;

    const investment = await Investment.findOne({ _id: id, user: userId });
    if (!investment) {
      return res.status(404).json({
        type: 'https://api.ips-wealth.com/errors/holding-not-found',
        title: 'Holding Not Found',
        status: 404,
        detail: 'The requested holding was not found on your profile.',
      });
    }

    if (goalId) {
      const goal = await Goal.findOne({ _id: goalId, user: userId });
      if (!goal) {
        return res.status(404).json({
          type: 'https://api.ips-wealth.com/errors/goal-not-found',
          title: 'Goal Not Found',
          status: 404,
          detail: 'The target goal does not exist on your profile.',
        });
      }
      investment.linkedGoal = goal._id;
    } else {
      investment.linkedGoal = null;
    }

    await investment.save();

    if (goalId) {
      const linkedInvestments = await Investment.find({ user: userId, linkedGoal: goalId, status: 'ACTIVE' });
      const totalCorpus = linkedInvestments.reduce((sum, inv) => sum + (inv.currentValuePaise || 0), 0);
      await Goal.findByIdAndUpdate(goalId, { currentCorpusPaise: totalCorpus });
    }

    return res.status(200).json({
      status: 'success',
      message: goalId ? 'Investment linked to goal successfully.' : 'Investment unlinked from goal.',
      data: { investment },
    });
  } catch (err) {
    return next(err);
  }
}

export async function purchasePlan(req, res, next) {
  try {
    const { planId, amountPaise } = req.body;
    const userId = req.user._id;
    const idempotencyKey = req.headers['x-idempotency-key'];

    const result = await executeInvestmentPurchase({
      userId,
      planId,
      amountPaise,
      idempotencyKey,
    });

    return res.status(201).json({
      status: 'success',
      message: `Successfully invested ₹${amountPaise / 100}. Allotted ${result.allottedUnits} units.`,
      data: result,
    });
  } catch (err) {
    return next(err);
  }
}

export async function redeemPlan(req, res, next) {
  try {
    const { planId, units } = req.body;
    const userId = req.user._id;
    const idempotencyKey = req.headers['x-idempotency-key'];

    const result = await executeFIFORedemption({
      userId,
      planId,
      unitsToRedeem: units,
      idempotencyKey,
    });

    return res.status(200).json({
      status: 'success',
      message: `Redeemed ${units} units under FIFO tax lot allocation. Proceeds credited to wallet.`,
      data: result,
    });
  } catch (err) {
    return next(err);
  }
}

export async function getCustomerTaxLots(req, res, next) {
  try {
    const userId = req.user._id;
    const activeLots = await TaxLot.find({ user: userId, status: 'ACTIVE' }).populate('plan');

    const planNavMap = new Map();
    for (const lot of activeLots) {
      if (lot.plan) {
        planNavMap.set(lot.plan._id.toString(), lot.plan.navPaise);
      }
    }

    const analysis = analyzeTaxLotsAndHarvesting(activeLots, planNavMap);
    return res.status(200).json({ status: 'success', data: analysis });
  } catch (err) {
    return next(err);
  }
}

export async function updateUserProfile(req, res, next) {
  try {
    const { riskProfile, pan, kycSubmitted } = req.body;
    const user = req.user;

    if (riskProfile && ['CONSERVATIVE', 'MODERATE', 'AGGRESSIVE', 'UNSPECIFIED'].includes(riskProfile)) {
      user.riskProfile = riskProfile;
    }
    if (kycSubmitted && user.kycStatus === 'UNVERIFIED') {
      user.kycStatus = 'PENDING';
    }
    await user.save();

    return res.status(200).json({
      status: 'success',
      message: 'Investor profile updated successfully.',
      data: { user: user.toSafeObject() },
    });
  } catch (err) {
    return next(err);
  }
}


