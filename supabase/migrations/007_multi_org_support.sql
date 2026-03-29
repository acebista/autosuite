-- Migration: Multi-Organization Support
-- Description: Allows a single Auth User to belong to multiple organizations
-- Date: 2026-03-27

-- 1. Modify Profiles table to support multiple memberships per Auth User
-- First, add user_id column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Backfill user_id with the current id (which is currently the Auth UID)
UPDATE profiles SET user_id = id WHERE user_id IS NULL;

-- Now we can have multiple rows with the same user_id but different org_ids.
-- We should add a unique constraint to prevent duplicate memberships in the same org.
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS unique_user_org;
ALTER TABLE profiles ADD CONSTRAINT unique_user_org UNIQUE (user_id, org_id);

-- 2. Update the user_org_id() helper function to use JWT metadata
-- This allows the application to "scope" the session to a specific organization
CREATE OR REPLACE FUNCTION user_org_id()
RETURNS UUID AS $$
DECLARE
  jwt_org_id TEXT;
BEGIN
  -- Try to get org_id from JWT metadata (set during login)
  jwt_org_id := auth.jwt() -> 'user_metadata' ->> 'org_id';
  
  IF jwt_org_id IS NOT NULL AND jwt_org_id <> '' THEN
    RETURN jwt_org_id::UUID;
  END IF;

  -- Fallback: Get the first available org_id for this user
  RETURN (SELECT org_id FROM profiles WHERE user_id = auth.uid() LIMIT 1);
END;
$$ LANGUAGE plpgsql STABLE;

-- 3. Update RLS policies that were using profiles.id = auth.uid()
-- They should now use profiles.user_id = auth.uid() where appropriate,
-- or continue using profiles.id if they refer to the specific membership.

-- Example: "Users can update their own profile"
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (user_id = auth.uid());

-- "Admins can insert org users" (already used user_org_id())
-- "Users can view org profiles" (already used user_org_id())

-- 4. Add a function to get available organizations for a user (without RLS restrictions if possible, or via RPC)
CREATE OR REPLACE FUNCTION get_my_organizations()
RETURNS TABLE (
    org_id UUID,
    org_name TEXT,
    org_slug TEXT,
    org_logo_url TEXT,
    user_role TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.name,
        o.slug,
        o.logo_url,
        p.role
    FROM profiles p
    JOIN organizations o ON p.org_id = o.id
    WHERE p.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
