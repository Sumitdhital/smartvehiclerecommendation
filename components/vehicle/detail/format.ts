// Shared formatting + finance helpers for the vehicle detail page.

/** Lakh-style grouping used across Nepali listings: Rs. 41,15,000 */
export const npr = (n: number) => `Rs. ${Math.round(n).toLocaleString("en-IN")}`;

/** EV motor output in kW derived from the PS figure stored in the DB. */
export const psToKw = (ps: number) => Math.round(ps * 0.7355);

// Flat 8.5% for 5 years — the assumptions the hero EMI calculator displays.
export const EMI_RATE = 8.5;
export const EMI_YEARS = 5;

/** Standard reducing-balance EMI for a loan at EMI_RATE over EMI_YEARS. */
export function monthlyEmi(loan: number): number {
  const r = EMI_RATE / 12 / 100;
  const n = EMI_YEARS * 12;
  const f = Math.pow(1 + r, n);
  return loan * ((r * f) / (f - 1));
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
