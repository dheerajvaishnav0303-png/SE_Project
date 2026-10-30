import mongoose from 'mongoose';
import crypto from 'crypto';
import Decimal from 'decimal.js';
import { User } from '../models/User.js';
import { InvestmentPlan } from '../models/InvestmentPlan.js';
import { Investment } from '../models/Investment.js';
import { TaxLot } from '../models/TaxLot.js';
import { LedgerEntry } from '../models/LedgerEntry.js';
import { Transaction } from '../models/Transaction.js';
import { SIP } from '../models/SIP.js';
import { executeFIFOLotConsumption } from './quant/taxHarvestingEngine.js';
import { isReplicaSet } from '../config/db.js';
import { withOptionalTransaction } from '../utils/dbTransaction.js';

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_EVEN });

export async function executeDeposit({ userId, amountPaise, idempotencyKey, narration = 'Wallet fiat top-up' }) {
  return withOptionalTransaction(async (session) => {
    const user = await User.findById(userId).session(session);
    if (!user) throw new Error('User not found.');

    const txId = `tx_${crypto.randomUUID()}`;
    const previousBalance = user.walletBalancePaise;
    const newBalance = previousBalance + amountPaise;

    user.walletBalancePaise = newBalance;
    await user.save({ session });

    await LedgerEntry.create([
      {
        transactionId: txId,
        user: userId,
        accountType: 'BANK_SETTLEMENT',
        direction: 'DEBIT',
        amountPaise,
        balanceAfterPaise: amountPaise,
        referenceType: 'DEPOSIT',
        referenceId: txId,
        narration: `Bank Nodal transfer received for ${narration}`,
      },
      {
        transactionId: txId,
        user: userId,
        accountType: 'USER_WALLET',
        direction: 'CREDIT',
        amountPaise,
        balanceAfterPaise: newBalance,
        referenceType: 'DEPOSIT',
        referenceId: txId,
        narration,
      },
    ], { session });

    const tx = await Transaction.create([{
      transactionId: txId,
      user: userId,
      type: 'DEPOSIT',
      amountPaise,
      status: 'SETTLED',
      idempotencyKey,
      narration,
    }], { session });

    return tx[0];
  });
}

