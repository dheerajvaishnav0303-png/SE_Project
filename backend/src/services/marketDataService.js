import Decimal from 'decimal.js';
import { InvestmentPlan } from '../models/InvestmentPlan.js';
import { Investment } from '../models/Investment.js';
import { PortfolioSnapshot } from '../models/PortfolioSnapshot.js';
import { calculateXIRR } from './quant/xirrEngine.js';
import { redis } from '../config/redis.js';
import { logger } from '../utils/logger.js';

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_EVEN });

export async function fetchLiveNav(schemeCode, fallbackNavPaise) {
  const cacheKey = `market:nav:${schemeCode}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    return parseInt(cached, 10);
  }

  try {
    if (schemeCode && schemeCode.length >= 5) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`https://api.mfapi.in/mf/${schemeCode}/latest`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const latestNav = data?.data?.[0]?.nav;
        if (latestNav && !isNaN(latestNav)) {
          const navPaise = Math.round(parseFloat(latestNav) * 100);
          await redis.set(cacheKey, String(navPaise), 'EX', 3600);
          return navPaise;
        }
      }
    }
  } catch (err) {
    logger.debug({ schemeCode, message: err.message }, 'Live NAV fetch fallback used.');
  }

  return fallbackNavPaise;
}

export async function runDailyMarkToMarket(userId = null) {
  const filter = userId ? { user: userId, status: 'ACTIVE' } : { status: 'ACTIVE' };
  const investments = await Investment.find(filter).populate('plan');

  const userInvestmentsMap = new Map();
  for (const inv of investments) {
    const uId = inv.user.toString();
    if (!userInvestmentsMap.has(uId)) {
      userInvestmentsMap.set(uId, []);
    }
    userInvestmentsMap.get(uId).push(inv);
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  for (const [uId, userInvs] of userInvestmentsMap.entries()) {
    let totalInvestedPaise = 0;
    let totalCurrentValuePaise = 0;
    const allocation = { equityPaise: 0, debtPaise: 0, hybridPaise: 0, goldPaise: 0, cashPaise: 0 };
    const cashflows = [];

    for (const inv of userInvs) {
      const units = new Decimal(inv.units.toString());
      if (units.isZero()) continue;

      const plan = inv.plan;
      const latestNavPaise = plan.navPaise;

      const currentValue = units.times(latestNavPaise).round().toNumber();
      inv.currentValuePaise = currentValue;
      await inv.save();

      totalInvestedPaise += inv.investedPaise;
      totalCurrentValuePaise += currentValue;

      if (plan.category === 'EQUITY') allocation.equityPaise += currentValue;
      else if (plan.category === 'DEBT') allocation.debtPaise += currentValue;
      else if (plan.category === 'HYBRID') allocation.hybridPaise += currentValue;
      else if (plan.category === 'GOLD') allocation.goldPaise += currentValue;

      cashflows.push({ amountPaise: -inv.investedPaise, date: inv.createdAt });
    }

    if (totalCurrentValuePaise > 0) {
      cashflows.push({ amountPaise: totalCurrentValuePaise, date: new Date() });
    }

    const xirr = calculateXIRR(cashflows);

    await PortfolioSnapshot.findOneAndUpdate(
      { user: uId, date: today },
      {
        user: uId,
        date: today,
        investedPaise: totalInvestedPaise,
        currentValuePaise: totalCurrentValuePaise,
        unrealizedPnlPaise: totalCurrentValuePaise - totalInvestedPaise,
        xirr: Number(xirr.toFixed(4)),
        benchmarkValue: 100.0,
        assetAllocation: allocation,
      },
      { upsert: true, new: true }
    );
  }

  logger.info({ usersUpdated: userInvestmentsMap.size }, 'Daily Mark-to-Market valuation completed.');
}

