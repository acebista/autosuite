-- Migration: Gate Pass System for Phase 1 Trust & Control
-- Description: Creates gate_passes table for tracking vehicle movements
-- Date: 2026-01-15

-- =====================================================
-- GATE PASSES TABLE
-- =====================================================
-- Every vehicle exit (test drive, delivery) requires a digital gate pass
-- Security guards scan this to verify authorization

CREATE TABLE IF NOT EXISTS gate_passes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  
  -- Pass identification
  pass_code TEXT UNIQUE NOT NULL, -- Short scannable code e.g., "GP-2026-0001"
  qr_data TEXT NOT NULL, -- Full QR code data (JSON encoded)
  
  -- Vehicle info
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  vehicle_model TEXT NOT NULL,
  vehicle_reg_number TEXT,
  vehicle_vin TEXT,
  
  -- Customer/Lead info (if applicable)
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_phone TEXT,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  
  -- Pass type and purpose
  pass_type TEXT NOT NULL CHECK (pass_type IN ('test_drive', 'delivery', 'service_return', 'internal_transfer')),
  purpose TEXT, -- Additional notes
  
  -- Authorization
  issued_by UUID REFERENCES profiles(id) NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ NOT NULL, -- Pass expires after this time
  
  -- Status tracking
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'cancelled')),
  
  -- Exit/Return tracking
  exited_at TIMESTAMPTZ,
  exit_scanned_by UUID REFERENCES profiles(id),
  exit_odometer INTEGER,
  exit_fuel_level TEXT, -- 'full', '3/4', '1/2', '1/4', 'empty'
  
  returned_at TIMESTAMPTZ,
  return_scanned_by UUID REFERENCES profiles(id),
  return_odometer INTEGER,
  return_fuel_level TEXT,
  return_condition TEXT, -- 'good', 'minor_damage', 'major_damage'
  return_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_gate_passes_org_id ON gate_passes(org_id);
CREATE INDEX idx_gate_passes_pass_code ON gate_passes(pass_code);
CREATE INDEX idx_gate_passes_vehicle_id ON gate_passes(vehicle_id);
CREATE INDEX idx_gate_passes_status ON gate_passes(status);
CREATE INDEX idx_gate_passes_issued_at ON gate_passes(issued_at);

-- Auto-update timestamp
CREATE TRIGGER update_gate_passes_updated_at BEFORE UPDATE ON gate_passes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- RLS POLICIES FOR GATE PASSES
-- =====================================================

ALTER TABLE gate_passes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view org gate_passes" ON gate_passes;
CREATE POLICY "Users can view org gate_passes"
  ON gate_passes FOR SELECT
  USING (org_id = user_org_id());

DROP POLICY IF EXISTS "Users can insert org gate_passes" ON gate_passes;
CREATE POLICY "Users can insert org gate_passes"
  ON gate_passes FOR INSERT
  WITH CHECK (org_id = user_org_id());

DROP POLICY IF EXISTS "Users can update org gate_passes" ON gate_passes;
CREATE POLICY "Users can update org gate_passes"
  ON gate_passes FOR UPDATE
  USING (org_id = user_org_id());

-- =====================================================
-- HELPER FUNCTION: Generate Pass Code
-- =====================================================

CREATE OR REPLACE FUNCTION generate_pass_code()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  sequence_part TEXT;
  new_code TEXT;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  
  -- Get the next sequence number for this year
  SELECT LPAD((COALESCE(MAX(SUBSTRING(pass_code FROM 9)::INTEGER), 0) + 1)::TEXT, 4, '0')
  INTO sequence_part
  FROM gate_passes
  WHERE pass_code LIKE 'GP-' || year_part || '-%';
  
  new_code := 'GP-' || year_part || '-' || sequence_part;
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- AUDIT LOG TRIGGER FOR GATE PASSES
-- =====================================================

CREATE OR REPLACE FUNCTION audit_gate_pass_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (user_id, org_id, action, resource_type, resource_id, new_values)
    VALUES (auth.uid(), NEW.org_id, 'CREATE', 'gate_pass', NEW.id::TEXT, row_to_json(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    -- Log status changes specifically
    IF OLD.status != NEW.status OR OLD.exited_at IS DISTINCT FROM NEW.exited_at OR OLD.returned_at IS DISTINCT FROM NEW.returned_at THEN
      INSERT INTO audit_logs (user_id, org_id, action, resource_type, resource_id, old_values, new_values)
      VALUES (
        auth.uid(),
        NEW.org_id,
        CASE
          WHEN NEW.exited_at IS NOT NULL AND OLD.exited_at IS NULL THEN 'GATE_PASS_SCANNED'
          WHEN NEW.returned_at IS NOT NULL AND OLD.returned_at IS NULL THEN 'GATE_PASS_SCANNED'
          ELSE 'UPDATE'
        END,
        'gate_pass',
        NEW.id::TEXT,
        jsonb_build_object('status', OLD.status, 'exited_at', OLD.exited_at, 'returned_at', OLD.returned_at),
        jsonb_build_object('status', NEW.status, 'exited_at', NEW.exited_at, 'returned_at', NEW.returned_at)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER gate_pass_audit_trigger
  AFTER INSERT OR UPDATE ON gate_passes
  FOR EACH ROW EXECUTE FUNCTION audit_gate_pass_changes();
