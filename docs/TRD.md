# Technical Requirements Document (TRD)
## Institutional Wealth Management & Investment Advisory Platform (IPS v2.0)

**Document Version:** `2.0.0-PROD`  
**Classification:** Institutional Confidential / Internal Engineering Specification  
**Status:** Approved for Implementation  
**Lead Quantitative Architect:** Staff Quantitative Engineer  
**Principal Platform Architect:** Principal Fintech Product Architect  
**Security & Infrastructure:** Head of InfoSec & Infrastructure  
**Target Delivery Window:** Q1–Q3 2027  

---

## 1. System Architecture & Topology Overview

IPS v2.0 transitions the platform from a monolithic, client-rendered React prototype into a decoupled, distributed micro-service and worker-tier architecture engineered for high availability, fault tolerance, and mathematical determinism.

### 1.1 C4 Architecture Model (Container & Component)

```
+----------------------------------------------------------------------------------------------------+
|                                    IPS v2.0 CLIENT TIER                                            |
|  [ React 19 + TypeScript SPA ] <--> [ TanStack Query v5 (Server State) ] <--> [ Zustand (Client) ] |
|  [ TradingView Lightweight Charts (Canvas/WebGL) ] <--> [ Tailwind CSS + Radix UI Primitives ]     |
+----------------------------------------------------------------------------------------------------+
                                             |
                               HTTPS / WSS (TLS 1.3)
                                             v
+----------------------------------------------------------------------------------------------------+
|                                   REVERSE PROXY & API GATEWAY                                      |
|  [ NGINX / Cloudflare Gateway ]                                                                    |
|  * TLS Termination (HSTS, OCSP Stapling)  * DDoS Shield  * Sliding-Window Rate Limiting (Redis)    |
+----------------------------------------------------------------------------------------------------+
                                             |
                                      Internal Network
                                             v
+----------------------------------------------------------------------------------------------------+
|                                   API APPLICATION SERVICES (Node.js)                               |
|  * Express / NestJS Framework             * Zod Schema Validation Pipeline                         |
|  * HttpOnly Secure Cookie Auth Middleware * Idempotency Engine (Redis Atomic Locks)               |
|  * AES-256-GCM Envelope Encryption Service* RFC 7807 Error Dispatcher                             |
+----------------------------------------------------------------------------------------------------+
             |                                             |                          |
    Read / Write Pool                             Enqueue Background Tasks       Cache / Invalidation
             v                                             v                          v
+-----------------------------+               +--------------------------+  +------------------------+
| PRIMARY DATA TIER           |               | ASYNC WORKER TIER        |  | IN-MEMORY STATE TIER   |
| [ MongoDB 8.0 Replica Set ] |               | [ BullMQ Workers ]       |  | [ Redis 7.2 Cluster ]  |
| * Decimal128 Precision      |               | * XIRR Batch Cruncher    |  | * Session Revocation   |
| * Multi-Doc ACID Txns       |               | * Monte Carlo Simulator  |  | * Distributed Locks    |
| * Continuous Oplog (PITR)   |               | * SIP Recurring Cron     |  | * Idempotency Cache    |
| * Field-Level Encryption    |               | * Daily NAV & Tax Sweeps |  | * Rate Limit Windows   |
+-----------------------------+               +--------------------------+  +------------------------+
```

---

## 2. Mathematical & Financial Precision Specifications

### 2.1 The Prohibition of IEEE 754 Floating-Point Arithmetic
JavaScript `number` types adhere strictly to IEEE 754 double-precision binary floating-point representation (64 bits: 1 sign bit, 11 exponent bits, 52 mantissa bits). Binary representation of base-10 fractional decimals produces catastrophic rounding cancellation:

```typescript
// INADMISSIBLE FINTECH BEHAVIOR:
0.1 + 0.2 === 0.30000000000000004; // true
100000.05 - 100000.00 === 0.050000000001091394; // true
```

In institutional ledger accounting, compounded fractional errors across millions of units and lots produce balance-sheet reconciliation failures, legal exposure, and audit violations.

