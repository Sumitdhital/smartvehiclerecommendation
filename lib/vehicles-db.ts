import {
  Vehicle,
  UsedListing,
  FilterParams,
  VehicleCategory,
  VehicleType,
  FuelType,
  TransmissionType,
} from './types';
import { supabase } from './supabase';

// Let's create an extended interface for our app's mock data requirements
export interface ExtendedVehicle extends Vehicle {
  usedCount?: number;
  hasDiscount?: boolean;
  dimensions?: string;
  driveType?: string;
  totalAirbags?: number;
  torqueLabel?: string;
  /** Supabase auth user that owns this row (dealer / individual). */
  ownerId?: string;
  /** Sold cars stay browsable but can no longer be booked for a test drive. */
  sold?: boolean;
}

export const VEHICLES: ExtendedVehicle[] = [
  {
    id: "byd-dolphin",
    brand: "BYD",
    brandSlug: "byd",
    model: "Dolphin",
    variant: "Premium",
    slug: "byd-dolphin-premium",
    category: "car",
    type: "Hatchback",
    fuel: "Electric",
    batteryKwh: 44.9,
    rangeKm: 340,
    horsepower: 95,
    torque: 180,
    seatingCapacity: 5,
    transmission: "Automatic",
    groundClearance: 175,
    price: 4115000,
    bootSpace: 345,
    safetyRating: 5,
    keyFeatures: ["Rotatable Screen", "ADAS", "Regenerative Braking", "LED Headlights"],
    images: ["/images/byd_dolphin.png"],
    colors: ["Skiing Blue", "Coral Pink", "Mulan Purple"],
    isEV: true,
    isFeatured: true,
    yearLaunched: 2023,
    description: "Compact premium EV hatchback from BYD.",
    usedCount: 11,
    dimensions: "4290 x 1770 x 1570 mm",
    driveType: "FWD",
    totalAirbags: 6
  },
  {
    id: "byd-atto1",
    brand: "BYD",
    brandSlug: "byd",
    model: "Atto 1",
    variant: "Premium",
    slug: "byd-atto-1-premium",
    category: "car",
    type: "SUV",
    fuel: "Electric",
    batteryKwh: 38.88,
    rangeKm: 300,
    horsepower: 100,
    torque: 180,
    seatingCapacity: 5,
    transmission: "Automatic",
    groundClearance: 170,
    price: 3375000,
    bootSpace: 380,
    safetyRating: 5,
    keyFeatures: ["Compact SUV layout", "Blade Battery", "Touchscreen Navigation"],
    images: ["/images/byd_atto1.png"],
    colors: ["Skiing Blue", "Grey", "White"],
    isEV: true,
    isFeatured: true,
    yearLaunched: 2024,
    description: "Sub-compact EV SUV from BYD.",
    usedCount: 1,
    dimensions: "4100 x 1780 x 1600 mm",
    driveType: "FWD",
    totalAirbags: 6
  },
  {
    id: "byd-atto3",
    brand: "BYD",
    brandSlug: "byd",
    model: "Atto 3",
    variant: "Superior",
    slug: "byd-atto-3-superior",
    category: "car",
    type: "SUV",
    fuel: "Electric",
    batteryKwh: 60.48,
    rangeKm: 420,
    horsepower: 201,
    torque: 310,
    seatingCapacity: 5,
    transmission: "Automatic",
    groundClearance: 175,
    price: 6780000,
    bootSpace: 440,
    safetyRating: 5,
    keyFeatures: ["Panoramic Sunroof", "ADAS", "Voice Assistant", "NFC Card Key"],
    images: ["/images/byd_atto3.png"],
    colors: ["Surf Blue", "Boulder Grey", "Skiing White"],
    isEV: true,
    isFeatured: true,
    yearLaunched: 2022,
    description: "Best-selling premium electric SUV in Nepal.",
    usedCount: 20,
    dimensions: "4455 x 1875 x 1615 mm",
    driveType: "FWD",
    totalAirbags: 7
  },
  {
    id: "byd-seal",
    brand: "BYD",
    brandSlug: "byd",
    model: "Seal",
    variant: "Performance",
    slug: "byd-seal-performance",
    category: "car",
    type: "Sedan",
    fuel: "Electric",
    batteryKwh: 82.56,
    rangeKm: 570,
    horsepower: 530,
    torque: 670,
    seatingCapacity: 5,
    transmission: "Automatic",
    groundClearance: 145,
    price: 10500000,
    bootSpace: 400,
    safetyRating: 5,
    keyFeatures: ["0-100 km/h in 3.8s", "AWD Performance", "Dynaudio sound system"],
    images: ["/images/byd_seal.png"],
    colors: ["Aurora White", "Shadow Green", "Space Grey"],
    isEV: true,
    isFeatured: true,
    yearLaunched: 2024,
    description: "High-performance EV sedan matching sports car dynamics.",
    usedCount: 0,
    dimensions: "4800 x 1875 x 1460 mm",
    driveType: "AWD",
    totalAirbags: 9
  },
  {
    id: "citroen-ec3",
    brand: "Citroen",
    brandSlug: "citroen",
    model: "E-C3",
    variant: "Shine",
    slug: "citroen-ec3-shine",
    category: "car",
    type: "Hatchback",
    fuel: "Electric",
    batteryKwh: 29.2,
    rangeKm: 320,
    horsepower: 57,
    torque: 143,
    seatingCapacity: 5,
    transmission: "Automatic",
    groundClearance: 170,
    price: 3599000,
    bootSpace: 315,
    safetyRating: 3,
    keyFeatures: ["Comfort suspension", "10-inch Touchscreen", "Quick charging support"],
    images: ["/images/citroen_ec3.png"],
    colors: ["Polar White", "Zesty Orange", "Steel Grey"],
    isEV: true,
    isFeatured: false,
    yearLaunched: 2023,
    description: "French-designed comfortable urban EV hatchback.",
    usedCount: 3,
    dimensions: "3981 x 1733 x 1604 mm",
    driveType: "FWD",
    totalAirbags: 2
  },
  {
    id: "kia-ev9",
    brand: "KIA",
    brandSlug: "kia",
    model: "EV9",
    variant: "GT-Line",
    slug: "kia-ev9-gt-line",
    category: "car",
    type: "SUV",
    fuel: "Electric",
    batteryKwh: 77.4,
    rangeKm: 512,
    horsepower: 384,
    torque: 700,
    seatingCapacity: 7,
    transmission: "Automatic",
    groundClearance: 198,
    price: 17990000,
    bootSpace: 820,
    safetyRating: 5,
    keyFeatures: ["3-row seating", "Swivel Seats", "Dual Sunroof", "800V Architecture"],
    images: ["/images/kia_ev9.png"],
    colors: ["Ocean Blue", "Pebble Grey", "Aurora Black"],
    isEV: true,
    isFeatured: true,
    yearLaunched: 2024,
    description: "Flagship 3-row electric SUV with luxury appointments.",
    usedCount: 0,
    dimensions: "5010 x 1980 x 1755 mm",
    driveType: "AWD",
    totalAirbags: 10
  },
  {
    id: "tata-punch-ev",
    brand: "Tata",
    brandSlug: "tata",
    model: "Punch EV",
    variant: "Empowered+ S MR",
    slug: "tata-punch-ev-empowered",
    category: "car",
    type: "SUV",
    fuel: "Electric",
    batteryKwh: 25.0,
    rangeKm: 315,
    horsepower: 80,
    torque: 114,
    seatingCapacity: 5,
    transmission: "Automatic",
    groundClearance: 190,
    price: 3499000,
    bootSpace: 366,
    safetyRating: 5,
    keyFeatures: ["High stance", "Sunroof", "Ventilated Seats", "360 Camera"],
    images: ["/images/tata_punch_ev.png"],
    colors: ["Empowered Oxide", "Seawood Green", "Pristine White"],
    isEV: true,
    isFeatured: true,
    yearLaunched: 2024,
    description: "Tata's subcompact EV SUV built on dedicated acti.ev architecture.",
    usedCount: 0,
    dimensions: "3857 x 1742 x 1619 mm",
    driveType: "FWD",
    totalAirbags: 6
  },
  {
    id: "xpeng-g6",
    brand: "XPENG",
    brandSlug: "xpeng",
    model: "G6",
    variant: "Performance",
    slug: "xpeng-g6-performance",
    category: "car",
    type: "SUV",
    fuel: "Electric",
    batteryKwh: 66.0,
    rangeKm: 435,
    horsepower: 258,
    torque: 440,
    seatingCapacity: 5,
    transmission: "Automatic",
    groundClearance: 180,
    price: 8499000,
    bootSpace: 571,
    safetyRating: 5,
    keyFeatures: ["800V Charging", "XPILOT 4.0 ADAS", "Frameless Doors"],
    images: ["/images/xpeng_g6.png"],
    colors: ["Silver", "White", "Orange"],
    isEV: true,
    isFeatured: true,
    yearLaunched: 2024,
    description: "Ultra-smart electric SUV coupe.",
    usedCount: 0,
    dimensions: "4753 x 1920 x 1650 mm",
    driveType: "RWD",
    totalAirbags: 6
  },
  {
    id: "tata-tiago-ev",
    brand: "Tata",
    brandSlug: "tata",
    model: "Tiago EV",
    variant: "XZ+ Tech LUX",
    slug: "tata-tiago-ev-xz",
    category: "car",
    type: "Hatchback",
    fuel: "Electric",
    batteryKwh: 24.0,
    rangeKm: 315,
    horsepower: 74,
    torque: 114,
    seatingCapacity: 5,
    transmission: "Automatic",
    groundClearance: 165,
    price: 2899000,
    bootSpace: 240,
    safetyRating: 4,
    keyFeatures: ["Harman Audio", "Leatherette Seats", "Auto Headlamps"],
    images: ["/images/tata_tiago_ev.png"],
    colors: ["Teal Blue", "Daytona Grey", "Tropical Mist"],
    isEV: true,
    isFeatured: false,
    yearLaunched: 2023,
    description: "Nepal's most popular entry-level EV hatchback.",
    usedCount: 14,
    dimensions: "3769 x 1677 x 1536 mm",
    driveType: "FWD",
    totalAirbags: 2
  },
  {
    id: "tata-nexon-ev",
    brand: "Tata",
    brandSlug: "tata",
    model: "Nexon EV",
    variant: "Empowered + LR",
    slug: "tata-nexon-ev-empowered",
    category: "car",
    type: "SUV",
    fuel: "Electric",
    batteryKwh: 40.5,
    rangeKm: 465,
    horsepower: 143,
    torque: 215,
    seatingCapacity: 5,
    transmission: "Automatic",
    groundClearance: 190,
    price: 4099000,
    bootSpace: 350,
    safetyRating: 5,
    keyFeatures: ["V2L/V2V Charging", "12.3-inch Cinematic screen", "360 camera"],
    images: ["/images/tata_nexon_ev.png"],
    colors: ["Intense Teal", "Empowered Oxide", "Pristine White"],
    isEV: true,
    isFeatured: false,
    yearLaunched: 2023,
    description: "Highly popular electric SUV with advanced V2L features.",
    usedCount: 22,
    dimensions: "3994 x 1811 x 1616 mm",
    driveType: "FWD",
    totalAirbags: 6
  },
  {
    id: "wuling-bingo",
    brand: "Wuling",
    brandSlug: "wuling",
    model: "Bingo",
    variant: "Standard",
    slug: "wuling-bingo-standard",
    category: "car",
    type: "Hatchback",
    fuel: "Electric",
    batteryKwh: 31.9,
    rangeKm: 333,
    horsepower: 68,
    torque: 150,
    seatingCapacity: 4,
    transmission: "Automatic",
    groundClearance: 150,
    price: 3099000,
    bootSpace: 310,
    safetyRating: 4,
    keyFeatures: ["Retro Design", "Twin Screens", "Spacious Cabin"],
    images: ["/images/wuling_bingo.png"],
    colors: ["Breeze Blue", "Milk Coffee", "Aurora Green"],
    isEV: true,
    isFeatured: false,
    yearLaunched: 2024,
    description: "Charming retro-modern electric hatchback.",
    usedCount: 0,
    dimensions: "3950 x 1708 x 1580 mm",
    driveType: "FWD",
    totalAirbags: 4
  },
  {
    id: "seres-3",
    brand: "Seres",
    brandSlug: "seres",
    model: "Seres 3",
    variant: "Comfort",
    slug: "seres-3-comfort",
    category: "car",
    type: "SUV",
    fuel: "Electric",
    batteryKwh: 52.7,
    rangeKm: 405,
    horsepower: 161,
    torque: 300,
    seatingCapacity: 5,
    transmission: "Automatic",
    groundClearance: 180,
    price: 4999000,
    bootSpace: 380,
    safetyRating: 5,
    keyFeatures: ["Panoramic sunroof", "Dashcam built-in", "Electric seats"],
    images: ["/images/seres_3.png"],
    colors: ["Black", "White", "Blue"],
    isEV: true,
    isFeatured: false,
    yearLaunched: 2021,
    description: "Competitively priced mid-sized electric SUV.",
    usedCount: 5,
    dimensions: "4385 x 1850 x 1650 mm",
    driveType: "FWD",
    totalAirbags: 6
  },
  {
    id: "baw-e7-pro",
    brand: "BAW",
    brandSlug: "baw",
    model: "E7 Pro",
    variant: "Standard",
    slug: "baw-e7-pro",
    category: "car",
    type: "Hatchback",
    fuel: "Electric",
    batteryKwh: 22.29,
    rangeKm: 260,
    horsepower: 40,
    torque: 100,
    torqueLabel: "N/A",
    seatingCapacity: 4,
    transmission: "Automatic",
    groundClearance: 150,
    price: 1599000,
    bootSpace: 200,
    safetyRating: 3,
    keyFeatures: ["Compact Footprint", "Affordable pricing", "Touchscreen Console"],
    images: ["/images/baw_e7_pro.png"],
    colors: ["Mint Green", "Sky Blue", "Cream White"],
    isEV: true,
    isFeatured: false,
    yearLaunched: 2024,
    description: "Highly budget-friendly commuter EV.",
    usedCount: 0,
    dimensions: "3500 x 1500 x 1600 mm",
    driveType: "RWD",
    totalAirbags: 2
  },
  {
    id: "avatr-11",
    brand: "Avatr",
    brandSlug: "avatr",
    model: "Avatr 11",
    variant: "Luxury",
    slug: "avatr-11-luxury",
    category: "car",
    type: "SUV",
    fuel: "Electric",
    batteryKwh: 116.0,
    rangeKm: 680,
    horsepower: 313,
    torque: 370,
    seatingCapacity: 5,
    transmission: "Automatic",
    groundClearance: 170,
    price: 16000000,
    bootSpace: 450,
    safetyRating: 5,
    keyFeatures: ["Huawei Inside OS", "Triple screen display", "Unique design styling"],
    images: ["/images/avatr_11.png"],
    colors: ["White", "Green", "Grey"],
    isEV: true,
    isFeatured: true,
    yearLaunched: 2023,
    description: "Premium luxury crossover EV coupe featuring smart tech by Huawei.",
    usedCount: 0,
    dimensions: "4880 x 1970 x 1601 mm",
    driveType: "RWD",
    totalAirbags: 8
  },
  {
    id: "byd-atto2",
    brand: "BYD",
    brandSlug: "byd",
    model: "Atto 2",
    variant: "Standard",
    slug: "byd-atto-2-standard",
    category: "car",
    type: "SUV",
    fuel: "Electric",
    batteryKwh: 51.13,
    rangeKm: 345,
    horsepower: 136,
    torque: 210,
    seatingCapacity: 5,
    transmission: "Automatic",
    groundClearance: 175,
    price: 4899000,
    bootSpace: 360,
    safetyRating: 5,
    keyFeatures: ["Compact SUV", "Rotating screen", "Blade battery"],
    images: ["/images/byd_atto2.png"],
    colors: ["White", "Grey", "Blue"],
    isEV: true,
    isFeatured: false,
    yearLaunched: 2024,
    description: "Mid-tier compact SUV from BYD.",
    usedCount: 2,
    dimensions: "4310 x 1830 x 1675 mm",
    driveType: "FWD",
    totalAirbags: 6
  },

  // ── Petrol Cars ────────────────────────────────────────────────────────────
  {
    id: "toyota-fortuner-petrol",
    brand: "Toyota",
    brandSlug: "toyota",
    model: "Fortuner",
    variant: "2.7 Petrol AT",
    slug: "toyota-fortuner-petrol",
    category: "car",
    type: "SUV",
    fuel: "Petrol",
    rangeKm: 600,
    horsepower: 163,
    torque: 245,
    seatingCapacity: 7,
    transmission: "Automatic",
    groundClearance: 221,
    price: 9500000,
    bootSpace: 555,
    safetyRating: 5,
    keyFeatures: ["4x4 Drive", "Cruise Control", "Leather Seats", "7 Seater"],
    images: ["/images/fortuner.png"],
    colors: ["White", "Silver", "Black"],
    isEV: false,
    isFeatured: true,
    yearLaunched: 2023,
    description: "Nepal's most popular petrol SUV with legendary reliability and 4×4 capability.",
    dimensions: "4795 x 1855 x 1835 mm",
    driveType: "4WD",
    totalAirbags: 7
  },
  {
    id: "honda-city-petrol",
    brand: "Honda",
    brandSlug: "honda",
    model: "City",
    variant: "1.5 V CVT",
    slug: "honda-city-petrol",
    category: "car",
    type: "Sedan",
    fuel: "Petrol",
    rangeKm: 650,
    horsepower: 119,
    torque: 145,
    seatingCapacity: 5,
    transmission: "Automatic",
    groundClearance: 165,
    price: 3850000,
    bootSpace: 519,
    safetyRating: 5,
    keyFeatures: ["Honda Sensing", "LaneWatch", "Paddle Shifters", "Apple CarPlay"],
    images: ["/images/honda_city.png"],
    colors: ["White", "Red", "Silver", "Blue"],
    isEV: false,
    isFeatured: true,
    yearLaunched: 2023,
    description: "Nepal's best-selling petrol sedan — refined, fuel-efficient, and packed with features.",
    dimensions: "4553 x 1748 x 1467 mm",
    driveType: "FWD",
    totalAirbags: 6
  },
  {
    id: "suzuki-swift-petrol",
    brand: "Suzuki",
    brandSlug: "suzuki",
    model: "Swift",
    variant: "1.2 CVT",
    slug: "suzuki-swift-petrol",
    category: "car",
    type: "Hatchback",
    fuel: "Petrol",
    rangeKm: 700,
    horsepower: 82,
    torque: 107,
    seatingCapacity: 5,
    transmission: "Automatic",
    groundClearance: 163,
    price: 2750000,
    bootSpace: 268,
    safetyRating: 4,
    keyFeatures: ["Dual Airbags", "ABS", "Rear Camera", "Alloy Wheels"],
    images: ["/images/suzuki_swift.png"],
    colors: ["Red", "White", "Blue", "Grey"],
    isEV: false,
    isFeatured: false,
    yearLaunched: 2024,
    description: "Affordable and zippy petrol hatchback — perfect for city commuting in Nepal.",
    dimensions: "3860 x 1735 x 1495 mm",
    driveType: "FWD",
    totalAirbags: 2
  },
  {
    id: "hyundai-creta-petrol",
    brand: "Hyundai",
    brandSlug: "hyundai",
    model: "Creta",
    variant: "1.5 SX IVT",
    slug: "hyundai-creta-petrol",
    category: "car",
    type: "SUV",
    fuel: "Petrol",
    rangeKm: 580,
    horsepower: 115,
    torque: 144,
    seatingCapacity: 5,
    transmission: "Automatic",
    groundClearance: 190,
    price: 4750000,
    bootSpace: 433,
    safetyRating: 5,
    keyFeatures: ["10.25\" Touchscreen", "Sunroof", "BlueLink Connected", "6 Airbags"],
    images: ["/images/hyundai_creta.png"],
    colors: ["White", "Grey", "Red", "Black"],
    isEV: false,
    isFeatured: true,
    yearLaunched: 2024,
    description: "Feature-loaded petrol compact SUV — the go-to choice for Nepali families.",
    dimensions: "4300 x 1790 x 1635 mm",
    driveType: "FWD",
    totalAirbags: 6
  },
  {
    id: "kia-sonet-petrol",
    brand: "Kia",
    brandSlug: "kia",
    model: "Sonet",
    variant: "1.5 HTX AT",
    slug: "kia-sonet-petrol",
    category: "car",
    type: "SUV",
    fuel: "Petrol",
    rangeKm: 560,
    horsepower: 113,
    torque: 144,
    seatingCapacity: 5,
    transmission: "Automatic",
    groundClearance: 211,
    price: 4200000,
    bootSpace: 392,
    safetyRating: 4,
    keyFeatures: ["Sunroof", "Ventilated Seats", "UVO Connect", "Wireless Charging"],
    images: ["/images/kia_sonet.png"],
    colors: ["White", "Steel Blue", "Pewter Olive"],
    isEV: false,
    isFeatured: false,
    yearLaunched: 2023,
    description: "Sporty petrol sub-compact SUV with premium interior at an accessible price.",
    dimensions: "3995 x 1790 x 1642 mm",
    driveType: "FWD",
    totalAirbags: 6
  }
];

