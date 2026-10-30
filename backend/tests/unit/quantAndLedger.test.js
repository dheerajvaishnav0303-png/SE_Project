import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateXIRR, calculateCAGR, calculateSharpeRatio } from '../../src/services/quant/xirrEngine.js';
import { calculateStepUpSIP, calculateGoalGlidepath, runMonteCarloGoalSimulation } from '../../src/services/quant/sipAndGoalEngine.js';
import { executeFIFOLotConsumption, analyzeTaxLotsAndHarvesting } from '../../src/services/quant/taxHarvestingEngine.js';

test('Quant Engine: calculateXIRR with exact irregular cashflows', () => {
  // Cashflows: Invest ₹1,00,000 on Jan 1, 2024. Invest ₹50,000 on July 1, 2024. Terminal valuation ₹1,80,000 on Jan 1, 2025.
  const cashflows = [
    { amountPaise: -10000000, date: '2024-01-01T00:00:00.000Z' },
    { amountPaise: -5000000, date: '2024-07-01T00:00:00.000Z' },
    { amountPaise: 18000000, date: '2025-01-01T00:00:00.000Z' },
  ];

  const xirr = calculateXIRR(cashflows);
  assert.ok(xirr > 0.20 && xirr < 0.35, `XIRR ${xirr} should be roughly ~26.5%`);
});

test('Quant Engine: calculateCAGR for multi-year lump sum', () => {
  // Invest ₹1,00,000, doubles to ₹2,00,000 in 3 years (1095 days)
  const cagr = calculateCAGR(10000000, 20000000, 1095);
  // Expected: (2)^(1/3) - 1 =~ 0.2599 (26%)
  assert.ok(Math.abs(cagr - 0.2599) < 0.005, `CAGR ${cagr} should be ~26%`);
});

test('Quant Engine: calculateSharpeRatio correctly assesses risk-adjusted return', () => {
  const returns = [0.01, -0.005, 0.015, 0.002, -0.008, 0.012, 0.004, -0.001, 0.009, 0.003];
  const sharpe = calculateSharpeRatio(returns, 0.0675);
  assert.ok(typeof sharpe === 'number');
  assert.ok(!isNaN(sharpe));
});

test('Quant Engine: Step-Up SIP future value and compounding schedule', () => {
  // Monthly ₹10,000 (1,000,000 paise), 10% annual step-up, 12% return, 5 years
  const result = calculateStepUpSIP({
    initialMonthlyPaise: 1000000,
    stepUpPercentage: 10,
    annualExpectedReturn: 0.12,
    tenureYears: 5,
  });

  assert.equal(result.schedule.length, 5);
  assert.ok(result.totalInvestedPaise > 60000000, 'Invested should exceed flat 600,000 due to 10% step-up');
  assert.ok(result.terminalValuePaise > result.totalInvestedPaise, 'Terminal wealth must exceed invested capital');
  assert.ok(result.wealthGainPaise > 0);
  assert.equal(result.terminalValuePaise, result.totalInvestedPaise + result.wealthGainPaise);
});

test('Quant Engine: Goal Glidepath and de-risking alerts', () => {
  // Goal: ₹1 Crore in 10 years, Category: EDUCATION (8.5% inflation)
  const tenYearsOut = new Date(Date.now() + 10 * 365.25 * 24 * 60 * 60 * 1000);
  const glidepath = calculateGoalGlidepath({
    targetCorpusPaise: 1000000000,
    currentCorpusPaise: 100000000,
    targetDate: tenYearsOut,
    category: 'EDUCATION',
  });

  assert.ok(glidepath.adjustedTargetCorpusPaise > 1000000000, 'Education inflation must increase target corpus');
  assert.equal(glidepath.isWithinDeRiskingWindow, false);
  assert.equal(glidepath.recommendedAssetAllocation.deRiskAlert, false);

  // Goal within 1 year (Preservation stage)
  const oneYearOut = new Date(Date.now() + 300 * 24 * 60 * 60 * 1000);
  const imminentGoal = calculateGoalGlidepath({
    targetCorpusPaise: 500000000,
    currentCorpusPaise: 450000000,
    targetDate: oneYearOut,
    category: 'RETIREMENT',
  });

  assert.equal(imminentGoal.isWithinDeRiskingWindow, true);
  assert.equal(imminentGoal.recommendedAssetAllocation.deRiskAlert, true);
  assert.equal(imminentGoal.recommendedAssetAllocation.debtPercent, 70);
});

