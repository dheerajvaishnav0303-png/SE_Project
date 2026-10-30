import Decimal from 'decimal.js';

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_EVEN });

export const TAX_CONSTANTS = {
  EQUITY_LTCG_DAYS: 365,
  EQUITY_STCG_RATE: 0.20, // 20% Short-term capital gains tax
  EQUITY_LTCG_RATE: 0.125, // 12.5% Long-term capital gains tax
  LTCG_ANNUAL_EXEMPTION_PAISE: 12500000, // ₹1,25,000 exemption limit in paise
  DEBT_SLAB_RATE: 0.30, // Default 30% slab rate
};

/**
 * Scans active TaxLots to compute realized and unrealized gains,
 * and identifies actionable Tax-Loss Harvesting opportunities.
 * 
 * @param {Array<object>} taxLots Array of open TaxLot documents
 * @param {Map<string, number>|object} currentNavs Map of schemeCode/planId to currentNavPaise
 * @returns {object} Full tax analysis and loss-harvesting recommendations
 */
export function analyzeTaxLotsAndHarvesting(taxLots, currentNavs, asOfDate = new Date()) {
  let totalUnrealizedSTCGPaise = new Decimal(0);
  let totalUnrealizedLTCGPaise = new Decimal(0);
  let totalUnrealizedSTCLPaise = new Decimal(0); // Short-term capital losses
  let totalUnrealizedLTCLPaise = new Decimal(0); // Long-term capital losses

  const harvestingOpportunities = [];
  const analyzedLots = [];

  for (const lot of taxLots) {
    const remainingUnits = new Decimal(lot.remainingUnits.toString());
    if (remainingUnits.lessThanOrEqualTo(0)) continue;

    const planKey = lot.plan?.toString() || lot.schemeCode;
    const currentNavPaise = currentNavs instanceof Map 
      ? (currentNavs.get(planKey) || lot.purchaseNavPaise)
      : (currentNavs[planKey] || lot.purchaseNavPaise);

    const purchaseNav = new Decimal(lot.purchaseNavPaise);
    const currentNav = new Decimal(currentNavPaise);

    const daysHeld = Math.floor((asOfDate.getTime() - new Date(lot.purchaseDate).getTime()) / (1000 * 60 * 60 * 24));
    const isEquity = lot.assetCategory === 'EQUITY' || lot.assetCategory === 'HYBRID';
    const isLongTerm = isEquity && daysHeld > TAX_CONSTANTS.EQUITY_LTCG_DAYS;

    // Gain/Loss in paise = remainingUnits * (currentNav - purchaseNav)
    const unitDiff = currentNav.minus(purchaseNav);
    const lotPnlPaise = remainingUnits.times(unitDiff).round();

    const isLoss = lotPnlPaise.isNegative();

    if (isLoss) {
      if (isLongTerm) {
        totalUnrealizedLTCLPaise = totalUnrealizedLTCLPaise.plus(lotPnlPaise.abs());
      } else {
        totalUnrealizedSTCLPaise = totalUnrealizedSTCLPaise.plus(lotPnlPaise.abs());
      }

      // Actionable harvesting candidate
      const potentialTaxSavingsPaise = isLongTerm
        ? lotPnlPaise.abs().times(TAX_CONSTANTS.EQUITY_LTCG_RATE).round().toNumber()
        : lotPnlPaise.abs().times(TAX_CONSTANTS.EQUITY_STCG_RATE).round().toNumber();

      harvestingOpportunities.push({
        lotId: lot._id,
        plan: lot.plan,
        schemeName: lot.schemeName || 'Investment Holding',
        units: remainingUnits.toNumber(),
        purchaseDate: lot.purchaseDate,
        purchaseNavPaise: purchaseNav.toNumber(),
        currentNavPaise: currentNav.toNumber(),
        unrealizedLossPaise: lotPnlPaise.abs().toNumber(),
        potentialTaxSavingsPaise,
        taxType: isLongTerm ? 'LTCG' : 'STCG',
        daysHeld,
      });
    } else {
      if (isLongTerm) {
        totalUnrealizedLTCGPaise = totalUnrealizedLTCGPaise.plus(lotPnlPaise);
      } else {
        totalUnrealizedSTCGPaise = totalUnrealizedSTCGPaise.plus(lotPnlPaise);
      }
    }

    analyzedLots.push({
      lotId: lot._id,
      daysHeld,
      isLongTerm,
      lotPnlPaise: lotPnlPaise.toNumber(),
      remainingUnits: remainingUnits.toNumber(),
    });
  }

  // Total potential tax savings if all losses are harvested before fiscal year-end
  const totalPotentialTaxSavingsPaise = totalUnrealizedSTCLPaise
    .times(TAX_CONSTANTS.EQUITY_STCG_RATE)
    .plus(totalUnrealizedLTCLPaise.times(TAX_CONSTANTS.EQUITY_LTCG_RATE))
    .round()
    .toNumber();

  return {
    summary: {
      unrealizedSTCGPaise: totalUnrealizedSTCGPaise.toNumber(),
      unrealizedLTCGPaise: totalUnrealizedLTCGPaise.toNumber(),
      unrealizedSTCLPaise: totalUnrealizedSTCLPaise.toNumber(),
      unrealizedLTCLPaise: totalUnrealizedLTCLPaise.toNumber(),
      totalPotentialTaxSavingsPaise,
      ltcgExemptionLimitPaise: TAX_CONSTANTS.LTCG_ANNUAL_EXEMPTION_PAISE,
      actionableLotsCount: harvestingOpportunities.length,
    },
    harvestingOpportunities,
    analyzedLots,
  };
}

