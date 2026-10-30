# Software Architecture Document (SAD)
## Institutional Wealth Management & Investment Advisory Platform (IPS v2.0)

**Document Version:** `2.0.0-PROD`  
**Classification:** Institutional Confidential / Internal Engineering Architecture  
**Status:** Approved for Implementation  
**Role:** Principal Distributed Systems Architect  
**Companion Documents:** `docs/PRD.md`, `docs/TRD.md`, `docs/SYSTEM_DESIGN.md`  
**Target Delivery Window:** Q1–Q3 2027  

---

## 1. Architectural Philosophy & Monolith Eradication

The legacy IPS v1.0 prototype suffered from extreme code concentration and lack of architectural boundaries:
*   `UserPortal.jsx` (2,807 lines of code) concentrated authentication, portfolio visualization, goal calculators, SIP management, transaction execution, in-memory filtering, and mock fallback switching into a single React component.
*   `AdminPortal.jsx` (2,573 lines of code) combined user list mutations, unverified balance adjustments, manual catalog file uploads, and system configurations into one file.
*   9 orphaned prototype tab files lived alongside these portals without standardized design systems or modular interfaces.
*   Backend routes commingled database queries, business logic, authorization checks, and external API requests inside inline Express route callbacks.

IPS v2.0 establishes a strict **Clean Layered Architecture** on the backend and a **Domain-Driven Modular Architecture** on the frontend.

```
+----------------------------------------------------------------------------------------------------+
|                                    CLEAN SEPARATION OF CONCERNS                                    |
+----------------------------------------------------------------------------------------------------+
  [ HTTP Request ]
         |
         v
  [ Route Handlers ]               --> Endpoint URL definition & middleware attachment
         |
         v
  [ Middleware Pipeline ]          --> Auth, RBAC, Zod Validation, Idempotency, Tenant IDOR Guard
         |
         v
  [ Controller Layer ]             --> HTTP orchestration, Status Codes, RFC 7807 Exception Mapping
         |
         v
  [ Domain Service Layer ]         --> Pure business logic, Financial calculations, Workflows
         |
         v
  [ Repository / Model Layer ]     --> MongoDB Mongoose Models, Redis Locks, ACID Transactions
```

---

## 2. Backend Clean Layered Architecture

### 2.1 The 5-Tier Request Pipeline

Every inbound API request traverses an invariant 5-tier pipeline:

```
[ Inbound HTTP ]
       |
       v
+----------------------------------------------------------------------------------------------------+
| TIER 1: ROUTE REGISTRATION                                                                         |
| Defines HTTP method, URL path, and attaches middleware chain. No logic permitted.                  |
+----------------------------------------------------------------------------------------------------+
       |
       v
+----------------------------------------------------------------------------------------------------+
| TIER 2: MIDDLEWARE GUARDS                                                                          |
| 1. authenticateJwt (Reads HttpOnly cookie, verifies signature, loads req.user)                     |
| 2. authorizeRoles(['RETAIL_USER', 'HNI_USER']) (RBAC verification)                                  |
| 3. validateRequest(ZodSchema) (Parses & strips unknown fields)                                     |
| 4. idempotencyGuard (Redis atomic SETNX lock)                                                      |
| 5. tenantIsolationGuard (Guarantees caller owns resource, prevents IDOR)                          |
+----------------------------------------------------------------------------------------------------+
       |
       v
+----------------------------------------------------------------------------------------------------+
| TIER 3: CONTROLLERS                                                                                |
| Extracts typed parameters from req.body/params/query. Invokes Domain Services.                     |
| Never executes direct database queries. Formats HTTP 200/201/204 responses.                        |
+----------------------------------------------------------------------------------------------------+
       |
       v
+----------------------------------------------------------------------------------------------------+
| TIER 4: DOMAIN SERVICES (Pure Business Logic)                                                      |
| LedgerService, XirrService, SipEngine, MarketValuationService, KycService.                         |
| Executes business rules, manages ACID transaction sessions, dispatches domain events.             |
+----------------------------------------------------------------------------------------------------+
       |
       v
+----------------------------------------------------------------------------------------------------+
| TIER 5: DATA ACCESS REPOSITORIES & MODELS                                                          |
| Mongoose Models with Decimal128 types. Atomic write operations, bulk writes, snapshot reads.       |
+----------------------------------------------------------------------------------------------------+
```

