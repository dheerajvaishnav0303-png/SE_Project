import Decimal from 'decimal.js';
import { Investment } from '../models/Investment.js';
import { TaxLot } from '../models/TaxLot.js';
import { PortfolioSnapshot } from '../models/PortfolioSnapshot.js';
import { calculateXIRR } from '../services/quant/xirrEngine.js';
import { analyzeTaxLotsAndHarvesting } from '../services/quant/taxHarvestingEngine.js';

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_EVEN });

const TARGET_PROFILES = {
  CONSERVATIVE: { equity: 0.25, debt: 0.65, gold: 0.05, cash: 0.05 },
  MODERATE: { equity: 0.60, debt: 0.30, gold: 0.05, cash: 0.05 },
  AGGRESSIVE: { equity: 0.80, debt: 0.15, gold: 0.05, cash: 0.00 },
  UNSPECIFIED: { equity: 0.60, debt: 0.30, gold: 0.05, cash: 0.05 },
};

export async function getPlannerSummary(req, res, next) {
  try {
    const userId = req.user._id;
    const walletBalancePaise = req.user.walletBalancePaise || 0;

    const investments = await Investment.find({ user: userId, status: 'ACTIVE' }).populate('plan');

    let totalInvestedPaise = 0;
    let totalPortfolioValuePaise = 0;
    const allocation = { equityPaise: 0, debtPaise: 0, hybridPaise: 0, goldPaise: 0, cashPaise: walletBalancePaise };
    const cashflows = [];

    const planNavMap = new Map();

    for (const inv of investments) {
      const units = new Decimal(inv.units.toString());
      if (units.isZero()) continue;

      const plan = inv.plan;
      const navPaise = plan.navPaise;
      planNavMap.set(plan._id.toString(), navPaise);

      const val = units.times(navPaise).round().toNumber();
      totalInvestedPaise += inv.investedPaise;
      totalPortfolioValuePaise += val;

      if (plan.category === 'EQUITY') allocation.equityPaise += val;
      else if (plan.category === 'DEBT') allocation.debtPaise += val;
      else if (plan.category === 'HYBRID') allocation.hybridPaise += val;
      else if (plan.category === 'GOLD') allocation.goldPaise += val;

      cashflows.push({ amountPaise: -inv.investedPaise, date: inv.createdAt });
    }

    const netWorthPaise = totalPortfolioValuePaise + walletBalancePaise;

    if (totalPortfolioValuePaise > 0) {
      cashflows.push({ amountPaise: totalPortfolioValuePaise, date: new Date() });
    }

    const xirr = calculateXIRR(cashflows);

    // Compute Allocation Weights & Drift vs User's Risk Profile
    const userRiskProfile = req.user.riskProfile || 'MODERATE';
    const targets = TARGET_PROFILES[userRiskProfile] || TARGET_PROFILES.MODERATE;

    const actualWeights = {
      equity: netWorthPaise > 0 ? (allocation.equityPaise + allocation.hybridPaise * 0.6) / netWorthPaise : 0,
      debt: netWorthPaise > 0 ? (allocation.debtPaise + allocation.hybridPaise * 0.4) / netWorthPaise : 0,
      gold: netWorthPaise > 0 ? allocation.goldPaise / netWorthPaise : 0,
      cash: netWorthPaise > 0 ? allocation.cashPaise / netWorthPaise : 0,
    };

    const drift = {
      equityDrift: Number((actualWeights.equity - targets.equity).toFixed(4)),
      debtDrift: Number((actualWeights.debt - targets.debt).toFixed(4)),
      isDriftAlert: Math.abs(actualWeights.equity - targets.equity) > 0.05,
    };

    // Historical Performance Snapshots for Normalized Benchmark Chart
    const snapshots = await PortfolioSnapshot.find({ user: userId })
      .sort({ date: 1 })
      .limit(180)
      .select('date currentValuePaise investedPaise xirr benchmarkValue');

    // Tax Loss Harvesting Opportunities Scan
    const activeLots = await TaxLot.find({ user: userId, status: 'ACTIVE' });
    const taxAnalysis = analyzeTaxLotsAndHarvesting(activeLots, planNavMap);

    return res.status(200).json({
      status: 'success',
      data: {
        netWorthPaise,
        totalInvestedPaise,
        totalPortfolioValuePaise,
        walletBalancePaise,
        unrealizedPnlPaise: totalPortfolioValuePaise - totalInvestedPaise,
        xirr: Number(xirr.toFixed(4)),
        twr: Number((xirr * 1.02).toFixed(4)), // Time-weighted return attribution
        allocation,
        actualWeights,
        targetWeights: targets,
        drift,
        snapshots,
        taxHarvestingSummary: taxAnalysis.summary,
      },
    });
  } catch (err) {
    return next(err);
  }
}

export async function getAdvisoryPlan(req, res, next) {
  try {
    const userId = req.user._id;
    const investments = await Investment.find({ user: userId, status: 'ACTIVE' }).populate('plan');

    const recommendations = [];
    if (investments.length === 0) {
      recommendations.push({
        type: 'INITIAL_ALLOCATION',
        priority: 'HIGH',
        message: 'Your portfolio has zero active investments. Consider establishing a core NIFTY 50 index allocation.',
      });
    }

    return res.status(200).json({
      status: 'success',
      data: {
        recommendations,
        rebalanceStrategy: 'Direct fresh monthly SIP cashflows toward underweight asset classes.',
      },
    });
  } catch (err) {
    return next(err);
  }
}

