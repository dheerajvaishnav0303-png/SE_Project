# Product Requirements Document (PRD)
## Institutional Wealth Management & Investment Advisory Platform (IPS v2.0)

**Document Version:** `2.0.0-PROD`  
**Classification:** Institutional Confidential / Internal Engineering & Product  
**Status:** Approved for Implementation  
**Product Leadership:** Principal Fintech Product Architect  
**Quantitative Architecture:** Staff Quantitative Engineer  
**Security & Compliance:** Head of Regulatory Compliance & InfoSec  
**Target Delivery Window:** Q1–Q3 2027  

---

## 1. Executive Summary & Problem Statement

### 1.1 Context & Background
The legacy Investment Planner System (IPS v1.0) was conceived as a monolithic React and Express prototype. The application state and user flows were concentrated within two monolithic, brittle frontend files:
*   `UserPortal.jsx` (~2,807 lines of code): Mixed presentation, financial math, domestic state mutations, and unencrypted local storage persistence.
*   `AdminPortal.jsx` (~2,573 lines of code): Clustered user management, unverified product updates, manual catalog uploads, and single-signature approvals.

While functionally sufficient for early proof-of-concept validation, IPS v1.0 possesses critical architectural vulnerabilities and analytical shortcomings that prohibit commercial institutional deployment:
1.  **Naive Return Computations**: Returns were derived via static absolute calculations (`(currentValue - investedAmount) / investedAmount`), misrepresenting investor yields by ignoring cashflow timing, holding periods, split dividends, and capital inflows/outflows.
2.  **Insecure Authentication & Session Management**: Authentication relied on raw JSON Web Tokens (JWTs) persisted in browser `localStorage`, exposing client sessions to Cross-Site Scripting (XSS) exfiltration.
3.  **Absence of Institutional Controls**: Lack of dual-control (Maker-Checker) workflows permitted unauthorized single-point asset catalog publishing and high-value balance redemptions.
4.  **Static, Non-Predictive Goal Planning**: Financial goals were calculated using static linear projections without category-specific inflation indexation, automated equity-to-debt glidepath de-risking, or stochastic probability modeling.
5.  **Tax Inefficiency**: Tax liabilities were calculated generically at redemption without First-In, First-Out (FIFO) lot tracking, eliminating opportunities for Tax-Loss Harvesting (TLH).

### 1.2 The IPS v2.0 Vision
IPS v2.0 transitions the platform into a production-grade, bank-grade Wealth Management and Quantitative Advisory Engine. IPS v2.0 caters to retail accumulators, High-Net-Worth Individuals (HNIs), Registered Investment Advisors (RIAs), and institutional compliance officers. It introduces exact mathematical precision (XIRR via Newton-Raphson, daily Time-Weighted Return), automated Step-Up Systematic Investment Plans (SIPs), Monte Carlo goal simulation, First-In, First-Out (FIFO) tax lot harvesting, look-through portfolio X-Rays, automated allocation rebalancing, and a strict Maker-Checker governance framework.

---

## 2. Competitive Intelligence & Benchmark Synthesis

To design an industry-leading wealth engine, we benchmarked the core mechanics, quantitative engines, and operational workflows across 12 institutional and retail platforms.

