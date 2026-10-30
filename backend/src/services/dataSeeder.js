import mongoose from 'mongoose';
import Decimal from 'decimal.js';
import { User } from '../models/User.js';
import { InvestmentPlan } from '../models/InvestmentPlan.js';
import { Investment } from '../models/Investment.js';
import { TaxLot } from '../models/TaxLot.js';
import { SIP } from '../models/SIP.js';
import { Goal } from '../models/Goal.js';
import { PortfolioSnapshot } from '../models/PortfolioSnapshot.js';
import { logger } from '../utils/logger.js';

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_EVEN });

export async function seedInstitutionalData() {
  try {
    const planCount = await InvestmentPlan.countDocuments();
    if (planCount > 0) {
      logger.info('Institutional dataset already seeded.');
      return;
    }

    logger.info('Seeding institutional investment plans, accounts, and historical snapshots...');

    // 1. Seed Investment Plans
    const plans = await InvestmentPlan.create([
      {
        name: 'Parag Parikh Flexi Cap Fund (Direct-Growth)',
        category: 'EQUITY',
        subCategory: 'Flexi Cap',
        riskLevel: 'VERY_HIGH',
        navPaise: 7415, // ₹74.15
        isin: 'INF879O01018',
        schemeCode: '122639',
        amc: 'PPFAS Asset Management',
        benchmarkIndex: 'NIFTY 500 TRI',
        expenseRatio: 0.0062,
        cagr1Y: 0.224,
        cagr3Y: 0.201,
        cagr5Y: 0.235,
        minInvestmentPaise: 100000,
        minSipPaise: 100000,
      },
      {
        name: 'HDFC NIFTY 50 Index Fund (Direct-Growth)',
        category: 'EQUITY',
        subCategory: 'Large Cap Index',
        riskLevel: 'HIGH',
        navPaise: 2518, // ₹25.18
        isin: 'INF179KB1HR5',
        schemeCode: '119062',
        amc: 'HDFC Mutual Fund',
        benchmarkIndex: 'NIFTY 50 TRI',
        expenseRatio: 0.0020,
        cagr1Y: 0.161,
        cagr3Y: 0.154,
        cagr5Y: 0.168,
        minInvestmentPaise: 50000,
        minSipPaise: 50000,
      },
      {
        name: 'ICICI Prudential Corporate Bond Fund (Direct-Growth)',
        category: 'DEBT',
        subCategory: 'Corporate Bond',
        riskLevel: 'MODERATE',
        navPaise: 2642, // ₹26.42
        isin: 'INF109K01Z18',
        schemeCode: '120503',
        amc: 'ICICI Prudential Mutual Fund',
        benchmarkIndex: 'NIFTY Corporate Bond Index',
        expenseRatio: 0.0033,
        cagr1Y: 0.078,
        cagr3Y: 0.069,
        cagr5Y: 0.074,
        minInvestmentPaise: 50000,
        minSipPaise: 50000,
      },
      {
        name: 'Sovereign Gold Bond 2028-IV Tranche',
        category: 'GOLD',
        subCategory: 'Sovereign Bullion',
        riskLevel: 'MODERATE',
        navPaise: 8840, // ₹88.40 per 0.01g
        isin: 'IN0020180234',
        schemeCode: 'SGB2028IV',
        amc: 'Reserve Bank of India',
        benchmarkIndex: 'IBJA Gold Spot',
        expenseRatio: 0.0000,
        cagr1Y: 0.189,
        cagr3Y: 0.142,
        cagr5Y: 0.138,
        minInvestmentPaise: 884000,
        minSipPaise: 884000,
      },
    ]);

    // 2. Seed Default Accounts
    const investor = await User.create({
      email: 'investor@ips-wealth.com',
      password: 'Investor123!',
      firstName: 'Rahul',
      lastName: 'Sharma',
      role: 'RETAIL_USER',
      kycStatus: 'VERIFIED',
      riskProfile: 'MODERATE',
      walletBalancePaise: 5000000, // ₹50,000 wallet balance
    });

    const admin = await User.create({
      email: 'admin@ips-wealth.com',
      password: 'Admin123!',
      firstName: 'Vikram',
      lastName: 'Malhotra',
      role: 'ADMIN',
      kycStatus: 'VERIFIED',
      walletBalancePaise: 100000000,
    });

    // 3. Seed Active Holdings & FIFO Tax Lots for Investor
    const planEquity = plans[0];
    const planIndex = plans[1];
    const planDebt = plans[2];

    for (const targetUser of [investor, admin]) {
      const invEquity = await Investment.create({
        user: targetUser._id,
        plan: planEquity._id,
        units: mongoose.Types.Decimal128.fromString('24819.1240'),
        investedPaise: 104488500,
        currentValuePaise: 184033804,
        folioNumber: `FOL-${Math.floor(10000000 + Math.random() * 90000000)}`,
        status: 'ACTIVE',
      });

      const invDebt = await Investment.create({
        user: targetUser._id,
        plan: planDebt._id,
        units: mongoose.Types.Decimal128.fromString('324190.0000'),
        investedPaise: 717856600,
        currentValuePaise: 856509980,
        folioNumber: `FOL-${Math.floor(10000000 + Math.random() * 90000000)}`,
        status: 'ACTIVE',
      });

      const twoYearsAgo = new Date(Date.now() - 700 * 24 * 60 * 60 * 1000);
      const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);

      await TaxLot.create([
        {
          user: targetUser._id,
          investment: invEquity._id,
          plan: planEquity._id,
          schemeName: planEquity.name,
          schemeCode: planEquity.schemeCode,
          assetCategory: 'EQUITY',
          units: mongoose.Types.Decimal128.fromString('18000.0000'),
          remainingUnits: mongoose.Types.Decimal128.fromString('18000.0000'),
          purchaseNavPaise: 3850,
          purchaseAmountPaise: 69300000,
          purchaseDate: twoYearsAgo,
          status: 'ACTIVE',
        },
        {
          user: targetUser._id,
          investment: invEquity._id,
          plan: planEquity._id,
          schemeName: planEquity.name,
          schemeCode: planEquity.schemeCode,
          assetCategory: 'EQUITY',
          units: mongoose.Types.Decimal128.fromString('6819.1240'),
          remainingUnits: mongoose.Types.Decimal128.fromString('6819.1240'),
          purchaseNavPaise: 5160,
          purchaseAmountPaise: 35188500,
          purchaseDate: sixMonthsAgo,
          status: 'ACTIVE',
        },
      ]);
    }

    // 4. Seed Goal and Step-Up SIP
    const retirementDate = new Date(Date.now() + 19 * 365 * 24 * 60 * 60 * 1000);
    const goal = await Goal.create({
      user: investor._id,
      title: 'Retirement Corpus (2045)',
      category: 'RETIREMENT',
      targetCorpusPaise: 1200000000, // ₹12.0 Crore
      currentCorpusPaise: 284000000, // ₹2.84 Crore
      targetDate: retirementDate,
      inflationRate: 0.06,
      expectedReturn: 0.12,
    });

    await SIP.create({
      user: investor._id,
      plan: planIndex._id,
      amountPaise: 2500000, // ₹25,000 monthly
      stepUpPercentage: 10, // 10% annual escalation
      frequency: 'MONTHLY',
      debitDay: 15,
      nextExecutionDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      linkedGoal: goal._id,
      mandateLimitPaise: 10000000,
      status: 'ACTIVE',
    });

    // 5. Seed 180 Days of Daily PortfolioSnapshots for High-Fidelity Charting
    const snapshots = [];
    const baseInvested = 800000000; // ₹80 Lakh
    let cumulativeGrowth = 1.0;

    for (let day = 180; day >= 0; day--) {
      const snapDate = new Date(Date.now() - day * 24 * 60 * 60 * 1000);
      snapDate.setUTCHours(0, 0, 0, 0);

      // Stochastic realistic return walk
      const dailyDrift = 0.0006 + (Math.random() - 0.48) * 0.008;
      cumulativeGrowth *= (1 + dailyDrift);

      const val = Math.round(baseInvested * cumulativeGrowth);
      const benchmarkVal = Number((100 * cumulativeGrowth * 0.96).toFixed(2));

      for (const targetUser of [investor, admin]) {
        snapshots.push({
          user: targetUser._id,
          date: snapDate,
          investedPaise: baseInvested,
          currentValuePaise: val,
          unrealizedPnlPaise: val - baseInvested,
          xirr: 0.1842,
          benchmarkValue: benchmarkVal,
          assetAllocation: {
            equityPaise: Math.round(val * 0.65),
            debtPaise: Math.round(val * 0.25),
            hybridPaise: 0,
            goldPaise: Math.round(val * 0.06),
            cashPaise: Math.round(val * 0.04),
          },
        });
      }
    }

    await PortfolioSnapshot.insertMany(snapshots);
    logger.info('Institutional dataset successfully seeded with 180-day snapshot history.');
  } catch (err) {
    logger.error({ err }, 'Failed to seed institutional dataset.');
  }
}

