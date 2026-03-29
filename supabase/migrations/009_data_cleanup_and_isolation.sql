-- =====================================================
-- Migration: Data Cleanup & Strict Tenant Isolation
-- Date: 2026-03-27
-- Purpose:
--   1. Assign all orphaned/unscoped data to the default organization
--   2. Enforce NOT NULL org_id on all tenant-scoped tables
--   3. Verify RLS is active and correct on all tables
-- =====================================================

-- ── Step 1: Ensure default org exists ──────────────────────────────────────
DO $$
DECLARE
  default_org_id UUID;
BEGIN
  -- Find the first/oldest organization as the "default"
  SELECT id INTO default_org_id FROM organizations ORDER BY created_at ASC LIMIT 1;

  IF default_org_id IS NULL THEN
    INSERT INTO organizations (id, name, slug, subscription_tier, subscription_status)
    VALUES (gen_random_uuid(), 'AutoSuite Default', 'default', 'professional', 'active')
    RETURNING id INTO default_org_id;
    RAISE NOTICE 'Created default organization with id: %', default_org_id;
  ELSE
    RAISE NOTICE 'Using existing default organization: %', default_org_id;
  END IF;

  -- ── Step 2: Assign orphaned data to default org ──────────────────────────

  -- Leads
  UPDATE leads SET org_id = default_org_id WHERE org_id IS NULL;
  RAISE NOTICE 'Updated % orphaned leads', (SELECT COUNT(*) FROM leads WHERE org_id = default_org_id);

  -- Vehicles
  UPDATE vehicles SET org_id = default_org_id WHERE org_id IS NULL;

  -- Customers
  UPDATE customers SET org_id = default_org_id WHERE org_id IS NULL;

  -- Service Jobs
  UPDATE service_jobs SET org_id = default_org_id WHERE org_id IS NULL;

  -- Parts
  UPDATE parts SET org_id = default_org_id WHERE org_id IS NULL;

  -- Invoices
  UPDATE invoices SET org_id = default_org_id WHERE org_id IS NULL;

  -- Invoice Items (linked to invoices, inherit via invoice)
  -- Campaigns
  UPDATE campaigns SET org_id = default_org_id WHERE org_id IS NULL;

  -- Appointments
  UPDATE appointments SET org_id = default_org_id WHERE org_id IS NULL;

  -- Branches
  UPDATE branches SET org_id = default_org_id WHERE org_id IS NULL;

  -- Profiles: assign profiles with NULL org_id
  UPDATE profiles SET org_id = default_org_id WHERE org_id IS NULL;

  -- ── Step 3: Fix profiles.user_id for old-schema rows ─────────────────────
  -- For rows where user_id is still NULL (old schema), set it equal to id
  -- (since id = auth.uid() was the original design)
  UPDATE profiles SET user_id = id WHERE user_id IS NULL;

  -- ── Step 4: Ensure one active profile per user ────────────────────────────
  -- For users with NO active profile, activate their first one
  UPDATE profiles p
  SET is_active = true
  WHERE p.is_active = false
    AND NOT EXISTS (
      SELECT 1 FROM profiles p2
      WHERE p2.user_id = p.user_id AND p2.is_active = true
    )
    AND p.id IN (
      SELECT DISTINCT ON (user_id) id
      FROM profiles
      ORDER BY user_id, created_at ASC
    );

  RAISE NOTICE 'Data cleanup complete. Default org: %', default_org_id;
END $$;

-- ── Step 5: Enforce NOT NULL org_id on core tables ─────────────────────────
-- Only do this after all NULLs are filled above
DO $$
BEGIN
  -- Leads
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'org_id' AND is_nullable = 'YES') THEN
    ALTER TABLE leads ALTER COLUMN org_id SET NOT NULL;
    RAISE NOTICE 'leads.org_id set NOT NULL';
  END IF;

  -- Vehicles
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'org_id' AND is_nullable = 'YES') THEN
    ALTER TABLE vehicles ALTER COLUMN org_id SET NOT NULL;
    RAISE NOTICE 'vehicles.org_id set NOT NULL';
  END IF;

  -- Customers
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'org_id' AND is_nullable = 'YES') THEN
    ALTER TABLE customers ALTER COLUMN org_id SET NOT NULL;
    RAISE NOTICE 'customers.org_id set NOT NULL';
  END IF;

  -- profiles
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'user_id' AND is_nullable = 'YES') THEN
    ALTER TABLE profiles ALTER COLUMN user_id SET NOT NULL;
    RAISE NOTICE 'profiles.user_id set NOT NULL';
  END IF;

EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Could not enforce NOT NULL: %', SQLERRM;
END $$;

-- ── Step 6: Verify RLS is active on all tables ─────────────────────────────
DO $$
DECLARE
  t TEXT;
  tables_without_rls TEXT[] := ARRAY[]::TEXT[];
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename IN ('leads','vehicles','customers','service_jobs','parts','invoices','campaigns','appointments','branches','profiles')
      AND rowsecurity = false
  LOOP
    tables_without_rls := tables_without_rls || t;
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;

  IF array_length(tables_without_rls, 1) > 0 THEN
    RAISE NOTICE 'Enabled RLS on: %', array_to_string(tables_without_rls, ', ');
  ELSE
    RAISE NOTICE 'All tables already have RLS enabled ✓';
  END IF;
END $$;

-- ── Step 7: Add default check constraint to prevent cross-tenant inserts ───

-- Leads insert must match RLS org
DROP POLICY IF EXISTS "Enforce org_id on insert leads" ON leads;
CREATE POLICY "Enforce org_id on insert leads"
  ON leads FOR INSERT
  WITH CHECK (org_id = user_org_id());

-- ── Step 8: Verification queries ───────────────────────────────────────────

-- Show org distribution
SELECT 
  o.name as organization,
  o.slug,
  COUNT(DISTINCT p.user_id) as users,
  COUNT(DISTINCT l.id) as leads,
  COUNT(DISTINCT v.id) as vehicles,
  COUNT(DISTINCT c.id) as customers
FROM organizations o
LEFT JOIN profiles p ON p.org_id = o.id
LEFT JOIN leads l ON l.org_id = o.id
LEFT JOIN vehicles v ON v.org_id = o.id
LEFT JOIN customers c ON c.org_id = o.id
GROUP BY o.id, o.name, o.slug
ORDER BY o.created_at;
