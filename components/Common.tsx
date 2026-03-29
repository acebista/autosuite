import React, { createContext, useContext, useState, useEffect } from 'react';
import { LucideIcon, X, CheckCircle, AlertCircle, Bell, Info } from 'lucide-react';

// --- Types ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
}

interface CardProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'hot' | 'warm' | 'cold' | 'success' | 'warning' | 'neutral' | 'blue';
  className?: string;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastContextType {
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

// --- Contexts ---
const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// --- Components ---

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`animate-pulse bg-slate-200 rounded ${className}`}></div>
);

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  icon: Icon,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-blue-900 text-white hover:bg-blue-800 focus:ring-blue-900",
    secondary: "bg-orange-500 text-white hover:bg-orange-600 focus:ring-orange-500",
    destructive: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-600",
    outline: "border border-slate-300 bg-transparent hover:bg-slate-100 text-slate-700",
    ghost: "bg-transparent hover:bg-slate-100 text-slate-700",
  };

  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 py-2 text-sm",
    lg: "h-12 px-6 text-base",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} 
      {...props}
    >
      {Icon && <Icon className={`mr-2 h-4 w-4 ${children ? '' : 'mr-0'}`} />}
      {children}
    </button>
  );
};

export const Card: React.FC<CardProps> = ({ children, className = '', noPadding = false }) => {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden ${className}`}>
      <div className={noPadding ? '' : 'p-5'}>
        {children}
      </div>
    </div>
  );
};

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', className = '' }) => {
  const styles = {
    hot: "bg-green-100 text-green-700 border-green-200",
    warm: "bg-yellow-100 text-yellow-700 border-yellow-200",
    cold: "bg-slate-100 text-slate-600 border-slate-200",
    success: "bg-emerald-100 text-emerald-700 border-emerald-200",
    warning: "bg-amber-100 text-amber-700 border-amber-200",
    neutral: "bg-gray-100 text-gray-700 border-gray-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
};

export const SectionHeader: React.FC<{ title: string; subtitle?: string; actions?: React.ReactNode }> = ({ title, subtitle, actions }) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
    <div>
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      {subtitle && <p className="text-slate-500 mt-1">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);

export const AIInsightBox: React.FC<{ text: string; isLoading?: boolean }> = ({ text, isLoading }) => (
  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
    <div className="bg-white p-1.5 rounded-full shadow-sm text-blue-600 mt-0.5">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    </div>
    <div className="w-full">
      <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-1">AutoSuite AI Insight</h4>
      {isLoading ? (
         <div className="space-y-2 mt-2">
            <Skeleton className="h-3 w-full bg-blue-200/50" />
            <Skeleton className="h-3 w-3/4 bg-blue-200/50" />
         </div>
      ) : (
        <p className="text-sm text-blue-900 leading-relaxed">{text}</p>
      )}
    </div>
  </div>
);

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in scale-100 transition-all">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-900 text-lg">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[85vh]">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- Toast Provider ---
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[70] space-y-3 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border animate-slide-up ${
              toast.type === 'success' ? 'bg-white border-green-100 text-slate-800' :
              toast.type === 'error' ? 'bg-white border-red-100 text-slate-800' :
              'bg-white border-blue-100 text-slate-800'
            }`}
          >
            <div className={`p-1 rounded-full ${
              toast.type === 'success' ? 'bg-green-100 text-green-600' :
              toast.type === 'error' ? 'bg-red-100 text-red-600' :
              'bg-blue-100 text-blue-600'
            }`}>
              {toast.type === 'success' ? <CheckCircle size={16} /> : 
               toast.type === 'error' ? <AlertCircle size={16} /> : 
               <Info size={16} />}
            </div>
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const notifications = [
    { id: 1, text: "New lead assigned: Shyam K.C.", time: "5m ago", type: "lead" },
    { id: 2, text: "Service #JOB-902 is waiting for parts.", time: "1h ago", type: "alert" },
    { id: 3, text: "Inventory alert: Toyota Hilux stock low.", time: "2h ago", type: "warning" },
  ];

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
      >
        <Bell size={20} />
        <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-fade-in">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
              <h4 className="font-bold text-slate-800 text-sm">Notifications</h4>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.map(notif => (
                <div key={notif.id} className="px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 cursor-pointer">
                  <p className="text-sm text-slate-800 font-medium">{notif.text}</p>
                  <p className="text-xs text-slate-400 mt-1">{notif.time}</p>
                </div>
              ))}
            </div>
            <div className="p-2 text-center border-t border-slate-100">
               <button className="text-xs font-medium text-blue-600 hover:text-blue-800">Mark all read</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};