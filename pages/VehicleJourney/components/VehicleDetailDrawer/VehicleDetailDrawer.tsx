import React, { useState } from 'react';
import { X, Printer, FileText } from 'lucide-react';
import { HealthHUDBar } from './DrawerHeaderHUD';
import { LeftActionPanel } from './LeftActionPanel';
import { RightJourneyMap } from './RightJourneyMap';
import { DrawerFooter } from './DrawerFooter';
import { useBottleneck } from '../../hooks/useBottleneck';
import { DocumentsVault } from '../../../../components/DocumentsVault';

interface VehicleDetailDrawerProps {
  selectedItem: any;
  onClose: () => void;
  forms: any;
  deals: any[];
  vehicles: any[];
  pis: any[];
  onShowAllotment?: () => void;
}

export const VehicleDetailDrawer: React.FC<VehicleDetailDrawerProps> = ({
  selectedItem, onClose, forms, deals, vehicles, pis, onShowAllotment
}) => {
  const bottleneck = useBottleneck(selectedItem);
  const [showPrintVaultModal, setShowPrintVaultModal] = useState(false);
  const linkedPI = pis.find((p: any) => p.id === selectedItem.rawVehicle?.piId);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-surface-950/80 z-40 animate-fade-in"
      />

      {/* Drawer panel
          Mobile: bottom sheet (slides up, 92dvh, rounded-t-3xl)
          Desktop: right panel (max-w-5xl, full height, right-0)
      */}
      <div className={[
        'fixed z-50 flex flex-col bg-surface-50 overflow-hidden',
        // Mobile: bottom sheet
        'inset-x-0 bottom-0 h-[92dvh] rounded-t-3xl animate-slide-in-bottom',
        // Desktop: right side panel
        'lg:inset-y-0 lg:right-0 lg:left-auto lg:bottom-auto lg:h-full lg:rounded-none lg:w-full lg:max-w-5xl lg:animate-slide-in-right',
        'shadow-[0_-8px_60px_rgba(0,0,0,0.25)] lg:shadow-[-24px_0_80px_rgba(0,0,0,0.2)]',
      ].join(' ')}>

        {/* Mobile drag handle — only visible on mobile */}
        <div className="lg:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-surface-300 rounded-full" />
        </div>

        {/* ── Sticky HUD Bar ─────────────────────────────────────────── */}
        <HealthHUDBar
          selectedItem={selectedItem}
          bottleneck={bottleneck}
          onClose={onClose}
        />

        {/* ── Main Content: full scroll on mobile, 65/35 side-by-side on desktop ── */}
        <div className="flex flex-col lg:flex-row flex-1 min-h-0">

          {/* Action Panel — scrolls on mobile, 65% + scrollable on desktop */}
          <div className="flex-1 lg:flex-[65] overflow-y-auto px-4 py-4 lg:px-5 lg:py-5 lg:border-r border-surface-200 bg-surface-50">
            <LeftActionPanel
              selectedItem={selectedItem}
              bottleneck={bottleneck}
              forms={forms}
              deals={deals}
              vehicles={vehicles}
              pis={pis}
            />
          </div>

          {/* Journey Map — hidden on mobile, scrollable on desktop */}
          <div className="hidden lg:block lg:flex-[35] lg:min-w-[280px] overflow-y-auto px-4 py-5 bg-white">
            <RightJourneyMap
              selectedItem={selectedItem}
              pis={pis}
              bottleneck={bottleneck}
            />
          </div>
        </div>

        {/* ── Sticky Footer ─────────────────────────────────────────── */}
        <DrawerFooter
          selectedItem={selectedItem}
          onClose={onClose}
          onOpenPrintVault={() => setShowPrintVaultModal(true)}
          onShowAllotment={onShowAllotment}
          isSaving={forms.isActionLoading}
        />
      </div>

      {/* ── Print Document Vault Modal ───────────────────────────────── */}
      {showPrintVaultModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-surface-950/80 animate-fade-in p-4"
          onClick={() => setShowPrintVaultModal(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-elevated w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-scale-in border border-surface-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100 bg-surface-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-deepal-50 flex items-center justify-center border border-deepal-100">
                  <Printer size={20} className="text-deepal-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-surface-900 font-display">Print Document Vault</h3>
                  <p className="text-xs text-surface-500">Official letterhead templates for {selectedItem.model}</p>
                </div>
              </div>
              <button
                onClick={() => setShowPrintVaultModal(false)}
                className="w-8 h-8 rounded-full hover:bg-surface-200 flex items-center justify-center transition-colors text-surface-500"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto">
              <DocumentsVault
                selectedItem={selectedItem}
                pi={linkedPI}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
