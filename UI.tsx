
import React, { createContext, useContext, useState } from 'react';
import { LucideIcon, X, CheckCircle, AlertCircle, Info, Bell, ChevronRight, Sparkles } from 'lucide-react';

// --- Toast Logic ---
interface ToastMessage { id: string; type: 'success' | 'error' | 'info'; message: string; }
interface ToastContextType { addToast: (message: string, type?: 'success' | 'error' | 'info') => void; }
const ToastContext = createContext<ToastContextType | undefined>(undefined);
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const toastStyles = {
    success: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white',
    error: 'bg-gradient-to-r from-red-500 to-rose-500 text-white',
    info: 'bg-gradient-to-r from-deepal-500 to-deepal-600 text-white',
  };

  const toastIcons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] space-y-3 pointer-events-none">
        {toasts.map((t) => {
          const Icon = toastIcons[t.type];
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-2xl shadow-elevated animate-slide-in-right ${toastStyles[t.type]}`}
            >
              <div className="p-1 bg-white/20 rounded-full">
                <Icon size={16} />
              </div>
              <span className="text-sm font-semibold">{t.message}</span>
              <button
                onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
                className="ml-2 p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

// --- Atomic UI ---
export const Badge: React.FC<{ children: React.ReactNode; variant?: 'success' | 'warning' | 'error' | 'neutral' | 'blue' | 'indigo' | 'orange' | 'teal'; size?: 'sm' | 'md' }> = ({ children, variant = 'neutral', size = 'md' }) => {
  const styles = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    error: 'bg-red-50 text-red-700 border-red-200',
    neutral: 'bg-surface-100 text-surface-600 border-surface-200',
    blue: 'bg-deepal-50 text-deepal-600 border-deepal-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    teal: 'bg-teal-50 text-teal-700 border-teal-200',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${styles[variant]} ${size === 'sm' ? 'px-2 py-0.5' : ''}`}>
      {children}
    </span>
  );
};

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gradient'; size?: 'sm' | 'md' | 'lg'; icon?: LucideIcon }> = ({ children, variant = 'primary', size = 'md', icon: Icon, className = "", ...props }) => {
  const base = "inline-flex items-center justify-center font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus-ring";
  const variants = {
    primary: "bg-deepal-500 text-white hover:bg-deepal-600 shadow-md hover:shadow-lg",
    secondary: "bg-accent-teal text-white hover:bg-teal-500 shadow-md hover:shadow-lg",
    outline: "border-2 border-surface-200 bg-white text-surface-800 hover:bg-surface-50 hover:border-surface-300",
    ghost: "bg-transparent text-surface-600 hover:bg-surface-100 hover:text-surface-900",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-md hover:shadow-lg",
    gradient: "bg-gradient-to-r from-accent-teal to-deepal-500 text-white shadow-md hover:shadow-lg hover:opacity-90",
  };
  const sizes = {
    sm: "px-3.5 py-2 text-xs rounded-xl gap-1.5",
    md: "px-5 py-2.5 text-sm rounded-xl gap-2",
    lg: "px-8 py-4 text-base rounded-2xl gap-2.5"
  };
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {Icon && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />}
      {children}
    </button>
  );
};

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode; className?: string; noPadding?: boolean; elevated?: boolean }> = ({ children, className = "", noPadding, elevated, onClick, ...props }) => {
  const hasBg = className.includes('bg-');
  const elevatedClass = elevated ? 'shadow-elevated hover-lift' : 'shadow-card hover:shadow-card-hover';
  return (
    <div
      className={`${!hasBg ? 'bg-white' : ''} rounded-3xl border border-surface-200/80 overflow-hidden transition-all duration-300 ${elevatedClass} ${className}`}
      onClick={onClick}
      {...props}
    >
      <div className={noPadding ? "" : "p-6"}>{children}</div>
    </div>
  );
};