export const USED_LISTINGS: UsedListing[] = [
  {
    id: "used-nissan-leaf",
    vehicleBrand: "Nissan",
    vehicleModel: "Leaf EV",
    vehicleVariant: "Tekna",
    year: 2018,
    kmDriven: 70000,
    condition: "Good",
    askingPrice: 2970000,
    originalPrice: 4500000,
    fuel: "Electric",
    transmission: "Automatic",
    color: "Silver",
    location: "Kathmandu",
    sellerName: "Ram Bahadur",
    sellerType: "Individual",
    description: "Good condition Nissan Leaf with 75% battery state of health. Daily driven in city.",
    images: ["/images/used_nissan_leaf.png"],
    postedAt: "2026-06-20T10:00:00Z",
    isEV: true,
    batteryHealth: 75,
    features: ["Heated Seats", "E-Pedal", "Reverse Camera"]
  },
  {
    id: "used-byd-atto3",
    vehicleBrand: "BYD",
    vehicleModel: "Atto 3",
    vehicleVariant: "Superior",
    year: 2023,
    kmDriven: 12000,
    condition: "Excellent",
    askingPrice: 4800000,
    originalPrice: 6588000,
    fuel: "Electric",
    transmission: "Automatic",
    color: "Boulder Grey",
    location: "Kathmandu",
    sellerName: "Sipradi Reconditioned",
    sellerType: "Dealer",
    description: "Almost new BYD Atto 3. Single owner, regular dealership serviced. Fully intact battery health.",
    images: ["/images/used_byd_atto3.png"],
    postedAt: "2026-07-01T12:00:00Z",
    isEV: true,
    batteryHealth: 98,
    features: ["ADAS", "Sunroof", "Rotatable Screen"]
  },
  {
    id: "used-mg-zs-ev",
    vehicleBrand: "MG",
    vehicleModel: "ZS EV",
    vehicleVariant: "Deluxe",
    year: 2022,
    kmDriven: 10000,
    condition: "Excellent",
    askingPrice: 3800000,
    originalPrice: 5200000,
    fuel: "Electric",
    transmission: "Automatic",
    color: "Red",
    location: "Kathmandu",
    sellerName: "Hari Prasad",
    sellerType: "Individual",
    description: "99% New condition MG ZS EV. Driven sparingly inside Kathmandu valley. Selling due to upgrade.",
    images: ["/images/used_mg_zs_ev.png"],
    postedAt: "2026-07-04T08:30:00Z",
    isEV: true,
    batteryHealth: 95,
    features: ["Panoramic Sunroof", "PM2.5 Air Filter", "Cruise Control"]
  },
  {
    id: "used-hyundai-kona",
    vehicleBrand: "Hyundai",
    vehicleModel: "Kona",
    vehicleVariant: "Premium",
    year: 2022,
    kmDriven: 24000,
    condition: "Good",
    askingPrice: 3920000,
    originalPrice: 5600000,
    fuel: "Electric",
    transmission: "Automatic",
    color: "Blue",
    location: "Lalitpur",
    sellerName: "Shyam Sundar",
    sellerType: "Individual",
    description: "Well-maintained Hyundai Kona Premium. High ground clearance, great mileage, minor bumper scratches.",
    images: ["/images/used_hyundai_kona.png"],
    postedAt: "2026-07-05T15:45:00Z",
    isEV: true,
    batteryHealth: 90,
    features: ["Ventilated Seats", "Wireless Charger", "HUD Display"]
  }
];

