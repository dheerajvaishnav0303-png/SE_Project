# Production File Structure & Module Responsibility Guide
## Institutional Wealth Management & Investment Advisory Platform (IPS v2.0)

**Document Version:** `2.0.0-PROD`  
**Classification:** Institutional Confidential / Internal Engineering Blueprint  
**Status:** Approved for Implementation  
**Role:** Principal Distributed Systems Architect  
**Target Delivery Window:** Q1–Q3 2027  

---

## 1. Monorepo Root Directory Topology

```
e:/SE_Project/
├── .github/                           # CI/CD workflows & automation
│   └── workflows/
│       ├── backend-ci.yml             # Lint, unit tests, Zod contract verification, audit
│       ├── frontend-ci.yml            # ESLint, TypeScript check, Vitest, bundle size guard
│       └── deploy-staging.yml         # Container build, automated migration, ECS/K8s deploy
├── docker/                            # Production container & orchestrator configurations
│   ├── Dockerfile.backend             # Multi-stage Node.js 22 LTS Alpine production container
│   ├── Dockerfile.frontend            # Multi-stage NGINX unprivileged SPA container
│   ├── docker-compose.yml             # Local dev orchestrator (API, Mongo, Redis, Workers)
│   └── mongo-init/                    # Replica set initialization and seed script
│       └── 01-init-replica.js
├── docs/                              # Institutional Architecture & Engineering Specifications
│   ├── PRD.md                         # Product Requirements Document
│   ├── TRD.md                         # Technical Requirements Document
│   ├── SYSTEM_DESIGN.md               # Distributed System Design Document
│   ├── ARCHITECTURE.md                # Software Architecture Document
│   └── FILE_STRUCTURE.md              # Monorepo Topology & Module Responsibility Guide
├── backend/                           # Node.js / TypeScript Clean Layered Backend Service
│   ├── src/
│   │   ├── config/                    # Environment variables, database & redis connections
│   │   ├── constants/                 # Financial constants, tax rates, standard chart of accounts
│   │   ├── controllers/               # HTTP Orchestration controllers (no direct DB access)
│   │   ├── errors/                    # RFC 7807 Problem Details classes & global error handler
│   │   ├── middlewares/               # Security, Auth, RBAC, Validation, Idempotency, IDOR guards
│   │   ├── models/                    # MongoDB Mongoose schemas with Decimal128 & indexes
│   │   ├── quant/                     # Quantitative financial math library (XIRR, FIFO, Monte Carlo)
│   │   ├── repositories/              # Database data-access layer (CRUD + Transactions)
│   │   ├── routes/                    # Express route definitions grouped by domain
│   │   ├── services/                  # Pure domain business services (Ledger, SIP, MTM)
│   │   ├── types/                     # TypeScript type definitions and request contexts
│   │   ├── utils/                     # Cryptography, PII redaction, logger, date helpers
│   │   ├── websocket/                 # Socket.io gateway & Redis Pub/Sub event bridge
│   │   ├── workers/                   # BullMQ async background task workers
│   │   ├── app.ts                     # Express application factory & middleware registration
│   │   └── server.ts                  # HTTP & WebSocket server entrypoint
│   ├── tests/
│   │   ├── unit/                      # Unit tests for quant math, FIFO lot splitting, Zod schemas
│   │   └── integration/               # Integration tests for ACID transactions & double-entry ledger
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── frontend/                          # React 19 + TypeScript Domain-Driven Modular Client
│   ├── public/                        # Static brand assets, favicon, manifest
│   ├── src/
│   │   ├── api/                       # Axios client instance, mock adapter, interceptors
│   │   ├── assets/                    # SVG icons, illustrations, logo marks
│   │   ├── components/                # Shared UI primitives, layouts, and financial charts
│   │   │   ├── charts/                # Lightweight Charts, Monte Carlo cones, glidepath graphs
│   │   │   ├── layout/                # Shell layouts (Investor Shell, Admin Shell, Auth Shell)
│   │   │   └── ui/                    # Reusable design system primitives (Radix UI + Tailwind)
│   │   ├── context/                   # Global React contexts (Theme, WebSocket stream)
│   │   ├── features/                  # Domain-driven modular feature folders
│   │   │   ├── admin/                 # Catalog management, Maker-Checker, settlement audits
│   │   │   ├── calculators/           # Standalone quant tools (XIRR, Step-Up, FIRE, CAGR)
│   │   │   ├── dashboard/             # Consolidated wealth overview, net worth, quick actions
│   │   │   ├── goals/                 # Goal glidepath planner, Monte Carlo visualizer
│   │   │   ├── investments/           # Scheme explorer, mutual fund catalog, fund comparison
│   │   │   ├── kyc/                   # Identity verification, penny-drop feedback, onboarding
│   │   │   ├── ledger/                # Double-entry transaction history, statement exports
│   │   │   ├── portfolio/             # Holdings table, look-through X-Ray, sector/cap overlap
│   │   │   ├── sips/                  # Active SIP mandate manager, step-up config, dunning alerts
│   │   │   └── tax-harvesting/        # FIFO lot scanner, unrealized STCL/LTCL workbench
│   │   ├── hooks/                     # Shared React hooks (useDebounce, useMediaQuery, etc.)
│   │   ├── lib/                       # Utilities, formatters (paise to INR), query keys
│   │   ├── routes/                    # AppRoutes, ProtectedRoute guards, Role guards
│   │   ├── stores/                    # Zustand client stores for ephemeral UI state
│   │   ├── types/                     # Shared TypeScript interfaces matching API DTOs
│   │   ├── App.tsx                    # Root application component with Providers
│   │   ├── index.css                  # Tailwind CSS root stylesheet
│   │   └── main.tsx                   # Client entrypoint
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── vite.config.ts
└── README.md
```