test('Quant Engine: Monte Carlo Goal Simulation percentiles', () => {
  const simulation = runMonteCarloGoalSimulation({
    currentCorpusPaise: 100000000,
    monthlySavingsPaise: 5000000,
    yearsRemaining: 5,
    targetCorpusPaise: 500000000,
    iterations: 500,
  });

  assert.ok(simulation.p10ConservativePaise < simulation.p50MedianPaise, 'P10 must be strictly less than P50');
  assert.ok(simulation.p50MedianPaise < simulation.p90OptimisticPaise, 'P50 must be strictly less than P90');
  assert.ok(simulation.probabilityScore >= 0 && simulation.probabilityScore <= 100);
  assert.ok(['ON_TRACK', 'ATTENTION_REQUIRED', 'CRITICAL_DEFICIT'].includes(simulation.healthStatus));
});

test('Tax Engine: FIFO Lot Consumption and STCG/LTCG segregation', () => {
  const twoYearsAgo = new Date(Date.now() - 730 * 24 * 60 * 60 * 1000);
  const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const mockLots = [
    {
      _id: 'lot_long_term',
      purchaseDate: twoYearsAgo,
      purchaseNavPaise: 10000, // ₹100.00
      remainingUnits: { toString: () => '100.0000' },
    },
    {
      _id: 'lot_short_term',
      purchaseDate: threeMonthsAgo,
      purchaseNavPaise: 15000, // ₹150.00
      remainingUnits: { toString: () => '50.0000' },
    },
  ];

  // Redeem 120 units @ ₹200 (20000 paise)
  // Should fully consume 100 units from Lot 1 (LTCG: 100 * (200 - 100) = ₹10,000)
  // Should partially consume 20 units from Lot 2 (STCG: 20 * (200 - 150) = ₹1,000)
  const result = executeFIFOLotConsumption(mockLots, 120, 20000);

  assert.equal(result.consumedLots.length, 2);
  assert.equal(result.consumedLots[0].lotId, 'lot_long_term');
  assert.equal(result.consumedLots[0].isLongTerm, true);
  assert.equal(result.consumedLots[0].unitsDeducted, '100');

  assert.equal(result.consumedLots[1].lotId, 'lot_short_term');
  assert.equal(result.consumedLots[1].isLongTerm, false);
  assert.equal(result.consumedLots[1].unitsDeducted, '20');

  assert.equal(result.ltcgPaise, 1000000); // ₹10,000 in paise
  assert.equal(result.stcgPaise, 100000);  // ₹1,000 in paise
  assert.equal(result.remainingUnfulfilledUnits, 0);
});

test('Tax Engine: Tax-Loss Harvesting detection', () => {
  const openLots = [
    {
      _id: 'loss_lot_1',
      plan: 'plan_1',
      schemeName: 'Nifty Fund',
      purchaseDate: new Date(),
      purchaseNavPaise: 5000, // Bought @ ₹50
      remainingUnits: { toString: () => '100.0000' },
      assetCategory: 'EQUITY',
    },
  ];

  const currentNavs = { plan_1: 4000 }; // Current @ ₹40 (₹10 loss per unit * 100 = ₹1,000 loss)
  const analysis = analyzeTaxLotsAndHarvesting(openLots, currentNavs);

  assert.equal(analysis.harvestingOpportunities.length, 1);
  assert.equal(analysis.harvestingOpportunities[0].unrealizedLossPaise, 100000); // ₹1,000 in paise
  assert.equal(analysis.harvestingOpportunities[0].potentialTaxSavingsPaise, 20000); // 20% STCG = ₹200
});