export const POPULAR_COMPARISONS = [
  { id: "mg4-vs-nammi01", name1: "MG4 EV", name2: "Dongfeng Nammi 01", desc: "Entry-level electric hatchback comparison" },
  { id: "atto2-vs-nammibox", name1: "BYD Atto 2", name2: "Dongfeng Nammi Box", desc: "Compact electric SUV showdown" },
  { id: "atto1-vs-atto2", name1: "BYD Atto 1", name2: "BYD Atto 2", desc: "BYD's entry models compared • Which one is right for you?" },
  { id: "mgs5-vs-deepals05", name1: "MG S5", name2: "Deepal S05", desc: "Electric SUV comparison • Chinese innovation" },
  { id: "atto3-vs-creta", name1: "BYD Atto 3", name2: "Hyundai Creta", desc: "Premium electric SUV comparison • Best in class" },
  { id: "atto2-vs-atto3", name1: "BYD Atto 2", name2: "BYD Atto 3", desc: "Compact vs premium BYD electric SUV" }
];

export const ALL_COMPARISONS = [
  { id: "comp-1", v1: "BYD Dolphin", price1: "Rs. 41,15,000", v2: "Citroen E-C3", price2: "Rs. 35,99,000", ids: ["byd-dolphin", "citroen-ec3"] },
  { id: "comp-2", v1: "BYD Atto 3", price1: "Rs. 67,80,000", v2: "XPENG G6", price2: "Rs. 84,99,000", ids: ["byd-atto3", "xpeng-g6"] },
  { id: "comp-3", v1: "Avatr 11", price1: "Rs. 1,60,00,000", v2: "BYD Seal", price2: "Rs. 1,05,00,000", ids: ["avatr-11", "byd-seal"] },
  { id: "comp-4", v1: "Tata Tiago EV", price1: "Rs. 28,99,000", v2: "Wuling Bingo", price2: "Rs. 30,99,000", ids: ["tata-tiago-ev", "wuling-bingo"] },
  { id: "comp-5", v1: "Tata Nexon EV", price1: "Rs. 40,99,000", v2: "Seres 3", price2: "Rs. 49,99,000", ids: ["tata-nexon-ev", "seres-3"] },
  { id: "comp-6", v1: "BAW E7 Pro", price1: "Rs. 15,99,000", v2: "Wuling Bingo", price2: "Rs. 30,99,000", ids: ["baw-e7-pro", "wuling-bingo"] },
  { id: "comp-7", v1: "BYD Atto 2", price1: "Rs. 48,99,000", v2: "Tata Nexon EV", price2: "Rs. 40,99,000", ids: ["byd-atto2", "tata-nexon-ev"] }
];

