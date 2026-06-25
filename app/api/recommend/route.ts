import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { filterAndScoreVehicles, FilterParams } from '@/lib/recommend-engine';

// Mock data for fixed algorithm mode
const mockVehicles = [
  {
    id: "uuid-1",
    brand: "Hyundai",
    model: "Creta",
    variant: "SX(O)",
    type: "SUV",
    fuel: "Petrol",
    engine_cc: 1497,
    horsepower: 115,
    torque: 144,
    mileage: 16.8,
    seating_capacity: 5,
    transmission: "Automatic",
    ground_clearance: 190,
    price: 6000000,
    boot_space: 433,
    safety_rating: 3,
    key_features: ["Sunroof", "Touchscreen", "Ventilated Seats"],
  },
  {
    id: "uuid-2",
    brand: "BYD",
    model: "Atto 3",
    variant: "Superior",
    type: "SUV",
    fuel: "Electric",
    engine_cc: 150, // 150 kW
    horsepower: 201,
    torque: 310,
    mileage: 480, // Range
    seating_capacity: 5,
    transmission: "Automatic",
    ground_clearance: 175,
    price: 6588000,
    boot_space: 440,
    safety_rating: 5,
    key_features: ["ADAS", "Rotatable Screen", "Panoramic Sunroof"],
  },
  {
    id: "uuid-3",
    brand: "Tata",
    model: "Nexon",
    variant: "Creative+",
    type: "SUV",
    fuel: "Petrol",
    engine_cc: 1199,
    horsepower: 120,
    torque: 170,
    mileage: 17.1,
    seating_capacity: 5,
    transmission: "Manual",
    ground_clearance: 208,
    price: 4500000,
    boot_space: 382,
    safety_rating: 5,
    key_features: ["Touchscreen", "Digital Cluster", "Six Airbags"],
  },
  {
    id: "uuid-4",
    brand: "Suzuki",
    model: "Swift",
    variant: "ZXI+",
    type: "Hatchback",
    fuel: "Petrol",
    engine_cc: 1197,
    horsepower: 89,
    torque: 113,
    mileage: 22.3,
    seating_capacity: 5,
    transmission: "Manual",
    ground_clearance: 163,
    price: 3600000,
    boot_space: 268,
    safety_rating: 2,
    key_features: ["Auto AC", "Touchscreen", "Alloy Wheels"],
  }
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      budget, 
      type, 
      fuel, 
      seatingMin, 
      brands, 
      usage,
      userId
    } = body;

    // Validate minimum required fields
    if (!budget) {
      return NextResponse.json({ error: 'Budget is required' }, { status: 400 });
    }

    const params: FilterParams = {
      budget: Number(budget),
      type,
      fuel,
      seatingMin: Number(seatingMin) || undefined,
      brands,
      usage
    };

    let allVehicles = [];

    // Attempt to fetch from Supabase if keys are provided
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase.from('vehicles').select('*');
      if (!error && data) {
        allVehicles = data;
      }
    }

    // Fallback to mock data if DB is empty or unconfigured
    if (allVehicles.length === 0) {
      allVehicles = mockVehicles;
    }

    // 2. Rule-based Filter and Score (Fixed Algorithm)
    const topCandidates = filterAndScoreVehicles(allVehicles, params);

    if (topCandidates.length === 0) {
      return NextResponse.json({ 
        recommendations: [],
        message: 'No vehicles found matching your criteria.' 
      });
    }

    // 3. Skip Claude AI and use fixed reasoning algorithm for now
    const finalRecommendations = topCandidates.map((vehicle, index) => {
      // Fixed algorithm reasoning based on params
      let reason = `This ${vehicle.brand} ${vehicle.model} is an excellent choice for a budget of NPR ${(params.budget / 100000).toFixed(1)} Lakhs.`;
      
      if (vehicle.fuel === 'Electric') {
        reason += " It benefits from lower EV taxes in Nepal.";
      }
      
      if (params.usage === 'highway' && vehicle.ground_clearance >= 190) {
        reason += " Its high ground clearance makes it perfect for Nepali highway conditions.";
      } else if (params.usage === 'city' && vehicle.type === 'Hatchback') {
        reason += " Its compact size is ideal for city traffic and parking.";
      }

      return {
        ...vehicle,
        ai_explanation: reason,
        rank: index + 1
      };
    });

    // 4. Asynchronously log the search history if a user is logged in
    if (userId && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const supabase = getSupabaseAdmin();
      supabase.from('search_history').insert({
        user_id: userId,
        query_params: params,
        recommended_vehicle_ids: finalRecommendations.map(r => r.id)
      }).then(({error}) => {
        if(error) console.error("Failed to save search history", error);
      });
    }

    return NextResponse.json({
      recommendations: finalRecommendations
    });
    
  } catch (error) {
    console.error("Recommendation API Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