// --- Operational UI ---
export const PageHeader: React.FC<{ title: string; subtitle?: string; actions?: React.ReactNode }> = ({ title, subtitle, actions }) => (
  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
    <div>
      <h1 className="font-display text-4xl md:text-5xl font-bold text-surface-900 tracking-tight leading-none">{title}</h1>
      {subtitle && <p className="text-surface-500 mt-3 font-medium text-sm tracking-wide">{subtitle}</p>}
    </div>
    <div className="flex items-center gap-3">{actions}</div>
  </div>
);

export const SectionHeader: React.FC<{ title: string; subtitle?: string; actions?: React.ReactNode }> = ({ title, subtitle, actions }) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
    <div>
      <h2 className="font-display text-2xl font-semibold text-surface-900">{title}</h2>
      {subtitle && <p className="text-surface-500 mt-1">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);

export const AIInsightBox: React.FC<{ text: string; isLoading?: boolean }> = ({ text, isLoading }) => (
  <div className="relative overflow-hidden bg-gradient-to-r from-deepal-500/10 via-accent-teal/10 to-deepal-500/10 border border-deepal-200 p-5 rounded-2xl">
    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent-teal/20 to-transparent rounded-full -mr-10 -mt-10 blur-2xl"></div>
    <div className="relative flex items-start gap-4">
      <div className="flex-shrink-0 p-2.5 bg-gradient-to-br from-accent-teal to-deepal-500 rounded-xl text-white shadow-glow-teal">
        <Sparkles size={18} />
      </div>
      <div className="flex-1">
        <h4 className="text-xs font-bold text-deepal-600 uppercase tracking-wider mb-2">AutoSuite AI Insight</h4>
        {isLoading ? (
          <div className="space-y-2 mt-2">
            <Skeleton className="h-3 w-full bg-deepal-100" />
            <Skeleton className="h-3 w-3/4 bg-deepal-100" />
          </div>
        ) : (
          <p className="text-sm text-surface-700 leading-relaxed">{text}</p>
        )}
      </div>
    </div>
  </div>
);

export const EmptyState: React.FC<{ title: string; description?: string; icon?: LucideIcon }> = ({ title, description, icon: Icon }) => (
  <div className="flex flex-col items-center justify-center p-16 text-center bg-gradient-to-b from-surface-50 to-white border-2 border-dashed border-surface-200 rounded-4xl">
    {Icon && (
      <div className="p-4 bg-surface-100 rounded-2xl mb-5">
        <Icon size={40} className="text-surface-400" />
      </div>
    )}
    <h3 className="font-display text-lg font-semibold text-surface-900">{title}</h3>
    {description && <p className="text-sm text-surface-500 mt-2 max-w-sm mx-auto">{description}</p>}
  </div>
);

export const ActionItem: React.FC<{ title: string; subtitle: string; icon: LucideIcon; color: string; onClick?: () => void; urgent?: boolean }> = ({ title, subtitle, icon: Icon, color, onClick, urgent }) => (
  <div
    onClick={onClick}
    className={`group flex items-center justify-between p-5 bg-white border border-surface-200 rounded-2xl cursor-pointer hover:border-accent-teal/50 hover:shadow-card-hover transition-all duration-300 ${urgent ? 'pulse-urgent border-red-200 bg-red-50/30' : ''}`}
  >
    <div className="flex items-center gap-4">
      <div className={`p-3.5 rounded-2xl ${color} bg-opacity-10 ${color.replace('bg-', 'text-')}`}>
        <Icon size={22} />
      </div>
      <div>
        <h4 className="font-semibold text-surface-900 text-sm group-hover:text-deepal-600 transition-colors">{title}</h4>
        <p className="text-xs text-surface-500 mt-0.5">{subtitle}</p>
      </div>
    </div>
    <div className="p-2 rounded-xl bg-surface-50 group-hover:bg-accent-teal/10 transition-colors">
      <ChevronRight size={18} className="text-surface-400 group-hover:text-accent-teal transform group-hover:translate-x-0.5 transition-all" />
    </div>
  </div>
);

export const Skeleton: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`animate-pulse bg-surface-200 rounded-xl ${className}`}></div>
);