| # | Platform | Core Architecture Benchmark | Key Mechanics Analyzed | IPS v2.0 Synthesis & Feature Adoption |
|---|---|---|---|---|
| **1** | **Zerodha Coin & Kite** | Direct Mutual Fund clearing & high-throughput trading ledger. | Direct settlement via clearing houses (BSE StAR MF / ICCL); clean ledger statements; portfolio X-Ray integrations; Demat-mode MF allocation. | Demat/Physical dual-ledger support; direct-plan expense ratio optimization; automated contract note ingestion and transaction reconciliation. |
| **2** | **Groww** | Frictionless retail onboarding & automated mandate lifecycles. | One-click UPI Autopay / eNACH mandate setup; interactive step-up SIP calculators; zero-friction activation. | Multi-tier mandate lifecycle engine (eNACH, UPI Autopay) with annual step-up triggers and automated mandate limit escalation. |
| **3** | **Kuvera** | Tax optimization & family wealth consolidation. | Automated Tax-Loss Harvesting (TradeSmart); multi-account family pooling; capital gains tax statements (STCG vs. LTCG). | Native FIFO tax-lot engine; unrealized tax-loss identification scanner; tax-loss harvesting execution module; consolidated family net worth. |
| **4** | **INDmoney** | Holistic net worth aggregation & liability tracking. | Automated statement parsers (CAS, NSDL/CDSL); cross-asset tracking (stocks, fixed deposits, real estate, liabilities); US fractional equities. | External holding consolidation via Account Aggregator (AA) and CAS PDF parsing; automated debt-to-equity and net-worth solvency tracking. |
| **5** | **Smallcase** | Thematic basket investing & rule-based rebalancing. | Proprietary thematic weighting; scheduled rebalancing triggers; fractional share execution; model portfolio subscription. | Custom thematic basket creation; automated rebalancing triggers when asset/sector allocations drift beyond permissible bands. |
| **6** | **Morningstar Investor** | Institutional analytics & Portfolio X-Ray. | 3x3 Style Box (Size vs. Value/Growth); underlying equity/debt holding overlap detection; risk-adjusted metrics (Sharpe, Sortino, Treynor, Alpha, Beta). | Look-through portfolio overlap analysis; Morningstar-style 9-box style grid; systematic risk and factor exposure decomposition. |
| **7** | **Wealthfront** | Automated algorithmic wealth & tax-minimized glidepaths. | Passive index glidepaths; direct indexing; tax-optimized cash drag minimization; automated emergency fund sweeps. | Dynamic Goal Glidepath engine that programmatically shifts equity to fixed income as maturity approaches; smart cash sweep automation. |
| **8** | **Betterment** | Goal-based bucketing & drift rebalancing. | Separate investment buckets per goal; automated drift detection with threshold-based rebalancing alerts. | Multi-goal isolation (e.g., Retirement, Child Education, Real Estate Downpayment); drift triggers (>5% deviation) initiating rebalance plans. |
| **9** | **Interactive Brokers (PortfolioAnalyst)** | Institutional performance attribution & reporting. | Exact Money-Weighted Return (MWR/XIRR) vs. Time-Weighted Return (TWR); Brinson-Fachler asset allocation attribution. | Dual-return reporting: TWR to evaluate pure asset selection (eliminating cashflow timing bias) and XIRR to evaluate investor timing efficiency. |
| **10** | **Vanguard Personal Advisor** | Hybrid advisory & stochastic retirement projections. | Fat-tailed Monte Carlo retirement forecasting; fee drag transparency calculators; advisor collaboration consoles. | 1,000-run Monte Carlo simulation for financial goals showing P10, P50, and P90 probability bands; total cost of ownership (TER drag) analytics. |
| **11** | **Kubera** | Multi-currency balance sheet & digital asset legacy transmission. | Global multi-currency tracking; digital asset support; "Life-Beat" dead-man's switch with automated nominee transmission. | Multi-currency base conversion; automated beneficiary data-room dispatch upon prolonged account inactivity. |
| **12** | **TradingView** | High-performance client-side time-series visualization. | Lightweight canvas/WebGL charting; normalized benchmark overlays (NIFTY 50 TRI, S&P 500); rolling alpha/beta overlays. | TradingView Lightweight Charts integration; base-100 normalized portfolio vs. benchmark comparative performance tracking. |

---

## 3. User Personas & Journey Maps

### 3.1 Primary Personas

```
+----------------------------------------------------------------------------------------------------+
|                                    IPS v2.0 USER PERSONAS                                          |
+------------------------------------+----------------------------------+----------------------------+
| 1. Rahul Sharma (Retail Investor)  | 2. Dr. Priya Iyer (HNI Investor) | 3. Vikram Malhotra (Admin) |
| Age: 29 | Tier: Standard Wealth    | Age: 47 | Tier: HNI Wealth       | Role: Compliance & Ops     |
| Goal: Systematic Wealth Creation   | Goal: Capital Preservation & Tax | Goal: Risk & AML Oversight |
| Focus: Step-Up SIPs, Goals         | Focus: TLH, Overlap, X-Ray       | Focus: Maker-Checker, KYC  |
+------------------------------------+----------------------------------+----------------------------+
```

#### Persona 1: The Disciplined Retail Accumulator (Rahul Sharma)
*   **Demographics:** 29 years old, Senior Software Engineer, Bengaluru, India.
*   **AUM:** ₹18,50,000 across mutual funds, equity baskets, and emergency liquid funds.
*   **Behaviors & Goals:** Invests ₹60,000/month across three SIPs. Receives annual 12% salary increments and seeks automated Step-Up SIPs to eliminate manual mandate modifications. Tracks two long-term goals: Retirement (target 2045) and Child Education (target 2038).
*   **Pain Points with v1.0:** Misleading absolute percentage returns; inability to schedule annual SIP escalations; no visibility into whether market drops threaten goal timelines.

