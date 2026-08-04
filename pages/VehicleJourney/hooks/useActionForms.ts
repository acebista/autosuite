import React, { useState } from 'react';
import { supabase } from '../../../api';
import { uploadToR2, buildR2Path } from '../../../services/r2Upload';
import { useAuthStore } from '../../../lib/store';

interface UseActionFormsProps {
  selectedItem: any;
  refetchAll: () => void;
  deals: any[];
  vehicles: any[];
  mutations: {
    updateVehicleMutation: any;
    updateSaleMutation: any;
    transitionMutation: any;
  };
  setDrawerOpen: (v: boolean) => void;
  onError?: (msg: string) => void;
}

export function useActionForms({
  selectedItem,
  refetchAll,
  deals,
  vehicles,
  mutations,
  setDrawerOpen,
  onError
}: UseActionFormsProps) {
  const { updateVehicleMutation, updateSaleMutation, transitionMutation } = mutations;

  const err = (msg: string) => (onError ? onError(msg) : alert(msg));

  // ─── Drawer form field states ──────────────────────────────────────────
  const [transitDate, setTransitDate] = useState('');
  const [grnNo, setGrnNo] = useState('');
  const [engineNo, setEngineNo] = useState('');
  const [chassisNo, setChassisNo] = useState('');
  const [allocVehicleId, setAllocVehicleId] = useState('');
  const [allocSaleId, setAllocSaleId] = useState('');
  const [paymentType, setPaymentType] = useState<'FULL_PAYMENT' | 'FINANCED'>('FULL_PAYMENT');
  const [bookingAmount, setBookingAmount] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankBranch, setBankBranch] = useState('');
  const [rmName, setRmName] = useState('');
  const [rmPhone, setRmPhone] = useState('');
  const [approvedLoan, setApprovedLoan] = useState('');
  const [deliveryOrderFile, setDeliveryOrderFile] = useState<File | null>(null);
  const [deliveryOrderUrl, setDeliveryOrderUrl] = useState('');
  const [insuranceNo, setInsuranceNo] = useState('');
  const [willUpdateInsuranceLater, setWillUpdateInsuranceLater] = useState(false);
  const [registrationNo, setRegistrationNo] = useState('');
  const [disbursementAmt, setDisbursementAmt] = useState('');
  const [actionNotes, setActionNotes] = useState('');

  // Pre-populate form fields when drawer opens for a card
  const populateFromCard = (card: any) => {
    setActionNotes('');
    if (card.entityType === 'VEHICLE') {
      setGrnNo(card.rawVehicle?.grnNumber || `GRN-${Date.now().toString().slice(-6)}`);
      setEngineNo(card.rawVehicle?.motorNo || '');
      setChassisNo(card.vin || '');
    } else {
      setPaymentType(card.rawDeal?.paymentType || 'FULL_PAYMENT');
      setBookingAmount(card.rawDeal?.bookingAmount?.toString() || '');
      setSalePrice(card.rawDeal?.salePrice?.toString() || '');
      setBankName(card.rawDeal?.bankName || '');
      setBankBranch(card.rawDeal?.bankBranch || '');
      setRmName(card.rawDeal?.rmName || '');
      setRmPhone(card.rawDeal?.rmPhone || '');
      setApprovedLoan(card.rawDeal?.approvedLoan?.toString() || '');
      setDeliveryOrderUrl(card.rawDeal?.deliveryOrderUrl || '');
      setDeliveryOrderFile(null);
      const existingIns = card.rawDeal?.insurancePolicyNo || '';
      setInsuranceNo(existingIns === 'PENDING_EMAIL_SENT' ? '' : existingIns);
      setWillUpdateInsuranceLater(existingIns === 'PENDING_EMAIL_SENT');
      setRegistrationNo(card.rawDeal?.registrationNo || '');
      setDisbursementAmt(card.rawDeal?.disbursementAmount?.toString() || '');
    }
  };

  // ─── State transition handlers ─────────────────────────────────────────

  // 1. PO_ISSUED → LC_OPENED
  const handleLinkLC = async () => {
    try {
      await transitionMutation.mutateAsync({
        entityId: selectedItem.id, entityType: 'VEHICLE',
        fromState: 'PO_ISSUED', toState: 'LC_OPENED',
        notes: actionNotes || 'LC successfully linked and activated.'
      });
      refetchAll(); setDrawerOpen(false);
    } catch (e: any) { err('Error: ' + e.message); }
  };

  // 2. LC_OPENED → IN_TRANSIT
  const handleMarkShipped = async () => {
    if (!transitDate) { err('Please set the expected delivery date.'); return; }
    try {
      await updateVehicleMutation.mutateAsync({ id: selectedItem.id, patch: { expectedDeliveryDate: transitDate } as any });
      await transitionMutation.mutateAsync({
        entityId: selectedItem.id, entityType: 'VEHICLE',
        fromState: 'LC_OPENED', toState: 'IN_TRANSIT',
        notes: actionNotes || `Vehicle shipped. Expected arrival: ${new Date(transitDate).toLocaleDateString()}`
      });
      refetchAll(); setDrawerOpen(false); setTransitDate('');
    } catch (e: any) { err('Error: ' + e.message); }
  };

  // 3. IN_TRANSIT → RECEIVED
  const handleGRNSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!grnNo || !engineNo || !chassisNo) { err('Please provide GRN, Engine, and Chassis numbers.'); return; }
    try {
      await updateVehicleMutation.mutateAsync({
        id: selectedItem.id,
        patch: { grnNumber: grnNo, motorNo: engineNo, vin: chassisNo, chassisNo, receivedAt: new Date().toISOString() } as any
      });
      await transitionMutation.mutateAsync({
        entityId: selectedItem.id, entityType: 'VEHICLE',
        fromState: 'IN_TRANSIT', toState: 'RECEIVED',
        notes: actionNotes || `GRN receipt generated: ${grnNo}. Physical inspection complete.`
      });
      refetchAll(); setDrawerOpen(false);
    } catch (e: any) { err('Error: ' + e.message); }
  };

  // 4. RECEIVED → IN_STOCK
  const handleApproveStock = async () => {
    try {
      await updateVehicleMutation.mutateAsync({ id: selectedItem.id, patch: { status: 'In Stock' } });
      await transitionMutation.mutateAsync({
        entityId: selectedItem.id, entityType: 'VEHICLE',
        fromState: 'RECEIVED', toState: 'IN_STOCK',
        notes: actionNotes || 'Vehicle marked in stock and ready for client allocations.'
      });
      refetchAll(); setDrawerOpen(false);
    } catch (e: any) { err('Error: ' + e.message); }
  };

  // 5. IN_STOCK → ALLOCATED (from stock card side)
  const handleAllocateToBooking = async () => {
    if (!allocSaleId) { err('Please select a booking to allocate.'); return; }
    try {
      const selectedDealObj = deals.find(d => d.id === allocSaleId);
      const isStock = selectedItem.state === 'IN_STOCK';
      await updateSaleMutation.mutateAsync({
        id: allocSaleId,
        patch: { vehicleId: selectedItem.vehicleId || selectedItem.id, allocationDate: new Date().toISOString(), currentState: isStock ? 'ALLOCATED' : 'BOOKED' }
      });
      if (isStock) {
        await transitionMutation.mutateAsync({
          entityId: selectedItem.vehicleId || selectedItem.id, entityType: 'VEHICLE',
          fromState: 'IN_STOCK', toState: 'ALLOCATED',
          notes: actionNotes || `Vehicle allocated to customer booking: ${selectedDealObj?.customer?.name}`
        });
      }
      await updateVehicleMutation.mutateAsync({ id: selectedItem.vehicleId || selectedItem.id, patch: { status: 'Reserved' } });
      refetchAll(); setDrawerOpen(false); setAllocSaleId('');
    } catch (e: any) { err('Error: ' + e.message); }
  };

  // 6. BOOKED → ALLOCATED (from booking card side)
  const handleAllocateVehicleToBooking = async () => {
    if (!allocVehicleId) { err('Please select a vehicle to allocate.'); return; }
    try {
      await updateSaleMutation.mutateAsync({
        id: selectedItem.id,
        patch: { vehicleId: allocVehicleId, allocationDate: new Date().toISOString(), currentState: 'ALLOCATED' }
      });
      await transitionMutation.mutateAsync({
        entityId: allocVehicleId, entityType: 'VEHICLE',
        fromState: 'IN_STOCK', toState: 'ALLOCATED',
        notes: actionNotes || `Vehicle allocated to customer booking: ${selectedItem.customerName}`
      });
      await updateVehicleMutation.mutateAsync({ id: allocVehicleId, patch: { status: 'Reserved' } });
      refetchAll(); setDrawerOpen(false); setAllocVehicleId('');
    } catch (e: any) { err('Error: ' + e.message); }
  };

  // 7. ALLOCATED → PAYMENT_STRUCTURED
  const handleStructurePaymentSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!salePrice) { err('Please enter the finalized sale price.'); return; }
    try {
      const patchData: any = {
        paymentType, salePrice: Number(salePrice),
        bookingAmount: Number(bookingAmount || 0),
        currentState: 'PAYMENT_STRUCTURED'
      };
      if (paymentType === 'FINANCED') {
        Object.assign(patchData, { bankName, bankBranch, rmName, rmPhone, approvedLoan: Number(approvedLoan || 0) });
        if (deliveryOrderFile) {
          try {
            const orgId = useAuthStore.getState().user?.orgId || 'default';
            const r2Path = buildR2Path(orgId, selectedItem.id, 'PAYMENT_STRUCTURED', 'bank_do', deliveryOrderFile);
            const publicUrl = await uploadToR2(deliveryOrderFile, r2Path);
            patchData.deliveryOrderUrl = publicUrl;
            setDeliveryOrderUrl(publicUrl);
          } catch (uploadErr: any) {
            console.warn('R2 upload failed, continuing without DO URL:', uploadErr.message);
          }
        }
      }
      await updateSaleMutation.mutateAsync({ id: selectedItem.id, patch: patchData });
      await transitionMutation.mutateAsync({
        entityId: selectedItem.id, entityType: 'SALE',
        fromState: 'ALLOCATED', toState: 'PAYMENT_STRUCTURED',
        notes: actionNotes || `Payment scheme structured as ${paymentType}. Total Sale: NPR ${Number(salePrice).toLocaleString()}`
      });
      if (selectedItem.vehicleId) {
        await supabase.from('vehicles').update({ vehicle_state: 'PAYMENT_STRUCTURED' } as any).eq('id', selectedItem.vehicleId);
      }
      refetchAll(); setDrawerOpen(false);
    } catch (e: any) { err('Error: ' + e.message); }
  };

  // 8. PAYMENT_STRUCTURED / BANK_ALLOTMENT → READY_FOR_DELIVERY
  const handleReadyForDelivery = async () => {
    try {
      await updateSaleMutation.mutateAsync({
        id: selectedItem.id,
        patch: { readyForDeliveryAt: new Date().toISOString(), currentState: 'READY_FOR_DELIVERY' }
      });
      await transitionMutation.mutateAsync({
        entityId: selectedItem.id, entityType: 'SALE',
        fromState: selectedItem.state, toState: 'READY_FOR_DELIVERY',
        notes: actionNotes || 'PDI checklist verified. Vehicle prepped, clean and ready for client delivery.'
      });
      if (selectedItem.vehicleId) {
        await supabase.from('vehicles').update({ vehicle_state: 'READY_FOR_DELIVERY' } as any).eq('id', selectedItem.vehicleId);
      }
      refetchAll(); setDrawerOpen(false);
    } catch (e: any) { err('Error: ' + e.message); }
  };

  // 9. READY_FOR_DELIVERY → DELIVERED
  const handleCompleteDelivery = async () => {
    try {
      await updateSaleMutation.mutateAsync({
        id: selectedItem.id,
        patch: { deliveredAt: new Date().toISOString(), currentState: 'DELIVERED' }
      });
      await transitionMutation.mutateAsync({
        entityId: selectedItem.id, entityType: 'SALE',
        fromState: 'READY_FOR_DELIVERY', toState: 'DELIVERED',
        notes: actionNotes || 'Vehicle officially delivered. Customer handover form signed and keys released.'
      });
      if (selectedItem.vehicleId) {
        await supabase.from('vehicles').update({ vehicle_state: 'DELIVERED', status: 'Sold' } as any).eq('id', selectedItem.vehicleId);
      }
      refetchAll(); setDrawerOpen(false);
    } catch (e: any) { err('Error: ' + e.message); }
  };

  // 10. DELIVERED → INSURANCE_ACTIVATION
  const handleInsuranceActivate = async () => {
    if (!insuranceNo && !willUpdateInsuranceLater) {
      err('Please enter the Insurance Policy Number or check the "Sent Activation Email" box.');
      return;
    }
    const finalPolicyNo = insuranceNo || 'PENDING_EMAIL_SENT';
    try {
      await updateSaleMutation.mutateAsync({
        id: selectedItem.id,
        patch: { insurancePolicyNo: finalPolicyNo, insuranceActivatedAt: new Date().toISOString(), currentState: 'INSURANCE_ACTIVATION' }
      });
      await transitionMutation.mutateAsync({
        entityId: selectedItem.id, entityType: 'SALE',
        fromState: 'DELIVERED', toState: 'INSURANCE_ACTIVATION',
        notes: actionNotes || (willUpdateInsuranceLater ? `Insurance activation email sent. Policy number pending.` : `Insurance activated under policy number ${finalPolicyNo}`)
      });
      if (selectedItem.vehicleId) {
        await supabase.from('vehicles').update({ vehicle_state: 'INSURANCE_ACTIVATION' } as any).eq('id', selectedItem.vehicleId);
      }
      refetchAll(); setDrawerOpen(false);
    } catch (e: any) { err('Error: ' + e.message); }
  };

  // 11. INSURANCE_ACTIVATION → BANK_ALLOTMENT
  const handleGenerateAllotment = async () => {
    try {
      await transitionMutation.mutateAsync({
        entityId: selectedItem.id, entityType: 'SALE',
        fromState: 'INSURANCE_ACTIVATION', toState: 'BANK_ALLOTMENT',
        notes: actionNotes || 'Allotment letter generated and sent to bank.'
      });
      if (selectedItem.vehicleId) {
        await supabase.from('vehicles').update({ vehicle_state: 'BANK_ALLOTMENT' } as any).eq('id', selectedItem.vehicleId);
      }
      refetchAll();
    } catch (e: any) { err('Error: ' + e.message); }
  };

  // 12. INSURANCE_ACTIVATION / BANK_ALLOTMENT → DOTM_REGISTRATION
  const handleRegisterDoTM = async () => {
    if (!registrationNo) { err('Please provide the registration plate number.'); return; }
    try {
      await updateSaleMutation.mutateAsync({
        id: selectedItem.id,
        patch: {
          registrationNo, registeredAt: new Date().toISOString(),
          registeredUnder: selectedItem.paymentType === 'FINANCED' ? selectedItem.bankName : 'CUSTOMER',
          currentState: 'DOTM_REGISTRATION'
        }
      });
      await transitionMutation.mutateAsync({
        entityId: selectedItem.id, entityType: 'SALE',
        fromState: selectedItem.state, toState: 'DOTM_REGISTRATION',
        notes: actionNotes || `DoTM registration completed. Plate: ${registrationNo}`
      });
      if (selectedItem.vehicleId) {
        await supabase.from('vehicles').update({ vehicle_state: 'DOTM_REGISTRATION', registration_no: registrationNo } as any).eq('id', selectedItem.vehicleId);
      }
      refetchAll(); setDrawerOpen(false);
    } catch (e: any) { err('Error: ' + e.message); }
  };

  // 13. DOTM_REGISTRATION → INSURANCE_ENDORSEMENT
  const handleEndorseInsurance = async () => {
    try {
      await updateSaleMutation.mutateAsync({
        id: selectedItem.id,
        patch: { insuranceEndorsedAt: new Date().toISOString(), currentState: 'INSURANCE_ENDORSEMENT' }
      });
      await transitionMutation.mutateAsync({
        entityId: selectedItem.id, entityType: 'SALE',
        fromState: 'DOTM_REGISTRATION', toState: 'INSURANCE_ENDORSEMENT',
        notes: actionNotes || `Insurance policy endorsed to ${selectedItem.bankName} & Customer`
      });
      if (selectedItem.vehicleId) {
        await supabase.from('vehicles').update({ vehicle_state: 'INSURANCE_ENDORSEMENT' } as any).eq('id', selectedItem.vehicleId);
      }
      refetchAll(); setDrawerOpen(false);
    } catch (e: any) { err('Error: ' + e.message); }
  };

  // 14. INSURANCE_ENDORSEMENT → BANK_DISBURSEMENT
  const handleDisbursementSubmit = async () => {
    if (!disbursementAmt) { err('Please enter the disbursement amount released by bank.'); return; }
    try {
      await updateSaleMutation.mutateAsync({
        id: selectedItem.id,
        patch: {
          disbursementRequestedAt: new Date().toISOString(),
          disbursementReceivedAt: new Date().toISOString(),
          disbursementAmount: Number(disbursementAmt),
          currentState: 'BANK_DISBURSEMENT'
        }
      });
      await transitionMutation.mutateAsync({
        entityId: selectedItem.id, entityType: 'SALE',
        fromState: 'INSURANCE_ENDORSEMENT', toState: 'BANK_DISBURSEMENT',
        notes: actionNotes || `Disbursement check verified. Released amount: NPR ${Number(disbursementAmt).toLocaleString()}`
      });
      if (selectedItem.vehicleId) {
        await supabase.from('vehicles').update({ vehicle_state: 'BANK_DISBURSEMENT' } as any).eq('id', selectedItem.vehicleId);
      }
      refetchAll(); setDrawerOpen(false);
    } catch (e: any) { err('Error: ' + e.message); }
  };

  // Inline quick transitions (no drawer required)
  const handleInlineApproveStock = async (card: any) => {
    try {
      await updateVehicleMutation.mutateAsync({ id: card.id, patch: { status: 'In Stock' } });
      await transitionMutation.mutateAsync({
        entityId: card.id, entityType: 'VEHICLE',
        fromState: 'RECEIVED', toState: 'IN_STOCK',
        notes: 'Vehicle inspection completed. Moved to In Stock.'
      });
      refetchAll();
    } catch (e: any) { err('Error: ' + e.message); }
  };

  const handleInlineReadyForDelivery = async (card: any) => {
    try {
      await updateSaleMutation.mutateAsync({ id: card.id, patch: { readyForDeliveryAt: new Date().toISOString(), currentState: 'READY_FOR_DELIVERY' } });
      await transitionMutation.mutateAsync({
        entityId: card.id, entityType: 'SALE',
        fromState: card.state, toState: 'READY_FOR_DELIVERY',
        notes: 'PDI verified. Vehicle ready for delivery.'
      });
      if (card.vehicleId) {
        await supabase.from('vehicles').update({ vehicle_state: 'READY_FOR_DELIVERY' } as any).eq('id', card.vehicleId);
      }
      refetchAll();
    } catch (e: any) { err('Error: ' + e.message); }
  };

  const isActionLoading = transitionMutation.isPending || updateVehicleMutation.isPending || updateSaleMutation.isPending;

  return {
    // Form fields
    transitDate, setTransitDate,
    grnNo, setGrnNo,
    engineNo, setEngineNo,
    chassisNo, setChassisNo,
    allocVehicleId, setAllocVehicleId,
    allocSaleId, setAllocSaleId,
    paymentType, setPaymentType,
    bookingAmount, setBookingAmount,
    salePrice, setSalePrice,
    bankName, setBankName,
    bankBranch, setBankBranch,
    rmName, setRmName,
    rmPhone, setRmPhone,
    approvedLoan, setApprovedLoan,
    deliveryOrderFile, setDeliveryOrderFile,
    deliveryOrderUrl, setDeliveryOrderUrl,
    insuranceNo, setInsuranceNo,
    willUpdateInsuranceLater, setWillUpdateInsuranceLater,
    registrationNo, setRegistrationNo,
    disbursementAmt, setDisbursementAmt,
    actionNotes, setActionNotes,
    // Methods
    populateFromCard,
    handleLinkLC, handleMarkShipped, handleGRNSubmit,
    handleApproveStock, handleAllocateToBooking, handleAllocateVehicleToBooking,
    handleStructurePaymentSubmit, handleReadyForDelivery, handleCompleteDelivery,
    handleInsuranceActivate, handleGenerateAllotment, handleRegisterDoTM,
    handleEndorseInsurance, handleDisbursementSubmit,
    handleInlineApproveStock, handleInlineReadyForDelivery,
    isActionLoading
  };
}
