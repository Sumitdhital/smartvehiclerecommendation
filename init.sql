-- 1. Create Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'USER' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Vehicle Tax Info Table (2081/82 context)
CREATE TABLE vehicle_tax_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,         -- e.g., 'EV', 'ICE_Hatchback', 'ICE_SUV'
  engine_cc_min INTEGER,          -- e.g., 0 for EV, 1000 for small ICE
  engine_cc_max INTEGER,
  customs_duty_percent NUMERIC NOT NULL,
  excise_duty_percent NUMERIC NOT NULL,
  vat_percent NUMERIC DEFAULT 13 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Vehicles Table
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  variant TEXT NOT NULL,
  type TEXT NOT NULL,             -- Sedan, SUV, Hatchback, Pickup, Electric
  fuel TEXT NOT NULL,             -- Petrol, Diesel, Electric, Hybrid
  engine_cc INTEGER,              -- Use 0 for EVs or kw/hp depending on how it's stored
  horsepower NUMERIC,
  torque NUMERIC,
  mileage NUMERIC,                -- km/l (ARAI)
  seating_capacity INTEGER NOT NULL,
  transmission TEXT NOT NULL,     -- Manual, Automatic, CVT, etc.
  ground_clearance NUMERIC,       -- mm
  price NUMERIC NOT NULL,         -- Base Price (ex-showroom NPR)
  boot_space NUMERIC,             -- Liters
  safety_rating NUMERIC,          -- out of 5
  key_features JSONB,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Search History Table
CREATE TABLE search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  query_params JSONB NOT NULL,
  recommended_vehicle_ids JSONB NOT NULL, -- Array of recommended vehicle UUIDs
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Saved Vehicles (Bookmarks)
CREATE TABLE saved_vehicles (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, vehicle_id)
);
