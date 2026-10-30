# UI/UX Specifications & Wireframe Blueprints (UI_UX.md)
## Institutional Wealth Management & Investment Advisory Platform (IPS v2.0)

**Document Version:** `2.0.0-PROD`  
**Classification:** Institutional Interaction Design & Wireframe Blueprint  
**Status:** Approved for Implementation  
**Role:** Executive Fintech Design Director & Principal Staff Frontend Architect  
**Companion Design System:** `docs/DESIGN.md` (Editorial Daylight Broadsheet)  
**Target Delivery Window:** Q1–Q3 2027  

---

## 1. Global Navigation & Information Architecture

The navigation paradigm abandons nested hamburger menus and bulky floating headers in favor of an **editorial broadsheet topmast** combined with an **instant keyboard command palette (`Cmd+K` / `Ctrl+K`)**.

### 1.1 Editorial Topmast & Sub-Navigation Header
The topmast anchors the application across all viewport widths, structured via sharp hairlines (`border-b border-[#E5E4DF]`):

```
+----------------------------------------------------------------------------------------------------------------------------------+
| IPS WEALTH v2.0   |  DASHBOARD   PORTFOLIO   EXPLORE   GOALS   SIPS   TAX-LOSS   CALCULATORS   LEDGER  |  [⌘K Jump]  [₹4.82 Cr] [RS] |
+----------------------------------------------------------------------------------------------------------------------------------+
```

*   **Masthead Branding**: Newsreader Serif 18px (`IPS WEALTH v2.0`), sharp hairline divider right.
*   **Primary Section Tabs**: Horizontal text links with an active `2px solid #1E3A8A` bottom border indicator. No pill highlights, no floating bubbles.
*   **Instant Command Palette Trigger**: Quick search button displaying `⌘K` or `Ctrl+K` shortcut badge.
*   **Investor Profile Indicator**: Typographic monogram badge (squared `28x28px`, `rounded-none`, `#F4F2EB` background) with KYC status indicator (a crisp green square dot, not a rounded badge).

---

### 1.2 Institutional Command Palette (`Cmd+K` / `Ctrl+K`)
Pressing `Cmd+K` / `Ctrl+K` summons a sharp, full-bleed search dialog overlaying the screen with a hairline-bordered command menu:

```
+----------------------------------------------------------------------------------------------------+
|  🔍 Type a fund name, ticker, folio number, or command...                      [ESC to Close]      |
+----------------------------------------------------------------------------------------------------+
|  RECENT SEARCHES & HOLDINGS                                                                        |
|  Parag Parikh Flexi Cap Fund (Direct-Growth)            ISIN: INF879O01018      Holdings: ₹18.4L   |
|  HDFC NIFTY 50 Index Fund (Direct-Growth)               ISIN: INF179KB1HR5      Holdings: ₹12.1L   |
|                                                                                                    |
|  CALCULATORS & TOOLS                                                                               |
|  Launch Step-Up SIP Compounding Calculator                                     Press ↵ to open     |
|  Launch Tax-Loss Harvesting Opportunity Scanner                                Press ↵ to open     |
|  Launch Monte Carlo Retirement Goal Simulator                                  Press ↵ to open     |
|                                                                                                    |
|  ACTIONS & NAVIGATION                                                                              |
|  Start New Monthly SIP                                                         Action              |
|  Export Double-Entry Ledger Statement (PDF/CSV)                                Download            |
|  Switch to Compliance Admin Desk (Maker-Checker)                               Role: Checker       |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Screen-by-Screen Wireframe Blueprints

### 2.1 Executive Wealth Ledger (`/dashboard`)

```
====================================================================================================================================
PORTFOLIO VALUATION STATEMENT                                                                              AS OF 29 OCT 2026, 10:15 IST
====================================================================================================================================
TOTAL NET WORTH                        DAY'S MOVEMENT           TOTAL GAIN / P&L         ANNUALIZED XIRR         PORTFOLIO TWR
₹ 4,82,91,500.00                       +₹ 1,24,500.00 (+0.26%)   +₹ 1,48,20,000.00        +18.42%                 +19.10%
------------------------------------------------------------------------------------------------------------------------------------
ASSET CLASS COMPOSITION
[========================== EQUITY: 65.4% ==========================][======= FIXED INCOME: 24.2% =======][= GOLD: 6.4% =][ CASH: 4% ]
Large Cap: ₹1.82 Cr (37.7%) | Mid Cap: ₹84.5L (17.5%) | Debt: ₹1.17 Cr (24.2%) | Gold: ₹30.9L (6.4%) | Liquid: ₹19.3L (4.0%)
====================================================================================================================================
PERFORMANCE BENCHMARK OVERLAY (NORMALIZED BASE 100)                                                     [1M]  [6M]  [1Y]  [3Y]  [ALL]
------------------------------------------------------------------------------------------------------------------------------------
160 +                                                                                                            Portfolio: 154.2
    |                                                                                         .....-------''     NIFTY 50:  138.6
