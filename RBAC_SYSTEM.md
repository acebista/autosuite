# Role-Based Access Control (RBAC) System

## Overview
AutoSuite implements a comprehensive RBAC system with 6 distinct roles, each with specific permissions and access levels.

## Role Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│  SUPER ADMIN (You)                                      │
│  • Full system access                                   │
│  • Can assign admin roles                               │
│  • Manages all organizations                            │
│  • Platform-level control                               │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  ADMIN (Organization Admins)                            │
│  • Full organization access                             │
│  • User management (invite, edit, remove)               │
│  • All data CRUD operations                             │
│  • Cannot assign super admin role                       │
└─────────────────────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   SALES      │ │   FINANCE    │ │   SERVICE    │
│              │ │              │ │              │
│ • Leads      │ │ • Invoices   │ │ • Service    │
│ • Customers  │ │ • Payments   │ │   Jobs       │
│ • Vehicles   │ │ • Reports    │ │ • Parts      │
│   (read)     │ │ • Customers  │ │ • Customers  │
│ • Invoices   │ │   (read)     │ │   (read)     │
│   (create)   │ │              │ │              │
└──────────────┘ └──────────────┘ └──────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  USER (Basic Access)                                    │
│  • Read-only access to organization data                │
│  • Cannot create, update, or delete                     │
└─────────────────────────────────────────────────────────┘
```

## Detailed Role Permissions

### 1. Super Admin
**Who:** Platform owner (you)
**Access Level:** Unlimited

**Permissions:**
- ✅ All permissions across all organizations
- ✅ Assign/revoke admin roles
- ✅ Create/delete organizations
- ✅ View system-wide analytics
- ✅ Manage subscriptions
- ✅ Access audit logs

**Use Cases:**
- Platform management
- Organization setup
- Troubleshooting
- System maintenance

---

### 2. Admin
**Who:** Organization administrators
**Access Level:** Full organization access

**Permissions:**
- ✅ Manage users (invite, edit roles, remove)
- ✅ Full CRUD on all data (leads, vehicles, customers, etc.)
- ✅ Manage organization settings
- ✅ View all reports
- ✅ Manage branches
- ❌ Cannot assign super admin role
- ❌ Cannot access other organizations

**Use Cases:**
- Dealership manager
- Operations head
- IT administrator

---

### 3. Sales
**Who:** Sales team members
**Access Level:** Sales-focused

**Permissions:**
- ✅ **Leads:** Create, Read, Update, Delete
- ✅ **Customers:** Create, Read, Update
- ✅ **Vehicles:** Read only
- ✅ **Invoices:** Create, Read
- ✅ **Sales Reports:** View
- ❌ Cannot manage users
- ❌ Cannot access service/parts
- ❌ Cannot modify financial data

**Use Cases:**
- Sales representatives
- Lead managers
- Customer relationship managers

---

### 4. Finance
**Who:** Finance team members
**Access Level:** Finance-focused

**Permissions:**
- ✅ **Invoices:** Create, Read, Update, Delete
- ✅ **Payments:** Manage
- ✅ **Customers:** Read only
- ✅ **Leads:** Read only
- ✅ **Finance Reports:** View
- ❌ Cannot manage users
- ❌ Cannot access service/parts
- ❌ Cannot modify leads

**Use Cases:**
- Accountants
- Finance managers
- Billing specialists

---

### 5. Service
**Who:** Service team members
**Access Level:** Service-focused

**Permissions:**
- ✅ **Service Jobs:** Create, Read, Update, Delete
- ✅ **Parts:** Create, Read, Update
- ✅ **Customers:** Read only
- ✅ **Vehicles:** Read only
- ✅ **Service Reports:** View
- ❌ Cannot manage users
- ❌ Cannot access sales/finance
- ❌ Cannot modify invoices

**Use Cases:**
- Service advisors
- Technicians
- Parts managers

---

### 6. User
**Who:** Basic team members
**Access Level:** Read-only

**Permissions:**
- ✅ **All Data:** Read only
- ❌ Cannot create, update, or delete
- ❌ Cannot manage users
- ❌ Cannot access sensitive reports

**Use Cases:**
- Interns
- Temporary staff
- View-only access

---

## Permission Matrix

| Resource | Super Admin | Admin | Sales | Finance | Service | User |
|----------|-------------|-------|-------|---------|---------|------|
| **Leads** |
| Create | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Read | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Update | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Vehicles** |
| Create | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Read | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| Update | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Delete | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Customers** |
| Create | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Update | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Invoices** |
| Create | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Read | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Update | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Delete | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Service Jobs** |
| Create | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Read | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| Update | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Delete | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Parts** |
| Create | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Read | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| Update | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Delete | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Users** |
| Invite | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Read | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Edit Role | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Remove | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Organization** |
| View Settings | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Edit Settings | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage Subscription | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## Implementation

### Database Schema

```sql
-- Profiles table with role
profiles
├── id (UUID)
├── org_id (UUID) → organizations.id
├── email
├── name
├── role (super_admin|admin|sales|finance|service|user)
└── department

-- Permissions table
permissions
├── id (UUID)
├── name (e.g., 'leads.create')
├── resource (e.g., 'leads')
└── action (create|read|update|delete|manage)

-- Role-Permission mapping
role_permissions
├── role (super_admin|admin|sales|finance|service|user)
└── permission_id → permissions.id
```

### Frontend Usage

```typescript
import { hasPermission, hasRole, getCurrentUserProfile } from './lib/rbac';

// Check specific permission
const canCreateLeads = await hasPermission('leads.create');

// Check role level
const isAdmin = await hasRole('admin');

// Get user profile with role
const profile = await getCurrentUserProfile();
console.log(profile.role); // 'admin', 'sales', etc.
```

### Protecting UI Elements

```typescript
// Show button only if user has permission
{canManageUsers && (
  <Button onClick={handleInviteUser}>
    Invite User
  </Button>
)}

// Conditional rendering based on role
{profile.role === 'admin' && (
  <AdminPanel />
)}
```

---

## User Management Workflow

### 1. Inviting Users (Admin/Super Admin only)

```
Admin clicks "Invite User"
    ↓
Fills in: Email, Name, Role
    ↓
System generates invite token
    ↓
Email sent to user
    ↓
User clicks link → Signs up
    ↓
Automatically assigned to organization with specified role
```

### 2. Changing User Roles (Admin/Super Admin only)

```
Admin navigates to User Management
    ↓
Clicks "Edit" on user
    ↓
Selects new role
    ↓
System validates permission
    ↓
Role updated + Audit log created
```

### 3. Removing Users (Admin/Super Admin only)

```
Admin clicks "Remove" on user
    ↓
Confirmation dialog
    ↓
User deleted from organization
    ↓
All user's data remains (assigned to org)
    ↓
Audit log created
```

---

## Security Features

### 1. Row Level Security (RLS)
- All queries automatically filtered by `org_id`
- Permission checks in RLS policies
- Users can only access their organization's data

### 2. Permission Validation
- Frontend checks permissions before showing UI
- Backend validates permissions in RLS policies
- Double-layer security

### 3. Audit Logging
- All user management actions logged
- Track who did what, when
- Immutable audit trail

### 4. Role Hierarchy
- Higher roles inherit lower role permissions
- Super admin has all permissions
- Prevents privilege escalation

---

## Testing RBAC

### Test 1: Permission Check
```typescript
// As Sales user
const canDeleteInvoice = await hasPermission('invoices.delete');
// Should return false

// As Finance user
const canDeleteInvoice = await hasPermission('invoices.delete');
// Should return true
```

### Test 2: Data Access
```sql
-- As Sales user, try to access service jobs
SELECT * FROM service_jobs;
-- Should return empty (RLS blocks)

-- As Service user, try to access service jobs
SELECT * FROM service_jobs;
-- Should return service jobs
```

### Test 3: User Management
```typescript
// As Sales user, try to invite user
const result = await inviteUser('test@example.com', 'user');
// Should fail with "Insufficient permissions"

// As Admin, try to invite user
const result = await inviteUser('test@example.com', 'user');
// Should succeed
```

---

## Best Practices

1. **Principle of Least Privilege**
   - Assign minimum role needed
   - Start with 'user', upgrade as needed

2. **Regular Audits**
   - Review user roles quarterly
   - Remove inactive users
   - Check audit logs

3. **Clear Communication**
   - Inform users of their role
   - Explain what they can/cannot do
   - Provide training

4. **Role Naming**
   - Use clear, descriptive names
   - Match to job functions
   - Avoid ambiguous titles

---

## Migration Path

### Phase 1: Setup (Completed)
- ✅ Created RBAC database schema
- ✅ Defined 6 roles
- ✅ Seeded permissions
- ✅ Created RLS policies

### Phase 2: Frontend Integration (Next)
- [ ] Add User Management page to navigation
- [ ] Implement permission checks in components
- [ ] Add role badges to user profiles
- [ ] Test all role scenarios

### Phase 3: Rollout
- [ ] Assign roles to existing users
- [ ] Train admins on user management
- [ ] Monitor audit logs
- [ ] Gather feedback

---

## Troubleshooting

### Issue: User can't access expected features
**Solution:** Check their role and permissions
```sql
SELECT p.email, p.role, COUNT(rp.permission_id) as permissions
FROM profiles p
LEFT JOIN role_permissions rp ON rp.role = p.role
WHERE p.email = 'user@example.com'
GROUP BY p.id, p.email, p.role;
```

### Issue: Admin can't assign super admin role
**Expected:** Only super admins can assign super admin role
**Solution:** This is by design for security

### Issue: Permission check returns false unexpectedly
**Solution:** Verify permission exists in role_permissions table
```sql
SELECT * FROM role_permissions 
WHERE role = 'sales' 
AND permission_id IN (
  SELECT id FROM permissions WHERE name = 'leads.create'
);
```

---

## Next Steps

1. **Navigate to User Management**
   - Go to `/users` route
   - View all organization users
   - Test invite functionality

2. **Assign Roles**
   - Identify team members
   - Assign appropriate roles
   - Communicate changes

3. **Monitor Usage**
   - Check audit logs
   - Verify permissions work
   - Adjust as needed
