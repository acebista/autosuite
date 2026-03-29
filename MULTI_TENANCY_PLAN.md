# Multi-Tenancy Implementation Plan for AutoSuite

## Overview
Transform AutoSuite into a multi-tenant SaaS platform where multiple dealerships can use the same application with complete data isolation.

## Architecture Design

### 1. **Organization-Based Tenancy** (Recommended)
Each dealership is an "organization" with:
- Unique `org_id` (UUID)
- All data tables include `org_id` foreign key
- Row Level Security (RLS) policies enforce data isolation
- Users belong to one organization

### 2. **Database Schema Changes**

#### New Table: `organizations`
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- e.g., 'kathmandu-auto-center'
  domain TEXT UNIQUE, -- Optional custom domain
  logo_url TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  subscription_tier TEXT DEFAULT 'starter', -- starter, professional, enterprise
  subscription_status TEXT DEFAULT 'active', -- active, suspended, cancelled
  max_users INTEGER DEFAULT 5,
  max_branches INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  settings JSONB DEFAULT '{}'::jsonb -- Custom settings per org
);

-- Index for fast lookups
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_domain ON organizations(domain);
```

#### Update `profiles` table (users)
```sql
ALTER TABLE profiles ADD COLUMN org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'user'; -- admin, manager, user
CREATE INDEX idx_profiles_org_id ON profiles(org_id);
```

#### Add `org_id` to ALL data tables
```sql
-- Leads
ALTER TABLE leads ADD COLUMN org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX idx_leads_org_id ON leads(org_id);

-- Vehicles
ALTER TABLE vehicles ADD COLUMN org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX idx_vehicles_org_id ON vehicles(org_id);

-- Customers
ALTER TABLE customers ADD COLUMN org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX idx_customers_org_id ON customers(org_id);

-- Service Jobs
ALTER TABLE service_jobs ADD COLUMN org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX idx_service_jobs_org_id ON service_jobs(org_id);

-- Invoices
ALTER TABLE invoices ADD COLUMN org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX idx_invoices_org_id ON invoices(org_id);

-- Parts
ALTER TABLE parts ADD COLUMN org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX idx_parts_org_id ON parts(org_id);

-- Campaigns
ALTER TABLE campaigns ADD COLUMN org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX idx_campaigns_org_id ON campaigns(org_id);

-- Appointments
ALTER TABLE appointments ADD COLUMN org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX idx_appointments_org_id ON appointments(org_id);

-- Branches (already has org concept, but ensure consistency)
ALTER TABLE branches ADD COLUMN org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX idx_branches_org_id ON branches(org_id);
```

### 3. **Row Level Security (RLS) Policies**

Enable RLS on all tables and create policies that filter by `org_id`:

```sql
-- Example for leads table
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see leads from their organization
CREATE POLICY "Users can view their org's leads"
  ON leads FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Policy: Users can insert leads for their organization
CREATE POLICY "Users can insert leads for their org"
  ON leads FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Policy: Users can update their org's leads
CREATE POLICY "Users can update their org's leads"
  ON leads FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Policy: Users can delete their org's leads
CREATE POLICY "Users can delete their org's leads"
  ON leads FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM profiles WHERE id = auth.uid()
    )
  );
```

**Repeat similar policies for ALL tables** (vehicles, customers, service_jobs, etc.)

### 4. **Frontend Changes**

#### A. Context Provider for Organization
```typescript
// contexts/OrganizationContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  subscription_tier: string;
}

interface OrgContextType {
  organization: Organization | null;
  isLoading: boolean;
}