140 +                                                                          .......--------''                 Alpha:     +15.6%
    |                                                           .......--------''                                Beta:       0.84
120 +                                            .......--------''
    |                             .......--------''
100 +-----------------------------''------------------------------------------------------------------------------------------------
    | Nov 2024                    May 2025                    Nov 2025                    May 2026                    Oct 2026
------------------------------------------------------------------------------------------------------------------------------------
ACTIVE GOALS PROGRESS SUMMARY                                                                                       [+ New Goal]
* Retirement 2045:             Target ₹12.00 Cr | Current ₹2.84 Cr | Feasibility: 86% (On Track) | Allocation: 75% Eq / 25% Debt
* Child Higher Education 2032: Target ₹1.50 Cr  | Current ₹82.00 L | Feasibility: 74% (Step-Up Rec.) | Allocation: 55% Eq / 45% Debt
====================================================================================================================================
```

*   **Net Worth Display**: Newsreader Serif 44px with JetBrains Mono numbers. No card boxes; metrics span the full content width separated by vertical hairline dividers.
*   **Asset Composition Bar**: 14px horizontal multi-segment bar with hairline separators. Hovering highlights underlying amounts.
*   **Normalized Performance Canvas**: TradingView Lightweight Charts canvas rendering rebased portfolio vs. NIFTY 50 TRI with Alpha/Beta callouts.

---

### 2.2 Holdings & Portfolio X-Ray (`/portfolio`)

The holdings view avoids card-in-card containers. It uses a high-density, Swiss-style data table with sortable column headers, inline visual weight bars, and expandable tax-lot drill-downs.

```
====================================================================================================================================
PORTFOLIO HOLDINGS LEDGER                                                  [Filter: All Assets v] [Sort: Valuation v] [Export CSV]
====================================================================================================================================
SECURITY / FUND NAME            FOLIO / ISIN     UNITS         BUY NAV    CURRENT NAV   INVESTED      CURRENT VALUE  RETURNS (XIRR)
------------------------------------------------------------------------------------------------------------------------------------
> Parag Parikh Flexi Cap Fund   INF879O01018     24,819.124    ₹42.10     ₹74.15        ₹10,44,885    ₹18,40,338     +22.4%  [+]
  Weight: [████████████░░░░] 38.1% of Equity | Allocation: Large Cap (68%), Mid Cap (18%), International (14%)
------------------------------------------------------------------------------------------------------------------------------------
> HDFC NIFTY 50 Index Fund      INF179KB1HR5     48,102.500    ₹18.50     ₹25.18        ₹8,89,896     ₹12,11,220     +16.1%  [+]
  Weight: [████████░░░░░░░░] 25.1% of Equity | Allocation: Large Cap Blend (100%)
