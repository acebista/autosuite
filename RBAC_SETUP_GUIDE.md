# RBAC System - Quick Setup Guide

## ✅ What's Been Created

### 1. Database Migration
- **File:** `supabase/migrations/003_rbac_system.sql`
- **Contains:**
  - 6 role types (super_admin, admin, sales, finance, service, user)
  - Permissions table with granular permissions
  - Role-permission mappings
  - Helper functions for permission checks
  - Updated RLS policies
  - Audit logging tables

### 2. Frontend Utilities
- **File:** `lib/rbac.ts`
- **Functions:**
  - `hasPermission()` - Check if user has specific permission
  - `hasRole()` - Check if user has role level
  - `getCurrentUserProfile()` - Get user with role
  - `inviteUser()` - Invite new users
  - `updateUserRole()` - Change user roles
  - `removeUser()` - Remove users
  - `getAuditLogs()` - View audit trail

### 3. User Management Page
- **File:** `pages/UserManagement.tsx`
- **Features:**
  - View all organization users
  - Invite new users with role selection
  - Edit user roles
  - Remove users
  - Search and filter
  - Role-based UI (shows/hides based on permissions)

### 4. Documentation
- **File:** `RBAC_SYSTEM.md`
- **Includes:**
  - Complete role hierarchy
  - Permission matrix
  - Implementation examples
  - Testing procedures
  - Troubleshooting guide

---

## 🚀 Implementation Steps

### Step 1: Run Database Migration (5 mins)

```bash
# Option A: Using Supabase CLI
supabase db push

# Option B: Manual in Supabase Dashboard
# 1. Go to SQL Editor
# 2. Copy contents of supabase/migrations/003_rbac_system.sql
# 3. Run the SQL
```

**Verify:**
```sql
-- Check roles exist
SELECT DISTINCT role FROM profiles;

-- Check permissions created
SELECT COUNT(*) FROM permissions;
-- Should return ~40+ permissions

-- Check role mappings
SELECT role, COUNT(*) as permission_count
FROM role_permissions
GROUP BY role;
```

---

### Step 2: Update Existing Users (2 mins)

```sql
-- Assign yourself as super admin
UPDATE profiles 
SET role = 'super_admin' 
WHERE email = 'your-email@example.com';

-- Assign other users appropriate roles
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'admin@example.com';

UPDATE profiles 
SET role = 'sales' 
WHERE email = 'sales@example.com';
```

---

### Step 3: Add Navigation Link (1 min)

Update your navigation menu to include User Management:

```typescript
// In your navigation component (e.g., AppShell.tsx or Sidebar.tsx)
import { Users } from 'lucide-react';

// Add to navigation items
{
  path: '/users',
  label: 'User Management',
  icon: Users,
  // Only show to admins
  visible: userRole === 'admin' || userRole === 'super_admin'
}
```

---

### Step 4: Test the System (5 mins)

#### Test 1: Access User Management
1. Navigate to `/users`
2. Should see list of all users
3. Should see "Invite User" button (if admin/super_admin)

#### Test 2: Invite a User
1. Click "Invite User"
2. Fill in email, name, and select role
3. Click "Send Invite"
4. Should see success message

#### Test 3: Edit User Role
1. Click "Edit" icon on a user
2. Select a different role
3. Confirm change
4. Should see success message

#### Test 4: Permission Check
```typescript
// In browser console
import { hasPermission } from './lib/rbac';

// Test as sales user
await hasPermission('leads.create'); // Should be true
await hasPermission('invoices.delete'); // Should be false

// Test as finance user
await hasPermission('invoices.delete'); // Should be true
await hasPermission('leads.create'); // Should be false
```

---

## 🎯 Role Assignment Guide

### For Your Organization

**Super Admin (You)**
- Email: your-email@example.com
- Role: `super_admin`
- Purpose: Platform management

**Admins (Dealership Managers)**
- Role: `admin`
- Who: General Manager, Operations Head
- Can: Manage all users and data

**Sales Team**
- Role: `sales`
- Who: Sales Representatives, Lead Managers
- Can: Manage leads, customers, create invoices

**Finance Team**
- Role: `finance`
- Who: Accountants, Finance Managers
- Can: Manage invoices, payments, financial reports

**Service Team**
- Role: `service`
- Who: Service Advisors, Technicians
- Can: Manage service jobs, parts inventory

**Basic Users**
- Role: `user`
- Who: Interns, Temporary Staff
- Can: View-only access

---

## 📋 Common Tasks

### Task 1: Invite a New Sales Rep

```typescript
import { inviteUser } from './lib/rbac';

await inviteUser(
  'newrep@example.com',
  'sales',
  'John Doe'
);
```

### Task 2: Promote User to Admin

```typescript
import { updateUserRole } from './lib/rbac';

await updateUserRole('user-id', 'admin');
```

### Task 3: Check User's Permissions

```sql
SELECT 
  p.email,
  p.role,
  perm.name as permission
FROM profiles p
JOIN role_permissions rp ON rp.role = p.role
JOIN permissions perm ON perm.id = rp.permission_id
WHERE p.email = 'user@example.com'
ORDER BY perm.resource, perm.action;
```

### Task 4: View Audit Log

```typescript
import { getAuditLogs } from './lib/rbac';

const logs = await getAuditLogs(50); // Last 50 actions
console.table(logs);
```

---

## 🔒 Security Checklist

- [ ] Super admin role assigned only to you
- [ ] All users have appropriate roles
- [ ] RLS policies enabled on all tables
- [ ] Permission checks in place
- [ ] Audit logging working
- [ ] Test cross-role access (should fail)
- [ ] Test same-role access (should succeed)

---

## 🐛 Troubleshooting

### Issue: "Cannot find module './lib/supabase'"
**Fix:** Ensure `lib/supabase.ts` exists with:
```typescript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

### Issue: User Management page shows "Insufficient permissions"
**Fix:** Check user's role:
```sql
SELECT email, role FROM profiles WHERE email = 'your-email@example.com';
```
Should be 'admin' or 'super_admin'

### Issue: Permission check always returns false
**Fix:** Verify RPC function exists:
```sql
SELECT * FROM pg_proc WHERE proname = 'has_permission';
```
If missing, re-run migration 003_rbac_system.sql

---

## 📊 Monitoring

### Daily Checks
```sql
-- Active users by role
SELECT role, COUNT(*) as count
FROM profiles
GROUP BY role;

-- Recent user actions
SELECT 
  p.name,
  al.action,
  al.resource_type,
  al.created_at
FROM audit_logs al
JOIN profiles p ON p.id = al.user_id
ORDER BY al.created_at DESC
LIMIT 20;
```

### Weekly Reviews
- Review audit logs for suspicious activity
- Check for users with incorrect roles
- Remove inactive users
- Update permissions if needed

---

## 🎉 You're Done!

Your RBAC system is now ready. Navigate to `/users` to start managing your team!

### Next Steps:
1. Assign roles to all existing users
2. Invite new team members
3. Test permissions thoroughly
4. Train admins on user management
5. Monitor audit logs regularly

### Need Help?
- Check `RBAC_SYSTEM.md` for detailed documentation
- Review `lib/rbac.ts` for available functions
- Test in development before production