---

### 2.2 Strict Owner-Scoped Tenant Isolation Middleware (IDOR Defense)
In a wealth management platform, an Insecure Direct Object Reference (IDOR) vulnerability (e.g., User A passing `portfolioId` belonging to User B to inspect holdings or execute redemptions) is a catastrophic regulatory and security failure.

IPS v2.0 enforces owner-scoped tenant isolation via specialized middleware guards:

```typescript
import { Request, Response, NextFunction } from 'express';
import { PortfolioModel } from '../models/portfolio.model';
import { ApiError } from '../errors/ApiError';

/**
 * Tenant Isolation Guard: Verifies the authenticated user owns the target portfolio.
 * Prevents cross-tenant IDOR attacks.
 */
export async function verifyPortfolioOwnership(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const portfolioId = req.params.portfolioId || req.body.portfolioId;
  const authenticatedUserId = req.user?.id;

  if (!portfolioId) {
    return next(ApiError.badRequest('portfolioId is required in request parameters or body.'));
  }

  if (!authenticatedUserId) {
    return next(ApiError.unauthorized('User session not authenticated.'));
  }

  // Admins with COMPLIANCE_CHECKER or SUPER_ADMIN role can bypass ownership for audit purposes
  if (req.user?.role === 'COMPLIANCE_CHECKER' || req.user?.role === 'SUPER_ADMIN') {
    return next();
  }

  const portfolio = await PortfolioModel.findById(portfolioId).select('userId status').lean();

  if (!portfolio) {
    // Return 404 to avoid leaking existence of other tenants' resources
    return next(ApiError.notFound('Portfolio resource not found.'));
  }

  if (portfolio.userId.toString() !== authenticatedUserId.toString()) {
    // Log security warning for SIEM audit
    console.warn(`[SECURITY ALERT] IDOR Attempt detected: User ${authenticatedUserId} attempted access to Portfolio ${portfolioId}`);
    return next(ApiError.forbidden('You do not have authorization to access this portfolio resource.'));
  }

  // Bind verified resource to request context
  req.resource = { portfolio };
  return next();
}
```

---

### 2.3 Dependency Injection & Service Layer Implementation

Domain services are written as decoupled, injectable classes that receive database sessions and external adapters via constructor parameters:

```typescript
import mongoose, { ClientSession } from 'mongoose';
import { ILedgerService, IAccountBalanceRepository, ITransactionRepository } from '../interfaces';
import { XIRRCalculator } from '../quant/XIRRCalculator';
import { FIFOTaxEngine } from '../quant/FIFOTaxEngine';
import { Decimal } from 'decimal.js';

export class PortfolioDomainService {
  constructor(
    private readonly ledgerService: ILedgerService,
    private readonly balanceRepo: IAccountBalanceRepository,
    private readonly transactionRepo: ITransactionRepository
  ) {}

  /**
   * Executes atomic portfolio redemption with FIFO tax lot matching and ledger balancing.
   */
  public async executeRedemption(
    userId: string,
    portfolioId: string,
    isin: string,
    unitsToRedeem: string,
    currentNAV: string,
    idempotencyKey: string
  ): Promise<any> {
    const session: ClientSession = await mongoose.startSession();
    session.startTransaction({
      readConcern: { level: 'snapshot' },
      writeConcern: { w: 'majority', j: true }
    });

    try {
      // 1. Fetch available active tax lots for this security
      const lots = await this.ledgerService.getActiveLots(portfolioId, isin, session);
      
      // 2. Execute FIFO allocation
      const redemptionResult = FIFOTaxEngine.executeFIFORedemption(
        lots,
        new Decimal(unitsToRedeem),
        new Decimal(currentNAV),
        new Date()
      );

      if (redemptionResult.remainingToRedeem.greaterThan(0)) {
        throw new Error('Insufficient unencumbered units available for redemption.');
      }

      // 3. Compute Gross & Net Proceeds
      const grossProceedsPaise = redemptionResult.allocations
        .reduce((sum, alloc) => sum.plus(alloc.consumedUnits.times(alloc.exitNAV)), new Decimal(0))
        .times(100)
        .round()
        .toNumber();

      // 4. Create Ledger Transaction
      const tx = await this.ledgerService.recordRedemptionTransaction({
        userId,
        portfolioId,
        grossProceedsPaise,
        idempotencyKey,
        allocations: redemptionResult.allocations,
        session
      });

      await session.commitTransaction();
      return tx;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
```

