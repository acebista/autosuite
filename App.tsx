import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, ProtectedRoute } from './AuthContext';
import { OrganizationProvider } from './contexts/OrganizationContext';
import { ToastProvider, Skeleton } from './UI';
import AppShell from './layouts/AppShell';
import ErrorBoundary from './components/ErrorBoundary';

// Critical pages — eagerly loaded (most common routes)
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Inventory from './pages/Inventory';
import Service from './pages/Service';
import Customers from './pages/Customers';
import Login from './pages/Login';

// Heavy pages — lazy loaded (code-split)
const SalesAcademy = React.lazy(() => import('./pages/SalesAcademy'));
const Catalog = React.lazy(() => import('./pages/Catalog'));
const Marketing = React.lazy(() => import('./pages/Marketing'));
const GatePass = React.lazy(() => import('./pages/GatePass'));
const Finance = React.lazy(() => import('./pages/Finance'));
const Calendar = React.lazy(() => import('./pages/Calendar'));
const Parts = React.lazy(() => import('./pages/Parts'));
const Settings = React.lazy(() => import('./pages/Settings'));
const UserManagement = React.lazy(() => import('./pages/UserManagement'));
const SignatureDemo = React.lazy(() => import('./pages/SignatureDemo'));
const ServiceTracking = React.lazy(() => import('./pages/ServiceTracking'));
const SuperAdmin = React.lazy(() => import('./pages/SuperAdmin'));

const PageLoader = () => (
  <div className="space-y-6 p-8 animate-fade-in">
    <Skeleton className="h-12 w-1/4" />
    <Skeleton className="h-64 w-full" />
    <Skeleton className="h-40 w-full" />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1 }
  }
});

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <OrganizationProvider>
            <ToastProvider>
              <BrowserRouter>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/login" element={<Login />} />

                    {/* Public Service Tracking Route (no auth required) */}
                    <Route path="/track/:jobId" element={<ServiceTracking />} />

                    <Route path="/" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
                      <Route index element={<Dashboard />} />
                      <Route path="sales" element={<Leads />} />
                      <Route path="inventory" element={<Inventory />} />
                      <Route path="service" element={<Service />} />
                      <Route path="customers" element={<Customers />} />
                      <Route path="parts" element={<Parts />} />
                      <Route path="finance" element={<Finance />} />
                      <Route path="calendar" element={<Calendar />} />
                      <Route path="marketing" element={<Marketing />} />
                      <Route path="catalog" element={<Catalog />} />
                      <Route path="gate-pass" element={<GatePass />} />
                      <Route path="academy" element={<SalesAcademy />} />
                      <Route path="signature-demo" element={<SignatureDemo />} />
                      <Route path="users" element={<UserManagement />} />
                      <Route path="super-admin" element={<ProtectedRoute roles={['SuperAdmin']}><SuperAdmin /></ProtectedRoute>} />
                      <Route path="settings" element={<Settings />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </ToastProvider>
          </OrganizationProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;