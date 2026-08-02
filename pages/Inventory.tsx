import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useInventory, useCreateVehicle, useUpdateVehicle, useLeads, useUpdateLead, useCreateLead, useCreateActivity, useActivities, supabase } from '../api';
import { PageHeader, Card, Badge, Button, Skeleton, useToast, Input, Select } from '../UI';
import { PRODUCT_CATALOG } from '../constants';
import { Tag, Info, DollarSign, AlertCircle, X, Plus, Palette, Check, Car } from 'lucide-react';
import { Vehicle } from '../types';
import { useAuth } from '../AuthContext';

// Color mapping for visual swatches
const COLOR_MAP: Record<string, string> = {
  // E07 Colors
  'Quartz White': '#F5F5F5', 'Hematite Grey': '#4A4A4A', 'Obsidian Black': '#1A1A1A',
  // S07 Colors
  'Lunar Gray': '#B0B0B0', 'Comet White': '#FFFFFF', 'Eclipse Black': '#0D0D0D',
  'Nebula Green': '#2E7D32', 'Sunset Orange': '#E64A19',
  // L07 Colors
  'Stellar Blue': '#1976D2', 'Aurora Blue': '#1565C0',
  // S05 Colors
  'Mercury Silver': '#C0C0C0', 'Deep Space Black': '#0A0A0A', 'Andromeda Blue': '#3F51B5',
  'Ganymede Grey': '#757575', 'Moonlight White': '#FAFAFA',
  // Additional Colors
  'Galaxy Silver': '#9E9E9E', 'Cosmic Red': '#C62828', 'Starlight Silver': '#CFD8DC'
};

const LIGHT_COLORS = ['Quartz White', 'Comet White', 'Galaxy Silver', 'Starlight Silver', 'Lunar Gray', 'Mercury Silver', 'Moonlight White'];

// VehicleCard component with interactive color selection
interface VehicleCardProps {
  car: Vehicle;
  getAgingColor: (bucket: string) => string;
  onDetailsClick: (car: Vehicle) => void;
  onOfferClick: (car: Vehicle) => void;
}

