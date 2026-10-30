import { Goal } from '../models/Goal.js';
import { User } from '../models/User.js';
import { LedgerEntry } from '../models/LedgerEntry.js';
import crypto from 'crypto';
import { calculateGoalGlidepath, runMonteCarloGoalSimulation } from '../services/quant/sipAndGoalEngine.js';

export async function getUserGoals(req, res, next) {
  try {
    const userId = req.user._id;
    const goals = await Goal.find({ user: userId }).sort({ targetDate: 1 });

    const enriched = goals.map((goal) => {
      const glidepath = calculateGoalGlidepath({
        targetCorpusPaise: goal.targetCorpusPaise,
        currentCorpusPaise: goal.currentCorpusPaise,
        targetDate: goal.targetDate,
        category: goal.category,
        annualExpectedReturn: goal.expectedReturn,
      });

      const simulation = runMonteCarloGoalSimulation({
        currentCorpusPaise: goal.currentCorpusPaise,
        monthlySavingsPaise: glidepath.requiredMonthlySavingsPaise,
        yearsRemaining: glidepath.yearsRemaining,
        annualExpectedReturn: goal.expectedReturn,
        targetCorpusPaise: glidepath.adjustedTargetCorpusPaise,
      });

      return {
        _id: goal._id,
        title: goal.title,
        category: goal.category,
        targetDate: goal.targetDate,
        targetCorpusPaise: goal.targetCorpusPaise,
        currentCorpusPaise: goal.currentCorpusPaise,
        status: goal.status,
        glidepath,
        simulation,
      };
    });

    return res.status(200).json({ status: 'success', data: { goals: enriched } });
  } catch (err) {
    return next(err);
  }
}

export async function createGoal(req, res, next) {
  try {
    const { title, category, targetCorpusPaise, targetDate, inflationRate } = req.body;
    const userId = req.user._id;

    const goal = await Goal.create({
      user: userId,
      title,
      category,
      targetCorpusPaise,
      targetDate: new Date(targetDate),
      inflationRate: inflationRate || 0.06,
      currentCorpusPaise: 0,
      status: 'ACTIVE',
    });

    return res.status(201).json({
      status: 'success',
      message: 'Financial goal created successfully.',
      data: { goal },
    });
  } catch (err) {
    return next(err);
  }
}

export async function deleteGoal(req, res, next) {
  try {
    const { id } = req.params;
    const result = await Goal.findOneAndDelete({ _id: id, user: req.user._id });

    if (!result) {
      return res.status(404).json({
        type: 'https://api.ips-wealth.com/errors/goal-not-found',
        title: 'Goal Not Found',
        status: 404,
        detail: 'The requested goal does not exist or belong to your profile.',
      });
    }

    return res.status(200).json({ status: 'success', message: 'Goal removed.' });
  } catch (err) {
    return next(err);
  }
}

export async function topUpGoal(req, res, next) {
  try {
    const { id } = req.params;
    const { amountPaise } = req.body;
    const userId = req.user._id;

    if (!amountPaise || amountPaise <= 0) {
      return res.status(400).json({
        type: 'https://api.ips-wealth.com/errors/invalid-amount',
        title: 'Invalid Amount',
        status: 400,
        detail: 'Amount must be a positive integer in minor units (paise).',
      });
    }

    const user = await User.findById(userId);
    if (user.walletBalancePaise < amountPaise) {
      return res.status(400).json({
        type: 'https://api.ips-wealth.com/errors/insufficient-balance',
        title: 'Insufficient Wallet Balance',
        status: 400,
        detail: `Available wallet balance (₹${user.walletBalancePaise / 100}) is less than requested top-up (₹${amountPaise / 100}).`,
      });
    }

    const goal = await Goal.findOne({ _id: id, user: userId });
    if (!goal) {
      return res.status(404).json({
        type: 'https://api.ips-wealth.com/errors/goal-not-found',
        title: 'Goal Not Found',
        status: 404,
        detail: 'Goal not found on profile.',
      });
    }

    user.walletBalancePaise -= amountPaise;
    await user.save();

    goal.currentCorpusPaise += amountPaise;
    await goal.save();

    const txId = `goal_topup_${crypto.randomUUID()}`;
    await LedgerEntry.create([
      {
        transactionId: txId,
        user: userId,
        accountType: 'USER_WALLET',
        direction: 'DEBIT',
        amountPaise,
        balanceAfterPaise: user.walletBalancePaise,
        referenceType: 'INVESTMENT_BUY',
        referenceId: goal._id.toString(),
        narration: `Dedicated wallet top-up allocated to goal: ${goal.title}`,
      },
      {
        transactionId: txId,
        user: userId,
        accountType: 'ASSET_HOLDING',
        direction: 'CREDIT',
        amountPaise,
        balanceAfterPaise: goal.currentCorpusPaise,
        referenceType: 'INVESTMENT_BUY',
        referenceId: goal._id.toString(),
        narration: `Goal corpus incremented for ${goal.title}`,
      },
    ]);

    return res.status(200).json({
      status: 'success',
      message: `Successfully allocated ₹${amountPaise / 100} to ${goal.title}.`,
      data: { goal, newWalletBalancePaise: user.walletBalancePaise },
    });
  } catch (err) {
    return next(err);
  }
}

export async function rebalanceGoalToDebt(req, res, next) {
  try {
    const { id } = req.params;
    const goal = await Goal.findOne({ _id: id, user: req.user._id });
    if (!goal) {
      return res.status(404).json({
        type: 'https://api.ips-wealth.com/errors/goal-not-found',
        title: 'Goal Not Found',
        status: 404,
        detail: 'Goal not found.',
      });
    }

    goal.glidepathStage = 'PRESERVATION';
    await goal.save();

    return res.status(200).json({
      status: 'success',
      message: `Goal ${goal.title} rebalanced to Capital Preservation Stage. Equity ceiling shifted to 20%.`,
      data: { goal },
    });
  } catch (err) {
    return next(err);
  }
}