### 2.2 Numerical Standards & Database Types
1.  **Monetary Quantities (Cash, Balance, Order Values)**:
    *   **Application Storage**: Represented strictly in lowest currency units as 64-bit BigInt / Integers (e.g., Indian Rupee Paise, US Dollar Cents: $100.50 \implies 10050$).
    *   **Database Schema**: Stored as MongoDB `Decimal128` or 64-bit integer (`Long`).
2.  **Asset Quantities & Mutual Fund Units**:
    *   Stored to 4 decimal places of precision using `Decimal128` (e.g., $154.2385$ units).
3.  **Net Asset Value (NAV) & Share Prices**:
    *   Stored to 4 decimal places of precision using `Decimal128` (e.g., ₹$48.2915$).
4.  **Exchange Rates & Quant Factors**:
    *   Stored to 6 decimal places of precision using `Decimal128` (e.g., USD/INR $86.412850$).
5.  **Runtime Arithmetic Library**:
    *   All in-memory mathematical evaluation must utilize `decimal.js` or native BigInt math. Native JavaScript `+`, `-`, `*`, `/` operators are strictly forbidden for monetary operations via ESLint AST lint rules (`@typescript-eslint/no-loss-of-precision`, `custom/no-floating-point-currency`).

---

### 2.3 Financial Algorithms: Production Implementations

#### 2.3.1 Money-Weighted Return: Extended Internal Rate of Return (XIRR)
The system calculates XIRR using the **Newton-Raphson method** with dynamic fallback to **Brent’s Bisection Method**.

```typescript
import Decimal from 'decimal.js';

export interface CashFlow {
  amount: Decimal; // Negative for investments/outflows, Positive for current valuation/inflows
  date: Date;
}

export class XIRRCalculator {
  private static readonly MAX_ITERATIONS = 100;
  private static readonly TOLERANCE = new Decimal('1e-7');
  private static readonly DAYS_IN_YEAR = new Decimal(365);

  /**
   * Computes the Extended Internal Rate of Return (XIRR).
   * @param cashflows Array of CashFlow objects with exact transaction dates.
   * @param guess Initial discount rate guess (default 0.10 -> 10%).
   * @returns Annualized rate of return as a Decimal.
   */
  public static calculate(cashflows: CashFlow[], guess: Decimal = new Decimal('0.10')): Decimal {
    if (cashflows.length < 2) {
      throw new Error('XIRR requires at least two cashflow transactions.');
    }

    let hasPositive = false;
    let hasNegative = false;
    for (const cf of cashflows) {
      if (cf.amount.isPositive()) hasPositive = true;
      if (cf.amount.isNegative()) hasNegative = true;
    }
    if (!hasPositive || !hasNegative) {
      throw new Error('XIRR cashflows must contain at least one inflow and one outflow.');
    }

    const d0 = cashflows[0].date.getTime();
    let r = guess;

    // Newton-Raphson Solver Loop
    for (let i = 0; i < this.MAX_ITERATIONS; i++) {
      let fVal = new Decimal(0);
      let fPrimeVal = new Decimal(0);

      for (const cf of cashflows) {
        const dt = new Decimal(cf.date.getTime() - d0).dividedBy(86400000); // Days elapsed
        const fraction = dt.dividedBy(this.DAYS_IN_YEAR);
        const factor = new Decimal(1).plus(r);

        if (factor.isNegative() || factor.isZero()) {
          // Singularity avoidance
          return this.fallbackBisection(cashflows, d0);
        }

        // f(r) += C_i * (1 + r)^(-fraction)
        const term = cf.amount.times(Decimal.pow(factor, fraction.negated()));
        fVal = fVal.plus(term);

        // f'(r) += -fraction * C_i * (1 + r)^(-fraction - 1)
        const dTerm = fraction.negated().times(term).dividedBy(factor);
        fPrimeVal = fPrimeVal.plus(dTerm);
      }

      if (fVal.abs().lessThan(this.TOLERANCE)) {
        return r;
      }

      if (fPrimeVal.abs().lessThan(new Decimal('1e-12'))) {
        // Flat derivative: switch to Brent's Bisection Method
        return this.fallbackBisection(cashflows, d0);
      }

      const delta = fVal.dividedBy(fPrimeVal);
      r = r.minus(delta);

      // Guardrail bounds: -99.99% to +10000%
      if (r.lessThan(new Decimal('-0.9999')) || r.greaterThan(new Decimal('100.0'))) {
        return this.fallbackBisection(cashflows, d0);
      }
    }

    return this.fallbackBisection(cashflows, d0);
  }

  /**
   * Bounded Bisection Method fallback for non-convergent cashflows.
   */
  private static fallbackBisection(cashflows: CashFlow[], d0: number): Decimal {
    let low = new Decimal('-0.9999');
    let high = new Decimal('10.0'); // +1000%
    let mid = new Decimal(0);

    const evaluate = (rate: Decimal): Decimal => {
      let sum = new Decimal(0);
      for (const cf of cashflows) {
        const dt = new Decimal(cf.date.getTime() - d0).dividedBy(86400000);
        const fraction = dt.dividedBy(this.DAYS_IN_YEAR);
        sum = sum.plus(cf.amount.times(Decimal.pow(new Decimal(1).plus(rate), fraction.negated())));
      }
      return sum;
    };

    let fLow = evaluate(low);
    for (let iter = 0; iter < 120; iter++) {
      mid = low.plus(high).dividedBy(2);
      const fMid = evaluate(mid);

      if (fMid.abs().lessThan(this.TOLERANCE) || high.minus(low).abs().lessThan(this.TOLERANCE)) {
        return mid;
      }

      if (fLow.times(fMid).isNegative()) {
        high = mid;
      } else {
        low = mid;
        fLow = fMid;
      }
    }
    return mid;
  }
}
```

