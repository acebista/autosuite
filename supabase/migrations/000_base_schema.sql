-- Migration: 000_base_schema.sql
-- Description: Creates the base Dealer Management System tables
-- Date: 2026-01-15

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. BASE TABLES
-- =====================================================

-- Branches
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles (Fixing existing profiles table)
-- We need to ensure columns expected by the app exist
DO $$
BEGIN
    -- Add role if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'user';
    END IF;
    
    -- Add branch_id if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'branch_id') THEN
        ALTER TABLE profiles ADD COLUMN branch_id UUID REFERENCES branches(id);
    END IF;

    -- Add avatar_url if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
        ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
    END IF;

    -- Add status if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'status') THEN
        ALTER TABLE profiles ADD COLUMN status TEXT DEFAULT 'Active';
    END IF;
END $$;

-- Leads
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  source TEXT DEFAULT 'Walk-in',
  model_interest TEXT,
  vehicle_color TEXT,
  budget NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'New',
  temperature TEXT DEFAULT 'Warm',
  ai_score INTEGER DEFAULT 0,
  owner_id UUID REFERENCES profiles(id),
  branch_id UUID REFERENCES branches(id),
  quotation_issued BOOLEAN DEFAULT false,
  exchange_details JSONB DEFAULT '{"hasExchange": false}'::jsonb,
  remarks TEXT,
  test_drive_date TIMESTAMPTZ,
  next_follow_up_date TIMESTAMPTZ,
  booking_date TIMESTAMPTZ,
  delivery_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicles
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model TEXT NOT NULL,
  variant TEXT,
  year INTEGER,
  color TEXT,
  vin TEXT UNIQUE,
  price NUMERIC DEFAULT 0,
  cost NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'In Stock',
  branch_id UUID REFERENCES branches(id),
  fuel_type TEXT,
  image_url TEXT,
  specifications JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  location TEXT,
  branch_id UUID REFERENCES branches(id),
  ltv NUMERIC DEFAULT 0,
  last_service_at TIMESTAMPTZ,
  next_service_due_at TIMESTAMPTZ,
  cars_owned JSONB DEFAULT '[]'::jsonb,
  referrals INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service Jobs
CREATE TABLE IF NOT EXISTS service_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id),
  vehicle_model TEXT,
  reg_number TEXT,
  type TEXT DEFAULT 'Periodic',
  status TEXT DEFAULT 'Queued',
  technician_id UUID REFERENCES profiles(id),
  branch_id UUID REFERENCES branches(id),
  promised_at TIMESTAMPTZ,
  cost_estimate NUMERIC DEFAULT 0,
  actual_cost NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Parts
CREATE TABLE IF NOT EXISTS parts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'Part',
  price NUMERIC DEFAULT 0,
  cost NUMERIC DEFAULT 0,
  stock INTEGER DEFAULT 0,
  min_stock_level INTEGER DEFAULT 0,
  bin_location TEXT,
  supplier TEXT,
  status TEXT DEFAULT 'In Stock',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id),
  date TIMESTAMPTZ DEFAULT NOW(),
  due_date TIMESTAMPTZ,
  status TEXT DEFAULT 'Draft',
  subtotal NUMERIC DEFAULT 0,
  tax NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  type TEXT DEFAULT 'Sales',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice Items
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  type TEXT DEFAULT 'Part',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  channel TEXT,
  status TEXT DEFAULT 'Draft',
  spend NUMERIC DEFAULT 0,
  leads_generated INTEGER DEFAULT 0,
  revenue_generated NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointments
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  type TEXT DEFAULT 'Meeting',
  resource_id UUID,
  customer_id UUID REFERENCES customers(id),
  customer_name TEXT,
  status TEXT DEFAULT 'Pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activities
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL, -- LEAD, VEHICLE, JOB, CUSTOMER
  kind TEXT NOT NULL, -- CALL, WHATSAPP, NOTE, STATUS_CHANGE, SYSTEM, AI
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_service_jobs_status ON service_jobs(status);
CREATE INDEX IF NOT EXISTS idx_parts_sku ON parts(sku);
CREATE INDEX IF NOT EXISTS idx_activities_entity ON activities(entity_id, entity_type);
