# Design System Specification (DESIGN.md)
## Institutional Wealth Management & Investment Advisory Platform (IPS v2.0)

**Document Version:** `2.0.0-PROD`  
**Classification:** Institutional Design System & UI Specification  
**Status:** Approved for Implementation  
**Role:** Executive Fintech Design Director & Principal Staff Frontend Architect  
**Design Philosophy:** "Swiss Private Banking meets Financial Times Editorial Broadsheet"  
**Target Delivery Window:** Q1–Q3 2027  

---

## 1. Design Philosophy: The Daylight Broadsheet Standard

### 1.1 Contrast with Retail Fintech Clutter
Modern retail investment apps have devolved into noisy, neon-saturated video games—featuring dark-mode crypto aesthetics, glowing purples, gamified confetti, and heavy rounded "bento-grid" boxes nestled inside yet more rounded boxes.

IPS v2.0 rejects this entirely. Wealth management at an institutional tier demands sobriety, typographic dignity, and uncompromising clarity. Our design ethos synthesizes two venerated traditions:
1.  **Swiss Private Banking Ledgers**: Spatial restraint, hairline column rules, razor-sharp geometric alignment, and strict tabular alignment of financial figures.
2.  **Financial Times Broadsheet Editorial**: Warm paper daylight surfaces, authoritative editorial serif hierarchy, high information density without cognitive clutter, and dignified institutional inks.

```
+----------------------------------------------------------------------------------------------------+
|                                    THE 4 NON-NEGOTIABLE DESIGN LAWS                                |
+-----------------------------+-----------------------------+----------------------------------------+
| 1. NO DARK THEME            | 2. NO NEON / CYBERPUNK      | 3. NO BOXES OR CARDS   | 4. NO CIRCLES |
| Exclusively warm alabaster  | Dignified Forest Emerald,   | Open editorial rows,   | Square badges,|
| & ivory paper surfaces with | Sovereign Navy, Terracotta; | hairlines, whitespace; | horizontal    |
| deep obsidian ink.          | zero glow gradients.        | zero bento-grid cards. | stacked bars. |
+-----------------------------+-----------------------------+----------------------------------------+
```

---

## 2. Color System & Design Tokens

### 2.1 The Daylight Palette Architecture
The palette is calibrated for long-form analytical focus in daylight environments. There is **zero dark mode**; all tokens resolve to daylight editorial values.

```
+----------------------------------------------------------------------------------------------------+
|                                      DAYLIGHT COLOR SPECTRUM                                       |
+----------------------+--------------------+---------------------+----------------------------------+
| Token Name           | Hex Value          | CSS Variable        | Institutional Utility            |
+----------------------+--------------------+---------------------+----------------------------------+
| Paper Canvas (Deep)  | #FAF9F5            | --surface-paper     | Primary background surface       |
| Paper Sheet (White)  | #FFFFFF            | --surface-sheet     | Table body, inputs, slide-overs  |
| Paper Muted          | #F4F2EB            | --surface-muted     | Table headers, subtle hover rows |
| Hairline Border      | #E5E4DF            | --border-hairline   | 1px structural dividing rules    |
| Hairline Strong      | #D1CFC7            | --border-strong     | Active column borders, dividers  |
| Obsidian Ink (Title) | #111827            | --ink-primary       | Primary typography, net worth    |
| Muted Charcoal Ink   | #4B5563            | --ink-secondary     | Table headers, field labels      |
| Faded Graphite Ink   | #9CA3AF            | --ink-faded         | Metadata, captions, timestamps   |
+----------------------+--------------------+---------------------+----------------------------------+
```

### 2.2 Semantic Financial Value Indicators
Financial indicators use muted, desaturated, dignified tones—never radioactive neon greens or searing neon reds.

```
+----------------------------------------------------------------------------------------------------+
|                                    SEMANTIC FINANCIAL PALETTE                                      |
+----------------------+--------------------+---------------------+----------------------------------+
| Semantic Role        | Hex Value          | CSS Variable        | Application Context              |
+----------------------+--------------------+---------------------+----------------------------------+
| Positive Return      | #0F5132            | --fin-gain          | Positive P&L, XIRR, upward drift |
| Positive Tint (Row)  | #F0FDF4            | --fin-gain-tint     | Subtle gain background wash      |
| Negative Return      | #991B1B            | --fin-loss          | Negative P&L, tax losses         |
| Negative Tint (Row)  | #FEF2F2            | --fin-loss-tint     | Unrealized loss row highlight    |
| Sovereign Navy       | #1E3A8A            | --brand-navy        | Primary CTAs, active tab lines   |
| Warm Ochre           | #B45309            | --alert-amber       | Rebalance drift warnings, pending|
| Ochre Tint           | #FFFBEB            | --alert-amber-tint  | Drift warning background banner  |
+----------------------+--------------------+---------------------+----------------------------------+
```

