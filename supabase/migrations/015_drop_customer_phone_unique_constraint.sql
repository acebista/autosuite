-- Migration: 015_drop_customer_phone_unique_constraint.sql
-- Description: Drop the global unique constraint on phone and replace it with a composite unique constraint on (phone, org_id)
-- Date: 2026-06-24

ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_phone_key;
ALTER TABLE customers ADD CONSTRAINT customers_phone_org_id_key UNIQUE (phone, org_id);
