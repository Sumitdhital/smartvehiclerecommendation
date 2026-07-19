# Compare suggestions: similar-price-range default

**Date:** 2026-07-17
**Status:** Approved

## Problem

On the vehicle detail page, the default compare rivals are picked by same fuel → same brand first → closest price (`app/vehicle/[id]/page.tsx:22-30`). Same-brand priority means a brand-mate at twice the price can outrank a near-identical-priced competitor. The default compare list should be driven by price similarity.

## Design

Server-side change only, in `app/vehicle/[id]/page.tsx`. No changes to `VehicleDetail.tsx`, data, or UI.

1. Keep the existing filter: exclude self, same fuel type.
2. Define the price band as `[vehicle.price × 0.8, vehicle.price × 1.2]` (±20%).
3. Rank candidates: in-band cars first, then out-of-band cars; within each group, sort by absolute price distance from the subject vehicle. Take the top 4.
4. Drop the same-brand-first priority — price distance is the primary signal.

This yields strict price-range filtering when ≥4 cars fall in the band, and graceful fill with the next-closest-priced cars when the band is sparse (cheapest/most expensive vehicles), so the compare section always shows up to 4 rivals.

## Testing

- Mid-priced EV: all 4 rivals within ±20% of its price.
- Cheapest and most expensive vehicles: band sparse → list filled to 4 with closest-priced cars, sorted band-members first.
- Vehicle with no same-fuel rivals: section hides (existing behavior, unchanged).