export type VehicleQuery = FilterParams & {
  showDiscountedOnly?: boolean;
  searchTerm?: string;
  model?: string;
  fuelFilter?: 'all' | 'ev' | 'petrol' | 'diesel' | string;
};

/**
 * Shared filter + sort semantics for the catalog. Operates on whatever list of
 * ExtendedVehicles it is handed (mock array or DB-mapped rows) so the sync and
 * async entry points below stay behaviourally identical.
 */
export function applyVehicleFilters(source: ExtendedVehicle[], params: VehicleQuery = {}): ExtendedVehicle[] {
  let list = [...source];

  // 1. Search term filter
  if (params.searchTerm) {
    const q = params.searchTerm.toLowerCase();
    list = list.filter(v =>
      v.brand.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q) ||
      (v.variant && v.variant.toLowerCase().includes(q))
    );
  }

  // 2. Brand filter
  if (params.brand) {
    list = list.filter(v => v.brand.toLowerCase() === params.brand?.toLowerCase());
  }

  // 3. Model filter (if models filter is implemented)
  if (params.model) {
    list = list.filter(v => v.model.toLowerCase() === params.model?.toLowerCase());
  }

  // 4. Budget filter
  if (params.budgetMax) {
    list = list.filter(v => v.price <= params.budgetMax!);
  }

  // 5. Fuel type filter — supports the ?fuel= URL convention (ev/petrol/diesel)
  if (params.fuelFilter && params.fuelFilter !== 'all') {
    const fuel = params.fuelFilter;
    if (fuel === 'ev') {
      list = list.filter(v => v.fuel === 'Electric');
    } else if (fuel === 'petrol') {
      list = list.filter(v => v.fuel === 'Petrol');
    } else if (fuel === 'diesel') {
      list = list.filter(v => v.fuel === 'Diesel');
    }
  }

  // 5b. Structured fuel filter (FilterParams.fuel) — exact FuelType match
  if (params.fuel) {
    list = list.filter(v => v.fuel === params.fuel);
  }

  // 5c. Vehicle type filter
  if (params.type) {
    list = list.filter(v => v.type === params.type);
  }

  // 5d. Seating filter
  if (params.seatingMin) {
    list = list.filter(v => v.seatingCapacity >= params.seatingMin!);
  }

  // 5e. Transmission filter
  if (params.transmission) {
    list = list.filter(v => v.transmission === params.transmission);
  }

  // 5f. Category filter
  if (params.category && params.category !== 'all') {
    list = list.filter(v => v.category === params.category);
  }

  // 5g. EV-only flag
  if (params.isEV) {
    list = list.filter(v => v.isEV);
  }

  // 6. Discount filter
  if (params.showDiscountedOnly) {
    list = list.filter(v => v.hasDiscount);
  }

  // 7. Sort
  if (params.sortBy) {
    if (params.sortBy === 'price-asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (params.sortBy === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (params.sortBy === 'range-desc') {
      list.sort((a, b) => (b.rangeKm || 0) - (a.rangeKm || 0));
    } else if (params.sortBy === 'newest') {
      list.sort((a, b) => (b.yearLaunched || 0) - (a.yearLaunched || 0));
    }
  } else {
    // Default sort by rating/popularity (e.g. descending rating then price)
    list.sort((a, b) => (b.safetyRating || 0) - (a.safetyRating || 0));
  }

  return list;
}

