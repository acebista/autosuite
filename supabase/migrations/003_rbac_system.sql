-- Migration: Enhanced Role-Based Access Control (RBAC)
-- Description: Implements granular roles and permissions system
-- Date: 2025-12-26

-- =====================================================
-- 1. UPDATE PROFILES TABLE WITH NEW ROLES
-- =====================================================

-- Drop old role constraint and add new one
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_org_role_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add new role types
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('super_admin', 'admin', 'sales', 'finance', 'service', 'user'));

-- Add department field
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS department TEXT;

-- Rename org_role if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'org_role') THEN
        ALTER TABLE profiles RENAME COLUMN org_role TO role;
    END IF;
EXCEPTION
    WHEN duplicate_column THEN
        NULL;
END $$;

-- Set default role
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'user';

-- =====================================================
-- 2. CREATE PERMISSIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  resource TEXT NOT NULL, -- e.g., 'leads', 'invoices', 'vehicles'
  action TEXT NOT NULL CHECK (action IN ('create', 'read', 'update', 'delete', 'manage')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast permission lookups
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource);

-- =====================================================
-- 3. CREATE ROLE_PERMISSIONS MAPPING TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'sales', 'finance', 'service', 'user')),
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);

-- =====================================================
-- 4. SEED PERMISSIONS
-- =====================================================

-- Leads Permissions
INSERT INTO permissions (name, description, resource, action) VALUES
  ('leads.create', 'Create new leads', 'leads', 'create'),
  ('leads.read', 'View leads', 'leads', 'read'),
  ('leads.update', 'Update leads', 'leads', 'update'),
  ('leads.delete', 'Delete leads', 'leads', 'delete'),
  ('leads.manage', 'Full lead management', 'leads', 'manage')
ON CONFLICT (name) DO NOTHING;

-- Vehicles Permissions
INSERT INTO permissions (name, description, resource, action) VALUES
  ('vehicles.create', 'Add new vehicles', 'vehicles', 'create'),
  ('vehicles.read', 'View vehicles', 'vehicles', 'read'),
  ('vehicles.update', 'Update vehicles', 'vehicles', 'update'),
  ('vehicles.delete', 'Delete vehicles', 'vehicles', 'delete'),
  ('vehicles.manage', 'Full vehicle management', 'vehicles', 'manage')
ON CONFLICT (name) DO NOTHING;

-- Customers Permissions
INSERT INTO permissions (name, description, resource, action) VALUES
  ('customers.create', 'Create customers', 'customers', 'create'),
  ('customers.read', 'View customers', 'customers', 'read'),
  ('customers.update', 'Update customers', 'customers', 'update'),
  ('customers.delete', 'Delete customers', 'customers', 'delete'),
  ('customers.manage', 'Full customer management', 'customers', 'manage')
ON CONFLICT (name) DO NOTHING;

-- Invoices Permissions
INSERT INTO permissions (name, description, resource, action) VALUES
  ('invoices.create', 'Create invoices', 'invoices', 'create'),
  ('invoices.read', 'View invoices', 'invoices', 'read'),
  ('invoices.update', 'Update invoices', 'invoices', 'update'),
  ('invoices.delete', 'Delete invoices', 'invoices', 'delete'),
  ('invoices.manage', 'Full invoice management', 'invoices', 'manage')
ON CONFLICT (name) DO NOTHING;

-- Service Jobs Permissions
INSERT INTO permissions (name, description, resource, action) VALUES
  ('service.create', 'Create service jobs', 'service_jobs', 'create'),
  ('service.read', 'View service jobs', 'service_jobs', 'read'),
  ('service.update', 'Update service jobs', 'service_jobs', 'update'),
  ('service.delete', 'Delete service jobs', 'service_jobs', 'delete'),
  ('service.manage', 'Full service management', 'service_jobs', 'manage')
ON CONFLICT (name) DO NOTHING;

-- Parts Permissions
INSERT INTO permissions (name, description, resource, action) VALUES
  ('parts.create', 'Add parts', 'parts', 'create'),
  ('parts.read', 'View parts', 'parts', 'read'),
  ('parts.update', 'Update parts', 'parts', 'update'),
  ('parts.delete', 'Delete parts', 'parts', 'delete'),
  ('parts.manage', 'Full parts management', 'parts', 'manage')
ON CONFLICT (name) DO NOTHING;

-- User Management Permissions
INSERT INTO permissions (name, description, resource, action) VALUES
  ('users.create', 'Invite users', 'users', 'create'),
  ('users.read', 'View users', 'users', 'read'),
  ('users.update', 'Update users', 'users', 'update'),
  ('users.delete', 'Remove users', 'users', 'delete'),
  ('users.manage', 'Full user management', 'users', 'manage')
ON CONFLICT (name) DO NOTHING;

