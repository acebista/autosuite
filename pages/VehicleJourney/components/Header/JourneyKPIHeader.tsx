import React from 'react';
import { Package, Car, ShieldCheck, Banknote } from 'lucide-react';

interface KPI {
  importing: number;
  stock: number;
  activeCompliance: number;
  pendingDisbursements: number;
}

export const JourneyKPIHeader: React.FC<{ kpis: KPI }> = ({ kpis }) => {
  const cards = [
    {
      label: 'Importing',
      value: kpis.importing,
      icon: Package,
      gradient: 'from-deepal-500 to-deepal-700',
      ring: 'ring-deepal-200',
      text: 'text-deepal-600',
      bg: 'bg-deepal-50',
    },
    {
      label: 'Available Stock',
      value: kpis.stock,
      icon: Car,
      gradient: 'from-emerald-500 to-teal-600',
      ring: 'ring-emerald-200',
      text: 'text-emerald-700',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Compliance Queue',
      value: kpis.activeCompliance,
      icon: ShieldCheck,
      gradient: 'from-amber-500 to-orange-500',
      ring: 'ring-amber-200',
      text: 'text-amber-700',
      bg: 'bg-amber-50',
    },
    {
      label: 'Pending Payouts',
      value: kpis.pendingDisbursements,
      icon: Banknote,
      gradient: 'from-indigo-500 to-deepal-600',
      ring: 'ring-indigo-200',
      text: 'text-indigo-700',
      bg: 'bg-indigo-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map(({ label, value, icon: Icon, gradient, ring, text, bg }) => (
        <div
          key={label}
          className={`relative overflow-hidden rounded-2xl bg-white border border-surface-200 shadow-card hover:shadow-card-hover transition-all duration-300 group`}
        >
          {/* Accent bar */}
          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`} />

          <div className="p-5 flex items-center gap-4">
            <div className={`${bg} ${ring} ring-2 rounded-xl p-3 transition-transform group-hover:scale-105 duration-200`}>
              <Icon className={`${text}`} size={22} />
            </div>
            <div>
              <p className="text-3xl font-bold font-display text-surface-900">{value}</p>
              <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mt-0.5">{label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