/* ───────────────────────── Supabase-backed catalog ─────────────────────────
 * public.vehicles is the real source of truth (admins CRUD it, dealers insert
 * rows). We read the whole table once, cache the promise at module scope, and
 * map snake_case DB rows into the camelCase ExtendedVehicle the UI expects.
 * Call refreshVehicles() after a write to bust the cache.
 * -------------------------------------------------------------------------- */

interface VehicleRow {
  id: string;
  brand: string;
  model: string;
  variant: string | null;
  type: string | null;
  fuel: string | null;
  engine_cc: number | null;
  horsepower: number | string | null;
  torque: number | string | null;
  mileage: number | string | null;
  seating_capacity: number | null;
  transmission: string | null;
  ground_clearance: number | string | null;
  price: number | string | null;
  boot_space: number | string | null;
  safety_rating: number | string | null;
  key_features: unknown;
  image_url: string | null;
  slug: string | null;
  brand_slug: string | null;
  category: string | null;
  battery_kwh: number | string | null;
  range_km: number | string | null;
  colors: unknown;
  images: unknown;
  is_ev: boolean | null;
  is_featured: boolean | null;
  year_launched: number | null;
  description: string | null;
  used_count: number | null;
  dimensions: string | null;
  drive_type: string | null;
  total_airbags: number | null;
  torque_label: string | null;
  owner_id: string | null;
  sold: boolean | null;
  created_at?: string;
  updated_at?: string;
}

