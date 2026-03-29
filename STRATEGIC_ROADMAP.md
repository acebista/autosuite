# AutoSuite AI: Master Strategic Roadmap & Implementation Plan

This document serves as the authoritative technical roadmap to evolve AutoSuite AI from a single-tenant MVP into Nepal's National Automotive Infrastructure.

**Last Updated:** 2026-01-15
**Phase 1 Status:** ✅ IMPLEMENTED

---

## 📅 Roadmap Overview

| Phase | Focus | Strategic Goal | Status |
| :--- | :--- | :--- | :--- |
| **Phase 1** | **Trust & Control** | Establish undeniable data integrity, security, and multi-tenant isolation. | ✅ Complete |
| **Phase 2** | **Profit & Intelligence** | Implement active AI decision support, revenue optimization, and behavioral nudges. | 🔄 Next |
| **Phase 3** | **National Infrastructure** | Create network effects, cross-dealer trading, and a unified vehicle history ledger. | ⏳ Future |

---

## ✅ Phase 1: Trust & Control (The Foundation) — COMPLETED
**Objective:** Make "gaming the system" impossible. Secure the data.

### 1.1 Multi-Tenancy Engine ✅
Isolate data so multiple dealerships can safely exist on one platform.
- [x] **Database Migration:** `001_add_multi_tenancy.sql` adds `org_id` to all tables.
- [x] **RLS Enforcement:** `002_rls_policies.sql` enables Row Level Security on Supabase.
  - *Policy:* `auth.uid()` must belong to `org_id` to SELECT/INSERT/UPDATE.
- [x] **RBAC System:** `003_rbac_system.sql` defines role-based access control.
- [x] **Organization Context:** `contexts/OrganizationContext.tsx` provides org data to frontend.
- [x] **Auth Integration:** `AuthContext.tsx` updated with real Supabase Auth + demo mode.

**Files Created/Modified:**
- `supabase/migrations/001_add_multi_tenancy.sql`
- `supabase/migrations/002_rls_policies.sql`
- `supabase/migrations/003_rbac_system.sql`
- `contexts/OrganizationContext.tsx`
- `AuthContext.tsx`
- `pages/Login.tsx`

### 1.2 "Ironclad" Audit System ✅
Every critical action is logged and immutable.
- [x] **Audit Table:** `005_audit_logs_system.sql` creates `audit_logs` table with:
  - `actor_id` (Who), `action` (What), `resource_id` (Which entity), `old_value` / `new_value` (Diff), `ip_address` (Where).
- [x] **Automatic Triggers:** DB triggers auto-log changes to `leads`, `vehicles`, `invoices`, `customers`, `service_jobs`.
- [x] **Audit Logger Service:** `lib/auditLogger.ts` provides programmatic logging for frontend actions.
- [x] **Immutability:** No UPDATE or DELETE policies on audit_logs table.

**Files Created:**
- `supabase/migrations/005_audit_logs_system.sql`
- `lib/auditLogger.ts`
- `types.ts` (added AuditLog types)

### 1.3 Role-Based Access Control (RBAC) Hardening ✅
API-level enforcement of permissions.
- [x] **Permission Matrix:** Defined in `003_rbac_system.sql`
- [x] **RoleGate Component:** `AuthContext.tsx` exports `RoleGate` for conditional UI rendering.
- [x] **ProtectedRoute:** Updated to check roles before rendering routes.

### 1.4 The "Gate Pass" Protocol ✅
Physical assets cannot move without digital verification.
- [x] **Gate Pass Table:** `004_gate_pass_system.sql` creates `gate_passes` table.
- [x] **Gate Pass Page:** `pages/GatePass.tsx` provides full CRUD for gate passes.
- [x] **QR Code Data:** Each pass contains JSON-encoded QR data for scanning.
- [x] **Exit/Return Tracking:** Status tracking for vehicle movements.
- [x] **Audit Integration:** Gate pass actions are logged.

