import React, { useState } from 'react';
import { Plus, FileText, Landmark, Car, BookMarked, X, Layers } from 'lucide-react';
import { LogPIModal } from './LogPIModal';
import { OpenLCModal } from './OpenLCModal';
import { LinkVehicleModal } from './LinkVehicleModal';
import { CreateBookingModal } from './CreateBookingModal';

interface OperationsDockProps {
  pis: any[];
  customers: any[];
  leads: any[];
  activeCatalog: any[];
  modals: any; // full useOperationsModals return
}

const DOCK_ACTIONS = [
  { key: 'pi', label: 'Log PI', icon: FileText, color: 'text-deepal-600 bg-deepal-50 border-deepal-200 hover:bg-deepal-100' },
  { key: 'lc', label: 'Open LC', icon: Landmark, color: 'text-indigo-600 bg-indigo-50 border-indigo-200 hover:bg-indigo-100' },
  { key: 'vehicle', label: 'Link Vehicle', icon: Car, color: 'text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100' },
  { key: 'booking', label: 'New Booking', icon: BookMarked, color: 'text-purple-600 bg-purple-50 border-purple-200 hover:bg-purple-100' },
];

export const OperationsDock: React.FC<OperationsDockProps> = ({
  pis, customers, leads, activeCatalog, modals
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleDockAction = (key: string) => {
    setIsExpanded(false);
    if (key === 'pi') modals.setShowPIModal(true);
    if (key === 'lc') modals.setShowLCModal(true);
    if (key === 'vehicle') modals.setShowVehicleModal(true);
    if (key === 'booking') modals.setShowBookingModal(true);
  };

  return (
    <>
      {/* Floating dock button */}
      <div className="fixed bottom-8 right-8 z-30 flex flex-col items-end gap-3">
        {/* Expanded action buttons */}
        {isExpanded && (
          <div className="flex flex-col gap-2 animate-fade-in-up">
            {DOCK_ACTIONS.map(({ key, label, icon: Icon, color }) => (
              <button
                key={key}
                onClick={() => handleDockAction(key)}
                className={`flex items-center gap-2.5 pl-3.5 pr-5 py-2.5 rounded-2xl border shadow-card font-bold text-sm transition-all duration-200 hover:shadow-card-hover active:scale-95 bg-white ${color}`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Main FAB */}
        <button
          onClick={() => setIsExpanded(v => !v)}
          className={`w-14 h-14 rounded-2xl shadow-elevated font-bold text-white transition-all duration-300 active:scale-95 flex items-center justify-center ${
            isExpanded
              ? 'bg-surface-700 rotate-45'
              : 'bg-gradient-to-br from-deepal-500 to-deepal-700 hover:from-deepal-400 hover:to-deepal-600'
          }`}
          title="Operations Hub"
        >
          {isExpanded ? <X size={22} /> : <Plus size={22} />}
        </button>

        {!isExpanded && (
          <div className="flex items-center gap-1.5 bg-surface-900/75 text-white rounded-full px-3 py-1 text-[10px] font-bold">
            <Layers size={9} />
            Ops Hub
          </div>
        )}
      </div>

      {/* Modals */}
      <LogPIModal
        open={modals.showPIModal}
        onClose={() => modals.setShowPIModal(false)}
        piNumberVal={modals.piNumberVal} setPiNumberVal={modals.setPiNumberVal}
        piDateVal={modals.piDateVal} setPiDateVal={modals.setPiDateVal}
        piAmountVal={modals.piAmountVal} setPiAmountVal={modals.setPiAmountVal}
        piSupplierVal={modals.piSupplierVal} setPiSupplierVal={modals.setPiSupplierVal}
        piUnitsVal={modals.piUnitsVal} setPiUnitsVal={modals.setPiUnitsVal}
        onSubmit={modals.handleCreatePISubmit}
        isLoading={modals.isModalLoading}
      />

      <OpenLCModal
        open={modals.showLCModal}
        onClose={() => modals.setShowLCModal(false)}
        pis={pis}
        lcNumberVal={modals.lcNumberVal} setLcNumberVal={modals.setLcNumberVal}
        lcPIIdVal={modals.lcPIIdVal} setLcPIIdVal={modals.setLcPIIdVal}
        lcBankVal={modals.lcBankVal} setLcBankVal={modals.setLcBankVal}
        lcBranchVal={modals.lcBranchVal} setLcBranchVal={modals.setLcBranchVal}
        lcOpeningDateVal={modals.lcOpeningDateVal} setLcOpeningDateVal={modals.setLcOpeningDateVal}
        lcAmountVal={modals.lcAmountVal} setLcAmountVal={modals.setLcAmountVal}
        onSubmit={modals.handleCreateLCSubmit}
        isLoading={modals.isModalLoading}
      />

      <LinkVehicleModal
        open={modals.showVehicleModal}
        onClose={() => modals.setShowVehicleModal(false)}
        pis={pis} activeCatalog={activeCatalog}
        vModelVal={modals.vModelVal} setVModelVal={modals.setVModelVal}
        vVariantVal={modals.vVariantVal} setVVariantVal={modals.setVVariantVal}
        vColorVal={modals.vColorVal} setVColorVal={modals.setVColorVal}
        vPriceVal={modals.vPriceVal} setVPriceVal={modals.setVPriceVal}
        vCostVal={modals.vCostVal} setVCostVal={modals.setVCostVal}
        vVinVal={modals.vVinVal} setVVinVal={modals.setVVinVal}
        vEngineNoVal={modals.vEngineNoVal} setVEngineNoVal={modals.setVEngineNoVal}
        vRegistrationNoVal={modals.vRegistrationNoVal} setVRegistrationNoVal={modals.setVRegistrationNoVal}
        vPIIdVal={modals.vPIIdVal} setVPIIdVal={modals.setVPIIdVal}
        onSubmit={modals.handleCreateVehicleSubmit}
        isLoading={modals.isModalLoading}
      />

      <CreateBookingModal
        open={modals.showBookingModal}
        onClose={() => modals.setShowBookingModal(false)}
        customers={customers} leads={leads} activeCatalog={activeCatalog}
        existCustId={modals.existCustId} setExistCustId={modals.setExistCustId}
        bookModel={modals.bookModel} setBookModel={modals.setBookModel}
        bookColor={modals.bookColor} setBookColor={modals.setBookColor}
        bookAmount={modals.bookAmount} setBookAmount={modals.setBookAmount}
        bookPrice={modals.bookPrice} setBookPrice={modals.setBookPrice}
        onSubmit={modals.handleCreateBookingSubmit}
        isLoading={modals.isModalLoading}
      />
    </>
  );
};