const VehicleCard: React.FC<VehicleCardProps> = ({ car, getAgingColor, onDetailsClick, onOfferClick }) => {
  const [previewColor, setPreviewColor] = useState<string>(car.color);

  // Get the image for the currently previewed color
  const getPreviewImage = () => {
    if (car.availableColors && car.availableColors.length > 0) {
      const colorMatch = car.availableColors.find(c => c.color === previewColor);
      if (colorMatch) return colorMatch.image;
    }
    return car.image;
  };

  const currentImage = getPreviewImage();

  return (
    <Card noPadding className="group hover:shadow-xl transition-all">
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50">
        {currentImage ? (
          <img
            src={currentImage}
            alt={`${car.model} - ${previewColor}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold">No Image</div>
        )}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
          <Badge variant={car.status === 'In Stock' ? 'success' : 'warning'}>{car.status}</Badge>
          {!car.registrationNo && car.status !== 'Sold' && (
            <Badge variant="error" size="sm">Missing Reg</Badge>
          )}
        </div>
        <div className="absolute bottom-3 right-3">
          <div className={`px-2 py-1 rounded-md text-[10px] font-black border bg-white ${getAgingColor(car.agingBucket)}`}>
            {car.daysInStock} DAYS AGED
          </div>
        </div>
      </div>
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h4 className="font-black text-slate-900">{car.model}</h4>
            <p className="text-xs font-bold text-slate-400">{car.variant} • {car.year}</p>
          </div>
          <p className="text-sm font-black text-blue-700">₹{(car.price / 100000).toFixed(1)}L</p>
        </div>

        <div className="flex gap-2 mb-3">
          <Badge size="sm" variant="neutral">{car.fuelType}</Badge>
          <Badge size="sm" variant="neutral">{previewColor}</Badge>
        </div>

        {/* Interactive Color Selector - Only show for Catalog templates, not for in-stock vehicles */}
        {car.vin && car.vin.startsWith('CAT-') && car.availableColors && car.availableColors.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
              <Palette size={10} /> Click to preview colors
            </p>
            <div className="flex flex-wrap gap-1.5">
              {car.availableColors.map((colorOpt) => {
                const bgColor = COLOR_MAP[colorOpt.color] || '#888';
                const isLight = LIGHT_COLORS.includes(colorOpt.color);
                const isSelected = previewColor === colorOpt.color;
                return (
                  <button
                    key={colorOpt.color}
                    type="button"
                    title={colorOpt.color}
                    onClick={() => setPreviewColor(colorOpt.color)}
                    className={`w-6 h-6 rounded-full border-2 cursor-pointer transition-all flex items-center justify-center ${isSelected
                      ? 'border-blue-500 ring-2 ring-blue-200 scale-110'
                      : 'border-slate-200 hover:scale-110'
                      }`}
                    style={{
                      backgroundColor: bgColor,
                      boxShadow: isLight ? 'inset 0 0 0 1px rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    {isSelected && (
                      <Check size={12} className={isLight ? 'text-slate-700' : 'text-white'} strokeWidth={3} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {car.status === 'Reserved' && (
          <div 
            className="mb-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-amber-800 text-xs font-bold flex items-center gap-2 shadow-sm"
            title={`Reserved for ${car.reservedFor || 'Customer'}`}
          >
            <span className="flex h-2 w-2 relative flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span className="truncate">
              Reserved for: <strong className="font-extrabold text-amber-950">{car.reservedFor || 'Customer'}</strong>
            </span>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className={car.status === 'Reserved' ? "w-full" : "flex-1"}
            icon={Info}
            onClick={() => onDetailsClick(car)}
          >
            Details
          </Button>
          {car.status !== 'Reserved' && (
            car.status !== 'Sold' ? (
              <Button
                size="sm"
                className="flex-1"
                icon={DollarSign}
                onClick={() => onOfferClick(car)}
              >
                Set Offer
              </Button>
            ) : (
              <div className="flex-1 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-xs font-black flex items-center justify-center gap-1.5 py-2">
                <Check size={14} /> Sold & Allotted
              </div>
            )
          )}
        </div>
      </div>
    </Card>
  );
};

const getAllotmentDetails = (vehicle: Vehicle) => {
  const spec = vehicle.specifications?.find((s: any) => s.label === 'allotment_details');
  if (!spec) return null;
  try {
    return JSON.parse(spec.value);
  } catch (err) {
    console.error('Failed to parse allotment details:', err);
    return null;
  }
};

const Inventory: React.FC = () => {
  const { user } = useAuth();
  const { data: vehicles = [], isLoading } = useInventory();
  const { data: leads = [] } = useLeads();
  const createVehicle = useCreateVehicle();
  const updateLead = useUpdateLead();
  const createActivity = useCreateActivity();
  const { addToast } = useToast();
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isOfferOpen, setIsOfferOpen] = useState(false);
  const [detailsPreviewColor, setDetailsPreviewColor] = useState<string>('');
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);
  const updateVehicle = useUpdateVehicle();
  const [editPrice, setEditPrice] = useState<string>('');
  const [isEditingReg, setIsEditingReg] = useState(false);
  const [editReg, setEditReg] = useState('');
  const [isEditingAll, setIsEditingAll] = useState(false);
  const [editVehicleForm, setEditVehicleForm] = useState<Partial<Vehicle>>({});

  // Sale/allotment state
  const [isSelling, setIsSelling] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [saleDeliveryDate, setSaleDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmittingSale, setIsSubmittingSale] = useState(false);

  // New Lead creation fields & allotment details states
  const createLead = useCreateLead();
  const [allotmentType, setAllotmentType] = useState<'existing' | 'new'>('existing');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');
  
  // Allotment & Bank Details
  const [bankName, setBankName] = useState('');
  const [bankBranch, setBankBranch] = useState('');
  const [rmName, setRmName] = useState('');
  const [rmPhone, setRmPhone] = useState('');
  const [approvedLoan, setApprovedLoan] = useState('');
  const [amountReceived, setAmountReceived] = useState('');
  const [nepaliDate, setNepaliDate] = useState('2083-  -  ');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'finance'>('finance');

  // Edit existing sold vehicle allotment details state
  const [isEditingAllotment, setIsEditingAllotment] = useState(false);
  const [editBankName, setEditBankName] = useState('');
  const [editBankBranch, setEditBankBranch] = useState('');
  const [editRmName, setEditRmName] = useState('');
  const [editRmPhone, setEditRmPhone] = useState('');
  const [editApprovedLoan, setEditApprovedLoan] = useState('');
  const [editAmountReceived, setEditAmountReceived] = useState('');
  const [editSalePrice, setEditSalePrice] = useState('');
  const [editNepaliDate, setEditNepaliDate] = useState('2083-  -  ');
  const [editPaymentMethod, setEditPaymentMethod] = useState<'cash' | 'finance'>('finance');

  // Document preview modal state
  const [previewDocType, setPreviewDocType] = useState<'grn' | 'allotment' | 'disbursement' | null>(null);
  // States for doc editable fields in preview
  const [docGrnInvoiceNo, setDocGrnInvoiceNo] = useState('');
  const [docGrnInvoiceDate, setDocGrnInvoiceDate] = useState('');
  const [docGrnLcNo, setDocGrnLcNo] = useState('');
  const [docGrnLcDate, setDocGrnLcDate] = useState('');
  const [docGrnBank, setDocGrnBank] = useState('');
  const [docGrnVatNo, setDocGrnVatNo] = useState('610014662');
  const [docGrnDate, setDocGrnDate] = useState('');
  const [docDate, setDocDate] = useState('');
  const [docSubject, setDocSubject] = useState('');
  const [docAllotmentCustomer, setDocAllotmentCustomer] = useState('');
  const [docAllotmentApprovedLoan, setDocAllotmentApprovedLoan] = useState('');
  const [docAllotmentAmountReceived, setDocAllotmentAmountReceived] = useState('');
  const [docAllotmentSalePrice, setDocAllotmentSalePrice] = useState('');
  const [docNepaliDate, setDocNepaliDate] = useState('');
  const [docBankName, setDocBankName] = useState('');
  const [docBankBranch, setDocBankBranch] = useState('');
  const [docRmName, setDocRmName] = useState('');
  const [docRmPhone, setDocRmPhone] = useState('');

  const { data: vehicleActivities = [] } = useActivities(selectedVehicle?.id || '', 'VEHICLE');

  // Form state for adding stock
  const [newVehicle, setNewVehicle] = useState<Partial<Vehicle>>({
    model: '',
    variant: '',
    vin: '',
    year: 2025,
    color: '',
    fuelType: 'EV',
    cost: 0,
    price: 0,
    proformaInvoiceNo: '',
    lcNo: '',
    motorNo: '',
    registrationNo: ''
  });

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'In Stock' | 'Transit' | 'Reserved' | 'Sold' | 'Test Drive'>('All');
  const [agingFilter, setAgingFilter] = useState<'All' | '0-30' | '31-60' | '61-90' | '90+'>('All');
  const [modelFilter, setModelFilter] = useState<string>('All');

  const allStockVehicles = vehicles.filter(v => v.vin && !v.vin.startsWith('CAT-'));
  const dbCatalogVehicles = vehicles.filter(v => v.vin && v.vin.startsWith('CAT-'));
  const activeCatalog = dbCatalogVehicles.length > 0 ? dbCatalogVehicles : PRODUCT_CATALOG;

  const catalogModels = Array.from(new Set(activeCatalog.map(v => v.model)));
  const stockModels = Array.from(new Set(allStockVehicles.map(v => v.model)));
  const variantsForModel = activeCatalog.filter(v => v.model === newVehicle.model);

  const handleModelChange = (model: string) => {
    setNewVehicle({ ...newVehicle, model, variant: '', fuelType: 'EV', price: 0, cost: 0 });
  };

  const handleVariantChange = (variant: string) => {
    const selected = activeCatalog.find(v => v.model === newVehicle.model && v.variant === variant);
    if (selected) {
      setNewVehicle({
        ...newVehicle,
        variant,
        fuelType: selected.fuelType,
        price: selected.price,
        cost: selected.cost,
        image: selected.image,
        specifications: selected.specifications,
        availableColors: selected.availableColors
      });
    }
  };

  // Filter vehicles list dynamically based on user selections
  const filteredVehicles = allStockVehicles.filter(v => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = !search || 
      v.model.toLowerCase().includes(search) ||
      v.variant.toLowerCase().includes(search) ||
      v.color.toLowerCase().includes(search) ||
      (v.vin && v.vin.toLowerCase().includes(search)) ||
      (v.proformaInvoiceNo && v.proformaInvoiceNo.toLowerCase().includes(search)) ||
      (v.lcNo && v.lcNo.toLowerCase().includes(search)) ||
      (v.motorNo && v.motorNo.toLowerCase().includes(search)) ||
      (v.registrationNo && v.registrationNo.toLowerCase().includes(search));

    const matchesStatus = statusFilter === 'All' || v.status === statusFilter;
    const matchesAging = agingFilter === 'All' || v.agingBucket === agingFilter;
    const matchesModel = modelFilter === 'All' || v.model === modelFilter;

    return matchesSearch && matchesStatus && matchesAging && matchesModel;
  });

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-12 w-1/4" /><Skeleton className="h-96" /></div>;

  // KPIs count the entire active stock (excluding sold ones)
  const activeStock = allStockVehicles.filter(v => v.status !== 'Sold');
  const totalUnits = activeStock.length;
  const stuckStock = activeStock.filter(v => v.daysInStock > 60).length;
  const inventoryValue = activeStock.reduce((sum, v) => sum + (v.cost || 0), 0);
  const projectedMargin = activeStock.reduce((sum, v) => sum + ((v.price || 0) - (v.cost || 0)), 0);

  const getAgingColor = (bucket: string) => {
    switch (bucket) {
      case '90+': return 'bg-red-50 text-red-700 border-red-200';
      case '61-90': return 'bg-orange-50 text-orange-700 border-orange-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehicle.model || !newVehicle.variant || !newVehicle.color) {
      addToast('Please select Model, Variant, and Color.', 'warning');
      return;
    }
    try {
      await createVehicle.mutateAsync(newVehicle);
      addToast('Vehicle added to inventory successfully!', 'success');
      setIsAddStockOpen(false);
      setNewVehicle({
        model: '',
        variant: '',
        vin: '',
        year: 2025,
        color: '',
        fuelType: 'EV',
        cost: 0,
        price: 0,
        proformaInvoiceNo: '',
        lcNo: '',
        motorNo: '',
        registrationNo: ''
      });
    } catch (err) {
      addToast('Failed to add vehicle', 'error');
    }
  };

  const handleUpdatePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;
    setIsUpdatingPrice(true);
    try {
      await updateVehicle.mutateAsync({
        id: selectedVehicle.id,
        patch: { price: parseFloat(editPrice) }
      });
      addToast('Vehicle price updated successfully!', 'success');
      setIsDetailsOpen(false);
    } catch (err) {
      addToast('Failed to update price', 'error');
    } finally {
      setIsUpdatingPrice(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const handleUpdateReg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;
    try {
      await updateVehicle.mutateAsync({
        id: selectedVehicle.id,
        patch: { registrationNo: editReg }
      });
      addToast('Registration number updated successfully!', 'success');
      setSelectedVehicle({ ...selectedVehicle, registrationNo: editReg });
      setIsEditingReg(false);
    } catch (err) {
      addToast('Failed to update registration number', 'error');
    }
  };

  const handleSaveAllDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;

    const currentVin = (selectedVehicle.vin || '').trim().toLowerCase();
    const newVin = (editVehicleForm.vin || '').trim().toLowerCase();

    if (newVin && newVin !== currentVin) {
      const vinExists = vehicles.some(v => 
        v.id !== selectedVehicle.id && 
        (v.vin || '').trim().toLowerCase() === newVin
      );
      if (vinExists) {
        addToast(`A vehicle with VIN "${editVehicleForm.vin}" already exists in your inventory.`, 'error');
        return;
      }
    }

    try {
      const updated = await updateVehicle.mutateAsync({
        id: selectedVehicle.id,
        patch: {
          vin: editVehicleForm.vin,
          status: editVehicleForm.status,
          proformaInvoiceNo: editVehicleForm.proformaInvoiceNo,
          lcNo: editVehicleForm.lcNo,
          motorNo: editVehicleForm.motorNo,
          year: editVehicleForm.year,
          color: editVehicleForm.color,
          cost: editVehicleForm.cost,
          price: editVehicleForm.price,
          registrationNo: editVehicleForm.registrationNo,
          createdAt: editVehicleForm.createdAt ? new Date(editVehicleForm.createdAt).toISOString() : undefined,
          image: editVehicleForm.image
        }
      });
      
      addToast('Vehicle details updated successfully!', 'success');
      
      setSelectedVehicle({
        ...selectedVehicle,
        vin: editVehicleForm.vin || selectedVehicle.vin,
        status: editVehicleForm.status || selectedVehicle.status,
        proformaInvoiceNo: editVehicleForm.proformaInvoiceNo || selectedVehicle.proformaInvoiceNo,
        lcNo: editVehicleForm.lcNo || selectedVehicle.lcNo,
        motorNo: editVehicleForm.motorNo || selectedVehicle.motorNo,
        year: editVehicleForm.year || selectedVehicle.year,
        color: editVehicleForm.color || selectedVehicle.color,
        cost: editVehicleForm.cost || selectedVehicle.cost,
        price: editVehicleForm.price || selectedVehicle.price,
        registrationNo: editVehicleForm.registrationNo || selectedVehicle.registrationNo,
        createdAt: editVehicleForm.createdAt || selectedVehicle.createdAt,
        image: editVehicleForm.image || selectedVehicle.image
      });
      
      setIsEditingAll(false);
    } catch (err) {
      console.error('Failed to save vehicle details:', err);
      addToast('Failed to update vehicle details', 'error');
    }
  };

  const handleSetOffer = (e: React.FormEvent) => {
    e.preventDefault();
    addToast(`Special offer set for ${selectedVehicle?.model}!`, 'success');
    setIsOfferOpen(false);
  };

  const handleReviewAging = () => {
    addToast('Opening aging report for stuck units', 'info');
  };

  const handleOpenDetails = (car: Vehicle) => {
    setSelectedVehicle(car);
    setDetailsPreviewColor(car.color);
    setIsDetailsOpen(true);
    setEditReg(car.registrationNo || '');
    setIsEditingReg(false);
    setIsEditingAll(false);
    setIsSelling(false);
    setSelectedLeadId('');
    setSalePrice(car.price?.toString() || '');
    setSaleDeliveryDate(new Date().toISOString().split('T')[0]);
    setIsSubmittingSale(false);

    // Reset create allotment inputs
    setAllotmentType('existing');
    setNewCustomerName('');
    setNewCustomerPhone('');
    setNewCustomerEmail('');
    setNewCustomerAddress('');
    setBankName('');
    setBankBranch('');
    setRmName('');
    setRmPhone('');
    setApprovedLoan('');
    setAmountReceived('');
    setNepaliDate('2083-  -  ');
    setPaymentMethod('finance');

    setIsEditingAllotment(false);
    const details = getAllotmentDetails(car);
    if (details) {
      setEditBankName(details.bankName || '');
      setEditBankBranch(details.bankBranch || '');
      setEditRmName(details.rmName || '');
      setEditRmPhone(details.rmPhone || '');
      setEditApprovedLoan(details.approvedLoan?.toString() || '');
      setEditAmountReceived(details.amountReceived?.toString() || '');
      setEditSalePrice(details.salePrice?.toString() || car.price?.toString() || '');
      setEditNepaliDate(details.nepaliDate || '2083-  -  ');
      setEditPaymentMethod(details.paymentMethod || (details.bankName ? 'finance' : 'cash'));
    } else {
      setEditBankName('');
      setEditBankBranch('');
      setEditRmName('');
      setEditRmPhone('');
      setEditApprovedLoan('');
      setEditAmountReceived('');
      setEditSalePrice(car.price?.toString() || '');
      setEditNepaliDate('2083-  -  ');
      setEditPaymentMethod('finance');
    }

    setEditVehicleForm({
      vin: car.vin || '',
      proformaInvoiceNo: car.proformaInvoiceNo || '',
      lcNo: car.lcNo || '',
      motorNo: car.motorNo || '',
      year: car.year || 2025,
      color: car.color || '',
      cost: car.cost || 0,
      price: car.price || 0,
      registrationNo: car.registrationNo || '',
      status: car.status || 'In Stock',
      createdAt: car.createdAt ? new Date(car.createdAt).toISOString().split('T')[0] : '',
      image: car.image || ''
    });
  };

  const handleSaveAllotmentDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;

    try {
      const details = getAllotmentDetails(selectedVehicle) || {};
      const updatedDetails = {
        ...details,
        salePrice: parseFloat(editSalePrice) || selectedVehicle.price || 0,
        nepaliDate: editNepaliDate,
        amountReceived: parseFloat(editAmountReceived) || 0,
        approvedLoan: parseFloat(editApprovedLoan) || 0,
        bankName: editBankName,
        bankBranch: editBankBranch,
        rmName: editRmName,
        rmPhone: editRmPhone,
        paymentMethod: editPaymentMethod
      };

      const oldSpecs = selectedVehicle.specifications || [];
      const newSpecs = [
        ...oldSpecs.filter((s: any) => s.label !== 'allotment_details'),
        { label: 'allotment_details', value: JSON.stringify(updatedDetails) }
      ];

      await updateVehicle.mutateAsync({
        id: selectedVehicle.id,
        patch: {
          price: parseFloat(editSalePrice) || selectedVehicle.price || 0,
          specifications: newSpecs
        }
      });

      // Sync to customer profile in database
      try {
        const { data: customer } = await supabase
          .from('customers')
          .select('*')
          .eq('phone', updatedDetails.customerPhone || details.customerPhone)
          .maybeSingle();

        if (customer) {
          const updatedCars = (Array.isArray(customer.cars_owned) ? (customer.cars_owned as any[]) : []).map((c: any) => {
            if (c.vin === selectedVehicle.vin) {
              return {
                ...c,
                paymentMethod: editPaymentMethod,
                plate: selectedVehicle.registrationNo || c.plate
              };
            }
            return c;
          });

          await supabase
            .from('customers')
            .update({
              cars_owned: updatedCars,
              name: updatedDetails.customerName || customer.name
            })
            .eq('id', customer.id);
        }
      } catch (custErr) {
        console.warn('Failed to sync customer profile changes:', custErr);
      }

      addToast('Allotment details updated successfully!', 'success');
      setSelectedVehicle({
        ...selectedVehicle,
        price: parseFloat(editSalePrice) || selectedVehicle.price || 0,
        specifications: newSpecs
      });
      setIsEditingAllotment(false);
    } catch (err) {
      console.error('Failed to save allotment details:', err);
      addToast('Failed to update allotment details', 'error');
    }
  };

  const handleOpenOffer = (car: Vehicle) => {
    setSelectedVehicle(car);
    setIsOfferOpen(true);
  };

  // Get details preview image
  const getDetailsPreviewImage = () => {
    if (selectedVehicle?.availableColors && selectedVehicle.availableColors.length > 0) {
      const colorMatch = selectedVehicle.availableColors.find(c => c.color === detailsPreviewColor);
      if (colorMatch) return colorMatch.image;
    }
    return selectedVehicle?.image || '';
  };

  return (
    <>
      <div className="space-y-8 animate-fade-in">
        <PageHeader
          title="Inventory Performance"
          subtitle="Real-time stock aging and margin protection."
          actions={
            <Button
              icon={Plus}
              onClick={() => setIsAddStockOpen(true)}
            >
              Add Stock
            </Button>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Units', val: totalUnits.toString(), color: 'text-slate-900' },
            { label: 'Stuck Stock (60+)', val: stuckStock.toString(), color: 'text-orange-600' },
            { label: 'Inventory Value', val: `₹${(inventoryValue / 10000000).toFixed(1)} Cr`, color: 'text-slate-900' },
            { label: 'Projected Margin', val: `₹${(projectedMargin / 100000).toFixed(1)}M`, color: 'text-emerald-600' }
          ].map(kpi => (
            <Card key={kpi.label} className="flex flex-col items-center justify-center p-6 bg-white">
              <p className="text-[10px] font-black uppercase text-slate-400 mb-1">{kpi.label}</p>
              <p className={`text-3xl font-black ${kpi.color}`}>{kpi.val}</p>
            </Card>
          ))}
        </div>

        {stuckStock > 0 && (
          <div className="flex items-center gap-4 p-5 bg-indigo-50 border border-indigo-100 rounded-2xl">
            <AlertCircle className="text-indigo-600" />
            <p className="text-sm font-bold text-indigo-900">
              Stuck Stock Alert: {stuckStock} units have crossed the 60-day threshold. Recommend a pricing review or branch transfer.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="ml-auto bg-white border-indigo-200 text-indigo-700"
              onClick={handleReviewAging}
            >
              Review aging
            </Button>
          </div>
        )}

        {/* Filters Bar */}
        <Card className="p-4 bg-white shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between border border-slate-100 rounded-2xl">
          <div className="flex-1 w-full">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by model, variant, VIN, invoice, reg no..."
              className="w-full text-slate-800"
            />
          </div>
          <div className="flex flex-wrap md:flex-nowrap gap-3 w-full md:w-auto">
            <div className="w-full md:w-40">
              <Select
                value={modelFilter}
                onChange={(e) => setModelFilter(e.target.value)}
                options={[
                  { label: 'All Models', value: 'All' },
                  ...stockModels.map(m => ({ label: m, value: m }))
                ]}
              />
            </div>
            <div className="w-full md:w-40">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                options={[
                  { label: 'All Statuses', value: 'All' },
                  { label: 'In Stock', value: 'In Stock' },
                  { label: 'Transit', value: 'Transit' },
                  { label: 'Reserved', value: 'Reserved' },
                  { label: 'Sold', value: 'Sold' },
                  { label: 'Test Drive', value: 'Test Drive' }
                ]}
              />
            </div>
            <div className="w-full md:w-40">
              <Select
                value={agingFilter}
                onChange={(e) => setAgingFilter(e.target.value as any)}
                options={[
                  { label: 'All Aging', value: 'All' },
                  { label: '0-30 days', value: '0-30' },
                  { label: '31-60 days', value: '31-60' },
                  { label: '61-90 days', value: '61-90' },
                  { label: '90+ days', value: '90+' }
                ]}
              />
            </div>
          </div>
        </Card>

        {filteredVehicles.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-20 text-center border-dashed border-2 bg-slate-50/50">
            <div className="p-4 bg-white rounded-2xl shadow-sm mb-4">
              <Car size={40} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No matching vehicles found</h3>
            <p className="text-slate-500 max-w-xs mt-2">
              Try adjusting your search query or filters to find the vehicle you're looking for.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredVehicles?.map(car => (
              <VehicleCard
                key={car.id}
                car={car}
                getAgingColor={getAgingColor}
                onDetailsClick={handleOpenDetails}
                onOfferClick={handleOpenOffer}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Stock Modal */}
      {isAddStockOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black">Add Vehicle to Inventory</h2>
                <p className="text-blue-100 text-sm mt-1">Register new vehicle stock</p>
              </div>
              <button onClick={() => setIsAddStockOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddStock} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-bold text-slate-600 mb-2">Select Model *</label>
                  <Select
                    value={newVehicle.model}
                    onChange={(e) => handleModelChange(e.target.value)}
                    options={[
                      { label: 'Select Model...', value: '' },
                      ...catalogModels.map(m => ({ label: m, value: m }))
                    ]}
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-bold text-slate-600 mb-2">Select Variant *</label>
                  <Select
                    disabled={!newVehicle.model}
                    value={newVehicle.variant}
                    onChange={(e) => handleVariantChange(e.target.value)}
                    options={[
                      { label: 'Select Variant...', value: '' },
                      ...variantsForModel.map(v => ({ label: v.variant, value: v.variant }))
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">VIN Number *</label>
                  <Input 
                    required 
                    value={newVehicle.vin}
                    onChange={(e) => setNewVehicle({ ...newVehicle, vin: e.target.value })}
                    placeholder="VIN12345" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">Proforma Invoice Number *</label>
                  <Input 
                    required 
                    value={newVehicle.proformaInvoiceNo || ''}
                    onChange={(e) => setNewVehicle({ ...newVehicle, proformaInvoiceNo: e.target.value })}
                    placeholder="e.g. PI-10023" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">LC Number *</label>
                  <Input 
                    required 
                    value={newVehicle.lcNo || ''}
                    onChange={(e) => setNewVehicle({ ...newVehicle, lcNo: e.target.value })}
                    placeholder="e.g. LC-89302" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">Motor Number *</label>
                  <Input 
                    required 
                    value={newVehicle.motorNo || ''}
                    onChange={(e) => setNewVehicle({ ...newVehicle, motorNo: e.target.value })}
                    placeholder="e.g. MOT-89302-A" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">Year *</label>
                  <Input 
                    type="number" 
                    required 
                    value={newVehicle.year}
                    onChange={(e) => setNewVehicle({ ...newVehicle, year: parseInt(e.target.value) })}
                    placeholder="2025" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">Stock Color *</label>
                  <Select
                    disabled={!newVehicle.variant}
                    value={newVehicle.color}
                    onChange={(e) => setNewVehicle({ ...newVehicle, color: e.target.value })}
                    options={[
                      { label: 'Select Color...', value: '' },
                      ...(newVehicle.availableColors?.map(c => ({ label: c.color, value: c.color })) || [])
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">Fuel Type</label>
                  <Input disabled value={newVehicle.fuelType} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">Purchase Cost (NPR) *</label>
                  <Input 
                    type="number" 
                    required 
                    value={newVehicle.cost}
                    onChange={(e) => setNewVehicle({ ...newVehicle, cost: parseFloat(e.target.value) })}
                    placeholder="4800000" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">Selling Price (NPR) *</label>
                  <Input 
                    type="number" 
                    required 
                    value={newVehicle.price}
                    onChange={(e) => setNewVehicle({ ...newVehicle, price: parseFloat(e.target.value) })}
                    placeholder="5200000" 
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-6 border-t">
                <Button type="button" variant="secondary" onClick={() => setIsAddStockOpen(false)} className="flex-1">Cancel</Button>
                <Button type="submit" className="flex-1">Add to Inventory</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vehicle Details Modal */}
      {isDetailsOpen && selectedVehicle && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-700">
            <div className="bg-gradient-to-r from-slate-900 to-slate-700 text-white p-6 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-2xl font-black">{selectedVehicle.model}</h2>
                <p className="text-slate-300 text-sm mt-1">{selectedVehicle.variant} • {selectedVehicle.year}</p>
              </div>
              <div className="flex items-center gap-2">
                {!isEditingAll && selectedVehicle.status !== 'Sold' && (
                  <button 
                    onClick={() => setIsEditingAll(true)}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-black rounded-lg transition-colors cursor-pointer"
                  >
                    Edit Details
                  </button>
                )}
                <button onClick={() => setIsDetailsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors cursor-pointer">
                  <X size={24} />
                </button>
              </div>
            </div>

            {isEditingAll ? (
              <form onSubmit={handleSaveAllDetails} className="p-6 space-y-4 overflow-y-auto flex-1 text-slate-700">
                <div className="grid grid-cols-2 gap-4 text-left">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">VIN Number *</label>
                    <Input 
                      required 
                      value={editVehicleForm.vin || ''}
                      onChange={(e) => setEditVehicleForm({ ...editVehicleForm, vin: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">Status *</label>
                    <Select
                      value={editVehicleForm.status || 'In Stock'}
                      onChange={(e) => setEditVehicleForm({ ...editVehicleForm, status: e.target.value as any })}
                      options={[
                        { label: 'In Stock', value: 'In Stock' },
                        { label: 'Reserved', value: 'Reserved' },
                        { label: 'Sold', value: 'Sold' },
                        { label: 'Test Drive', value: 'Test Drive' }
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">Proforma Invoice Number *</label>
                    <Input 
                      required 
                      value={editVehicleForm.proformaInvoiceNo || ''}
                      onChange={(e) => setEditVehicleForm({ ...editVehicleForm, proformaInvoiceNo: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">LC Number *</label>
                    <Input 
                      required 
                      value={editVehicleForm.lcNo || ''}
                      onChange={(e) => setEditVehicleForm({ ...editVehicleForm, lcNo: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">Motor Number *</label>
                    <Input 
                      required 
                      value={editVehicleForm.motorNo || ''}
                      onChange={(e) => setEditVehicleForm({ ...editVehicleForm, motorNo: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">Year *</label>
                    <Input 
                      type="number"
                      required 
                      value={editVehicleForm.year || 2025}
                      onChange={(e) => setEditVehicleForm({ ...editVehicleForm, year: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">Color *</label>
                    {selectedVehicle.vin && selectedVehicle.vin.startsWith('CAT-') ? (
                      selectedVehicle.availableColors && selectedVehicle.availableColors.length > 0 ? (
                        <Select
                          value={editVehicleForm.color || ''}
                          onChange={(e) => {
                            const colorOpt = selectedVehicle.availableColors?.find(c => c.color === e.target.value);
                            setEditVehicleForm({
                              ...editVehicleForm,
                              color: e.target.value,
                              image: colorOpt ? colorOpt.image : editVehicleForm.image
                            });
                          }}
                          options={selectedVehicle.availableColors.map(c => ({ label: c.color, value: c.color }))}
                        />
                      ) : (
                        <Input
                          required
                          value={editVehicleForm.color || ''}
                          onChange={(e) => setEditVehicleForm({ ...editVehicleForm, color: e.target.value })}
                        />
                      )
                    ) : (
                      <Input
                        disabled
                        value={editVehicleForm.color || ''}
                        onChange={() => {}}
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">Purchase Cost (NPR) *</label>
                    <Input 
                      type="number" 
                      required 
                      value={editVehicleForm.cost || 0}
                      onChange={(e) => setEditVehicleForm({ ...editVehicleForm, cost: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">Selling Price (NPR) *</label>
                    <Input 
                      type="number" 
                      required 
                      value={editVehicleForm.price || 0}
                      onChange={(e) => setEditVehicleForm({ ...editVehicleForm, price: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">Date of Receipt *</label>
                    <Input 
                      type="date" 
                      required 
                      value={editVehicleForm.createdAt || ''}
                      onChange={(e) => setEditVehicleForm({ ...editVehicleForm, createdAt: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-600 mb-2">Registration Number</label>
                    <Input 
                      value={editVehicleForm.registrationNo || ''}
                      onChange={(e) => setEditVehicleForm({ ...editVehicleForm, registrationNo: e.target.value })}
                      placeholder="e.g. BA-12-PA-5678"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6 pt-6 border-t">
                  <Button type="button" variant="secondary" onClick={() => setIsEditingAll(false)} className="flex-1">Cancel</Button>
                  <Button type="submit" className="flex-1" isLoading={updateVehicle.isPending}>Save Changes</Button>
                </div>
              </form>
            ) : (
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                {/* Dynamic Image Preview */}
                <div className="relative h-64 overflow-hidden rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 shrink-0">
                  <img
                    src={getDetailsPreviewImage()}
                    alt={`${selectedVehicle.model} - ${detailsPreviewColor}`}
                    className="w-full h-full object-cover transition-all duration-300"
                  />
                  {detailsPreviewColor && (
                    <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-black/60 backdrop-blur-sm text-white text-xs font-bold rounded-lg">
                      {detailsPreviewColor}
                    </div>
                  )}
                </div>

                {/* Interactive Colors Section - Only show for Catalog templates, not for in-stock vehicles */}
                {selectedVehicle.vin && selectedVehicle.vin.startsWith('CAT-') && selectedVehicle.availableColors && selectedVehicle.availableColors.length > 0 && (
                  <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl shrink-0">
                    <p className="text-xs font-bold text-slate-500 mb-3 flex items-center gap-2">
                      <Palette size={14} className="text-blue-600" /> Click to Preview Colors
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {selectedVehicle.availableColors.map((colorOpt) => {
                        const bgColor = COLOR_MAP[colorOpt.color] || '#888';
                        const isLight = LIGHT_COLORS.includes(colorOpt.color);
                        const isSelected = detailsPreviewColor === colorOpt.color;
                        return (
                          <button
                            key={colorOpt.color}
                            onClick={() => setDetailsPreviewColor(colorOpt.color)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${isSelected
                              ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-200'
                              : 'bg-white border-slate-200 hover:border-blue-300'
                              }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-blue-500' : 'border-slate-200'
                                }`}
                              style={{ backgroundColor: bgColor }}
                            >
                              {isSelected && (
                                <Check size={12} className={isLight ? 'text-slate-700' : 'text-white'} strokeWidth={3} />
                              )}
                            </div>
                            <span className={`text-xs font-bold ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>
                              {colorOpt.color}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-left">
                  <div className="p-4 bg-slate-50 rounded-xl text-left">
                    <p className="text-xs font-bold text-slate-500 mb-1">VIN Number</p>
                    <p className="font-bold text-slate-900">{selectedVehicle.vin}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl text-left">
                    <p className="text-xs font-bold text-slate-500 mb-1">Status</p>
                    <Badge variant={selectedVehicle.status === 'In Stock' ? 'success' : 'warning'}>{selectedVehicle.status}</Badge>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl text-left">
                    <p className="text-xs font-bold text-slate-500 mb-1">Proforma Invoice Number</p>
                    <p className="font-bold text-slate-900">{selectedVehicle.proformaInvoiceNo || 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl text-left">
                    <p className="text-xs font-bold text-slate-500 mb-1">LC Number</p>
                    <p className="font-bold text-slate-900">{selectedVehicle.lcNo || 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl text-left">
                    <p className="text-xs font-bold text-slate-500 mb-1">Motor Number</p>
                    <p className="font-bold text-slate-900">{selectedVehicle.motorNo || 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl text-left">
                    <p className="text-xs font-bold text-slate-500 mb-1">Fuel Type</p>
                    <p className="font-bold text-slate-900">{selectedVehicle.fuelType}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl text-left">
                    <p className="text-xs font-bold text-slate-500 mb-1">Cost Price</p>
                    <p className="font-bold text-slate-900">₹{(selectedVehicle.cost / 100000).toFixed(1)}L</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl group/price relative text-left">
                    <p className="text-xs font-bold text-slate-500 mb-1">Selling Price</p>
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-blue-700">₹{(selectedVehicle.price / 100000).toFixed(2)}L</p>
                      {selectedVehicle.status !== 'Sold' && (
                        <button 
                          onClick={() => {
                            setEditPrice(selectedVehicle.price.toString());
                            setIsUpdatingPrice(true);
                          }}
                          className="p-1.5 hover:bg-white text-slate-400 hover:text-blue-600 rounded-lg transition-all opacity-0 group-hover/price:opacity-100 cursor-pointer"
                        >
                          <Plus size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl text-left">
                    <p className="text-xs font-bold text-slate-500 mb-1">Days in Stock</p>
                    <p className="font-bold text-orange-700">{selectedVehicle.daysInStock} days</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl text-left">
                    <p className="text-xs font-bold text-slate-500 mb-1">Projected Margin</p>
                    <p className="font-bold text-green-700">₹{((selectedVehicle.price - selectedVehicle.cost) / 100000).toFixed(1)}L</p>
                  </div>
                  <div className="col-span-2 p-4 bg-blue-50/40 border border-blue-100 rounded-xl text-left">
                    <p className="text-xs font-bold text-blue-800 mb-1">Date of Receipt</p>
                    <p className="font-bold text-slate-900">{formatDate(selectedVehicle.createdAt)}</p>
                  </div>

                  {selectedVehicle.status === 'Sold' && (() => {
                    const allotment = getAllotmentDetails(selectedVehicle);
                    const saleAct = vehicleActivities.find(a => a.title === 'Vehicle Sold');
                    
                    if (isEditingAllotment) {
                      return (
                        <div className="col-span-2 p-5 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-4">
                          <div className="flex justify-between items-center border-b pb-2">
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Edit Allotment & Bank Details</h4>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={handleSaveAllotmentDetails}>Save</Button>
                              <Button size="sm" variant="secondary" onClick={() => setIsEditingAllotment(false)}>Cancel</Button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 bg-slate-100 p-2.5 rounded-xl flex gap-6">
                              <label className="flex items-center gap-2 text-[10px] font-black text-slate-700 cursor-pointer uppercase">
                                <input
                                  type="radio"
                                  name="editPaymentMethod"
                                  value="finance"
                                  checked={editPaymentMethod === 'finance'}
                                  onChange={() => setEditPaymentMethod('finance')}
                                  className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                                />
                                Finance (Bank Loan)
                              </label>
                              <label className="flex items-center gap-2 text-[10px] font-black text-slate-700 cursor-pointer uppercase">
                                <input
                                  type="radio"
                                  name="editPaymentMethod"
                                  value="cash"
                                  checked={editPaymentMethod === 'cash'}
                                  onChange={() => setEditPaymentMethod('cash')}
                                  className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                                />
                                Cash Sale
                              </label>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Actual Sale Price (NPR)</label>
                              <Input
                                type="number"
                                required
                                value={editSalePrice}
                                onChange={e => setEditSalePrice(e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Nepali Date (BS)</label>
                              <Input
                                required
                                value={editNepaliDate}
                                onChange={e => setEditNepaliDate(e.target.value)}
                              />
                            </div>

                            {editPaymentMethod === 'finance' && (
                              <>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Bank Name</label>
                                  <Input
                                    value={editBankName}
                                    onChange={e => setEditBankName(e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Bank Branch</label>
                                  <Input
                                    value={editBankBranch}
                                    onChange={e => setEditBankBranch(e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">RM Name</label>
                                  <Input
                                    value={editRmName}
                                    onChange={e => setEditRmName(e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">RM Contact Number</label>
                                  <Input
                                    value={editRmPhone}
                                    onChange={e => setEditRmPhone(e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Approved Loan Amount</label>
                                  <Input
                                    type="number"
                                    value={editApprovedLoan}
                                    onChange={e => setEditApprovedLoan(e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Amount Paid by Customer</label>
                                  <Input
                                    type="number"
                                    value={editAmountReceived}
                                    onChange={e => setEditAmountReceived(e.target.value)}
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="col-span-2 p-5 bg-emerald-50/40 border border-emerald-100 rounded-2xl text-left space-y-4">
                        <div className="flex justify-between items-center border-b border-emerald-100 pb-2">
                          <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider">Sale & Allotment Details</h4>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-[10px] h-7 px-2 font-bold cursor-pointer"
                            onClick={() => {
                              setEditBankName(allotment?.bankName || '');
                              setEditBankBranch(allotment?.bankBranch || '');
                              setEditRmName(allotment?.rmName || '');
                              setEditRmPhone(allotment?.rmPhone || '');
                              setEditApprovedLoan(allotment?.approvedLoan?.toString() || '');
                              setEditAmountReceived(allotment?.amountReceived?.toString() || '');
                              setEditSalePrice(selectedVehicle.price?.toString() || '');
                              setEditNepaliDate(allotment?.nepaliDate || '2083-  -  ');
                              setIsEditingAllotment(true);
                            }}
                          >
                            Edit Details
                          </Button>
                        </div>
                        
                        {allotment ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
                              <div>
                                <p className="text-slate-400 font-bold uppercase text-[10px]">Customer Name</p>
                                <p className="font-bold text-slate-900">{allotment.customerName || 'M/S —'}</p>
                                <p className="text-slate-500 font-medium">{allotment.customerPhone} {allotment.customerAddress ? `• ${allotment.customerAddress}` : ''}</p>
                              </div>
                              <div>
                                <p className="text-slate-400 font-bold uppercase text-[10px]">Actual Selling Price</p>
                                <p className="font-bold text-emerald-700">NPR {allotment.salePrice?.toLocaleString()}</p>
                                <p className="text-slate-500 font-medium">Allotted: {allotment.allotmentDate} {allotment.nepaliDate ? `(BS ${allotment.nepaliDate})` : ''}</p>
                              </div>
                              <div className="border-t border-slate-100 pt-2 col-span-2"></div>
                              <div>
                                <p className="text-slate-400 font-bold uppercase text-[10px]">Bank / Branch</p>
                                <p className="font-bold text-slate-900">{allotment.bankName || '—'} {allotment.bankBranch ? `(${allotment.bankBranch} Branch)` : ''}</p>
                              </div>
                              <div>
                                <p className="text-slate-400 font-bold uppercase text-[10px]">Relation Manager (RM)</p>
                                <p className="font-bold text-slate-900">{allotment.rmName || '—'}</p>
                                {allotment.rmPhone && <p className="text-slate-500 font-medium">{allotment.rmPhone}</p>}
                              </div>
                              <div className="border-t border-slate-100 pt-2 col-span-2"></div>
                              <div>
                                <p className="text-slate-400 font-bold uppercase text-[10px]">Approved Loan Amount</p>
                                <p className="font-bold text-slate-950">NPR {allotment.approvedLoan ? allotment.approvedLoan.toLocaleString() : '0'}</p>
                              </div>
                              <div>
                                <p className="text-slate-400 font-bold uppercase text-[10px]">Amount Paid by Customer</p>
                                <p className="font-bold text-slate-950">NPR {allotment.amountReceived ? allotment.amountReceived.toLocaleString() : '0'}</p>
                              </div>
                            </div>
                            
                            {/* Action Buttons for Document Generation */}
                            <div className="flex flex-wrap gap-2 pt-3 border-t border-emerald-100 print-hide">
                              <button
                                type="button"
                                onClick={() => {
                                  // Open GRN preview
                                  setDocGrnInvoiceNo(selectedVehicle.proformaInvoiceNo || 'MV-KTM-083-001');
                                  setDocGrnInvoiceDate(new Date(new Date(selectedVehicle.createdAt || Date.now()).getTime() - 8 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }));
                                  setDocGrnLcNo(selectedVehicle.lcNo || '26DCD2NPR077148');
                                  setDocGrnLcDate(new Date(new Date(selectedVehicle.createdAt || Date.now()).getTime() - 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }));
                                  setDocGrnBank(allotment.bankName || 'Nabil Bank Ltd');
                                  setDocGrnVatNo('610014662');
                                  setDocGrnDate(new Date(selectedVehicle.createdAt || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }));
                                  setDocAllotmentSalePrice(selectedVehicle.cost ? selectedVehicle.cost.toLocaleString() : '6,499,000');
                                  setPreviewDocType('grn');
                                }}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-lg transition-colors cursor-pointer"
                              >
                                Goods Received Note (GRN)
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  // Open Allotment Letter preview
                                  setDocNepaliDate(allotment.nepaliDate || '2083-  -  ');
                                  setDocBankName(allotment.bankName || 'Nabil Bank Ltd');
                                  setDocBankBranch(allotment.bankBranch || 'Naxal');
                                  setDocAllotmentCustomer(allotment.customerName || '');
                                  setDocAllotmentApprovedLoan(allotment.approvedLoan?.toString() || '0');
                                  setDocAllotmentAmountReceived(allotment.amountReceived?.toString() || '0');
                                  setDocAllotmentSalePrice(allotment.salePrice?.toString() || selectedVehicle.price?.toString() || '0');
                                  setPreviewDocType('allotment');
                                }}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-lg transition-colors cursor-pointer"
                              >
                                Allotment Letter
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  // Open Disbursement Letter preview
                                  setDocDate(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }));
                                  setDocBankName(allotment.bankName || 'Nabil Bank Ltd');
                                  setDocBankBranch(allotment.bankBranch || 'Naxal');
                                  setDocRmName(allotment.rmName || '');
                                  setDocRmPhone(allotment.rmPhone || '');
                                  setDocAllotmentCustomer(allotment.customerName || '');
                                  setDocAllotmentApprovedLoan(allotment.approvedLoan?.toString() || '0');
                                  setPreviewDocType('disbursement');
                                }}
                                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black rounded-lg transition-colors cursor-pointer"
                              >
                                Disbursement Letter
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-2">
                            <p className="text-xs text-slate-500 font-medium mb-2">No detailed allotment record found (from legacy sales).</p>
                            {saleAct && <p className="text-xs italic text-slate-400 mb-2">"{saleAct.description}"</p>}
                            <Button
                              size="sm"
                              onClick={() => {
                                setEditBankName('');
                                setEditBankBranch('');
                                setEditRmName('');
                                setEditRmPhone('');
                                setEditApprovedLoan('');
                                setEditAmountReceived('');
                                setEditSalePrice(selectedVehicle.price?.toString() || '');
                                setEditNepaliDate('2083-  -  ');
                                setIsEditingAllotment(true);
                              }}
                            >
                              Add Allotment Details
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  
                  <div className="col-span-2 p-4 bg-slate-50 rounded-xl text-left">
                    <p className="text-xs font-bold text-slate-500 mb-1">Vehicle Registration Number</p>
                    {isEditingReg ? (
                      <form onSubmit={handleUpdateReg} className="flex gap-2 items-center mt-1">
                        <Input
                          required
                          value={editReg}
                          onChange={(e) => setEditReg(e.target.value)}
                          placeholder="e.g. BA-12-PA-5678"
                          className="flex-1 py-1 text-xs"
                          autoFocus
                        />
                        <Button size="sm" type="submit">Save</Button>
                        <Button size="sm" variant="secondary" onClick={() => setIsEditingReg(false)}>Cancel</Button>
                      </form>
                    ) : (
                      <div className="flex justify-between items-center mt-1">
                        <p className="font-bold text-slate-900">{selectedVehicle.registrationNo || 'Not Registered'}</p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-[10px] h-7 px-2 font-bold cursor-pointer"
                          onClick={() => {
                            setEditReg(selectedVehicle.registrationNo || '');
                            setIsEditingReg(true);
                          }}
                        >
                          {selectedVehicle.registrationNo ? 'Edit' : 'Add Reg No'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {isSelling ? (
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    
                    let lead;
                    setIsSubmittingSale(true);
                    
                    try {
                      if (allotmentType === 'new') {
                        if (!newCustomerName || !newCustomerPhone) {
                          addToast('Customer Name and Phone are required.', 'warning');
                          setIsSubmittingSale(false);
                          return;
                        }
                        
                        // Create new lead/customer
                        lead = await createLead.mutateAsync({
                          name: newCustomerName,
                          phone: newCustomerPhone,
                          email: newCustomerEmail || undefined,
                          address: newCustomerAddress || undefined,
                          status: 'Delivered',
                          budget: parseFloat(salePrice) || selectedVehicle.price || 0,
                          modelInterest: selectedVehicle.model,
                          remarks: 'Created on the fly during vehicle allotment.'
                        });
                      } else {
                        if (!selectedLeadId) {
                          addToast('Please select a customer/lead to allot the vehicle.', 'warning');
                          setIsSubmittingSale(false);
                          return;
                        }
                        lead = leads.find(l => l.id === selectedLeadId);
                        if (!lead) {
                          addToast('Selected lead not found.', 'error');
                          setIsSubmittingSale(false);
                          return;
                        }
                        
                        // Update existing lead status to Delivered
                        await updateLead.mutateAsync({
                          id: lead.id,
                          patch: { 
                            status: 'Delivered', 
                            deliveryDate: new Date(saleDeliveryDate).toISOString() 
                          }
                        });
                      }

                      const finalPrice = parseFloat(salePrice) || selectedVehicle.price || 0;
                      
                      // Construct allotment details
                      const allotmentDetails = {
                        leadId: lead.id,
                        customerName: lead.name,
                        customerPhone: lead.phone,
                        customerEmail: lead.email || '',
                        customerAddress: lead.address || '',
                        salePrice: finalPrice,
                        allotmentDate: new Date(saleDeliveryDate).toISOString().split('T')[0],
                        nepaliDate: nepaliDate,
                        amountReceived: parseFloat(amountReceived) || 0,
                        approvedLoan: parseFloat(approvedLoan) || 0,
                        bankName: bankName,
                        bankBranch: bankBranch,
                        rmName: rmName,
                        rmPhone: rmPhone,
                        paymentMethod: paymentMethod
                      };

                      const oldSpecs = selectedVehicle.specifications || [];
                      const newSpecs = [
                        ...oldSpecs.filter((s: any) => s.label !== 'allotment_details'),
                        { label: 'allotment_details', value: JSON.stringify(allotmentDetails) }
                      ];

                      // Update vehicle status
                      await updateVehicle.mutateAsync({
                        id: selectedVehicle.id,
                        patch: { 
                          status: 'Sold', 
                          price: finalPrice,
                          specifications: newSpecs
                        }
                      });

                      // Create or update customer profile in public.customers
                      try {
                        const { data: existingCustomer } = await supabase
                          .from('customers')
                          .select('*')
                          .eq('phone', lead.phone)
                          .maybeSingle();

                        const newCarItem = {
                          model: selectedVehicle.model,
                          plate: selectedVehicle.registrationNo || '',
                          status: 'Active',
                          vin: selectedVehicle.vin,
                          paymentMethod: paymentMethod,
                          checklist: paymentMethod === 'cash' ? {
                            insuranceActivated: false,
                            registered: false,
                            vatBillIssued: false,
                            contactedRamLakhanAndCustomer: false
                          } : {
                            insuranceActivated: false,
                            allotmentLetterWritten: false,
                            registrationCoordinated: false,
                            insuranceEndorsed: false,
                            disbursementLetterWritten: false
                          }
                        };

                        if (existingCustomer) {
                          const updatedCars = [...(Array.isArray(existingCustomer.cars_owned) ? (existingCustomer.cars_owned as any[]) : [])];
                          const carIndex = updatedCars.findIndex((c: any) => c.vin === selectedVehicle.vin);
                          if (carIndex >= 0) {
                            updatedCars[carIndex] = { ...updatedCars[carIndex], ...newCarItem };
                          } else {
                            updatedCars.push(newCarItem);
                          }
                          const updatedLtv = (existingCustomer.ltv || 0) + finalPrice;

                          await supabase
                            .from('customers')
                            .update({
                              cars_owned: updatedCars,
                              ltv: updatedLtv,
                              email: lead.email || existingCustomer.email || '',
                              location: lead.address || existingCustomer.location || '',
                              name: lead.name || existingCustomer.name
                            })
                            .eq('id', existingCustomer.id);
                        } else {
                          await supabase
                            .from('customers')
                            .insert({
                              name: lead.name,
                              phone: lead.phone,
                              email: lead.email || '',
                              location: lead.address || '',
                              ltv: finalPrice,
                              cars_owned: [newCarItem],
                              referrals: 0,
                              org_id: user?.orgId || null,
                              branch_id: user?.branchId || null
                            });
                        }
                      } catch (custErr) {
                        console.error('Failed to create/update customer record:', custErr);
                      }

                      // Log activity for lead
                      try {
                        await createActivity.mutateAsync({
                          entityId: lead.id,
                          entityType: 'LEAD',
                          kind: 'SYSTEM',
                          title: 'Vehicle Delivered & Deal Closed',
                          description: `Delivered ${selectedVehicle.model} ${selectedVehicle.variant} (${selectedVehicle.color}) [VIN: ${selectedVehicle.vin}] to ${lead.name} for an actual selling price of NPR ${finalPrice.toLocaleString()}.`,
                          createdBy: user?.id,
                          orgId: user?.orgId || undefined
                        } as any);
                      } catch (err) {
                        console.warn('Lead activity log failed:', err);
                      }

                      // Log activity for vehicle
                      try {
                        await createActivity.mutateAsync({
                          entityId: selectedVehicle.id,
                          entityType: 'VEHICLE',
                          kind: 'SYSTEM',
                          title: 'Vehicle Sold & Allotted',
                          description: `Sold to ${lead.name} (Phone: ${lead.phone}) for NPR ${finalPrice.toLocaleString()} on ${new Date(saleDeliveryDate).toLocaleDateString()}. Bank: ${bankName || 'N/A'}.`,
                          createdBy: user?.id,
                          orgId: user?.orgId || undefined
                        } as any);
                      } catch (err) {
                        console.warn('Vehicle activity log failed:', err);
                      }

                      addToast(`Vehicle sold and allotted to ${lead.name}!`, 'success');
                      setSelectedVehicle({ 
                        ...selectedVehicle, 
                        status: 'Sold',
                        price: finalPrice,
                        specifications: newSpecs
                      });
                      setIsDetailsOpen(false);
                    } catch (err) {
                      console.error('Sale confirmation failed:', err);
                      addToast('Failed to complete sale.', 'error');
                    } finally {
                      setIsSubmittingSale(false);
                    }
                  }} className="space-y-4 border-t pt-4 text-left max-h-[50vh] overflow-y-auto pr-2">
                    <h4 className="text-sm font-bold text-slate-800">Allot Vehicle to Customer</h4>
                    
                    <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-4">
                      <button
                        type="button"
                        onClick={() => setAllotmentType('existing')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${allotmentType === 'existing' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                      >
                        Existing Pipeline Lead
                      </button>
                      <button
                        type="button"
                        onClick={() => setAllotmentType('new')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${allotmentType === 'new' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                      >
                        Create New Customer
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {allotmentType === 'existing' ? (
                        <div className="col-span-2">
                          <label className="block text-xs font-bold text-slate-600 mb-2">Select Active Lead *</label>
                          <Select
                            required
                            value={selectedLeadId}
                            onChange={(e) => setSelectedLeadId(e.target.value)}
                            options={[
                              { label: 'Choose a customer/lead in pipeline...', value: '' },
                              ...leads
                                .filter(l => l.status !== 'Dropout' && l.status !== 'Cancelled')
                                .map(l => ({
                                  label: `${l.name} (${l.phone}) - Interested in ${l.modelInterest}${l.status === 'Delivered' ? ' (Delivered)' : ''}`,
                                  value: l.id
                                }))
                            ]}
                          />
                        </div>
                      ) : (
                        <>
                          <div className="col-span-2 md:col-span-1">
                            <label className="block text-xs font-bold text-slate-600 mb-2">Customer Full Name *</label>
                            <Input
                              required
                              value={newCustomerName}
                              onChange={(e) => setNewCustomerName(e.target.value)}
                              placeholder="e.g. M/S Acme Corp / John Doe"
                            />
                          </div>
                          <div className="col-span-2 md:col-span-1">
                            <label className="block text-xs font-bold text-slate-600 mb-2">Phone Number *</label>
                            <Input
                              required
                              value={newCustomerPhone}
                              onChange={(e) => setNewCustomerPhone(e.target.value)}
                              placeholder="e.g. +977-9851XXXXXX"
                            />
                          </div>
                          <div className="col-span-2 md:col-span-1">
                            <label className="block text-xs font-bold text-slate-600 mb-2">Email Address</label>
                            <Input
                              type="email"
                              value={newCustomerEmail}
                              onChange={(e) => setNewCustomerEmail(e.target.value)}
                              placeholder="e.g. client@example.com"
                            />
                          </div>
                          <div className="col-span-2 md:col-span-1">
                            <label className="block text-xs font-bold text-slate-600 mb-2">Location/Address</label>
                            <Input
                              value={newCustomerAddress}
                              onChange={(e) => setNewCustomerAddress(e.target.value)}
                              placeholder="e.g. Biratnagar, Nepal"
                            />
                          </div>
                        </>
                      )}

                      <div className="col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-100 mb-2">
                        <label className="block text-xs font-black text-slate-600 mb-2 uppercase tracking-wider">Payment Method *</label>
                        <div className="flex gap-6">
                          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="finance"
                              checked={paymentMethod === 'finance'}
                              onChange={() => setPaymentMethod('finance')}
                              className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                            />
                            Finance (Bank Loan)
                          </label>
                          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="cash"
                              checked={paymentMethod === 'cash'}
                              onChange={() => setPaymentMethod('cash')}
                              className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                            />
                            Cash Sale
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-2">Actual Selling Price (NPR) *</label>
                        <Input
                          type="number"
                          required
                          value={salePrice}
                          onChange={(e) => setSalePrice(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-2">Delivery Date *</label>
                        <Input
                          type="date"
                          required
                          value={saleDeliveryDate}
                          onChange={(e) => setSaleDeliveryDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-2">Nepali Date (BS) *</label>
                        <Input
                          required
                          value={nepaliDate}
                          onChange={(e) => setNepaliDate(e.target.value)}
                          placeholder="e.g. 2083-02-15"
                        />
                      </div>

                      {paymentMethod === 'finance' && (
                        <>
                          <div className="col-span-2 border-t pt-4 mt-2">
                            <h5 className="text-xs font-black text-slate-700 mb-1 uppercase tracking-wider">Bank Allotment Details</h5>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-600 mb-2">Bank Name</label>
                            <Input
                              value={bankName}
                              onChange={(e) => setBankName(e.target.value)}
                              placeholder="e.g. Nabil Bank Ltd."
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-600 mb-2">Bank Branch</label>
                            <Input
                              value={bankBranch}
                              onChange={(e) => setBankBranch(e.target.value)}
                              placeholder="e.g. Biratnagar"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-600 mb-2">Relation Manager Name</label>
                            <Input
                              value={rmName}
                              onChange={(e) => setRmName(e.target.value)}
                              placeholder="e.g. Ram Lakhan Sah"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-600 mb-2">RM Contact Number</label>
                            <Input
                              value={rmPhone}
                              onChange={(e) => setRmPhone(e.target.value)}
                              placeholder="e.g. +977-9851090652"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-600 mb-2">Approved Loan Amount (NPR)</label>
                            <Input
                              type="number"
                              value={approvedLoan}
                              onChange={(e) => setApprovedLoan(e.target.value)}
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-600 mb-2">Amount Paid by Customer (NPR)</label>
                            <Input
                              type="number"
                              value={amountReceived}
                              onChange={(e) => setAmountReceived(e.target.value)}
                              placeholder="0"
                            />
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex gap-3 pt-4 border-t sticky bottom-0 bg-white z-10">
                      <Button
                        type="submit"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white border-green-600"
                        isLoading={isSubmittingSale}
                      >
                        Confirm Sale & Allot
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsSelling(false)}
                        disabled={isSubmittingSale}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex gap-4 mt-4 shrink-0">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsDetailsOpen(false)} 
                      className="flex-1"
                    >
                      Close
                    </Button>
                    {selectedVehicle.status !== 'Sold' && (
                      <Button
                        onClick={() => {
                          setSalePrice(selectedVehicle.price?.toString() || '');
                          setSaleDeliveryDate(new Date().toISOString().split('T')[0]);
                          setIsSelling(true);
                        }}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white border-red-600"
                      >
                        Mark as Sold
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {isUpdatingPrice && selectedVehicle && !isAddStockOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full">
            <div className="p-6">
              <h3 className="text-lg font-black text-slate-900 mb-1">Update Price</h3>
              <p className="text-xs font-bold text-slate-400 mb-6 uppercase tracking-widest">{selectedVehicle.model}</p>
              
              <form onSubmit={handleUpdatePrice} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">New Selling Price (NPR) *</label>
                  <Input 
                    type="number" 
                    required 
                    autoFocus
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    placeholder="e.g. 5200000"
                  />
                  <p className="text-[10px] text-slate-400 mt-2 font-medium">Current: ₹{(selectedVehicle.price / 100000).toFixed(2)}L</p>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <Button type="button" variant="secondary" onClick={() => setIsUpdatingPrice(false)} className="flex-1">Cancel</Button>
                  <Button type="submit" className="flex-1" isLoading={updateVehicle.isPending}>Update</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Set Offer Modal */}
      {isOfferOpen && selectedVehicle && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black">Set Special Offer</h2>
                <p className="text-green-100 text-sm mt-1">{selectedVehicle.model}</p>
              </div>
              <button onClick={() => setIsOfferOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSetOffer} className="p-6 space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs font-bold text-slate-500 mb-1">Current Price</p>
                <p className="text-2xl font-black text-slate-900">₹{(selectedVehicle.price / 100000).toFixed(1)}L</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">Discount Type *</label>
                <select required className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none">
                  <option value="flat">Flat Discount</option>
                  <option value="percent">Percentage Discount</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">Discount Amount *</label>
                <input type="number" required className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none" placeholder="50000" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">Offer Valid Until</label>
                <input type="date" className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none" />
              </div>

              <div className="flex gap-3 mt-6 pt-6 border-t">
                <Button type="button" variant="secondary" onClick={() => setIsOfferOpen(false)} className="flex-1">Cancel</Button>
                <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">Set Offer</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Preview Portal */}
      {previewDocType && selectedVehicle && createPortal(
        <div id="document-preview-portal" className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-100 rounded-3xl shadow-2xl max-w-5xl w-full max-h-[95vh] flex flex-col overflow-hidden text-slate-700 portal-modal-content">
            {/* Header Controls */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0 print-hide">
              <div>
                <h3 className="text-lg font-black">
                  {previewDocType === 'grn' && 'Preview: Goods Received Note (GRN)'}
                  {previewDocType === 'allotment' && 'Preview: Bank Allotment Letter'}
                  {previewDocType === 'disbursement' && 'Preview: Loan Disbursement Letter'}
                </h3>
                <p className="text-slate-400 text-xs">Edit any dotted field directly in the letter before printing</p>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  onClick={() => window.print()}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-4 py-2 border-none cursor-pointer"
                >
                  Print / Save PDF
                </Button>
                <button 
                  onClick={() => setPreviewDocType(null)} 
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors cursor-pointer text-slate-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Document Content Canvas */}
            <div className="p-6 md:p-12 overflow-y-auto flex-1 flex justify-center bg-slate-200 print-bg-white">
              <div 
                id="printable-document-area" 
                className="bg-white text-black w-[21cm] min-h-[29.7cm] p-[2.5cm] shadow-lg font-serif leading-relaxed text-sm relative border border-slate-300 print-no-shadow"
              >
                {/* Print Stylesheet */}
                <style>{`
                  @media print {
                    body * {
                      visibility: hidden !important;
                    }
                    #document-preview-portal, #document-preview-portal * {
                      visibility: visible !important;
                    }
                    #document-preview-portal {
                      position: absolute !important;
                      left: 0 !important;
                      top: 0 !important;
                      width: 100% !important;
                      margin: 0 !important;
                      padding: 0 !important;
                      overflow: visible !important;
                      background: white !important;
                    }
                    .print-hide, .print-hide * {
                      display: none !important;
                    }
                    .portal-modal-content {
                      border-radius: 0 !important;
                      box-shadow: none !important;
                      max-height: none !important;
                      overflow: visible !important;
                      background: white !important;
                      width: 100% !important;
                      max-width: none !important;
                    }
                    .print-bg-white {
                      background: white !important;
                      padding: 0 !important;
                    }
                    #printable-document-area {
                      display: block !important;
                      position: absolute !important;
                      left: 0 !important;
                      top: 0 !important;
                      width: 100% !important;
                      margin: 0 !important;
                      padding: 1.5cm !important;
                      border: none !important;
                      box-shadow: none !important;
                      background: white !important;
                      font-size: 11pt !important;
                    }
                    .print-input-inline {
                      border: none !important;
                      background: transparent !important;
                      padding: 0 !important;
                      outline: none !important;
                      box-shadow: none !important;
                      font-family: inherit !important;
                      font-size: inherit !important;
                      color: black !important;
                      display: inline-block !important;
                      width: auto !important;
                    }
                  }
                  .doc-input {
                    border-bottom: 1px dashed #cbd5e1;
                    background-color: #f8fafc;
                    padding: 2px 4px;
                    outline: none;
                    font-family: inherit;
                    font-size: inherit;
                    color: #1e293b;
                    transition: all 0.2s;
                  }
                  .doc-input:focus {
                    border-bottom-color: #3b82f6;
                    background-color: #eff6ff;
                  }
                `}</style>

                {previewDocType === 'grn' && (
                  <div className="space-y-8 h-full flex flex-col justify-between">
                    <div>
                      {/* Date */}
                      <div className="text-right">
                        <span className="font-bold">Date: - </span>
                        <input 
                          type="text" 
                          value={docGrnDate}
                          onChange={e => setDocGrnDate(e.target.value)}
                          className="doc-input print-input-inline w-44 text-right"
                          placeholder="e.g. 21st May 2026"
                        />
                      </div>

                      {/* Recipient */}
                      <div className="mt-8 space-y-1 font-bold">
                        <p>TO,</p>
                        <p>MAW VRIDDHI AUTOCORP PVT LTD</p>
                        <p>Naxal, Kathmandu</p>
                      </div>

                      {/* Subject */}
                      <div className="text-center mt-12 mb-8">
                        <h2 className="text-base font-black underline uppercase tracking-wide">Subject: - Goods Received Note (GRN)</h2>
                      </div>

                      {/* Letter Body */}
                      <div className="mt-6 text-justify leading-relaxed text-sm">
                        This is to certify that we have received the below mentioned vehicles as per the pro forma invoice number{' '}
                        <input 
                          type="text" 
                          value={docGrnInvoiceNo}
                          onChange={e => setDocGrnInvoiceNo(e.target.value)}
                          className="doc-input print-input-inline w-44 text-center font-bold"
                          placeholder="Pro Forma Invoice No"
                        />{' '}
                        Dated on{' '}
                        <input 
                          type="text" 
                          value={docGrnInvoiceDate}
                          onChange={e => setDocGrnInvoiceDate(e.target.value)}
                          className="doc-input print-input-inline w-36 text-center font-bold"
                          placeholder="Invoice Date"
                        />{' '}
                        from MAW Vriddhi Autocorp Pvt Ltd (VAT No: 610014662) under the LC no.{' '}
                        <input 
                          type="text" 
                          value={docGrnLcNo}
                          onChange={e => setDocGrnLcNo(e.target.value)}
                          className="doc-input print-input-inline w-44 text-center font-bold"
                          placeholder="LC Number"
                        />{' '}
                        dated{' '}
                        <input 
                          type="text" 
                          value={docGrnLcDate}
                          onChange={e => setDocGrnLcDate(e.target.value)}
                          className="doc-input print-input-inline w-36 text-center font-bold"
                          placeholder="LC Date"
                        />{' '}
                        of{' '}
                        <input 
                          type="text" 
                          value={docGrnBank}
                          onChange={e => setDocGrnBank(e.target.value)}
                          className="doc-input print-input-inline w-44 text-center font-bold"
                          placeholder="LC Issuing Bank"
                        />{' '}
                        on account of Apollo Motors Pvt. Ltd. (VAT No:{' '}
                        <input 
                          type="text" 
                          value={docGrnVatNo}
                          onChange={e => setDocGrnVatNo(e.target.value)}
                          className="doc-input print-input-inline w-32 text-center font-bold"
                          placeholder="Apollo VAT No"
                        />
                        ).
                      </div>

                      <p className="mt-6 font-bold">
                        Further we have declared that the vehicle was received on good condition and freight as prepaid.
                      </p>

                      {/* Inventory Item Table */}
                      <table className="w-full mt-10 border-collapse border border-slate-300 text-xs text-left">
                        <thead>
                          <tr className="bg-slate-50 font-bold border-b border-slate-300">
                            <th className="border border-slate-300 px-3 py-2 text-center w-10">S. n</th>
                            <th className="border border-slate-300 px-3 py-2">Vehicle Model</th>
                            <th className="border border-slate-300 px-3 py-2">Motor No</th>
                            <th className="border border-slate-300 px-3 py-2">Chassis No</th>
                            <th className="border border-slate-300 px-3 py-2 w-20">Color</th>
                            <th className="border border-slate-300 px-3 py-2 w-24">Received Date</th>
                            <th className="border border-slate-300 px-3 py-2 text-right w-28">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-slate-200">
                            <td className="border border-slate-300 px-3 py-3 text-center">1</td>
                            <td className="border border-slate-300 px-3 py-3 font-bold">{selectedVehicle.model} {selectedVehicle.variant}</td>
                            <td className="border border-slate-300 px-3 py-3 font-mono">{selectedVehicle.motorNo || 'N/A'}</td>
                            <td className="border border-slate-300 px-3 py-3 font-mono">{selectedVehicle.vin}</td>
                            <td className="border border-slate-300 px-3 py-3">{selectedVehicle.color}</td>
                            <td className="border border-slate-300 px-3 py-3">{new Date(selectedVehicle.createdAt || Date.now()).toLocaleDateString('en-GB')}</td>
                            <td className="border border-slate-300 px-3 py-3 text-right font-bold">
                              NPR{' '}
                              <input 
                                type="text"
                                value={docAllotmentSalePrice}
                                onChange={e => setDocAllotmentSalePrice(e.target.value)}
                                className="doc-input print-input-inline w-28 text-right font-bold"
                              />
                              /-
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Signatures */}
                    <div className="mt-24 pt-12 flex justify-between items-end">
                      <div className="space-y-4">
                        <p className="font-bold">.........................................</p>
                        <p className="font-bold text-slate-800 uppercase tracking-wide">Stamp</p>
                        <p className="text-xs text-slate-500 font-bold">Ltd.</p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="font-bold">Regards, With Official</p>
                        <p className="font-black text-slate-900 mt-6 pt-4">Urmila Bishwokarma</p>
                        <p className="text-slate-600 font-medium text-xs">Accounts Manager</p>
                        <p className="font-bold text-xs">Apollo Motors Pvt. Ltd.</p>
                      </div>
                    </div>
                  </div>
                )}

                {previewDocType === 'allotment' && (
                  <div className="space-y-6">
                    {/* Date */}
                    <div>
                      <span className="font-bold">Date: - </span>
                      <input 
                        type="text" 
                        value={docNepaliDate}
                        onChange={e => setDocNepaliDate(e.target.value)}
                        className="doc-input print-input-inline w-44 font-bold"
                        placeholder="Nepali Date (BS 2083- - )"
                      />
                    </div>

                    {/* Recipient */}
                    <div className="space-y-1">
                      <p className="font-bold">To,</p>
                      <p className="font-bold">The Manager</p>
                      <p className="font-bold">
                        <input 
                          type="text" 
                          value={docBankName}
                          onChange={e => setDocBankName(e.target.value)}
                          className="doc-input print-input-inline w-[300px] font-bold"
                          placeholder="Bank Name"
                        />
                      </p>
                      <p className="font-bold">
                        <input 
                          type="text" 
                          value={docBankBranch}
                          onChange={e => setDocBankBranch(e.target.value)}
                          className="doc-input print-input-inline w-[300px] font-bold"
                          placeholder="Branch Name"
                        /> Branch
                      </p>
                    </div>

                    {/* Subject */}
                    <div className="mt-8">
                      <h3 className="font-black text-sm uppercase underline">Subject: Allotment Letter</h3>
                    </div>

                    {/* Greeting */}
                    <div>
                      <p className="font-bold">Dear Sir/Mam,</p>
                    </div>

                    {/* Body */}
                    <p className="text-justify leading-relaxed">
                      Here, we have allotted the following vehicle for{' '}
                      <input 
                        type="text" 
                        value={docAllotmentCustomer}
                        onChange={e => setDocAllotmentCustomer(e.target.value)}
                        className="doc-input print-input-inline w-[350px] font-bold"
                        placeholder="Customer Name"
                      />
                      . Kindly get the attached details and proceed for the ownership transfer as request.
                    </p>

                    <p className="font-bold uppercase tracking-wider text-xs border-b pb-1 mt-4">Name of customer : M/S {docAllotmentCustomer}</p>

                    {/* Vehicle Details Table */}
                    <div>
                      <h4 className="font-bold underline text-xs uppercase mb-2">Vehicle Details</h4>
                      <table className="w-full border-collapse border border-slate-300 text-xs">
                        <tbody>
                          <tr>
                            <td className="border border-slate-300 px-4 py-2 font-bold bg-slate-50 w-48">Model</td>
                            <td className="border border-slate-300 px-4 py-2 font-bold">{selectedVehicle.model} {selectedVehicle.variant}</td>
                          </tr>
                          <tr>
                            <td className="border border-slate-300 px-4 py-2 font-bold bg-slate-50">Chassis Number</td>
                            <td className="border border-slate-300 px-4 py-2 font-mono font-bold">{selectedVehicle.vin}</td>
                          </tr>
                          <tr>
                            <td className="border border-slate-300 px-4 py-2 font-bold bg-slate-50">Engine Number</td>
                            <td className="border border-slate-300 px-4 py-2 font-mono font-bold">{selectedVehicle.motorNo || 'N/A'}</td>
                          </tr>
                          <tr>
                            <td className="border border-slate-300 px-4 py-2 font-bold bg-slate-50">Color</td>
                            <td className="border border-slate-300 px-4 py-2 font-bold">{selectedVehicle.color}</td>
                          </tr>
                          <tr>
                            <td className="border border-slate-300 px-4 py-2 font-bold bg-slate-50">Regd No</td>
                            <td className="border border-slate-300 px-4 py-2 font-bold">{selectedVehicle.registrationNo || 'Not Registered'}</td>
                          </tr>
                          <tr>
                            <td className="border border-slate-300 px-4 py-2 font-bold bg-slate-50">Sale Price</td>
                            <td className="border border-slate-300 px-4 py-2 font-bold">
                              NPR{' '}
                              <input 
                                type="text" 
                                value={docAllotmentSalePrice}
                                onChange={e => setDocAllotmentSalePrice(e.target.value)}
                                className="doc-input print-input-inline w-40 font-bold"
                              />
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-slate-300 px-4 py-2 font-bold bg-slate-50">Amount received from customer</td>
                            <td className="border border-slate-300 px-4 py-2 font-bold text-emerald-800">
                              NPR{' '}
                              <input 
                                type="text" 
                                value={docAllotmentAmountReceived}
                                onChange={e => setDocAllotmentAmountReceived(e.target.value)}
                                className="doc-input print-input-inline w-40 font-bold"
                              />
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-slate-300 px-4 py-2 font-bold bg-slate-50">Approved loan from customer</td>
                            <td className="border border-slate-300 px-4 py-2 font-bold text-blue-800">
                              NPR{' '}
                              <input 
                                type="text" 
                                value={docAllotmentApprovedLoan}
                                onChange={e => setDocAllotmentApprovedLoan(e.target.value)}
                                className="doc-input print-input-inline w-40 font-bold"
                              />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <p className="text-justify leading-relaxed">
                      We request to arrange for the ownership transfer of the above-mentioned vehicle in your bank name and proceed for the disbursement of approved amount.
                    </p>

                    <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl leading-relaxed text-xs">
                      <p className="font-bold">Note:</p>
                      Ownership transfer will be done in Transport Management Office, Biratnagar. For that purpose kindly contact our yatayat representative{' '}
                      <span className="font-bold">Ram Lakhan Sah</span> (Contact No. <span className="font-bold">+977-9851090652</span>)
                    </div>

                    {/* Footer */}
                    <div className="pt-8 text-right space-y-1">
                      <p className="font-bold">Best Regard</p>
                      <p className="font-black text-slate-900 mt-6 pt-4">Urmila Bishwokarma</p>
                      <p className="font-bold text-xs">Apollo Motors Pvt. Ltd.</p>
                      <p className="text-slate-500 font-medium text-xs">+9779712066053</p>
                    </div>
                  </div>
                )}

                {previewDocType === 'disbursement' && (
                  <div className="space-y-6">
                    {/* Date */}
                    <div>
                      <span className="font-bold">Date: - </span>
                      <input 
                        type="text" 
                        value={docDate}
                        onChange={e => setDocDate(e.target.value)}
                        className="doc-input print-input-inline w-44 font-bold"
                      />
                    </div>

                    {/* Recipient */}
                    <div className="space-y-1">
                      <p className="font-bold">To,</p>
                      <p className="font-bold">The Manager</p>
                      <p className="font-bold">
                        <input 
                          type="text" 
                          value={docBankName}
                          onChange={e => setDocBankName(e.target.value)}
                          className="doc-input print-input-inline w-[300px] font-bold"
                          placeholder="Bank Name"
                        />
                      </p>
                      <p className="font-bold">
                        <input 
                          type="text" 
                          value={docBankBranch}
                          onChange={e => setDocBankBranch(e.target.value)}
                          className="doc-input print-input-inline w-[300px] font-bold"
                          placeholder="Branch Name"
                        /> Branch
                      </p>
                    </div>

                    {/* Subject */}
                    <div className="mt-8">
                      <h3 className="font-black text-sm uppercase underline">Subject: Request for Loan Disbursement</h3>
                    </div>

                    {/* Greeting */}
                    <div>
                      <p className="font-bold">Dear Sir/Madam,</p>
                    </div>

                    {/* Body */}
                    <p className="text-justify leading-relaxed">
                      With reference to the Allotment Letter issued for the vehicle detailed below, we would like to inform you that the vehicle ownership transfer has been completed in the bank's name. We request you to kindly disburse the approved loan amount of NPR{' '}
                      <span className="font-bold">{parseFloat(docAllotmentApprovedLoan || '0').toLocaleString()}</span>{' '}
                      in favor of Apollo Motors Pvt. Ltd. to our bank account specified below.
                    </p>

                    {/* Details Table */}
                    <div>
                      <table className="w-full border-collapse border border-slate-300 text-xs">
                        <tbody>
                          <tr>
                            <td className="border border-slate-300 px-4 py-2 font-bold bg-slate-50 w-48">Name of Customer</td>
                            <td className="border border-slate-300 px-4 py-2 font-bold">M/S {docAllotmentCustomer}</td>
                          </tr>
                          <tr>
                            <td className="border border-slate-300 px-4 py-2 font-bold bg-slate-50">Vehicle Model</td>
                            <td className="border border-slate-300 px-4 py-2 font-bold">{selectedVehicle.model} {selectedVehicle.variant}</td>
                          </tr>
                          <tr>
                            <td className="border border-slate-300 px-4 py-2 font-bold bg-slate-50">Chassis Number</td>
                            <td className="border border-slate-300 px-4 py-2 font-mono font-bold">{selectedVehicle.vin}</td>
                          </tr>
                          <tr>
                            <td className="border border-slate-300 px-4 py-2 font-bold bg-slate-50">Engine Number</td>
                            <td className="border border-slate-300 px-4 py-2 font-mono font-bold">{selectedVehicle.motorNo || 'N/A'}</td>
                          </tr>
                          <tr>
                            <td className="border border-slate-300 px-4 py-2 font-bold bg-slate-50">Registration Number</td>
                            <td className="border border-slate-300 px-4 py-2 font-bold">{selectedVehicle.registrationNo || 'Not Registered'}</td>
                          </tr>
                          <tr>
                            <td className="border border-slate-300 px-4 py-2 font-bold bg-slate-50 text-blue-800">Approved Loan Amount</td>
                            <td className="border border-slate-300 px-4 py-2 font-bold text-blue-800">NPR {parseFloat(docAllotmentApprovedLoan || '0').toLocaleString()}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Account Info */}
                    <div>
                      <h4 className="font-bold underline text-xs uppercase mb-2">Bank Account Details for Disbursement</h4>
                      <table className="w-full border-collapse border border-slate-300 text-xs">
                        <tbody>
                          <tr>
                            <td className="border border-slate-300 px-4 py-2 font-bold bg-slate-50 w-48">Account Name</td>
                            <td className="border border-slate-300 px-4 py-2 font-bold">Apollo Motors Pvt. Ltd.</td>
                          </tr>
                          <tr>
                            <td className="border border-slate-300 px-4 py-2 font-bold bg-slate-50">Account Number</td>
                            <td className="border border-slate-300 px-4 py-2 font-mono font-bold">01020304050607</td>
                          </tr>
                          <tr>
                            <td className="border border-slate-300 px-4 py-2 font-bold bg-slate-50">Bank Name</td>
                            <td className="border border-slate-300 px-4 py-2 font-bold">Nabil Bank Ltd.</td>
                          </tr>
                          <tr>
                            <td className="border border-slate-300 px-4 py-2 font-bold bg-slate-50">Branch</td>
                            <td className="border border-slate-300 px-4 py-2 font-bold">Naxal Branch, Kathmandu</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <p className="text-justify leading-relaxed">
                      Should you require any further information, please feel free to contact us or your Relation Manager{' '}
                      <input 
                        type="text" 
                        value={docRmName}
                        onChange={e => setDocRmName(e.target.value)}
                        className="doc-input print-input-inline w-44 font-bold"
                        placeholder="RM Name"
                      />{' '}
                      (Contact:{' '}
                      <input 
                        type="text" 
                        value={docRmPhone}
                        onChange={e => setDocRmPhone(e.target.value)}
                        className="doc-input print-input-inline w-40 font-bold"
                        placeholder="RM Contact Number"
                      />
                      ).
                    </p>

                    {/* Footer */}
                    <div className="pt-8 text-right space-y-1">
                      <p className="font-bold">Best Regards,</p>
                      <p className="font-black text-slate-900 mt-6 pt-4">Urmila Bishwokarma</p>
                      <p className="text-slate-600 font-medium text-xs">Accounts Manager</p>
                      <p className="font-bold text-xs">Apollo Motors Pvt. Ltd.</p>
                      <p className="text-slate-500 font-medium text-xs">+9779712066053</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default Inventory;