### 2.3 CSS Variables Specification (`index.css`)

```css
:root {
  /* Surfaces */
  --surface-paper: #FAF9F5;
  --surface-sheet: #FFFFFF;
  --surface-muted: #F4F2EB;
  
  /* Hairlines */
  --border-hairline: #E5E4DF;
  --border-strong: #D1CFC7;

  /* Inks */
  --ink-primary: #111827;
  --ink-secondary: #4B5563;
  --ink-faded: #9CA3AF;

  /* Financial Semantics */
  --fin-gain: #0F5132;
  --fin-gain-tint: #F0FDF4;
  --fin-loss: #991B1B;
  --fin-loss-tint: #FEF2F2;
  --brand-navy: #1E3A8A;
  --alert-amber: #B45309;
  --alert-amber-tint: #FFFBEB;

  /* Typography Stacks */
  --font-serif: 'Newsreader', 'Playfair Display', Georgia, serif;
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', Menlo, Monaco, 'Courier New', monospace;

  /* Sharp Geometry Constraints */
  --radius-none: 0px;
  --radius-sm: 2px;
}
```

---

## 3. Typography & Tabular Alignment System

Wealth management interfaces succeed or fail on typographic discipline. When scanning hundreds of numbers, vertical optical alignment is paramount.

### 3.1 Typeface Triad

```
+----------------------------------------------------------------------------------------------------+
|                                    TYPOGRAPHIC ROLE MATRIX                                         |
+--------------------------+-----------------------+---------------------+---------------------------+
| Role                     | Font Family           | Weight Variants     | Primary Utility           |
+--------------------------+-----------------------+---------------------+---------------------------+
| Editorial Display Serif  | Newsreader / Playfair | Regular (400),      | Net worth totals, Page    |
|                          |                       | Medium (500)        | titles, Section headers   |
| Neo-Grotesque Sans       | Inter / Plus Jakarta  | Regular (400),      | UI controls, navigation,  |
|                          |                       | Medium (500), 600   | tooltips, table headers   |
| Tabular Monospace        | JetBrains Mono        | Regular (400),      | ALL monetary figures,     |
|                          | (or Inter with        | Medium (500)        | percentages, NAVs, units, |
|                          | tabular-nums)         |                     | XIRR, dates, tax lots     |
+--------------------------+-----------------------+---------------------+---------------------------+
```

### 3.2 The Strict Tabular Numerals Rule
All financial quantities, asset units, currency values, percentages, and dates must be rendered with monospaced character widths or CSS `font-variant-numeric: tabular-nums`:

$$\text{CSS: } \quad \texttt{font-variant-numeric: tabular-nums; letter-spacing: -0.01em;}$$

```
BAD (Proportional Numbers - Decimal drift makes vertical comparison difficult):
₹ 1,111,111.00
₹ 8,888,888.88

GOOD (Tabular Numerals - Perfect vertical decimal tracking):
₹ 1,111,111.00
₹ 8,888,888.88
```

### 3.3 Typographic Hierarchy & Scale

```
Display 1 (Net Worth):  Newsreader, 44px (2.75rem), weight 400, leading 1.1, tracking -0.02em
Heading 1 (Sections):   Newsreader, 28px (1.75rem), weight 500, leading 1.2, tracking -0.01em
Heading 2 (Subsections): Inter, 18px (1.125rem), weight 600, leading 1.3, uppercase tracking +0.05em
Body (Readable Prose):   Inter, 14px (0.875rem), weight 400, leading 1.5, color #4B5563
Table Header (Meta):     Inter, 11px (0.6875rem), weight 600, uppercase, tracking +0.08em, color #4B5563
Table Numeric Data:      JetBrains Mono, 13px (0.8125rem), weight 400, tabular-nums, color #111827
Caption / Micro-copy:    Inter, 11px (0.6875rem), weight 400, color #9CA3AF
```

---

## 4. Layout & Spatial Architecture: The Boxless Grid

### 4.1 Banning Cards, Bento Grids, and Card-in-Card Clutter
Traditional consumer fintech wraps every metric in an elevated, rounded card with `box-shadow: 0 10px 25px rgba(0,0,0,0.1)`. This wastes horizontal pixels, creates visual noise, and degrades data density.

IPS v2.0 enforces a **Boxless Structural Grid**:
*   **Dividers instead of Containers**: Sections are delineated by subtle `1px solid #E5E4DF` horizontal rules (`border-b`) and column hairlines (`border-r`).
*   **Whitespace Hierarchy**: Rhythm is generated using consistent spatial multiples ($8\text{px}, 16\text{px}, 24\text{px}, 32\text{px}, 48\text{px}$) rather than nested box containers.
*   **Open Ledger Rows**: Data rows sit directly on the paper surface `#FAF9F5`. Alternating rows do not use contrasting grey blocks; instead, subtle hover washes (`#F4F2EB`) provide hover feedback.

