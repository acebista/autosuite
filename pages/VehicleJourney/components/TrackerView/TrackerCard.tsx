import React, { useState, useRef, useEffect } from 'react';
import {
  FileText, Landmark, Truck, ClipboardCheck, Package,
  BookMarked, Link2, CreditCard, BanknoteIcon, CheckCircle2,
  Sparkles, ShieldCheck, MapPin, BadgeCheck, ArrowRight, User,
  Zap, Eye, AlertTriangle, ChevronRight
} from 'lucide-react';
import { PhaseStepperNode } from './PhaseStepperNode';
import { Badge } from '../../../../UI';
import { STATE_METADATA } from '../../../../lib/stateMachine';

interface TrackerCardProps {
  card: any;
  onInspect: (card: any) => void;
  onQuickApproveToStock?: (card: any) => void;
  onQuickReadyForDelivery?: (card: any) => void;
  isActionLoading?: boolean;
}

type NodeStatus = 'complete' | 'active' | 'pending';

const STATE_ORDER = [
  'PO_ISSUED', 'LC_OPENED', 'IN_TRANSIT', 'RECEIVED', 'IN_STOCK',
  'BOOKED', 'ALLOCATED', 'PAYMENT_STRUCTURED', 'BANK_ALLOTMENT',
  'READY_FOR_DELIVERY', 'DELIVERED', 'INSURANCE_ACTIVATION',
  'DOTM_REGISTRATION', 'INSURANCE_ENDORSEMENT', 'BANK_DISBURSEMENT'
];

const TOP_ROW_STATES = ['PO_ISSUED', 'LC_OPENED', 'IN_TRANSIT', 'RECEIVED', 'IN_STOCK'];
const BOTTOM_ROW_STATES = [
  'BOOKED', 'ALLOCATED', 'PAYMENT_STRUCTURED', 'BANK_ALLOTMENT',
  'READY_FOR_DELIVERY', 'DELIVERED', 'INSURANCE_ACTIVATION',
  'DOTM_REGISTRATION', 'INSURANCE_ENDORSEMENT', 'BANK_DISBURSEMENT'
];

const STEPPER_ICONS: Record<string, React.ElementType> = {
  PO_ISSUED: FileText,
  LC_OPENED: Landmark,
  IN_TRANSIT: Truck,
  RECEIVED: ClipboardCheck,
  IN_STOCK: Package,
  BOOKED: BookMarked,
  ALLOCATED: Link2,
  PAYMENT_STRUCTURED: CreditCard,
  BANK_ALLOTMENT: BanknoteIcon,
  READY_FOR_DELIVERY: CheckCircle2,
  DELIVERED: Sparkles,
  INSURANCE_ACTIVATION: ShieldCheck,
  DOTM_REGISTRATION: MapPin,
  INSURANCE_ENDORSEMENT: BadgeCheck,
  BANK_DISBURSEMENT: BanknoteIcon,
};

const STEPPER_LABELS: Record<string, string> = {
  PO_ISSUED: 'PO', LC_OPENED: 'LC', IN_TRANSIT: 'Transit',
  RECEIVED: 'Yard', IN_STOCK: 'Stock',
  BOOKED: 'Booked', ALLOCATED: 'Alloc.', PAYMENT_STRUCTURED: 'DO/Dep',
  BANK_ALLOTMENT: 'B.Allot', READY_FOR_DELIVERY: 'PDI',
  DELIVERED: 'Delivered', INSURANCE_ACTIVATION: 'Insure',
  DOTM_REGISTRATION: 'DoTM', INSURANCE_ENDORSEMENT: 'Endorse',
  BANK_DISBURSEMENT: 'Disburse',
};

function getNodeStatus(nodeState: string, activeState: string): NodeStatus {
  const activeIdx = STATE_ORDER.indexOf(activeState);
  const nodeIdx = STATE_ORDER.indexOf(nodeState);
  if (nodeIdx < activeIdx) return 'complete';
  if (nodeIdx === activeIdx) return 'active';
  return 'pending';
}

