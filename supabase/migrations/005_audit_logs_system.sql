-- Migration: Audit Logs Table for Phase 1 Trust & Control
-- Description: Creates audit_logs table for tracking all critical actions
-- Date: 2026-01-15

-- =====================================================
-- AUDIT LOGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Who
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- What
  action TEXT NOT NULL CHECK (action IN (
    'CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT',
    'EXPORT', 'APPROVE', 'REJECT', 'STATUS_CHANGE',
    'GATE_PASS_ISSUED', 'GATE_PASS_SCANNED'
  )),
  resource_type TEXT NOT NULL CHECK (resource_type IN (
    'lead', 'vehicle', 'customer', 'service_job', 'invoice',
    'quotation', 'gate_pass', 'user', 'organization', 'settings'
  )),
  resource_id TEXT, -- The ID of the affected resource
  
  -- What Changed
  old_values JSONB, -- Previous state
  new_values JSONB, -- New state
  
  -- Where
  ip_address TEXT,
  user_agent TEXT,
  
  -- When
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX idx_audit_logs_org_id ON audit_logs(org_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_resource_id ON audit_logs(resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Composite index for common queries
CREATE INDEX idx_audit_logs_org_resource ON audit_logs(org_id, resource_type, created_at DESC);

-- =====================================================
-- RLS POLICIES FOR AUDIT LOGS
-- =====================================================

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their org's audit logs
DROP POLICY IF EXISTS "Users can view org audit_logs" ON audit_logs;
CREATE POLICY "Users can view org audit_logs"
  ON audit_logs FOR SELECT
  USING (org_id = user_org_id());

-- System can insert audit logs (any authenticated user)
DROP POLICY IF EXISTS "Users can insert audit_logs" ON audit_logs;
CREATE POLICY "Users can insert audit_logs"
  ON audit_logs FOR INSERT
  WITH CHECK (org_id = user_org_id());

-- No updates or deletes allowed - audit logs are immutable
-- This is enforced by NOT creating UPDATE or DELETE policies

-- =====================================================
-- AUTOMATIC AUDIT TRIGGERS FOR CRITICAL TABLES
-- =====================================================

-- Generic audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
  resource_type_name TEXT;
BEGIN
  -- Determine resource type from table name
  resource_type_name := TG_TABLE_NAME;
  
  -- Handle common table name mappings
  CASE TG_TABLE_NAME
    WHEN 'leads' THEN resource_type_name := 'lead';
    WHEN 'vehicles' THEN resource_type_name := 'vehicle';
    WHEN 'customers' THEN resource_type_name := 'customer';
    WHEN 'service_jobs' THEN resource_type_name := 'service_job';
    WHEN 'invoices' THEN resource_type_name := 'invoice';
    ELSE resource_type_name := TG_TABLE_NAME;
  END CASE;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (user_id, org_id, action, resource_type, resource_id, new_values)
    VALUES (auth.uid(), NEW.org_id, 'CREATE', resource_type_name, NEW.id::TEXT, row_to_json(NEW)::JSONB);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (user_id, org_id, action, resource_type, resource_id, old_values, new_values)
    VALUES (auth.uid(), NEW.org_id, 'UPDATE', resource_type_name, NEW.id::TEXT, row_to_json(OLD)::JSONB, row_to_json(NEW)::JSONB);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (user_id, org_id, action, resource_type, resource_id, old_values)
    VALUES (auth.uid(), OLD.org_id, 'DELETE', resource_type_name, OLD.id::TEXT, row_to_json(OLD)::JSONB);
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers for critical tables
CREATE TRIGGER leads_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON leads
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER vehicles_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER invoices_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON invoices
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER customers_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON customers
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER service_jobs_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON service_jobs
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
