-- Migration 017: Add units column to proforma_invoices
-- Run this in the Supabase SQL Editor at:
-- https://supabase.com/dashboard/project/tjjxrfiorfboknnaxevz/sql/new

ALTER TABLE proforma_invoices
  ADD COLUMN IF NOT EXISTS units INTEGER DEFAULT 1;

-- Optional: backfill existing PIs with correct unit counts based on linked vehicles
-- UPDATE proforma_invoices pi
-- SET units = (SELECT COUNT(*) FROM vehicles v WHERE v.pi_id = pi.id)
-- WHERE units = 1;