```
TRADITIONAL BENTO-GRID CARD (BANNED):
+------------------------------------+
|  [Card Shadow]                     |
|  +------------------------------+  |
|  |  [Inner Card Shadow]         |  |
|  |  Metric: ₹10,00,000          |  |
|  +------------------------------+  |
+------------------------------------+

SWISS EDITORIAL BROADSHEET (MANDATED):
======================================================================================
TOTAL NET WORTH                        DAY'S MOVEMENT           XIRR (ANNUALIZED)
₹ 48,291,500.00                       +₹ 124,500.00 (+0.26%)   +18.42%
--------------------------------------------------------------------------------------
ASSET CLASS ALLOCATION
[Equity 65.4%] [Fixed Income 24.2%] [Gold 6.4%] [Cash & Liquid 4.0%]
======================================================================================
```

### 4.2 Sharp Geometry Constraints
*   **Max Border Radius**: Strict maximum of `2px` (`rounded-sm`) or `0px` (`rounded-none`).
*   **Banned Radii**: `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-3xl`, `rounded-full` are forbidden across all buttons, inputs, tables, tags, and layouts.

---

## 5. Circle-Free Data Visualization Standards

Under our institutional rules, **circular data graphics are prohibited**:
*   No pie charts.
*   No donut charts.
*   No circular avatars.
*   No circular progress dials or gauge needles.

### 5.1 Horizontal Stacked Marimekko / Allocation Bars
Asset allocation is represented via continuous horizontal stacked bars with proportional widths, accompanied by tabular legends:

```
[========================== EQUITY (65.4%) ==========================][======= DEBT (24.2%) =======][== GOLD (6.4%) ==][ CASH (4%) ]
```

*   **Height**: $12\text{px}$ or $16\text{px}$ hairline height with sharp ends (`rounded-none`).
*   **Dividing Gaps**: $1\text{px}$ white paper hairlines separating segments.
*   **Colors**:
    *   Large-Cap / Mid-Cap Equity: `#1E3A8A` (Sovereign Navy) and `#2563EB`.
    *   Fixed Income / Debt: `#4B5563` (Charcoal Slate).
    *   Sovereign Gold: `#B45309` (Warm Ochre).
    *   Cash / Liquid Escrow: `#9CA3AF` (Muted Graphite).

### 5.2 Performance Charts: TradingView Lightweight Baseline & Area
*   **Rendering Engine**: HTML5 Canvas / WebGL via TradingView Lightweight Charts.
*   **Color Configuration**:
    *   Line Stroke: $1.5\text{px}$ solid `#0F5132` (Forest Emerald) for positive periods; `#1E3A8A` (Sovereign Navy) for multi-year baseline.
    *   Gradient Fill: Top color `rgba(15, 81, 50, 0.12)`, bottom color `rgba(250, 249, 245, 0.0)`. Zero neon opacity.
    *   Benchmark Line (NIFTY 50 TRI): $1\text{px}$ dashed `#9CA3AF`.
    *   Crosshair: $1\text{px}$ dotted `#4B5563` with tabular price callout tooltip in sharp `#FFFFFF` box with `1px solid #E5E4DF`.

### 5.3 Linear Goal Glidepath & Stochastic Monte Carlo Fan Charts
*   **Glidepath Visualization**: Stacked two-tone area chart showing equity percentage decaying from 85% to 15% as time approaches $T=0$.
*   **Monte Carlo Fan**:
    *   P90 Line (Downside): $1.5\text{px}$ solid `#B45309` (Warm Ochre).
    *   P50 Line (Median): $2\text{px}$ solid `#1E3A8A` (Sovereign Navy).
    *   P10 Line (Optimistic): $1.5\text{px}$ solid `#0F5132` (Forest Emerald).
    *   Confidence Interval Shading: Ultra-low opacity fill `rgba(30, 58, 138, 0.05)`.

---

## 6. Component Primitives & Micro-Tokens

```
+----------------------------------------------------------------------------------------------------+
|                                    COMPONENT PRIMITIVE RULES                                       |
+--------------------+------------------------------------+------------------------------------------+
| Component          | Geometric Specification            | Typographic / Border Specification       |
+--------------------+------------------------------------+------------------------------------------+
| User Monogram      | 28x28px or 32x32px square (0px rad)| Inter 12px 600; bg #F4F2EB, ink #111827  |
| Status Tag         | Rectangular strip (0px radius)     | Inter 10px uppercase 600; 1px border     |
| Action Button      | Sharp rectangular (0-2px radius)   | Inter 13px 500; solid #1E3A8A or hairline|
| Tab Navigation     | Underline border-b 2px (no pills)  | Inter 13px 500; active text #111827      |
| Slide-Over Sheet   | Right-anchored sheet (0px radius)  | 1px solid #E5E4DF left hairline; white bg|
+--------------------+------------------------------------+------------------------------------------+
```

---

*End of Design System Specification (DESIGN.md)*