export async function executeInvestmentPurchase({ userId, planId, amountPaise, idempotencyKey }) {
  return withOptionalTransaction(async (session) => {
    const user = await User.findById(userId).session(session);
    if (!user) throw new Error('User not found.');
    if (user.walletBalancePaise < amountPaise) {
      throw new Error(`Insufficient wallet balance (₹${user.walletBalancePaise / 100}). Required: ₹${amountPaise / 100}.`);
    }

    const plan = await InvestmentPlan.findById(planId).session(session);
    if (!plan || !plan.isActive) throw new Error('Investment plan not available or inactive.');
    if (amountPaise < plan.minInvestmentPaise) {
      throw new Error(`Minimum investment for this plan is ₹${plan.minInvestmentPaise / 100}.`);
    }

    const txId = `tx_${crypto.randomUUID()}`;
    user.walletBalancePaise -= amountPaise;
    await user.save({ session });

    const allottedUnits = new Decimal(amountPaise).dividedBy(plan.navPaise).toFixed(4);

    let investment = await Investment.findOne({ user: userId, plan: planId }).session(session);
    if (!investment) {
      investment = new Investment({
        user: userId,
        plan: planId,
        units: mongoose.Types.Decimal128.fromString('0'),
        investedPaise: 0,
        currentValuePaise: 0,
        folioNumber: `FOL-${Math.floor(10000000 + Math.random() * 90000000)}`,
      });
    }

    const prevUnits = new Decimal(investment.units.toString());
    const totalUnits = prevUnits.plus(new Decimal(allottedUnits)).toFixed(4);

    investment.units = mongoose.Types.Decimal128.fromString(totalUnits);
    investment.investedPaise += amountPaise;
    investment.currentValuePaise = Math.round(Number(totalUnits) * plan.navPaise);
    await investment.save({ session });

    await TaxLot.create([{
      user: userId,
      investment: investment._id,
      plan: planId,
      schemeName: plan.name,
      schemeCode: plan.schemeCode || plan.isin || 'DIRECT',
      assetCategory: plan.category,
      units: mongoose.Types.Decimal128.fromString(allottedUnits),
      remainingUnits: mongoose.Types.Decimal128.fromString(allottedUnits),
      purchaseNavPaise: plan.navPaise,
      purchaseAmountPaise: amountPaise,
      purchaseDate: new Date(),
      status: 'ACTIVE',
    }], { session });

    await LedgerEntry.create([
      {
        transactionId: txId,
        user: userId,
        accountType: 'USER_WALLET',
        direction: 'DEBIT',
        amountPaise,
        balanceAfterPaise: user.walletBalancePaise,
        referenceType: 'INVESTMENT_BUY',
        referenceId: investment._id.toString(),
        narration: `Purchased ${allottedUnits} units of ${plan.name}`,
      },
      {
        transactionId: txId,
        user: userId,
        accountType: 'ASSET_HOLDING',
        direction: 'CREDIT',
        amountPaise,
        balanceAfterPaise: investment.currentValuePaise,
        referenceType: 'INVESTMENT_BUY',
        referenceId: investment._id.toString(),
        narration: `Asset holding credited with ${allottedUnits} units`,
      },
    ], { session });

    const tx = await Transaction.create([{
      transactionId: txId,
      user: userId,
      plan: planId,
      type: 'PURCHASE',
      amountPaise,
      units: mongoose.Types.Decimal128.fromString(allottedUnits),
      navPaise: plan.navPaise,
      status: 'SETTLED',
      idempotencyKey,
      narration: `Allotted ${allottedUnits} units @ ₹${plan.navPaise / 100}`,
    }], { session });

    return { transaction: tx[0], allottedUnits, investment };
  });
}

export { executeFIFORedemption } from './redemptionService.js';

export async function executeWithdrawalRequest({ userId, amountPaise, idempotencyKey, narration = 'Bank settlement withdrawal' }) {
  return withOptionalTransaction(async (session) => {
    const user = await User.findById(userId).session(session);
    if (!user) throw new Error('User not found.');
    if (user.walletBalancePaise < amountPaise) {
      throw new Error(`Insufficient wallet balance. Available: ₹${user.walletBalancePaise / 100}`);
    }

    const txId = `tx_${crypto.randomUUID()}`;
    user.walletBalancePaise -= amountPaise;
    await user.save({ session });

    await LedgerEntry.create([
      {
        transactionId: txId,
        user: userId,
        accountType: 'USER_WALLET',
        direction: 'DEBIT',
        amountPaise,
        balanceAfterPaise: user.walletBalancePaise,
        referenceType: 'WITHDRAWAL',
        referenceId: txId,
        narration: `Withdrawal initiated: ${narration}`,
      },
      {
        transactionId: txId,
        user: userId,
        accountType: 'ESCROW_CLEARING',
        direction: 'CREDIT',
        amountPaise,
        balanceAfterPaise: amountPaise,
        referenceType: 'WITHDRAWAL',
        referenceId: txId,
        narration: `Funds held in escrow pending banking settlement`,
      },
    ], { session });

    const isHighValue = amountPaise >= 50000000; // >= ₹5,00,000 mandates Maker-Checker
    const status = isHighValue ? 'LOCKED_IN_ESCROW' : 'SETTLED';

    const tx = await Transaction.create([{
      transactionId: txId,
      user: userId,
      type: 'WITHDRAWAL',
      amountPaise,
      status,
      idempotencyKey,
      narration,
      metadata: { requiresMakerChecker: isHighValue },
    }], { session });

    return tx[0];
  });
}

