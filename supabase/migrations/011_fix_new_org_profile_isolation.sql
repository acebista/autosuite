-- =====================================================
-- Migration 011: Fix New-Org Profile Isolation
-- Date: 2026-05-11
-- Purpose:
--   Fixes the root cause of new dealerships seeing other orgs' data.
--   The issue: when a new admin is created via the edge function,
--   the profile's user_id and is_active may not be set correctly,
--   causing user_org_id() to return NULL or the wrong org.
--   This allows RLS to pass all rows instead of scoping to the new org.
-- =====================================================

-- 1. Ensure every profile row has user_id = id if user_id is NULL
--    (handles edge cases where DB trigger didn't fire correctly)
UPDATE profiles
SET user_id = id
WHERE user_id IS NULL;

-- 2. For users with MORE than one profile (multi-org):
--    Ensure exactly ONE is_active = true per user_id.
--    If none is active, activate the most recently created one.
WITH ranked AS (
  SELECT id, user_id, org_id,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) AS rn,
    BOOL_OR(is_active) OVER (PARTITION BY user_id) AS has_active
  FROM profiles
  WHERE user_id IS NOT NULL
)
UPDATE profiles p
SET is_active = true
FROM ranked r
WHERE p.id = r.id
  AND r.rn = 1
  AND r.has_active = false;

-- 3. Prevent any user from having multiple is_active = true profiles
--    Keep only the most recent active one
WITH duplicates AS (
  SELECT id, user_id,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) AS rn
  FROM profiles
  WHERE is_active = true
)
UPDATE profiles p
SET is_active = false
FROM duplicates d
WHERE p.id = d.id
  AND d.rn > 1;

-- 4. Verify: show profile counts per org with is_active stats
SELECT
  o.name as org,
  COUNT(p.id) as total_profiles,
  COUNT(p.id) FILTER (WHERE p.is_active = true) as active_profiles,
  COUNT(p.id) FILTER (WHERE p.user_id IS NULL) as null_user_id
FROM organizations o
LEFT JOIN profiles p ON p.org_id = o.id
GROUP BY o.id, o.name
ORDER BY o.created_at;
