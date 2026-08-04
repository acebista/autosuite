import React, { useState, useMemo } from 'react';
import { ToastProvider, useToast } from '../../UI';
import { supabase } from '../../api';
import { useVehicleJourneyData } from './hooks/useVehicleJourneyData';
import { useActionForms } from './hooks/useActionForms';
import { useOperationsModals } from './hooks/useOperationsModals';
import { JourneyKPIHeader } from './components/Header/JourneyKPIHeader';
import { JourneyControls, ViewMode, RolePreset } from './components/Header/JourneyControls';
import { TrackerView } from './components/TrackerView/TrackerView';
import { KanbanView } from './components/KanbanView/KanbanView';
import { VehicleDetailDrawer } from './components/VehicleDetailDrawer/VehicleDetailDrawer';
import { OperationsDock } from './components/OperationsDock/OperationsDock';

const ROLE_FILTER_MAP: Record<RolePreset, string> = {
  ALL: 'ALL',
  PROCUREMENT: 'ALL',
  SALES: 'ALL',
  COMPLIANCE: 'ALL',
};

const ROLE_DEFAULT_STATES: Record<RolePreset, string[]> = {
  ALL: [],
  PROCUREMENT: ['PO_ISSUED', 'LC_OPENED', 'IN_TRANSIT', 'RECEIVED'],
  SALES: ['IN_STOCK', 'BOOKED', 'ALLOCATED', 'PAYMENT_STRUCTURED', 'BANK_ALLOTMENT', 'READY_FOR_DELIVERY', 'DELIVERED'],
  COMPLIANCE: ['INSURANCE_ACTIVATION', 'DOTM_REGISTRATION', 'INSURANCE_ENDORSEMENT', 'BANK_DISBURSEMENT'],
};

function VehicleJourneyInner() {
  const { addToast } = useToast();

  // ─── UI State ────────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>('tracker');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState('ALL');
  const [rolePreset, setRolePreset] = useState<RolePreset>('ALL');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ─── Server state ────────────────────────────────────────────────────────
  const journeyData = useVehicleJourneyData(searchQuery, filterState);

  // ─── Role-filtered cards ─────────────────────────────────────────────────
  const displayedCards = useMemo(() => {
    const roleStates = ROLE_DEFAULT_STATES[rolePreset];
    if (!roleStates.length) return journeyData.filteredCards;
    return journeyData.filteredCards.filter(c => roleStates.includes(c.state));
  }, [journeyData.filteredCards, rolePreset]);

  // ─── Action forms ────────────────────────────────────────────────────────
  const forms = useActionForms({
    selectedItem,
    refetchAll: journeyData.refetchAll,
    deals: journeyData.deals,
    vehicles: journeyData.vehicles,
    mutations: journeyData.mutations,
    setDrawerOpen,
    onError: msg => addToast(msg, 'error'),
  });

  // ─── Operations modals ───────────────────────────────────────────────────
  const modals = useOperationsModals({
    pis: journeyData.pis,
    deals: journeyData.deals,
    customers: journeyData.customers,
    leads: journeyData.leads,
    activeCatalog: journeyData.activeCatalog,
    refetchAll: journeyData.refetchAll,
    refetchPis: journeyData.refetchPis,
    mutations: journeyData.mutations,
    supabase,
    onError: msg => addToast(msg, 'error'),
  });

  // ─── Open drawer ─────────────────────────────────────────────────────────
  const handleOpenDrawer = (card: any) => {
    setSelectedItem(card);
    forms.populateFromCard(card);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => setSelectedItem(null), 350); // wait for animation
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-surface p-6 pb-32">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display text-surface-900">Vehicle Journey</h1>
        <p className="text-sm text-surface-500 mt-0.5">End-to-end lifecycle from procurement to bank disbursement</p>
      </div>

      {/* KPI summary row */}
      <JourneyKPIHeader kpis={journeyData.kpis} />

      {/* Controls bar */}
      <JourneyControls
        viewMode={viewMode}
        setViewMode={setViewMode}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterState={filterState}
        setFilterState={setFilterState}
        rolePreset={rolePreset}
        setRolePreset={setRolePreset}
        totalCount={journeyData.journeyCards.length}
        filteredCount={displayedCards.length}
      />

      {/* Loading state */}
      {journeyData.isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-10 h-10 rounded-2xl bg-deepal-50 flex items-center justify-center animate-pulse">
            <div className="w-5 h-5 bg-deepal-300 rounded-full" />
          </div>
          <p className="text-surface-400 font-semibold text-sm">Loading vehicle journey…</p>
        </div>
      ) : viewMode === 'tracker' ? (
        <TrackerView
          cards={displayedCards}
          onInspect={handleOpenDrawer}
          onQuickApproveToStock={forms.handleInlineApproveStock}
          onQuickReadyForDelivery={forms.handleInlineReadyForDelivery}
          isActionLoading={forms.isActionLoading}
        />
      ) : (
        <KanbanView
          cards={displayedCards}
          onInspect={handleOpenDrawer}
          onQuickApproveToStock={forms.handleInlineApproveStock}
          onQuickReadyForDelivery={forms.handleInlineReadyForDelivery}
          isActionLoading={forms.isActionLoading}
        />
      )}

      {/* Vehicle Detail Drawer */}
      {drawerOpen && selectedItem && (
        <VehicleDetailDrawer
          selectedItem={selectedItem}
          onClose={handleCloseDrawer}
          forms={forms}
          deals={journeyData.deals}
          vehicles={journeyData.vehicles}
          pis={journeyData.pis}
        />
      )}

      {/* Floating Operations Hub */}
      <OperationsDock
        pis={journeyData.pis}
        customers={journeyData.customers}
        leads={journeyData.leads}
        activeCatalog={journeyData.activeCatalog}
        modals={modals}
      />
    </div>
  );
}

const VehicleJourney: React.FC = () => (
  <ToastProvider>
    <VehicleJourneyInner />
  </ToastProvider>
);

export default VehicleJourney;