------------------------------------------------------------------------------------------------------------------------------------
> ICICI Pru Corporate Bond Fund INF109K01Z18     324,190.00    ₹22.14     ₹26.42        ₹71,78,566    ₹85,65,099     +7.8%   [+]
  Weight: [████████████████] 73.2% of Debt | AAA Credit Exposure: 94.2% | Duration: 2.8 Yrs
------------------------------------------------------------------------------------------------------------------------------------
> Sovereign Gold Bond 2028-IV   IN0020180234     350 Grams     ₹4,200     ₹8,840        ₹14,70,000    ₹30,94,000     +18.9%  [+]
  Weight: [████████████████] 100% of Gold | Fixed Interest: 2.50% p.a.
====================================================================================================================================
```

#### Slide-Over Action Sheet: Redemption & Tax Lot Inspector
Clicking the `[+]` icon or selecting a fund expands a **Right-Anchored Slide-Over Sheet** (width $540\text{px}$, `0px` radius, `1px solid #E5E4DF` left border) instead of an intrusive centered modal:

```
+----------------------------------------------------------------------------------------------------+
| PARAG PARIKH FLEXI CAP FUND                                                        [Close X]       |
| ISIN: INF879O01018 | Folio: 12894109/44                                                            |
+----------------------------------------------------------------------------------------------------+
| REAL-TIME TAX LOT BREAKDOWN (FIFO QUEUE)                                                           |
| LOT DATE      UNITS       COST NAV   CURRENT NAV   HOLDING TENURE   TAX STATUS    UNREALIZED GAIN  |
| 14 Jan 2024   10,000.00   ₹38.50     ₹74.15        1,019 Days       LTCG (12.5%)  +₹3,56,500.00    |
| 14 Jan 2025    8,000.00   ₹44.20     ₹74.15          654 Days       LTCG (12.5%)  +₹2,39,600.00    |
| 14 Jan 2026    6,819.12   ₹68.00     ₹74.15          288 Days       STCG (20.0%)    +₹41,937.58    |
+----------------------------------------------------------------------------------------------------+
| EXECUTE REDEMPTION ORDER                                                                           |
| Units to Redeem: [ 5,000.000       ]   Estimated Gross Value:  ₹ 3,70,750.00                       |
| Tax Lot Allocation: Consumes 5,000 units from Lot #1 (14 Jan 2024 - LTCG @ 12.5%)                  |
| Estimated Tax Liability: ₹ 22,281.25 (Post ₹1.25L Exemption)                                       |
|                                                                                                    |
| [ ] I authorize instant redemption under FIFO settlement rules.                                    |
| [ EXECUTE ATOMIC REDEMPTION (₹ 3,70,750.00) ]                                                      |
+----------------------------------------------------------------------------------------------------+
```

---

### 2.3 Goal Glidepath & Step-Up SIP Studio (`/goals` & `/sips`)

The Goal Studio uses a **Split-Pane Interactive Workspace**:
*   **Left Pane (Width 40%)**: Compounding parameter sliders and asset allocation toggles.
*   **Right Pane (Width 60%)**: Real-time reactive compounding trajectory canvas and stochastic Monte Carlo probability cone.

