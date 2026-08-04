import React from 'react';
import { X, Printer, CheckCircle2 } from 'lucide-react';

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
  const canPrintGatePass = DELIVERY_STATES.includes(selectedItem.state);
  const isComplete = selectedItem.state === 'BANK_DISBURSEMENT';

  return (
    <div className="flex-shrink-0 flex items-center justify-between gap-3 px-5 py-3 bg-white border-t border-surface-100 shadow-[0_-4px_24px_rgba(0,0,0,0.05)]">
      {/* Left: Close */}
      <button
        onClick={onClose}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-50 hover:bg-surface-100 border border-surface-200 text-sm font-semibold text-surface-600 hover:text-surface-800 transition-all duration-200 active:scale-95"
      >
        <X size={14} />
        Close
      </button>

      {/* Center: auto-save indicator */}
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

      {/* Right: Print Vault + Gate Pass + completion badge */}
      <div className="flex items-center gap-2">
        {isComplete && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700">
            <CheckCircle2 size={12} className="text-emerald-500" />
            Deal Closed
          </div>
        )}
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
  );
};