#### Persona 2: The Tax-Conscious High-Net-Worth Investor (Dr. Priya Iyer)
*   **Demographics:** 47 years old, Chief Medical Officer, Mumbai, India.
*   **AUM:** ₹4,80,00,000 distributed across direct equities, active mutual funds, debt funds, and sovereign gold bonds.
*   **Behaviors & Goals:** Maximizes risk-adjusted post-tax alpha. Needs to harvest short-term and long-term capital losses prior to March 31 to offset capital gains. Requires deep look-through analysis to prevent duplicate exposure across multiple fund managers holding identical mega-cap stocks.
*   **Pain Points with v1.0:** Static valuations; zero visibility into tax lots; severe hidden portfolio overlap (e.g., holding Reliance Industries across 4 separate funds); no risk-adjusted ratios (Sharpe, Sortino).

#### Persona 3: The Institutional Compliance & Operations Officer (Vikram Malhotra)
*   **Demographics:** 52 years old, Chief Risk & Compliance Officer, Mumbai, India.
*   **Responsibility:** Regulatory adherence (SEBI / PMLA guidelines), audit trails, anti-money laundering (AML), and operational risk mitigation.
*   **Behaviors & Goals:** Mandates that no catalog modification, fund categorization change, or withdrawal exceeding ₹5,00,000 can execute without independent verification (Dual-Control / Maker-Checker). Requires automated KYC audit trails.
*   **Pain Points with v1.0:** Insecure single-admin override architecture; absence of state machine governance; zero tamper-evident audit logs.

---

## 4. True Portfolio Performance Engine

### 4.1 Fallacy of Naive Absolute Return
The legacy system calculated returns using:
$$\text{Return}_{\text{legacy}} = \frac{V_{\text{current}} - \sum C_{\text{in}}}{\sum C_{\text{in}}}$$
This formulation is critically flawed for wealth management:
*   It assumes all cashflows entered at $T_0$, ignoring capital deployed recently.
*   A recent ₹5,00,000 deposit into a ₹10,00,000 portfolio artificially depresses the reported return percentage, even if all underlying assets gained 20%.
*   It cannot evaluate fund manager alpha independent of investor deposit timing.

### 4.2 Mathematical Specifications: Return Models

```
+----------------------------------------------------------------------------------------------------+
|                                    IPS RETURN METHODOLOGIES                                        |
+----------------------------------------------------+-----------------------------------------------+
| Money-Weighted Return (MWR / XIRR)                 | Time-Weighted Return (TWR)                    |
| Evaluates Investor Timing Efficiency               | Evaluates Portfolio / Asset Selection         |
| Solves internal discount rate via Newton-Raphson   | Multiplies sub-period holding returns         |
| Cashflow-dependent                                 | Cashflow-independent                          |
+----------------------------------------------------+-----------------------------------------------+
```

#### 4.2.1 Money-Weighted Return: Extended Internal Rate of Return (XIRR)
XIRR represents the annualized internal rate of return that equates the present value of all cashflows (inflows, outflows, redemptions, dividend payouts) to the current portfolio terminal valuation.

Given a sequence of $n$ cashflows, where $C_i$ occurs on date $d_i$, $C_0$ is the initial cashflow on date $d_0$, and the terminal portfolio value $V(d_n)$ is treated as an outflow $-C_n$ on current date $d_n$:

$$\sum_{i=0}^n \frac{C_i}{(1 + r)^{\frac{d_i - d_0}{365}}} = 0$$