---

## 3. Frontend Domain-Driven Modular Architecture

### 3.1 Eradication of Portal Monoliths & Feature Decomposition
The monolithic `UserPortal.jsx` and `AdminPortal.jsx` are decomposed into modular domain features located under `frontend/src/features/`. Each feature is self-contained with its own API calls, hooks, components, and types:

```
frontend/src/features/
├── dashboard/               # High-level net worth, allocation breakdown, quick action bars
├── portfolio/               # Holdings table, look-through X-Ray, sector/cap overlap
├── investments/             # Scheme catalog browser, search & discovery, fund comparison
├── goals/                   # Dynamic goal glidepath planner, Monte Carlo probability visualizer
├── sips/                    # Active mandate manager, step-up calculator, dunning status
├── calculators/             # Standalone financial tools (CAGR, XIRR, Step-Up, FIRE)
├── tax-harvesting/          # FIFO lot scanner, unrealized STCL/LTCL harvesting workbench
├── ledger/                  # Bank-grade double-entry transaction history, statement download
├── kyc/                     # Verification wizard, penny-drop feedback, document upload
└── admin/                   # Privileged administration suite
    ├── catalog/             # Scheme listing, NAV update engine, expense ratio editor
    ├── maker-checker/       # Dual-control proposal review queue and approval interface
    ├── users/               # Client oversight, AML status, account freeze controls
    └── settlements/         # BSE StAR / ICCL file upload, reconciliation, ledger audits
```

---

### 3.2 Routing Architecture (`react-router-dom` v6)
IPS v2.0 replaces internal React state routing with standard URL routing featuring lazy-loaded route boundaries, browser history integration, query-string synchronization, and role-based route guards.

```tsx
// frontend/src/routes/AppRoutes.tsx
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { AdminLayout } from '../components/layout/AdminLayout';
import { RequireAuth } from './RequireAuth';
import { RequireRole } from './RequireRole';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

// Lazy-Loaded Feature Modules (Code-Splitting)
const DashboardPage = lazy(() => import('../features/dashboard/pages/DashboardPage'));
const PortfolioPage = lazy(() => import('../features/portfolio/pages/PortfolioPage'));
const GoalsPage = lazy(() => import('../features/goals/pages/GoalsPage'));
const SipsPage = lazy(() => import('../features/sips/pages/SipsPage'));
const TaxHarvestingPage = lazy(() => import('../features/tax-harvesting/pages/TaxHarvestingPage'));
const CatalogPage = lazy(() => import('../features/investments/pages/CatalogPage'));
const LedgerPage = lazy(() => import('../features/ledger/pages/LedgerPage'));
const KycPage = lazy(() => import('../features/kyc/pages/KycPage'));

// Admin Modules
const MakerCheckerPage = lazy(() => import('../features/admin/maker-checker/pages/MakerCheckerPage'));
const AdminCatalogPage = lazy(() => import('../features/admin/catalog/pages/AdminCatalogPage'));
const AdminSettlementsPage = lazy(() => import('../features/admin/settlements/pages/AdminSettlementsPage'));

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Authenticated Investor Routes */}
        <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/invest" element={<CatalogPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/sips" element={<SipsPage />} />
          <Route path="/tax-harvesting" element={<TaxHarvestingPage />} />
          <Route path="/ledger" element={<LedgerPage />} />
          <Route path="/kyc" element={<KycPage />} />
        </Route>

        {/* Protected Institutional Admin Routes */}
        <Route element={<RequireRole roles={['COMPLIANCE_CHECKER', 'SUPER_ADMIN']}><AdminLayout /></RequireRole>}>
          <Route path="/admin" element={<Navigate to="/admin/maker-checker" replace />} />
          <Route path="/admin/maker-checker" element={<MakerCheckerPage />} />
          <Route path="/admin/catalog" element={<AdminCatalogPage />} />
          <Route path="/admin/settlements" element={<AdminSettlementsPage />} />
        </Route>

        {/* Fallback 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};
```