---

## 2. Detailed Module Responsibilities: Backend Architecture

### 2.1 Backend Core Directories (`backend/src/`)

```
backend/src/
├── config/
│   ├── database.ts             # MongoDB Replica Set connection pool with transaction options
│   ├── env.ts                  # Type-safe environment validation via Zod (ensures KMS keys present)
│   └── redis.ts                # Redis cluster client for BullMQ, caching, and distributed locks
├── constants/
│   ├── chartOfAccounts.ts      # Enums for USER_WALLET, ESCROW_CLEARING, ASSET_HOLDING, FEE_REVENUE
│   ├── financialCutoffs.ts     # Statutory trading cutoffs (13:30 Liquid, 15:00 Equity IST)
│   └── taxRates.ts             # Statutory STCG (20%) and LTCG (12.5%) rates and exemption limits
├── controllers/
│   ├── adminController.ts      # Catalog management, Maker-Checker proposal approval/rejection
│   ├── analyticsController.ts  # XIRR, TWR, Sharpe, Sortino, and Monte Carlo probability endpoints
│   ├── authController.ts       # Secure login, HttpOnly cookie emission, refresh token rotation
│   ├── kycController.ts        # Document upload, penny-drop verification trigger, status checks
│   ├── portfolioController.ts  # Portfolio holdings, X-Ray overlap, snapshot time-series
│   ├── sipController.ts        # SIP mandate creation, step-up configuration, pause/resume
│   └── transactionController.ts# Idempotent order placement, double-entry redemptions, ledger statements
├── errors/
│   ├── ApiError.ts             # Base RFC 7807 Problem Details error class
│   ├── BadRequestError.ts      # HTTP 400 with invalid parameter breakdown
│   ├── ForbiddenError.ts       # HTTP 403 authorization failures
│   ├── IdempotencyConflictError.ts # HTTP 409 for duplicate concurrent requests
│   ├── NotFoundError.ts        # HTTP 404 resource absent
│   └── errorHandler.ts         # Global Express error middleware mapping all exceptions to RFC 7807
├── middlewares/
│   ├── authGuard.ts            # Validates JWT in HttpOnly cookie; attaches req.user
│   ├── idempotencyGuard.ts     # Redis atomic SETNX lock on Idempotency-Key header
│   ├── piiRedactionStream.ts   # Intercepts logging to mask PAN, Aadhaar, and bank accounts
│   ├── rateLimiter.ts          # Redis sliding-window rate limiter per IP / User ID
│   ├── rbacGuard.ts            # Role-Based Access Control validator (RETAIL, HNI, ADMIN)
│   ├── tenantIsolationGuard.ts # IDOR protection: guarantees authenticated user owns resource
│   └── zodValidator.ts         # Generic schema validation middleware parsing request body/query
├── models/
│   ├── AccountBalance.ts       # Materialized account balance projection with optimistic __v
│   ├── AssetPrice.ts           # Daily EOD historical price/NAV time-series
│   ├── InvestmentScheme.ts     # Mutual fund / security master catalog with risk ratings
│   ├── KYCProfile.ts           # Onboarding state machine, encrypted PII, penny-drop metadata
│   ├── LedgerEntry.ts          # Immutable balanced debit/credit legs
│   ├── MakerCheckerProposal.ts # Dual-control proposals, cryptographic HMAC signatures
│   ├── Portfolio.ts            # High-level investor portfolio container
│   ├── PortfolioSnapshot.ts    # Materialized daily historical snapshots for fast charting
│   ├── SIPMandate.ts           # Step-Up SIP parameters, mandate ceiling, execution state
│   ├── TaxLot.ts               # Granular purchase lots for strict FIFO tax accounting
│   ├── Transaction.ts          # Transaction header records (BUY, SELL, SIP, DEPOSIT)
│   └── User.ts                 # Core identity, password hash, encrypted TOTP secret, role
├── quant/
│   ├── FIFOTaxEngine.ts        # Chronological lot consumption, STCG/LTCG splitting, gain calculation
│   ├── MonteCarloSimulator.ts  # 1,000-run Geometric Brownian Motion with drift and volatility
│   ├── RiskMetrics.ts          # Sharpe, Sortino, Treynor, and Beta calculation against benchmark
│   ├── StepUpSIPCalculator.ts  # Closed-form future value compounding for percentage & fixed step-ups
│   └── XIRRCalculator.ts       # Newton-Raphson iteration with bounded Brent's bisection fallback
├── repositories/
│   ├── balanceRepository.ts    # Atomic balance increments with optimistic concurrency checks
│   ├── ledgerRepository.ts     # Batch insertion of immutable debit/credit pairs
│   ├── snapshotRepository.ts   # Bulk upsert of daily marked-to-market portfolio snapshots
│   └── taxLotRepository.ts     # FIFO lot retrieval (ordered by purchaseDate ASC) and unit deduction
├── routes/
│   ├── adminRoutes.ts          # /api/v2/admin/*
│   ├── analyticsRoutes.ts      # /api/v2/analytics/*
│   ├── authRoutes.ts           # /api/v2/auth/*
│   ├── kycRoutes.ts            # /api/v2/kyc/*
│   ├── portfolioRoutes.ts      # /api/v2/portfolio/*
│   ├── sipRoutes.ts            # /api/v2/sips/*
│   └── transactionRoutes.ts    # /api/v2/transactions/*
├── services/
│   ├── kycService.ts           # Integrates with Penny-Drop bank API and CKYC registry
│   ├── ledgerService.ts        # ACID multi-document transaction orchestrator for monetary moves
│   ├── marketValuationService.ts# Marks portfolio holdings to market and recalculates XIRR/TWR
│   ├── portfolioService.ts     # Look-through holding overlap computation and drift alerts
│   ├── sipEngineService.ts     # Evaluates annual step-up escalations and processes recurring debits
│   └── taxHarvestingService.ts # Scans portfolio lots for unrealized losses and harvest opportunities
├── utils/
│   ├── encryption.ts           # AES-256-GCM envelope encryption for sensitive database fields
│   ├── logger.ts               # Structured JSON logger (Winston/Pino) with PII redaction
│   └── stringDistance.ts       # Levenshtein & Jaro-Winkler algorithms for penny-drop name matching
├── websocket/
│   ├── eventGateway.ts         # Socket.io connection lifecycle, JWT auth handshake, room joining
│   └── redisSubscriber.ts      # Listens to Redis Pub/Sub and dispatches events to client rooms
└── workers/
    ├── amfiIngestionWorker.ts   # Daily 21:30 IST cron job fetching AMFI NAVAll.txt feed
    ├── mtmPortfolioWorker.ts    # Daily post-market mark-to-market cruncher writing snapshots
    └── sipExecutionWorker.ts    # Daily 04:00 IST cron job executing due SIP mandates via BullMQ
```