---

#### 2.3.2 FIFO Capital Gains & Tax-Loss Harvesting Engine
Every asset redemption must systematically consume tax lots in ascending chronological order of acquisition.

```typescript
import Decimal from 'decimal.js';

export interface TaxLotRecord {
  lotId: string;
  purchaseDate: Date;
  costBasisNAV: Decimal;
  remainingUnits: Decimal;
}

export interface RedemptionAllocation {
  lotId: string;
  consumedUnits: Decimal;
  purchaseDate: Date;
  costBasisNAV: Decimal;
  exitNAV: Decimal;
  realizedGain: Decimal;
  holdingDays: number;
  isLongTerm: boolean;
}

export class FIFOTaxEngine {
  private static readonly EQUITY_LTCG_THRESHOLD_DAYS = 365;

  /**
   * Executes FIFO consumption against active tax lots.
   * @param lots Mutable array of active tax lots sorted by purchaseDate ASC.
   * @param unitsToRedeem Requested redemption quantity.
   * @param exitNAV Current market execution NAV.
   */
  public static executeFIFORedemption(
    lots: TaxLotRecord[],
    unitsToRedeem: Decimal,
    exitNAV: Decimal,
    executionDate: Date
  ): { allocations: RedemptionAllocation[]; totalRealizedGain: Decimal; remainingToRedeem: Decimal } {
    let unitsNeeded = new Decimal(unitsToRedeem);
    const allocations: RedemptionAllocation[] = [];
    let totalRealizedGain = new Decimal(0);

    for (const lot of lots) {
      if (unitsNeeded.isZero()) break;
      if (lot.remainingUnits.isZero()) continue;

      const unitsFromThisLot = Decimal.min(unitsNeeded, lot.remainingUnits);
      const holdingDays = Math.floor(
        (executionDate.getTime() - lot.purchaseDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const isLongTerm = holdingDays > this.EQUITY_LTCG_THRESHOLD_DAYS;

      // Realized Gain = ConsumedUnits * (ExitNAV - CostBasisNAV)
      const perUnitGain = exitNAV.minus(lot.costBasisNAV);
      const realizedGain = unitsFromThisLot.times(perUnitGain);

      allocations.push({
        lotId: lot.lotId,
        consumedUnits: unitsFromThisLot,
        purchaseDate: lot.purchaseDate,
        costBasisNAV: lot.costBasisNAV,
        exitNAV,
        realizedGain,
        holdingDays,
        isLongTerm
      });

      totalRealizedGain = totalRealizedGain.plus(realizedGain);
      lot.remainingUnits = lot.remainingUnits.minus(unitsFromThisLot);
      unitsNeeded = unitsNeeded.minus(unitsFromThisLot);
    }

    return {
      allocations,
      totalRealizedGain,
      remainingToRedeem: unitsNeeded // If > 0, requested units exceeded holding balance
    };
  }
}
```