---

### 3.3 State Management Partitioning: Server State vs. Client State

```
+----------------------------------------------------------------------------------------------------+
|                                STATE ARCHITECTURE PARTITIONING                                     |
+----------------------------------------------------+-----------------------------------------------+
| SERVER STATE (TanStack Query v5)                   | CLIENT / UI STATE (Zustand Stores)            |
+----------------------------------------------------+-----------------------------------------------+
| * User Portfolio & Holdings                        | * Active Modal & Drawer Open/Closed State     |
| * Scheme Catalog & Market NAVs                     | * Transient Filter Toggles (e.g., Equity only)|
| * Historical Snapshot Time-Series                  | * Interactive Calculator Inputs               |
| * Ledger Transaction Statements                    | * Client Theme (Light / Dark)                 |
| * Cache Policies, Retries, Background Revalidation | * In-Memory Step Wizards                      |
+----------------------------------------------------+-----------------------------------------------+
```

#### 3.3.1 TanStack Query Query Key Factory Pattern
To eliminate query key collisions and guarantee deterministic cache invalidation:

```typescript
// frontend/src/lib/queryKeys.ts
export const portfolioKeys = {
  all: ['portfolio'] as const,
  summary: (portfolioId: string) => [...portfolioKeys.all, 'summary', portfolioId] as const,
  holdings: (portfolioId: string) => [...portfolioKeys.all, 'holdings', portfolioId] as const,
  snapshots: (portfolioId: string, range: string) => [...portfolioKeys.all, 'snapshots', portfolioId, range] as const,
  xray: (portfolioId: string) => [...portfolioKeys.all, 'xray', portfolioId] as const,
};

export const sipKeys = {
  all: ['sips'] as const,
  list: (userId: string) => [...sipKeys.all, 'list', userId] as const,
  detail: (mandateId: string) => [...sipKeys.all, 'detail', mandateId] as const,
};
```

---

### 3.4 Demo Mode Quarantine & Mock Adapter Isolation
In the legacy prototype, mock fallbacks were scattered haphazardly inside UI components:
```javascript
// PROTOTYPE ANTI-PATTERN:
const data = await fetch('/api/data').catch(() => MOCK_DATA);
```
This created a severe security risk where production deployments silently served simulated mock balances if an API encountered a transient 500 error.

IPS v2.0 establishes a strict **Compile-Time / Env-Gated Adapter Boundary**:

```typescript
// frontend/src/api/client.ts
import axios, { AxiosInstance } from 'axios';
import { createMockAdapter } from './mockAdapter';

const isDemoMode = import.meta.env.VITE_ENABLE_DEMO_MODE === 'true';
const isProduction = import.meta.env.PROD;

if (isDemoMode && isProduction) {
  throw new Error('[FATAL SECURITY EXCEPTION] VITE_ENABLE_DEMO_MODE cannot be enabled in production builds.');
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v2',
  withCredentials: true, // Mandates HttpOnly cookies for session
  headers: {
    'Content-Type': 'application/json',
  },
});

// Demo Mode is quarantined behind the adapter pattern
if (isDemoMode) {
  console.warn('[SECURITY NOTICE] Application initialized with DEMO_MODE mock adapter.');
  createMockAdapter(apiClient);
}
```

---

*End of Software Architecture Document (ARCHITECTURE.md)*

