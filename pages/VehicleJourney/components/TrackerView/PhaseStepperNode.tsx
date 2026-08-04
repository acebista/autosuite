import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PhaseStepperNodeProps {
  icon: LucideIcon;
  label: string;
  status: 'complete' | 'active' | 'pending';
  isFirst?: boolean;
  isLast?: boolean;
  slaWarning?: boolean;
}

export const PhaseStepperNode: React.FC<PhaseStepperNodeProps> = ({
  icon: Icon, label, status, isFirst, isLast, slaWarning
}) => {
  const nodeStyles = {
    complete: 'bg-emerald-500 border-emerald-500 text-white shadow-sm',
    active: slaWarning
      ? 'bg-amber-50 border-amber-400 text-amber-600 ring-2 ring-amber-300 ring-offset-1 shadow-md animate-pulse'
      : 'bg-deepal-500 border-deepal-500 text-white ring-2 ring-deepal-300 ring-offset-1 shadow-md',
    pending: 'bg-white border-surface-200 text-surface-300',
  };
  const lineStyles = {
    complete: 'bg-emerald-400',
    active: 'bg-gradient-to-r from-emerald-400 to-surface-200',
    pending: 'bg-surface-200',
  };

  return (
    <div className="flex flex-col items-center gap-1 relative">
      {/* Left connector line */}
      {!isFirst && (
        <div className={`absolute left-0 top-[14px] -translate-x-full w-full h-0.5 ${lineStyles[status]}`} />
      )}

      <div
        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${nodeStyles[status]}`}
        title={label}
      >
        <Icon size={13} strokeWidth={2.5} />
      </div>

      <span className={`text-[9px] font-bold uppercase tracking-wide text-center leading-tight max-w-[48px] ${
        status === 'active' ? (slaWarning ? 'text-amber-600' : 'text-deepal-600')
          : status === 'complete' ? 'text-emerald-600'
          : 'text-surface-400'
      }`}>
        {label}
      </span>
    </div>
  );
};