function toNum(x: unknown): number | undefined {
  if (x === null || x === undefined || x === '') return undefined;
  const n = Number(x);
  return Number.isFinite(n) ? n : undefined;
}

function toStrArray(x: unknown): string[] {
  if (Array.isArray(x)) return x.filter((s): s is string => typeof s === 'string');
  return [];
}

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/** Find the mock entry that best matches a DB row so we can borrow the fields
 *  the DB doesn't store (topSpeed, acceleration, chargingTime) and backfill any
 *  NULL columns. Matches brand+model+variant first, then brand+model. */
function findMockMatch(brand: string, model: string, variant: string | null): ExtendedVehicle | undefined {
  const b = (brand || '').toLowerCase().trim();
  const m = (model || '').toLowerCase().trim();
  const vr = (variant || '').toLowerCase().trim();
  return (
    VEHICLES.find(v => v.brand.toLowerCase() === b && v.model.toLowerCase() === m && (v.variant || '').toLowerCase() === vr) ||
    VEHICLES.find(v => v.brand.toLowerCase() === b && v.model.toLowerCase() === m)
  );
}

function mapVehicleRow(row: VehicleRow): ExtendedVehicle {
  const mock = findMockMatch(row.brand, row.model, row.variant);

  const dbImages = toStrArray(row.images);
  const images =
    dbImages.length > 0
      ? dbImages
      : row.image_url
        ? [row.image_url]
        : mock?.images ?? [];

  const dbFeatures = toStrArray(row.key_features);
  const dbColors = toStrArray(row.colors);

  return {
    id: row.id,
    brand: row.brand,
    brandSlug: row.brand_slug || mock?.brandSlug || slugify(row.brand),
    model: row.model,
    variant: row.variant ?? mock?.variant ?? '',
    slug: row.slug || mock?.slug || slugify(`${row.brand}-${row.model}-${row.variant ?? ''}`),
    category: ((row.category as VehicleCategory) || mock?.category || 'car'),
    type: ((row.type as VehicleType) || mock?.type || 'SUV'),
    fuel: ((row.fuel as FuelType) || mock?.fuel || 'Electric'),
    engineCc: toNum(row.engine_cc) ?? mock?.engineCc,
    batteryKwh: toNum(row.battery_kwh) ?? mock?.batteryKwh,
    rangeKm: toNum(row.range_km) ?? mock?.rangeKm,
    horsepower: toNum(row.horsepower) ?? mock?.horsepower ?? 0,
    torque: toNum(row.torque) ?? mock?.torque ?? 0,
    mileage: toNum(row.mileage) ?? mock?.mileage,
    seatingCapacity: toNum(row.seating_capacity) ?? mock?.seatingCapacity ?? 5,
    transmission: ((row.transmission as TransmissionType) || mock?.transmission || 'Automatic'),
    groundClearance: toNum(row.ground_clearance) ?? mock?.groundClearance ?? 0,
    price: toNum(row.price) ?? mock?.price ?? 0,
    bootSpace: toNum(row.boot_space) ?? mock?.bootSpace,
    safetyRating: toNum(row.safety_rating) ?? mock?.safetyRating,
    keyFeatures: dbFeatures.length > 0 ? dbFeatures : mock?.keyFeatures ?? [],
    images,
    colors: dbColors.length > 0 ? dbColors : mock?.colors ?? [],
    // DB has no column for these — fall back to the matched mock entry.
    topSpeed: mock?.topSpeed,
    acceleration: mock?.acceleration,
    chargingTime: mock?.chargingTime,
    isEV: row.is_ev ?? mock?.isEV ?? (row.fuel === 'Electric'),
    isFeatured: row.is_featured ?? mock?.isFeatured ?? false,
    yearLaunched: toNum(row.year_launched) ?? mock?.yearLaunched ?? new Date().getFullYear(),
    description: row.description || mock?.description || '',
    usedCount: row.used_count ?? mock?.usedCount,
    dimensions: row.dimensions || mock?.dimensions,
    driveType: row.drive_type || mock?.driveType,
    totalAirbags: row.total_airbags ?? mock?.totalAirbags,
    torqueLabel: row.torque_label || mock?.torqueLabel,
    ownerId: row.owner_id ?? undefined,
    sold: Boolean(row.sold),
  };
}

