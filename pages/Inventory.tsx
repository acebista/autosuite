import React, { useState } from 'react';
import { useInventory, useCreateVehicle, useUpdateVehicle } from '../api';
import { PageHeader, Card, Badge, Button, Skeleton, useToast, Input, Select } from '../UI';
import { PRODUCT_CATALOG } from '../constants';
import { Tag, Info, DollarSign, AlertCircle, X, Plus, Palette, Check, Car } from 'lucide-react';
import { Vehicle } from '../types';

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
        <div className="absolute top-3 left-3">
          <Badge variant={car.status === 'In Stock' ? 'success' : 'warning'}>{car.status}</Badge>
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

        {/* Interactive Color Selector */}
        {car.availableColors && car.availableColors.length > 0 && (
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

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            icon={Info}
            onClick={() => onDetailsClick(car)}
          >
            Details
          </Button>
          <Button
            size="sm"
            className="flex-1"
            icon={DollarSign}
            onClick={() => onOfferClick(car)}
          >
            Set Offer
          </Button>
        </div>
      </div>
    </Card>
  );
};

const Inventory: React.FC = () => {
  const { data: vehicles = [], isLoading } = useInventory();
  const createVehicle = useCreateVehicle();
  const { addToast } = useToast();
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isOfferOpen, setIsOfferOpen] = useState(false);
  const [detailsPreviewColor, setDetailsPreviewColor] = useState<string>('');
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);
  const updateVehicle = useUpdateVehicle();
  const [editPrice, setEditPrice] = useState<string>('');

  // Form state for adding stock
  const [newVehicle, setNewVehicle] = useState<Partial<Vehicle>>({
    model: '', variant: '', vin: '', year: 2025, color: '', fuelType: 'EV', cost: 0, price: 0
  });

  const catalogModels = Array.from(new Set(PRODUCT_CATALOG.map(v => v.model)));
  const variantsForModel = PRODUCT_CATALOG.filter(v => v.model === newVehicle.model);

  const handleModelChange = (model: string) => {
    setNewVehicle({ ...newVehicle, model, variant: '', fuelType: 'EV', price: 0, cost: 0 });
  };

  const handleVariantChange = (variant: string) => {
    const selected = PRODUCT_CATALOG.find(v => v.model === newVehicle.model && v.variant === variant);
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

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-12 w-1/4" /><Skeleton className="h-96" /></div>;

  const totalUnits = vehicles.length;
  const stuckStock = vehicles.filter(v => v.daysInStock > 60).length;
  const inventoryValue = vehicles.reduce((sum, v) => sum + (v.cost || 0), 0);
  const projectedMargin = vehicles.reduce((sum, v) => sum + ((v.price || 0) - (v.cost || 0)), 0);

  const getAgingColor = (bucket: string) => {
    switch (bucket) {
      case '90+': return 'bg-red-50 text-red-700 border-red-200';
      case '61-90': return 'bg-orange-50 text-orange-700 border-orange-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createVehicle.mutateAsync(newVehicle);
      addToast('Vehicle added to inventory successfully!', 'success');
      setIsAddStockOpen(false);
      setNewVehicle({ model: '', variant: '', vin: '', year: 2024, color: '', fuelType: 'Petrol', cost: 0, price: 0 });
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

        {vehicles.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-20 text-center border-dashed border-2 bg-slate-50/50">
            <div className="p-4 bg-white rounded-2xl shadow-sm mb-4">
              <Car size={40} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Your inventory is empty</h3>
            <p className="text-slate-500 max-w-xs mt-2">
              Start by adding your first vehicle stock to track aging, margins and distribution.
            </p>
            <Button
              className="mt-6"
              icon={Plus}
              onClick={() => setIsAddStockOpen(true)}
            >
              Add Your First Vehicle
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {vehicles?.map(car => (
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
                    options={catalogModels.map(m => ({ label: m, value: m }))}
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-bold text-slate-600 mb-2">Select Variant *</label>
                  <Select
                    disabled={!newVehicle.model}
                    value={newVehicle.variant}
                    onChange={(e) => handleVariantChange(e.target.value)}
                    options={variantsForModel.map(v => ({ label: v.variant, value: v.variant }))}
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
                    options={newVehicle.availableColors?.map(c => ({ label: c.color, value: c.color })) || []}
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
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full">
            <div className="bg-gradient-to-r from-slate-900 to-slate-700 text-white p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black">{selectedVehicle.model}</h2>
                <p className="text-slate-300 text-sm mt-1">{selectedVehicle.variant} • {selectedVehicle.year}</p>
              </div>
              <button onClick={() => setIsDetailsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Dynamic Image Preview */}
              <div className="relative h-64 overflow-hidden rounded-xl bg-gradient-to-br from-slate-100 to-slate-50">
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

              {/* Interactive Colors Section */}
              {selectedVehicle.availableColors && selectedVehicle.availableColors.length > 0 && (
                <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl">
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

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs font-bold text-slate-500 mb-1">VIN Number</p>
                  <p className="font-bold text-slate-900">{selectedVehicle.vin}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs font-bold text-slate-500 mb-1">Status</p>
                  <Badge variant={selectedVehicle.status === 'In Stock' ? 'success' : 'warning'}>{selectedVehicle.status}</Badge>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs font-bold text-slate-500 mb-1">Cost Price</p>
                  <p className="font-bold text-slate-900">₹{(selectedVehicle.cost / 100000).toFixed(1)}L</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl group/price relative">
                  <p className="text-xs font-bold text-slate-500 mb-1">Selling Price</p>
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-blue-700">₹{(selectedVehicle.price / 100000).toFixed(2)}L</p>
                    <button 
                      onClick={() => {
                        setEditPrice(selectedVehicle.price.toString());
                        setIsUpdatingPrice(true);
                      }}
                      className="p-1.5 hover:bg-white text-slate-400 hover:text-blue-600 rounded-lg transition-all opacity-0 group-hover/price:opacity-100"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs font-bold text-slate-500 mb-1">Days in Stock</p>
                  <p className="font-bold text-orange-700">{selectedVehicle.daysInStock} days</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs font-bold text-slate-500 mb-1">Projected Margin</p>
                  <p className="font-bold text-green-700">₹{((selectedVehicle.price - selectedVehicle.cost) / 100000).toFixed(1)}L</p>
                </div>
              </div>

              <Button onClick={() => setIsDetailsOpen(false)} className="w-full">Close</Button>
            </div>
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
    </>
  );
};

export default Inventory;
