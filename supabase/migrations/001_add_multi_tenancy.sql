-- Migration: Add Multi-Tenancy Support
-- Description: Creates organizations table and adds org_id to all data tables
-- Date: 2025-12-26

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. CREATE ORGANIZATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  domain TEXT UNIQUE,
  logo_url TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  subscription_tier TEXT DEFAULT 'starter' CHECK (subscription_tier IN ('starter', 'professional', 'enterprise')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'trial', 'suspended', 'cancelled')),
  max_users INTEGER DEFAULT 5,
  max_branches INTEGER DEFAULT 1,
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  settings JSONB DEFAULT '{}'::jsonb,
  
  CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9-]+$')
);

-- Indexes for fast lookups
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_domain ON organizations(domain) WHERE domain IS NOT NULL;
CREATE INDEX idx_organizations_status ON organizations(subscription_status);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 2. ADD ORG_ID TO PROFILES (USERS)
-- =====================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS org_role TEXT DEFAULT 'user' CHECK (org_role IN ('owner', 'admin', 'manager', 'user'));
CREATE INDEX IF NOT EXISTS idx_profiles_org_id ON profiles(org_id);

-- =====================================================
-- 3. ADD ORG_ID TO ALL DATA TABLES
-- =====================================================

-- Leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_leads_org_id ON leads(org_id);

-- Vehicles
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_vehicles_org_id ON vehicles(org_id);

-- Customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_customers_org_id ON customers(org_id);

-- Service Jobs
ALTER TABLE service_jobs ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_service_jobs_org_id ON service_jobs(org_id);

-- Invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_invoices_org_id ON invoices(org_id);

-- Invoice Items
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_invoice_items_org_id ON invoice_items(org_id);

-- Parts
ALTER TABLE parts ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_parts_org_id ON parts(org_id);

-- Campaigns
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_campaigns_org_id ON campaigns(org_id);

-- Appointments
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_appointments_org_id ON appointments(org_id);

-- Branches
ALTER TABLE branches ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_branches_org_id ON branches(org_id);

-- Activities
ALTER TABLE activities ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_activities_org_id ON activities(org_id);

-- =====================================================
-- 4. CREATE DEFAULT ORGANIZATION FOR EXISTING DATA
-- =====================================================

-- Insert default organization (modify name/slug as needed)
INSERT INTO organizations (name, slug, subscription_tier, subscription_status)
VALUES ('Default Organization', 'default-org', 'enterprise', 'active')
ON CONFLICT (slug) DO NOTHING;

-- Get the default org ID
DO $$
DECLARE
    default_org_id UUID;
BEGIN
    SELECT id INTO default_org_id FROM organizations WHERE slug = 'default-org';
    
    -- Update all existing records with default org_id
    UPDATE profiles SET org_id = default_org_id WHERE org_id IS NULL;
    UPDATE leads SET org_id = default_org_id WHERE org_id IS NULL;
    UPDATE vehicles SET org_id = default_org_id WHERE org_id IS NULL;
    UPDATE customers SET org_id = default_org_id WHERE org_id IS NULL;
    UPDATE service_jobs SET org_id = default_org_id WHERE org_id IS NULL;
    UPDATE invoices SET org_id = default_org_id WHERE org_id IS NULL;
    UPDATE invoice_items SET org_id = default_org_id WHERE org_id IS NULL;
    UPDATE parts SET org_id = default_org_id WHERE org_id IS NULL;
    UPDATE campaigns SET org_id = default_org_id WHERE org_id IS NULL;
    UPDATE appointments SET org_id = default_org_id WHERE org_id IS NULL;
    UPDATE branches SET org_id = default_org_id WHERE org_id IS NULL;
    UPDATE activities SET org_id = default_org_id WHERE org_id IS NULL;
END $$;

-- =====================================================
-- 5. MAKE ORG_ID NOT NULL (After backfill)
-- =====================================================

-- Uncomment these after verifying all records have org_id
-- ALTER TABLE profiles ALTER COLUMN org_id SET NOT NULL;
-- ALTER TABLE leads ALTER COLUMN org_id SET NOT NULL;
-- ALTER TABLE vehicles ALTER COLUMN org_id SET NOT NULL;
-- ALTER TABLE customers ALTER COLUMN org_id SET NOT NULL;
-- ALTER TABLE service_jobs ALTER COLUMN org_id SET NOT NULL;
-- ALTER TABLE invoices ALTER COLUMN org_id SET NOT NULL;
-- ALTER TABLE invoice_items ALTER COLUMN org_id SET NOT NULL;
-- ALTER TABLE parts ALTER COLUMN org_id SET NOT NULL;
-- ALTER TABLE campaigns ALTER COLUMN org_id SET NOT NULL;
-- ALTER TABLE appointments ALTER COLUMN org_id SET NOT NULL;
-- ALTER TABLE branches ALTER COLUMN org_id SET NOT NULL;
-- ALTER TABLE activities ALTER COLUMN org_id SET NOT NULL;

-- =====================================================
-- 6. CREATE SUBSCRIPTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('starter', 'professional', 'enterprise')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'cancelled', 'trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_org_id ON subscriptions(org_id);
CREATE INDEX idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. CREATE USAGE METRICS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS usage_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('users', 'leads', 'invoices', 'storage_mb', 'api_calls')),
  value INTEGER NOT NULL DEFAULT 0,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_usage_metrics_org_id ON usage_metrics(org_id);
CREATE INDEX idx_usage_metrics_type_date ON usage_metrics(metric_type, recorded_at);

-- =====================================================
-- 8. CREATE ORGANIZATION INVITES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS organization_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
  invited_by UUID REFERENCES profiles(id),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_org_invites_org_id ON organization_invites(org_id);
CREATE INDEX idx_org_invites_token ON organization_invites(token);
CREATE INDEX idx_org_invites_email ON organization_invites(email);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if all tables have org_id
-- SELECT 
--   table_name,
--   column_name,
--   data_type
-- FROM information_schema.columns
-- WHERE column_name = 'org_id'
-- ORDER BY table_name;

-- Count records per organization
-- SELECT 
--   o.name,
--   COUNT(DISTINCT l.id) as leads,
--   COUNT(DISTINCT v.id) as vehicles,
--   COUNT(DISTINCT c.id) as customers
-- FROM organizations o
-- LEFT JOIN leads l ON l.org_id = o.id
-- LEFT JOIN vehicles v ON v.org_id = o.id
-- LEFT JOIN customers c ON c.org_id = o.id
-- GROUP BY o.id, o.name;