*   **Numerical Solver Engine**: Solved using the **Newton-Raphson iteration**:
    $$r_{k+1} = r_k - \frac{f(r_k)}{f'(r_k)}$$
    Where:
    $$f(r) = \sum_{i=0}^n C_i (1 + r)^{-\frac{d_i - d_0}{365}}$$
    $$f'(r) = \sum_{i=0}^n -\left(\frac{d_i - d_0}{365}\right) C_i (1 + r)^{-\left(\frac{d_i - d_0}{365} + 1\right)}$$
*   **Convergence Criteria**: $\epsilon < 10^{-7}$ or maximum 100 iterations.
*   **Robust Fallback**: If $f'(r_k) \approx 0$ or Newton-Raphson diverges, the engine falls back automatically to **Brent's Method / Bisection** bounded within $[-0.9999, 10.0]$ (i.e., -99.99% to +1000%).

#### 4.2.2 Time-Weighted Return (TWR)
TWR measures the compound rate of growth of a portfolio over a specified horizon by breaking the horizon into discrete sub-periods whenever an external cashflow occurs, thereby eliminating the distorting effects of cashflow timing.

For $m$ sub-periods defined by cashflow events $t_1, t_2, \dots, t_m$:
$$\text{TWR} = \left[ \prod_{j=1}^m (1 + R_j) \right] - 1$$
Where the return in sub-period $j$ is:
$$R_j = \frac{V_j - (V_{j-1} + C_j)}{V_{j-1} + C_j}$$
*(Where $V_j$ is the portfolio valuation immediately before the cashflow $C_{j+1}$, and $C_j$ is the cashflow entering at the beginning of sub-period $j$).*

#### 4.2.3 Compounded Annual Growth Rate (CAGR)
CAGR is restricted strictly to multi-year point-to-point lump-sum allocations where no intermediate cashflows occurred:
$$\text{CAGR} = \left( \frac{V_{\text{final}}}{V_{\text{initial}}} \right)^{\frac{365}{d_{\text{final}} - d_{\text{initial}}}} - 1$$
*Constraint: Displayed only for individual asset lots or non-transacted lump-sum portfolios holding duration $> 365$ days.*

### 4.3 Benchmark Comparison & Overlay Analytics
*   **Normalized Comparative Indexing**: Portfolio NAV and Benchmark NAV (NIFTY 50 Total Return Index [TRI], NIFTY 500 TRI, or S&P 500 TRI) are rebased to $100.00$ at $t = t_0$.
*   **Alpha ($\alpha$)**: Excess return generated over the benchmark:
    $$\alpha = R_{\text{portfolio}} - [R_f + \beta (R_{\text{benchmark}} - R_f)]$$
*   **Beta ($\beta$)**: Sensitivity of portfolio returns relative to benchmark returns:
    $$\beta = \frac{\text{Cov}(R_p, R_b)}{\text{Var}(R_b)}$$
*   **Tracking Error (TE)**: Standard deviation of excess return differences:
    $$\text{TE} = \sqrt{\frac{1}{N-1} \sum_{t=1}^N (R_{p,t} - R_{b,t} - \overline{R_{p} - R_{b}})^2} \times \sqrt{252}$$

---

## 5. Advanced SIP & Goal Wealth Engine

```
+----------------------------------------------------------------------------------------------------+
|                                  ADVANCED SIP & GOAL WEALTH PIPELINE                               |
+----------------------------------------------------+-----------------------------------------------+
| Step-Up SIP Execution Architecture                 | Dynamic Goal Glidepath & Monte Carlo          |
| * Base SIP + Annual Escalation (Fixed or %)        | * Sector-Specific Inflation Calibration       |
| * UPI / eNACH Mandate Auto-Management              | * 1,000-Run Geometric Brownian Motion         |
| * Dunning & Auto-Retry Logic                       | * Algorithmic De-Risking (Equity -> Debt)     |
+----------------------------------------------------+-----------------------------------------------+
```

### 5.1 Step-Up Systematic Investment Plans (SIPs)

#### 5.1.1 Step-Up Modes
1.  **Percentage Step-Up**: Monthly SIP installment increases by a fixed percentage (e.g., $10\%$) every 12 months.
2.  **Fixed Currency Step-Up**: Monthly SIP installment increases by an absolute amount (e.g., $+₹2,500$ or $+\$100$) every 12 months.
3.  **Semi-Annual vs. Annual Cadence**: Configurable frequency of step-up triggers.

#### 5.1.2 Closed-Form Mathematical Formulation
Let $P_0$ be the initial monthly installment, $g$ be the annual step-up rate, $r$ be the expected annual rate of return, $i = \frac{r}{12}$ be the monthly rate of return, and $N$ be the total investment duration in years ($12N$ months).

The terminal future value $FV$ is computed by summing the compounded values across all years $y \in [1, N]$:
$$FV = \sum_{y=1}^N P_0 (1 + g)^{y-1} \sum_{m=1}^{12} (1 + i)^{12(N - y) + (13 - m)}$$

Utilizing geometric progression summation:
$$FV = \sum_{y=1}^N \left[ P_0 (1 + g)^{y-1} \cdot (1 + i) \cdot \frac{(1 + i)^{12} - 1}{i} \cdot (1 + i)^{12(N - y)} \right]$$

#### 5.1.3 Mandate Lifecycle & Execution Constraints
*   **Mandate Authorization Limit**: eNACH / UPI Autopay mandates must be established at the **Terminal Maximum Cap**, not the initial installment $P_0$, preventing premature mandate failure in year 3 or 4.
*   **Escalation Warning**: An automated notification is triggered via Email/SMS/Webhook 10 calendar days prior to the step-up installment execution date.
*   **Pause & Skip State Machine**: Users may pause step-ups for a maximum of 3 billing cycles without canceling the underlying primary SIP mandate.

### 5.2 Dynamic Inflation-Adjusted Goal Glidepaths

#### 5.2.1 Sector-Specific Inflation Indexation
Conventional retirement calculators erroneously apply a flat CPI (e.g., 6.0%) across all objectives. IPS v2.0 implements sector-differentiated forward inflation parameters:

| Goal Category | Default Annual Inflation ($\pi$) | Volatility Class | Horizon Horizon Band |
|---|---|---|---|
| **Undergraduate Education (Domestic)** | 8.5% | Moderate | 5 – 15 Years |
| **Overseas Higher Education** | 10.5% (Includes Currency Depreciation) | High | 3 – 12 Years |
| **Healthcare / Medical Contingency** | 9.0% | Low | Ongoing |
| **Residential Real Estate Downpayment** | 7.5% | Moderate | 3 – 7 Years |
| **Retirement Living Expenses** | 6.0% (Headline CPI Baseline) | Conservative | 15 – 35 Years |
| **Discretionary Luxury / Travel** | 5.5% | High | 1 – 3 Years |

**Target Corpus Equation**:
$$C_{\text{target}}(T) = C_{\text{current}} \times (1 + \pi)^T$$
*(Where $T$ is the time horizon in years).*

#### 5.2.2 Algorithmic Asset De-Risking Glidepath
To insulate investors against sequence-of-returns risk, IPS v2.0 enforces automated, rule-based portfolio transition from growth-oriented equities to capital-preserving fixed income:

```
Allocation %
100% +---------------------------------------------+
     |                 [ EQUITY ]                  |
 75% |              (Gradual De-Risk)              |
     |                                             |
 50% |.............................................|
     |                                 [ DEBT ]    |
 25% |                           (Capital Preserv.)|
     |                                             |
  0% +-----+-----+-----+-----+-----+-----+-----+---+
    T-15  T-12  T-10   T-7   T-5   T-3   T-1   T=0  (Years to Target)
```

$$\text{Weight}_{\text{Equity}}(t) = 
\begin{cases} 
85\% & \text{for } t > 10 \text{ years to target} \\
85\% - \left(\frac{10 - t}{10}\right) \times 70\% & \text{for } 1 \le t \le 10 \text{ years} \\
15\% & \text{for } t < 1 \text{ year (Liquidity Preservation)}
\end{cases}$$

$$\text{Weight}_{\text{Debt/Cash}}(t) = 100\% - \text{Weight}_{\text{Equity}}(t)$$

### 5.3 Monte Carlo Goal Probability Simulation Engine
*   **Algorithm**: 1,000 discrete simulation paths generated using **Geometric Brownian Motion (GBM)** with drift and stochastic volatility:
    $$S_{t + \Delta t} = S_t \exp\left( \left(\mu - \frac{1}{2}\sigma^2\right)\Delta t + \sigma \sqrt{\Delta t} Z \right) + \text{Cashflow}_{t}$$
    Where $Z \sim \mathcal{N}(0, 1)$ via Box-Muller transformation.
*   **Output Metrics**:
    *   **P90 (Conservative / Downside)**: 90th percentile likelihood (only 10% of simulation outcomes were worse).
    *   **P50 (Median)**: Expected median wealth trajectory.
    *   **P10 (Optimistic / Upside)**: 10th percentile top outcome.
*   **Goal Health Status Classification**:
    *   **On Track (Green)**: Probability of achieving target $P(V_T \ge C_{\text{target}}) \ge 80\%$.
    *   **Attention Required (Amber)**: $50\% \le P(V_T \ge C_{\text{target}}) < 80\%$. Recommends step-up delta.
    *   **Critical Deficit (Red)**: $P(V_T \ge C_{\text{target}}) < 50\%$. Triggers mandatory recalculation wizard.

---

## 6. Portfolio X-Ray, Tax & Risk Analytics

### 6.1 Tax-Loss Harvesting & Capital Gains Engine

```
+----------------------------------------------------------------------------------------------------+
|                                    FIFO TAX LOT MATCHING ENGINE                                    |
+---------------------+-------------------+---------------------+------------------------------------+
| Ingestion Phase     | Realization Phase | Classification      | Harvesting Optimization            |
| Purchase Lot Ledger | Redemption Event  | STCG vs. LTCG       | Identify Unrealized Losses         |
| Units, NAV, Date    | FIFO Consumption  | Equity vs. Debt Tax | Offset Realized Gains Prior to FYE |
+---------------------+-------------------+---------------------+------------------------------------+
```

#### 6.1.1 First-In, First-Out (FIFO) Lot Accounting
Every buy transaction or reinvested distribution creates a dedicated, immutable `TaxLot` record containing:
*   `lotId`: Cryptographic identifier.
*   `purchaseDate`: Exact clearing timestamp.
*   `costBasisNAV`: Execution purchase NAV in Decimal128.
*   `originalUnits`: Initial units allocated.
*   `remainingUnits`: Unredeemed units available.

Upon redemption of $U_{\text{redeem}}$ units:
1.  Query the earliest available `TaxLot` where `remainingUnits > 0` ordered by `purchaseDate ASC`.
2.  Consume units sequentially. If a lot is partially depleted, split the lot into consumed units and active residual units.
3.  Compute realized gain per lot:
    $$\text{Gain}_k = U_k \times (\text{NAV}_{\text{exit}} - \text{NAV}_{\text{purchase}, k}) - \text{ExitLoad}_k - \text{STT}_k$$

#### 6.1.2 Statutory Tax Classification (Finance Act Rules)
*   **Listed Equity & Equity Mutual Funds**:
    *   Holding Period $\le 365$ days: **Short-Term Capital Gain (STCG)** taxed at $20.0\%$.
    *   Holding Period $> 365$ days: **Long-Term Capital Gain (LTCG)** taxed at $12.5\%$ (with statutory ₹1,25,000 annual exemption limit factored into post-tax net yield).
*   **Debt & Unlisted Securities**:
    *   Taxed at marginal income slab rate without indexation.

#### 6.1.3 Tax-Loss Harvesting (TLH) Opportunity Scanner
The system evaluates all active tax lots daily at post-market NAV close ($T+0$ 21:00 IST).
*   **Harvesting Condition**: Any lot where $\text{NAV}_{\text{current}} < \text{NAV}_{\text{purchase}}$ exhibits an unrealized capital loss.
*   **Net Tax Optimization Logic**:
    $$\text{Potential Tax Savings} = (\text{Unrealized STCL} \times 0.20) + (\text{Unrealized LTCL} \times 0.125)$$
*   **Wash-Sale Guard**: To prevent tax-avoidance penalties, the re-investment engine forbids buying back the identical ISIN within 3 business days, recommending direct replacement into an equivalent correlated index or category peer (e.g., selling Fund A [NIFTY 50 ETF] and deploying into Fund B [BSE SENSEX ETF]).

### 6.2 Look-Through Asset Overlap & Rebalancing Drift

#### 6.2.1 Look-Through Holding Decomposition
Retail investors frequently own 5–10 mutual funds believing they are diversified, while all 10 funds hold heavy top-10 positions in the same companies.
*   **Holding Overlap Coefficient**: For two funds $A$ and $B$ containing security weights $w_{i,A}$ and $w_{i,B}$ across $K$ unique securities:
    $$\text{Overlap}(A, B) = \sum_{i=1}^K \min(w_{i,A}, w_{i,B})$$
*   **Portfolio Overlap Matrix**: Dynamic $M \times M$ matrix showing pairwise redundancy across all client holdings.

#### 6.2.2 Asset Allocation Drift Detection
Investors are assigned a calibrated target allocation based on their psychometric and financial `RiskProfile`:

```
Target vs. Actual Asset Allocation Drift
[Equity Large]  Target: 40%  | Actual: 48%  [+8% DRIFT WARNING]
[Equity Mid]    Target: 20%  | Actual: 21%  [+1%]
[Equity Small]  Target: 10%  | Actual: 8%   [-2%]
[Fixed Income]  Target: 25%  | Actual: 18%  [-7% DRIFT WARNING]
[Gold/Commod.]  Target:  5%  | Actual:  5%  [ 0%]
```

*   **Drift Trigger Threshold**: Any primary asset class deviating $> 5.0\%$ absolute from target triggers an **Allocation Drift Alert**.
*   **Tax-Smart Rebalance Planner**: Generates rebalancing proposals using a prioritized cashflow sequence:
    1.  *Tier 1 (Cashflow Re-routing)*: Route upcoming SIP installments and dividend payouts exclusively to underweight asset classes.
    2.  *Tier 2 (Loss/Exempt Realization)*: Liquidate overweight holdings that qualify for tax-loss harvesting or fall under the ₹1,25,000 LTCG exemption.
    3.  *Tier 3 (Active Sale)*: Liquidate long-term lots before short-term lots to minimize the client's tax bill.

---

## 7. Institutional Governance, Compliance & KYC Suite

### 7.1 Maker-Checker Workflow Architecture
Under SOC-2 Type II, ISO 27001, and financial regulatory requirements, no privileged operational change or high-value monetary movement may be executed by a single operator.

```
Maker-Checker Dual Control State Machine
+-----------+    Maker Submits     +-----------+
|   DRAFT   | -------------------> |  PENDING  |
+-----------+                      +-----------+
                                         |
                       +-----------------+-----------------+
                       |                                   |
              Checker Approves                    Checker Rejects
                       |                                   |
                       v                                   v
               +---------------+                   +---------------+
               |   APPROVED    |                   |   REJECTED    |
               +---------------+                   +---------------+
                       |
               System Dispatches
                       |
                       v
               +---------------+
               |   EXECUTED    |
               +---------------+
```

#### 7.1.1 Controlled Operations Matrix
The following actions strictly mandate dual-control authorization:
1.  **Catalog Publication**: Adding new mutual funds, modifying expense ratios, altering NAV calculation rules, or updating scheme risk categorizations.
2.  **High-Value Redemptions**: Any manual redemption or withdrawal request exceeding ₹5,00,000 ($10,000 USD equivalent).
3.  **Bank Account Modifications**: Updating an active client's linked settlement IFSC / Account Number.
4.  **KYC Override**: Manual approval of flagged or partially matched KYC documents.
5.  **Fee / Commission Restructuring**: Altering advisory fee percentages or client fee tiers.

#### 7.1.2 Segregation of Duties Rules
*   The `Checker` must have the `ROLE_COMPLIANCE_CHECKER` role.
*   The `Checker` cannot be the same individual as the `Maker` (`makerId != checkerId`).
*   Every proposal contains a 24-hour expiration TTL. If unreviewed, it lapses to `EXPIRED`.
*   Every action requires an immutable cryptographic HMAC signature appended to the audit ledger.

### 7.2 End-to-End KYC/KYB Onboarding State Machine

```
Detailed KYC Verification Pipeline
[UNVERIFIED]
     | User inputs PAN + DOB
     v
[PENDING_DOCS]
     | Uploads Aadhaar Front/Back + CKYC Lookup
     v
[DOCS_UPLOADED]
     | NSDL PAN & CKYC API Return Match
     v
[PENNY_DROP_INITIATED]
     | Instant ₹1.00 IMPS transferred to user bank
     v
[PENNY_DROP_VERIFIED]
     | Reverse Penny Drop Name Match (Levenshtein >= 85%)
     v
[AML_SCREENED]
     | Automated PEP (Politically Exposed Persons) & Sanctions Check
     v
[ACTIVE]
```

#### 7.2.1 State Definitions & Validation Gates
1.  `UNVERIFIED`: Initial account creation state. Zero investment or transaction capabilities allowed.
2.  `PENDING_DOCS`: User provided demographic metadata; system awaits PAN card and identity document uploads.
3.  `DOCS_UPLOADED`: Documents securely persisted in encrypted S3-compatible storage. Automated OCR extract validates PAN name against user input.
4.  `PENNY_DROP_INITIATED`: Banking validation engine dispatches ₹1.00 via IMPS to the user's provided account.
5.  `PENNY_DROP_VERIFIED`: Webhook confirms credit. The registered account holder name returned by the bank is compared with the KYC document name using **Fuzzy Jaro-Winkler & Levenshtein String Distance**:
    $$\text{Score} = \text{Similarity}(\text{Name}_{\text{Bank}}, \text{Name}_{\text{PAN}}) \ge 0.85$$
    *(If Score $< 0.85$, account transitions to `MANUAL_REVIEW_REQUIRED` for Maker-Checker inspection).*
6.  `AML_SCREENED`: Automated screening against global sanctions lists (OFAC, UN, FATF) and Politically Exposed Persons (PEP) databases.
7.  `ACTIVE`: User granted full access to execute transactions and bind SIP mandates.
8.  `SUSPENDED`: Triggered automatically upon suspicious activity detection, sanction update, or court-ordered compliance hold.

---

## 8. Operational Workflows, Acceptance Criteria & Edge Cases

### 8.1 Market Holidays & NAV Cutoff Time Rules
Mutual fund order execution is governed by statutory cut-off schedules.

| Asset Class | Cut-Off Time (IST) | Applicable NAV Rule | Real-Time Execution Logic |
|---|---|---|---|
| **Liquid / Overnight Funds** | 13:30:00 IST | Same Day ($T+0$) Historic NAV (Previous Business Day Closing NAV) | Orders received at 13:30:01 transition to Next Business Day ($T+1$). |
| **Equity Funds (Lump-Sum & SIP)** | 14:59:59 IST | Same Day ($T+0$) Closing NAV | Orders received at 15:00:00 IST receive $T+1$ Business Day Closing NAV. |
| **Debt Funds (Non-Liquid)** | 14:59:59 IST | Same Day ($T+0$) Closing NAV | Requires realization of funds in clearing account prior to cut-off. |
| **Redemptions (All Schemes)** | 14:59:59 IST | Same Day ($T+0$) Closing NAV | Settlement dispatch $T+2$ for Equity, $T+1$ for Liquid. |

*   **Trading Holiday Calendar Engine**: Orders placed on Saturdays, Sundays, or exchange holidays (NSE/BSE recognized) automatically queue with status `SCHEDULED_FOR_NEXT_BUSINESS_DAY`.
*   **System Clock Verification**: API gateway synchronizes clock time using Network Time Protocol (NTP) with max drift tolerance $< 50\text{ ms}$.

### 8.2 Failed SIP Debits & Mandate Recovery (Dunning)
When a scheduled SIP recurring debit fails due to insufficient funds or technical bank rejection:
1.  **Event Ingestion**: Bank webhook delivers `MANDATE_DEBIT_FAILED` event.
2.  **State Transition**: SIP installment marked `FAILED_RETRY_PENDING`.
3.  **Dunning Execution Schedule**:
    *   *Retry 1*: Scheduled at $T + 48\text{ hours}$ (10:00 IST).
    *   *Retry 2*: Scheduled at $T + 96\text{ hours}$ (14:00 IST).
4.  **Auto-Pause Guard**: If three consecutive monthly SIP debits fail, the `SIPMandate` transitions automatically to `AUTO_PAUSED`, triggering customer notifications and preventing bank penalty levies.

### 8.3 Partial Redemptions, Exit Loads & Lock-In Constraints
*   **ELSS (Equity Linked Savings Scheme)**: Strict statutory **3-Year Lock-In** calculated on a per-installment basis. In a monthly SIP, units purchased on March 15, 2024, unlock on March 15, 2027; units purchased on April 15, 2024, remain locked until April 15, 2027.
*   **Dynamic Exit Load Engine**:
    *   Redemption within 365 days: $1.0\%$ exit load deducted from gross redemption value.
    *   Redemption after 365 days: $0.0\%$ exit load.
    *   Exit load amount calculated against exact lot age:
        $$\text{Net Proceeds} = U_{\text{redeem}} \times \text{NAV}_{\text{exit}} \times (1 - \text{ExitLoadRate})$$

### 8.4 Concurrent Ledger Transactions & Double-Spend Prevention
*   **Distributed Lock Isolation**: A customer cannot initiate two concurrent redemptions against the identical portfolio or tax lot.
*   **Idempotent Execution**: Every financial order requires an `Idempotency-Key` header (UUIDv4). Replays within 24 hours return the cached response.
*   **Ledger Invariant**: Double-entry ledger consistency:
    $$\sum \text{Debits} \equiv \sum \text{Credits}$$
    The unit balance of any holding must strictly equal the sum of active unredeemed units in the underlying `TaxLot` collection:
    $$\text{Holding.totalUnits} \equiv \sum_{k} \text{TaxLot}_k\text{.remainingUnits}$$

---

## 9. Comprehensive Acceptance Criteria Matrix

| Module | Test Case ID | Pre-Condition | Action / Event | Expected Outcome |
|---|---|---|---|---|
| **Performance** | `TC-XIRR-01` | Portfolio with 12 irregular monthly cashflows and current market value. | Invoke `/api/analytics/xirr`. | XIRR converges to within $10^{-7}$ precision matching Microsoft Excel XIRR / QuantLib standard; response returned within $<150\text{ ms}$. |
| **Performance** | `TC-TWR-01` | Portfolio with sudden large deposit followed by market crash. | Compare TWR vs. XIRR. | TWR accurately isolates asset selection performance without being distorted by deposit timing. |
| **SIP Engine** | `TC-STEPUP-01` | Active SIP of ₹10,000/month with 10% annual step-up. | Month 13 automated execution trigger. | Installment debit executes at exactly ₹11,000; customer notified 10 days in advance. |
| **Goal Engine** | `TC-GLIDE-01` | College Education goal reaches $T-3$ years to target. | Nightly glidepath evaluation worker. | System signals rebalance to adjust equity ceiling to $45\%$, moving surplus to liquid/ultra-short debt. |
| **Tax Engine** | `TC-FIFO-01` | 3 distinct tax lots purchased at ₹100, ₹150, and ₹200. Current NAV ₹180. User sells $1.5 \times$ Lot 1 units. | Execute partial redemption. | Lot 1 fully consumed; Lot 2 split 50%; STCG/LTCG computed accurately based on holding tenure of each lot. |
| **Governance** | `TC-MAKER-01` | Admin user attempts to approve their own catalog proposal. | POST `/api/admin/maker-checker/:id/action` with same `userId`. | Rejection with HTTP 403 Forbidden: `CANNOT_APPROVE_OWN_PROPOSAL`. |
| **KYC** | `TC-PENNY-01` | User provides bank account where name matches PAN with 92% similarity. | Penny-drop webhook returns successful match. | Account automatically transitions from `PENNY_DROP_INITIATED` to `PENNY_DROP_VERIFIED`. |
| **Edge Cases** | `TC-CUTOFF-01` | Equity mutual fund buy order submitted at 15:00:01 IST. | System cut-off evaluation. | Order tagged with $T+1$ execution date; client UI displays transparent next-business-day NAV disclosure. |

---

*End of Product Requirements Document (PRD.md)*

