# Master AI Engineering & Design Constitution (rules.md)
## Institutional Wealth Management & Investment Advisory Platform (IPS v2.0)

**Document Version:** `2.0.0-PROD`  
**Enforcement Level:** ABSOLUTE & NON-NEGOTIABLE  
**Scope:** All AI Agents, Autonomous Subagents, Pair Programmers, and Human Contributors  

---

## 1. The Core Architectural Laws

### Law 1.1: File Length Guardrails (Anti-Monolith Directive)
*   **Frontend Components**: Strict limit of **250 lines of code** per React component file. If a component exceeds 250 lines, it must be decomposed immediately into sub-components, custom hooks, or utility files.
*   **Backend Modules**: Strict limit of **300 lines of code** per backend service, controller, or repository module.
*   **Zero Tolerance for Portal Monoliths**: Never recreate monolithic files like `UserPortal.jsx` or `AdminPortal.jsx`. All code must reside in modular domain feature directories under `frontend/src/features/` or `backend/src/`.

### Law 1.2: Strict Separation of Mathematical Logic
*   **Zero Financial Math in UI Components**: Financial formulas, compounding loops, XIRR solvers, tax calculations, and glidepaths are strictly prohibited inside React components or JSX files.
*   **Domain Isolation**: All financial mathematics must reside in pure, framework-agnostic TypeScript files under `backend/src/quant/` or `frontend/src/lib/math/`, accompanied by automated unit tests.

### Law 1.3: Data Fetching & Routing Architecture
*   **No Raw `useEffect` Data Fetching**: Never fetch server data via `useEffect` + `fetch` or `useEffect` + `axios`. All server state must be managed via **TanStack Query v5** (`useQuery`, `useMutation`) utilizing the query key factory pattern.
*   **Mandatory URL Routing**: All navigable views must be mapped to distinct URL routes using `react-router-dom` v6. Never manage application pages via in-memory React state flags (`activeTab === 'portfolio'`).

---

## 2. Financial Precision & Security Laws