const PHASE_BADGE_STYLES: Record<string, string> = {
  PROCUREMENT: 'bg-deepal-50 text-deepal-700 border-deepal-200',
  SALES: 'bg-purple-50 text-purple-700 border-purple-200',
  FNI: 'bg-amber-50 text-amber-700 border-amber-200',
};

const INLINE_ACTIONS: Partial<Record<string, { label: string; color: string }>> = {
  RECEIVED: { label: 'Approve to Stock', color: 'emerald' },
  PAYMENT_STRUCTURED: { label: 'Mark Ready for Delivery', color: 'deepal' },
  BANK_ALLOTMENT: { label: 'Mark Ready for Delivery', color: 'deepal' },
};

export const TrackerCard: React.FC<TrackerCardProps> = ({
  card, onInspect, onQuickApproveToStock, onQuickReadyForDelivery, isActionLoading
}) => {
  const [confirmingInline, setConfirmingInline] = useState(false);
  const meta = STATE_METADATA[card.state as keyof typeof STATE_METADATA];
  const module = meta?.module || 'PROCUREMENT';
  const progress = meta?.progress ?? 0;
  const isSlaBreach = card.daysInStock > 90;
  const inlineAction = INLINE_ACTIONS[card.state];

  const handleInlineClick = () => setConfirmingInline(true);
  const handleInlineConfirm = () => {
    setConfirmingInline(false);
    if (card.state === 'RECEIVED') onQuickApproveToStock?.(card);
    else if (card.state === 'PAYMENT_STRUCTURED' || card.state === 'BANK_ALLOTMENT') onQuickReadyForDelivery?.(card);
  };

  return (
    <div className={`relative bg-white rounded-2xl border shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden group ${
      isSlaBreach ? 'border-amber-300' : 'border-surface-200'
    }`}>
      {/* Phase color bar */}
      <div className={`absolute top-0 left-0 bottom-0 w-1 ${
        module === 'PROCUREMENT' ? 'bg-deepal-500' :
        module === 'SALES' ? 'bg-purple-500' : 'bg-amber-500'
      }`} />

      <div className="pl-4 pr-5 py-4">
        {/* Row 1: Vehicle identity */}
        <div className="flex items-start gap-3 mb-3">
          {/* Thumbnail */}
          {card.image ? (
            <img src={card.image} alt={card.model} className="w-16 h-12 object-cover rounded-xl border border-surface-100 flex-shrink-0" />
          ) : (
            <div className="w-16 h-12 rounded-xl bg-gradient-to-br from-deepal-50 to-surface-100 flex items-center justify-center flex-shrink-0 border border-surface-200">
              <Package size={20} className="text-deepal-300" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-surface-900 font-display text-base leading-tight">
                {card.model} {card.variant && <span className="font-normal text-surface-500">{card.variant}</span>}
              </p>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${PHASE_BADGE_STYLES[module]}`}>
                {meta?.label ?? card.state}
              </span>
              {isSlaBreach && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-300 text-[10px] font-bold text-amber-700">
                  <AlertTriangle size={9} /> {card.daysInStock}d SLA
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {card.color && <span className="text-xs text-surface-500 font-medium">{card.color}</span>}
              {card.vin && (
                <span className="text-[10px] font-mono text-surface-400 bg-surface-50 border border-surface-200 px-1.5 py-0.5 rounded">
                  {card.vin}
                </span>
              )}
              {card.piNo && (
                <span className="text-[10px] text-deepal-600 font-semibold bg-deepal-50 border border-deepal-100 px-1.5 py-0.5 rounded">
                  PI: {card.piNo}
                </span>
              )}
              {card.lcNo && (
                <span className="text-[10px] text-indigo-600 font-semibold bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                  LC: {card.lcNo}
                </span>
              )}
            </div>

            {card.customerName && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className="w-4 h-4 rounded-full bg-purple-100 flex items-center justify-center">
                  <User size={9} className="text-purple-500" />
                </div>
                <span className="text-xs font-semibold text-surface-600">{card.customerName}</span>
              </div>
            )}
          </div>

          {/* Retail value + progress */}
          <div className="text-right flex-shrink-0">
            <p className="text-sm font-bold text-surface-900 font-display">
              NPR {((card.price || 0) / 1e5).toFixed(1)}L
            </p>
            <p className="text-[10px] text-surface-400 mt-0.5">{progress}% complete</p>
            <div className="w-20 h-1 bg-surface-100 rounded-full mt-1 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  module === 'PROCUREMENT' ? 'bg-deepal-400' :
                  module === 'SALES' ? 'bg-purple-400' : 'bg-amber-400'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Row 2: Two-row phase stepper */}
        <div className="space-y-2 mb-3">
          {/* Procurement row */}
          <div className="flex items-start justify-between px-1">
            <p className="text-[9px] font-bold text-surface-400 uppercase tracking-wider w-14 pt-2.5 flex-shrink-0">Procure</p>
            <div className="flex-1 flex items-start justify-around relative">
              <div className="absolute top-3.5 left-0 right-0 h-0.5 bg-surface-100 -z-10" />
              {TOP_ROW_STATES.map((s, i) => {
                const Icon = STEPPER_ICONS[s] as React.ElementType;
                return (
                  <PhaseStepperNode
                    key={s}
                    icon={Icon}
                    label={STEPPER_LABELS[s]}
                    status={getNodeStatus(s, card.state)}
                    isFirst={i === 0}
                    isLast={i === TOP_ROW_STATES.length - 1}
                    slaWarning={card.state === s && isSlaBreach}
                  />
                );
              })}
            </div>
          </div>

          {/* Sales + Compliance row */}
          <div className="flex items-start justify-between px-1">
            <p className="text-[9px] font-bold text-surface-400 uppercase tracking-wider w-14 pt-2.5 flex-shrink-0">Sales/F&I</p>
            <div className="flex-1 flex items-start justify-around relative">
              <div className="absolute top-3.5 left-0 right-0 h-0.5 bg-surface-100 -z-10" />
              {BOTTOM_ROW_STATES.map((s, i) => {
                const Icon = STEPPER_ICONS[s] as React.ElementType;
                return (
                  <PhaseStepperNode
                    key={s}
                    icon={Icon}
                    label={STEPPER_LABELS[s]}
                    status={getNodeStatus(s, card.state)}
                    isFirst={i === 0}
                    isLast={i === BOTTOM_ROW_STATES.length - 1}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Row 3: Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-surface-100">
          <div className="flex items-center gap-2">
            {inlineAction && !confirmingInline && (
              <button
                onClick={handleInlineClick}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all duration-200 ${
                  inlineAction.color === 'emerald'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-deepal-50 text-deepal-700 border-deepal-200 hover:bg-deepal-100'
                }`}
              >
                <Zap size={11} />
                {inlineAction.label}
              </button>
            )}
            {confirmingInline && (
              <div className="flex items-center gap-2 animate-scale-in">
                <span className="text-xs text-surface-600 font-semibold">Confirm?</span>
                <button
                  onClick={handleInlineConfirm}
                  disabled={isActionLoading}
                  className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
                >
                  {isActionLoading ? '…' : 'Yes'}
                </button>
                <button
                  onClick={() => setConfirmingInline(false)}
                  className="px-3 py-1.5 bg-surface-100 text-surface-600 text-xs font-bold rounded-lg hover:bg-surface-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => onInspect(card)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-deepal-500 text-white text-xs font-bold rounded-lg hover:bg-deepal-600 transition-all duration-200 active:scale-95 shadow-sm"
          >
            <Eye size={12} />
            Inspect
            <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};
