import { useMemo } from 'react';
import {
  useInventory, useSaleRecords, useProformaInvoices,
  useCustomers, useLeads,
  useTransitionState, useUpdateVehicle, useUpdateSaleRecord,
  useCreatePI, useCreateLC, useCreateCustomer, useCreateSaleRecord, useUpdateLead
} from '../../../api';
import { PRODUCT_CATALOG } from '../../../constants';
import { VehicleState } from '../../../types';

export function useVehicleJourneyData(searchQuery: string, filterState: string) {
  const { data: vehicles = [], isLoading: isInventoryLoading, refetch: refetchVehicles } = useInventory();
  const { data: deals = [], isLoading: isDealsLoading, refetch: refetchDeals } = useSaleRecords();
  const { data: pis = [], isLoading: isPIsLoading, refetch: refetchPis } = useProformaInvoices();
  const { data: customers = [], refetch: refetchCustomers } = useCustomers();
  const { data: leads = [], refetch: refetchLeads } = useLeads();

  const isLoading = isInventoryLoading || isDealsLoading || isPIsLoading;

  // Mutations
  const updateVehicleMutation = useUpdateVehicle();
  const updateSaleMutation = useUpdateSaleRecord();
  const transitionMutation = useTransitionState();
  const createPIMutation = useCreatePI();
  const createLCMutation = useCreateLC();
  const createCustomerMutation = useCreateCustomer();
  const createSaleMutation = useCreateSaleRecord();
  const updateLeadMutation = useUpdateLead();

  const refetchAll = () => {
    refetchVehicles();
    refetchDeals();
    refetchPis();
    refetchCustomers();
    refetchLeads();
  };

  // Active catalog (DB catalog templates take precedence over static constants)
  const activeCatalog = useMemo(() => {
    const dbCatalog = vehicles.filter(v => v.vin && v.vin.startsWith('CAT-'));
    return dbCatalog.length > 0 ? dbCatalog : PRODUCT_CATALOG;
  }, [vehicles]);

  // Group vehicles and deals into cohesive "journey cards" (excluding catalog templates)
  const journeyCards = useMemo(() => {
    const cards: any[] = [];
    const actualVehicles = vehicles.filter(v => !v.vin || !v.vin.startsWith('CAT-'));

    actualVehicles.forEach((vehicle) => {
      const vState = (vehicle.vehicleState || 'IN_STOCK') as VehicleState;
      const linkedDeal = deals.find(d => d.vehicleId === vehicle.id);

      if (linkedDeal) {
        const isProcurement = ['PO_ISSUED', 'LC_OPENED', 'IN_TRANSIT', 'RECEIVED'].includes(vState);
        cards.push({
          id: linkedDeal.id,
          entityType: 'SALE',
          vehicleId: vehicle.id,
          state: isProcurement ? vState : (linkedDeal.currentState as VehicleState),
          model: vehicle.model,
          variant: vehicle.variant,
          color: vehicle.color,
          vin: vehicle.vin,
          cost: vehicle.cost,
          price: vehicle.price,
          daysInStock: vehicle.daysInStock,
          image: vehicle.image,
          customerName: linkedDeal.customer?.name || 'Unknown Customer',
          customerPhone: linkedDeal.customer?.phone,
          paymentType: linkedDeal.paymentType,
          bankName: linkedDeal.bankName,
          registrationNo: linkedDeal.registrationNo,
          disbursementAmount: linkedDeal.disbursementAmount,
          piNo: vehicle.proformaInvoiceNo,
          lcNo: vehicle.lcNo,
          rawDeal: linkedDeal,
          rawVehicle: vehicle
        });
      } else {
        cards.push({
          id: vehicle.id,
          entityType: 'VEHICLE',
          vehicleId: vehicle.id,
          state: vState,
          model: vehicle.model,
          variant: vehicle.variant,
          color: vehicle.color,
          vin: vehicle.vin,
          cost: vehicle.cost,
          price: vehicle.price,
          daysInStock: vehicle.daysInStock,
          image: vehicle.image,
          piId: vehicle.piId,
          piNo: vehicle.proformaInvoiceNo,
          lcNo: vehicle.lcNo,
          rawVehicle: vehicle
        });
      }
    });

    return cards;
  }, [vehicles, deals]);

  // Filtered cards based on search + state filter
  const filteredCards = useMemo(() => {
    return journeyCards.filter((card) => {
      const matchSearch =
        card.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (card.vin && card.vin.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (card.customerName && card.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (card.piNo && card.piNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (card.lcNo && card.lcNo.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchState = filterState === 'ALL' || card.state === filterState;

      return matchSearch && matchState;
    });
  }, [journeyCards, searchQuery, filterState]);

  // KPI counters
  const kpis = useMemo(() => {
    const importing = journeyCards.filter(c => ['PO_ISSUED', 'LC_OPENED', 'IN_TRANSIT', 'RECEIVED'].includes(c.state)).length;
    const stock = journeyCards.filter(c => c.state === 'IN_STOCK').length;
    const activeCompliance = journeyCards.filter(c => ['INSURANCE_ACTIVATION', 'BANK_ALLOTMENT', 'DOTM_REGISTRATION', 'INSURANCE_ENDORSEMENT'].includes(c.state)).length;
    const pendingDisbursements = journeyCards.filter(c => c.state === 'INSURANCE_ENDORSEMENT' || c.state === 'BANK_DISBURSEMENT').length;
    return { importing, stock, activeCompliance, pendingDisbursements };
  }, [journeyCards]);

  // LC aging health score (% of LCs within 95-day SLA)
  const lcAgingHealth = useMemo(() => {
    const lcs = pis.map((p: any) => p.lc).filter(Boolean);
    if (!lcs.length) return 100;
    const withinTarget = lcs.filter((lc: any) => {
      const days = Math.floor((Date.now() - new Date(lc.openingDate).getTime()) / (1000 * 60 * 60 * 24));
      return days <= 95;
    }).length;
    return Math.round((withinTarget / lcs.length) * 100);
  }, [pis]);

  return {
    vehicles, deals, pis, customers, leads,
    isLoading,
    journeyCards, filteredCards, kpis, lcAgingHealth,
    activeCatalog,
    refetchAll, refetchPis,
    mutations: {
      updateVehicleMutation, updateSaleMutation, transitionMutation,
      createPIMutation, createLCMutation,
      createCustomerMutation, createSaleMutation, updateLeadMutation
    }
  };
}
