import React, { useState, useMemo, useEffect } from 'react';
import { X, User, Phone, MapPin, Car, Palette, DollarSign, RefreshCw, FileText, ChevronDown, Camera, Image as ImageIcon } from 'lucide-react';
import { Button } from '../UI';
import { ExchangeDetails } from '../types';
import { useInventory } from '../api';

interface CustomerOnboardingFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
}

const CustomerOnboardingForm: React.FC<CustomerOnboardingFormProps> = ({ isOpen, onClose, onSubmit }) => {
    const { data: vehicles = [] } = useInventory();

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        source: 'Showroom Walk In',
        modelInterest: '',
        vehicleColor: '',
        budget: '',
        temperature: 'Warm' as 'Hot' | 'Warm' | 'Cold',
        companyName: '',
        panNumber: '',
        hasExchange: false,
        exchangeVehicle: '',
        expectedValue: '',
        remarks: '',
        nextFollowUpDate: '',
        exchangePhotoUrl: ''
    });

    // Get unique models from inventory
    const availableModels = useMemo(() => {
        const modelSet = new Set<string>();
        vehicles.forEach(v => {
            if (v.model) modelSet.add(v.model);
        });
        return Array.from(modelSet).sort();
    }, [vehicles]);

    // Get available colors for the selected model
    const availableColors = useMemo(() => {
        if (!formData.modelInterest) return [];

        const colorsSet = new Set<string>();
        vehicles
            .filter(v => v.model === formData.modelInterest)
            .forEach(v => {
                // Add colors from availableColors if present
                if (v.availableColors && v.availableColors.length > 0) {
                    v.availableColors.forEach(c => colorsSet.add(c.color));
                } else if (v.color) {
                    // Fallback to default color
                    colorsSet.add(v.color);
                }
            });
        return Array.from(colorsSet).sort();
    }, [vehicles, formData.modelInterest]);

    // Reset color when model changes
    useEffect(() => {
        if (formData.modelInterest && availableColors.length > 0 && !availableColors.includes(formData.vehicleColor)) {
            setFormData(prev => ({ ...prev, vehicleColor: '' }));
        }
    }, [formData.modelInterest, availableColors]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const exchange: ExchangeDetails = {
            hasExchange: formData.hasExchange,
            vehicleModel: formData.hasExchange ? formData.exchangeVehicle : undefined,
            expectedValue: formData.hasExchange ? parseFloat(formData.expectedValue) : undefined,
            offeredValue: undefined, // Will be set later by sales team
            photoUrl: formData.hasExchange ? formData.exchangePhotoUrl : undefined
        };

        const leadData = {
            id: `L-${Date.now()}`,
            name: formData.name,
            phone: formData.phone,
            email: formData.email || undefined,
            address: formData.address || undefined,
            companyName: formData.companyName || undefined,
            panNumber: formData.panNumber || undefined,
            source: formData.source,
            modelInterest: formData.modelInterest,
            vehicleColor: formData.vehicleColor || undefined,
            budget: parseFloat(formData.budget) || 0,
            status: 'New Enquiry',
            temperature: formData.temperature,
            aiScore: 50, // Default, will be calculated by AI
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ownerId: 'System', // Will be assigned by manager
            branchId: 'B1',
            quotation_issued: false,
            exchange,
            remarks: formData.remarks || undefined,
            nextFollowUpDate: formData.nextFollowUpDate || undefined,
            notes: []
        };

        onSubmit(leadData);
        onClose();

        // Reset form
        setFormData({
            name: '', phone: '', email: '', address: '', source: 'Showroom Walk In',
            modelInterest: '', vehicleColor: '', budget: '', temperature: 'Warm',
            companyName: '', panNumber: '',
            hasExchange: false, exchangeVehicle: '', expectedValue: '', remarks: '',
            nextFollowUpDate: '', exchangePhotoUrl: ''
        });
    };

    if (!isOpen) return null;


    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black">New Customer Enquiry</h2>
                        <p className="text-blue-100 text-sm mt-1">Capture lead details for pipeline tracking</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                    <div className="space-y-6">
                        {/* Customer Information */}
                        <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <User size={16} className="text-blue-600" />
                                Customer Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-2">Full Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        placeholder="e.g., Vivek Dahal"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-2">Phone Number *</label>
                                    <input
                                        type="tel"
                                        required
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        placeholder="98XXXXXXXX"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-2">Email (Optional)</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        placeholder="customer@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-2">Company Name (Optional)</label>
                                    <input
                                        type="text"
                                        value={formData.companyName}
                                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        placeholder="e.g., ABC Pvt Ltd"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-2">PAN Number (Optional)</label>
                                    <input
                                        type="text"
                                        value={formData.panNumber}
                                        onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        placeholder="Enter PAN"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-600 mb-2">Address *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        placeholder="e.g., Itahari"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Vehicle Interest */}
                        <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Car size={16} className="text-blue-600" />
                                Vehicle Interest
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-2">Model *</label>
                                    <div className="relative">
                                        <select
                                            required
                                            value={formData.modelInterest}
                                            onChange={(e) => setFormData({ ...formData, modelInterest: e.target.value })}
                                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none bg-white"
                                        >
                                            <option value="">Select a model...</option>
                                            {availableModels.map(model => (
                                                <option key={model} value={model}>{model}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-2">
                                        <span className="flex items-center gap-1">
                                            <Palette size={12} /> Color Preference
                                        </span>
                                    </label>
                                    {formData.modelInterest && availableColors.length > 0 ? (
                                        <div className="space-y-2">
                                            <div className="relative">
                                                <select
                                                    value={formData.vehicleColor}
                                                    onChange={(e) => setFormData({ ...formData, vehicleColor: e.target.value })}
                                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none bg-white"
                                                >
                                                    <option value="">Any color...</option>
                                                    {availableColors.map(color => (
                                                        <option key={color} value={color}>{color}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                            </div>
                                            {/* Color Swatches */}
                                            <div className="flex flex-wrap gap-1.5">
                                                {availableColors.map(color => {
                                                    const colorMap: Record<string, string> = {
                                                        'Quartz White': '#F5F5F5', 'Hematite Grey': '#4A4A4A', 'Obsidian Black': '#1A1A1A',
                                                        'Lunar Gray': '#B0B0B0', 'Comet White': '#FFFFFF', 'Eclipse Black': '#0D0D0D',
                                                        'Nebula Green': '#2E7D32', 'Sunset Orange': '#E64A19', 'Aurora Blue': '#1565C0',
                                                        'Galaxy Silver': '#9E9E9E', 'Cosmic Red': '#C62828', 'Starlight Silver': '#CFD8DC'
                                                    };
                                                    const bgColor = colorMap[color] || '#888';
                                                    const isSelected = formData.vehicleColor === color;
                                                    return (
                                                        <button
                                                            key={color}
                                                            type="button"
                                                            title={color}
                                                            onClick={() => setFormData({ ...formData, vehicleColor: color })}
                                                            className={`w-6 h-6 rounded-full border-2 transition-all ${isSelected ? 'border-blue-500 ring-2 ring-blue-200 scale-110' : 'border-slate-300 hover:scale-105'}`}
                                                            style={{ backgroundColor: bgColor }}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="px-4 py-3 border border-slate-100 rounded-xl bg-slate-50 text-slate-400 text-sm">
                                            {formData.modelInterest ? 'No colors defined for this model' : 'Select a model first'}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-2">Budget (NPR)</label>
                                    <input
                                        type="number"
                                        value={formData.budget}
                                        onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        placeholder="5000000"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Lead Classification */}
                        <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <FileText size={16} className="text-blue-600" />
                                Lead Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-2">Enquiry Source *</label>
                                    <select
                                        value={formData.source}
                                        onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    >
                                        <option value="Showroom Walk In">Showroom Walk In</option>
                                        <option value="Facebook">Facebook</option>
                                        <option value="WhatsApp">WhatsApp</option>
                                        <option value="Referral">Referral</option>
                                        <option value="Website">Website</option>
                                        <option value="Others">Others</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-2">Temperature *</label>
                                    <select
                                        value={formData.temperature}
                                        onChange={(e) => setFormData({ ...formData, temperature: e.target.value as 'Hot' | 'Warm' | 'Cold' })}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    >
                                        <option value="Hot">🔥 Hot (Ready to Buy)</option>
                                        <option value="Warm">⚡ Warm (Interested)</option>
                                        <option value="Cold">❄️ Cold (Just Looking)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Exchange Details */}
                        <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <RefreshCw size={16} className="text-blue-600" />
                                Vehicle Exchange
                            </h3>
                            <div className="space-y-4">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.hasExchange}
                                        onChange={(e) => setFormData({ ...formData, hasExchange: e.target.checked })}
                                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-bold text-slate-700">Customer wants to exchange their current vehicle</span>
                                </label>

                                {formData.hasExchange && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-8 animate-fade-in">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 mb-2">Current Vehicle Model</label>
                                            <input
                                                type="text"
                                                value={formData.exchangeVehicle}
                                                onChange={(e) => setFormData({ ...formData, exchangeVehicle: e.target.value })}
                                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                                placeholder="e.g., Creta"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 mb-2">Expected Value (NPR)</label>
                                            <input
                                                type="number"
                                                value={formData.expectedValue}
                                                onChange={(e) => setFormData({ ...formData, expectedValue: e.target.value })}
                                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                                placeholder="5000000"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 mb-2 text-blue-600">Exchange Vehicle Photo</label>
                                            <div className="flex gap-2">
                                                <input 
                                                    type="file" 
                                                    accept="image/*" 
                                                    id="onboarding-camera-upload"
                                                    capture="environment"
                                                    className="hidden" 
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            const reader = new FileReader();
                                                            reader.onloadend = () => {
                                                                setFormData({ ...formData, exchangePhotoUrl: reader.result as string });
                                                            };
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }}
                                                />
                                                <button 
                                                    type="button"
                                                    onClick={() => document.getElementById('onboarding-camera-upload')?.click()}
                                                    className="flex-1 flex flex-col items-center justify-center gap-1.5 py-4 border-2 border-dashed border-blue-200 bg-blue-50/30 rounded-2xl hover:bg-blue-50 transition-all group"
                                                >
                                                    {formData.exchangePhotoUrl ? (
                                                        <div className="flex flex-col items-center">
                                                            <div className="w-10 h-10 rounded-lg overflow-hidden border border-blue-200 mb-1">
                                                                <img src={formData.exchangePhotoUrl} alt="Preview" className="w-full h-full object-cover" />
                                                            </div>
                                                            <span className="text-[10px] text-blue-600 font-bold">Replace Photo</span>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <Camera size={20} className="text-blue-500 group-hover:scale-110 transition-transform" />
                                                            <span className="text-[10px] text-blue-600 font-bold">Click or Upload Photo</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-2">Next Follow-up Date</label>
                                <input
                                    type="date"
                                    value={formData.nextFollowUpDate}
                                    onChange={(e) => setFormData({ ...formData, nextFollowUpDate: e.target.value })}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-2">Initial Remarks</label>
                                <textarea
                                    value={formData.remarks}
                                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                                    rows={1}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                                    placeholder="Initial customer requirements..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 mt-8 pt-6 border-t border-slate-100">
                        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1">
                            Add to Pipeline
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CustomerOnboardingForm;