let vehiclesCache: Promise<ExtendedVehicle[]> | null = null;

async function loadVehiclesFromDb(): Promise<ExtendedVehicle[]> {
  try {
    const { data, error } = await supabase.from('vehicles').select('*');
    if (error) {
      console.error('[vehicles-db] Supabase read failed, falling back to mock catalog:', error.message);
      return [...VEHICLES];
    }
    if (!data || data.length === 0) {
      console.warn('[vehicles-db] Supabase returned no vehicles, falling back to mock catalog.');
      return [...VEHICLES];
    }
    return (data as VehicleRow[]).map(mapVehicleRow);
  } catch (err) {
    console.error('[vehicles-db] Unexpected error loading vehicles, falling back to mock catalog:', err);
    return [...VEHICLES];
  }
}

/** Cached, deduped load of the full catalog from Supabase. */
export function getVehiclesCached(): Promise<ExtendedVehicle[]> {
  if (!vehiclesCache) vehiclesCache = loadVehiclesFromDb();
  return vehiclesCache;
}

/** Bust the module-level cache and re-fetch (call after admin/dealer writes). */
export function refreshVehicles(): Promise<ExtendedVehicle[]> {
  vehiclesCache = loadVehiclesFromDb();
  return vehiclesCache;
}

/** Async catalog query — reads from Supabase, applies the shared filters. */
export async function getVehiclesAsync(params: VehicleQuery = {}): Promise<ExtendedVehicle[]> {
  const list = await getVehiclesCached();
  return applyVehicleFilters(list, params);
}

