import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  useInventory,
  useSaleRecords,
  useProformaInvoices,
  useTransitionState,
  useUpdateVehicle,
  useUpdateSaleRecord,
  useDealSteps,
  useCreatePI,
  useCreateLC,
  useCreateVehicle,
  useCreateCustomer,
  useCreateSaleRecord,
  useCustomers,
  supabase
} from '../api';
import { PageHeader, Card, Badge, Button, MetricCard, Skeleton, Input, Select, Modal } from '../UI';
import {
  Compass, ShieldCheck, Truck, ClipboardList, CheckCircle2,
  AlertTriangle, Send, User, ChevronRight, ChevronDown, Printer, Search,
  ArrowRight, ShieldAlert, DollarSign, Calendar, Info, Clock, Sparkles, X, Plus, FileText
} from 'lucide-react';
import { STATE_METADATA } from '../lib/stateMachine';
import { VehicleState } from '../types';
import { AllotmentLetterModal } from '../components/AllotmentLetterModal';
import { DocumentsVault } from '../components/DocumentsVault';
import { useAuthStore } from '../lib/store';
import { PRODUCT_CATALOG } from '../constants';

// Define Kanban Columns
interface Column {
  id: string;
  title: string;
  description: string;
  colorClass: string;
  states: VehicleState[];
}

const COLUMNS: Column[] = [
  {
    id: 'sourcing',
    title: 'Sourcing & Import',
    description: 'PO, LC, Transit and GRN',
    colorClass: 'border-t-blue-500',
    states: ['PO_ISSUED', 'LC_OPENED', 'IN_TRANSIT', 'RECEIVED']
  },
  {
    id: 'stock',
    title: 'Available Stock',
    description: 'In stock and ready for sale',
    colorClass: 'border-t-green-500',
    states: ['IN_STOCK']
  },
  {
    id: 'booking',
    title: 'Booking & Finance',
    description: 'Booked and payment structuring',
    colorClass: 'border-t-pink-500',
    states: ['BOOKED', 'ALLOCATED', 'PAYMENT_STRUCTURED', 'READY_FOR_DELIVERY', 'DELIVERED']
  },
  {
    id: 'compliance',
    title: 'Post-Delivery Compliance (F&I)',
    description: 'Insurance, DoTM & Disbursement',
    colorClass: 'border-t-amber-500',
    states: ['INSURANCE_ACTIVATION', 'BANK_ALLOTMENT', 'DOTM_REGISTRATION', 'INSURANCE_ENDORSEMENT', 'BANK_DISBURSEMENT']
  }
];

const STAGE_ACTION_INSTRUCTIONS: Record<VehicleState, string> = {
  PO_ISSUED: 'Link Letter of Credit (LC) reference in action panel',
  LC_OPENED: 'Set expected arrival date and mark in transit in action panel',
  IN_TRANSIT: 'Record Goods Received Note (GRN) details in action panel',
  RECEIVED: 'Approve vehicle reception into showroom stock in action panel',
  IN_STOCK: 'Allocate this stock unit to a customer booking in action panel',
  BOOKED: 'Allocate an available vehicle to this customer booking in action panel',
  ALLOCATED: 'Configure final sale price, down payment, and Bank DO (Delivery Order) in action panel',
  PAYMENT_STRUCTURED: 'Verify Down Payment & DO from bank, then mark vehicle Ready for Delivery in action panel',
  BANK_ALLOTMENT: 'Verify Down Payment & DO from bank, then mark vehicle Ready for Delivery in action panel',
  READY_FOR_DELIVERY: 'Verify PDI checklist, generate Gate Pass and deliver vehicle to client in action panel',
  DELIVERED: 'Vehicle delivered to client! Initiate post-delivery insurance policy activation in action panel',
  INSURANCE_ACTIVATION: 'Register plate number and DoTM Yatayat registry details in action panel',
  DOTM_REGISTRATION: 'Submit Insurance Endorsement to financing bank in action panel',
  INSURANCE_ENDORSEMENT: 'Record Bank loan disbursement amount release check in action panel',
  BANK_DISBURSEMENT: 'All post-delivery compliance & bank loan disbursements are complete!'
};

const STAGE_ACTION_TITLES: Record<VehicleState, string> = {
  PO_ISSUED: 'Link Letter of Credit (LC)',
  LC_OPENED: 'Initiate Transit Dispatch',
  IN_TRANSIT: 'Goods Received Note (GRN) Reception',
  RECEIVED: 'Inspect & Approve Showroom Stock',
  IN_STOCK: 'Allocate Showroom Unit to Booking',
  BOOKED: 'Allocate Vehicle Unit to Booking',
  ALLOCATED: 'Structure Payment & Upload Bank DO',
  PAYMENT_STRUCTURED: 'Verify DO & Down Payment (Prep Delivery)',
  BANK_ALLOTMENT: 'Verify DO & Down Payment (Prep Delivery)',
  READY_FOR_DELIVERY: 'PDI Inspection & Formal Handover (Deliver)',
  DELIVERED: 'Activate Post-Delivery Insurance Policy',
  INSURANCE_ACTIVATION: 'Register Vehicle at DoTM Yatayat Office',
  DOTM_REGISTRATION: 'Submit Insurance Policy Endorsement',
  INSURANCE_ENDORSEMENT: 'Verify Bank Loan Payout Disbursement',
  BANK_DISBURSEMENT: 'Delivery & Post-Settlement Complete'
};