---

#### 2.3.3 Step-Up SIP Future Value Mathematical Formulations
For an initial monthly contribution $P$, annual step-up percentage $g$, expected annual return $r$, monthly rate $i = r/12$, and tenure $N$ years:

$$\text{Future Value} (FV) = \sum_{y=1}^{N} \left[ P (1 + g)^{y-1} (1 + i) \frac{(1 + i)^{12} - 1}{i} (1 + i)^{12(N - y)} \right]$$

For fixed-amount step-up $S$ (e.g., adding ₹2,500 every year):
$$P_y = P + (y - 1)S$$
$$FV = \sum_{y=1}^{N} \left[ (P + (y-1)S) (1 + i) \frac{(1 + i)^{12} - 1}{i} (1 + i)^{12(N - y)} \right]$$

---

#### 2.3.4 Institutional Risk & Volatility Metrics
1.  **Sharpe Ratio**:
    $$S = \frac{R_p - R_f}{\sigma_p}$$
    Where $R_p$ is annualized portfolio return, $R_f$ is the risk-free rate (e.g., 91-Day Indian Treasury Bill yield, 6.75%), and $\sigma_p$ is annualized standard deviation of daily returns:
    $$\sigma_p = \sqrt{\frac{1}{N-1}\sum_{t=1}^N (R_t - \bar{R})^2} \times \sqrt{252}$$

2.  **Sortino Ratio (Downside Risk Optimization)**:
    $$S_{\text{down}} = \frac{R_p - R_f}{\sigma_{\text{downside}}}$$
    Where downside deviation isolates returns below the Minimum Acceptable Return (MAR, typically $R_f$):
    $$\sigma_{\text{downside}} = \sqrt{\frac{1}{N} \sum_{t=1}^N \min(0, R_t - \text{MAR})^2} \times \sqrt{252}$$

---

## 3. Security & Compliance Hardening Architecture

### 3.1 Authentication & Token Revocation Architecture
The legacy prototype persisted raw JWTs in browser `localStorage`. This presented fatal security vulnerabilities:
*   Any Cross-Site Scripting (XSS) payload could exfiltrate the token via `localStorage.getItem('token')`.
*   Tokens possessed indefinite or long lifetimes without revocation infrastructure.

```
+----------------------------------------------------------------------------------------------------+
|                                    SECURE TOKEN ROTATION FLOW                                      |
+---------------------+-------------------+---------------------+------------------------------------+
| Client POST /login  | Gateway Validates | Sets HttpOnly Cookie| In-Memory Access Token             |
| Secure Credentials  | Issues Token Pair | Refresh (7d TTL)    | Short-Lived Access (15m TTL)       |
+---------------------+-------------------+---------------------+------------------------------------+
                                      |
                           Upon Access Token Expiry
                                      v
+----------------------------------------------------------------------------------------------------+
| POST /api/auth/refresh -> Reads HttpOnly Cookie -> Verifies Redis Family -> Rotates Refresh Cookie  |
+----------------------------------------------------------------------------------------------------+
```

#### 3.1.1 Dual-Token Cookie Specification
1.  **Access Token**:
    *   Format: Cryptographically signed JWT (HMAC-SHA256 or asymmetric Ed25519).
    *   TTL: Exactly **15 minutes** (900 seconds).
    *   Storage: Emitted in response payload and held strictly in client JavaScript memory (Zustand state store). Optional fallback: `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/api` cookie.
2.  **Refresh Token**:
    *   Format: Cryptographically random 256-bit UUIDv4 / hex string.
    *   TTL: **7 days** (604,800 seconds).
    *   Storage: Strict Browser Cookie:
        `Set-Cookie: __Host-refreshToken=<TOKEN>; Max-Age=604800; Path=/api/auth/refresh; HttpOnly; Secure; SameSite=Strict`
3.  **Redis Token Family & Automatic Reuse Detection**:
    *   Every session belongs to a `familyId`.
    *   When a refresh token is presented, the system issues a new refresh token and marks the previous one as `ROTATED`.
    *   **Breach Detection**: If an already `ROTATED` token is submitted, the system assumes token theft. It triggers an immediate **Family Invalidation Rule**, revoking all active sessions for that user across all devices.

