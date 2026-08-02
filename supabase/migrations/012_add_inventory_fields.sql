-- Migration: 012_add_inventory_fields.sql
-- Description: Add proforma_invoice_no, lc_no, motor_no, and registration_no to vehicles table

ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS proforma_invoice_no TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS lc_no TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS motor_no TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS registration_no TEXT;

COMMENT ON COLUMN vehicles.proforma_invoice_no IS 'Proforma Invoice number for each new inventory';
COMMENT ON COLUMN vehicles.lc_no IS 'LC number for each new car added to inventory';
COMMENT ON COLUMN vehicles.motor_no IS 'Motor Number of each car';
COMMENT ON COLUMN vehicles.registration_no IS 'Vehicle registration number (optional on creation, can be added later)';
