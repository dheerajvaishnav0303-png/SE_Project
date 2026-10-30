import mongoose from 'mongoose';
import crypto from 'crypto';
import Decimal from 'decimal.js';
import { User } from '../models/User.js';
import { InvestmentPlan } from '../models/InvestmentPlan.js';
import { Investment } from '../models/Investment.js';
import { TaxLot } from '../models/TaxLot.js';
import { LedgerEntry } from '../models/LedgerEntry.js';
import { Transaction } from '../models/Transaction.js';
import { executeFIFOLotConsumption } from './quant/taxHarvestingEngine.js';
import { withOptionalTransaction } from '../utils/dbTransaction.js';

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_EVEN });

export async function executeFIFORedemption({ userId, planId, unitsToRedeem, idempotencyKey }) {
  return withOptionalTransaction(async (session) => {
    const investment = await Investment.findOne({ user: userId, plan: planId }).session(session);
    if (!investment) throw new Error('Investment holding not found.');

    const availableUnits = new Decimal(investment.units.toString());
    const reqUnits = new Decimal(unitsToRedeem.toString());
    if (availableUnits.lessThan(reqUnits)) {
      throw new Error(`Insufficient units available (${availableUnits}). Requested: ${reqUnits}.`);
    }

    const plan = await InvestmentPlan.findById(planId).session(session);
    if (!plan) throw new Error('Investment plan not found.');

    const activeLots = await TaxLot.find({
      user: userId,
      plan: planId,
      status: 'ACTIVE',
    }).sort({ purchaseDate: 1 }).session(session);

    const fifoResult = executeFIFOLotConsumption(activeLots, reqUnits.toNumber(), plan.navPaise);
    if (fifoResult.remainingUnfulfilledUnits > 0.0001) {
      throw new Error('Unfulfilled units in tax lot FIFO matching.');
    }

    for (const alloc of fifoResult.consumedLots) {
      const lot = await TaxLot.findById(alloc.lotId).session(session);
      lot.remainingUnits = mongoose.Types.Decimal128.fromString(alloc.remainingLotUnits);
      if (new Decimal(alloc.remainingLotUnits).isZero()) {
        lot.status = 'EXHAUSTED';
      }
      await lot.save({ session });
    }

    const remainingUnits = availableUnits.minus(reqUnits).toFixed(4);
    investment.units = mongoose.Types.Decimal128.fromString(remainingUnits);
    investment.currentValuePaise = Math.round(Number(remainingUnits) * plan.navPaise);
    if (new Decimal(remainingUnits).isZero()) {
      investment.status = 'REDEEMED';
    }
    await investment.save({ session });

    const user = await User.findById(userId).session(session);
    user.walletBalancePaise += fifoResult.totalGrossPaise;
    await user.save({ session });

    const txId = `tx_${crypto.randomUUID()}`;

    await LedgerEntry.create([
      {
        transactionId: txId,
        user: userId,
        accountType: 'ASSET_HOLDING',
        direction: 'DEBIT',
        amountPaise: fifoResult.totalGrossPaise,
        balanceAfterPaise: investment.currentValuePaise,
        referenceType: 'INVESTMENT_SELL',
        referenceId: investment._id.toString(),
        narration: `Redeemed ${reqUnits} units of ${plan.name}`,
      },
      {
        transactionId: txId,
        user: userId,
        accountType: 'USER_WALLET',
        direction: 'CREDIT',
        amountPaise: fifoResult.totalGrossPaise,
        balanceAfterPaise: user.walletBalancePaise,
        referenceType: 'INVESTMENT_SELL',
        referenceId: investment._id.toString(),
        narration: 'Redemption proceeds credited to wallet',
      },
    ], { session });

    const tx = await Transaction.create([{
      transactionId: txId,
      user: userId,
      plan: planId,
      type: 'REDEMPTION',
      amountPaise: fifoResult.totalGrossPaise,
      units: mongoose.Types.Decimal128.fromString(reqUnits.toFixed(4)),
      navPaise: plan.navPaise,
      status: 'SETTLED',
      idempotencyKey,
      narration: `Redeemed ${reqUnits} units (Realized Gain: ₹${fifoResult.totalRealizedGainPaise / 100})`,
      metadata: {
        stcgPaise: fifoResult.stcgPaise,
        ltcgPaise: fifoResult.ltcgPaise,
      },
    }], { session });

    return { transaction: tx[0], fifoResult };
  });
}

