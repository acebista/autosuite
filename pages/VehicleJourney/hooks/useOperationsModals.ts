import React, { useState } from 'react';
import { useAuthStore } from '../../../lib/store';
import { PRODUCT_CATALOG } from '../../../constants';

interface UseOperationsModalsProps {
  pis: any[];
  deals: any[];
  customers: any[];
  leads: any[];
  activeCatalog: any[];
  refetchAll: () => void;
  refetchPis: () => void;
  mutations: {
    createPIMutation: any;
    createLCMutation: any;
    createCustomerMutation: any;
    createSaleMutation: any;
    updateLeadMutation: any;
    transitionMutation: any;
  };
  supabase: any;
  onError?: (msg: string) => void;
}

export function useOperationsModals({
  pis, deals, customers, leads, activeCatalog,
  refetchAll, refetchPis, mutations, supabase, onError
}: UseOperationsModalsProps) {
  const { createPIMutation, createLCMutation, createCustomerMutation, createSaleMutation, updateLeadMutation, transitionMutation } = mutations;
  const err = (msg: string) => (onError ? onError(msg) : alert(msg));

  // ─── Modal open states ─────────────────────────────────────────────────
  const [showPIModal, setShowPIModal] = useState(false);
  const [showLCModal, setShowLCModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showAllotmentModal, setShowAllotmentModal] = useState(false);

  // ─── PI Modal fields ───────────────────────────────────────────────────
  const [piNumberVal, setPiNumberVal] = useState('');
  const [piDateVal, setPiDateVal] = useState('');
  const [piAmountVal, setPiAmountVal] = useState('');
  const [piSupplierVal, setPiSupplierVal] = useState('MAW');
  const [piUnitsVal, setPiUnitsVal] = useState('1');

  // ─── LC Modal fields ───────────────────────────────────────────────────
  const [lcNumberVal, setLcNumberVal] = useState('');
  const [lcPIIdVal, setLcPIIdVal] = useState('');
  const [lcBankVal, setLcBankVal] = useState('');
  const [lcBranchVal, setLcBranchVal] = useState('');
  const [lcOpeningDateVal, setLcOpeningDateVal] = useState('');
  const [lcAmountVal, setLcAmountVal] = useState('');

  // ─── Vehicle Modal fields ──────────────────────────────────────────────
  const [vModelVal, setVModelVal] = useState('');
  const [vVariantVal, setVVariantVal] = useState('');
  const [vColorVal, setVColorVal] = useState('');
  const [vPriceVal, setVPriceVal] = useState('');
  const [vCostVal, setVCostVal] = useState('');
  const [vVinVal, setVVinVal] = useState('');
  const [vEngineNoVal, setVEngineNoVal] = useState('');
  const [vRegistrationNoVal, setVRegistrationNoVal] = useState('');
  const [vPIIdVal, setVPIIdVal] = useState('');

  // ─── Booking Modal fields ──────────────────────────────────────────────
  const [existCustId, setExistCustId] = useState('');
  const [bookModel, setBookModel] = useState('');
  const [bookColor, setBookColor] = useState('');
  const [bookAmount, setBookAmount] = useState('');
  const [bookPrice, setBookPrice] = useState('');

  // ─── Handlers ─────────────────────────────────────────────────────────

  const handleCreatePISubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!piNumberVal || !piDateVal || !piAmountVal) { err('Please fill out all required PI details.'); return; }
    try {
      await createPIMutation.mutateAsync({
        piNumber: piNumberVal, issueDate: piDateVal,
        totalAmount: Number(piAmountVal), supplier: piSupplierVal,
        units: Number(piUnitsVal) || 1
      });
      setShowPIModal(false);
      setPiNumberVal(''); setPiDateVal(''); setPiAmountVal(''); setPiSupplierVal('MAW'); setPiUnitsVal('1');
      refetchPis();
    } catch (e: any) { err('Error logging PI: ' + e.message); }
  };

  const handleCreateLCSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!lcNumberVal || !lcPIIdVal || !lcBankVal || !lcOpeningDateVal || !lcAmountVal) { err('Please fill out all required LC details.'); return; }
    const selectedPI = pis.find((p: any) => p.id === lcPIIdVal);
    if (selectedPI?.lc) {
      err(`PI ${selectedPI.piNumber} already has an LC linked (${selectedPI.lc.lcNumber}). Each PI can only have 1 LC.`);
      return;
    }
    try {
      await createLCMutation.mutateAsync({
        lcNumber: lcNumberVal, piId: lcPIIdVal, bankName: lcBankVal, bankBranch: lcBranchVal,
        openingDate: lcOpeningDateVal, amount: Number(lcAmountVal), currency: 'NPR', targetCycleDays: 90
      });
      setShowLCModal(false);
      setLcNumberVal(''); setLcPIIdVal(''); setLcBankVal(''); setLcBranchVal(''); setLcOpeningDateVal(''); setLcAmountVal('');
      refetchPis();
    } catch (e: any) { err('Error opening LC: ' + e.message); }
  };

  const handleCreateVehicleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!vModelVal || !vVariantVal || !vVinVal || !vPIIdVal) { err('Please fill out all required vehicle details.'); return; }
    try {
      const selectedPI = pis.find((p: any) => p.id === vPIIdVal);
      const usedSlots = selectedPI?.linkedVehicleCount ?? 0;
      const totalSlots = selectedPI?.units ?? 1;
      if (usedSlots >= totalSlots) {
        err(`Cannot add more vehicles. PI ${selectedPI?.piNumber} has a limit of ${totalSlots} unit${totalSlots !== 1 ? 's' : ''} and all slots are filled.`);
        return;
      }
      const userOrgId = useAuthStore.getState().user?.orgId;
      const { data: newV, error } = await supabase.from('vehicles').insert([{
        model: vModelVal, variant: vVariantVal, color: vColorVal,
        price: Number(vPriceVal || 0), cost: Number(vCostVal || 0),
        vin: vVinVal, status: 'Transit', vehicle_state: 'PO_ISSUED',
        pi_id: vPIIdVal, lc_id: selectedPI?.lc?.id || null,
        proforma_invoice_no: selectedPI?.piNumber || '',
        lc_no: selectedPI?.lc?.lcNumber || '',
        motor_no: vEngineNoVal || '', year: 2025,
        registration_no: vRegistrationNoVal.trim() || null,
        fuel_type: activeCatalog.find((c: any) => c.model === vModelVal && c.variant === vVariantVal)?.fuelType || 'EV',
        image_url: (() => {
          const catalogItem = activeCatalog.find((c: any) => c.model === vModelVal && c.variant === vVariantVal);
          const colorItem = catalogItem?.availableColors?.find((col: any) => col.color === vColorVal);
          return colorItem?.image || catalogItem?.image || '';
        })(),
        org_id: userOrgId || null
      }]).select().single();
      if (error) throw error;
      await transitionMutation.mutateAsync({
        entityId: newV.id, entityType: 'VEHICLE',
        fromState: 'PO_ISSUED', toState: 'PO_ISSUED',
        notes: `Vehicle added to PI ${selectedPI?.piNumber}`
      });
      setShowVehicleModal(false);
      setVModelVal(''); setVVariantVal(''); setVColorVal(''); setVPriceVal('');
      setVCostVal(''); setVVinVal(''); setVEngineNoVal(''); setVRegistrationNoVal(''); setVPIIdVal('');
      refetchAll();
    } catch (e: any) { err('Error linking vehicle: ' + e.message); }
  };

  const handleCreateBookingSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      let customerId = '';
      if (!existCustId) { err('Please select a customer or lead.'); return; }

      if (existCustId.startsWith('CUST-')) {
        customerId = existCustId.replace('CUST-', '');
      } else if (existCustId.startsWith('LEAD-')) {
        const leadId = existCustId.replace('LEAD-', '');
        const lead = leads.find((l: any) => l.id === leadId);
        if (!lead) { err('Selected lead not found.'); return; }
        const newCust = await createCustomerMutation.mutateAsync({
          name: lead.name, phone: lead.phone, email: lead.email || null,
          address: lead.address || null, companyName: lead.companyName || null,
          panNumber: lead.panNumber || null, orgId: lead.orgId || undefined,
        } as any);
        customerId = newCust.id;
        try { await updateLeadMutation.mutateAsync({ id: lead.id, patch: { status: 'Booked' } }); } catch { }
      } else {
        customerId = existCustId;
      }

      if (!customerId) { err('Failed to resolve customer ID.'); return; }

      const saleRec = await createSaleMutation.mutateAsync({
        customerId, currentState: 'BOOKED', paymentType: null,
        bookingAmount: Number(bookAmount || 0),
        salePrice: Number(bookPrice || 0),
        bookingDate: new Date().toISOString().split('T')[0]
      });

      await transitionMutation.mutateAsync({
        entityId: saleRec.id, entityType: 'SALE',
        fromState: 'BOOKED', toState: 'BOOKED',
        notes: `New booking logged for customer interest in ${bookModel} (${bookColor}). Final Price: NPR ${Number(bookPrice).toLocaleString()}`
      });

      setShowBookingModal(false);
      setExistCustId(''); setBookModel(''); setBookColor(''); setBookAmount(''); setBookPrice('');
      refetchAll();
    } catch (e: any) { err('Error creating booking: ' + e.message); }
  };

  const isModalLoading = createPIMutation.isPending || createLCMutation.isPending || createCustomerMutation.isPending || createSaleMutation.isPending;

  return {
    // Modal visibility
    showPIModal, setShowPIModal,
    showLCModal, setShowLCModal,
    showVehicleModal, setShowVehicleModal,
    showBookingModal, setShowBookingModal,
    showAllotmentModal, setShowAllotmentModal,
    // PI fields
    piNumberVal, setPiNumberVal, piDateVal, setPiDateVal,
    piAmountVal, setPiAmountVal, piSupplierVal, setPiSupplierVal,
    piUnitsVal, setPiUnitsVal,
    // LC fields
    lcNumberVal, setLcNumberVal, lcPIIdVal, setLcPIIdVal,
    lcBankVal, setLcBankVal, lcBranchVal, setLcBranchVal,
    lcOpeningDateVal, setLcOpeningDateVal, lcAmountVal, setLcAmountVal,
    // Vehicle fields
    vModelVal, setVModelVal, vVariantVal, setVVariantVal,
    vColorVal, setVColorVal, vPriceVal, setVPriceVal,
    vCostVal, setVCostVal, vVinVal, setVVinVal,
    vEngineNoVal, setVEngineNoVal, vRegistrationNoVal, setVRegistrationNoVal, vPIIdVal, setVPIIdVal,
    // Booking fields
    existCustId, setExistCustId, bookModel, setBookModel,
    bookColor, setBookColor, bookAmount, setBookAmount, bookPrice, setBookPrice,
    // Handlers
    handleCreatePISubmit, handleCreateLCSubmit,
    handleCreateVehicleSubmit, handleCreateBookingSubmit,
    isModalLoading
  };
}