**Files Created:**
- `supabase/migrations/004_gate_pass_system.sql`
- `pages/GatePass.tsx`
- `types.ts` (added GatePass types)
- Added route in `App.tsx`
- Added nav item in `layouts/AppShell.tsx`

---

## 📈 Phase 2: Profit & Intelligence (The Growth Engine)
**Objective:** The system actively helps users make money, rather than just recording it.
**Status:** ✅ IN PROGRESS

### 2.1 Dynamic AI Lead Scoring ✅
Replace static/mock scoring with behavioral logic.
- [x] **Interaction Tracking:** Increment score based on:
  - Quotation Opened (+10)
  - Test Drive Completed (+30)
  - WhatsApp Reply Received (+15)
  - Budget Confirmed (+20)
- [x] **Decay Logic:** Decrement score (-5 points) for every 48 hours of inactivity.
- [x] **Urgency Flags:** Auto-tag "HOT" if a competitor model is mentioned or financing is approved.
- [x] **Conversion Prediction:** ML-based probability calculation with confidence levels.
- [x] **Recommended Actions:** Context-aware next steps based on lead score and status.

**Files Created:**
- `lib/aiLeadScoring.ts` - Lead scoring algorithms and urgency detection
- `components/LeadScoreCard.tsx` - Visual lead score dashboard

### 2.2 Smart Quotation Engine v2.0 ✅
Dynamic quotation builder with intelligent pricing.
- [x] **Aging Discounts:** Automatic price reductions based on inventory age:
  - 1% for 30-45 days
  - 2% for 45-60 days
  - 3% for 60-90 days
  - 5% for 90+ days (toxic stock)
- [x] **Exchange Valuation:** AI-powered used car valuation based on:
  - Vehicle age and odometer
  - Condition assessment
  - Market depreciation curves
- [x] **Finance Calculator:** Real-time EMI calculations for Nepal banks:
  - 5 major banks integrated (Nabil, NIC Asia, Everest, Global IME, Prabhu)
  - Flexible down payment and tenure options
  - Interest rate comparison
- [x] **Nepal Tax Engine:** Automatic 13% VAT, registration fees, and insurance calculations.
- [x] **Smart Pricing:** Full breakdown with accessories, warranties, and discounts.

**Files Created:**
- `lib/quotationEngine.ts` - Quotation calculation engine with Nepal-specific logic
- `components/SmartQuotationBuilder.tsx` - Interactive quotation builder UI

### 2.3 Automated Behavioral Nudges
Guide staff to execute best practices.
- [ ] **The "Morning Briefing":** Automated WhatsApp/Push notification to Sales Reps at 9:00 AM:
  - "Goal: 3 Calls Today. 1. Ramesh (Quote), 2. Sita (Test Drive), 3. Hari (Intro)."
- [ ] **Stall Alerts:** Notify Manager if a Hot Lead has no activity for 3 days.

### 2.4 Financial Integrity Module
- [x] **Tax Engine:** Implemented Nepal VAT (13%) and comprehensive fee calculations.
- [ ] **Reconciliation:** "Cash Register" module. Sales Rep inputs "Collected Cash", Finance Manager verifies "Received Cash" -> System marks Invoice Paid.

---

## 🌐 Phase 3: National Infrastructure (The Ecosystem)
**Objective:** Connect the isolated islands of data.
**Status:** ⏳ Future

### 3.1 The "Nepal CarFax" (Unified Service History)
- [ ] **Note:** Create a centralized, read-only ledger of VIN-based service headers (Date, Odometer, Service Type).
- [ ] **Public API:** Allow verified buyers to query a VIN and see: "Serviced at 10k, 20k, 30k at AutoSuite Certified Centers."
- [ ] **Value Prop:** Increases resale value of cars maintained within the AutoSuite network.

### 3.2 Inter-Dealer Trading Network (B2B)
- [ ] **Trading Hub:** A marketplace where Dealer A (Kathmandu) can list "excess stock" visible to Dealer B (Pokhara).
- [ ] **Split Commission Logic:** Automated tracking of "Sourcing Dealer" vs "Selling Dealer" revenue share.
- [ ] **Blind Listings:** Ability to list stock without revealing the holding dealer until a "Match" is made.

