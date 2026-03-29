import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Car, Wrench, Megaphone,
  Settings, LogOut, Menu, ChevronDown, Search, MapPin,
  Package, DollarSign, Calendar, QrCode, X, Sparkles, GraduationCap, Shield
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useAuthStore } from '../lib/store';
import { NotificationDropdown } from '../UI';
import GlobalSearch from '../components/GlobalSearch';

const NAV_ITEMS = [
  { path: '/', label: 'Battle Plan', icon: LayoutDashboard, roles: ['Admin', 'SalesManager', 'SalesRep', 'ServiceAdvisor'] },
  { path: '/sales', label: 'Pipeline', icon: Users, roles: ['Admin', 'SalesManager', 'SalesRep'] },
  { path: '/inventory', label: 'Vehicle Inventory', icon: Car, roles: ['Admin', 'SalesManager', 'SalesRep'] },
  { path: '/catalog', label: 'Product Catalog', icon: Package, roles: ['Admin', 'SalesManager', 'SalesRep'] },
  { path: '/academy', label: 'Sales Academy', icon: GraduationCap, roles: ['Admin', 'SalesManager', 'SalesRep'] },
  { path: '/gate-pass', label: 'Gate Pass', icon: QrCode, roles: ['Admin', 'SalesManager', 'SalesRep', 'ServiceAdvisor'] },
  { path: '/parts', label: 'Parts Inventory', icon: Package, roles: ['Admin', 'ServiceAdvisor', 'Technician'] },
  { path: '/service', label: 'Workshop', icon: Wrench, roles: ['Admin', 'ServiceAdvisor', 'Technician'] },
  { path: '/calendar', label: 'Schedule', icon: Calendar, roles: ['Admin', 'SalesManager', 'ServiceAdvisor', 'SalesRep'] },
  { path: '/customers', label: 'CRM', icon: Users, roles: ['Admin', 'SalesManager', 'Marketing'] },
  { path: '/finance', label: 'Finance & Billing', icon: DollarSign, roles: ['Admin', 'SalesManager', 'ServiceAdvisor'] },
  { path: '/marketing', label: 'Marketing ROI', icon: Megaphone, roles: ['Admin', 'Marketing'] },
  { path: '/users', label: 'User Management', icon: Shield, roles: ['Admin'] },
  { path: '/super-admin', label: 'Super Admin', icon: Shield, roles: ['SuperAdmin'] },
  { path: '/settings', label: 'Settings', icon: Settings, roles: ['SuperAdmin', 'Admin'] },
];

const AppShell: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const { logout } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user?.role === 'SuperAdmin' && window.location.pathname === '/') {
      navigate('/super-admin', { replace: true });
    }
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredNav = NAV_ITEMS.filter(item => {
    if (!user) return false;
    // For root path, we handle redirect manually, but SuperAdmin shouldn't see it in sidebar
    if (item.path === '/' && user.role === 'SuperAdmin') return false;
    return item.roles.includes(user.role);
  });

  return (
    <div className="flex h-screen bg-gradient-surface overflow-hidden font-body">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-surface-950/60 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 glass-dark transform transition-transform duration-300 ease-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-64 h-64 bg-accent-teal/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-deepal-400/10 rounded-full blur-3xl"></div>
        </div>

        <div className="flex flex-col h-full relative z-10">
          {/* Logo Header */}
          <div className="h-20 flex items-center justify-between px-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 bg-gradient-to-br from-accent-teal to-deepal-500 rounded-2xl flex items-center justify-center shadow-glow-teal transform -rotate-6 hover:rotate-0 transition-transform duration-300">
                <span className="font-display font-bold text-xl text-white">A</span>
              </div>
              <div>
                <span className="font-display text-xl font-bold tracking-tight text-white block leading-none">AutoSuite</span>
                <span className="text-[9px] uppercase tracking-[0.25em] text-surface-500 font-semibold mt-0.5 block">Dealer OS</span>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 text-surface-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
            {filteredNav.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive
                    ? 'bg-gradient-to-r from-accent-teal to-deepal-500 text-white shadow-glow-teal'
                    : 'text-surface-400 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bg-white/20' : 'bg-white/5 group-hover:bg-white/10'}`}>
                      <item.icon size={18} className={isActive ? 'text-white' : 'text-surface-500 group-hover:text-accent-teal transition-colors'} />
                    </div>
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-white/5">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-accent-teal to-deepal-500 flex items-center justify-center font-display font-bold text-white text-base shadow-glow-teal">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div className="overflow-hidden flex-1">
                  <p className="text-sm font-semibold truncate text-white">{user?.name}</p>
                  <p className="text-[10px] uppercase font-medium text-surface-500 truncate mt-0.5 tracking-wide">{user?.role}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-white/5 hover:bg-red-500/20 hover:text-red-400 rounded-xl text-xs font-semibold text-surface-400 transition-all border border-transparent hover:border-red-500/30"
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-20 glass border-b border-surface-200/50 flex items-center justify-between px-6 lg:px-8 z-10">
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2.5 text-surface-600 hover:bg-surface-100 rounded-xl transition-colors focus-ring"
            >
              <Menu size={22} />
            </button>

            {/* Location Selector */}
            <div className="hidden sm:flex items-center gap-2.5 bg-surface-50 px-4 py-2.5 rounded-xl text-xs font-medium text-surface-600 border border-surface-200 cursor-pointer hover:bg-surface-100 hover:border-surface-300 transition-all group">
              <div className="p-1 bg-deepal-100 rounded-lg group-hover:bg-deepal-200 transition-colors">
                <MapPin size={14} className="text-deepal-600" />
              </div>
              <span>{user?.branchId ? `Branch ${user.branchId}` : 'Main Showroom'}</span>
              <ChevronDown size={14} className="text-surface-400" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Global Search */}
            <div className="hidden md:flex">
              <GlobalSearch />
            </div>

            {/* AI Status Indicator */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-accent-teal/10 to-deepal-100 border border-accent-teal/20 rounded-xl">
              <div className="relative">
                <Sparkles size={14} className="text-accent-teal" />
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></span>
              </div>
              <span className="text-[10px] font-semibold text-deepal-600 uppercase tracking-wide">AI Online</span>
            </div>

            {/* Notifications */}
            <NotificationDropdown />
          </div>
        </header>

        {/* Scroll Area */}
        <main className="flex-1 overflow-auto p-6 lg:p-10">
          <div className="max-w-[1400px] mx-auto animate-fade-in-up">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppShell;