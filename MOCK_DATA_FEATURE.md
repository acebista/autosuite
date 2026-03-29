# Mock Data Toggle Feature - Implementation Summary

## Overview
Added a **Developer Settings** section in the Settings page that allows you to toggle between live Supabase data and comprehensive mock data for testing, demos, and UI development.

## What Was Implemented

### 1. Mock Data File (`mockData.ts`)
Created a comprehensive mock data file containing realistic sample data for all modules:
- **3 Sample Leads** (Hot, Warm, Cold temperatures)
- **4 Vehicles** (Various models, fuel types, aging buckets)
- **3 Service Jobs** (Different statuses and types)
- **4 Customers** (With LTV, service history, owned vehicles)
- **3 Invoices** (Service and Sales types)
- **4 Parts** (Different stock levels)
- **3 Marketing Campaigns** (Various channels and ROI)
- **3 Appointments** (Test drives, service, delivery)
- **4 Users** (Different roles)
- **Dashboard Exception Metrics**

### 2. API Layer Updates (`api.ts`)
Modified all API methods to check for mock data mode:
```typescript
const isMockDataEnabled = () => {
  return localStorage.getItem('useMockData') === 'true';
};
```

Each API method now checks this flag and returns mock data when enabled:
- `dashboard.getExceptions()`
- `leads.list()`
- `inventory.list()`
- `service.list()`
- `customers.list()`
- `finance.listInvoices()`
- `parts.list()`
- `calendar.listAppointments()`
- `users.list()`
- `marketing.listCampaigns()`

### 3. Settings Page Enhancement
Added a new **Developer** tab with:
- **Mock Data Toggle**: One-click enable/disable with visual status badge
- **Mock Data Summary**: Shows what data is included when enabled
- **Warning Notice**: Informs users that toggling will reload the page
- **Beautiful UI**: Gradient cards, status indicators, and clear messaging

## How to Use

### Enable Mock Data
1. Navigate to **Settings** (`/settings`)
2. Click on the **Developer** tab in the sidebar
3. Click **"Enable Mock Data"** button
4. The page will reload automatically
5. All modules will now display mock data

### Disable Mock Data
1. Navigate to **Settings** → **Developer**
2. Click **"Disable Mock Data"** button
3. The page will reload
4. All modules will return to live Supabase data

## Benefits

### For Development
- Test UI components without affecting production database
- Develop features offline or without Supabase credentials
- Consistent test data across development sessions

### For Demos
- Show fully populated UI to clients/stakeholders
- No need to seed database for presentations
- Realistic data that showcases all features

### For Testing
- Verify UI with various data scenarios
- Test edge cases (overdue jobs, low stock, etc.)
- Validate responsive layouts with different data volumes

## Technical Details

### Storage
Mock data preference is stored in `localStorage`:
```javascript
localStorage.setItem('useMockData', 'true' | 'false')
```

### Data Persistence
- Mock data is **read-only**
- Changes made in mock mode won't persist
- Switching back to live mode restores real database data

### Page Reload
Toggling mock data triggers a full page reload to ensure:
- All React Query caches are cleared
- All components re-fetch with the new data source
- No stale data remains in memory

## Files Modified
1. `/mockData.ts` - New file with comprehensive mock data
2. `/api.ts` - Added mock data checks to all API methods
3. `/pages/Settings.tsx` - Added Developer tab with toggle UI
4. `/IMPLEMENTATION_STATUS.md` - Documented the feature

## Future Enhancements
Potential improvements for the future:
- Add ability to customize mock data
- Export/import mock data sets
- Seed Supabase database with mock data
- Toggle individual modules independently
- Add more diverse mock data scenarios

## Testing Checklist
- [x] Mock data toggle works correctly
- [x] Page reloads after toggle
- [x] All modules display mock data when enabled
- [x] All modules return to live data when disabled
- [x] Status badge updates correctly
- [x] Warning message displays appropriately
- [x] UI is responsive and visually appealing

---

**Status**: ✅ **COMPLETE AND READY FOR USE**

Navigate to `/settings` → Developer tab to try it out!