### Law 2.1: Prohibition of Floating-Point Currency Arithmetic
*   **Zero IEEE 754 Currency Math**: The JavaScript primitive `number` must NEVER be used for currency arithmetic or monetary accumulation.
*   **Storage Invariant**: Store monetary values in the lowest integer currency denomination (e.g., Indian Rupee paise or US Dollar cents as 64-bit BigInt / Integers) or MongoDB `Decimal128`.
*   **Runtime Math**: All financial computations must utilize `decimal.js` or integer paise math with explicit rounding modes (`ROUND_HALF_EVEN` / Banker's Rounding).

### Law 2.2: Mandatory Tenant Isolation (Zero IDOR Vulnerabilities)
*   **Scoped Query Mandate**: Every database query in customer controllers and services MUST explicitly enforce `{ userId: req.user._id }` or `{ user: req.user._id }`.
*   **Ownership Verification**: Any mutation or read accessing `portfolioId`, `mandateId`, or `transactionId` must pass through the `verifyPortfolioOwnership` middleware or verify ownership before executing queries.

### Law 2.3: Atomic Transactions & Idempotency
*   **ACID Transaction Mandate**: Every financial state mutation (debiting balances, allocating units, creating tax lots, redeeming funds) must execute within a MongoDB replica set multi-document ACID transaction session (`session.withTransaction()`).
*   **Idempotency Header Mandate**: Every financial endpoint (`POST /api/transactions/*`, `POST /api/customer/investments`) must mandate the `Idempotency-Key` header and execute the Redis atomic lock verification pattern.

### Law 2.4: Zero Token Leaks & PII Privacy
*   **No `localStorage` Tokens**: Access and refresh tokens must never be written to browser `localStorage` or `sessionStorage`. Sessions rely strictly on `HttpOnly; Secure; SameSite=Strict` cookies.
*   **PII Masking**: Never write unmasked PAN, Aadhaar, bank account numbers, or plaintext passwords to console logs, Winston/Pino streams, or error messages.

---

## 3. Strict Visual & UI/UX Guardrails (The "No Dark, No Neon, No Boxes, No Circles" Law)

### Law 3.1: The Daylight Broadsheet Standard (NO DARK THEME)
*   **Exclusive Daylight Palette**: The platform is strictly an editorial daylight interface.
*   **Banned Tailwind Classes**:
    *   ❌ BANNED: `dark:*` (Any dark mode variant).
    *   ❌ BANNED: `bg-slate-900`, `bg-gray-900`, `bg-black`, `bg-zinc-950`.
*   **Mandated Tailwind Classes**:
    *   ✅ MANDATED: Paper backgrounds `bg-[#FAF9F5]`, sheet white `bg-white`, muted paper `bg-[#F4F2EB]`.
    *   ✅ MANDATED: Obsidian inks `text-[#111827]`, secondary inks `text-[#4B5563]`.

### Law 3.2: Dignified Institutional Tones (NO NEON OR CYBERPUNK)
*   **Banned Color Utilities**:
    *   ❌ BANNED: Neon greens (`#00FF66`, `bg-green-400`), electric purples (`#7928CA`, `bg-purple-600`), cyan glows (`#00FFFF`), radioactive lime.
    *   ❌ BANNED: Glow filters, neon drop-shadows (`shadow-[0_0_...px]`).
*   **Mandated Institutional Colors**:
    *   ✅ MANDATED: Forest Emerald `#0F5132` (Positive returns, gain badges).
    *   ✅ MANDATED: Sovereign Navy `#1E3A8A` (Primary actions, brand accents).
    *   ✅ MANDATED: Crimson Terracotta `#991B1B` (Negative returns, losses).
    *   ✅ MANDATED: Warm Ochre `#B45309` (Drift warnings, pending states).

### Law 3.3: Boxless Broadsheet Grid (NO BOXES, NO BENTO GRIDS)
*   **Banned Box Styles**:
    *   ❌ BANNED: Heavy card drop-shadows (`shadow-md`, `shadow-lg`, `shadow-xl`, `shadow-2xl`).
    *   ❌ BANNED: Rounded card-in-card nested containers.
*   **Mandated Layout Styles**:
    *   ✅ MANDATED: Horizontal hairline dividing rules `border-b border-[#E5E4DF]`.
    *   ✅ MANDATED: Column hairlines `border-r border-[#E5E4DF]`.
    *   ✅ MANDATED: Open ledger rows with subtle `#F4F2EB` hover states.

### Law 3.4: Geometric Discipline (NO CIRCLES)
*   **Banned Circular Elements**:
    *   ❌ BANNED: `rounded-full`, `rounded-xl`, `rounded-2xl`, `rounded-3xl`.
    *   ❌ BANNED: Circular user avatars.
    *   ❌ BANNED: Pie charts and donut charts.
    *   ❌ BANNED: Circular progress rings and pill badges.
*   **Mandated Geometric Elements**:
    *   ✅ MANDATED: Sharp geometry `rounded-none` or `rounded-sm` (max 2px radius).
    *   ✅ MANDATED: Square user monograms (e.g., `w-7 h-7 rounded-none bg-[#F4F2EB] text-xs font-semibold`).
    *   ✅ MANDATED: Horizontal stacked marimekko/allocation bars.
    *   ✅ MANDATED: Linear horizontal goal glidepath bars and hairline step indicators.

### Law 3.5: Mandatory Tabular Numerals
*   **Every Numeric Display**: All currency values, percentages, XIRR figures, units, NAVs, and dates MUST include `tabular-nums` in their CSS classes to guarantee vertical decimal alignment:
    ```tsx
    // CORRECT:
    <span className="font-mono tabular-nums text-sm text-[#111827]">₹ 1,48,20,000.00</span>
    ```

---

## 4. Definition of Done (DoD) Quality Verification Checklist

Before completing any task, an AI agent or engineer MUST verify each item:

```
[ ] 1. Monolith Prevention: Component is under 250 LOC; backend module is under 300 LOC.
[ ] 2. Math Isolation: Zero financial math in React component; quant logic unit-tested in quant/.
[ ] 3. Monetary Precision: All currency uses integer paise or Decimal128 (no float arithmetic).
[ ] 4. Security Check: Tenant isolation enforced ({ user: req.user._id }); no IDOR risk.
[ ] 5. State Integrity: Mutations run inside ACID session.withTransaction() with Idempotency-Key.
[ ] 6. Zero Dark Mode: No dark:* or dark background classes present.
[ ] 7. Zero Boxes & Bento Grids: Layout structured with hairlines and whitespace (no shadow cards).
[ ] 8. Zero Circles: No rounded-full, circular avatars, pie charts, or circular progress rings.
[ ] 9. Tabular Numerals: All financial numbers and dates tagged with tabular-nums.
[ ] 10. Zod Validation: All inbound API requests validated via strict Zod schemas.
[ ] 11. Error Standard: All backend errors conform to RFC 7807 Problem Details.
[ ] 12. TypeScript Purity: Zero "any" types; strict type safety across all interfaces.
```

---

*Any code generation violating these laws must be rejected and refactored immediately.*

