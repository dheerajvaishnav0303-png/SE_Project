import { z } from 'zod';

export const depositSchema = z.object({
  amountPaise: z
    .number({ required_error: 'amountPaise is required.' })
    .int('Amount must be an integer minor unit (paise).')
    .min(10000, 'Minimum deposit is ₹100 (10,000 paise).')
    .max(1000000000, 'Single deposit exceeds maximum limit.'),
  narration: z.string().max(100).optional(),
});

export const withdrawalSchema = z.object({
  amountPaise: z
    .number({ required_error: 'amountPaise is required.' })
    .int('Amount must be an integer minor unit (paise).')
    .min(10000, 'Minimum withdrawal is ₹100 (10,000 paise).'),
  narration: z.string().max(100).optional(),
});

export const purchaseSchema = z.object({
  planId: z.string({ required_error: 'planId is required.' }).min(1),
  amountPaise: z
    .number({ required_error: 'amountPaise is required.' })
    .int('Amount must be an integer minor unit.')
    .min(50000, 'Minimum investment is ₹500 (50,000 paise).'),
});

export const redemptionSchema = z.object({
  planId: z.string({ required_error: 'planId is required.' }).min(1),
  units: z
    .number({ required_error: 'units is required.' })
    .positive('Units to redeem must be greater than zero.'),
});

export const createSipSchema = z.object({
  planId: z.string({ required_error: 'planId is required.' }).min(1),
  amountPaise: z
    .number({ required_error: 'amountPaise is required.' })
    .int('Amount must be an integer minor unit.')
    .min(50000, 'Minimum SIP is ₹500 (50,000 paise).'),
  stepUpPercentage: z.number().min(0).max(100).default(0),
  frequency: z.enum(['MONTHLY', 'QUARTERLY']).default('MONTHLY'),
  debitDay: z.number().int().min(1).max(28),
  linkedGoal: z.string().optional(),
});

export const createGoalSchema = z.object({
  title: z.string({ required_error: 'Title is required.' }).min(2).max(100).trim(),
  category: z.enum(['EDUCATION', 'RETIREMENT', 'REAL_ESTATE', 'HEALTHCARE', 'GENERAL']).default('GENERAL'),
  targetCorpusPaise: z
    .number({ required_error: 'targetCorpusPaise is required.' })
    .int('Target corpus must be an integer minor unit.')
    .min(100000, 'Minimum target corpus is ₹1,000 (100,000 paise).'),
  targetDate: z.string({ required_error: 'targetDate is required.' }),
  inflationRate: z.number().min(0).max(0.30).optional(),
});

export const adminPlanSchema = z.object({
  name: z.string().min(3).max(120),
  category: z.enum(['EQUITY', 'DEBT', 'HYBRID', 'GOLD']),
  subCategory: z.string().optional(),
  riskLevel: z.enum(['LOW', 'MODERATE', 'HIGH', 'VERY_HIGH']).default('MODERATE'),
  navPaise: z.number().int().positive(),
  isin: z.string().optional(),
  schemeCode: z.string().optional(),
  amc: z.string().optional(),
  benchmarkIndex: z.string().optional(),
  expenseRatio: z.number().optional(),
});

