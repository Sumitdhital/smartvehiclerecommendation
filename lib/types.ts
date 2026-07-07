// lib/types.ts — Shared TypeScript interfaces for EV Nepal marketplace

export type VehicleCategory = 'car' | 'scooter' | 'bike';
export type FuelType = 'Electric' | 'Petrol' | 'Diesel' | 'Hybrid' | 'CNG';
export type VehicleType = 'Sedan' | 'SUV' | 'Hatchback' | 'MPV' | 'Pickup' | 'Scooter' | 'Bike' | 'Crossover';
export type TransmissionType = 'Manual' | 'Automatic' | 'CVT' | 'Single-Speed' | 'DCT';
export type ConnectorType = 'Type 2' | 'CCS2' | 'CHAdeMO' | 'DC Fast' | 'AC Slow' | 'GB/T';
export type ArticleCategory = 'EV News' | 'Reviews' | 'Policy' | 'Tips & Guides' | 'Industry';
export type VehicleCondition = 'Excellent' | 'Good' | 'Fair' | 'Poor';
export type SellerType = 'Individual' | 'Dealer';

export interface Brand {
  id: string;
  name: string;
  slug: string;
  country: string;
  description: string;
  evOnly: boolean;
  modelCount: number;
  founded: number;
  website?: string;
}

export interface Vehicle {
  id: string;
  brand: string;
  brandSlug: string;
  model: string;
  variant: string;
  slug: string;
  category: VehicleCategory;
  type: VehicleType;
  fuel: FuelType;
  engineCc?: number;
  batteryKwh?: number;
  rangeKm?: number;
  horsepower: number;
  torque: number;
  mileage?: number; // km/l for ICE
  seatingCapacity: number;
  transmission: TransmissionType;
  groundClearance: number; // mm
  price: number; // NPR ex-showroom
  bootSpace?: number; // Liters
  safetyRating?: number; // out of 5
  keyFeatures: string[];
  images: string[]; // placeholder image URLs
  colors: string[];
  topSpeed?: number; // km/h
  acceleration?: number; // 0-100 km/h in seconds
  chargingTime?: string; // For EVs e.g. "7.5 hours (AC) / 1 hour (DC)"
  isEV: boolean;
  isFeatured: boolean;
  yearLaunched: number;
  description: string;
}

export interface ChargingStation {
  id: string;
  name: string;
  operator: string;
  address: string;
  city: string;
  district: string;
  province: string;
  lat: number;
  lng: number;
  connectorTypes: ConnectorType[];
  numberOfPorts: number;
  powerKw: number;
  pricing: string; // e.g. "NPR 15/kWh" or "Free"
  operatingHours: string;
  phone?: string;
  isOperational: boolean;
  amenities: string[];
}

export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string; // HTML or markdown string
  category: ArticleCategory;
  author: string;
  publishedAt: string; // ISO date string
  readTimeMinutes: number;
  coverImage: string;
  tags: string[];
}

export interface UsedListing {
  id: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleVariant: string;
  year: number;
  kmDriven: number;
  condition: VehicleCondition;
  askingPrice: number; // NPR
  originalPrice: number; // NPR
  fuel: FuelType;
  transmission: TransmissionType;
  color: string;
  location: string;
  sellerName: string;
  sellerPhone?: string;
  sellerType: SellerType;
  description: string;
  images: string[];
  postedAt: string; // ISO date
  isEV: boolean;
  batteryHealth?: number; // % for EVs
  features: string[];
}

export interface FilterParams {
  budgetMin?: number;
  budgetMax?: number;
  type?: VehicleType | '';
  fuel?: FuelType | '';
  seatingMin?: number;
  usage?: 'city' | 'highway' | 'mixed';
  brand?: string;
  category?: VehicleCategory | 'all';
  transmission?: TransmissionType | '';
  sortBy?: 'price-asc' | 'price-desc' | 'range-desc' | 'newest';
  page?: number;
  isEV?: boolean;
  // legacy field for backward compat
  budget?: number;
}

export interface EMIParams {
  vehiclePrice: number;
  downPayment: number;
  interestRate: number;
  tenureMonths: number;
}

export interface EMIResult {
  monthlyEMI: number;
  totalInterest: number;
  totalAmount: number;
  loanAmount: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
