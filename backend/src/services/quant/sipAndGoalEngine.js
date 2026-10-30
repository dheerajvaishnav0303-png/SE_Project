import Decimal from 'decimal.js';

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_EVEN });

export const CATEGORY_INFLATION_RATES = {
  EDUCATION: 0.085, // 8.5% higher education inflation
  HEALTHCARE: 0.090, // 9.0% medical contingency
  REAL_ESTATE: 0.075, // 7.5% property downpayment
  RETIREMENT: 0.060, // 6.0% baseline lifestyle CPI
  GENERAL: 0.060,
};

/**
 * Computes the Future Value of a Step-Up SIP and generates the amortization schedule.
 * 
 * @param {object} params
 * @param {number|string} params.initialMonthlyPaise Initial monthly installment in paise
 * @param {number} params.stepUpPercentage Annual step-up percentage (e.g., 10 for 10%)
 * @param {number} params.annualExpectedReturn Expected annual return (e.g., 0.12 for 12%)
 * @param {number} params.tenureYears Total duration in years
 * @returns {object} { terminalValuePaise, totalInvestedPaise, alphaGainPaise, schedule }
 */
export function calculateStepUpSIP({
  initialMonthlyPaise,
  stepUpPercentage = 10,
  annualExpectedReturn = 0.12,
  tenureYears = 15,
}) {
  const iMonthly = new Decimal(annualExpectedReturn).dividedBy(12);
  const stepUpFactor = new Decimal(1).plus(new Decimal(stepUpPercentage).dividedBy(100));

  let currentMonthly = new Decimal(initialMonthlyPaise);
  let accumulatedWealth = new Decimal(0);
  let totalInvested = new Decimal(0);

  const schedule = [];

  for (let year = 1; year <= tenureYears; year++) {
    let yearInvested = new Decimal(0);

    for (let month = 1; month <= 12; month++) {
      accumulatedWealth = accumulatedWealth.plus(currentMonthly);
      accumulatedWealth = accumulatedWealth.times(new Decimal(1).plus(iMonthly));
      yearInvested = yearInvested.plus(currentMonthly);
      totalInvested = totalInvested.plus(currentMonthly);
    }

    schedule.push({
      year,
      monthlyInstallmentPaise: currentMonthly.round().toNumber(),
      annualInvestedPaise: yearInvested.round().toNumber(),
      totalInvestedPaise: totalInvested.round().toNumber(),
      terminalValuePaise: accumulatedWealth.round().toNumber(),
      wealthGainPaise: accumulatedWealth.minus(totalInvested).round().toNumber(),
    });

    // Step-up applied for next year
    currentMonthly = currentMonthly.times(stepUpFactor);
  }

  const terminalValuePaise = accumulatedWealth.round().toNumber();
  const totalInvestedPaise = totalInvested.round().toNumber();

  return {
    terminalValuePaise,
    totalInvestedPaise,
    wealthGainPaise: terminalValuePaise - totalInvestedPaise,
    schedule,
  };
}

/**
 * Calculates Inflation-Adjusted Target Corpus and Required Monthly Savings.
 */