/** Resolve a single vehicle by DB uuid OR slug (uuid preferred). */
export async function getVehicleByIdAsync(id: string): Promise<ExtendedVehicle | undefined> {
  if (!id) return undefined;
  const list = await getVehiclesCached();
  return list.find(v => v.id === id) || list.find(v => v.slug === id);
}

/** Input collected by the dealer "add a new car" form (app/dealer/new-car). */
export interface NewVehicleInput {
  brand: string;
  model: string;
  variant?: string;
  type: VehicleType;
  fuel: FuelType;
  price: number;
  seatingCapacity: number;
  transmission: TransmissionType;
  engineCc?: number;
  batteryKwh?: number;
  rangeKm?: number;
  horsepower?: number;
  torque?: number;
  mileage?: number;
  groundClearance?: number;
  bootSpace?: number;
  safetyRating?: number;
  keyFeatures?: string[];
  imageUrl?: string;
  description?: string;
  yearLaunched?: number;
}

/**
 * Inserts a new catalog row owned by the signed-in dealer. RLS
 * (vehicles_dealer_insert) enforces owner_id = auth.uid() AND the caller's
 * user_metadata.account_type = 'dealer' — this function relies on that check
 * rather than re-validating the role itself. Slugs are unique in the DB; on a
 * collision we retry once with a short random suffix.
 */
export async function insertVehicle(input: NewVehicleInput): Promise<{ id: string }> {
  const { data: sessionData } = await supabase.auth.getSession();
  const ownerId = sessionData.session?.user?.id;
  if (!ownerId) {
    throw new Error('You must be signed in as a dealer to list a car.');
  }

  const baseSlug = slugify(`${input.brand}-${input.model}-${input.variant ?? ''}`);
  const row = {
    brand: input.brand,
    model: input.model,
    variant: input.variant?.trim() || '',
    type: input.type,
    fuel: input.fuel,
    engine_cc: input.engineCc ?? null,
    battery_kwh: input.batteryKwh ?? null,
    range_km: input.rangeKm ?? null,
    horsepower: input.horsepower ?? null,
    torque: input.torque ?? null,
    mileage: input.mileage ?? null,
    seating_capacity: input.seatingCapacity,
    transmission: input.transmission,
    ground_clearance: input.groundClearance ?? null,
    price: input.price,
    boot_space: input.bootSpace ?? null,
    safety_rating: input.safetyRating ?? null,
    key_features: input.keyFeatures ?? [],
    image_url: input.imageUrl || null,
    images: input.imageUrl ? [input.imageUrl] : [],
    description: input.description || '',
    year_launched: input.yearLaunched ?? new Date().getFullYear(),
    is_ev: input.fuel === 'Electric',
    category: 'car',
    slug: baseSlug,
    brand_slug: slugify(input.brand),
    owner_id: ownerId,
  };

  let { data, error } = await supabase.from('vehicles').insert(row).select('id').single();

  if (error && error.code === '23505') {
    // Unique slug collision — retry once with a short random suffix.
    const suffix = Math.random().toString(36).slice(2, 6);
    ({ data, error } = await supabase
      .from('vehicles')
      .insert({ ...row, slug: `${baseSlug}-${suffix}` })
      .select('id')
      .single());
  }

  if (error) throw new Error(error.message);
  if (!data) throw new Error('Could not create the listing — please try again.');

  await refreshVehicles();
  return { id: (data as { id: string }).id };
}

/**
 * @deprecated Synchronous mock-backed query. Use getVehiclesAsync — the site now
 * reads the catalog from Supabase. Kept temporarily so nothing breaks mid-transition.
 */
export function getVehicles(params: VehicleQuery = {}) {
  return applyVehicleFilters([...VEHICLES], params);
}

/**
 * @deprecated Synchronous mock-backed lookup by mock id. Use getVehicleByIdAsync,
 * which resolves the real Supabase uuid or slug.
 */
export function getVehicleById(id: string): ExtendedVehicle | undefined {
  return VEHICLES.find(v => v.id === id);
}

export function getUsedListings() {
  return USED_LISTINGS;
}

export function getPopularComparisons() {
  return POPULAR_COMPARISONS;
}

export function getAllComparisons() {
  return ALL_COMPARISONS;
}
