import Decimal from 'decimal.js';

// Configure Decimal precision for financial calculations
Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_EVEN });

const DAYS_IN_YEAR = new Decimal(365);
const MAX_ITERATIONS = 100;
const CONVERGENCE_TOLERANCE = new Decimal('1e-7');

/**
 * Computes the Extended Internal Rate of Return (XIRR) using the Newton-Raphson method
 * with automatic fallback to bounded bisection.
 * 
 * @param {Array<{ amountPaise: number|string, date: Date|string }>} cashflows
 * @param {number|string} [guess=0.10]
 * @returns {number} Annualized rate of return (e.g., 0.1842 for 18.42%)
 */
export function calculateXIRR(cashflows, guess = 0.10) {
  if (!cashflows || cashflows.length < 2) {
    return 0;
  }

  // Normalize and sort cashflows chronologically
  const normalized = cashflows
    .map((cf) => ({
      amount: new Decimal(cf.amountPaise).dividedBy(100), // Convert paise to currency units
      date: new Date(cf.date),
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  let hasInflow = false;
  let hasOutflow = false;
  for (const cf of normalized) {
    if (cf.amount.isPositive()) hasInflow = true;
    if (cf.amount.isNegative()) hasOutflow = true;
  }

  // Without both positive and negative cashflows, IRR is mathematically undefined
  if (!hasInflow || !hasOutflow) {
    return 0;
  }

  const d0 = normalized[0].date.getTime();
  let rate = new Decimal(guess);

  // 1. Newton-Raphson Iteration Loop
  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    let fVal = new Decimal(0);
    let fPrimeVal = new Decimal(0);

    for (const cf of normalized) {
      const dtDays = new Decimal(cf.date.getTime() - d0).dividedBy(86400000);
      const yearFraction = dtDays.dividedBy(DAYS_IN_YEAR);
      const factor = new Decimal(1).plus(rate);

      if (factor.lessThanOrEqualTo(0)) {
        return fallbackBisection(normalized, d0);
      }

      // f(r) += C_i * (1 + r)^(-yearFraction)
      const term = cf.amount.times(Decimal.pow(factor, yearFraction.negated()));
      fVal = fVal.plus(term);

      // f'(r) += -yearFraction * C_i * (1 + r)^(-yearFraction - 1)
      const dTerm = yearFraction.negated().times(term).dividedBy(factor);
      fPrimeVal = fPrimeVal.plus(dTerm);
    }

    if (fVal.abs().lessThan(CONVERGENCE_TOLERANCE)) {
      return rate.toNumber();
    }

    // Flat derivative detection: jump to bisection to avoid division by near-zero
    if (fPrimeVal.abs().lessThan(new Decimal('1e-12'))) {
      return fallbackBisection(normalized, d0);
    }

    const delta = fVal.dividedBy(fPrimeVal);
    rate = rate.minus(delta);

    // Guardrail against divergence beyond [-99.99%, +10000%]
    if (rate.lessThan(new Decimal('-0.9999')) || rate.greaterThan(new Decimal('100.0'))) {
      return fallbackBisection(normalized, d0);
    }
  }

  return fallbackBisection(normalized, d0);
}

/**
 * Robust Bounded Bisection Method fallback for non-convergent or flat cashflows.
 */
function fallbackBisection(cashflows, d0) {
  let low = new Decimal('-0.9999');
  let high = new Decimal('10.0'); // +1000%
  let mid = new Decimal(0);

  const evaluate = (r) => {
    let sum = new Decimal(0);
    for (const cf of cashflows) {
      const dtDays = new Decimal(cf.date.getTime() - d0).dividedBy(86400000);
      const yearFraction = dtDays.dividedBy(DAYS_IN_YEAR);
      sum = sum.plus(cf.amount.times(Decimal.pow(new Decimal(1).plus(r), yearFraction.negated())));
    }
    return sum;
  };

  let fLow = evaluate(low);

  for (let i = 0; i < 120; i++) {
    mid = low.plus(high).dividedBy(2);
    const fMid = evaluate(mid);

    if (fMid.abs().lessThan(CONVERGENCE_TOLERANCE) || high.minus(low).abs().lessThan(CONVERGENCE_TOLERANCE)) {
      return mid.toNumber();
    }

    if (fLow.times(fMid).isNegative()) {
      high = mid;
    } else {
      low = mid;
      fLow = fMid;
    }
  }

  return mid.toNumber();
}

/**
 * Calculates Compounded Annual Growth Rate (CAGR) for lump-sum point-to-point holdings.
 * 
 * @param {number|string} initialPaise 
 * @param {number|string} finalPaise 
 * @param {number} daysElapsed 
 * @returns {number} Annualized rate (e.g., 0.15 for 15%)
 */
export function calculateCAGR(initialPaise, finalPaise, daysElapsed) {
  const initial = new Decimal(initialPaise);
  const final = new Decimal(finalPaise);

  if (initial.lessThanOrEqualTo(0) || final.lessThanOrEqualTo(0) || daysElapsed <= 0) {
    return 0;
  }

  const years = new Decimal(daysElapsed).dividedBy(DAYS_IN_YEAR);
  // CAGR = (final / initial) ^ (1 / years) - 1
  const ratio = final.dividedBy(initial);
  const cagr = Decimal.pow(ratio, new Decimal(1).dividedBy(years)).minus(1);

  return cagr.toNumber();
}

/**
 * Calculates the Sharpe Ratio of a portfolio given periodic return series.
 * 
 * @param {number[]} returns Array of periodic returns (e.g., daily returns)
 * @param {number} [riskFreeRateAnnual=0.0675] Default 6.75% 91-day T-Bill rate
 * @returns {number} Annualized Sharpe Ratio
 */
export function calculateSharpeRatio(returns, riskFreeRateAnnual = 0.0675) {
  if (!returns || returns.length < 2) return 0;

  const n = returns.length;
  const meanReturn = returns.reduce((sum, r) => sum + r, 0) / n;
  
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / (n - 1);
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) return 0;

  // Annualize daily returns and volatility (252 trading days)
  const annualizedReturn = meanReturn * 252;
  const annualizedStdDev = stdDev * Math.sqrt(252);

  return Number(((annualizedReturn - riskFreeRateAnnual) / annualizedStdDev).toFixed(4));
}