```
====================================================================================================================================
GOAL GLIDEPATH & STEP-UP COMPILATION STUDIO                                                   GOAL: RETIREMENT CORPUS (2045)
====================================================================================================================================
PLANNER PARAMETERS (INPUT CONTROLS)                     STOCHASTIC PROBABILITY CONE (1,000 SIMULATIONS)
-----------------------------------------------------   --------------------------------------------------------------------
Current Accumulated Wealth:                             ₹ Cr
[ ₹ 2,84,00,000                             ]           16 +
                                                           |                                                P10: ₹14.8 Cr
Monthly SIP Contribution:                               12 +                                            ....--------''
[ ₹ 1,50,000                                ]              |                                .......-----''  P50: ₹12.4 Cr
                                                         8 +                        .......-''              P90: ₹9.8 Cr
Annual Step-Up Escalation (%):                             |                 .......''
[ 10.0%                                     ]            4 +          .......''
                                                           |  ........''
Retirement Horizon (Years to Target):                    0 +--+-------+-------+-------+-------+-------+-------+-------+----
[ 19 Years (Year 2045)                      ]                2026    2029    2032    2035    2038    2041    2044    2045
                                                        --------------------------------------------------------------------
Category Inflation Rate (CPI):                          GOAL FEASIBILITY STATUS: 86.4% PROBABILITY OF SUCCESS
[ 6.0% (Retirement Living Expenses)         ]           Status: ON TRACK (GREEN) | Required Terminal Target: ₹12.00 Cr
-----------------------------------------------------   --------------------------------------------------------------------
DYNAMIC ASSET DE-RISKING GLIDEPATH                      RECOMMENDED ACTION:
Today (T-19):   85% Equity / 15% Debt                   Current parameters achieve target at median P50. No step-up delta
T-5 (2040):     50% Equity / 50% Debt                   adjustment required.
T-1 (2044):     15% Equity / 85% Cash & Liquid          [ SAVE & SYNC TO ACTIVE SIP MANDATE ]
====================================================================================================================================
```

*   **Zero-Lag Reactive Sliders**: Adjusting the Step-Up % slider triggers an in-memory recalculation via Web Worker, rendering new trajectories in $< 16\text{ ms}$ (60 FPS) without HTTP calls.

---

### 2.4 5-in-1 Financial Calculators Workbench (`/calculators`)

The workbench allows investors to toggle seamlessly between 5 quant calculators without leaving the screen:
1.  **Extended Internal Rate of Return (XIRR)**: Irregular cashflow date builder.
2.  **Step-Up SIP vs. Flat SIP**: Future value differential comparison.
3.  **Inflation Purchasing-Power Decay**: Nominal ₹1.0 Crore decay over 10, 20, 30 years across sector inflation.
4.  **FIRE (Financial Independence, Retire Early)**: Safe Withdrawal Rate (SWR 3.5%) vs. Corpus Duration.
5.  **Capital Gains Post-Tax Net Yield**: STCG vs. LTCG tax drag calculator.

```
====================================================================================================================================
5-IN-1 FINANCIAL QUANTITATIVE WORKBENCH
====================================================================================================================================
[ STEP-UP SIP ]   [ XIRR CASHFLOWS ]   [ INFLATION DECAY ]   [ FIRE CORPUS ]   [ POST-TAX CAPITAL GAINS ]
------------------------------------------------------------------------------------------------------------------------------------
COMPARATIVE AMORTIZATION SCHEDULE: FLAT SIP VS. 10% STEP-UP SIP (15 YEARS @ 12.0% RETURN)
------------------------------------------------------------------------------------------------------------------------------------
YEAR    MONTHLY INSTALLMENT    ANNUAL INVESTMENT    TOTAL INVESTED (STEP-UP)    FLAT SIP WEALTH    STEP-UP SIP WEALTH   ALPHA GAIN
1       ₹ 25,000               ₹ 3,00,000           ₹ 3,00,000                  ₹ 3,20,541         ₹ 3,20,541           ₹ 0
5       ₹ 36,602               ₹ 4,39,230           ₹ 18,31,530                 ₹ 20,62,158        ₹ 26,45,189          +₹ 5,83,031
10      ₹ 58,947               ₹ 7,07,364           ₹ 53,81,148                 ₹ 58,08,477        ₹ 96,12,890          +₹ 38,04,413
15      ₹ 94,936               ₹ 11,39,232          ₹ 1,12,47,150               ₹ 1,24,94,720      ₹ 2,49,15,820        +₹ 1,24,21,100
------------------------------------------------------------------------------------------------------------------------------------
STEP-UP WEALTH ADVANTAGE: +₹ 1,24,21,100 (+99.4% Additional Wealth Created vs. Flat SIP)
[ ONE-CLICK: CONVERT CALCULATION INTO ACTIVE STEP-UP SIP MANDATE ]
====================================================================================================================================
```