---

### 3.2 Time-Based One-Time Password (TOTP) MFA Architecture
*   **Standard**: RFC 6238 TOTP using SHA-1 / SHA-256 with 30-second time steps and 6-digit output.
*   **Library**: `speakeasy` or `@otplib/core`.
*   **Secret Storage**: The base32 secret is encrypted at rest using AES-256-GCM before database insertion.
*   **Mandatory Step-Up Enforcement**:
    The following operations require an active `x-mfa-token` verification header (valid for 300 seconds post-successful TOTP challenge):
    1.  `POST /api/transactions/withdraw` (Any balance outflow).
    2.  `PUT /api/customer/bank-details` (Bank modification).
    3.  `POST /api/admin/maker-checker/proposals/:id/action` (Admin approval/rejection).

---

### 3.3 Field-Level Encryption (FLE) at Rest & Structured Logging Masking
Sensitive Personally Identifiable Information (PII) and Tax Identifiers (Aadhaar, Permanent Account Number [PAN], Bank Account Numbers) must never be stored as plaintext in MongoDB or written to logging sinks.

#### 3.3.1 AES-256-GCM Envelope Encryption Engine
*   **Key Derivation**: Master Key stored in AWS KMS / HashiCorp Vault.
*   **Payload Layout**:
    $$\text{EncryptedField} = \text{base64}(\text{IV [12 bytes]} \parallel \text{AuthTag [16 bytes]} \parallel \text{Ciphertext})$$

```typescript
import crypto from 'crypto';

export class FieldEncryptionService {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly IV_LENGTH = 12; // 96 bits recommended for GCM
  private static readonly AUTH_TAG_LENGTH = 16;

  /**
   * Encrypts sensitive string using AES-256-GCM.
   */
  public static encrypt(plaintext: string, masterKeyHex: string): string {
    const key = Buffer.from(masterKeyHex, 'hex');
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);

    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    // Packed binary: IV (12) + Tag (16) + Ciphertext
    const packed = Buffer.concat([iv, tag, encrypted]);
    return packed.toString('base64');
  }

  /**
   * Decrypts AES-256-GCM payload.
   */
  public static decrypt(packedBase64: string, masterKeyHex: string): string {
    const key = Buffer.from(masterKeyHex, 'hex');
    const buffer = Buffer.from(packedBase64, 'base64');

    const iv = buffer.subarray(0, this.IV_LENGTH);
    const tag = buffer.subarray(this.IV_LENGTH, this.IV_LENGTH + this.AUTH_TAG_LENGTH);
    const ciphertext = buffer.subarray(this.IV_LENGTH + this.AUTH_TAG_LENGTH);

    const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString('utf8');
  }
}
```

#### 3.3.2 Strict PII Masking in Logging Pipeline
All Winston/Pino logger streams pass through a centralized redaction regex filter:

```typescript
export const PII_REDACTION_MASKS = {
  PAN: /[A-Z]{5}[0-9]{4}[A-Z]{1}/g,
  AADHAAR: /\b\d{4}\s?\d{4}\s?\d{4}\b/g,
  BANK_ACCOUNT: /\b\d{9,18}\b/g,
  EMAIL: /([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})/g
};

export function sanitizeLogData(message: string): string {
  return message
    .replace(PII_REDACTION_MASKS.PAN, '[REDACTED_PAN]')
    .replace(PII_REDACTION_MASKS.AADHAAR, '[REDACTED_AADHAAR]')
    .replace(PII_REDACTION_MASKS.BANK_ACCOUNT, '[REDACTED_BANK_ACCT]')
    .replace(PII_REDACTION_MASKS.EMAIL, (m, u, d, e) => `${u[0]}***@${d}.${e}`);
}
```

---

## 4. API Contracts, Idempotency & Rate Limiting

### 4.1 Idempotency Middleware Engine
Every state-mutating transaction requires an `Idempotency-Key: <UUIDv4>` header.

