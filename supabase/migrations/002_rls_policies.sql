-- Migration: Row Level Security Policies for Multi-Tenancy
-- Description: Implements RLS policies to ensure data isolation between organizations
-- Date: 2025-12-26

-- =====================================================
-- HELPER FUNCTION: Get Current User's Organization ID
-- =====================================================

CREATE OR REPLACE FUNCTION user_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL STABLE;

-- =====================================================
-- ORGANIZATIONS TABLE RLS
-- =====================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Users can view their own organization
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;
CREATE POLICY "Users can view their organization"
  ON organizations FOR SELECT
  USING (id = user_org_id());

-- Only org owners can update organization
DROP POLICY IF EXISTS "Org owners can update organization" ON organizations;
CREATE POLICY "Org owners can update organization"
  ON organizations FOR UPDATE
  USING (
    id = user_org_id() AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND org_id = organizations.id 
      AND role = 'owner'
    )
  );

-- =====================================================
-- PROFILES TABLE RLS
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view profiles in their organization
DROP POLICY IF EXISTS "Users can view org profiles" ON profiles;
CREATE POLICY "Users can view org profiles"
  ON profiles FOR SELECT
  USING (org_id = user_org_id());

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- Admins can insert new users to their org
DROP POLICY IF EXISTS "Admins can insert org users" ON profiles;
CREATE POLICY "Admins can insert org users"
  ON profiles FOR INSERT
  WITH CHECK (
    org_id = user_org_id() AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- LEADS TABLE RLS
-- =====================================================

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view org leads" ON leads;
CREATE POLICY "Users can view org leads"
  ON leads FOR SELECT
  USING (org_id = user_org_id());

DROP POLICY IF EXISTS "Users can insert org leads" ON leads;
CREATE POLICY "Users can insert org leads"
  ON leads FOR INSERT
  WITH CHECK (org_id = user_org_id());

DROP POLICY IF EXISTS "Users can update org leads" ON leads;
CREATE POLICY "Users can update org leads"
  ON leads FOR UPDATE
  USING (org_id = user_org_id());

DROP POLICY IF EXISTS "Users can delete org leads" ON leads;
CREATE POLICY "Users can delete org leads"
  ON leads FOR DELETE
  USING (org_id = user_org_id());

-- =====================================================
-- VEHICLES TABLE RLS
-- =====================================================

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view org vehicles" ON vehicles;
CREATE POLICY "Users can view org vehicles"
  ON vehicles FOR SELECT
  USING (org_id = user_org_id());

DROP POLICY IF EXISTS "Users can insert org vehicles" ON vehicles;
CREATE POLICY "Users can insert org vehicles"
  ON vehicles FOR INSERT
  WITH CHECK (org_id = user_org_id());

DROP POLICY IF EXISTS "Users can update org vehicles" ON vehicles;
CREATE POLICY "Users can update org vehicles"
  ON vehicles FOR UPDATE
  USING (org_id = user_org_id());

DROP POLICY IF EXISTS "Users can delete org vehicles" ON vehicles;
CREATE POLICY "Users can delete org vehicles"
  ON vehicles FOR DELETE
  USING (org_id = user_org_id());

-- =====================================================
-- CUSTOMERS TABLE RLS
-- =====================================================

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view org customers" ON customers;
CREATE POLICY "Users can view org customers"
  ON customers FOR SELECT
  USING (org_id = user_org_id());

DROP POLICY IF EXISTS "Users can insert org customers" ON customers;
CREATE POLICY "Users can insert org customers"
  ON customers FOR INSERT
  WITH CHECK (org_id = user_org_id());

DROP POLICY IF EXISTS "Users can update org customers" ON customers;
CREATE POLICY "Users can update org customers"
  ON customers FOR UPDATE
  USING (org_id = user_org_id());

DROP POLICY IF EXISTS "Users can delete org customers" ON customers;
CREATE POLICY "Users can delete org customers"
  ON customers FOR DELETE
  USING (org_id = user_org_id());

-- =====================================================
-- SERVICE_JOBS TABLE RLS
-- =====================================================

ALTER TABLE service_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view org service_jobs" ON service_jobs;
CREATE POLICY "Users can view org service_jobs"
  ON service_jobs FOR SELECT
  USING (org_id = user_org_id());

DROP POLICY IF EXISTS "Users can insert org service_jobs" ON service_jobs;
CREATE POLICY "Users can insert org service_jobs"
  ON service_jobs FOR INSERT
  WITH CHECK (org_id = user_org_id());

DROP POLICY IF EXISTS "Users can update org service_jobs" ON service_jobs;
CREATE POLICY "Users can update org service_jobs"
  ON service_jobs FOR UPDATE
  USING (org_id = user_org_id());

DROP POLICY IF EXISTS "Users can delete org service_jobs" ON service_jobs;
CREATE POLICY "Users can delete org service_jobs"
  ON service_jobs FOR DELETE
  USING (org_id = user_org_id());

-- =====================================================
-- INVOICES TABLE RLS
-- =====================================================

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view org invoices" ON invoices;
CREATE POLICY "Users can view org invoices"
  ON invoices FOR SELECT
  USING (org_id = user_org_id());

DROP POLICY IF EXISTS "Users can insert org invoices" ON invoices;
CREATE POLICY "Users can insert org invoices"
  ON invoices FOR INSERT
  WITH CHECK (org_id = user_org_id());

DROP POLICY IF EXISTS "Users can update org invoices" ON invoices;
CREATE POLICY "Users can update org invoices"
  ON invoices FOR UPDATE
  USING (org_id = user_org_id());

DROP POLICY IF EXISTS "Users can delete org invoices" ON invoices;
CREATE POLICY "Users can delete org invoices"
  ON invoices FOR DELETE
  USING (org_id = user_org_id());

-- =====================================================
-- INVOICE_ITEMS TABLE RLS
-- =====================================================

ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view org invoice_items" ON invoice_items;
CREATE POLICY "Users can view org invoice_items"
  ON invoice_items FOR SELECT
  USING (org_id = user_org_id());

DROP POLICY IF EXISTS "Users can insert org invoice_items" ON invoice_items;
CREATE POLICY "Users can insert org invoice_items"
  ON invoice_items FOR INSERT
  WITH CHECK (org_id = user_org_id());

DROP POLICY IF EXISTS "Users can update org invoice_items" ON invoice_items;
CREATE POLICY "Users can update org invoice_items"
  ON invoice_items FOR UPDATE
  USING (org_id = user_org_id());

DROP POLICY IF EXISTS "Users can delete org invoice_items" ON invoice_items;
CREATE POLICY "Users can delete org invoice_items"
  ON invoice_items FOR DELETE
  USING (org_id = user_org_id());

-- =====================================================
-- PARTS TABLE RLS
-- =====================================================

ALTER TABLE parts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view org parts" ON parts;
CREATE POLICY "Users can view org parts"
  ON parts FOR SELECT
  USING (org_id = user_org_id());

DROP POLICY IF EXISTS "Users can insert org parts" ON parts;
CREATE POLICY "Users can insert org parts"
  ON parts FOR INSERT
  WITH CHECK (org_id = user_org_id());

DROP POLICY IF EXISTS "Users can update org parts" ON parts;
CREATE POLICY "Users can update org parts"
  ON parts FOR UPDATE
  USING (org_id = user_org_id());

DROP POLICY IF EXISTS "Users can delete org parts" ON parts;
CREATE POLICY "Users can delete org parts"
  ON parts FOR DELETE
  USING (org_id = user_org_id());

-- =====================================================
-- CAMPAIGNS TABLE RLS
-- =====================================================

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view org campaigns" ON campaigns;
CREATE POLICY "Users can view org campaigns"
  ON campaigns FOR SELECT
  USING (org_id = user_org_id());

DROP POLICY IF EXISTS "Users can insert org campaigns" ON campaigns;
CREATE POLICY "Users can insert org campaigns"
  ON campaigns FOR INSERT
  WITH CHECK (org_id = user_org_id());

DROP POLICY IF EXISTS "Users can update org campaigns" ON campaigns;
CREATE POLICY "Users can update org campaigns"
  ON campaigns FOR UPDATE
  USING (org_id = user_org_id());

DROP POLICY IF EXISTS "Users can delete org campaigns" ON campaigns;
CREATE POLICY "Users can delete org campaigns"
  ON campaigns FOR DELETE
  USING (org_id = user_org_id());

-- =====================================================
-- APPOINTMENTS TABLE RLS
-- =====================================================

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view org appointments" ON appointments;
CREATE POLICY "Users can view org appointments"
  ON appointments FOR SELECT
  USING (org_id = user_org_id());

DROP POLICY IF EXISTS "Users can insert org appointments" ON appointments;
CREATE POLICY "Users can insert org appointments"
  ON appointments FOR INSERT
  WITH CHECK (org_id = user_org_id());

DROP POLICY IF EXISTS "Users can update org appointments" ON appointments;
CREATE POLICY "Users can update org appointments"
  ON appointments FOR UPDATE
  USING (org_id = user_org_id());

DROP POLICY IF EXISTS "Users can delete org appointments" ON appointments;
CREATE POLICY "Users can delete org appointments"
  ON appointments FOR DELETE
  USING (org_id = user_org_id());

-- =====================================================
-- BRANCHES TABLE RLS
-- =====================================================

ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view org branches" ON branches;
CREATE POLICY "Users can view org branches"
  ON branches FOR SELECT
  USING (org_id = user_org_id());

DROP POLICY IF EXISTS "Admins can insert org branches" ON branches;
CREATE POLICY "Admins can insert org branches"
  ON branches FOR INSERT
  WITH CHECK (
    org_id = user_org_id() AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Admins can update org branches" ON branches;
CREATE POLICY "Admins can update org branches"
  ON branches FOR UPDATE
  USING (
    org_id = user_org_id() AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Admins can delete org branches" ON branches;
CREATE POLICY "Admins can delete org branches"
  ON branches FOR DELETE
  USING (
    org_id = user_org_id() AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- ACTIVITIES TABLE RLS
-- =====================================================

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view org activities" ON activities;
CREATE POLICY "Users can view org activities"
  ON activities FOR SELECT
  USING (org_id = user_org_id());

DROP POLICY IF EXISTS "Users can insert org activities" ON activities;
CREATE POLICY "Users can insert org activities"
  ON activities FOR INSERT
  WITH CHECK (org_id = user_org_id());

DROP POLICY IF EXISTS "Users can update org activities" ON activities;
CREATE POLICY "Users can update org activities"
  ON activities FOR UPDATE
  USING (org_id = user_org_id());

DROP POLICY IF EXISTS "Users can delete org activities" ON activities;
CREATE POLICY "Users can delete org activities"
  ON activities FOR DELETE
  USING (org_id = user_org_id());

-- =====================================================
-- SUBSCRIPTIONS TABLE RLS
-- =====================================================

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their org's subscription
DROP POLICY IF EXISTS "Users can view org subscription" ON subscriptions;
CREATE POLICY "Users can view org subscription"
  ON subscriptions FOR SELECT
  USING (org_id = user_org_id());

-- Only owners can manage subscriptions
DROP POLICY IF EXISTS "Owners can manage subscriptions" ON subscriptions;
CREATE POLICY "Owners can manage subscriptions"
  ON subscriptions FOR ALL
  USING (
    org_id = user_org_id() AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'owner'
    )
  );

-- =====================================================
-- ORGANIZATION_INVITES TABLE RLS
-- =====================================================

ALTER TABLE organization_invites ENABLE ROW LEVEL SECURITY;

-- Admins can view org invites
DROP POLICY IF EXISTS "Admins can view org invites" ON organization_invites;
CREATE POLICY "Admins can view org invites"
  ON organization_invites FOR SELECT
  USING (
    org_id = user_org_id() AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- Admins can create invites
DROP POLICY IF EXISTS "Admins can create invites" ON organization_invites;
CREATE POLICY "Admins can create invites"
  ON organization_invites FOR INSERT
  WITH CHECK (
    org_id = user_org_id() AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );
