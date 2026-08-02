-- Migration: 014_state_machine_schema.sql
-- Description: Creates the state machine tables for the DMS refactoring
-- Date: 2026-06-23

-- =====================================================
-- 1. NEW TABLES
-- =====================================================

-- Proforma Invoices (1 PI from MAW, contains 1-N vehicles)
CREATE TABLE IF NOT EXISTS proforma_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pi_number TEXT NOT NULL UNIQUE,
  supplier TEXT DEFAULT 'MAW',
  issue_date DATE NOT NULL,
  total_amount NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'NPR',
  notes TEXT,
  org_id UUID REFERENCES organizations(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Letters of Credit (1 LC per PI — domestic LC linked to PI)
CREATE TABLE IF NOT EXISTS letters_of_credit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lc_number TEXT NOT NULL UNIQUE,
  pi_id UUID NOT NULL REFERENCES proforma_invoices(id),
  bank_name TEXT NOT NULL,
  bank_branch TEXT,
  opening_date DATE NOT NULL,
  expiry_date DATE,
  amount NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'NPR',
  target_cycle_days INTEGER DEFAULT 90,
  org_id UUID REFERENCES organizations(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sale Records (the deal entity linking Customer <-> Vehicle)
CREATE TABLE IF NOT EXISTS sale_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  current_state TEXT DEFAULT 'BOOKED',
  payment_type TEXT, -- 'FULL_PAYMENT' or 'FINANCED'
  booking_amount NUMERIC DEFAULT 0,
  sale_price NUMERIC DEFAULT 0,
  booking_date DATE,
  allocation_date DATE,
  -- Bank/Finance details (only for FINANCED)
  bank_name TEXT,
  bank_branch TEXT,
  rm_name TEXT,
  rm_phone TEXT,
  approved_loan NUMERIC,
  -- Insurance
  insurance_activated_at TIMESTAMPTZ,
  insurance_endorsed_at TIMESTAMPTZ,
  insurance_policy_no TEXT,
  -- DoTM
  dotm_rep TEXT DEFAULT 'Ram Lakhan Sah',
  registration_no TEXT,
  registered_at TIMESTAMPTZ,
  registered_under TEXT,
  -- Disbursement (financed only)
  disbursement_requested_at TIMESTAMPTZ,
  disbursement_received_at TIMESTAMPTZ,
  disbursement_amount NUMERIC,
  -- Delivery
  ready_for_delivery_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  -- Meta
  org_id UUID REFERENCES organizations(id),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deal Steps (event audit log for state transitions)
CREATE TABLE IF NOT EXISTS deal_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  from_state TEXT,
  to_state TEXT NOT NULL,
  performed_by UUID REFERENCES profiles(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  org_id UUID REFERENCES organizations(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. EXTEND VEHICLES TABLE
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'vehicle_state') THEN
        ALTER TABLE vehicles ADD COLUMN vehicle_state TEXT DEFAULT 'IN_STOCK';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'pi_id') THEN
        ALTER TABLE vehicles ADD COLUMN pi_id UUID REFERENCES proforma_invoices(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'lc_id') THEN
        ALTER TABLE vehicles ADD COLUMN lc_id UUID REFERENCES letters_of_credit(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'expected_delivery_date') THEN
        ALTER TABLE vehicles ADD COLUMN expected_delivery_date DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'received_at') THEN
        ALTER TABLE vehicles ADD COLUMN received_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'grn_number') THEN
        ALTER TABLE vehicles ADD COLUMN grn_number TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'chassis_no') THEN
        ALTER TABLE vehicles ADD COLUMN chassis_no TEXT;
    END IF;
END $$;

-- =====================================================
-- 3. INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_proforma_invoices_org ON proforma_invoices(org_id);
CREATE INDEX IF NOT EXISTS idx_letters_of_credit_pi ON letters_of_credit(pi_id);
CREATE INDEX IF NOT EXISTS idx_letters_of_credit_org ON letters_of_credit(org_id);
CREATE INDEX IF NOT EXISTS idx_sale_records_customer ON sale_records(customer_id);
CREATE INDEX IF NOT EXISTS idx_sale_records_vehicle ON sale_records(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_sale_records_org ON sale_records(org_id);
CREATE INDEX IF NOT EXISTS idx_sale_records_state ON sale_records(current_state);
CREATE INDEX IF NOT EXISTS idx_deal_steps_entity ON deal_steps(entity_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_vehicles_state ON vehicles(vehicle_state);

-- =====================================================
-- 4. RLS POLICIES
-- =====================================================

ALTER TABLE proforma_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE letters_of_credit ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_steps ENABLE ROW LEVEL SECURITY;

-- Proforma Invoices policies
CREATE POLICY "proforma_invoices_org_isolation" ON proforma_invoices
  FOR ALL USING (
    org_id IN (SELECT org_id FROM profiles WHERE user_id = auth.uid())
  );

-- Letters of Credit policies
CREATE POLICY "letters_of_credit_org_isolation" ON letters_of_credit
  FOR ALL USING (
    org_id IN (SELECT org_id FROM profiles WHERE user_id = auth.uid())
  );

-- Sale Records policies
CREATE POLICY "sale_records_org_isolation" ON sale_records
  FOR ALL USING (
    org_id IN (SELECT org_id FROM profiles WHERE user_id = auth.uid())
  );

-- Deal Steps policies
CREATE POLICY "deal_steps_org_isolation" ON deal_steps
  FOR ALL USING (
    org_id IN (SELECT org_id FROM profiles WHERE user_id = auth.uid())
  );
