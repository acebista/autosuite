import React from 'react';
import { Clock, User, ArrowRight } from 'lucide-react';
import { useDealSteps } from '../../../../api';

const STATE_DOT_COLOR: Record<string, string> = {
  PO_ISSUED: 'bg-deepal-500',
  LC_OPENED: 'bg-indigo-500',
  IN_TRANSIT: 'bg-orange-500',
  RECEIVED: 'bg-teal-500',
  IN_STOCK: 'bg-emerald-500',
  BOOKED: 'bg-pink-500',
  ALLOCATED: 'bg-purple-500',
  PAYMENT_STRUCTURED: 'bg-cyan-500',
  BANK_ALLOTMENT: 'bg-sky-500',
  READY_FOR_DELIVERY: 'bg-green-500',
  DELIVERED: 'bg-emerald-600',
  INSURANCE_ACTIVATION: 'bg-violet-500',
  DOTM_REGISTRATION: 'bg-amber-500',
  INSURANCE_ENDORSEMENT: 'bg-indigo-600',
  BANK_DISBURSEMENT: 'bg-rose-500',
};

interface ComplianceAuditTrailProps {
  entityId: string;
}

export const ComplianceAuditTrail: React.FC<ComplianceAuditTrailProps> = ({ entityId }) => {
  const { data: steps = [], isLoading } = useDealSteps(entityId);

  if (isLoading) {
    return (
      <div className="px-6 pb-4">
        <h4 className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-3">Audit Trail</h4>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse flex gap-3">
              <div className="w-5 h-5 bg-surface-200 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="h-3 bg-surface-200 rounded w-2/3" />
                <div className="h-2 bg-surface-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!steps.length) {
    return (
      <div className="px-6 pb-4">
        <h4 className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Audit Trail</h4>
        <p className="text-xs text-surface-400 italic">No transitions recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="px-6 pb-4">
      <h4 className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-3">Audit Trail</h4>
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[9px] top-3 bottom-3 w-0.5 bg-surface-100" />

        <div className="space-y-4">
          {[...steps].reverse().map((step: any, i: number) => {
            const dot = STATE_DOT_COLOR[step.toState] || 'bg-surface-400';
            return (
              <div key={step.id || i} className="flex gap-3 relative">
                <div className={`w-5 h-5 rounded-full ${dot} flex-shrink-0 z-10 shadow-sm flex items-center justify-center`}>
                  <span className="w-2 h-2 bg-white/60 rounded-full" />
                </div>
                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-surface-700">
                      {step.fromState?.replace(/_/g, ' ')}
                    </span>
                    <ArrowRight size={10} className="text-surface-400 flex-shrink-0" />
                    <span className="text-xs font-bold text-deepal-600">
                      {step.toState?.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {step.notes && (
                    <p className="text-[11px] text-surface-500 mt-0.5 leading-relaxed line-clamp-2">{step.notes}</p>
                  )}

                  <div className="flex items-center gap-3 mt-1 text-[10px] text-surface-400">
                    {step.performedBy && (
                      <span className="flex items-center gap-1">
                        <User size={8} />
                        {step.performedBy}
                      </span>
                    )}
                    {step.createdAt && (
                      <span className="flex items-center gap-1">
                        <Clock size={8} />
                        {new Date(step.createdAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
