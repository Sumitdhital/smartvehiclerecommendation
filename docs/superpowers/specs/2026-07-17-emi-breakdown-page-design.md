# Dedicated EMI Breakdown Page — Design Spec

**Date:** 2026-07-17
**Status:** Approved, pending implementation

## Summary

Add a dedicated page that shows a full month-by-month EMI (installment) breakdown for a
vehicle, with an interactive graph and an amortization schedule table. It is reached from the
existing EMI Calculator card on the vehicle detail page. The card's current inline "View
Breakdown" quick-summary stays exactly as it is; a new link is added beside it that navigates
to the full page.

## Goals

- Give buyers a real EMI planner: adjust down payment, loan term, and interest rate and see the
  monthly EMI, totals, graph, and full schedule recompute live.
- Show the complete month-by-month amortization schedule (all installments).
- Visualize how the loan is paid off over time with a graph.

## Non-Goals

- No change to the existing "View Breakdown" quick summary on the card (4-row `<dl>`).
- No persistence, no server-side calculation, no saving of scenarios.
- No currency other than NPR; no tax integration on this page (price is the vehicle price).

## Routing & Architecture

- New route: `app/vehicle/[id]/emi/page.tsx` — **server component**.
  - Loads the vehicle with `getVehicleById(id)` (same as `app/vehicle/[id]/page.tsx`); calls
    `notFound()` when missing.
  - Renders the shared `SiteHeader` (active="find") and the shared footer style consistent with
    the detail page.
  - Passes `price`, a vehicle label (`brand model variant`), and the first image to a new client
    component.
- New client component: `components/vehicle/EmiBreakdown.tsx` — holds all interactive state
  (down payment %, term, rate) and renders the summary strip, controls, graph, and table.
- The `?down=<pct>` query parameter seeds the initial down-payment value. It is read on the
  client (e.g. `useSearchParams`) and clamped to the valid 20–80 range; an absent or invalid
  value falls back to the default of 40.

## Shared EMI math — `lib/emi.ts`

Extract the amortization logic into a new module so the card and the new page compute
identically. Currently `monthlyEmi` and the `EMI_RATE`/`EMI_YEARS` constants live inside
`components/vehicle/VehicleDetail.tsx`; move them here and have `VehicleDetail.tsx` import them.

Exports:

- Constants: `EMI_RATE_DEFAULT = 8.5`, `EMI_YEARS_DEFAULT = 5`.
- `monthlyEmi(loan: number, ratePct = EMI_RATE_DEFAULT, years = EMI_YEARS_DEFAULT): number`
  — the standard reducing-balance EMI formula. With the defaults it returns the exact same value
  the card shows today (behaviour unchanged).
- `amortize(loan: number, ratePct: number, years: number): AmortizationResult` where:

  ```ts
  type AmortizationRow = {
    month: number;          // 1..n
    openingBalance: number;
    emi: number;
    principal: number;      // emi - interest
    interest: number;       // openingBalance * monthlyRate
    closingBalance: number; // clamped to 0 on the final row
  };
  type AmortizationResult = {
    rows: AmortizationRow[];
    emi: number;
    totalInterest: number;
    totalPayable: number;   // emi * n  (loan + totalInterest)
  };
  ```

  The final row's `closingBalance` is forced to exactly 0 to absorb floating-point rounding.

- Edge cases: a zero-interest rate (`ratePct === 0`) uses straight-line `emi = loan / n` and
  `interest = 0` for every row (avoids divide-by-zero in the formula). A zero loan (100% down is
  out of the slider range, but guard anyway) returns an empty/zeroed result without NaNs.

## Page layout — `EmiBreakdown.tsx`

Order top to bottom:

1. **Header row** — vehicle thumbnail + `brand model` + price (`Rs. X,XX,XXX`, existing `npr`
   grouping), and a back link to the vehicle page (`/vehicle/[id]`).

2. **Summary strip** — four large stat tiles, recomputed live:
   - Monthly EMI
   - Down payment (amount + %)
   - Total interest
   - Total payable (down + all EMIs)