-- Organization Permissions
INSERT INTO permissions (name, description, resource, action) VALUES
  ('organization.read', 'View organization', 'organization', 'read'),
  ('organization.update', 'Update organization', 'organization', 'update'),
  ('organization.manage', 'Full organization management', 'organization', 'manage')
ON CONFLICT (name) DO NOTHING;

-- Reports Permissions
INSERT INTO permissions (name, description, resource, action) VALUES
  ('reports.sales', 'View sales reports', 'reports', 'read'),
  ('reports.finance', 'View finance reports', 'reports', 'read'),
  ('reports.service', 'View service reports', 'reports', 'read'),
  ('reports.all', 'View all reports', 'reports', 'read')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 5. ASSIGN PERMISSIONS TO ROLES
-- =====================================================

-- SUPER ADMIN: All permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'super_admin', id FROM permissions
ON CONFLICT (role, permission_id) DO NOTHING;

-- ADMIN: All permissions except super admin functions
INSERT INTO role_permissions (role, permission_id)
SELECT 'admin', id FROM permissions 
WHERE name NOT LIKE 'super_admin%'
ON CONFLICT (role, permission_id) DO NOTHING;

-- SALES ROLE: Sales-related permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'sales', id FROM permissions 
WHERE name IN (
  'leads.create', 'leads.read', 'leads.update', 'leads.delete',
  'customers.create', 'customers.read', 'customers.update',
  'vehicles.read',
  'invoices.create', 'invoices.read',
  'reports.sales'
)
ON CONFLICT (role, permission_id) DO NOTHING;

-- FINANCE ROLE: Finance-related permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'finance', id FROM permissions 
WHERE name IN (
  'invoices.create', 'invoices.read', 'invoices.update', 'invoices.delete',
  'customers.read',
  'leads.read',
  'reports.finance'
)
ON CONFLICT (role, permission_id) DO NOTHING;

-- SERVICE ROLE: Service-related permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'service', id FROM permissions 
WHERE name IN (
  'service.create', 'service.read', 'service.update', 'service.delete',
  'parts.create', 'parts.read', 'parts.update',
  'customers.read',
  'vehicles.read',
  'reports.service'
)
ON CONFLICT (role, permission_id) DO NOTHING;

-- USER ROLE: Basic read permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'user', id FROM permissions 
WHERE action = 'read'
ON CONFLICT (role, permission_id) DO NOTHING;

-- =====================================================
-- 6. CREATE PERMISSION CHECK FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION has_permission(
  required_permission TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get current user's role
  SELECT role INTO user_role
  FROM profiles
  WHERE id = auth.uid();

  -- Super admin has all permissions
  IF user_role = 'super_admin' THEN
    RETURN TRUE;
  END IF;

  -- Check if user's role has the required permission
  RETURN EXISTS (
    SELECT 1
    FROM role_permissions rp
    JOIN permissions p ON p.id = rp.permission_id
    WHERE rp.role = user_role
    AND p.name = required_permission
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. CREATE ROLE CHECK FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION has_role(
  required_role TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  role_hierarchy JSONB;
BEGIN
  -- Get current user's role
  SELECT role INTO user_role
  FROM profiles
  WHERE id = auth.uid();

  -- Define role hierarchy (higher number = more permissions)
  role_hierarchy := '{
    "super_admin": 6,
    "admin": 5,
    "sales": 4,
    "finance": 4,
    "service": 4,
    "user": 1
  }'::jsonb;

  -- Check if user's role is equal or higher
  RETURN (role_hierarchy->>user_role)::int >= (role_hierarchy->>required_role)::int;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. UPDATE RLS POLICIES WITH ROLE-BASED ACCESS
-- =====================================================

-- Example: Leads table with role-based access
DROP POLICY IF EXISTS "Users can view org leads" ON leads;
CREATE POLICY "Users can view org leads"
  ON leads FOR SELECT
  USING (
    org_id = user_org_id() AND
    has_permission('leads.read')
  );

DROP POLICY IF EXISTS "Users can insert org leads" ON leads;
CREATE POLICY "Users can insert org leads"
  ON leads FOR INSERT
  WITH CHECK (
    org_id = user_org_id() AND
    has_permission('leads.create')
  );

DROP POLICY IF EXISTS "Users can update org leads" ON leads;
CREATE POLICY "Users can update org leads"
  ON leads FOR UPDATE
  USING (
    org_id = user_org_id() AND
    has_permission('leads.update')
  );

DROP POLICY IF EXISTS "Users can delete org leads" ON leads;
CREATE POLICY "Users can delete org leads"
  ON leads FOR DELETE
  USING (
    org_id = user_org_id() AND
    has_permission('leads.delete')
  );

-- =====================================================
-- 9. CREATE AUDIT LOG TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_org_id ON audit_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- =====================================================
-- 10. CREATE USER ACTIVITY TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS user_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_org_id ON user_activity(org_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity(created_at);
