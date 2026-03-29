-- Migration: Active Profile Support
-- Description: Adds is_active flag to profiles to consistently scope the session
-- Date: 2026-03-27

-- 1. Add is_active column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;

-- 2. Add an index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_active ON profiles(user_id, is_active);

-- 3. Create a function to set the active organization
CREATE OR REPLACE FUNCTION set_active_org(target_org_id UUID)
RETURNS void AS $$
BEGIN
    -- Deactivate all for this user
    UPDATE profiles 
    SET is_active = false 
    WHERE user_id = auth.uid();
    
    -- Activate the selected one
    UPDATE profiles 
    SET is_active = true 
    WHERE user_id = auth.uid() AND org_id = target_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Update the user_org_id() helper function to use the active flag
CREATE OR REPLACE FUNCTION user_org_id()
RETURNS UUID AS $$
DECLARE
  active_org_id UUID;
BEGIN
  -- Priority 1: Check the profiles table for an active flag
  SELECT org_id INTO active_org_id 
  FROM profiles 
  WHERE user_id = auth.uid() 
  AND is_active = true 
  LIMIT 1;
  
  IF active_org_id IS NOT NULL THEN
    RETURN active_org_id;
  END IF;

  -- Fallback: Use the first available org if none is active
  RETURN (SELECT org_id FROM profiles WHERE user_id = auth.uid() LIMIT 1);
END;
$$ LANGUAGE plpgsql STABLE;