export function calculateGoalGlidepath({
  targetCorpusPaise,
  currentCorpusPaise = 0,
  targetDate,
  category = 'GENERAL',
  annualExpectedReturn = 0.12,
}) {
  const inflationRate = CATEGORY_INFLATION_RATES[category.toUpperCase()] || 0.06;
  const now = new Date();
  const target = new Date(targetDate);
  const yearsRemaining = Math.max(0.1, (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 365.25));

  // Inflation-Adjusted Target = Target * (1 + inflation)^years
  const inflationMultiplier = Decimal.pow(new Decimal(1).plus(inflationRate), yearsRemaining);
  const adjustedTargetCorpusPaise = new Decimal(targetCorpusPaise).times(inflationMultiplier).round().toNumber();

  // Compounded current wealth at target date
  const compoundedCurrentPaise = new Decimal(currentCorpusPaise)
    .times(Decimal.pow(new Decimal(1).plus(annualExpectedReturn), yearsRemaining))
    .round();

  // Net shortfall to accumulate via fresh monthly SIPs
  const shortfallPaise = Decimal.max(0, new Decimal(adjustedTargetCorpusPaise).minus(compoundedCurrentPaise));

  // Required monthly savings using annuity formula
  const totalMonths = Math.ceil(yearsRemaining * 12);
  const iMonthly = new Decimal(annualExpectedReturn).dividedBy(12);

  let requiredMonthlySavingsPaise = 0;
  if (shortfallPaise.greaterThan(0) && totalMonths > 0) {
    // PMT = Shortfall * i / ((1 + i)^n - 1)
    const factor = Decimal.pow(new Decimal(1).plus(iMonthly), totalMonths).minus(1);
    requiredMonthlySavingsPaise = shortfallPaise.times(iMonthly).dividedBy(factor).round().toNumber();
  }

  // De-Risking Recommendation (Equity-to-Debt transition when within 24 months)
  const isWithinDeRiskingWindow = yearsRemaining <= 2.0;
  const recommendedAssetAllocation = isWithinDeRiskingWindow
    ? { equityPercent: 20, debtPercent: 70, cashPercent: 10, deRiskAlert: true }
    : yearsRemaining <= 5.0
    ? { equityPercent: 50, debtPercent: 45, cashPercent: 5, deRiskAlert: false }
    : { equityPercent: 80, debtPercent: 18, cashPercent: 2, deRiskAlert: false };

  return {
    yearsRemaining: Number(yearsRemaining.toFixed(2)),
    inflationRate,
    adjustedTargetCorpusPaise,
    shortfallPaise: shortfallPaise.round().toNumber(),
    requiredMonthlySavingsPaise,
    isWithinDeRiskingWindow,
    recommendedAssetAllocation,
  };
}

/**
 * Runs a 1,000-iteration Monte Carlo stochastic simulation for goal attainment.
 * Returns P10, P50, P90 percentile wealth trajectories and a feasibility probability score.
 */
export function runMonteCarloGoalSimulation({
  currentCorpusPaise,
  monthlySavingsPaise,
  yearsRemaining,
  annualExpectedReturn = 0.12,
  annualVolatility = 0.16,
  targetCorpusPaise,
  iterations = 1000,
}) {
  const months = Math.ceil(yearsRemaining * 12);
  const monthlyDrift = (annualExpectedReturn - 0.5 * Math.pow(annualVolatility, 2)) / 12;
  const monthlyVol = annualVolatility / Math.sqrt(12);

  const terminalOutcomes = [];

  for (let sim = 0; sim < iterations; sim++) {
    let wealth = Number(currentCorpusPaise);

    for (let m = 0; m < months; m++) {
      // Box-Muller transform for standard normal random variable
      const u1 = Math.random() || 1e-10;
      const u2 = Math.random() || 1e-10;
      const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

      const monthlyReturn = Math.exp(monthlyDrift + monthlyVol * z);
      wealth = (wealth + Number(monthlySavingsPaise)) * monthlyReturn;
    }

    terminalOutcomes.push(Math.round(wealth));
  }

  terminalOutcomes.sort((a, b) => a - b);

  const p10 = terminalOutcomes[Math.floor(iterations * 0.10)];
  const p50 = terminalOutcomes[Math.floor(iterations * 0.50)];
  const p90 = terminalOutcomes[Math.floor(iterations * 0.90)];

  const successfulRuns = terminalOutcomes.filter((val) => val >= Number(targetCorpusPaise)).length;
  const probabilityScore = Number(((successfulRuns / iterations) * 100).toFixed(1));

  let healthStatus = 'CRITICAL_DEFICIT';
  if (probabilityScore >= 80) {
    healthStatus = 'ON_TRACK';
  } else if (probabilityScore >= 50) {
    healthStatus = 'ATTENTION_REQUIRED';
  }

  return {
    p10ConservativePaise: p10,
    p50MedianPaise: p50,
    p90OptimisticPaise: p90,
    probabilityScore, // 0 - 100%
    healthStatus,
  };
}