---

## 3. Detailed Module Responsibilities: Frontend Architecture

### 3.1 Feature Directory Breakdown (`frontend/src/features/`)

Every feature module follows a strict domain boundary:

```
frontend/src/features/<feature-name>/
├── api/                        # TanStack Query query/mutation hooks calling apiClient
├── components/                 # Feature-specific presentational & container components
├── hooks/                      # Custom hooks isolating feature logic
├── pages/                      # Routable top-level page components (lazy-loaded in AppRoutes)
├── types/                      # Feature-specific TypeScript DTOs
└── index.ts                    # Public barrel export exposing only necessary interfaces
```

#### Detailed Feature Inventories:

1.  **`features/dashboard/`**:
    *   `pages/DashboardPage.tsx`: Top-level landing view for authenticated investors.
    *   `components/NetWorthCard.tsx`: Total balance with day-change indicators and base-100 chart.
    *   `components/AssetAllocationDonut.tsx`: High-level distribution (Equity, Debt, Gold, Cash).
    *   `components/QuickActionBar.tsx`: One-click buttons to Invest, Start SIP, or Withdraw.
    *   `components/DriftAlertBanner.tsx`: Prompts user when allocation has drifted $> 5\%$.
2.  **`features/portfolio/`**:
    *   `pages/PortfolioPage.tsx`: Comprehensive portfolio analytical headquarters.
    *   `components/HoldingsTable.tsx`: Virtualized list of investments with real-time XIRR, current value, invested value, and P&L.
    *   `components/PortfolioXRay.tsx`: 3x3 Morningstar-style style box and sector allocation.
    *   `components/OverlapMatrix.tsx`: Look-through matrix exposing duplicate underlying stock holdings across distinct mutual funds.
    *   `components/BenchmarkOverlayChart.tsx`: Normalized comparative chart against NIFTY 50 TRI.
