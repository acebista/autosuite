import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Car, Wrench, Megaphone,
  Settings, LogOut, Menu, ChevronDown, X, Sparkles, GraduationCap, Shield, ClipboardCheck,
  Compass, Package, DollarSign, Calendar, QrCode, MapPin, MoreHorizontal, ChevronUp,
  Bell
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useAuthStore } from '../lib/store';
import { NotificationDropdown } from '../UI';
import GlobalSearch from '../components/GlobalSearch';

// ─── Nav items (unchanged) ────────────────────────────────────────────────────
const NAV_ITEMS = [
  { path: '/', label: 'Battle Plan', icon: LayoutDashboard, roles: ['Admin', 'SalesManager', 'SalesRep', 'ServiceAdvisor'] },
  { path: '/vehicle-journey', label: 'Vehicle Journey', icon: Compass, roles: ['Admin', 'SalesManager', 'SalesRep', 'ServiceAdvisor', 'Finance', 'Marketing'] },
  { path: '/sales', label: 'Pipeline', icon: Users, roles: ['Admin', 'SalesManager', 'SalesRep'] },
  { path: '/inventory', label: 'Inventory', icon: Car, roles: ['Admin', 'SalesManager', 'SalesRep'] },
  { path: '/customer-registry', label: 'Customers', icon: ClipboardCheck, roles: ['Admin', 'SalesManager', 'SalesRep'] },
  { path: '/catalog', label: 'Catalog', icon: Package, roles: ['Admin', 'SalesManager', 'SalesRep'] },
  { path: '/academy', label: 'Academy', icon: GraduationCap, roles: ['Admin', 'SalesManager', 'SalesRep'] },
  { path: '/gate-pass', label: 'Gate Pass', icon: QrCode, roles: ['Admin', 'SalesManager', 'SalesRep', 'ServiceAdvisor'] },
  { path: '/parts', label: 'Parts', icon: Package, roles: ['Admin', 'ServiceAdvisor', 'Technician'] },
  { path: '/service', label: 'Workshop', icon: Wrench, roles: ['Admin', 'ServiceAdvisor', 'Technician'] },
  { path: '/calendar', label: 'Schedule', icon: Calendar, roles: ['Admin', 'SalesManager', 'ServiceAdvisor', 'SalesRep'] },
  { path: '/customers', label: 'CRM', icon: Users, roles: ['Admin', 'SalesManager', 'SalesRep', 'ServiceAdvisor', 'Marketing'] },
  { path: '/finance', label: 'Finance', icon: DollarSign, roles: ['Admin', 'SalesManager', 'ServiceAdvisor'] },
  { path: '/marketing', label: 'Marketing', icon: Megaphone, roles: ['Admin', 'Marketing'] },
  { path: '/users', label: 'Users', icon: Shield, roles: ['Admin'] },
  { path: '/super-admin', label: 'Super Admin', icon: Shield, roles: ['SuperAdmin'] },
  { path: '/settings', label: 'Settings', icon: Settings, roles: ['SuperAdmin', 'Admin'] },
];

// Bottom nav tab priority order (most used routes first)
const BOTTOM_TAB_PRIORITY = ['/', '/vehicle-journey', '/sales', '/inventory', '/customers'];

// ─── Bottom Tab Bar ───────────────────────────────────────────────────────────
interface BottomTabBarProps {
  filteredNav: typeof NAV_ITEMS;
  onMoreClick: () => void;
}

