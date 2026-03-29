-- Migration: 006_add_available_colors.sql
-- Description: Adds available_colors JSONB column to vehicles table for color options management
-- Date: 2026-02-06

-- Add available_colors column to vehicles table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'available_colors') THEN
        ALTER TABLE vehicles ADD COLUMN available_colors JSONB DEFAULT '[]'::jsonb;
        COMMENT ON COLUMN vehicles.available_colors IS 'Array of available color options with format [{color: string, image: string}]';
    END IF;
END $$;