3.  **`features/investments/`**:
    *   `pages/CatalogPage.tsx`: Searchable catalog of approved mutual funds and baskets.
    *   `components/FundFilterBar.tsx`: Category, risk rating, AMC, and expense ratio filters.
    *   `components/FundCard.tsx`: Summary card with 1Y, 3Y, 5Y CAGR, and risk badges.
    *   `components/InvestmentModal.tsx`: Order initiation dialog supporting Lump-Sum and SIP.
4.  **`features/goals/`**:
    *   `pages/GoalsPage.tsx`: Goal management headquarters (Retirement, Education, Home).
    *   `components/GoalCard.tsx`: Progress bar, inflation-adjusted target, and feasibility score.
    *   `components/GlidepathChart.tsx`: Visualizes the automatic de-risking transition from equity to fixed income.
    *   `components/MonteCarloConeChart.tsx`: Visualizes P10, P50, and P90 stochastic simulation paths.
5.  **`features/sips/`**:
    *   `pages/SipsPage.tsx`: Active mandate tracking and scheduled debit calendars.
    *   `components/ActiveSIPList.tsx`: List of running mandates with next debit date and amount.
    *   `components/StepUpConfigurationDrawer.tsx`: Modal configuring $+10\%$ or $+₹2,500$ annual escalation.
    *   `components/DunningStatusAlert.tsx`: Warning display for mandates in retry/backoff.
6.  **`features/calculators/`**:
    *   `pages/CalculatorsPage.tsx`: Hub for standalone quantitative financial calculators.
    *   `components/XIRRCalculatorWidget.tsx`: Interactive cashflow builder computing exact XIRR.
    *   `components/StepUpSIPCalculatorWidget.tsx`: Compares standard SIP vs. Step-Up SIP future wealth.
    *   `components/FIRECalculatorWidget.tsx`: Financial Independence, Retire Early corpus planner.
7.  **`features/tax-harvesting/`**:
    *   `pages/TaxHarvestingPage.tsx`: Tax planning and loss-harvesting command center.
    *   `components/TaxLotsTable.tsx`: FIFO lot ledger displaying purchase date, remaining units, and unrealized gain/loss.
    *   `components/HarvestOpportunityCard.tsx`: Highlights potential tax savings achievable before March 31.
    *   `components/WashSaleWarningDialog.tsx`: Prevents repurchase of the same ISIN within 3 business days.
8.  **`features/ledger/`**:
    *   `pages/LedgerPage.tsx`: Audit-grade double-entry account ledger statement.
    *   `components/LedgerStatementTable.tsx`: Displays balanced Debit and Credit legs with transaction reference IDs.
    *   `components/ExportStatementButton.tsx`: Generates signed PDF/CSV statement downloads.
9.  **`features/kyc/`**:
    *   `pages/KycPage.tsx`: Guided onboarding state machine wizard.
    *   `components/DocumentUploadStep.tsx`: Encrypted Aadhaar & PAN upload zone.
    *   `components/PennyDropVerificationStep.tsx`: Real-time IMPS penny-drop test with name similarity feedback.
