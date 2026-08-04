import React, { useState } from 'react';
import {
  Package, User, Zap, Eye, AlertTriangle, FileText,
  Landmark, Truck, CreditCard, ShieldCheck, MapPin
} from 'lucide-react';
import { STATE_METADATA } from '../../../../lib/stateMachine';

interface KanbanCardProps {
  card: any;
  onInspect: (card: any) => void;
  onQuickApproveToStock?: (card: any) => void;
  onQuickReadyForDelivery?: (card: any) => void;
  isActionLoading?: boolean;
}

const MODULE_BORDERS: Record<string, string> = {
  PROCUREMENT: 'border-l-deepal-500',
  SALES: 'border-l-purple-500',
  FNI: 'border-l-amber-500',
};
const MODULE_ACCENT: Record<string, string> = {
  PROCUREMENT: 'bg-deepal-500',
  SALES: 'bg-purple-500',
  FNI: 'bg-amber-500',
};

const INLINE_ACTIONS: Partial<Record<string, { label: string }>> = {
  RECEIVED: { label: 'Approve Stock' },
  PAYMENT_STRUCTURED: { label: 'Mark Ready' },
  BANK_ALLOTMENT: { label: 'Mark Ready' },
};

const STATE_ICONS: Record<string, React.ElementType> = {
  PO_ISSUED: FileText,
  LC_OPENED: Landmark,
  IN_TRANSIT: Truck,
  PAYMENT_STRUCTURED: CreditCard,
  INSURANCE_ACTIVATION: ShieldCheck,
  DOTM_REGISTRATION: MapPin,
};

export const KanbanCard: React.FC<KanbanCardProps> = ({
  card, onInspect, onQuickApproveToStock, onQuickReadyForDelivery, isActionLoading
}) => {
  const [confirming, setConfirming] = useState(false);
  const meta = STATE_METADATA[card.state as keyof typeof STATE_METADATA];
  const module = meta?.module || 'PROCUREMENT';
  const isSlaBreach = card.daysInStock > 90;
  const inlineAction = INLINE_ACTIONS[card.state];
  const StateIcon = STATE_ICONS[card.state];

  const handleConfirm = () => {
    setConfirming(false);
    if (card.state === 'RECEIVED') onQuickApproveToStock?.(card);
    else onQuickReadyForDelivery?.(card);
  };

  return (
    <div className={`group relative bg-white rounded-xl border-l-4 border border-surface-200 shadow-sm hover:shadow-card-hover transition-all duration-200 cursor-pointer ${MODULE_BORDERS[module]} overflow-hidden`}
      onClick={() => !confirming && onInspect(card)}
    >
      {/* Top section */}
      <div className="p-3">
        <div className="flex items-start gap-2 mb-2">
          {/* Mini vehicle image or icon */}
          {card.image ? (
            <img src={card.image} alt={card.model} className="w-10 h-8 object-cover rounded-lg border border-surface-100 flex-shrink-0" />
          ) : (
            <div className={`w-10 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${MODULE_ACCENT[module]} bg-opacity-10`}>
              {StateIcon ? <StateIcon size={14} className="text-white opacity-70" /> : <Package size={14} className="text-white opacity-70" />}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-surface-900 leading-tight truncate">
              {card.model} <span className="font-normal text-surface-500">{card.variant}</span>
            </p>
            {card.color && <p className="text-[10px] text-surface-400 leading-tight">{card.color}</p>}
          </div>
          {isSlaBreach && (
            <AlertTriangle size={12} className="text-amber-500 flex-shrink-0 mt-0.5" title={`${card.daysInStock} days — SLA breach`} />
          )}
        </div>

        {/* Reference badges */}
        <div className="flex flex-wrap gap-1 mb-2">
          {card.vin && (
            <span className="text-[9px] font-mono bg-surface-50 border border-surface-200 text-surface-500 px-1.5 py-0.5 rounded">
              {card.vin.slice(-8)}
            </span>
          )}
          {card.piNo && (
            <span className="text-[9px] bg-deepal-50 border border-deepal-100 text-deepal-600 font-semibold px-1.5 py-0.5 rounded">
              PI: {card.piNo}
            </span>
          )}
          {card.lcNo && (
            <span className="text-[9px] bg-indigo-50 border border-indigo-100 text-indigo-600 font-semibold px-1.5 py-0.5 rounded">
              LC: {card.lcNo.slice(-8)}
            </span>
          )}
          {card.registrationNo && (
            <span className="text-[9px] bg-amber-50 border border-amber-200 text-amber-700 font-bold px-1.5 py-0.5 rounded">
              {card.registrationNo}
            </span>
          )}
        </div>

        {/* Customer */}
        {card.customerName && (
          <div className="flex items-center gap-1">
            <div className="w-3.5 h-3.5 rounded-full bg-purple-100 flex items-center justify-center">
              <User size={7} className="text-purple-500" />
            </div>
            <span className="text-[10px] font-semibold text-surface-600 truncate">{card.customerName}</span>
          </div>
        )}
      </div>

      {/* Action strip */}
      <div className="border-t border-surface-100 px-3 py-1.5 flex items-center justify-between" onClick={e => e.stopPropagation()}>
        {inlineAction && !confirming ? (
          <button
            onClick={() => setConfirming(true)}
            className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
          >
            <Zap size={9} />
            {inlineAction.label}
          </button>
        ) : confirming ? (
          <div className="flex items-center gap-1.5">
            <button onClick={handleConfirm} disabled={isActionLoading} className="text-[10px] font-bold text-white bg-emerald-500 px-2 py-0.5 rounded hover:bg-emerald-600 transition-colors disabled:opacity-50">
              {isActionLoading ? '…' : 'Confirm'}
            </button>
            <button onClick={() => setConfirming(false)} className="text-[10px] font-bold text-surface-500 px-2 py-0.5 rounded hover:bg-surface-100 transition-colors">
              Cancel
            </button>
          </div>
        ) : (
          <span className="text-[10px] text-surface-400 font-semibold">{card.daysInStock || 0}d</span>
        )}
        <button
          onClick={() => onInspect(card)}
          className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-bold text-deepal-500 hover:text-deepal-700"
        >
          <Eye size={9} /> Open
        </button>
      </div>
    </div>
  );
};
