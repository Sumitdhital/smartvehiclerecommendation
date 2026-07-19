// Shared formatting + finance helpers for the vehicle detail page.

/** Lakh-style grouping used across Nepali listings: Rs. 41,15,000 */
export const npr = (n: number) => `Rs. ${Math.round(n).toLocaleString("en-IN")}`;

/** EV motor output in kW derived from the PS figure stored in the DB. */
export const psToKw = (ps: number) => Math.round(ps * 0.7355);

// Flat 8.5% for 5 years — the assumptions the hero EMI calculator displays.
export const EMI_RATE = 8.5;
export const EMI_YEARS = 5;

// Interactive EMI-calculator bounds (mirrors the reference sliders/stepper).
export const EMI_MIN_RATE = 5;
export const EMI_MAX_RATE = 20;
export const EMI_RATE_STEP = 0.5;
export const EMI_MIN_DOWN_PCT = 20;
export const EMI_MAX_DOWN_PCT = 80;
export const EMI_DEFAULT_DOWN_PCT = 40;
export const EMI_MIN_YEARS = 1;
export const EMI_MAX_YEARS = 7;

/**
 * Reducing-balance EMI for an arbitrary loan / annual rate (%) / term in months:
 *   emi = L·r·(1+r)^n / ((1+r)^n − 1),  r = rate/1200
 * A zero rate degrades gracefully to straight-line repayment.
 */
export function emiMonthly(loan: number, annualRatePct: number, months: number): number {
  if (loan <= 0 || months <= 0) return 0;
  const r = annualRatePct / 1200;
  if (r === 0) return loan / months;
  const f = Math.pow(1 + r, months);
  return loan * ((r * f) / (f - 1));
}

/** Standard reducing-balance EMI for a loan at EMI_RATE over EMI_YEARS. */
export function monthlyEmi(loan: number): number {
  return emiMonthly(loan, EMI_RATE, EMI_YEARS * 12);
}

export interface EmiYearRow {
  /** 1-based loan year. */
  year: number;
  /** Total paid across the 12 months of this year (12 × monthly EMI). */
  totalPayment: number;
  /** Principal repaid during the year. */
  principal: number;
  /** Interest paid during the year. */
  interest: number;
  /** Remaining principal at year end (final year ends at 0). */
  balance: number;
}

export interface EmiComputation {
  down: number;
  loan: number;
  /** Rounded monthly EMI — every downstream total is derived from this so the
   *  displayed figures reconcile exactly with the year-wise table. */
  emi: number;
  months: number;
  years: number;
  totalInterest: number;
  /** Down payment + every EMI over the full term. */
  totalPayment: number;
  rows: EmiYearRow[];
}

/**
 * Full amortization for the calculator/breakdown modals. Uses the rounded
 * monthly EMI throughout (matching the reference screenshots), aggregates the
 * schedule into whole-year rows, and forces the final balance to exactly 0 to
 * absorb sub-rupee float drift.
 */
export function computeEmi(
  price: number,
  downPct: number,
  annualRatePct: number,
  years: number
): EmiComputation {
  const down = price * (downPct / 100);
  const loan = Math.max(0, price - down);
  const months = years * 12;
  const emi = Math.round(emiMonthly(loan, annualRatePct, months));
  const r = annualRatePct / 1200;

  const rows: EmiYearRow[] = [];
  let balance = loan;
  for (let y = 1; y <= years; y++) {
    let principalYear = 0;
    let interestYear = 0;
    for (let m = 0; m < 12; m++) {
      const interestM = balance * r;
      let principalM = emi - interestM;
      if (principalM > balance) principalM = balance;
      balance -= principalM;
      principalYear += principalM;
      interestYear += interestM;
    }
    if (y === years) balance = 0; // absorb float drift on the final row
    rows.push({
      year: y,
      totalPayment: emi * 12,
      principal: principalYear,
      interest: interestYear,
      balance,
    });
  }

  const totalInterest = emi * months - loan;
  const totalPayment = down + emi * months;

  return { down, loan, emi, months, years, totalInterest, totalPayment, rows };
}

/** Deterministic small hash of a string — used to seed stable review data. */
export function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}
