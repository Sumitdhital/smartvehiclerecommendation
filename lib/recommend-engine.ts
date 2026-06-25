import { calculateNepalOnRoadPrice } from "./tax-engine";

export interface FilterParams {
  budget: number;
  type?: string;
  fuel?: string;
  seatingMin?: number;
  brands?: string[];
  usage?: "city" | "highway" | "mixed";
}

export function filterAndScoreVehicles(vehicles: any[], params: FilterParams) {
  // 1. Hard Constraints Filtering
  let candidates = vehicles.filter((v) => {
    // We assume the DB has basic ex-showroom price, so we calculate the On-Road price for accurate budget matching
    const taxInfo = calculateNepalOnRoadPrice({
      category: v.type === 'Electric' ? 'EV' : 'ICE_' + v.type, // simplified logic
      engineCc: v.engine_cc || 0,
      basePriceNPR: v.price
    });
    const onRoadPrice = taxInfo.totalOnRoadPrice;

    if (onRoadPrice > params.budget) return false;
    if (params.type && v.type !== params.type) return false;
    if (params.fuel && v.fuel !== params.fuel) return false;
    if (params.seatingMin && v.seating_capacity < params.seatingMin) return false;
    if (params.brands && params.brands.length > 0 && !params.brands.includes(v.brand)) return false;

    // Attach calculated price for scoring
    v.calculatedOnRoadPrice = onRoadPrice;
    v.taxBreakdown = taxInfo;

    return true;
  });

  // 2. Scoring Mechanism
  candidates = candidates.map((v) => {
    let score = 0;

    // Price fit: prefer vehicles that are close to the budget but not too far below
    // e.g., 80-100% of budget gets high score
    const priceRatio = v.calculatedOnRoadPrice / params.budget;
    if (priceRatio > 0.8 && priceRatio <= 1) score += 30;
    else if (priceRatio > 0.6) score += 20;
    else score += 10;

    // Mileage / Usage score
    if (v.mileage) {
      if (params.usage === "city" && v.mileage > 15) score += 20;
      else if (params.usage === "highway" && v.mileage > 18) score += 20;
      else score += 10;
    }

    // Feature density (simple proxy using the length of key_features array if exists)
    if (v.key_features && Array.isArray(v.key_features)) {
      score += Math.min(v.key_features.length * 2, 20); // max 20 points
    }

    // Safety rating
    if (v.safety_rating) {
      score += v.safety_rating * 4; // up to 20 points
    }

    v.score = score;
    return v;
  });

  // Sort by score descending
  candidates.sort((a, b) => b.score - a.score);

  // Return Top 10 for Claude to analyze
  return candidates.slice(0, 10);
}
