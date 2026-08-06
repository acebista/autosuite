import React from 'react';
import { X, Printer, CheckCircle2, Maximize2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DrawerFooterProps {
  selectedItem: any;
  onClose: () => void;
  onOpenPrintVault: () => void;
  onShowAllotment?: () => void;
  isSaving?: boolean;
}

const DELIVERY_STATES = [
  'READY_FOR_DELIVERY', 'DELIVERED', 'INSURANCE_ACTIVATION', 'BANK_ALLOTMENT',
  'DOTM_REGISTRATION', 'INSURANCE_ENDORSEMENT', 'BANK_DISBURSEMENT',
];

export const DrawerFooter: React.FC<DrawerFooterProps> = ({
  selectedItem, onClose, onOpenPrintVault, onShowAllotment, isSaving
}) => {
  const navigate = useNavigate();
  const canPrintGatePass = DELIVERY_STATES.includes(selectedItem.state);
  const isComplete = selectedItem.state === 'BANK_DISBURSEMENT';

  const handleOpenFullView = () => {
    onClose();
    navigate(`/vehicle-journey/${selectedItem.id}`);
  };

  return (
    <div className="flex-shrink-0 bg-white border-t border-surface-100 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>

      {/* ── MOBILE: two rows ──────────────────────────────────────────── */}
      <div className="lg:hidden px-4 py-3 flex flex-col gap-2">

        {/* Row 1: action buttons */}
        <div className="flex gap-2">
          <button
            onClick={onOpenPrintVault}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-deepal-500 active:bg-deepal-700 text-white text-sm font-bold transition-all active:scale-95"
          >
            <Printer size={16} />
            Print Documents
          </button>

          {canPrintGatePass && onShowAllotment && (
            <button
              onClick={onShowAllotment}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-accent-teal active:bg-teal-600 text-white text-sm font-bold transition-all active:scale-95"
            >
              <Printer size={16} />
              Gate Pass
            </button>
          )}
        </div>

        {/* Row 2: close + save status */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-100 active:bg-surface-200 border border-surface-200 text-sm font-semibold text-surface-600 transition-all active:scale-95"
          >
            <X size={14} />
            Close
          </button>

          <div className="flex items-center gap-1.5 text-xs">
            {isSaving ? (
              <span className="flex items-center gap-1.5 text-amber-600 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Saving…
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                <CheckCircle2 size={13} className="text-emerald-500" />
                Auto-saved
              </span>
            )}
          </div>

          {isComplete && (
            <div className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700">
              <CheckCircle2 size={11} className="text-emerald-500" />
              Closed
            </div>
          )}
        </div>
      </div>

      {/* ── DESKTOP: single row (unchanged) ──────────────────────────── */}
      <div className="hidden lg:flex items-center justify-between gap-3 px-5 py-3">
        {/* Left: Close */}
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-50 hover:bg-surface-100 border border-surface-200 text-sm font-semibold text-surface-600 hover:text-surface-800 transition-all duration-200 active:scale-95"
        >
          <X size={14} />
          Close
        </button>

        {/* Center: auto-save */}
        <div className="flex items-center gap-2 text-xs">
          {isSaving ? (
            <span className="flex items-center gap-1.5 text-amber-600 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Saving…
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
              <CheckCircle2 size={12} className="text-emerald-500" />
              All changes auto-saved
            </span>
          )}
        </div>

        {/* Right: buttons */}
        <div className="flex items-center gap-2">
          {isComplete && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700">
              <CheckCircle2 size={12} className="text-emerald-500" />
              Deal Closed
            </div>
          )}
          <button
            onClick={handleOpenFullView}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-900 hover:bg-surface-800 text-white text-sm font-bold shadow-md transition-all duration-200 active:scale-95"
          >
            <Maximize2 size={14} />
            Full View
          </button>
          <button
            onClick={onOpenPrintVault}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-deepal-500 hover:bg-deepal-600 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
          >
            <Printer size={14} />
            Print Documents
          </button>
          {canPrintGatePass && onShowAllotment && (
            <button
              onClick={onShowAllotment}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-teal hover:bg-teal-600 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
            >
              <Printer size={14} />
              Gate Pass
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