const BottomTabBar: React.FC<BottomTabBarProps> = ({ filteredNav, onMoreClick }) => {
  // Pick top 4 tabs from the priority list that exist in filteredNav
  const pinnedPaths = BOTTOM_TAB_PRIORITY.filter(p => filteredNav.some(n => n.path === p)).slice(0, 4);
  const pinnedTabs = pinnedPaths.map(p => filteredNav.find(n => n.path === p)!).filter(Boolean);

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-950 border-t border-white/5 flex items-stretch safe-area-pb" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {pinnedTabs.map(item => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === '/'}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 transition-colors min-h-[56px] relative
            ${isActive ? 'text-accent-teal' : 'text-surface-500'}`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-accent-teal rounded-full" />
              )}
              <item.icon size={22} />
              <span className="text-[9px] font-bold uppercase tracking-wide">{item.label}</span>
            </>
          )}
        </NavLink>
      ))}

      {/* More button */}
      <button
        onClick={onMoreClick}
        className="flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 text-surface-500 active:text-white transition-colors min-h-[56px]"
      >
        <MoreHorizontal size={22} />
        <span className="text-[9px] font-bold uppercase tracking-wide">More</span>
      </button>
    </nav>
  );
};

// ─── "More" bottom sheet ──────────────────────────────────────────────────────
interface MoreDrawerProps {
  filteredNav: typeof NAV_ITEMS;
  user: any;
  onClose: () => void;
  onLogout: () => void;
}

const MoreDrawer: React.FC<MoreDrawerProps> = ({ filteredNav, user, onClose, onLogout }) => {
  const pinnedPaths = BOTTOM_TAB_PRIORITY.filter(p => filteredNav.some(n => n.path === p)).slice(0, 4);
  const extraNav = filteredNav.filter(n => !pinnedPaths.includes(n.path));

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-surface-950/70 z-50 lg:hidden animate-fade-in" onClick={onClose} />

      {/* Drawer */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden animate-slide-in-bottom"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="bg-surface-900 rounded-t-3xl border-t border-white/5 max-h-[80vh] flex flex-col overflow-hidden">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-white/20 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
            <p className="text-sm font-bold text-white">All Modules</p>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-surface-400">
              <ChevronDown size={18} />
            </button>
          </div>

          {/* Nav Grid */}
          <div className="overflow-y-auto px-4 py-4 grid grid-cols-3 gap-2">
            {extraNav.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-2 p-3 rounded-2xl transition-all
                  ${isActive
                    ? 'bg-accent-teal/20 border border-accent-teal/30'
                    : 'bg-white/5 border border-white/5 active:bg-white/10'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon size={22} className={isActive ? 'text-accent-teal' : 'text-surface-400'} />
                    <span className="text-[10px] text-center font-semibold text-surface-300 leading-tight">{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {/* User + Logout */}
          <div className="px-4 pb-4 pt-2 border-t border-white/5 mt-2">
            <div className="flex items-center gap-3 px-1 py-2">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-accent-teal to-deepal-500 flex items-center justify-center font-bold text-white text-sm">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                <p className="text-[10px] uppercase text-surface-500 font-medium tracking-wide">{user?.role}</p>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold"
              >
                <LogOut size={13} /> Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// ─── Desktop Sidebar ──────────────────────────────────────────────────────────
interface SidebarProps {
  filteredNav: typeof NAV_ITEMS;
  isSidebarOpen: boolean;
  onClose: () => void;
  user: any;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ filteredNav, isSidebarOpen, onClose, user, onLogout }) => (
  <>
    {/* Mobile overlay (for lg: this is handled by bottom tabs; sidebar only appears on lg+) */}
    {isSidebarOpen && (
      <div className="fixed inset-0 bg-surface-950/60 backdrop-blur-sm z-40 lg:hidden animate-fade-in" onClick={onClose} />
    )}

    <aside className={`fixed inset-y-0 left-0 z-50 w-72 glass-dark transform transition-transform duration-300 ease-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* Decorative blur orbs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-accent-teal/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-deepal-400/10 rounded-full blur-3xl" />
      </div>

      <div className="flex flex-col h-full relative z-10">
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-gradient-to-br from-accent-teal to-deepal-500 rounded-xl flex items-center justify-center shadow-glow-teal">
              <span className="font-display font-bold text-lg text-white">A</span>
            </div>
            <div>
              <span className="font-display text-lg font-bold tracking-tight text-white block leading-none">AutoSuite</span>
              <span className="text-[9px] uppercase tracking-[0.25em] text-surface-500 font-semibold mt-0.5 block">Dealer OS</span>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-2 text-surface-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {filteredNav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive
                  ? 'bg-gradient-to-r from-accent-teal to-deepal-500 text-white shadow-glow-teal'
                  : 'text-surface-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${isActive ? 'bg-white/20' : 'bg-white/5 group-hover:bg-white/10'}`}>
                    <item.icon size={16} className={isActive ? 'text-white' : 'text-surface-500 group-hover:text-accent-teal transition-colors'} />
                  </div>
                  <span className="truncate">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-white/5">
          <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-accent-teal to-deepal-500 flex items-center justify-center font-bold text-white text-sm shadow-glow-teal">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-sm font-semibold truncate text-white">{user?.name}</p>
                <p className="text-[10px] uppercase font-medium text-surface-500 truncate mt-0.5 tracking-wide">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-red-500/20 hover:text-red-400 rounded-xl text-xs font-semibold text-surface-400 transition-all border border-transparent hover:border-red-500/30"
            >
              <LogOut size={13} /> Sign Out
            </button>
          </div>
        </div>
      </div>
    </aside>
  </>
);

// ─── Main AppShell ────────────────────────────────────────────────────────────
const AppShell: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const { logout } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isMoreOpen, setMoreOpen] = useState(false);
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
    if (item.path === '/' && user.role === 'SuperAdmin') return false;
    return item.roles.includes(user.role);
  });

  return (
    <div className="flex h-[100dvh] bg-gradient-surface overflow-hidden font-body">
      {/* Desktop Sidebar */}
      <Sidebar
        filteredNav={filteredNav}
        isSidebarOpen={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-14 lg:h-16 glass border-b border-surface-200/50 flex items-center justify-between px-4 lg:px-6 z-10 flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Desktop hamburger (for narrow desktops) — hidden on mobile since we have bottom tabs */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="hidden lg:flex p-2 text-surface-600 hover:bg-surface-100 rounded-xl transition-colors"
            >
              <Menu size={20} />
            </button>

            {/* Mobile: Logo mark */}
            <div className="lg:hidden flex items-center gap-2">
              <div className="h-8 w-8 bg-gradient-to-br from-accent-teal to-deepal-500 rounded-xl flex items-center justify-center shadow-glow-teal">
                <span className="font-display font-bold text-sm text-white">A</span>
              </div>
              <span className="font-display text-base font-bold text-surface-900">AutoSuite</span>
            </div>

            {/* Desktop: Location selector */}
            <div className="hidden lg:flex items-center gap-2 bg-surface-50 px-3 py-2 rounded-xl text-xs font-medium text-surface-600 border border-surface-200 cursor-pointer hover:bg-surface-100 transition-all group">
              <MapPin size={13} className="text-deepal-500" />
              <span>{user?.branchId ? `Branch ${user.branchId}` : 'Main Showroom'}</span>
              <ChevronDown size={12} className="text-surface-400" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Desktop search */}
            <div className="hidden md:flex">
              <GlobalSearch />
            </div>

            {/* AI pulse — desktop only */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-accent-teal/10 to-deepal-100 border border-accent-teal/20 rounded-xl">
              <div className="relative">
                <Sparkles size={13} className="text-accent-teal" />
                <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
              </div>
              <span className="text-[10px] font-semibold text-deepal-600 uppercase tracking-wide">AI Online</span>
            </div>

            {/* Notifications */}
            <NotificationDropdown />
          </div>
        </header>

        {/* Scroll area — extra bottom padding on mobile for tab bar */}
        <main className="flex-1 overflow-auto p-3 pb-24 lg:pb-10 lg:p-8">
          <div className="max-w-[1400px] mx-auto animate-fade-in-up">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <BottomTabBar filteredNav={filteredNav} onMoreClick={() => setMoreOpen(true)} />

      {/* Mobile "More" drawer */}
      {isMoreOpen && (
        <MoreDrawer
          filteredNav={filteredNav}
          user={user}
          onClose={() => setMoreOpen(false)}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
};

export default AppShell;