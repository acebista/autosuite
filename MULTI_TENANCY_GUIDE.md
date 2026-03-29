# Multi-Tenancy Implementation Guide

## Quick Start

### Step 1: Run Database Migrations

```bash
# Using Supabase CLI
supabase db push

# Or manually in Supabase SQL Editor:
# 1. Run supabase/migrations/001_add_multi_tenancy.sql
# 2. Run supabase/migrations/002_rls_policies.sql
```

### Step 2: Wrap App with Organization Provider

```typescript
// App.tsx or main.tsx
import { OrganizationProvider } from './contexts/OrganizationContext';

function App() {
  return (
    <OrganizationProvider>
      <QueryClientProvider client={queryClient}>
        {/* Your app routes */}
      </QueryClientProvider>
    </OrganizationProvider>
  );
}
```

### Step 3: Update API Calls to Include org_id

**Before (without multi-tenancy):**
```typescript
const { data, error } = await supabase
  .from('leads')
  .insert([{ name: 'John Doe', phone: '123456' }]);
```

**After (with multi-tenancy):**
```typescript
import { withOrgId } from './lib/multiTenancy';

const leadData = await withOrgId({ 
  name: 'John Doe', 
  phone: '123456' 
});

const { data, error } = await supabase
  .from('leads')
  .insert([leadData]);
```

### Step 4: Use Organization Context in Components

```typescript
import { useOrganization } from '../contexts/OrganizationContext';

function MyComponent() {
  const { organization, isLoading } = useOrganization();

  if (isLoading) return <div>Loading...</div>;
  if (!organization) return <div>No organization found</div>;

  return (
    <div>
      <h1>{organization.name}</h1>
      <p>Plan: {organization.subscription_tier}</p>
    </div>
  );
}
```

## Example: Updated API Method

```typescript
// api.ts - Example for creating a lead with org_id
import { withOrgId } from './lib/multiTenancy';

export const api = {
  leads: {
    create: async (lead: Partial<Lead>): Promise<Lead> => {
      // Automatically add org_id
      const leadWithOrg = await withOrgId(lead);
      
      const { data, error } = await supabase
        .from('leads')
        .insert([leadWithOrg])
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    update: async (id: string, updates: Partial<Lead>): Promise<Lead> => {
      // RLS will automatically ensure user can only update their org's leads
      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  }
};
```

## Testing Multi-Tenancy

### 1. Create Test Organizations

```sql
-- In Supabase SQL Editor
INSERT INTO organizations (name, slug, subscription_tier) VALUES 
  ('Kathmandu Auto Center', 'kathmandu-auto', 'professional'),
  ('Pokhara Motors', 'pokhara-motors', 'starter');
```

### 2. Assign Users to Organizations

```sql
-- Update existing users
UPDATE profiles 
SET org_id = (SELECT id FROM organizations WHERE slug = 'kathmandu-auto')
WHERE email = 'user@example.com';
```

### 3. Test Data Isolation

```typescript
// As User A (Kathmandu Auto)
const { data: leads } = await supabase.from('leads').select('*');
// Should only see Kathmandu Auto's leads

// Try to access another org's data (should fail)
const { data: otherLeads } = await supabase
  .from('leads')
  .select('*')
  .eq('org_id', 'pokhara-org-id'); // Returns empty due to RLS
```

## Common Patterns

### Pattern 1: Batch Insert with org_id

```typescript
import { withOrgIdBatch } from './lib/multiTenancy';

const vehicles = [
  { model: 'Toyota Fortuner', price: 5000000 },
  { model: 'Honda City', price: 2000000 }
];

const vehiclesWithOrg = await withOrgIdBatch(vehicles);

await supabase.from('vehicles').insert(vehiclesWithOrg);
```

### Pattern 2: Permission Check

```typescript
import { hasOrgPermission } from './lib/multiTenancy';

async function deleteVehicle(id: string) {
  const canDelete = await hasOrgPermission('admin');
  
  if (!canDelete) {
    throw new Error('Insufficient permissions');
  }

  await supabase.from('vehicles').delete().eq('id', id);
}
```

### Pattern 3: Usage Limits

```typescript
import { checkOrgLimits } from './lib/multiTenancy';

async function inviteUser(email: string) {
  const { canAddUsers } = await checkOrgLimits();
  
  if (!canAddUsers) {
    throw new Error('User limit reached. Please upgrade your plan.');
  }

  // Proceed with invite
}
```

## Migration Checklist

- [ ] Run database migrations
- [ ] Create default organization
- [ ] Assign existing users to default org
- [ ] Wrap app with OrganizationProvider
- [ ] Update all API create/insert methods to use `withOrgId()`
- [ ] Test RLS policies work correctly
- [ ] Verify users can't access other orgs' data
- [ ] Update UI to show organization name/logo
- [ ] Implement organization settings page
- [ ] Add user invite functionality

## Security Verification

```sql
-- 1. Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = false;
-- Should return empty

-- 2. Check all tables have org_id
SELECT table_name 
FROM information_schema.columns 
WHERE column_name = 'org_id' 
AND table_schema = 'public';

-- 3. Test cross-org access
-- Login as User A, try to query User B's org data
SELECT * FROM leads WHERE org_id != auth.user_org_id();
-- Should return empty
```

## Troubleshooting

### Issue: "User not associated with organization"
**Solution:** Ensure user's profile has `org_id` set:
```sql
UPDATE profiles SET org_id = 'your-org-id' WHERE id = 'user-id';
```

### Issue: RLS blocking legitimate queries
**Solution:** Check if user's `org_id` matches the data's `org_id`:
```sql
SELECT p.email, p.org_id, l.org_id as lead_org_id
FROM profiles p
LEFT JOIN leads l ON l.org_id = p.org_id
WHERE p.id = 'user-id';
```

### Issue: Can't insert data
**Solution:** Verify `withOrgId()` is being used:
```typescript
// Wrong
await supabase.from('leads').insert([{ name: 'Test' }]);

// Correct
const data = await withOrgId({ name: 'Test' });
await supabase.from('leads').insert([data]);
```

## Next Steps

1. **Organization Management UI**: Create pages for:
   - Organization settings
   - User management
   - Subscription/billing
   - Branding customization

2. **User Invites**: Implement invite system:
   - Generate invite tokens
   - Email invites
   - Accept invite flow

3. **Subscription Management**: Integrate with Stripe:
   - Plan selection
   - Payment processing
   - Usage-based billing

4. **Advanced Features**:
   - Custom domains per org
   - White-label branding
   - Data export per org
   - Audit logs per org