10. **`features/admin/`**:
    *   `pages/MakerCheckerPage.tsx`: Approval queue for high-value withdrawals, bank changes, and catalog updates.
    *   `pages/AdminCatalogPage.tsx`: Add/edit mutual funds, update expense ratios, trigger NAV fetch.
    *   `pages/AdminSettlementsPage.tsx`: BSE StAR settlement file reconciliation and discrepancy auditing.

---

### 3.2 Shared Component & Design System Architecture (`frontend/src/components/`)

```
frontend/src/components/
├── charts/
│   ├── AreaBenchmarkChart.tsx      # TradingView Lightweight Charts canvas wrapper
│   ├── GlidepathAreaChart.tsx      # Recharts/Canvas dynamic equity-to-debt glidepath
│   └── MonteCarloFanChart.tsx      # Multi-line shaded percentile area chart (P10, P50, P90)
├── layout/
│   ├── AdminLayout.tsx             # Institutional admin shell with dual-control notification badges
│   ├── AppLayout.tsx               # Primary investor shell with sidebar, topbar, and real-time alerts
│   ├── Header.tsx                  # Global navbar with live connectivity indicator & profile menu
│   └── Sidebar.tsx                 # Navigation links, dark mode toggle, and KYC badge
└── ui/                             # Radix UI + Tailwind CSS Design System Primitives
    ├── Alert.tsx                   # Informational, warning, error banner notifications
    ├── Badge.tsx                   # Risk profile badges (Conservative, Moderate, Aggressive)
    ├── Button.tsx                  # Primary, secondary, outline, destructive, and loading states
    ├── Card.tsx                    # Surface card with border and elevation tokens
    ├── Dialog.tsx                  # Modal dialog primitive with focus-trapping
    ├── Drawer.tsx                  # Slide-over panel for complex forms (e.g., Step-Up setup)
    ├── DropdownMenu.tsx            # Context menus and profile actions
    ├── Input.tsx                   # Form input with floating label, validation error, and prefix
    ├── LoadingSpinner.tsx          # Institutional animated loading indicator
    ├── Table.tsx                   # Accessible, high-density financial data table
    ├── Tabs.tsx                    # Accessible tab strip
    └── Toast.tsx                   # Ephemeral toast notifications triggered by WebSocket events
```

---

## 4. Infrastructure, Containers & Deployment Orchestration

### 4.1 Production Containerization (`docker/`)
*   **`Dockerfile.backend`**: Multi-stage build based on `node:22-alpine`. Stage 1 compiles TypeScript using `tsc`. Stage 2 packages production dependencies (`npm ci --only=production`), discarding build tools and reducing image size to $< 120\text{ MB}$. Executes under non-root user `node`.
*   **`Dockerfile.frontend`**: Multi-stage build based on `node:22-alpine` and `nginx:1.27-alpine-slim`. Stage 1 builds the Vite bundle (`npm run build`). Stage 2 copies assets into NGINX with custom `nginx.conf` enforcing HSTS, Content Security Policy (CSP), brotli/gzip compression, and SPA HTML5 routing fallback.
*   **`docker-compose.yml`**: Defines the local multi-container development environment:
    *   `api-gateway`: Express API service (Port 5000).
    *   `worker-fleet`: BullMQ asynchronous job processor.
    *   `mongo-replica`: MongoDB 8.0 configured with single-node replica set (`rs0`) to enable multi-document ACID transactions.
    *   `redis-cluster`: Redis 7.2 for caching, idempotency, and Pub/Sub.
    *   `frontend`: Vite development server (Port 5173).

### 4.2 Automated CI/CD Pipelines (`.github/workflows/`)
1.  **`backend-ci.yml`**:
    *   Triggers on pull requests affecting `backend/**`.
    *   Executes: ESLint AST rules, TypeScript compilation check (`tsc --noEmit`), unit tests for financial math, and integration tests with an ephemeral MongoDB replica set.
2.  **`frontend-ci.yml`**:
    *   Triggers on pull requests affecting `frontend/**`.
    *   Executes: ESLint, TypeScript check, Vitest component tests, and Vite production bundle build with size-limit assertion ($< 350\text{ KB}$ initial JS chunk).
3.  **`deploy-staging.yml`**:
    *   Triggers on merge to `main`.
    *   Builds Docker containers, signs images with Cosign, runs automated database migration scripts, and deploys to staging infrastructure.

---

*End of Production File Structure & Module Responsibility Guide (FILE_STRUCTURE.md)*