// --- Form Elements ---
export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, className = "", ...props }) => (
  <div className="space-y-2 flex-1">
    {label && <label className="text-xs font-semibold text-surface-500 tracking-wide ml-1">{label}</label>}
    <input
      className={`w-full px-4 py-3.5 rounded-xl border border-surface-200 bg-white text-sm placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-accent-teal/30 focus:border-accent-teal transition-all ${className}`}
      {...props}
    />
  </div>
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; options: { value: string; label: string }[] }> = ({ label, options, className = "", ...props }) => (
  <div className="space-y-2 flex-1">
    {label && <label className="text-xs font-semibold text-surface-500 tracking-wide ml-1">{label}</label>}
    <select
      className={`w-full px-4 py-3.5 rounded-xl border border-surface-200 bg-white text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-accent-teal/30 focus:border-accent-teal transition-all cursor-pointer ${className}`}
      {...props}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

export const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-3 text-surface-500 hover:bg-surface-100 rounded-xl transition-colors focus-ring"
      >
        <Bell size={20} />
        <span className="absolute top-2.5 right-2.5 h-2.5 w-2.5 bg-accent-coral rounded-full border-2 border-white ring-2 ring-accent-coral/30"></span>
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-3 w-80 glass rounded-2xl shadow-elevated z-50 overflow-hidden animate-fade-in border border-surface-200">
            <div className="p-4 border-b border-surface-100 flex justify-between items-center bg-surface-50/80">
              <span className="font-semibold text-sm text-surface-800">Notifications</span>
              <Badge variant="error" size="sm">3 New</Badge>
            </div>
            <div className="max-h-96 overflow-y-auto bg-white">
              <div className="p-4 border-b border-surface-50 hover:bg-surface-50 cursor-pointer transition-colors">
                <p className="text-sm font-semibold text-surface-900">SLA Breach: Rajesh H.</p>
                <p className="text-xs text-surface-500 mt-1">Lead Contact Overdue by 45m</p>
              </div>
              <div className="p-4 border-b border-surface-50 hover:bg-surface-50 cursor-pointer transition-colors">
                <p className="text-sm font-semibold text-surface-900">New Lead Assigned</p>
                <p className="text-xs text-surface-500 mt-1">Priya Sharma - Toyota Fortuner</p>
              </div>
              <div className="p-4 hover:bg-surface-50 cursor-pointer transition-colors">
                <p className="text-sm font-semibold text-surface-900">Service Job Complete</p>
                <p className="text-xs text-surface-500 mt-1">Job #4521 ready for delivery</p>
              </div>
            </div>
            <div className="p-3 bg-surface-50 border-t border-surface-100">
              <button className="w-full text-center text-xs font-semibold text-deepal-500 hover:text-deepal-600 transition-colors">
                View All Notifications
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// --- Modal Component ---
export const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-surface-950/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className={`relative bg-white rounded-3xl shadow-elevated w-full ${sizes[size]} animate-scale-in overflow-hidden border border-surface-200`}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-surface-100 bg-surface-50/50">
          <h2 className="font-display text-lg font-semibold text-surface-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-100 rounded-xl transition-colors focus-ring"
          >
            <X size={20} className="text-surface-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- Metric Card (New Component) ---
export const MetricCard: React.FC<{
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  icon?: LucideIcon;
  className?: string;
}> = ({ label, value, trend, trendValue, icon: Icon, className = "" }) => (
  <div className={`p-5 bg-white rounded-2xl border border-surface-200 ${className}`}>
    <div className="flex items-start justify-between mb-3">
      <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide">{label}</p>
      {Icon && <Icon size={18} className="text-surface-400" />}
    </div>
    <p className="font-display text-3xl font-bold text-surface-900">{value}</p>
    {trend && trendValue && (
      <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-500' : 'text-surface-500'
        }`}>
        <span>{trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}</span>
        <span>{trendValue}</span>
      </div>
    )}
  </div>
);

// --- Danger Badge Alias ---
export const Badge_Danger = Badge;