```
Idempotency Middleware Pipeline
1. Client sends POST with Idempotency-Key
2. Redis SETNX lock: "idemp:<userId>:<key>"
   - IF 0 (Exists):
     * Status == "IN_PROGRESS" -> Return HTTP 409 Conflict (Concurrent In-Flight)
     * Status == "COMPLETED"   -> Return Cached Response Body & Headers
   - IF 1 (New):
     * Set TTL 120s, Status "IN_PROGRESS"
     * Execute Controller logic
     * Cache response in Redis with 86400s (24h) TTL
     * Return response to client
```

---

### 4.2 RFC 7807 Problem Details Error Responses
All API error responses conform strictly to RFC 7807:

```json
{
  "type": "https://api.ips-wealth.com/errors/insufficient-units-for-redemption",
  "title": "Insufficient Holding Units",
  "status": 422,
  "detail": "Requested redemption of 150.0000 units exceeds unencumbered active units of 112.5000.",
  "instance": "/api/v2/transactions/redeem/tx-883109a",
  "errorCode": "HOLDING_UNITS_EXCEEDED",
  "invalidParams": [
    {
      "name": "units",
      "reason": "Must be less than or equal to 112.5000"
    }
  ],
  "timestamp": "2027-04-15T09:30:00.128Z"
}
```

---

### 4.3 Production Zod Request Validation Schemas

```typescript
import { z } from 'zod';

export const TransactionCreateSchema = z.object({
  portfolioId: z.string().uuid(),
  assetId: z.string().uuid(),
  type: z.enum(['BUY', 'SELL', 'SWITCH', 'DIVIDEND_REINVEST']),
  units: z
    .string()
    .regex(/^\d+(\.\d{1,4})?$/, 'Units must be a valid positive decimal up to 4 decimal places')
    .optional(),
  amountPaise: z
    .number()
    .int()
    .positive('Amount in paise must be a strictly positive 64-bit integer')
    .optional(),
  executionDate: z.string().datetime(),
  mandateId: z.string().uuid().optional()
}).refine(data => data.units !== undefined || data.amountPaise !== undefined, {
  message: 'Either units or amountPaise must be explicitly specified.'
});

export const InvestmentSetupSchema = z.object({
  portfolioId: z.string().uuid(),
  schemeCode: z.string().min(3).max(32),
  mode: z.enum(['LUMP_SUM', 'SIP', 'STEP_UP_SIP']),
  amountPaise: z.number().int().min(50000, 'Minimum investment is ₹500 (50,000 paise)'),
  sipFrequency: z.enum(['MONTHLY', 'QUARTERLY']).default('MONTHLY'),
  sipDebitDay: z.number().int().min(1).max(28),
  stepUpConfig: z
    .object({
      stepUpType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
      stepUpValue: z.number().positive(),
      frequencyMonths: z.enum(['6', '12']).default('12')
    })
    .optional()
}).refine(data => {
  if (data.mode === 'STEP_UP_SIP') {
    return data.stepUpConfig !== undefined;
  }
  return true;
}, {
  message: 'stepUpConfig is mandatory when investment mode is STEP_UP_SIP.'
});

export const PennyDropVerifySchema = z.object({
  accountNumber: z.string().regex(/^\d{9,18}$/, 'Invalid bank account number format'),
  ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code format'),
  accountHolderName: z.string().min(2).max(128)
});

export const MakerCheckerActionSchema = z.object({
  proposalId: z.string().uuid(),
  action: z.enum(['APPROVE', 'REJECT']),
  reviewComments: z.string().min(5).max(1000),
  totpToken: z.string().regex(/^\d{6}$/, '6-digit TOTP code required for authorization')
});
```

---

## 5. Data Models & Database Schemas (Mongoose / MongoDB)

### 5.1 MongoDB Mongoose Schema Declarations