export const VehicleJourney: React.FC = () => {
  const activeTab = 'pipeline';

  // Queries
  const { data: vehicles = [], isLoading: isInventoryLoading, refetch: refetchVehicles } = useInventory();
  const { data: deals = [], isLoading: isDealsLoading, refetch: refetchDeals } = useSaleRecords();
  const { data: pis = [], isLoading: isPIsLoading, refetch: refetchPis } = useProformaInvoices();
  const { data: customers = [], refetch: refetchCustomers } = useCustomers();

  // Derived activeCatalog (including custom database catalog templates)
  const activeCatalog = useMemo(() => {
    const dbCatalog = vehicles.filter(v => v.vin && v.vin.startsWith('CAT-'));
    return dbCatalog.length > 0 ? dbCatalog : PRODUCT_CATALOG;
  }, [vehicles, PRODUCT_CATALOG]);

  // Mutations
  const updateVehicleMutation = useUpdateVehicle();
  const updateSaleMutation = useUpdateSaleRecord();
  const transitionMutation = useTransitionState();
  const createPIMutation = useCreatePI();
  const createLCMutation = useCreateLC();
  const createCustomerMutation = useCreateCustomer();
  const createSaleMutation = useCreateSaleRecord();

  // Local UI States
  const [selectedItem, setSelectedItem] = useState<any>(null); // Holds selected vehicle or sale record details
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showAllotmentModal, setShowAllotmentModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState<string>('ALL');
  const [procurementTab, setProcurementTab] = useState<'pis' | 'lcs' | 'incoming'>('pis');
  const [fniTab, setFniTab] = useState<'insurance' | 'dotm' | 'disbursement' | 'delivery'>('insurance');

  // Quick Action Modals State
  const [showPIModal, setShowPIModal] = useState(false);
  const [showLCModal, setShowLCModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [detailTab, setDetailTab] = useState<'actions' | 'timeline'>('actions');
  const [viewMode, setViewMode] = useState<'board' | 'tracker'>('tracker');
  const [collapsedStates, setCollapsedStates] = useState<Record<string, boolean>>({
    DELIVERED: false,
    INSURANCE_ACTIVATION: false,
    DOTM_REGISTRATION: false,
    INSURANCE_ENDORSEMENT: false,
    BANK_DISBURSEMENT: true,
  });

  // Form states for quick actions
  const [piNumberVal, setPiNumberVal] = useState('');
  const [piDateVal, setPiDateVal] = useState('');
  const [piAmountVal, setPiAmountVal] = useState('');
  const [piSupplierVal, setPiSupplierVal] = useState('MAW');
  const [piUnitsVal, setPiUnitsVal] = useState('1');

  const [lcNumberVal, setLcNumberVal] = useState('');
  const [lcPIIdVal, setLcPIIdVal] = useState('');
  const [lcBankVal, setLcBankVal] = useState('');
  const [lcBranchVal, setLcBranchVal] = useState('');
  const [lcOpeningDateVal, setLcOpeningDateVal] = useState('');
  const [lcAmountVal, setLcAmountVal] = useState('');

  const [vModelVal, setVModelVal] = useState('');
  const [vVariantVal, setVVariantVal] = useState('');
  const [vColorVal, setVColorVal] = useState('');
  const [vPriceVal, setVPriceVal] = useState('');
  const [vCostVal, setVCostVal] = useState('');
  const [vVinVal, setVVinVal] = useState('');
  const [vEngineNoVal, setVEngineNoVal] = useState('');
  const [vPIIdVal, setVPIIdVal] = useState('');

  const [existCustId, setExistCustId] = useState('');
  const [bookModel, setBookModel] = useState('');
  const [bookColor, setBookColor] = useState('');
  const [bookAmount, setBookAmount] = useState('');
  const [bookPrice, setBookPrice] = useState('');

  // Input states for drawer forms
  const [lcDate, setLcDate] = useState('');
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
  const [deliveryOrderUrl, setDeliveryOrderUrl] = useState<string>('');
  const [insuranceNo, setInsuranceNo] = useState('');
  const [willUpdateInsuranceLater, setWillUpdateInsuranceLater] = useState(false);
  const [registrationNo, setRegistrationNo] = useState('');
  const [disbursementAmt, setDisbursementAmt] = useState('');
  const [actionNotes, setActionNotes] = useState('');

  // Fetch log steps for the active item
  const { data: transitionLogs = [], isLoading: isLogsLoading } = useDealSteps(
    selectedItem?.entityType === 'VEHICLE' ? selectedItem.id : selectedItem?.id || ''
  );

  const user = useAuthStore(state => state.user);

  // Group vehicles and deals into cohesive "journey cards"
  const journeyCards = useMemo(() => {
    const cards: any[] = [];

    // 1. Process vehicles
    vehicles.forEach((vehicle) => {
      const vState = (vehicle.vehicleState || 'IN_STOCK') as VehicleState;

      // Find if this vehicle has an active sale record linked to it
      const linkedDeal = deals.find(d => d.vehicleId === vehicle.id);

      if (linkedDeal) {
        // If linked, this is tracked through the Sale record state primarily
        cards.push({
          id: linkedDeal.id,
          entityType: 'SALE',
          vehicleId: vehicle.id,
          state: linkedDeal.currentState as VehicleState,
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
          rawDeal: linkedDeal,
          rawVehicle: vehicle
        });
      } else {
        // Unbooked vehicle: tracked as standalone VEHICLE entity
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

    // 2. Process pending bookings that do NOT have a vehicle allocated yet
    deals.forEach((deal) => {
      if (!deal.vehicleId) {
        cards.push({
          id: deal.id,
          entityType: 'SALE',
          state: (deal.currentState || 'BOOKED') as VehicleState,
          model: deal.vehicleModel || 'TBD Model',
          color: deal.vehicleColor || 'TBD Color',
          price: deal.salePrice,
          customerName: deal.customer?.name || 'Unknown Customer',
          customerPhone: deal.customer?.phone,
          paymentType: deal.paymentType,
          bookingAmount: deal.bookingAmount,
          rawDeal: deal
        });
      }
    });

    return cards;
  }, [vehicles, deals]);

  // Filter cards based on search and sub-state dropdown
  const filteredCards = useMemo(() => {
    return journeyCards.filter((card) => {
      const matchSearch =
        card.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (card.vin && card.vin.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (card.customerName && card.customerName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchState = filterState === 'ALL' || card.state === filterState;

      return matchSearch && matchState;
    });
  }, [journeyCards, searchQuery, filterState]);

  // KPIs
  const kpis = useMemo(() => {
    const importing = journeyCards.filter(c => ['PO_ISSUED', 'LC_OPENED', 'IN_TRANSIT', 'RECEIVED'].includes(c.state)).length;
    const stock = journeyCards.filter(c => c.state === 'IN_STOCK').length;
    const activeCompliance = journeyCards.filter(c => ['INSURANCE_ACTIVATION', 'BANK_ALLOTMENT', 'DOTM_REGISTRATION', 'INSURANCE_ENDORSEMENT'].includes(c.state)).length;
    const pendingDisbursements = journeyCards.filter(c => c.state === 'INSURANCE_ENDORSEMENT' || c.state === 'BANK_DISBURSEMENT').length;

    return { importing, stock, activeCompliance, pendingDisbursements };
  }, [journeyCards]);

  // Open drawer and pre-populate fields
  const handleOpenDrawer = (card: any) => {
    setSelectedItem(card);
    setDrawerOpen(true);
    setActionNotes('');

    // Prepopulate fields based on entity details
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
      const existingInsNo = card.rawDeal?.insurancePolicyNo || '';
      setInsuranceNo(existingInsNo === 'PENDING_EMAIL_SENT' ? '' : existingInsNo);
      setWillUpdateInsuranceLater(existingInsNo === 'PENDING_EMAIL_SENT');
      setRegistrationNo(card.rawDeal?.registrationNo || '');
      setDisbursementAmt(card.rawDeal?.disbursementAmount?.toString() || '');
    }
  };

  // State Transition Actions

  // 1. Sourcing & Import: PO_ISSUED -> LC_OPENED
  const handleLinkLC = async () => {
    try {
      await transitionMutation.mutateAsync({
        entityId: selectedItem.id,
        entityType: 'VEHICLE',
        fromState: 'PO_ISSUED',
        toState: 'LC_OPENED',
        notes: actionNotes || 'LC successfully linked and activated.'
      });
      refetchAll();
      setDrawerOpen(false);
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // 2. Sourcing & Import: LC_OPENED -> IN_TRANSIT
  const handleMarkShipped = async () => {
    if (!transitDate) {
      alert('Please set the expected delivery date.');
      return;
    }
    try {
      await updateVehicleMutation.mutateAsync({
        id: selectedItem.id,
        patch: { expectedDeliveryDate: transitDate } as any
      });
      await transitionMutation.mutateAsync({
        entityId: selectedItem.id,
        entityType: 'VEHICLE',
        fromState: 'LC_OPENED',
        toState: 'IN_TRANSIT',
        notes: actionNotes || `Vehicle shipped. Expected arrival: ${new Date(transitDate).toLocaleDateString()}`
      });
      refetchAll();
      setDrawerOpen(false);
      setTransitDate('');
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // 3. Sourcing & Import: IN_TRANSIT -> RECEIVED
  const handleGRNSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grnNo || !engineNo || !chassisNo) {
      alert('Please provide GRN, Engine, and Chassis numbers.');
      return;
    }
    try {
      await updateVehicleMutation.mutateAsync({
        id: selectedItem.id,
        patch: {
          grnNumber: grnNo,
          motorNo: engineNo,
          vin: chassisNo,
          chassisNo: chassisNo,
          receivedAt: new Date().toISOString()
        } as any
      });
      await transitionMutation.mutateAsync({
        entityId: selectedItem.id,
        entityType: 'VEHICLE',
        fromState: 'IN_TRANSIT',
        toState: 'RECEIVED',
        notes: actionNotes || `GRN receipt generated: ${grnNo}. Physical inspection complete.`
      });
      refetchAll();
      setDrawerOpen(false);
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // 4. Sourcing & Import: RECEIVED -> IN_STOCK
  const handleApproveStock = async () => {
    try {
      await updateVehicleMutation.mutateAsync({
        id: selectedItem.id,
        patch: { status: 'In Stock' }
      });
      await transitionMutation.mutateAsync({
        entityId: selectedItem.id,
        entityType: 'VEHICLE',
        fromState: 'RECEIVED',
        toState: 'IN_STOCK',
        notes: actionNotes || 'Vehicle marked in stock and ready for client allocations.'
      });
      refetchAll();
      setDrawerOpen(false);
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // 5. Booking & Finance: IN_STOCK -> ALLOCATED (Assign existing booking to stock vehicle)
  const handleAllocateToBooking = async () => {
    if (!allocSaleId) {
      alert('Please select a booking to allocate.');
      return;
    }
    try {
      const selectedDealObj = deals.find(d => d.id === allocSaleId);
      
      // 1. Link vehicle to the sale record
      await updateSaleMutation.mutateAsync({
        id: allocSaleId,
        patch: {
          vehicleId: selectedItem.id,
          allocationDate: new Date().toISOString(),
          currentState: 'ALLOCATED'
        }
      });

      // 2. Transition vehicle to ALLOCATED
      await transitionMutation.mutateAsync({
        entityId: selectedItem.id,
        entityType: 'VEHICLE',
        fromState: 'IN_STOCK',
        toState: 'ALLOCATED',
        notes: actionNotes || `Vehicle allocated to customer booking: ${selectedDealObj?.customer?.name}`
      });

      // 3. Mark vehicle status as reserved
      await updateVehicleMutation.mutateAsync({
        id: selectedItem.id,
        patch: { status: 'Reserved' }
      });

      refetchAll();
      setDrawerOpen(false);
      setAllocSaleId('');
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // 6. Booking & Finance: BOOKED -> ALLOCATED (Assign stock vehicle to pending booking)
  const handleAllocateVehicleToBooking = async () => {
    if (!allocVehicleId) {
      alert('Please select a vehicle to allocate.');
      return;
    }
    try {
      // 1. Link vehicle to the sale record
      await updateSaleMutation.mutateAsync({
        id: selectedItem.id,
        patch: {
          vehicleId: allocVehicleId,
          allocationDate: new Date().toISOString(),
          currentState: 'ALLOCATED'
        }
      });

      // 2. Transition vehicle to ALLOCATED
      await transitionMutation.mutateAsync({
        entityId: allocVehicleId,
        entityType: 'VEHICLE',
        fromState: 'IN_STOCK',
        toState: 'ALLOCATED',
        notes: actionNotes || `Vehicle allocated to customer booking: ${selectedItem.customerName}`
      });

      // 3. Mark vehicle status as reserved
      await updateVehicleMutation.mutateAsync({
        id: allocVehicleId,
        patch: { status: 'Reserved' }
      });

      refetchAll();
      setDrawerOpen(false);
      setAllocVehicleId('');
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // 7. Booking & Finance: ALLOCATED -> PAYMENT_STRUCTURED
  const handleStructurePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salePrice) {
      alert('Please enter the finalized sale price.');
      return;
    }
    try {
      const patchData: any = {
        paymentType,
        salePrice: Number(salePrice),
        bookingAmount: Number(bookingAmount || 0),
        currentState: 'PAYMENT_STRUCTURED'
      };

      if (paymentType === 'FINANCED') {
        patchData.bankName = bankName;
        patchData.bankBranch = bankBranch;
        patchData.rmName = rmName;
        patchData.rmPhone = rmPhone;
        patchData.approvedLoan = Number(approvedLoan || 0);

        // Upload Delivery Order document if selected
        if (deliveryOrderFile) {
          const fileExt = deliveryOrderFile.name.split('.').pop();
          const filePath = `delivery-orders/${selectedItem.id}-${Date.now()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(filePath, deliveryOrderFile, { upsert: true });
          if (uploadError) {
            console.warn('DO upload failed (non-blocking):', uploadError.message);
          } else {
            const { data: urlData } = supabase.storage.from('documents').getPublicUrl(filePath);
            patchData.deliveryOrderUrl = urlData?.publicUrl || '';
            setDeliveryOrderUrl(patchData.deliveryOrderUrl);
          }
        }
      }

      await updateSaleMutation.mutateAsync({
        id: selectedItem.id,
        patch: patchData
      });

      await transitionMutation.mutateAsync({
        entityId: selectedItem.id,
        entityType: 'SALE',
        fromState: 'ALLOCATED',
        toState: 'PAYMENT_STRUCTURED',
        notes: actionNotes || `Payment scheme structured as ${paymentType}. Total Sale: ₹${Number(salePrice).toLocaleString()}`
      });

      if (selectedItem.vehicleId) {
        const { error: vError } = await supabase
          .from('vehicles')
          .update({ vehicle_state: 'PAYMENT_STRUCTURED' } as any)
          .eq('id', selectedItem.vehicleId);
        if (vError) throw vError;
      }

      refetchAll();
      setDrawerOpen(false);
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // 8. Compliance: PAYMENT_STRUCTURED -> INSURANCE_ACTIVATION
  const handleInsuranceActivate = async () => {
    if (!insuranceNo && !willUpdateInsuranceLater) {
      alert('Please enter the Insurance Policy Number or check the box stating you have sent the activation email.');
      return;
    }
    const finalPolicyNo = insuranceNo || 'PENDING_EMAIL_SENT';
    try {
      await updateSaleMutation.mutateAsync({
        id: selectedItem.id,
        patch: {
          insurancePolicyNo: finalPolicyNo,
          insuranceActivatedAt: new Date().toISOString(),
          currentState: 'INSURANCE_ACTIVATION'
        }
      });

      await transitionMutation.mutateAsync({
        entityId: selectedItem.id,
        entityType: 'SALE',
        fromState: 'PAYMENT_STRUCTURED',
        toState: 'INSURANCE_ACTIVATION',
        notes: actionNotes || (willUpdateInsuranceLater 
          ? `Insurance activation request email sent. Policy number pending.` 
          : `Insurance activated under policy number ${finalPolicyNo}`)
      });

      if (selectedItem.vehicleId) {
        const { error: vError } = await supabase
          .from('vehicles')
          .update({ vehicle_state: 'INSURANCE_ACTIVATION' } as any)
          .eq('id', selectedItem.vehicleId);
        if (vError) throw vError;
      }

      refetchAll();
      setDrawerOpen(false);
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // 9. Compliance: INSURANCE_ACTIVATION -> BANK_ALLOTMENT (Financed only)
  const handleGenerateAllotment = async () => {
    try {
      await transitionMutation.mutateAsync({
        entityId: selectedItem.id,
        entityType: 'SALE',
        fromState: 'INSURANCE_ACTIVATION',
        toState: 'BANK_ALLOTMENT',
        notes: actionNotes || 'Allotment letter generated and sent to bank.'
      });

      if (selectedItem.vehicleId) {
        const { error: vError } = await supabase
          .from('vehicles')
          .update({ vehicle_state: 'BANK_ALLOTMENT' } as any)
          .eq('id', selectedItem.vehicleId);
        if (vError) throw vError;
      }

      refetchAll();
      // Re-trigger visual detail update
      setSelectedItem((prev: any) => ({ ...prev, state: 'BANK_ALLOTMENT' }));
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // 10. Compliance: INSURANCE_ACTIVATION / BANK_ALLOTMENT -> DOTM_REGISTRATION
  const handleRegisterDoTM = async () => {
    if (!registrationNo) {
      alert('Please provide the registration plate number.');
      return;
    }
    try {
      await updateSaleMutation.mutateAsync({
        id: selectedItem.id,
        patch: {
          registrationNo: registrationNo,
          registeredAt: new Date().toISOString(),
          registeredUnder: selectedItem.paymentType === 'FINANCED' ? selectedItem.bankName : 'CUSTOMER',
          currentState: 'DOTM_REGISTRATION'
        }
      });

      await transitionMutation.mutateAsync({
        entityId: selectedItem.id,
        entityType: 'SALE',
        fromState: selectedItem.state,
        toState: 'DOTM_REGISTRATION',
        notes: actionNotes || `DoTM registration completed. Plate: ${registrationNo}`
      });

      if (selectedItem.vehicleId) {
        const { error: vError } = await supabase
          .from('vehicles')
          .update({ vehicle_state: 'DOTM_REGISTRATION', registration_no: registrationNo } as any)
          .eq('id', selectedItem.vehicleId);
        if (vError) throw vError;
      }

      refetchAll();
      setDrawerOpen(false);
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // 11. Compliance: DOTM_REGISTRATION -> INSURANCE_ENDORSEMENT (Financed only)
  const handleEndorseInsurance = async () => {
    try {
      await updateSaleMutation.mutateAsync({
        id: selectedItem.id,
        patch: {
          insuranceEndorsedAt: new Date().toISOString(),
          currentState: 'INSURANCE_ENDORSEMENT'
        }
      });

      await transitionMutation.mutateAsync({
        entityId: selectedItem.id,
        entityType: 'SALE',
        fromState: 'DOTM_REGISTRATION',
        toState: 'INSURANCE_ENDORSEMENT',
        notes: actionNotes || `Insurance policy endorsed to ${selectedItem.bankName} & Customer`
      });

      if (selectedItem.vehicleId) {
        const { error: vError } = await supabase
          .from('vehicles')
          .update({ vehicle_state: 'INSURANCE_ENDORSEMENT' } as any)
          .eq('id', selectedItem.vehicleId);
        if (vError) throw vError;
      }

      refetchAll();
      setDrawerOpen(false);
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // 12. Settlement & Delivery: INSURANCE_ENDORSEMENT -> BANK_DISBURSEMENT (Financed only)
  const handleDisbursementSubmit = async () => {
    if (!disbursementAmt) {
      alert('Please enter the disbursement amount released by bank.');
      return;
    }
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
        entityId: selectedItem.id,
        entityType: 'SALE',
        fromState: 'INSURANCE_ENDORSEMENT',
        toState: 'BANK_DISBURSEMENT',
        notes: actionNotes || `Disbursement check verified. Released amount: ₹${Number(disbursementAmt).toLocaleString()}`
      });

      if (selectedItem.vehicleId) {
        const { error: vError } = await supabase
          .from('vehicles')
          .update({ vehicle_state: 'BANK_DISBURSEMENT' } as any)
          .eq('id', selectedItem.vehicleId);
        if (vError) throw vError;
      }

      refetchAll();
      setDrawerOpen(false);
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // 13. Settlement & Delivery: BANK_DISBURSEMENT / DOTM_REGISTRATION (Cash) -> READY_FOR_DELIVERY
  const handleReadyForDelivery = async () => {
    try {
      await updateSaleMutation.mutateAsync({
        id: selectedItem.id,
        patch: {
          readyForDeliveryAt: new Date().toISOString(),
          currentState: 'READY_FOR_DELIVERY'
        }
      });

      await transitionMutation.mutateAsync({
        entityId: selectedItem.id,
        entityType: 'SALE',
        fromState: selectedItem.state,
        toState: 'READY_FOR_DELIVERY',
        notes: actionNotes || 'PDI checklist verified. Vehicle prepped, clean and ready for client delivery.'
      });

      if (selectedItem.vehicleId) {
        const { error: vError } = await supabase
          .from('vehicles')
          .update({ vehicle_state: 'READY_FOR_DELIVERY' } as any)
          .eq('id', selectedItem.vehicleId);
        if (vError) throw vError;
      }

      refetchAll();
      setDrawerOpen(false);
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // 14. Settlement & Delivery: READY_FOR_DELIVERY -> DELIVERED
  const handleCompleteDelivery = async () => {
    try {
      await updateSaleMutation.mutateAsync({
        id: selectedItem.id,
        patch: {
          deliveredAt: new Date().toISOString(),
          currentState: 'DELIVERED'
        }
      });

      await transitionMutation.mutateAsync({
        entityId: selectedItem.id,
        entityType: 'SALE',
        fromState: 'READY_FOR_DELIVERY',
        toState: 'DELIVERED',
        notes: actionNotes || 'Vehicle officially delivered. Customer handover form signed and keys released.'
      });

      if (selectedItem.vehicleId) {
        // Also update primary vehicle status to Sold
        const { error: vError } = await supabase
          .from('vehicles')
          .update({ vehicle_state: 'DELIVERED', status: 'Sold' } as any)
          .eq('id', selectedItem.vehicleId);
        if (vError) throw vError;
      }

      refetchAll();
      setDrawerOpen(false);
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // Modal Submission Handlers

  // Log PI
  const handleCreatePISubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!piNumberVal || !piDateVal || !piAmountVal) {
      alert('Please fill out all required PI details.');
      return;
    }
    try {
      await createPIMutation.mutateAsync({
        piNumber: piNumberVal,
        issueDate: piDateVal,
        totalAmount: Number(piAmountVal),
        supplier: piSupplierVal,
        units: Number(piUnitsVal) || 1
      });
      setShowPIModal(false);
      setPiNumberVal('');
      setPiDateVal('');
      setPiAmountVal('');
      setPiSupplierVal('MAW');
      setPiUnitsVal('1');
      refetchPis();
    } catch (err: any) {
      alert('Error logging PI: ' + err.message);
    }
  };

  // Open LC
  const handleCreateLCSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lcNumberVal || !lcPIIdVal || !lcBankVal || !lcOpeningDateVal || !lcAmountVal) {
      alert('Please fill out all required LC details.');
      return;
    }
    try {
      await createLCMutation.mutateAsync({
        lcNumber: lcNumberVal,
        piId: lcPIIdVal,
        bankName: lcBankVal,
        bankBranch: lcBranchVal,
        openingDate: lcOpeningDateVal,
        amount: Number(lcAmountVal),
        currency: 'NPR',
        targetCycleDays: 90
      });
      setShowLCModal(false);
      setLcNumberVal('');
      setLcPIIdVal('');
      setLcBankVal('');
      setLcBranchVal('');
      setLcOpeningDateVal('');
      setLcAmountVal('');
      refetchPis();
    } catch (err: any) {
      alert('Error opening LC: ' + err.message);
    }
  };

  // Link / Add Vehicle
  const handleCreateVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vModelVal || !vVariantVal || !vVinVal || !vPIIdVal) {
      alert('Please fill out all required vehicle details.');
      return;
    }
    try {
      const selectedPI = pis.find(p => p.id === vPIIdVal);
      
      // Enforce unit capacity limit
      const usedSlots = selectedPI?.linkedVehicleCount ?? 0;
      const totalSlots = selectedPI?.units ?? 1;
      if (usedSlots >= totalSlots) {
        alert(`Cannot add more vehicles. PI ${selectedPI?.piNumber} has a limit of ${totalSlots} unit${totalSlots !== 1 ? 's' : ''} and all slots are filled.`);
        return;
      }
      
      const userOrgId = useAuthStore.getState().user?.orgId;
      
      const { data: newV, error } = await supabase
        .from('vehicles')
        .insert([{
          model: vModelVal,
          variant: vVariantVal,
          color: vColorVal,
          price: Number(vPriceVal || 0),
          cost: Number(vCostVal || 0),
          vin: vVinVal,
          status: 'Transit',
          vehicle_state: 'PO_ISSUED',
          pi_id: vPIIdVal,
          lc_id: selectedPI?.lc?.id || null,
          proforma_invoice_no: selectedPI?.piNumber || '',
          lc_no: selectedPI?.lc?.lcNumber || '',
          motor_no: vEngineNoVal || '',
          year: 2025,
          fuel_type: activeCatalog.find(c => c.model === vModelVal && c.variant === vVariantVal)?.fuelType || 'EV',
          image_url: (() => {
            const catalogItem = activeCatalog.find(c => c.model === vModelVal && c.variant === vVariantVal);
            const colorItem = catalogItem?.availableColors?.find(col => col.color === vColorVal);
            return colorItem?.image || catalogItem?.image || '';
          })(),
          org_id: userOrgId || null
        }])
        .select()
        .single();
      
      if (error) throw error;

      await transitionMutation.mutateAsync({
        entityId: newV.id,
        entityType: 'VEHICLE',
        fromState: 'PO_ISSUED',
        toState: 'PO_ISSUED',
        notes: `Vehicle added to PI ${selectedPI?.piNumber}`
      });

      setShowVehicleModal(false);
      setVModelVal('');
      setVVariantVal('');
      setVColorVal('');
      setVPriceVal('');
      setVCostVal('');
      setVVinVal('');
      setVEngineNoVal('');
      setVPIIdVal('');
      refetchAll();
    } catch (err: any) {
      alert('Error linking vehicle: ' + err.message);
    }
  };

  // Create Booking
  const handleCreateBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let customerId = existCustId;

      if (!customerId) {
        alert('Please select a customer.');
        return;
      }

      const saleRec = await createSaleMutation.mutateAsync({
        customerId,
        currentState: 'BOOKED',
        paymentType: null,
        bookingAmount: Number(bookAmount || 0),
        salePrice: Number(bookPrice || 0),
        bookingDate: new Date().toISOString().split('T')[0]
      });

      // Update booking model/color details in metadata or simple notes log
      await transitionMutation.mutateAsync({
        entityId: saleRec.id,
        entityType: 'SALE',
        fromState: 'BOOKED',
        toState: 'BOOKED',
        notes: `New booking logged for customer interest in ${bookModel} (${bookColor}). Final Price: ₹${Number(bookPrice).toLocaleString()}`
      });

      // Update vehicle model interest inside sale_record if applicable, else notes log represents it
      setShowBookingModal(false);
      setExistCustId('');
      setBookModel('');
      setBookColor('');
      setBookAmount('');
      setBookPrice('');
      refetchAll();
    } catch (err: any) {
      alert('Error creating booking: ' + err.message);
    }
  };

  const refetchAll = () => {
    refetchVehicles();
    refetchDeals();
    refetchPis();
  };

  const triggerEmailNotify = (subject: string, body: string) => {
    window.open(`mailto:compliance@maw.com.np?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const sendMawEmail = (type: 'grn' | 'transit', data: any) => {
    let subject = '';
    let body = '';
    if (type === 'grn') {
      subject = `GRN Confirmation: PI ${data.piNumber} / GRN ${data.grnNumber}`;
      body = `Hi MAW Team,\n\nWe have successfully received the vehicle with Chassis No: ${data.chassisNo} and Engine No: ${data.motorNo}.\n\nGRN Reference: ${data.grnNumber}\nReceived Date: ${new Date().toLocaleDateString()}\n\nRegards,\nApollo Motors Team`;
    }
    window.open(`mailto:maw-logistics@maw.com.np?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const handleShipVehicle = async (vId: string) => {
    try {
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + 14); // 2 weeks transit time
      
      await updateVehicleMutation.mutateAsync({
        id: vId,
        patch: {
          expectedDeliveryDate: expDate.toISOString().split('T')[0]
        } as any
      });

      await transitionMutation.mutateAsync({
        entityId: vId,
        entityType: 'VEHICLE',
        fromState: 'LC_OPENED',
        toState: 'IN_TRANSIT',
        notes: `Vehicle marked in transit. Expected delivery: ${expDate.toLocaleDateString()}`
      });

      refetchAll();
    } catch (err: any) {
      alert('Error shipping vehicle: ' + err.message);
    }
  };

  const handleMarkInStock = async (vId: string) => {
    try {
      const { error: vError } = await supabase
        .from('vehicles')
        .update({ vehicle_state: 'IN_STOCK' } as any)
        .eq('id', vId);
      if (vError) throw vError;

      await transitionMutation.mutateAsync({
        entityId: vId,
        entityType: 'VEHICLE',
        fromState: 'RECEIVED',
        toState: 'IN_STOCK',
        notes: 'Vehicle inspection completed. Moved to In Stock.'
      });

      refetchAll();
    } catch (err: any) {
      alert('Error marking in stock: ' + err.message);
    }
  };

  const isLoading = isInventoryLoading || isDealsLoading || isPIsLoading;



  // Compute active stats
  const activePIs = pis.length;
  const activeLCs = pis.filter(p => p.lc).length;
  const incomingFleetCount = vehicles.filter(v => ['PO_ISSUED', 'LC_OPENED', 'IN_TRANSIT', 'RECEIVED'].includes(v.vehicleState)).length;

  const lcAgingHealth = useMemo(() => {
    const lcs = pis.map(p => p.lc).filter(Boolean);
    if (!lcs.length) return 100;
    const withinTarget = lcs.filter(lc => {
      const days = Math.floor((Date.now() - new Date(lc.openingDate).getTime()) / (1000 * 60 * 60 * 24));
      return days <= 95;
    }).length;
    return Math.round((withinTarget / lcs.length) * 100);
  }, [pis]);

  return (
    <div className="relative space-y-8 pb-20 overflow-x-hidden">
      {/* ─── Decorative Background Glow Elements ─────────────────────────── */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-accent-teal/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-10 w-[400px] h-[400px] bg-deepal-400/5 rounded-full blur-3xl pointer-events-none -z-10" />

      <PageHeader
        title="Vehicle Journey Command Center"
        subtitle="Unified visual pipeline tracing the dealership capital flow from PO through to final bank disbursement"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Segment Switcher */}
            <div className="flex items-center bg-surface-100 p-1 rounded-xl border border-surface-200/60 shrink-0">
              <button
                onClick={() => setViewMode('tracker')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'tracker'
                    ? 'bg-white text-deepal-600 shadow-sm border border-surface-200/10'
                    : 'text-surface-500 hover:text-surface-850'
                }`}
              >
                🗺️ Live Tracker
              </button>
              <button
                onClick={() => setViewMode('board')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'board'
                    ? 'bg-white text-deepal-600 shadow-sm border border-surface-200/10'
                    : 'text-surface-500 hover:text-surface-850'
                }`}
              >
                📋 Pipeline Board
              </button>
            </div>

            <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 group-focus-within:text-accent-teal transition-colors" size={16} />
              <input
                type="text"
                placeholder="Search VIN, Model, Customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white/80 backdrop-blur-md border border-surface-200 rounded-xl text-xs font-semibold text-surface-900 focus-ring w-52 hover:border-surface-300 transition-all"
              />
            </div>
            <select
              value={filterState}
              onChange={(e) => setFilterState(e.target.value)}
              className="bg-white/80 backdrop-blur-md border border-surface-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-surface-700 cursor-pointer focus-ring hover:border-surface-300 transition-all"
            >
              <option value="ALL">All States</option>
              {Object.keys(STATE_METADATA).map((state) => (
                <option key={state} value={state}>
                  {STATE_METADATA[state as VehicleState].label}
                </option>
              ))}
            </select>
          </div>
        }
      />

      {/* ─── Floating Operations Hub Dock ─────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 bg-white/80 backdrop-blur-lg p-4 rounded-[24px] border border-white/40 shadow-lg shadow-surface-100/50">
        <span className="text-xs font-bold text-surface-700 flex items-center gap-1.5 uppercase tracking-wider mr-2 border-r border-surface-200 pr-4">
          <Sparkles size={14} className="text-accent-teal animate-pulse" /> Operations Hub
        </span>
        <Button size="sm" variant="outline" icon={Plus} onClick={() => setShowPIModal(true)} className="hover:border-blue-400 hover:text-blue-600 transition-all">Log PI</Button>
        <Button size="sm" variant="outline" icon={Plus} onClick={() => setShowLCModal(true)} className="hover:border-indigo-400 hover:text-indigo-600 transition-all">Open LC</Button>
        <Button size="sm" variant="outline" icon={Plus} onClick={() => setShowVehicleModal(true)} className="hover:border-accent-teal hover:text-teal-600 transition-all">Link Vehicle</Button>
        <Button size="sm" variant="outline" icon={Plus} onClick={() => setShowBookingModal(true)} className="hover:border-pink-400 hover:text-pink-600 transition-all">New Booking</Button>
      </div>

      {/* ─── Visual KPI Dashboard ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          label="Importing Pipeline"
          value={kpis.importing}
          icon={Truck}
          className="bg-gradient-to-br from-blue-50/90 to-white border-blue-100/70 shadow-sm shadow-blue-500/5 hover:shadow-md transition-all duration-300 rounded-[20px]"
        />
        <MetricCard
          label="Available Stock"
          value={kpis.stock}
          icon={Compass}
          className="bg-gradient-to-br from-emerald-50/90 to-white border-emerald-100/70 shadow-sm shadow-emerald-500/5 hover:shadow-md transition-all duration-300 rounded-[20px]"
        />
        <MetricCard
          label="F&I Compliance Desk"
          value={kpis.activeCompliance}
          icon={ShieldCheck}
          className="bg-gradient-to-br from-pink-50/90 to-white border-pink-100/70 shadow-sm shadow-pink-500/5 hover:shadow-md transition-all duration-300 rounded-[20px]"
        />
        <MetricCard
          label="Awaiting Payout"
          value={kpis.pendingDisbursements}
          icon={DollarSign}
          className="bg-gradient-to-br from-amber-50/90 to-white border-amber-100/70 shadow-sm shadow-amber-500/5 hover:shadow-md transition-all duration-300 rounded-[20px]"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ))}
        </div>
      ) : viewMode === 'tracker' ? (
        /* ─── Premium Live Tracker Layout ─── */
        <div className="space-y-4">
          {filteredCards.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center bg-white/80 border border-surface-200 rounded-[32px] shadow-sm">
              <span className="text-3xl mb-3">🚙</span>
              <h3 className="font-display text-lg font-bold text-surface-900">No Vehicles Found</h3>
              <p className="text-xs text-surface-500 mt-1 max-w-sm">No vehicles match your active search terms or filters.</p>
            </div>
          ) : (
            filteredCards.map((card) => {
              const progress = STATE_METADATA[card.state]?.progress || 0;
              const meta = STATE_METADATA[card.state] || { label: card.state, color: 'neutral' };

              // Alert check (SLA monitoring)
              let isBreaching = false;
              let breachMsg = '';
              if (card.rawVehicle?.createdAt) {
                const days = Math.floor((Date.now() - new Date(card.rawVehicle.createdAt).getTime()) / (1000 * 60 * 60 * 24));
                if (card.state === 'LC_OPENED' && days > 95) {
                  isBreaching = true;
                  breachMsg = `${days}d Open LC`;
                } else if (card.state === 'IN_STOCK' && days > 60) {
                  isBreaching = true;
                  breachMsg = `${days}d Aging Stock`;
                }
              }

              // Define the 10 milestones
              const trackerMilestones = [
                { key: 'PO_ISSUED', label: 'Order', activeStates: ['PO_ISSUED'], completedStates: ['LC_OPENED', 'IN_TRANSIT', 'RECEIVED', 'IN_STOCK', 'BOOKED', 'ALLOCATED', 'PAYMENT_STRUCTURED', 'BANK_ALLOTMENT', 'READY_FOR_DELIVERY', 'DELIVERED', 'INSURANCE_ACTIVATION', 'DOTM_REGISTRATION', 'INSURANCE_ENDORSEMENT', 'BANK_DISBURSEMENT'] },
                { key: 'LC_OPENED', label: 'LC', activeStates: ['LC_OPENED'], completedStates: ['IN_TRANSIT', 'RECEIVED', 'IN_STOCK', 'BOOKED', 'ALLOCATED', 'PAYMENT_STRUCTURED', 'BANK_ALLOTMENT', 'READY_FOR_DELIVERY', 'DELIVERED', 'INSURANCE_ACTIVATION', 'DOTM_REGISTRATION', 'INSURANCE_ENDORSEMENT', 'BANK_DISBURSEMENT'] },
                { key: 'IN_TRANSIT', label: 'Transit', activeStates: ['IN_TRANSIT'], completedStates: ['RECEIVED', 'IN_STOCK', 'BOOKED', 'ALLOCATED', 'PAYMENT_STRUCTURED', 'BANK_ALLOTMENT', 'READY_FOR_DELIVERY', 'DELIVERED', 'INSURANCE_ACTIVATION', 'DOTM_REGISTRATION', 'INSURANCE_ENDORSEMENT', 'BANK_DISBURSEMENT'] },
                { key: 'RECEIVED', label: 'Yard', activeStates: ['RECEIVED'], completedStates: ['IN_STOCK', 'BOOKED', 'ALLOCATED', 'PAYMENT_STRUCTURED', 'BANK_ALLOTMENT', 'READY_FOR_DELIVERY', 'DELIVERED', 'INSURANCE_ACTIVATION', 'DOTM_REGISTRATION', 'INSURANCE_ENDORSEMENT', 'BANK_DISBURSEMENT'] },
                { key: 'IN_STOCK', label: 'Stock', activeStates: ['IN_STOCK'], completedStates: ['BOOKED', 'ALLOCATED', 'PAYMENT_STRUCTURED', 'BANK_ALLOTMENT', 'READY_FOR_DELIVERY', 'DELIVERED', 'INSURANCE_ACTIVATION', 'DOTM_REGISTRATION', 'INSURANCE_ENDORSEMENT', 'BANK_DISBURSEMENT'] },
                { key: 'BOOKED', label: 'Booked', activeStates: ['BOOKED', 'ALLOCATED'], completedStates: ['PAYMENT_STRUCTURED', 'BANK_ALLOTMENT', 'READY_FOR_DELIVERY', 'DELIVERED', 'INSURANCE_ACTIVATION', 'DOTM_REGISTRATION', 'INSURANCE_ENDORSEMENT', 'BANK_DISBURSEMENT'] },
                { key: 'PAYMENT_STRUCTURED', label: 'DO & Deposit', activeStates: ['PAYMENT_STRUCTURED', 'BANK_ALLOTMENT'], completedStates: ['READY_FOR_DELIVERY', 'DELIVERED', 'INSURANCE_ACTIVATION', 'DOTM_REGISTRATION', 'INSURANCE_ENDORSEMENT', 'BANK_DISBURSEMENT'] },
                { key: 'READY_FOR_DELIVERY', label: 'PDI Prep', activeStates: ['READY_FOR_DELIVERY'], completedStates: ['DELIVERED', 'INSURANCE_ACTIVATION', 'DOTM_REGISTRATION', 'INSURANCE_ENDORSEMENT', 'BANK_DISBURSEMENT'] },
                { key: 'DELIVERED', label: 'Delivered', activeStates: ['DELIVERED'], completedStates: ['INSURANCE_ACTIVATION', 'DOTM_REGISTRATION', 'INSURANCE_ENDORSEMENT', 'BANK_DISBURSEMENT'] },
                { key: 'BANK_DISBURSEMENT', label: 'Settlement', activeStates: ['INSURANCE_ACTIVATION', 'DOTM_REGISTRATION', 'INSURANCE_ENDORSEMENT', 'BANK_DISBURSEMENT'], completedStates: [] }
              ];

              return (
                <div
                  key={`${card.entityType}-${card.id}`}
                  className="flex flex-col lg:flex-row lg:items-center bg-white/90 backdrop-blur-md border border-surface-200/85 shadow-sm rounded-[24px] p-5 gap-6 hover:shadow-md hover:border-accent-teal/40 hover:bg-white transition-all duration-300 relative overflow-hidden group"
                >
                  {isBreaching && (
                    <div className="absolute left-0 top-0 bottom-0 w-[5px] bg-red-500" />
                  )}

                  {/* Left Side: Vehicle Identity */}
                  <div className="flex items-center gap-4 lg:w-72 shrink-0 lg:border-r border-surface-150 pr-4">
                    <div className="h-16 w-24 rounded-xl overflow-hidden bg-gradient-to-b from-surface-50 to-surface-100/50 border border-surface-200/60 flex-shrink-0 flex items-center justify-center relative">
                      {card.image ? (
                        <img src={card.image} alt={card.model} className="object-contain max-h-[85%] max-w-[85%] group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <span className="text-xl">🚗</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-bold text-xs text-surface-900 truncate max-w-[120px] leading-tight">
                          {card.model}
                        </h4>
                        <Badge variant={meta.color as any} size="sm">{meta.label}</Badge>
                      </div>
                      <p className="text-[9px] text-surface-500 font-semibold font-mono tracking-wider mt-1.5 flex items-center gap-1">
                        <span className="opacity-60">Chassis:</span>
                        <span className="text-surface-700 bg-surface-100 px-1 py-0.5 rounded text-[8px] truncate max-w-[110px]">{card.vin || 'Pending'}</span>
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {card.customerName && (
                          <div className="flex items-center gap-1 text-[8px] font-extrabold text-deepal-600 bg-deepal-50/50 py-0.5 px-1.5 rounded-md border border-deepal-100">
                            <User size={8} className="text-deepal-500 shrink-0" />
                            <span className="truncate max-w-[90px]">{card.customerName}</span>
                          </div>
                        )}
                        {card.color && (
                          <span className="text-[9px] text-surface-400 font-semibold flex items-center gap-1">
                            <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: card.color.toLowerCase() }} />
                            <span>{card.color}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Center: Horizontal Node Progress Line */}
                  <div className="flex-1 flex items-center justify-between px-2 md:px-4 relative py-3 overflow-x-auto min-w-[450px]">
                    {trackerMilestones.map((milestone, idx) => {
                      const activeIndex = trackerMilestones.findIndex(m => m.activeStates.includes(card.state));
                      const isCompleted = milestone.completedStates.includes(card.state) || (activeIndex !== -1 && idx < activeIndex);
                      const isActive = milestone.activeStates.includes(card.state) || (milestone.key === 'BANK_DISBURSEMENT' && ['INSURANCE_ACTIVATION', 'DOTM_REGISTRATION', 'INSURANCE_ENDORSEMENT', 'BANK_DISBURSEMENT'].includes(card.state));
                      const isPending = !isCompleted && !isActive;

                      const dotBg = isCompleted
                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                        : isActive
                          ? 'bg-accent-teal border-accent-teal ring-4 ring-accent-teal/20 text-white scale-110'
                          : 'bg-white border-surface-300 text-surface-400';

                      return (
                        <div key={milestone.key} className="flex-1 flex items-center relative">
                          {/* Stepper connecting line */}
                          {idx < trackerMilestones.length - 1 && (
                            <div className="absolute left-[18px] right-0 top-1/2 -translate-y-1/2 h-[3px] pointer-events-none -z-10 bg-surface-150">
                              <div
                                className={`h-full transition-all duration-500 ${
                                  isCompleted ? 'bg-emerald-500' : isActive ? 'bg-gradient-to-r from-accent-teal to-surface-150' : 'bg-transparent'
                                }`}
                                style={{ width: isCompleted ? '100%' : '0%' }}
                              />
                            </div>
                          )}

                          <div className="flex flex-col items-center relative z-10 mx-auto group/node">
                            <div
                              className={`h-5 w-5 rounded-full border transition-all flex items-center justify-center text-[8px] font-bold select-none cursor-help ${dotBg}`}
                              title={`${milestone.label}: ${isActive ? 'Active' : isCompleted ? 'Completed' : 'Pending'}`}
                            >
                              {isCompleted ? '✓' : idx + 1}
                            </div>
                            <span
                              className={`text-[8px] font-bold uppercase tracking-wider mt-2 transition-all text-center max-w-[55px] ${
                                isActive ? 'text-accent-teal font-extrabold' : isCompleted ? 'text-surface-650 font-semibold' : 'text-surface-400'
                              }`}
                            >
                              {milestone.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Right Side: Price & Open Action Button */}
                  <div className="flex items-center justify-end pl-4 shrink-0 gap-3 border-t lg:border-t-0 border-surface-100 pt-3 lg:pt-0">
                    {isBreaching && (
                      <div className="flex items-center gap-1 text-red-600 font-bold text-[9px] uppercase tracking-wider animate-pulse mr-2 bg-red-50/70 px-2 py-1 rounded-lg border border-red-150">
                        <AlertTriangle size={10} />
                        <span>{breachMsg}</span>
                      </div>
                    )}
                    
                    <div className="text-right">
                      <span className="text-[8px] text-surface-400 font-bold uppercase block leading-none">RETAIL VALUE</span>
                      <span className="text-xs font-bold text-surface-900 block mt-0.5">NPR {card.price ? (card.price / 100000).toFixed(1) + ' L' : 'TBD'}</span>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="hover:border-accent-teal/50 hover:bg-accent-teal hover:text-white transition-all text-xs font-bold rounded-xl"
                      onClick={() => handleOpenDrawer(card)}
                    >
                      Inspect
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Adjust column grid to Cols-4 to perfectly occupy 100% width since we have 4 columns */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 overflow-x-auto pb-6">
          {COLUMNS.map((col) => {
            const columnCards = filteredCards.filter((card) => col.states.includes(card.state));

            return (
              <div
                key={col.id}
                className="bg-surface-50/60 backdrop-blur-md p-4 rounded-3xl border border-surface-200/60 min-w-[260px] flex flex-col h-[780px] shadow-sm"
              >
                {/* Column Header */}
                <div className={`border-t-4 ${col.colorClass} pt-3.5 mb-4`}>
                  <div className="flex justify-between items-center mb-1.5">
                    <h3 className="font-display font-bold text-surface-900 text-sm tracking-tight">{col.title}</h3>
                    <Badge variant="neutral" size="sm">{columnCards.length}</Badge>
                  </div>
                  <p className="text-[10px] text-surface-500 font-medium tracking-wide leading-tight">{col.description}</p>
                </div>

                {/* Column Cards Container */}
                <div className="flex-1 overflow-y-auto space-y-3.5 pr-1.5 scrollbar-thin">
                  {col.id === 'compliance' ? (
                    col.states.map((state) => {
                      const stateCards = columnCards.filter((c) => c.state === state);
                      const isCollapsed = collapsedStates[state];
                      const meta = STATE_METADATA[state];
                      
                      const toggleCollapse = () => {
                        setCollapsedStates((prev) => ({
                          ...prev,
                          [state]: !prev[state],
                        }));
                      };

                      return (
                        <div key={state} className="space-y-2 border-b border-surface-200/40 pb-2.5 last:border-b-0">
                          {/* Collapsible Header */}
                          <div 
                            onClick={toggleCollapse}
                            className="flex items-center justify-between p-2 rounded-xl bg-white/40 hover:bg-white/80 border border-surface-200/40 cursor-pointer transition-all select-none"
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-surface-400 shrink-0">
                                {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                              </span>
                              <span className="text-[10px] font-bold text-surface-800 uppercase tracking-wide truncate">
                                {meta?.label || state}
                              </span>
                            </div>
                            <Badge variant={meta?.color as any || 'neutral'} size="sm">
                              {stateCards.length}
                            </Badge>
                          </div>

                          {/* Expanded cards list */}
                          {!isCollapsed && (
                            <div className="space-y-3 pl-1">
                              {stateCards.map((card) => {
                                const progress = STATE_METADATA[card.state]?.progress || 0;
                                const meta = STATE_METADATA[card.state] || { label: card.state, color: 'neutral' };
                                
                                // SLA Breach detection
                                let isBreaching = false;
                                let breachMsg = '';
                                if (card.rawVehicle?.createdAt) {
                                  const days = Math.floor((Date.now() - new Date(card.rawVehicle.createdAt).getTime()) / (1000 * 60 * 60 * 24));
                                  if (card.state === 'IN_STOCK' && days > 60) {
                                    isBreaching = true;
                                    breachMsg = `s${days}d Aging Stock`;
                                  }
                                }

                                const leftBorderColor = isBreaching ? 'border-l-red-500' : 'border-l-amber-400';

                                return (
                                  <Card
                                    key={`${card.entityType}-${card.id}`}
                                    onClick={() => handleOpenDrawer(card)}
                                    className={`group border-l-[5px] ${leftBorderColor} border-t border-r border-b border-surface-200/80 cursor-pointer hover:border-accent-teal/50 hover:shadow-lg hover-lift transition-all duration-300 p-4 bg-white/95 relative overflow-hidden`}
                                    noPadding
                                  >
                                    {card.image && (
                                      <div className="relative h-28 w-full mb-3 rounded-2xl overflow-hidden bg-gradient-to-b from-surface-50 to-surface-100/50 border border-surface-200/50 flex items-center justify-center">
                                        <img
                                          src={card.image}
                                          alt={card.model}
                                          className="object-contain max-h-[85%] max-w-[85%] group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none" />
                                      </div>
                                    )}

                                    <div className="flex justify-between items-start gap-1 mb-2">
                                      <h4 className="font-bold text-xs text-surface-900 group-hover:text-deepal-600 transition-colors truncate max-w-[140px] leading-tight" title={card.model}>
                                        {card.model}
                                      </h4>
                                    </div>

                                    {/* Specs & VIN Details */}
                                    <div className="space-y-1">
                                      <p className="text-[9px] text-surface-500 font-semibold font-mono tracking-wider flex items-center gap-1">
                                        <span className="opacity-65">Chassis:</span>
                                        <span className="text-surface-700 bg-surface-100 px-1 py-0.5 rounded text-[8px] truncate max-w-[150px]">
                                          {card.vin || 'Awaiting Allocation'}
                                        </span>
                                      </p>
                                      {card.color && (
                                        <p className="text-[9px] text-surface-400 font-semibold flex items-center gap-1">
                                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-surface-300" style={{ backgroundColor: card.color.toLowerCase() }} />
                                          <span>{card.color}</span>
                                          {card.variant && <span className="text-surface-300">•</span>}
                                          {card.variant && <span className="truncate max-w-[90px]">{card.variant}</span>}
                                        </p>
                                      )}
                                    </div>

                                    {/* Contextual secondary info based on stage */}
                                    {(() => {
                                      const tags = [];
                                      if (card.piNo) tags.push({ icon: '📄', text: card.piNo, style: 'text-blue-600 bg-blue-50/70 border-blue-100' });
                                      if (card.lcNo) tags.push({ icon: '🏦', text: card.lcNo, style: 'text-indigo-600 bg-indigo-50/70 border-indigo-100' });
                                      if (card.rawVehicle?.grnNumber) tags.push({ icon: '📋', text: card.rawVehicle.grnNumber, style: 'text-amber-700 bg-amber-50/70 border-amber-100' });
                                      if (card.rawDeal?.registrationNo) tags.push({ icon: '🪪', text: card.rawDeal.registrationNo, style: 'text-emerald-700 bg-emerald-50/70 border-emerald-100' });
                                      const isInsNoMissing = !card.rawDeal?.insurancePolicyNo || card.rawDeal.insurancePolicyNo.startsWith('PENDING');
                                      const isPastStructuring = ['INSURANCE_ACTIVATION', 'BANK_ALLOTMENT', 'DOTM_REGISTRATION', 'INSURANCE_ENDORSEMENT', 'BANK_DISBURSEMENT', 'READY_FOR_DELIVERY', 'DELIVERED'].includes(card.state);
                                      if (isPastStructuring && isInsNoMissing) {
                                        tags.push({ icon: '⚠️', text: 'Policy Pending', style: 'text-amber-700 bg-amber-50 border-amber-250 font-bold animate-pulse' });
                                      } else if (card.rawDeal?.insurancePolicyNo && isPastStructuring) {
                                        tags.push({ icon: '🛡️', text: card.rawDeal.insurancePolicyNo, style: 'text-purple-700 bg-purple-50/70 border-purple-100' });
                                      }
                                      if (card.rawDeal?.disbursementAmount && card.state === 'BANK_DISBURSEMENT') {
                                        tags.push({ icon: '💰', text: `₹${(card.rawDeal.disbursementAmount / 100000).toFixed(1)}L`, style: 'text-teal-700 bg-teal-50/70 border-teal-100' });
                                      }
                                      
                                      return tags.length > 0 ? (
                                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                                          {tags.slice(0, 2).map((tag, i) => (
                                            <span key={i} className={`inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-md border ${tag.style} truncate max-w-full`}>
                                              <span>{tag.icon}</span>
                                              <span className="truncate">{tag.text}</span>
                                            </span>
                                          ))}
                                        </div>
                                      ) : null;
                                    })()}

                                    {/* Customer Information */}
                                    {card.customerName && (
                                      <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-deepal-600 bg-deepal-50/50 py-1.5 px-2.5 rounded-xl border border-deepal-100 max-w-fit shadow-2xs">
                                        <User size={10} className="text-deepal-500 shrink-0" />
                                        <span className="truncate max-w-[120px]">{card.customerName}</span>
                                      </div>
                                    )}

                                    {/* Footer details */}
                                    <div className="mt-4 pt-3 border-t border-surface-100 flex items-center justify-between">
                                      <div className="text-[10px] font-bold font-mono text-surface-900">
                                        NPR {card.price ? (card.price / 100000).toFixed(1) + ' L' : 'TBD'}
                                      </div>
                                      
                                      {isBreaching ? (
                                        <div className="flex items-center gap-1 text-red-600 font-bold text-[9px] uppercase tracking-wider animate-pulse">
                                          <AlertTriangle size={10} />
                                          <span>{breachMsg}</span>
                                        </div>
                                      ) : (
                                        <div className="w-16 bg-surface-100 h-1.5 rounded-full overflow-hidden" title={`${progress}% Stage Progress`}>
                                          <div className="bg-accent-teal h-full transition-all duration-500" style={{ width: `${progress}%` }} />
                                        </div>
                                      )}
                                    </div>
                                  </Card>
                                );
                              })}
                              {stateCards.length === 0 && (
                                <p className="text-[10px] text-surface-400 italic text-center py-2">No units in this state.</p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    columnCards.map((card) => {
                      const progress = STATE_METADATA[card.state]?.progress || 0;
                      const meta = STATE_METADATA[card.state] || { label: card.state, color: 'neutral' };

                      // Alert check (SLA monitoring)
                      let isBreaching = false;
                      let breachMsg = '';
                      if (card.rawVehicle?.createdAt) {
                        const days = Math.floor((Date.now() - new Date(card.rawVehicle.createdAt).getTime()) / (1000 * 60 * 60 * 24));
                        if (card.state === 'LC_OPENED' && days > 95) {
                          isBreaching = true;
                          breachMsg = `s${days}d Open LC`;
                        } else if (card.state === 'IN_STOCK' && days > 60) {
                          isBreaching = true;
                          breachMsg = `s${days}d Aging Stock`;
                        }
                      }

                      // Compute specific border color for stage accent strip
                      const leftBorderColor = isBreaching 
                        ? 'border-l-red-500' 
                        : col.id === 'sourcing' 
                          ? 'border-l-blue-400' 
                          : col.id === 'stock' 
                            ? 'border-l-emerald-400' 
                            : col.id === 'booking' 
                              ? 'border-l-pink-400' 
                              : 'border-l-amber-400';

                      return (
                        <Card
                          key={`${card.entityType}-${card.id}`}
                          onClick={() => handleOpenDrawer(card)}
                          className={`group border-l-[5px] ${leftBorderColor} border-t border-r border-b border-surface-200/80 cursor-pointer hover:border-accent-teal/50 hover:shadow-lg hover-lift transition-all duration-300 p-4 bg-white/95 relative overflow-hidden`}
                          noPadding
                        >
                          {/* Vehicle Image Preview Banner */}
                          {card.image && (
                            <div className="relative h-28 w-full mb-3 rounded-2xl overflow-hidden bg-gradient-to-b from-surface-50 to-surface-100/50 border border-surface-200/50 flex items-center justify-center">
                              <img
                                src={card.image}
                                alt={card.model}
                                className="object-contain max-h-[85%] max-w-[85%] group-hover:scale-105 transition-transform duration-500"
                              />
                              {/* Subtle dark overlay for status on image */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none" />
                            </div>
                          )}

                          <div className="flex justify-between items-start gap-1 mb-2">
                            <h4 className="font-bold text-xs text-surface-900 group-hover:text-deepal-600 transition-colors truncate max-w-[140px] leading-tight" title={card.model}>
                              {card.model}
                            </h4>
                            <Badge variant={meta.color as any} size="sm">{meta.label}</Badge>
                          </div>

                          {/* Specs & VIN Details */}
                          <div className="space-y-1">
                            <p className="text-[9px] text-surface-500 font-semibold font-mono tracking-wider flex items-center gap-1">
                              <span className="opacity-65">Chassis:</span>
                              <span className="text-surface-700 bg-surface-100 px-1 py-0.5 rounded text-[8px] truncate max-w-[150px]">
                                {card.vin || 'Awaiting Allocation'}
                              </span>
                            </p>
                            {card.color && (
                              <p className="text-[9px] text-surface-400 font-semibold flex items-center gap-1">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-surface-300" style={{ backgroundColor: card.color.toLowerCase() }} />
                                <span>{card.color}</span>
                                {card.variant && <span className="text-surface-300">•</span>}
                                {card.variant && <span className="truncate max-w-[90px]">{card.variant}</span>}
                              </p>
                            )}
                          </div>

                          {/* Contextual secondary info based on stage */}
                          {(() => {
                            const tags = [];
                            
                            if (card.piNo) tags.push({ icon: '📄', text: card.piNo, style: 'text-blue-600 bg-blue-50/70 border-blue-100' });
                            if (card.lcNo) tags.push({ icon: '🏦', text: card.lcNo, style: 'text-indigo-600 bg-indigo-50/70 border-indigo-100' });
                            if (card.rawVehicle?.grnNumber) tags.push({ icon: '📋', text: card.rawVehicle.grnNumber, style: 'text-amber-700 bg-amber-50/70 border-amber-100' });
                            if (card.rawDeal?.registrationNo) tags.push({ icon: '🪪', text: card.rawDeal.registrationNo, style: 'text-emerald-700 bg-emerald-50/70 border-emerald-100' });
                            const isInsNoMissing = !card.rawDeal?.insurancePolicyNo || card.rawDeal.insurancePolicyNo.startsWith('PENDING');
                            const isPastStructuring = ['INSURANCE_ACTIVATION', 'BANK_ALLOTMENT', 'DOTM_REGISTRATION', 'INSURANCE_ENDORSEMENT', 'BANK_DISBURSEMENT', 'READY_FOR_DELIVERY', 'DELIVERED'].includes(card.state);
                            if (isPastStructuring && isInsNoMissing) {
                              tags.push({ icon: '⚠️', text: 'Policy Pending', style: 'text-amber-700 bg-amber-50 border-amber-250 font-bold animate-pulse' });
                            } else if (card.rawDeal?.insurancePolicyNo && isPastStructuring) {
                              tags.push({ icon: '🛡️', text: card.rawDeal.insurancePolicyNo, style: 'text-purple-700 bg-purple-50/70 border-purple-100' });
                            }
                            if (card.rawDeal?.disbursementAmount && card.state === 'BANK_DISBURSEMENT') {
                              tags.push({ icon: '💰', text: `₹${(card.rawDeal.disbursementAmount / 100000).toFixed(1)}L`, style: 'text-teal-700 bg-teal-50/70 border-teal-100' });
                            }
                            
                            return tags.length > 0 ? (
                              <div className="mt-2.5 flex flex-wrap gap-1.5">
                                {tags.slice(0, 2).map((tag, i) => (
                                  <span key={i} className={`inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-md border ${tag.style} truncate max-w-full`}>
                                    <span>{tag.icon}</span>
                                    <span className="truncate">{tag.text}</span>
                                  </span>
                                ))}
                              </div>
                            ) : null;
                          })()}

                          {/* Customer Information */}
                          {card.customerName && (
                            <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-deepal-600 bg-deepal-50/50 py-1.5 px-2.5 rounded-xl border border-deepal-100 max-w-fit shadow-2xs">
                              <User size={10} className="text-deepal-500 shrink-0" />
                              <span className="truncate max-w-[120px]">{card.customerName}</span>
                            </div>
                          )}

                          {/* Footer details: price & progress */}
                          <div className="mt-4 pt-3 border-t border-surface-100 flex items-center justify-between">
                            <div className="text-[10px] font-bold font-mono text-surface-900">
                              NPR {card.price ? (card.price / 100000).toFixed(1) + ' L' : 'TBD'}
                            </div>
                            
                            {isBreaching ? (
                              <div className="flex items-center gap-1 text-red-600 font-bold text-[9px] uppercase tracking-wider animate-pulse">
                                <AlertTriangle size={10} />
                                <span>{breachMsg}</span>
                              </div>
                            ) : (
                              <div className="w-16 bg-surface-100 h-1.5 rounded-full overflow-hidden" title={`${progress}% Stage Progress`}>
                                <div className="bg-accent-teal h-full transition-all duration-500" style={{ width: `${progress}%` }} />
                              </div>
                            )}
                          </div>
                        </Card>
                      );
                    })
                  )}
                  {columnCards.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[10px] text-surface-400 border-2 border-dashed border-surface-200/50 rounded-3xl bg-surface-50/30">
                      <span className="text-base mb-1.5 opacity-60">🚙</span>
                      <p className="font-semibold tracking-wide">Phase Empty</p>
                      <p className="text-[9px] text-surface-400 mt-0.5">No vehicles in this phase.</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full-Screen Vehicle Detail Overlay */}
      {drawerOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-surface-50 via-white to-surface-100/80 animate-fade-in overflow-hidden">
          {/* Ambient visual background glow bubbles */}
          <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-accent-teal/10 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="absolute bottom-10 left-10 w-[500px] h-[500px] bg-deepal-400/80 bg-opacity-[0.03] rounded-full blur-3xl pointer-events-none -z-10" />

          {/* ─── Sticky Premium HUD Header Bar ─────────────────────────────────────────── */}
          <div className="shrink-0 border-b border-surface-200/60 bg-white/70 backdrop-blur-lg px-4 md:px-8 py-5">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-3 bg-white hover:bg-surface-100 border border-surface-200/80 text-surface-600 hover:text-surface-900 rounded-2xl transition-all shadow-2xs active:scale-95 focus-ring shrink-0"
                  title="Go Back"
                >
                  <X size={18} />
                </button>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] uppercase font-extrabold tracking-wider text-surface-400 bg-surface-100 border border-surface-200 px-2 py-0.5 rounded-md">
                      {selectedItem.entityType} Journey Profile
                    </span>
                    <span className="text-[9px] font-bold text-accent-teal bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md animate-pulse">
                      Live Trace
                    </span>
                  </div>
                  <h2 className="font-display font-bold text-xl md:text-2xl text-surface-900 truncate mt-1">
                    {selectedItem.model} <span className="text-surface-300 font-light">•</span> <span className="text-surface-600 font-semibold">{selectedItem.color || 'Unallocated Color'}</span>
                  </h2>
                </div>
              </div>

              {/* Status details bar */}
              <div className="flex flex-wrap items-center gap-4 md:gap-6 pl-14 md:pl-0">
                <div className="text-left">
                  <p className="text-[9px] text-surface-450 font-bold uppercase tracking-wider">Chassis / VIN</p>
                  <p className="text-xs font-bold font-mono text-surface-900 mt-0.5 bg-surface-100 border border-surface-200/50 px-2 py-1 rounded-lg">
                    {selectedItem.vin || 'Awaiting Allocation'}
                  </p>
                </div>
                <div className="text-left">
                  <p className="text-[9px] text-surface-450 font-bold uppercase tracking-wider">Workflow state</p>
                  <div className="mt-0.5">
                    <Badge variant={STATE_METADATA[selectedItem.state]?.color as any || 'neutral'}>
                      {STATE_METADATA[selectedItem.state]?.label || selectedItem.state}
                    </Badge>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-[9px] text-surface-450 font-bold uppercase tracking-wider">Retail Value</p>
                  <p className="text-sm font-extrabold font-mono text-deepal-600 mt-0.5">
                    NPR {selectedItem.price ? selectedItem.price.toLocaleString() : 'N/A'}
                  </p>
                </div>
                {selectedItem.customerName && (
                  <div className="text-left">
                    <p className="text-[9px] text-surface-450 font-bold uppercase tracking-wider">Customer contact</p>
                    <div className="flex items-center gap-1 mt-0.5 text-xs font-bold text-deepal-600 bg-deepal-50/70 border border-deepal-100/80 px-2.5 py-1 rounded-xl">
                      <User size={10} className="text-deepal-500" />
                      <span>{selectedItem.customerName}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ─── Mobile Tab Switcher (visible only on small screens) ──────── */}
          <div className="md:hidden shrink-0 border-b border-surface-200 bg-white/90 backdrop-blur-md px-4 py-2.5 flex gap-2">
            <button
              onClick={() => setDetailTab('actions')}
              className={`flex-1 py-3 rounded-2xl text-xs font-bold transition-all ${
                detailTab === 'actions'
                  ? 'bg-deepal-500 text-white shadow-md shadow-deepal-500/20'
                  : 'bg-surface-50 text-surface-600 hover:bg-surface-100 border border-surface-200/50'
              }`}
            >
              Actions & Documents
            </button>
            <button
              onClick={() => setDetailTab('timeline')}
              className={`flex-1 py-3 rounded-2xl text-xs font-bold transition-all ${
                detailTab === 'timeline'
                  ? 'bg-deepal-500 text-white shadow-md shadow-deepal-500/20'
                  : 'bg-surface-50 text-surface-600 hover:bg-surface-100 border border-surface-200/50'
              }`}
            >
              Timeline & Audit
            </button>
          </div>

          {/* ─── Scrollable Layout Body ─────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">

                {/* ═══ LEFT COLUMN: Actions & Documents (7 cols desktop) ═══ */}
                <div className={`md:col-span-7 space-y-6 ${detailTab === 'timeline' ? 'hidden md:block' : ''}`}>

                  {/* Insurance Policy Pending Alert */}
                  {selectedItem.entityType === 'SALE' &&
                    ['INSURANCE_ACTIVATION', 'BANK_ALLOTMENT', 'DOTM_REGISTRATION', 'INSURANCE_ENDORSEMENT', 'BANK_DISBURSEMENT', 'READY_FOR_DELIVERY', 'DELIVERED'].includes(selectedItem.state) &&
                    (!selectedItem.rawDeal?.insurancePolicyNo || selectedItem.rawDeal.insurancePolicyNo.startsWith('PENDING')) && (
                      <div className="bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-250/80 text-amber-900 px-5 py-4 rounded-3xl flex flex-col gap-2 shadow-xs">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
                          <span className="text-sm">⚠️</span>
                          <span>INSURANCE POLICY NUMBER PENDING</span>
                        </div>
                        <p className="text-[11px] text-amber-800 leading-relaxed font-semibold">
                          Insurance activation email has been flagged as sent, but the official policy reference has not been recorded yet. Please update the policy number below when received from the insurer.
                        </p>
                        <div className="flex gap-2 items-center mt-1">
                          <input
                            type="text"
                            placeholder="Enter official Policy Number..."
                            value={insuranceNo}
                            onChange={e => setInsuranceNo(e.target.value)}
                            className="bg-white border border-amber-300 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-surface-900 focus-ring flex-1"
                          />
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={async () => {
                              if (!insuranceNo) {
                                alert('Please enter a policy number first.');
                                return;
                              }
                              try {
                                await updateSaleMutation.mutateAsync({
                                  id: selectedItem.id,
                                  patch: { insurancePolicyNo: insuranceNo }
                                });
                                refetchAll();
                                alert('Insurance policy number updated successfully!');
                              } catch (err: any) {
                                alert('Error updating policy: ' + err.message);
                              }
                            }}
                          >
                            Save Policy No
                          </Button>
                        </div>
                      </div>
                    )}

                  {/* Executive Actions Container */}
                  <div>
                    <h3 className="text-xs font-bold text-surface-700 uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-deepal-600" /> Executive Actions
                    </h3>

                    {/* Styled as a luxury glass card */}
                    <Card className="bg-white/80 backdrop-blur-md border border-surface-200/80 shadow-lg shadow-surface-100/30 rounded-3xl p-6 space-y-5">
                      <div className="flex justify-between items-center border-b border-surface-150 pb-4 mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-accent-teal shadow-glow-teal animate-pulse" />
                          <span className="text-xs font-bold text-surface-950 uppercase tracking-wider">
                            {STAGE_ACTION_TITLES[selectedItem.state as VehicleState] || 'Process Action'}
                          </span>
                        </div>
                        <Badge variant="teal" size="sm">Active Action Form</Badge>
                      </div>

                      {/* ── State-specific Action Forms ── */}

                      {selectedItem.state === 'PO_ISSUED' && (
                        <div className="space-y-4">
                          <p className="text-xs text-surface-600 leading-relaxed font-medium">
                            A Letter of Credit (LC) must be opened or linked to authorize factory supply of this unit.
                          </p>
                          {selectedItem.lcNo ? (
                            <div className="p-4 bg-emerald-50/70 text-emerald-800 rounded-2xl text-xs border border-emerald-100 flex flex-col gap-1.5 font-semibold">
                              <div><span className="opacity-75">Linked LC Reference:</span> {selectedItem.lcNo}</div>
                              <div className="text-[10px] text-emerald-600">Click the link button to confirm LC activation.</div>
                            </div>
                          ) : (
                            <div className="p-4 bg-amber-50/75 text-amber-800 rounded-2xl text-xs border border-amber-100 font-semibold">
                              No LC logged for this unit's Proforma Invoice yet. Open an LC on the Operations Hub first to proceed.
                            </div>
                          )}
                          <Button
                            disabled={!selectedItem.lcNo}
                            onClick={handleLinkLC}
                            variant="gradient"
                            className="w-full py-3"
                            icon={ShieldCheck}
                          >
                            Confirm & Link LC
                          </Button>
                        </div>
                      )}

                      {selectedItem.state === 'LC_OPENED' && (
                        <div className="space-y-4">
                          <p className="text-xs text-surface-600 font-medium">
                            Confirm vehicle shipping departure and set the estimated delivery destination arrival date.
                          </p>
                          <Input
                            label="Expected Arrival Date *"
                            type="date"
                            required
                            value={transitDate}
                            onChange={e => setTransitDate(e.target.value)}
                          />
                          <Button
                            onClick={handleMarkShipped}
                            variant="gradient"
                            className="w-full py-3"
                            icon={Truck}
                          >
                            Mark Vehicle In-Transit
                          </Button>
                        </div>
                      )}

                      {selectedItem.state === 'IN_TRANSIT' && (
                        <form onSubmit={handleGRNSubmit} className="space-y-4">
                          <p className="text-xs text-surface-600 font-medium">
                            Log physical arrival at port/showroom yard by filing the Goods Receipt Note (GRN) and official vehicle identification tags.
                          </p>
                          <div className="grid grid-cols-1 gap-4">
                            <Input
                              label="GRN Reference Number *"
                              required
                              value={grnNo}
                              onChange={e => setGrnNo(e.target.value)}
                            />
                            <div className="grid grid-cols-2 gap-4">
                              <Input
                                label="Engine Number / Motor Ref *"
                                required
                                placeholder="e.g. MOT-23098-DEEP"
                                value={engineNo}
                                onChange={e => setEngineNo(e.target.value)}
                              />
                              <Input
                                label="Chassis Number / VIN *"
                                required
                                placeholder="e.g. LSDE39209HN38"
                                value={chassisNo}
                                onChange={e => setChassisNo(e.target.value)}
                              />
                            </div>
                          </div>
                          <Button
                            type="submit"
                            variant="gradient"
                            className="w-full py-3 mt-2"
                            icon={ClipboardList}
                          >
                            Submit Yard Reception (GRN)
                          </Button>
                        </form>
                      )}

                      {selectedItem.state === 'RECEIVED' && (
                        <div className="space-y-4">
                          <p className="text-xs text-surface-600 leading-relaxed font-medium">
                            Verify vehicle matches PI compliance specs. Mark stock approved to move to showroom inventory, or draft logistics updates.
                          </p>
                          <div className="flex gap-3">
                            <Button
                              variant="outline"
                              className="flex-1 py-3"
                              icon={Send}
                              onClick={() => triggerEmailNotify(
                                `GRN Receipt: Chassis ${selectedItem.vin}`,
                                `Hi Logistics Team,\n\nWe have received the unit. GRN Reference: ${selectedItem.rawVehicle?.grnNumber}.\n\nRegards,\nApollo Showroom`
                              )}
                            >
                              Notify MAW Logistics
                            </Button>
                            <Button
                              variant="gradient"
                              className="flex-1 py-3"
                              icon={CheckCircle2}
                              onClick={handleApproveStock}
                            >
                              Approve Stock
                            </Button>
                          </div>
                        </div>
                      )}

                      {selectedItem.state === 'IN_STOCK' && (
                        <div className="space-y-4">
                          <p className="text-xs text-surface-600 leading-relaxed font-medium">
                            This vehicle is available in stock. Allocate it to a customer's pending booking to start the sales lifecycle.
                          </p>
                          <div>
                            <label className="text-xs font-semibold text-surface-500 tracking-wide mb-1.5 block">
                              Select Pending Customer Booking *
                            </label>
                            <select
                              value={allocSaleId}
                              onChange={e => setAllocSaleId(e.target.value)}
                              className="w-full bg-white border border-surface-200 rounded-xl px-4 py-3 text-sm focus-ring text-surface-900 cursor-pointer"
                            >
                              <option value="">Select Booking...</option>
                              {deals.filter(d => d.currentState === 'BOOKED' && !d.vehicleId).map(d => (
                                <option key={d.id} value={d.id}>
                                  {d.customer?.name} ({d.vehicleModel}) - Booking Date: {new Date(d.bookingDate).toLocaleDateString()}
                                </option>
                              ))}
                            </select>
                          </div>
                          <Button
                            disabled={!allocSaleId}
                            onClick={handleAllocateToBooking}
                            variant="gradient"
                            className="w-full py-3"
                            icon={User}
                          >
                            Allocate Stock to Booking
                          </Button>
                        </div>
                      )}

                      {selectedItem.state === 'BOOKED' && (
                        <div className="space-y-4">
                          <p className="text-xs text-surface-600 leading-relaxed font-medium">
                            This customer booking lacks a physical vehicle assignment. Select an available showroom unit of matching model to allocate.
                          </p>
                          <div>
                            <label className="text-xs font-semibold text-surface-500 tracking-wide mb-1.5 block">
                              Select Available Stock Vehicle *
                            </label>
                            <select
                              value={allocVehicleId}
                              onChange={e => setAllocVehicleId(e.target.value)}
                              className="w-full bg-white border border-surface-200 rounded-xl px-4 py-3 text-sm focus-ring text-surface-900 cursor-pointer"
                            >
                              <option value="">Select Vehicle...</option>
                              {vehicles.filter(v => v.vehicleState === 'IN_STOCK' && v.model === selectedItem.model).map(v => (
                                <option key={v.id} value={v.id}>
                                  VIN: {v.vin} - Color: {v.color} (Aging: {v.daysInStock}d)
                                </option>
                              ))}
                            </select>
                          </div>
                          <Button
                            disabled={!allocVehicleId}
                            onClick={handleAllocateVehicleToBooking}
                            variant="gradient"
                            className="w-full py-3"
                            icon={User}
                          >
                            Allocate Stock to Booking
                          </Button>
                        </div>
                      )}

                      {selectedItem.state === 'ALLOCATED' && (
                        <form onSubmit={handleStructurePaymentSubmit} className="space-y-4">
                          <p className="text-xs text-surface-600 leading-relaxed font-medium">
                            Define the payment framework. If bank financing is selected, input the bank details and approved loan limits to authorize allotment letter creation.
                          </p>
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-surface-550 tracking-wide ml-1">Payment Method</label>
                            <div className="grid grid-cols-2 gap-3">
                              <button
                                type="button"
                                onClick={() => setPaymentType('FULL_PAYMENT')}
                                className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all active:scale-[0.98] ${
                                  paymentType === 'FULL_PAYMENT' 
                                    ? 'bg-deepal-500 text-white border-deepal-500 shadow-md shadow-deepal-500/10' 
                                    : 'bg-white text-surface-700 hover:bg-surface-50 border-surface-200'
                                }`}
                              >
                                Cash / Outright
                              </button>
                              <button
                                type="button"
                                onClick={() => setPaymentType('FINANCED')}
                                className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all active:scale-[0.98] ${
                                  paymentType === 'FINANCED' 
                                    ? 'bg-deepal-500 text-white border-deepal-500 shadow-md shadow-deepal-500/10' 
                                    : 'bg-white text-surface-700 hover:bg-surface-50 border-surface-200'
                                }`}
                              >
                                Bank Financed
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <Input
                              label="Finalized Sale Price *"
                              type="number"
                              required
                              placeholder="Retail Value in NPR"
                              value={salePrice}
                              onChange={e => setSalePrice(e.target.value)}
                            />
                            <Input
                              label="Booking Amount Received *"
                              type="number"
                              placeholder="Initial Deposit"
                              value={bookingAmount}
                              onChange={e => setBookingAmount(e.target.value)}
                            />
                          </div>

                          {paymentType === 'FINANCED' && (
                            <div className="space-y-4 border-t border-surface-200 pt-4 mt-3">
                              <div className="grid grid-cols-2 gap-4">
                                <Input
                                  label="Financing Bank *"
                                  placeholder="e.g. Nabil Bank"
                                  required
                                  value={bankName}
                                  onChange={e => setBankName(e.target.value)}
                                />
                                <Input
                                  label="Bank Branch"
                                  placeholder="e.g. Lalitpur"
                                  value={bankBranch}
                                  onChange={e => setBankBranch(e.target.value)}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <Input
                                  label="Bank RM Name"
                                  placeholder="e.g. Kumar Shrestha"
                                  value={rmName}
                                  onChange={e => setRmName(e.target.value)}
                                />
                                <Input
                                  label="Bank RM Phone"
                                  placeholder="e.g. 980..."
                                  value={rmPhone}
                                  onChange={e => setRmPhone(e.target.value)}
                                />
                              </div>
                              <Input
                                label="Approved Loan Limit (LPO Amount) *"
                                type="number"
                                required
                                placeholder="Approved Loan Limit"
                                value={approvedLoan}
                                onChange={e => setApprovedLoan(e.target.value)}
                              />

                              {/* Delivery Order Upload */}
                              <div>
                                <label className="text-xs font-semibold text-surface-500 tracking-wide mb-2 block">
                                  Delivery Order (DO) from Bank *
                                </label>
                                <label
                                  htmlFor="do-file-upload"
                                  className={`flex flex-col items-center justify-center gap-2.5 w-full border-2 border-dashed rounded-2xl px-4 py-6 cursor-pointer transition-all ${
                                    deliveryOrderFile
                                      ? 'border-emerald-400 bg-emerald-50/70 shadow-sm'
                                      : 'border-surface-300 bg-surface-50 hover:border-accent-teal hover:bg-teal-50/20'
                                  }`}
                                >
                                  {deliveryOrderFile ? (
                                    <>
                                      <div className="flex items-center gap-2.5 text-emerald-800">
                                        <span className="text-xl">
                                          {deliveryOrderFile.type === 'application/pdf' ? '📄' : '🖼️'}
                                        </span>
                                        <div>
                                          <p className="text-xs font-bold truncate max-w-[220px]">{deliveryOrderFile.name}</p>
                                          <p className="text-[10px] text-emerald-650 font-semibold">
                                            {(deliveryOrderFile.size / 1024).toFixed(1)} KB — Click to change
                                          </p>
                                        </div>
                                      </div>
                                      {deliveryOrderFile.type.startsWith('image/') && (
                                        <img
                                          src={URL.createObjectURL(deliveryOrderFile)}
                                          alt="DO Preview"
                                          className="mt-1.5 max-h-36 object-contain rounded-xl border border-emerald-200 shadow-2xs"
                                        />
                                      )}
                                    </>
                                  ) : (
                                    <>
                                      <span className="text-3xl filter drop-shadow-2xs">📂</span>
                                      <div className="text-center">
                                        <p className="text-xs font-bold text-surface-700">Upload Delivery Order</p>
                                        <p className="text-[10px] text-surface-450 font-semibold mt-0.5">PDF, JPG, PNG under 10MB</p>
                                      </div>
                                    </>
                                  )}
                                  <input
                                    id="do-file-upload"
                                    type="file"
                                    accept="application/pdf,image/jpeg,image/jpg,image/png"
                                    className="hidden"
                                    onChange={e => {
                                      const f = e.target.files?.[0];
                                      if (f) {
                                        if (f.size > 10 * 1024 * 1024) {
                                          alert('File too large. Please upload a file under 10MB.');
                                          return;
                                        }
                                        setDeliveryOrderFile(f);
                                      }
                                    }}
                                  />
                                </label>
                                {deliveryOrderUrl && (
                                  <p className="text-[10px] text-emerald-600 font-bold mt-1.5 flex items-center gap-1">
                                    <span>✅ Already uploaded</span>
                                    <span className="text-surface-300">•</span>
                                    <a href={deliveryOrderUrl} target="_blank" rel="noreferrer" className="underline hover:text-emerald-700 transition-colors">View Document ↗</a>
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          <Button
                            type="submit"
                            variant="gradient"
                            className="w-full py-3.5 mt-2"
                            icon={DollarSign}
                          >
                            Submit Structured Payment Scheme
                          </Button>
                        </form>
                      )}

                      {selectedItem.state === 'PAYMENT_STRUCTURED' && (
                        <div className="space-y-4">
                          <p className="text-xs text-surface-600 leading-relaxed font-medium">
                            Down payment deposit and Bank Delivery Order (DO) form verified. Perform Pre-Delivery Inspection (PDI) and mark unit prepped for client handover.
                          </p>
                          <Button
                            onClick={handleReadyForDelivery}
                            variant="gradient"
                            className="w-full py-3.5"
                            icon={CheckCircle2}
                          >
                            PDI Verified & Mark Ready for Delivery
                          </Button>
                        </div>
                      )}

                      {selectedItem.state === 'BANK_ALLOTMENT' && (
                        <div className="space-y-4">
                          <p className="text-xs text-surface-600 leading-relaxed font-medium">
                            Bank allotment & DO verified. Proceed with Pre-Delivery Inspection (PDI).
                          </p>
                          <Button
                            onClick={handleReadyForDelivery}
                            variant="gradient"
                            className="w-full py-3.5"
                            icon={CheckCircle2}
                          >
                            PDI Verified & Mark Ready for Delivery
                          </Button>
                        </div>
                      )}

                      {selectedItem.state === 'READY_FOR_DELIVERY' && (
                        <div className="space-y-4">
                          <p className="text-xs text-surface-600 leading-relaxed font-medium">
                            Vehicle prepped and parked in handover bay. Confirm signed handover forms and release keys to hand over the vehicle to the customer.
                          </p>
                          <div className="flex gap-3">
                            <Button
                              variant="outline"
                              className="flex-1 py-3"
                              icon={Printer}
                              onClick={() => window.open('/gate-pass')}
                            >
                              Print Gate Pass
                            </Button>
                            <Button
                              variant="gradient"
                              className="flex-1 py-3"
                              icon={CheckCircle2}
                              onClick={handleCompleteDelivery}
                            >
                              Issue Keys (Deliver Vehicle)
                            </Button>
                          </div>
                        </div>
                      )}

                      {selectedItem.state === 'DELIVERED' && (
                        <div className="space-y-4">
                          <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl text-xs text-emerald-800 font-semibold shadow-2xs">
                            <div className="flex items-center gap-1.5 font-bold">
                              <CheckCircle2 size={16} />
                              <span>Vehicle Delivered to Customer</span>
                            </div>
                            <p className="mt-1 text-[11px] text-emerald-650 font-medium">
                              Keys and vehicle handed over to customer. Proceed with post-delivery motor insurance activation and DoTM registration.
                            </p>
                          </div>

                          <div className="space-y-3 pt-2">
                            <p className="text-xs font-bold text-surface-800">Post-Delivery Compliance: Activate Insurance</p>
                            <Input
                              label="Insurance Policy Number *"
                              placeholder={willUpdateInsuranceLater ? "Pending (will update later)" : "e.g. NIC-GI-2026-904"}
                              disabled={willUpdateInsuranceLater}
                              value={insuranceNo}
                              onChange={e => setInsuranceNo(e.target.value)}
                            />
                            <label className="flex items-center gap-2.5 bg-white border border-surface-200 rounded-xl px-4 py-3.5 cursor-pointer hover:bg-surface-50 transition-all select-none">
                              <input
                                type="checkbox"
                                className="rounded border-surface-300 text-accent-teal focus:ring-accent-teal h-4.5 w-4.5 cursor-pointer"
                                checked={willUpdateInsuranceLater}
                                onChange={e => {
                                  setWillUpdateInsuranceLater(e.target.checked);
                                  if (e.target.checked) {
                                    setInsuranceNo('');
                                  }
                                }}
                              />
                              <div className="text-left">
                                <p className="text-xs font-bold text-surface-800">Sent Insurance Activation Email</p>
                                <p className="text-[10px] text-surface-450 font-semibold mt-0.5 leading-none">Check this if policy number is pending and will be updated later.</p>
                              </div>
                            </label>
                            <Button
                              onClick={handleInsuranceActivate}
                              variant="gradient"
                              className="w-full py-3.5"
                              icon={ShieldCheck}
                            >
                              Log & Activate Insurance (Post-Delivery)
                            </Button>
                          </div>
                        </div>
                      )}

                      {selectedItem.state === 'INSURANCE_ACTIVATION' && (
                        <div className="space-y-4">
                          <p className="text-xs text-surface-600 leading-relaxed font-medium">
                            Insurance policy logged. Provide the official DoTM plate number / Bluebook registration details.
                          </p>
                          <Input
                            label="DoTM Registration Plate Number *"
                            placeholder="e.g. BA 2 CHA 9081"
                            value={registrationNo}
                            onChange={e => setRegistrationNo(e.target.value)}
                          />
                          <Button
                            disabled={!registrationNo}
                            onClick={handleRegisterDoTM}
                            variant="gradient"
                            className="w-full py-3.5"
                            icon={CheckCircle2}
                          >
                            Submit DoTM Registration
                          </Button>
                        </div>
                      )}

                      {selectedItem.state === 'DOTM_REGISTRATION' && (
                        <div className="space-y-4">
                          {selectedItem.paymentType === 'FINANCED' ? (
                            <>
                              <p className="text-xs text-surface-600 leading-relaxed font-medium">
                                DoTM registration complete. Endorse the insurance policy to {selectedItem.bankName} (as hypothecator) prior to bank payout disbursement.
                              </p>
                              <Button
                                onClick={handleEndorseInsurance}
                                variant="gradient"
                                className="w-full py-3.5"
                                icon={ShieldCheck}
                              >
                                Endorse Insurance to Bank
                              </Button>
                            </>
                          ) : (
                            <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl text-xs text-emerald-800 font-semibold">
                              <div className="flex items-center gap-1.5 font-bold">
                                <CheckCircle2 size={16} />
                                <span>Cash Deal Settlement Complete</span>
                              </div>
                              <p className="mt-1 font-medium text-emerald-650">
                                This vehicle was paid in cash, delivered, and registered at DoTM. All compliance complete.
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {selectedItem.state === 'INSURANCE_ENDORSEMENT' && (
                        <div className="space-y-4">
                          <p className="text-xs text-surface-600 font-medium">
                            Insurance endorsed to bank. Record the payment disbursement released by {selectedItem.bankName} to complete financial settlement.
                          </p>
                          <Input
                            label="Bank Disbursement Received Amount *"
                            type="number"
                            placeholder={`Max approved: ₹${selectedItem.rawDeal?.approvedLoan?.toLocaleString()}`}
                            value={disbursementAmt}
                            onChange={e => setDisbursementAmt(e.target.value)}
                          />
                          <Button
                            disabled={!disbursementAmt}
                            onClick={handleDisbursementSubmit}
                            variant="gradient"
                            className="w-full py-3.5"
                            icon={DollarSign}
                          >
                            Process Disbursement Payout
                          </Button>
                        </div>
                      )}

                      {selectedItem.state === 'BANK_DISBURSEMENT' && (
                        <div className="space-y-3.5 p-5 bg-emerald-50/70 border border-emerald-150 rounded-2xl text-xs text-emerald-900 font-semibold shadow-2xs">
                          <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                            <CheckCircle2 size={18} />
                            <span>Vehicle Delivered & Financials Settled</span>
                          </div>
                          <p className="leading-relaxed text-emerald-750 font-semibold">
                            This vehicle has been delivered to the customer, registered with DoTM, and the bank loan disbursement has been fully processed. Journey complete!
                          </p>
                        </div>
                      )}

                      {/* Operational Notes field (Global for any transition) */}
                      {selectedItem.state !== 'DELIVERED' && (
                        <div className="border-t border-surface-200/80 pt-4 mt-3">
                          <label className="text-[9px] font-extrabold text-surface-500 uppercase tracking-wider mb-1.5 block">
                            Transition Activity Log Notes (Optional)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Documents scanned, client called, bank verified..."
                            value={actionNotes}
                            onChange={e => setActionNotes(e.target.value)}
                            className="w-full bg-white border border-surface-200 rounded-xl px-4.5 py-3 text-xs text-surface-800 focus-ring"
                          />
                        </div>
                      )}
                    </Card>
                  </div>

                  {/* Document Center */}
                  <DocumentsVault
                    selectedItem={selectedItem}
                    pi={selectedItem.rawVehicle?.piId ? pis.find((p: any) => p.id === selectedItem.rawVehicle?.piId) : null}
                  />
                </div>

                {/* ═══ RIGHT COLUMN: Timeline & Audit (5 cols desktop) ═══ */}
                <div className={`md:col-span-5 space-y-6 ${detailTab === 'actions' ? 'hidden md:block' : ''}`}>

                  {/* Stage Evidence Log Card */}
                  <div className="bg-white/70 backdrop-blur-md border border-surface-200/80 rounded-3xl p-5 md:p-6 shadow-lg shadow-surface-100/30">
                    <h4 className="text-xs font-bold text-surface-700 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                      <Compass size={14} className="text-accent-teal" /> Stage Evidence Log
                    </h4>

                    {/* Timeline line and container */}
                    <div className="relative border-l-[3px] border-surface-150/70 pl-5 ml-2.5 space-y-4 py-2">
                      {(() => {
                        const vehicle = selectedItem.rawVehicle;
                        const deal = selectedItem.rawDeal;
                        const pi = vehicle?.piId ? pis.find(p => p.id === vehicle.piId) : null;
                        const currentProgress = STATE_METADATA[selectedItem.state]?.progress || 0;

                        const getLogFor = (toState: string) => transitionLogs.find((l: any) => l.toState === toState);
                        const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleDateString('en-NP', { day: 'numeric', month: 'short', year: 'numeric' }) : null;
                        const fmtCurr = (n?: number | null) => n ? `₹${n.toLocaleString()}` : null;

                        const stages = [
                          {
                            key: 'PO_ISSUED',
                            label: 'PO Issued',
                            details: [
                              pi && { icon: '📄', label: 'PI Number', value: pi.piNumber },
                              pi && { icon: '🏭', label: 'Supplier', value: pi.supplier },
                              pi && { icon: '📅', label: 'Issue Date', value: fmtDate(pi.issueDate) },
                              pi && { icon: '💰', label: 'PI Amount', value: fmtCurr(pi.totalAmount) },
                              pi && { icon: '📦', label: 'Units Ordered', value: `${pi.units ?? 1} unit${(pi.units ?? 1) !== 1 ? 's' : ''}` },
                            ].filter(Boolean)
                          },
                          {
                            key: 'LC_OPENED',
                            label: 'LC Opened',
                            details: [
                              pi?.lc && { icon: '🏦', label: 'LC Reference', value: pi.lc.lcNumber },
                              pi?.lc && { icon: '🏛️', label: 'Bank', value: pi.lc.bankName + (pi.lc.bankBranch ? ` — ${pi.lc.bankBranch}` : '') },
                              pi?.lc && { icon: '📅', label: 'Opening Date', value: fmtDate(pi.lc.openingDate) },
                              pi?.lc && { icon: '💰', label: 'LC Amount', value: fmtCurr(pi.lc.amount) },
                              pi?.lc?.targetCycleDays && { icon: '⏱', label: 'Target Cycle', value: `${pi.lc.targetCycleDays} days` },
                            ].filter(Boolean)
                          },
                          {
                            key: 'IN_TRANSIT',
                            label: 'In Transit',
                            details: [
                              vehicle?.expectedDeliveryDate && { icon: '🚢', label: 'Expected Arrival', value: fmtDate(vehicle.expectedDeliveryDate) },
                              { icon: '🗓', label: 'Dispatched', value: fmtDate(getLogFor('IN_TRANSIT')?.createdAt) },
                            ].filter(d => d && (d as any).value)
                          },
                          {
                            key: 'RECEIVED',
                            label: 'Received (GRN)',
                            details: [
                              vehicle?.grnNumber && { icon: '📋', label: 'GRN Number', value: vehicle.grnNumber },
                              vehicle?.motorNo && { icon: '⚙️', label: 'Engine / Motor No', value: vehicle.motorNo },
                              (vehicle?.chassisNo || vehicle?.vin) && { icon: '🔩', label: 'Chassis / VIN', value: vehicle.chassisNo || vehicle.vin },
                              { icon: '📅', label: 'Received Date', value: fmtDate(getLogFor('RECEIVED')?.createdAt) },
                            ].filter(d => d && (d as any).value)
                          },
                          {
                            key: 'IN_STOCK',
                            label: 'In Stock',
                            details: [
                              vehicle?.color && { icon: '🎨', label: 'Color', value: vehicle.color },
                              vehicle?.variant && { icon: '🚗', label: 'Variant', value: vehicle.variant },
                              { icon: '📅', label: 'Stocked Date', value: fmtDate(getLogFor('IN_STOCK')?.createdAt) },
                              vehicle?.daysInStock !== undefined && { icon: '⏳', label: 'Days in Stock', value: `${vehicle.daysInStock}d` },
                            ].filter(d => d && (d as any).value)
                          },
                          {
                            key: 'BOOKED',
                            label: 'Booked',
                            details: [
                              deal?.customer?.name && { icon: '👤', label: 'Customer', value: deal.customer.name },
                              deal?.customer?.phone && { icon: '📞', label: 'Contact', value: deal.customer.phone },
                              deal?.bookingDate && { icon: '📅', label: 'Booking Date', value: fmtDate(deal.bookingDate) },
                              deal?.bookingAmount && { icon: '💵', label: 'Booking Deposit', value: fmtCurr(deal.bookingAmount) },
                            ].filter(d => d && (d as any).value)
                          },
                          {
                            key: 'ALLOCATED',
                            label: 'Allocated',
                            details: [
                              (vehicle?.vin || selectedItem.vin) && { icon: '🔩', label: 'Allocated VIN', value: vehicle?.vin || selectedItem.vin },
                              deal?.allocationDate && { icon: '📅', label: 'Allocation Date', value: fmtDate(deal.allocationDate) },
                            ].filter(d => d && (d as any).value)
                          },
                          {
                            key: 'PAYMENT_STRUCTURED',
                            label: 'Payment Structured (DO & Deposit)',
                            details: [
                              deal?.paymentType && { icon: '💳', label: 'Payment Type', value: deal.paymentType === 'FINANCED' ? 'Bank Financed' : 'Cash / Outright' },
                              deal?.salePrice && { icon: '💰', label: 'Final Sale Price', value: fmtCurr(deal.salePrice) },
                              deal?.paymentType === 'FINANCED' && deal?.bankName && { icon: '🏦', label: 'Financing Bank', value: deal.bankName + (deal.bankBranch ? ` — ${deal.bankBranch}` : '') },
                              deal?.paymentType === 'FINANCED' && deal?.rmName && { icon: '👨‍💼', label: 'Bank RM', value: `${deal.rmName}${deal.rmPhone ? ` (${deal.rmPhone})` : ''}` },
                              deal?.paymentType === 'FINANCED' && deal?.approvedLoan && { icon: '✅', label: 'Approved Loan', value: fmtCurr(deal.approvedLoan) },
                              deal?.paymentType === 'FINANCED' && deal?.deliveryOrderUrl && { icon: '📑', label: 'Delivery Order', value: '✓ Uploaded' },
                            ].filter(d => d && (d as any).value)
                          },
                          {
                            key: 'READY_FOR_DELIVERY',
                            label: 'Ready for Delivery',
                            details: [
                              deal?.readyForDeliveryAt && { icon: '📅', label: 'PDI Verified', value: fmtDate(deal.readyForDeliveryAt) },
                            ].filter(d => d && (d as any).value)
                          },
                          {
                            key: 'DELIVERED',
                            label: 'Vehicle Delivered',
                            details: [
                              deal?.deliveredAt && { icon: '🎉', label: 'Handover Date', value: fmtDate(deal.deliveredAt) },
                              deal?.customer?.name && { icon: '👤', label: 'Delivered To', value: deal.customer.name },
                            ].filter(d => d && (d as any).value)
                          },
                          {
                            key: 'INSURANCE_ACTIVATION',
                            label: 'Insurance Activated',
                            details: [
                              deal?.insurancePolicyNo && { icon: '🛡️', label: 'Policy Number', value: deal.insurancePolicyNo },
                              deal?.insuranceActivatedAt && { icon: '📅', label: 'Activated Date', value: fmtDate(deal.insuranceActivatedAt) },
                            ].filter(d => d && (d as any).value)
                          },
                          {
                            key: 'BANK_ALLOTMENT',
                            label: 'Bank Allotment',
                            details: [
                              deal?.bankName && { icon: '🏦', label: 'Allotted To', value: deal.bankName },
                              { icon: '📅', label: 'Allotment Date', value: fmtDate(getLogFor('BANK_ALLOTMENT')?.createdAt) },
                            ].filter(d => d && (d as any).value)
                          },
                          {
                            key: 'DOTM_REGISTRATION',
                            label: 'DoTM Registered',
                            details: [
                              (deal?.registrationNo || vehicle?.registrationNo) && { icon: '🪪', label: 'Plate Number', value: deal?.registrationNo || vehicle?.registrationNo },
                              deal?.registeredAt && { icon: '📅', label: 'Registered Date', value: fmtDate(deal.registeredAt) },
                              deal?.registeredUnder && { icon: '📝', label: 'Registered Under', value: deal.registeredUnder },
                              deal?.dotmRep && { icon: '👤', label: 'DoTM Rep', value: deal.dotmRep },
                            ].filter(d => d && (d as any).value)
                          },
                          {
                            key: 'INSURANCE_ENDORSEMENT',
                            label: 'Insurance Endorsed',
                            details: [
                              deal?.insurancePolicyNo && { icon: '🛡️', label: 'Policy', value: deal.insurancePolicyNo },
                              deal?.bankName && { icon: '🏦', label: 'Endorsed To', value: deal.bankName },
                              deal?.insuranceEndorsedAt && { icon: '📅', label: 'Endorsed Date', value: fmtDate(deal.insuranceEndorsedAt) },
                            ].filter(d => d && (d as any).value)
                          },
                          {
                            key: 'BANK_DISBURSEMENT',
                            label: 'Bank Disbursed',
                            details: [
                              deal?.disbursementAmount && { icon: '💰', label: 'Disbursed Amount', value: fmtCurr(deal.disbursementAmount) },
                              deal?.disbursementReceivedAt && { icon: '📅', label: 'Received Date', value: fmtDate(deal.disbursementReceivedAt) },
                            ].filter(d => d && (d as any).value)
                          },
                        ];

                        return stages.map(stage => {
                          const stateMeta = STATE_METADATA[stage.key as VehicleState];
                          const isActive = selectedItem.state === stage.key;
                          const isCompleted = stateMeta && stateMeta.progress < currentProgress;
                          const log = getLogFor(stage.key);

                          return (
                            <div key={stage.key} className="relative group pl-1.5 pb-1">
                              {/* Glowing Dot on timeline */}
                              <div className={`absolute -left-[27.5px] top-2 h-4 w-4 rounded-full border-2 transition-all flex items-center justify-center ${
                                isActive 
                                  ? 'bg-accent-teal border-accent-teal ring-4 ring-accent-teal/20 scale-110' 
                                  : isCompleted 
                                    ? 'bg-emerald-500 border-emerald-500 shadow-sm' 
                                    : 'bg-white border-surface-300'
                              }`}>
                                {isCompleted && (
                                  <span className="text-[7.5px] text-white font-extrabold">✓</span>
                                )}
                                {isActive && (
                                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                                )}
                              </div>

                              {/* Stage layout details */}
                              <div className="space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <p className={`text-xs font-bold ${
                                    isActive ? 'text-accent-teal' :
                                    isCompleted ? 'text-surface-900 font-semibold' : 'text-surface-400 font-medium'
                                  }`}>
                                    {stage.label}
                                  </p>
                                  {isActive && (
                                    <span className="text-[8px] font-extrabold uppercase tracking-wider text-accent-teal bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md animate-pulse">
                                      Active State
                                    </span>
                                  )}
                                  {isCompleted && log?.createdAt && (
                                    <span className="text-[9px] text-surface-455 font-bold whitespace-nowrap">
                                      {new Date(log.createdAt).toLocaleDateString('en-NP', { day: 'numeric', month: 'short' })}
                                    </span>
                                  )}
                                </div>

                                {isCompleted && stage.details.length > 0 && (
                                  <div className="mt-1 bg-surface-50 border border-surface-150 rounded-2xl p-3 space-y-1.5 shadow-3xs max-w-full">
                                    {stage.details.map((detail: any, i: number) => (
                                      <div key={i} className="flex items-start gap-1.5 text-[10px] leading-tight">
                                        <span className="shrink-0">{detail.icon}</span>
                                        <span className="text-surface-500 font-medium whitespace-nowrap">{detail.label}:</span>
                                        <span className="text-surface-900 font-bold truncate max-w-full">{detail.value}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {isActive && (
                                  <div className="mt-1 bg-teal-50/50 border border-teal-200/80 rounded-2xl p-3 text-[10px] text-teal-800 font-semibold leading-relaxed animate-pulse">
                                    <span className="mr-1">👉</span>
                                    <span>{STAGE_ACTION_INSTRUCTIONS[selectedItem.state as VehicleState] || 'Awaiting action in panel →'}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* Compliance Audit Trail */}
                  <div className="bg-white/70 backdrop-blur-md border border-surface-200/80 rounded-3xl p-5 md:p-6 shadow-lg shadow-surface-100/30">
                    <h4 className="text-xs font-bold text-surface-700 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                      <Clock size={14} className="text-surface-500" /> Compliance Audit Trail
                    </h4>
                    {isLogsLoading ? (
                      <div className="space-y-3">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                      </div>
                    ) : transitionLogs.length === 0 ? (
                      <p className="text-xs text-surface-400 italic font-semibold">No transition logs recorded for this item.</p>
                    ) : (
                      <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                        {transitionLogs.map((log: any) => {
                          const fromMeta = log.fromState ? (STATE_METADATA[log.fromState as VehicleState] || { label: log.fromState }) : null;
                          const toMeta = STATE_METADATA[log.toState as VehicleState] || { label: log.toState };

                          return (
                            <div key={log.id} className="bg-surface-50/60 border border-surface-150 p-3.5 rounded-2xl text-xs flex justify-between items-start gap-4 hover:bg-surface-50 transition-colors">
                              <div className="space-y-1">
                                <p className="text-surface-700 leading-normal font-medium">
                                  <span className="font-bold text-surface-900">{log.performedBy || 'System'}</span> transitioned state
                                  {fromMeta ? (
                                    <> from <span className="font-bold text-surface-900">{fromMeta.label}</span></>
                                  ) : ''} to <span className="font-bold text-accent-teal">{toMeta.label}</span>.
                                </p>
                                {log.notes && (
                                  <p className="text-surface-500 italic mt-0.5 font-medium">"{log.notes}"</p>
                                )}
                              </div>
                              <span className="text-[9px] text-surface-450 font-bold whitespace-nowrap bg-white px-2 py-0.5 border border-surface-150 rounded-lg">
                                {new Date(log.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
      {/* Operations Hub Modal Dialogs */}

      {/* 1. Log Proforma Invoice Modal */}
      <Modal isOpen={showPIModal} onClose={() => setShowPIModal(false)} title="Log Proforma Invoice">
        <form onSubmit={handleCreatePISubmit} className="space-y-4">
          <p className="text-xs text-surface-500 mb-4">Add a new PI record to start tracking imports. Setting units controls how many vehicles can be linked to this PI.</p>
          <Input
            label="PI Number *"
            required
            placeholder="e.g. PI-2026-009"
            value={piNumberVal}
            onChange={e => setPiNumberVal(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Issue Date *"
              type="date"
              required
              value={piDateVal}
              onChange={e => setPiDateVal(e.target.value)}
            />
            <Input
              label="Total Amount (NPR) *"
              type="number"
              required
              placeholder="Total amount"
              value={piAmountVal}
              onChange={e => setPiAmountVal(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Supplier"
              placeholder="e.g. Changan / MAW"
              value={piSupplierVal}
              onChange={e => setPiSupplierVal(e.target.value)}
            />
            <div>
              <label className="text-xs font-semibold text-surface-500 tracking-wide mb-1 block">Number of Units *</label>
              <input
                type="number"
                required
                min="1"
                max="50"
                placeholder="e.g. 3"
                value={piUnitsVal}
                onChange={e => setPiUnitsVal(e.target.value)}
                className="w-full bg-white border border-surface-200 rounded-xl px-4 py-3 text-sm focus-ring text-surface-900"
              />
              <p className="text-[10px] text-surface-400 mt-1 ml-1">Max vehicles that can be linked to this PI</p>
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t">
            <Button variant="outline" type="button" onClick={() => setShowPIModal(false)}>Cancel</Button>
            <Button variant="gradient" type="submit">Log PI</Button>
          </div>
        </form>
      </Modal>

      {/* 2. Open Letter of Credit Modal */}
      <Modal isOpen={showLCModal} onClose={() => setShowLCModal(false)} title="Open Letter of Credit">
        <form onSubmit={handleCreateLCSubmit} className="space-y-4">
          <p className="text-xs text-surface-500 mb-4">Open an LC and link it to an existing Proforma Invoice.</p>
          
          <div>
            <label className="text-xs font-semibold text-surface-500 tracking-wide mb-1 block">Select PI Reference *</label>
            <select
              required
              value={lcPIIdVal}
              onChange={e => setLcPIIdVal(e.target.value)}
              className="w-full bg-white border border-surface-200 rounded-xl px-4 py-3.5 text-sm focus-ring text-surface-900 cursor-pointer"
            >
              <option value="">Select PI...</option>
              {pis.filter(p => !p.lc).map(p => (
                <option key={p.id} value={p.id}>{p.piNumber} (Supplier: {p.supplier})</option>
              ))}
            </select>
          </div>

          <Input
            label="LC Reference Number *"
            required
            placeholder="e.g. LC/DOM/2026/405"
            value={lcNumberVal}
            onChange={e => setLcNumberVal(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Bank Name *"
              required
              placeholder="e.g. Nabil Bank"
              value={lcBankVal}
              onChange={e => setLcBankVal(e.target.value)}
            />
            <Input
              label="Bank Branch"
              placeholder="e.g. Kathmandu"
              value={lcBranchVal}
              onChange={e => setLcBranchVal(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Opening Date *"
              type="date"
              required
              value={lcOpeningDateVal}
              onChange={e => setLcOpeningDateVal(e.target.value)}
            />
            <Input
              label="Amount Limit (NPR) *"
              type="number"
              required
              placeholder="LC amount limit"
              value={lcAmountVal}
              onChange={e => setLcAmountVal(e.target.value)}
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t">
            <Button variant="outline" type="button" onClick={() => setShowLCModal(false)}>Cancel</Button>
            <Button variant="gradient" type="submit">Activate LC</Button>
          </div>
        </form>
      </Modal>

      {/* 3. Link Vehicle to PI Modal */}
      <Modal isOpen={showVehicleModal} onClose={() => setShowVehicleModal(false)} title="Link Vehicle to PI" size="lg">
        {(() => {
          const catalogModels = Array.from(new Set(activeCatalog.map(v => v.model)));
          const activeModels = catalogModels.length > 0 ? catalogModels : ['Deepal S07', 'Deepal L07', 'Deepal E07', 'Deepal S05'];
          const variantsForModel = activeCatalog.filter(v => v.model === vModelVal);

          const handleModelChangeLocal = (model: string) => {
            setVModelVal(model);
            setVVariantVal('');
            setVColorVal('');
          };

          const handleVariantChangeLocal = (variant: string) => {
            const selected = activeCatalog.find(v => v.model === vModelVal && v.variant === variant);
            if (selected) {
              setVVariantVal(variant);
              setVPriceVal(selected.price.toString());
              setVCostVal(selected.cost.toString());
            }
          };

          // Derived PI capacity info based on selected PI
          const selectedPIData = pis.find(p => p.id === vPIIdVal);
          const piCapacity = selectedPIData?.units ?? null;
          const piUsed = selectedPIData?.linkedVehicleCount ?? 0;
          const piAtCapacity = piCapacity !== null && piUsed >= piCapacity;

          return (
            <form onSubmit={handleCreateVehicleSubmit} className="space-y-4">
              <p className="text-xs text-surface-500">Register a factory ordered unit and link it to its PI/LC import file.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-surface-500 tracking-wide mb-1 block">Select PI Reference *</label>
                  <select
                    required
                    value={vPIIdVal}
                    onChange={e => setVPIIdVal(e.target.value)}
                    className="w-full bg-white border border-surface-200 rounded-xl px-4 py-3.5 text-sm focus-ring text-surface-900 cursor-pointer"
                  >
                    <option value="">Select PI...</option>
                    {pis.map(p => {
                      const usedSlots = p.linkedVehicleCount ?? 0;
                      const totalSlots = p.units ?? 1;
                      const isFull = usedSlots >= totalSlots;
                      return (
                        <option key={p.id} value={p.id} disabled={isFull}>
                          {p.piNumber} — {usedSlots}/{totalSlots} units{isFull ? ' [FULL]' : ''} {p.lc ? `(LC: ${p.lc.lcNumber})` : '(No LC)'}
                        </option>
                      );
                    })}
                  </select>

                  {/* Capacity indicator shown when a PI is selected */}
                  {vPIIdVal && (
                    <div className={`mt-2 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                      piAtCapacity
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      <span className={`inline-block w-2 h-2 rounded-full ${piAtCapacity ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                      {piAtCapacity
                        ? `PI is at capacity — all ${piCapacity} unit slots are filled.`
                        : `${piUsed} of ${piCapacity} unit${piCapacity !== 1 ? 's' : ''} linked — ${(piCapacity ?? 0) - piUsed} slot${((piCapacity ?? 0) - piUsed) !== 1 ? 's' : ''} available.`
                      }
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-surface-500 tracking-wide mb-1 block">Vehicle Model *</label>
                  <select
                    required
                    value={vModelVal}
                    onChange={e => handleModelChangeLocal(e.target.value)}
                    className="w-full bg-white border border-surface-200 rounded-xl px-4 py-3.5 text-sm focus-ring text-surface-900 cursor-pointer"
                  >
                    <option value="">Select Model...</option>
                    {activeModels.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-surface-500 tracking-wide mb-1 block">Vehicle Variant *</label>
                  <select
                    required
                    disabled={!vModelVal}
                    value={vVariantVal}
                    onChange={e => handleVariantChangeLocal(e.target.value)}
                    className="w-full bg-white border border-surface-200 rounded-xl px-4 py-3.5 text-sm focus-ring text-surface-900 cursor-pointer"
                  >
                    <option value="">Select Variant...</option>
                    {variantsForModel.map(v => <option key={v.variant} value={v.variant}>{v.variant}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-surface-500 tracking-wide mb-1 block">Stock Color *</label>
                  <select
                    required
                    disabled={!vVariantVal}
                    value={vColorVal}
                    onChange={e => setVColorVal(e.target.value)}
                    className="w-full bg-white border border-surface-200 rounded-xl px-4 py-3.5 text-sm focus-ring text-surface-900 cursor-pointer"
                  >
                    <option value="">Select Color...</option>
                    {variantsForModel.find(v => v.variant === vVariantVal)?.availableColors?.map((c: any) => (
                      <option key={c.color} value={c.color}>{c.color}</option>
                    ))}
                  </select>
                </div>

                <Input
                  label="VIN / Chassis Number *"
                  required
                  placeholder="e.g. MA3CH..."
                  value={vVinVal}
                  onChange={e => setVVinVal(e.target.value)}
                />
                
                <Input
                  label="Engine / Motor Number"
                  placeholder="e.g. MOT-892"
                  value={vEngineNoVal}
                  onChange={e => setVEngineNoVal(e.target.value)}
                />

                <Input
                  label="Purchase Cost (NPR) *"
                  type="number"
                  required
                  placeholder="Cost Price"
                  value={vCostVal}
                  onChange={e => setVCostVal(e.target.value)}
                />

                <Input
                  label="Selling Price (NPR) *"
                  type="number"
                  required
                  placeholder="Retail price"
                  value={vPriceVal}
                  onChange={e => setVPriceVal(e.target.value)}
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t">
                <Button variant="outline" type="button" onClick={() => setShowVehicleModal(false)}>Cancel</Button>
                <Button variant="gradient" type="submit" disabled={piAtCapacity}>
                  {piAtCapacity ? 'PI Unit Limit Reached' : 'Link Vehicle Unit'}
                </Button>
              </div>
            </form>
          );
        })()}
      </Modal>

      {/* 4. Log New Customer Booking Modal */}
      <Modal isOpen={showBookingModal} onClose={() => setShowBookingModal(false)} title="Create Customer Booking" size="lg">
        <form onSubmit={handleCreateBookingSubmit} className="space-y-4">
          <p className="text-xs text-surface-500">Record a customer booking deposit. Select an existing CRM contact from the pipeline below.</p>
          
          <div>
            <label className="text-xs font-semibold text-surface-500 tracking-wide mb-1 block">Select Customer *</label>
            <select
              required
              value={existCustId}
              onChange={e => setExistCustId(e.target.value)}
              className="w-full bg-white border border-surface-200 rounded-xl px-4 py-3.5 text-sm focus-ring text-surface-900 cursor-pointer"
            >
              <option value="">Select CRM Contact...</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
              ))}
            </select>
          </div>

          <div className="border-t border-surface-200 pt-4 mt-2">
            <span className="text-[10px] uppercase font-bold text-surface-400 tracking-wider">Booking & Interest Details</span>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="text-xs font-semibold text-surface-500 tracking-wide mb-1 block">Model Interest *</label>
                <select
                  required
                  value={bookModel}
                  onChange={e => setBookModel(e.target.value)}
                  className="w-full bg-white border border-surface-200 rounded-xl px-4 py-3.5 text-sm focus-ring text-surface-900 cursor-pointer"
                >
                  <option value="">Select Model...</option>
                  {Array.from(new Set(activeCatalog.map(v => v.model))).map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <Input
                label="Preferred Color"
                placeholder="e.g. Comet White"
                value={bookColor}
                onChange={e => setBookColor(e.target.value)}
              />

              <Input
                label="Booking Amount Received *"
                type="number"
                required
                placeholder="Deposit amount (NPR)"
                value={bookAmount}
                onChange={e => setBookAmount(e.target.value)}
              />

              <Input
                label="Agreed Sales Price *"
                type="number"
                required
                placeholder="Agreed price (NPR)"
                value={bookPrice}
                onChange={e => setBookPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t">
            <Button variant="outline" type="button" onClick={() => setShowBookingModal(false)}>Cancel</Button>
            <Button variant="gradient" type="submit">Log Booking</Button>
          </div>
        </form>
      </Modal>

      {/* Print Allotment Modal wrapper */}
      <AllotmentLetterModal
        isOpen={showAllotmentModal}
        onClose={() => setShowAllotmentModal(false)}
        deal={selectedItem?.rawDeal}
      />
    </div>
  );
};

export default VehicleJourney;
