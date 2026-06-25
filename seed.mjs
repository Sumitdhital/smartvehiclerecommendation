import { createClient } from '@supabase/supabase-js';

const mockVehicles = [
  {
    brand: "Wuling",
    model: "Air EV",
    variant: "Standard Range",
    type: "Hatchback",
    fuel: "Electric",
    engine_cc: 30, // 30 kW
    horsepower: 40,
    torque: 110,
    mileage: 200, // Range
    seating_capacity: 4,
    transmission: "Automatic",
    ground_clearance: 155,
    price: 1500000, // Base Price 15 Lakhs. EV Taxes are 10% Customs.
    boot_space: 0,
    safety_rating: 2,
    key_features: ["Compact Size", "Easy Parking", "Regenerative Braking"],
  },
  {
    brand: "Renault",
    model: "Kwid",
    variant: "RXL",
    type: "Hatchback",
    fuel: "Petrol",
    engine_cc: 999,
    horsepower: 67,
    torque: 91,
    mileage: 22,
    seating_capacity: 5,
    transmission: "Manual",
    ground_clearance: 184,
    price: 900000, // Base Price 9 Lakhs. Ice taxes will push it to ~25-30 Lakhs
    boot_space: 279,
    safety_rating: 1,
    key_features: ["High Ground Clearance", "Digital Cluster", "Affordable"],
  },
  {
    brand: "Tata",
    model: "Tiago",
    variant: "XT",
    type: "Hatchback",
    fuel: "Petrol",
    engine_cc: 1199,
    horsepower: 86,
    torque: 113,
    mileage: 19,
    seating_capacity: 5,
    transmission: "Manual",
    ground_clearance: 170,
    price: 1100000, 
    boot_space: 242,
    safety_rating: 4,
    key_features: ["Harmon Kardon Audio", "Safe Build", "Peppy Engine"],
  },
  {
    brand: "MG",
    model: "Comet EV",
    variant: "Plush",
    type: "Hatchback",
    fuel: "Electric",
    engine_cc: 42, // 42 kW
    horsepower: 41,
    torque: 110,
    mileage: 230,
    seating_capacity: 4,
    transmission: "Automatic",
    ground_clearance: 164,
    price: 1800000, 
    boot_space: 0,
    safety_rating: 3,
    key_features: ["Dual Screens", "Connected Car Tech", "Keyless Entry"],
  }
];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    console.log("Seeding to:", supabaseUrl);
    const { data, error } = await supabase.from('vehicles').insert(mockVehicles).select();
    if (error) {
        console.error("Error inserting data:", error);
    } else {
        console.log("Successfully inserted", data.length, "vehicles.");
    }
}

seed();
