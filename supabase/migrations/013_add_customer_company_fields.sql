-- Migration: 013_add_customer_company_fields.sql
-- Description: Add company_name and pan_number columns to customers table

ALTER TABLE customers ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS pan_number TEXT;

COMMENT ON COLUMN customers.company_name IS 'Company Name of the customer';
COMMENT ON COLUMN customers.pan_number IS 'PAN number of the customer';