const OrganizationContext = createContext<OrgContextType>({
  organization: null,
  isLoading: true
});

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrganization = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id, organizations(*)')
        .eq('id', user.id)
        .single();

      if (profile?.organizations) {
        setOrganization(profile.organizations);
      }
      setIsLoading(false);
    };

    fetchOrganization();
  }, []);

  return (
    <OrganizationContext.Provider value={{ organization, isLoading }}>
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => useContext(OrganizationContext);
```

#### B. Update API calls to include org_id
```typescript
// api.ts - Example for creating a lead
leads: {
  create: async (lead: Partial<Lead>): Promise<Lead> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get user's org_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', user.id)
      .single();

    if (!profile?.org_id) throw new Error('User not associated with organization');

    const { data, error } = await supabase
      .from('leads')
      .insert([{
        ...lead,
        org_id: profile.org_id // Automatically add org_id
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
```

### 5. **Authentication & Onboarding Flow**

#### Sign Up Flow:
1. User signs up with email/password
2. Create organization (if new) or join existing (via invite)
3. Create user profile with `org_id`
4. Redirect to dashboard

#### Invite Flow:
1. Admin generates invite link with `org_id`
2. New user signs up via invite link
3. User automatically assigned to that `org_id`

### 6. **Subdomain/Domain Routing** (Optional)

For better UX, use subdomains:
- `kathmandu.autosuite.app` → Kathmandu Auto Center
- `pokhara.autosuite.app` → Pokhara Motors
- Custom domains: `app.kathmanduauto.com`

```typescript
// Detect organization from subdomain
const getOrgFromSubdomain = () => {
  const hostname = window.location.hostname;
  const subdomain = hostname.split('.')[0];
  
  if (subdomain !== 'www' && subdomain !== 'autosuite') {
    return subdomain; // This is the org slug
  }
  return null;
};
```

### 7. **Subscription & Billing**

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  plan TEXT NOT NULL, -- starter, professional, enterprise
  status TEXT DEFAULT 'active', -- active, past_due, cancelled
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE usage_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  metric_type TEXT, -- users, leads, invoices, storage_mb
  value INTEGER,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 8. **Migration Strategy**

#### Phase 1: Add Organization Support (Non-Breaking)
1. Create `organizations` table
2. Add `org_id` columns to all tables (nullable initially)
3. Create default organization for existing data
4. Backfill `org_id` for existing records

#### Phase 2: Enable Multi-Tenancy
1. Make `org_id` NOT NULL
2. Enable RLS policies
3. Update frontend to use organization context
4. Test data isolation thoroughly

#### Phase 3: Launch Features
1. Organization management UI
2. User invites
3. Subscription management
4. Custom branding per org

### 9. **Security Checklist**

- ✅ RLS enabled on ALL tables
- ✅ Policies check `org_id` matches user's org
- ✅ No direct table access without RLS
- ✅ Service role key only used for admin operations
- ✅ API validates org_id on all mutations
- ✅ Test cross-org data access (should fail)

### 10. **Performance Considerations**

- Index all `org_id` columns for fast filtering
- Use connection pooling (Supabase handles this)
- Consider partitioning large tables by `org_id` if needed
- Cache organization data in frontend context

## Implementation Priority

### High Priority (MVP)
1. ✅ Create `organizations` table
2. ✅ Add `org_id` to all tables
3. ✅ Implement RLS policies
4. ✅ Update API to include `org_id`
5. ✅ Add organization context to frontend

### Medium Priority
6. Organization management UI
7. User invite system
8. Subscription tiers
9. Usage tracking

### Low Priority (Future)
10. Custom domains
11. White-label branding
12. Advanced analytics per org
13. Data export per org

## Code Examples

See the following files for implementation:
- `supabase/migrations/001_add_multi_tenancy.sql` - Database schema
- `supabase/migrations/002_rls_policies.sql` - Security policies
- `contexts/OrganizationContext.tsx` - Frontend context
- `api.ts` - Updated API calls with org_id

## Testing Multi-Tenancy

```sql
-- Create test organizations
INSERT INTO organizations (name, slug) VALUES 
  ('Kathmandu Auto Center', 'kathmandu-auto'),
  ('Pokhara Motors', 'pokhara-motors');

-- Create test users for each org
INSERT INTO profiles (id, org_id, email, name) VALUES
  ('user1-uuid', 'kathmandu-org-id', 'user1@kathmandu.com', 'User 1'),
  ('user2-uuid', 'pokhara-org-id', 'user2@pokhara.com', 'User 2');

-- Test: User 1 should NOT see User 2's leads
SELECT * FROM leads WHERE org_id = 'pokhara-org-id'; -- Should return empty for User 1
```

## Next Steps

1. Review this plan with your team
2. Run the migration SQL scripts
3. Update frontend code to use organization context
4. Test thoroughly in development
5. Deploy to production with existing data migration