/**
 * Executes a FIFO unit redemption simulation across active tax lots.
 * 
 * @param {Array<object>} activeLots Chronologically ordered lots (purchaseDate ASC)
 * @param {number|string} unitsToRedeem Requested unit quantity
 * @param {number|string} exitNavPaise Current execution NAV in paise
 * @param {Date} [redemptionDate=new Date()]
 * @returns {object} { consumedLots, totalGrossPaise, totalRealizedGainPaise, stcgPaise, ltcgPaise, remainingToRedeem }
 */
export function executeFIFOLotConsumption(activeLots, unitsToRedeem, exitNavPaise, redemptionDate = new Date()) {
  let unitsNeeded = new Decimal(unitsToRedeem.toString());
  const exitNav = new Decimal(exitNavPaise);

  const consumedLots = [];
  let totalGrossPaise = new Decimal(0);
  let totalSTCGPaise = new Decimal(0);
  let totalLTCGPaise = new Decimal(0);

  for (const lot of activeLots) {
    if (unitsNeeded.lessThanOrEqualTo(0)) break;

    const availableUnits = new Decimal(lot.remainingUnits.toString());
    if (availableUnits.lessThanOrEqualTo(0)) continue;

    const unitsFromLot = Decimal.min(unitsNeeded, availableUnits);
    const purchaseNav = new Decimal(lot.purchaseNavPaise);

    const daysHeld = Math.floor((redemptionDate.getTime() - new Date(lot.purchaseDate).getTime()) / (1000 * 60 * 60 * 24));
    const isLongTerm = daysHeld > TAX_CONSTANTS.EQUITY_LTCG_DAYS;

    const grossFromLotPaise = unitsFromLot.times(exitNav).round();
    const costBasisFromLotPaise = unitsFromLot.times(purchaseNav).round();
    const gainFromLotPaise = grossFromLotPaise.minus(costBasisFromLotPaise);

    if (isLongTerm) {
      totalLTCGPaise = totalLTCGPaise.plus(gainFromLotPaise);
    } else {
      totalSTCGPaise = totalSTCGPaise.plus(gainFromLotPaise);
    }

    totalGrossPaise = totalGrossPaise.plus(grossFromLotPaise);

    consumedLots.push({
      lotId: lot._id,
      unitsDeducted: unitsFromLot.toString(),
      remainingLotUnits: availableUnits.minus(unitsFromLot).toString(),
      purchaseDate: lot.purchaseDate,
      purchaseNavPaise: purchaseNav.toNumber(),
      exitNavPaise: exitNav.toNumber(),
      gainPaise: gainFromLotPaise.toNumber(),
      isLongTerm,
      daysHeld,
    });

    unitsNeeded = unitsNeeded.minus(unitsFromLot);
  }

  return {
    consumedLots,
    totalGrossPaise: totalGrossPaise.toNumber(),
    totalRealizedGainPaise: totalSTCGPaise.plus(totalLTCGPaise).toNumber(),
    stcgPaise: totalSTCGPaise.toNumber(),
    ltcgPaise: totalLTCGPaise.toNumber(),
    remainingUnfulfilledUnits: unitsNeeded.toNumber(),
  };
}

