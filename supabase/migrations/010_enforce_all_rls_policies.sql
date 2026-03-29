-- ============================================================
-- Migration 010: Enforce org-scoped RLS on ALL tenant tables
-- Drops every old "allow all / public" policy and replaces
-- with strict  org_id = user_org_id()  enforcement.
-- ============================================================

-- ── HELPER: drop every existing policy on a table ─────────────
-- We use dynamic SQL so this works even if policy names differ
-- across environments.

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'leads','vehicles','customers',
        'service_jobs','invoices','invoice_items',
        'campaigns','appointments',
        'parts','branches'
      )
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I',
      r.policyname, r.tablename
    );
  END LOOP;
END;
$$;

-- ── ENABLE RLS + FORCE (even table owner sees filtered rows) ───

ALTER TABLE leads          ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads          FORCE  ROW LEVEL SECURITY;

ALTER TABLE vehicles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles       FORCE  ROW LEVEL SECURITY;

ALTER TABLE customers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers      FORCE  ROW LEVEL SECURITY;

ALTER TABLE service_jobs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_jobs   FORCE  ROW LEVEL SECURITY;

ALTER TABLE invoices        ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices        FORCE  ROW LEVEL SECURITY;

ALTER TABLE invoice_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items   FORCE  ROW LEVEL SECURITY;

ALTER TABLE campaigns       ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns       FORCE  ROW LEVEL SECURITY;

ALTER TABLE appointments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments    FORCE  ROW LEVEL SECURITY;

ALTER TABLE branches        ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches        FORCE  ROW LEVEL SECURITY;

-- Parts have no org_id; scope to authenticated users only
ALTER TABLE parts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts           FORCE  ROW LEVEL SECURITY;

-- ── LEADS ──────────────────────────────────────────────────────
CREATE POLICY "leads_select" ON leads
  FOR SELECT USING (org_id = user_org_id());

CREATE POLICY "leads_insert" ON leads
  FOR INSERT WITH CHECK (org_id = user_org_id());

CREATE POLICY "leads_update" ON leads
  FOR UPDATE USING (org_id = user_org_id());

CREATE POLICY "leads_delete" ON leads
  FOR DELETE USING (org_id = user_org_id());

-- ── VEHICLES ───────────────────────────────────────────────────
CREATE POLICY "vehicles_select" ON vehicles
  FOR SELECT USING (org_id = user_org_id());

CREATE POLICY "vehicles_insert" ON vehicles
  FOR INSERT WITH CHECK (org_id = user_org_id());

CREATE POLICY "vehicles_update" ON vehicles
  FOR UPDATE USING (org_id = user_org_id());

CREATE POLICY "vehicles_delete" ON vehicles
  FOR DELETE USING (org_id = user_org_id());

-- ── CUSTOMERS ──────────────────────────────────────────────────
CREATE POLICY "customers_select" ON customers
  FOR SELECT USING (org_id = user_org_id());

CREATE POLICY "customers_insert" ON customers
  FOR INSERT WITH CHECK (org_id = user_org_id());

CREATE POLICY "customers_update" ON customers
  FOR UPDATE USING (org_id = user_org_id());

CREATE POLICY "customers_delete" ON customers
  FOR DELETE USING (org_id = user_org_id());

-- ── SERVICE JOBS ───────────────────────────────────────────────
CREATE POLICY "service_jobs_select" ON service_jobs
  FOR SELECT USING (org_id = user_org_id());

CREATE POLICY "service_jobs_insert" ON service_jobs
  FOR INSERT WITH CHECK (org_id = user_org_id());

CREATE POLICY "service_jobs_update" ON service_jobs
  FOR UPDATE USING (org_id = user_org_id());

CREATE POLICY "service_jobs_delete" ON service_jobs
  FOR DELETE USING (org_id = user_org_id());

-- ── INVOICES ───────────────────────────────────────────────────
CREATE POLICY "invoices_select" ON invoices
  FOR SELECT USING (org_id = user_org_id());

CREATE POLICY "invoices_insert" ON invoices
  FOR INSERT WITH CHECK (org_id = user_org_id());

CREATE POLICY "invoices_update" ON invoices
  FOR UPDATE USING (org_id = user_org_id());

-- ── INVOICE ITEMS (scoped via parent invoice) ──────────────────
-- invoice_items joins to invoices; scope via org_id on invoices
CREATE POLICY "invoice_items_select" ON invoice_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM invoices i
      WHERE i.id = invoice_items.invoice_id
        AND i.org_id = user_org_id()
    )
  );

CREATE POLICY "invoice_items_insert" ON invoice_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM invoices i
      WHERE i.id = invoice_items.invoice_id
        AND i.org_id = user_org_id()
    )
  );

-- ── CAMPAIGNS ──────────────────────────────────────────────────
CREATE POLICY "campaigns_select" ON campaigns
  FOR SELECT USING (org_id = user_org_id());

CREATE POLICY "campaigns_insert" ON campaigns
  FOR INSERT WITH CHECK (org_id = user_org_id());

CREATE POLICY "campaigns_update" ON campaigns
  FOR UPDATE USING (org_id = user_org_id());

-- ── APPOINTMENTS ───────────────────────────────────────────────
CREATE POLICY "appointments_select" ON appointments
  FOR SELECT USING (org_id = user_org_id());

CREATE POLICY "appointments_insert" ON appointments
  FOR INSERT WITH CHECK (org_id = user_org_id());

CREATE POLICY "appointments_update" ON appointments
  FOR UPDATE USING (org_id = user_org_id());

-- ── BRANCHES ───────────────────────────────────────────────────
CREATE POLICY "branches_select" ON branches
  FOR SELECT USING (org_id = user_org_id());

CREATE POLICY "branches_insert" ON branches
  FOR INSERT WITH CHECK (org_id = user_org_id());

CREATE POLICY "branches_update" ON branches
  FOR UPDATE USING (org_id = user_org_id());

-- ── PARTS (org-agnostic, require auth) ────────────────────────
CREATE POLICY "parts_select" ON parts
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "parts_insert" ON parts
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "parts_update" ON parts
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ── VERIFY ─────────────────────────────────────────────────────
SELECT
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'leads','vehicles','customers',
    'service_jobs','invoices','campaigns',
    'appointments','branches','parts'
  )
ORDER BY tablename, cmd;
