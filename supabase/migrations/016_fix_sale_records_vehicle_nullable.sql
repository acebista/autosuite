-- Migration: 016_fix_sale_records_vehicle_nullable.sql
-- Description: Make vehicle_id nullable in sale_records so bookings can be
--              created before a specific vehicle unit is allocated.
--              Allocation is a separate subsequent step in the deal workflow.
-- Date: 2026-06-23

ALTER TABLE sale_records
  ALTER COLUMN vehicle_id DROP NOT NULL;
