# AutoSuite Multi-Tenancy Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        AutoSuite Platform                        │
│                     (Single Application Instance)                │
└─────────────────────────────────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
         ┌──────────▼──────────┐   ┌─────────▼──────────┐
         │  Organization A     │   │  Organization B    │
         │  (Kathmandu Auto)   │   │  (Pokhara Motors)  │
         └──────────┬──────────┘   └─────────┬──────────┘
                    │                         │
         ┌──────────┴──────────┐   ┌─────────┴──────────┐
         │  Users (5)          │   │  Users (3)         │
         │  Leads (127)        │   │  Leads (45)        │
         │  Vehicles (12)      │   │  Vehicles (8)      │
         │  Customers (234)    │   │  Customers (89)    │
         └─────────────────────┘   └────────────────────┘
```

## Database Schema

```
organizations
├── id (UUID, PK)
├── name
├── slug (unique)
├── subscription_tier
└── settings (JSONB)

profiles (users)
├── id (UUID, PK)
├── org_id (FK → organizations.id) ◄── Links user to org
├── email
├── name
└── org_role (owner/admin/manager/user)

leads
├── id (UUID, PK)
├── org_id (FK → organizations.id) ◄── Data isolation
├── name
├── phone
└── ... other fields

vehicles
├── id (UUID, PK)
├── org_id (FK → organizations.id) ◄── Data isolation
├── model
└── ... other fields

[All other tables follow same pattern with org_id]
```

## Data Flow

### 1. User Authentication
```
User Login
    ↓
Supabase Auth
    ↓
Get User Profile (with org_id)
    ↓
Load Organization Context
    ↓
Set org_id in React Context
```

### 2. Data Query (with RLS)
```
User requests leads
    ↓
Frontend: SELECT * FROM leads
    ↓
Supabase RLS Policy checks:
  - Is user authenticated? ✓
  - Does lead.org_id = user.org_id? ✓
    ↓
Return ONLY matching leads
```

### 3. Data Insert (with org_id)
```
User creates new lead
    ↓
Frontend: withOrgId({ name: 'John' })
    ↓
Add org_id from user's profile
    ↓
INSERT INTO leads (name, org_id)
    ↓
RLS Policy validates org_id matches user
    ↓
Success ✓
```

## Row Level Security (RLS) Flow

```
┌─────────────────────────────────────────────────────────┐
│                    Database Query                        │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│              RLS Policy Evaluation                       │
│  1. Get auth.uid() (current user ID)                    │
│  2. Lookup user's org_id from profiles                  │
│  3. Filter query: WHERE org_id = user.org_id            │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│              Return Filtered Results                     │
│  ✓ Only data from user's organization                   │
│  ✗ Data from other orgs is invisible                    │
└─────────────────────────────────────────────────────────┘
```

## Permission Hierarchy

```
Owner (org_role = 'owner')
  ├── Can manage organization settings
  ├── Can manage subscriptions
  ├── Can invite/remove users
  └── Full access to all data

Admin (org_role = 'admin')
  ├── Can invite users
  ├── Can manage branches
  └── Full access to all data

Manager (org_role = 'manager')
  ├── Can manage leads/customers
  └── Read access to reports

User (org_role = 'user')
  └── Basic CRUD on assigned data
```

## Subscription Tiers

```
┌──────────────────────────────────────────────────────┐
│  Starter Plan                                        │
│  • 5 users                                           │
│  • 1 branch                                          │
│  • Basic features                                    │
│  • ₹5,000/month                                      │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  Professional Plan                                   │
│  • 20 users                                          │
│  • 5 branches                                        │
│  • Advanced features                                 │
│  • ₹15,000/month                                     │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  Enterprise Plan                                     │
│  • Unlimited users                                   │
│  • Unlimited branches                                │
│  • All features + custom integrations                │
│  • Custom pricing                                    │
└──────────────────────────────────────────────────────┘
```

## Security Layers

```
Layer 1: Authentication
  └── Supabase Auth (JWT tokens)

Layer 2: Row Level Security
  └── SQL policies filter by org_id

Layer 3: Application Logic
  └── Frontend validates org_id

Layer 4: API Validation
  └── Backend checks org ownership
```

## Example: Cross-Org Access Prevention

```
Organization A (Kathmandu Auto)
├── User: user-a@kathmandu.com
└── org_id: aaa-111

Organization B (Pokhara Motors)
├── User: user-b@pokhara.com
└── org_id: bbb-222

Scenario: User A tries to access User B's lead
─────────────────────────────────────────────

Query: SELECT * FROM leads WHERE id = 'lead-from-org-b'

RLS Check:
  lead.org_id = 'bbb-222'
  user.org_id = 'aaa-111'
  
  bbb-222 ≠ aaa-111  ✗

Result: Empty set (access denied)
```

## Frontend Architecture

```
App.tsx
  └── OrganizationProvider
        ├── Fetches user's organization
        ├── Provides organization context
        └── Children components
              ├── Dashboard
              ├── Leads
              ├── Inventory
              └── Settings
                    └── Organization Settings
                          ├── Branding
                          ├── Users
                          └── Subscription
```

## API Pattern

```typescript
// Before Multi-Tenancy
await supabase.from('leads').insert([data]);

// After Multi-Tenancy
const dataWithOrg = await withOrgId(data);
await supabase.from('leads').insert([dataWithOrg]);

// RLS automatically filters queries
const { data } = await supabase.from('leads').select('*');
// Returns only current org's leads
```

## Migration Path

```
Phase 1: Preparation
  ├── Create organizations table
  ├── Add org_id columns (nullable)
  └── Create default organization

Phase 2: Data Migration
  ├── Assign all users to default org
  ├── Backfill org_id for all records
  └── Verify data integrity

Phase 3: Enable Multi-Tenancy
  ├── Make org_id NOT NULL
  ├── Enable RLS policies
  └── Update frontend code

Phase 4: Launch
  ├── Organization management UI
  ├── User invites
  └── Subscription management
```

## Monitoring & Analytics

```
Per-Organization Metrics:
├── Active Users
├── Data Usage (leads, vehicles, etc.)
├── Storage Consumed
├── API Calls
└── Feature Usage

Billing Metrics:
├── Subscription Status
├── Payment History
├── Usage vs. Limits
└── Upgrade Opportunities
```

## Backup & Data Export

```
Organization-Scoped Backups:
├── Export all data for org_id = 'xxx'
├── Include related records
├── Format: JSON/CSV
└── Scheduled or on-demand

Data Portability:
└── Users can export their org's data
    ├── Leads
    ├── Customers
    ├── Invoices
    └── Reports
```