3. **Controls** (live recompute of everything):
   - Down payment %: slider, 20–80, step 5, seeded from `?down=`.
   - Loan term: segmented buttons — 3 / 5 / 7 years.
   - Interest rate %: slider, 7–14, step 0.25.

4. **Graph** — a `recharts` stacked area chart over the loan term.
   - x-axis: month (1..n), labelled at year boundaries.
   - Two stacked series that sum to the constant loan amount:
     - **Principal repaid** — cumulative principal, rises from 0 to the loan amount.
     - **Balance remaining** — outstanding balance, falls from the loan amount to 0.
   - The crossover of the two bands shows the point where the loan is half repaid.
   - Hover tooltip surfaces, for that month: EMI, principal, interest, remaining balance.
   - Styled per the dataviz skill: theme-aware colors, accessible contrast, y-axis in short NPR
     (e.g. lakh) units, legend for the two series.
   - The chart container scrolls horizontally on narrow screens; the page body never scrolls
     horizontally.

5. **Schedule table** — every monthly installment (n = 36 / 60 / 84 rows) in a vertically
   scrollable container with a sticky header. Columns: Month · Opening balance · EMI · Principal ·
   Interest · Closing balance. Early rows are interest-heavy, later rows principal-heavy.

All money is formatted with the existing `npr` lakh-grouping helper (extract or reuse; a small
local formatter is acceptable since it is a one-liner).

## Card change — `components/vehicle/VehicleDetail.tsx`

- Import `monthlyEmi` (and constants) from `lib/emi.ts` instead of the local definition; delete
  the local copy. No visual/behaviour change to the card.
- Keep the existing "View Breakdown" button and its 4-row expandable summary unchanged.
- Add, below the quick summary, a link **"Full EMI schedule →"** to
  `/vehicle/${vehicle.id}/emi?down=${downPct}`, styled as a subtle secondary link consistent with
  the card. The `price` prop already exists; thread the vehicle `id` into `EmiCalculator` (add an
  `id` prop) so the link can be built.

## Data flow

```
Vehicle price ──► EmiBreakdown state {downPct, years, ratePct}
                      │
                      ▼
        loan = price * (1 - downPct/100)
                      │
                      ▼
        amortize(loan, ratePct, years)  ──► rows + totals
                      │
        ┌─────────────┼───────────────┐
        ▼             ▼               ▼
   summary strip   area chart     schedule table
```

## Error / edge handling

- Missing vehicle id → `notFound()` (server).
- `?down=` absent/NaN/out-of-range → clamp to 20–80, default 40.
- Zero-interest and zero-loan guards in `amortize` (see math section) — no NaN in the UI.
- Reduced motion: the chart and any transitions respect `prefers-reduced-motion`.

## Testing

Note: the project currently has **no test runner** (package.json has only dev/build/start/lint).
Rather than introduce a full test framework as part of this feature, `lib/emi.ts` is written as a
pure module and verified with a small throwaway Node script (run once during implementation, not
committed) that asserts the cases below; plus manual/visual verification of the page. If the user
prefers a committed test suite, adding Vitest is a separate, easy follow-up.

- `lib/emi.ts` is pure and verifiable. Cover:
  - `monthlyEmi` with defaults matches the pre-refactor value for a known price (regression).
  - `amortize`: `rows.length === years * 12`; final `closingBalance === 0`; sum of `principal`
    ≈ loan; sum of `interest` ≈ `totalInterest`; every `emi` equal (within rounding).
  - Zero-interest case: `interest === 0` each row, `principal === loan / n`.
- Manual/visual verification of the page: controls recompute the strip, graph, and table; graph
  tooltip is correct; table has the right row count; back link and card link work; layout holds
  on narrow screens (no horizontal body scroll).

## Files touched

- **New:** `app/vehicle/[id]/emi/page.tsx`
- **New:** `components/vehicle/EmiBreakdown.tsx`
- **New:** `lib/emi.ts`
- **New (tests):** `lib/emi.test.ts` (or the project's test convention)
- **Edited:** `components/vehicle/VehicleDetail.tsx` (import shared math; add page link; pass `id`)