```typescript
import { Schema, model, Document, Types } from 'mongoose';

// 1. USER & KYC PROFILE SCHEMA
export interface IUser extends Document {
  email: string;
  passwordHash: string;
  totpSecretEncrypted?: string;
  totpEnabled: boolean;
  role: 'RETAIL_USER' | 'HNI_USER' | 'ADVISOR' | 'COMPLIANCE_CHECKER' | 'SUPER_ADMIN';
  kycStatus: 'UNVERIFIED' | 'PENDING_DOCS' | 'DOCS_UPLOADED' | 'PENNY_DROP_INITIATED' | 'PENNY_DROP_VERIFIED' | 'ACTIVE' | 'SUSPENDED';
  panEncrypted?: string;
  panHashed?: string; // SHA-256 for duplicate lookup
  bankDetails?: {
    accountNumberEncrypted: string;
    ifsc: string;
    beneficiaryName: string;
    verifiedAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  totpSecretEncrypted: { type: String },
  totpEnabled: { type: Boolean, default: false },
  role: { 
    type: String, 
    enum: ['RETAIL_USER', 'HNI_USER', 'ADVISOR', 'COMPLIANCE_CHECKER', 'SUPER_ADMIN'], 
    default: 'RETAIL_USER',
    index: true 
  },
  kycStatus: { 
    type: String, 
    enum: ['UNVERIFIED', 'PENDING_DOCS', 'DOCS_UPLOADED', 'PENNY_DROP_INITIATED', 'PENNY_DROP_VERIFIED', 'ACTIVE', 'SUSPENDED'], 
    default: 'UNVERIFIED',
    index: true 
  },
  panEncrypted: { type: String },
  panHashed: { type: String, index: true, sparse: true },
  bankDetails: {
    accountNumberEncrypted: { type: String },
    ifsc: { type: String },
    beneficiaryName: { type: String },
    verifiedAt: { type: Date }
  }
}, { timestamps: true });


// 2. TAX LOT SCHEMA (Strict FIFO Accounting)
export interface ITaxLot extends Document {
  lotId: string;
  portfolioId: Types.ObjectId;
  userId: Types.ObjectId;
  isin: string;
  purchaseDate: Date;
  costBasisNAV: Types.Decimal128;
  originalUnits: Types.Decimal128;
  remainingUnits: Types.Decimal128;
  purchaseAmountPaise: Types.Long;
  status: 'ACTIVE' | 'EXHAUSTED';
}

export const TaxLotSchema = new Schema<ITaxLot>({
  lotId: { type: String, required: true, unique: true, index: true },
  portfolioId: { type: Schema.Types.ObjectId, ref: 'Portfolio', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  isin: { type: String, required: true, index: true },
  purchaseDate: { type: Date, required: true, index: true },
  costBasisNAV: { type: Schema.Types.Decimal128, required: true },
  originalUnits: { type: Schema.Types.Decimal128, required: true },
  remainingUnits: { type: Schema.Types.Decimal128, required: true, index: true },
  purchaseAmountPaise: { type: Schema.Types.Long, required: true },
  status: { type: String, enum: ['ACTIVE', 'EXHAUSTED'], default: 'ACTIVE', index: true }
}, { timestamps: true });

// Compound index for instant FIFO retrieval
TaxLotSchema.index({ portfolioId: 1, isin: 1, status: 1, purchaseDate: 1 });


// 3. STEP-UP SIP MANDATE SCHEMA
export interface ISIPMandate extends Document {
  mandateId: string;
  userId: Types.ObjectId;
  portfolioId: Types.ObjectId;
  schemeCode: string;
  baseAmountPaise: Types.Long;
  currentAmountPaise: Types.Long;
  debitDay: number;
  frequency: 'MONTHLY' | 'QUARTERLY';
  stepUpConfig?: {
    stepUpType: 'PERCENTAGE' | 'FIXED_AMOUNT';
    stepUpValue: number; // e.g. 10 (%) or 250000 (paise)
    frequencyMonths: number; // 6 or 12
    lastStepUpDate?: Date;
    nextStepUpDate: Date;
  };
  mandateMaxLimitPaise: Types.Long;
  status: 'ACTIVE' | 'PAUSED' | 'FAILED_RETRY' | 'CANCELLED';
  consecutiveFailures: number;
  nextExecutionDate: Date;
}

export const SIPMandateSchema = new Schema<ISIPMandate>({
  mandateId: { type: String, required: true, unique: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  portfolioId: { type: Schema.Types.ObjectId, ref: 'Portfolio', required: true },
  schemeCode: { type: String, required: true },
  baseAmountPaise: { type: Schema.Types.Long, required: true },
  currentAmountPaise: { type: Schema.Types.Long, required: true },
  debitDay: { type: Number, required: true, min: 1, max: 28 },
  frequency: { type: String, enum: ['MONTHLY', 'QUARTERLY'], default: 'MONTHLY' },
  stepUpConfig: {
    stepUpType: { type: String, enum: ['PERCENTAGE', 'FIXED_AMOUNT'] },
    stepUpValue: { type: Number },
    frequencyMonths: { type: Number, default: 12 },
    lastStepUpDate: { type: Date },
    nextStepUpDate: { type: Date }
  },
  mandateMaxLimitPaise: { type: Schema.Types.Long, required: true },
  status: { type: String, enum: ['ACTIVE', 'PAUSED', 'FAILED_RETRY', 'CANCELLED'], default: 'ACTIVE', index: true },
  consecutiveFailures: { type: Number, default: 0 },
  nextExecutionDate: { type: Date, required: true, index: true }
}, { timestamps: true });


// 4. MAKER-CHECKER PROPOSAL SCHEMA
export interface IMakerCheckerProposal extends Document {
  proposalId: string;
  makerId: Types.ObjectId;
  checkerId?: Types.ObjectId;
  actionType: 'CATALOG_PUBLISH' | 'HIGH_VALUE_WITHDRAWAL' | 'BANK_CHANGE' | 'FEE_OVERRIDE';
  payload: Record<string, unknown>;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  reviewComments?: string;
  expiresAt: Date;
  signature: string; // HMAC SHA-256 over canonical proposal payload
}

export const MakerCheckerProposalSchema = new Schema<IMakerCheckerProposal>({
  proposalId: { type: String, required: true, unique: true, index: true },
  makerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  checkerId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  actionType: { 
    type: String, 
    enum: ['CATALOG_PUBLISH', 'HIGH_VALUE_WITHDRAWAL', 'BANK_CHANGE', 'FEE_OVERRIDE'], 
    required: true, 
    index: true 
  },
  payload: { type: Schema.Types.Mixed, required: true },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'], default: 'PENDING', index: true },
  reviewComments: { type: String },
  expiresAt: { type: Date, required: true, index: true },
  signature: { type: String, required: true }
}, { timestamps: true });
```