---

### 2.5 Institutional Admin & Operations Console (`/admin/*`)

The Admin console is designed for compliance officers, risk managers, and operations personnel. It prioritizes information density, keyboard navigation, and explicit dual-control inspection.

```
====================================================================================================================================
MAKER-CHECKER AUTHORIZATION QUEUE (DUAL CONTROL DESK)                                      LOGGED IN: VIKRAM MALHOTRA (CHECKER)
====================================================================================================================================
PROPOSAL ID  TIMESTAMP          MAKER USER        ACTION TYPE              TARGET ENTITY / DETAILS        STATUS    ACTIONS
------------------------------------------------------------------------------------------------------------------------------------
PRP-8819     29 Oct 09:42 IST   ananya.ops        HIGH_VALUE_WITHDRAWAL    User: Rahul Sharma (₹12.5L)    PENDING   [INSPECT] [REJECT]
PRP-8820     29 Oct 09:15 IST   ananya.ops        CATALOG_NAV_OVERRIDE     Scheme: INF209K01157 (+2.1%)   PENDING   [INSPECT] [REJECT]
PRP-8815     28 Oct 18:20 IST   rahul.maker       BANK_IFSC_MODIFICATION   User: Priya Iyer (HDFC->ICICI) APPROVED  [VIEW AUDIT]
====================================================================================================================================
PROPOSAL INSPECTION PANE: PRP-8819 (HIGH VALUE WITHDRAWAL)
Maker Identity:         ananya.ops (IP: 192.168.1.45, Authenticated via MFA)
Target Investor:        Rahul Sharma (User ID: USR-90124) | KYC Status: ACTIVE | AML Screening: PASS
Requested Amount:       ₹ 12,50,000.00 (Twelve Lakh Fifty Thousand Rupees)
Destination Bank:       HDFC Bank Ltd, A/C: *******9812, IFSC: HDFC0000128 (Penny Drop Verified: 96% Match)
Audit Ledger Check:     Ledger Invariant Checked: In-flight escrow debited. No double-spend flags detected.
------------------------------------------------------------------------------------------------------------------------------------
CHECKER AUTHORIZATION:
Enter 6-Digit TOTP Token: [ ______ ]   Review Notes: [ Verified nodal balance and client withdrawal request ]
[ REJECT PROPOSAL (RETURN TO DRAFT) ]                                  [ APPROVE & DISPATCH TO BANK NODAL (DUAL SIGN) ]
====================================================================================================================================
```

---

## 3. Micro-Interactions, Feedback & Error Choreography

### 3.1 Skeleton Shimmers
During TanStack Query cache fetches, the interface never flashes generic spinning circles or blocking overlays. It renders **hairline skeleton pulses**:
*   Height matches exact text leading ($14\text{px}$ or $20\text{px}$).
*   Background pulse: Subtle transition from `#F4F2EB` to `#FAF9F5` (1.5s ease-in-out cycle).
*   Zero layout shift ($CLS = 0$).

### 3.2 Optimistic Ledger Row Updates
When an investor submits a buy order or creates a SIP:
1.  **Instant Row Insertion**: A new row appears immediately in the table tagged with a sharp rectangular status badge: `PENDING_CLEARANCE` (`#FFFBEB` background, `#B45309` border and text).
2.  **WebSocket Transition**: Upon receipt of the backend `TRANSACTION_SETTLED` event, the badge seamlessly flips to `SETTLED` (`#F0FDF4` background, `#0F5132` border) accompanied by a 1-second subtle emerald row highlight.
3.  **Automatic Rollback**: If the transaction fails, the row highlights terracotta red (`#FEF2F2`), displays the exact RFC 7807 error message inline, and restores previous balances.

---

*End of UI/UX Specifications & Wireframe Blueprints (UI_UX.md)*

