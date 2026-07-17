import { NextResponse } from 'next/server';
import { getVehicles } from '@/lib/vehicles-db';
import { calculateNepalOnRoadPrice } from '@/lib/tax-engine';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      budget, 
      brand, 
      searchTerm,
      showDiscountedOnly,
      sortBy
    } = body;

    // Validate budget
    const budgetMax = budget ? Number(budget) : undefined;

    // Fetch filtered list from local mock DB
    const list = getVehicles({
      budgetMax,
      brand,
      searchTerm,
      showDiscountedOnly,
      sortBy
    });

    const recommendations = list.map((vehicle, index) => {
      // Calculate taxes on road
      const taxInfo = calculateNepalOnRoadPrice({
        category: vehicle.isEV ? 'EV' : 'ICE_' + vehicle.type,
        // EV brackets key off battery kWh; ICE brackets key off engine CC.
        engineCc: vehicle.isEV ? (vehicle.batteryKwh || 0) : (vehicle.engineCc || 0),
        basePriceNPR: vehicle.price
      });

      let reason = `This ${vehicle.brand} ${vehicle.model} is a solid pick for a budget of Rs. ${(budgetMax ? budgetMax / 100000 : vehicle.price / 100000).toFixed(1)} Lakhs.`;
      if (vehicle.isEV) {
        reason += " It benefits from lower EV taxes in Nepal.";
      }
      if (vehicle.groundClearance && vehicle.groundClearance >= 175) {
        reason += " Its high ground clearance makes it perfect for Nepali road conditions.";
      }

      return {
        ...vehicle,
        calculatedOnRoadPrice: taxInfo.totalOnRoadPrice,
        taxBreakdown: taxInfo,
        ai_explanation: reason,
        rank: index + 1
      };
    });

    return NextResponse.json({
      recommendations
    });
    
  } catch (error) {
    console.error("Recommendation API Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