---

## 6. Non-Functional Requirements & Infrastructure Architecture

### 6.1 Service Level Agreements (SLAs) & Latency Budgets
*   **Portfolio Summary API (`GET /api/portfolio/summary`)**: P95 $< 150\text{ ms}$, P99 $< 300\text{ ms}$.
*   **XIRR Analytics API (`GET /api/analytics/xirr`)**: P95 $< 120\text{ ms}$ (utilizing cached daily rollups and delta compute).
*   **Transaction Execution (`POST /api/transactions`)**: P95 $< 250\text{ ms}$ (ACID commit across Ledger, Holding, and TaxLot).
*   **System Availability**: $\ge 99.99\%$ monthly uptime (excluding planned maintenance windows scheduled outside trading hours).

### 6.2 ACID Transaction Boundaries & Double-Spend Guard
All monetary state transitions strictly utilize MongoDB multi-document ACID transactions with session guarantees:

```typescript
import mongoose from 'mongoose';

export async function executeAtomicRedemption(redemptionPayload: any) {
  const session = await mongoose.startSession();
  session.startTransaction({
    readConcern: { level: 'snapshot' },
    writeConcern: { w: 'majority', j: true }
  });

  try {
    // 1. Fetch & lock portfolio
    // 2. Consume FIFO TaxLots
    // 3. Insert LedgerTransaction (DEBIT)
    // 4. Update Holding summary units
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
```

### 6.3 Backup, Disaster Recovery & Point-In-Time Recovery (PITR)
*   **Continuous Oplog Archiving**: MongoDB Replica Set oplog streams continuously to an immutable S3 bucket with Object Lock (WORM).
*   **Recovery Point Objective (RPO)**: $< 1.0\text{ minute}$.
*   **Recovery Time Objective (RTO)**: $< 15.0\text{ minutes}$ failover to secondary region.
*   **Automated Verification**: Daily automated restore drills executed in an isolated staging VPC to certify snapshot integrity.

---

*End of Technical Requirements Document (TRD.md)*