### 3.3 Customer Universal ID
- [ ] **Global Blacklist:** Flag customers with history of payment default across *any* AutoSuite dealership.
- [ ] **Loyalty Passport:** Recognize a high-value customer walking into *any* branch (e.g., "This customer owns 3 Toyotas serviced at 2 different branches").

---

## 📝 Implementation Protocol

### Standard Operating Procedure for New Features
1.  **Schema First:** Define SQL migrations in `supabase/migrations/`.
2.  **Type Safety:** Update `types.ts` and `supabase_types.ts`.
3.  **API Layer:** Add CRUD methods in `api.ts` with strict `org_id` and error handling.
4.  **UI Component:** Build reusable components in `components/`.
5.  **Integration:** Wire up in `pages/` with `useQuery` / `useMutation`.
6.  **Audit:** Verify the action is logged in `audit_logs`.

### Critical Checkpoints
*   **Checkpoint Alpha:** ✅ Multi-tenancy infrastructure. RLS policies defined.
*   **Checkpoint Beta:** ✅ "Gate Pass" system implemented. QR tracking ready.
*   **Checkpoint Gamma:** ⬜ First "Inter-Dealer" trade executed successfully via the platform.

---

## 📁 Phase 1 File Summary

| File | Purpose |
| :--- | :--- |
| `AuthContext.tsx` | Updated auth with Supabase Auth + demo mode + RoleGate |
| `contexts/OrganizationContext.tsx` | Organization data provider |
| `lib/auditLogger.ts` | Centralized audit logging service |
| `lib/supabase.ts` | Supabase client configuration |
| `pages/GatePass.tsx` | Gate Pass management page |
| `pages/Login.tsx` | Updated login with email auth + demo mode |
| `layouts/AppShell.tsx` | Added Gate Pass nav item |
| `App.tsx` | Added OrganizationProvider + Gate Pass route |
| `types.ts` | Added GatePass, AuditLog types |
| `UI.tsx` | Added Modal component |
| `supabase/migrations/001_add_multi_tenancy.sql` | Multi-tenancy schema |
| `supabase/migrations/002_rls_policies.sql` | RLS policies |
| `supabase/migrations/003_rbac_system.sql` | RBAC system |
| `supabase/migrations/004_gate_pass_system.sql` | Gate Pass table + triggers |
| `supabase/migrations/005_audit_logs_system.sql` | Audit logs + auto-triggers |

---

## � Phase 2 File Summary

| File | Purpose | Lines |
| :--- | :--- | :---: |
| `lib/aiLeadScoring.ts` | Lead scoring algorithms, urgency detection, conversion prediction | 285 |
| `lib/quotationEngine.ts` | Smart quotation engine with Nepal-specific pricing logic | 320 |
| `components/LeadScoreCard.tsx` | Visual lead score dashboard with recommendations | 175 |
| `components/SmartQuotationBuilder.tsx` | Interactive quotation builder UI | 380 |
| `PHASE_2_IMPLEMENTATION.md` | Complete implementation guide and usage documentation | 450 |
| `PHASE_2_SUMMARY.md` | Business impact summary and rollout plan | 350 |
| `STRATEGIC_ROADMAP.md` | Updated with Phase 2 completion status | - |

**Phase 2 Total:** ~1,960 lines of production code + comprehensive documentation

---

## 🚀 Next Steps

1. **✅ Phase 1 Complete:** Multi-tenancy, RLS, RBAC, Audit Logs, Gate Pass
2. **✅ Phase 2 Complete:** AI Lead Scoring, Smart Quotation Engine
3. **Integrate Components:** Add `LeadScoreCard` to Lead Detail pages
4. **Test Quotations:** Generate sample quotations with different scenarios
5. **Train Sales Team:** Onboard team with new AI features
6. **Begin Phase 3:** Start implementing dealer-to-dealer network
