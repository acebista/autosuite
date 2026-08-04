#!/bin/bash
export SUPABASE_ACCESS_TOKEN="${SUPABASE_ACCESS_TOKEN:?Set SUPABASE_ACCESS_TOKEN in your shell before running this script}"

echo "Repairing remote-only migrations as reverted..."
npx supabase@2.84.4 migration repair --status reverted 20251226045903
npx supabase@2.84.4 migration repair --status reverted 20251226050158
npx supabase@2.84.4 migration repair --status reverted 20251226050417
npx supabase@2.84.4 migration repair --status reverted 20251226070622
npx supabase@2.84.4 migration repair --status reverted 20251226070822
npx supabase@2.84.4 migration repair --status reverted 20251226070824
npx supabase@2.84.4 migration repair --status reverted 20260206042807
npx supabase@2.84.4 migration repair --status reverted 20260206044813
npx supabase@2.84.4 migration repair --status reverted 20260326021153

echo "Repairing local migrations as applied..."
npx supabase@2.84.4 migration repair --status applied 000
npx supabase@2.84.4 migration repair --status applied 001
npx supabase@2.84.4 migration repair --status applied 002
npx supabase@2.84.4 migration repair --status applied 003
npx supabase@2.84.4 migration repair --status applied 004
npx supabase@2.84.4 migration repair --status applied 005
npx supabase@2.84.4 migration repair --status applied 006
npx supabase@2.84.4 migration repair --status applied 007
npx supabase@2.84.4 migration repair --status applied 008
npx supabase@2.84.4 migration repair --status applied 009
npx supabase@2.84.4 migration repair --status applied 010
npx supabase@2.84.4 migration repair --status applied 011
npx supabase@2.84.4 migration repair --status applied 012
npx supabase@2.84.4 migration repair --status applied 013
npx supabase@2.84.4 migration repair --status applied 014

echo "Migration history repaired successfully!"
