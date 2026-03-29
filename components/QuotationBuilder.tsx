import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Lead, Bank, Vehicle } from '../types';
import { Button, Card, useToast } from '../UI';
import { Printer, X, Settings, Plus, Trash2, RotateCcw, FileText, User, Building2 } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { PRODUCT_CATALOG, LOCAL_BANKS } from '../constants';

const ENHANCED_VEHICLES = PRODUCT_CATALOG;

const LOCAL_PROFILE = {
    dealerName: 'Lalitpur Auto Works Pvt. Ltd.',
    dealerLogo: '/logo3.png',
    dealerAddress: 'Lalitpur',
    dealerPhone: '9866288313',
    dealerEmail: 'law.sales@gmail.com',
};

interface QuotationBuilderProps {
    lead: Lead | null;
    isOpen: boolean;
    onClose: () => void;
}

const QuotationBuilder: React.FC<QuotationBuilderProps> = ({ lead, isOpen, onClose }) => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [selectedBankId, setSelectedBankId] = useState<string>('');
    const [recipientName, setRecipientName] = useState<string>(lead?.name || '');
    const [bankName, setBankName] = useState<string>('');
    const [bankBranch, setBankBranch] = useState<string>('');
    const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
    const [selectedColor, setSelectedColor] = useState<string>('');

    // Dynamic Fields
    const [price, setPrice] = useState<number>(0);
    const [discount, setDiscount] = useState<number>(0);
    const [validityDays, setValidityDays] = useState<number>(30);
    const [customSpecs, setCustomSpecs] = useState<{ label: string; value: string }[]>([]);

    // Custom Vehicle Mode
    const [isCustomVehicle, setIsCustomVehicle] = useState(false);
    const [customModelName, setCustomModelName] = useState('');
    const [customModelVariant, setCustomModelVariant] = useState('');

    // Settings
    const [showSettings, setShowSettings] = useState(false);

    const printRef = useRef<HTMLDivElement>(null);

    // Initialize data when vehicle changes
    useEffect(() => {
        if (selectedVehicleId && !isCustomVehicle) {
            const v = ENHANCED_VEHICLES.find(x => x.id === selectedVehicleId);
            if (v) {
                setPrice(v.price);
                setCustomSpecs(v.specifications ? [...v.specifications] : []);
                // Set default color to first available or the vehicle's default color
                if (v.availableColors && v.availableColors.length > 0) {
                    setSelectedColor(v.availableColors[0].color);
                } else {
                    setSelectedColor(v.color);
                }
            }
        }
    }, [selectedVehicleId, isCustomVehicle]);

    // Update recipient when lead changes
    useEffect(() => {
        if (lead?.name) setRecipientName(lead.name);
        
        if (lead?.modelInterest && !selectedVehicleId) {
            const match = ENHANCED_VEHICLES.find(v => v.model.toLowerCase().includes(lead.modelInterest.toLowerCase()));
            if (match) setSelectedVehicleId(match.id);
        }
    }, [lead]);

    // Update bank details when selection changes
    useEffect(() => {
        const bank = LOCAL_BANKS.find(b => b.id === selectedBankId);
        if (bank) {
            setBankName(bank.name);
            setBankBranch(bank.branch);
        } else if (selectedBankId === '') {
            setBankName('');
            setBankBranch('');
        }
    }, [selectedBankId]);

    if (!isOpen) return null;

    // Format date as DD/MM/YYYY
    const formatDate = (date: Date) => {
        const day = ('0' + date.getDate()).slice(-2);
        const month = ('0' + (date.getMonth() + 1)).slice(-2);
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    // Get vehicle info
    const vehicle = isCustomVehicle
        ? { model: customModelName || 'Vehicle', variant: customModelVariant, year: new Date().getFullYear() }
        : ENHANCED_VEHICLES.find(v => v.id === selectedVehicleId);

    // Get the current image based on selected color
    const getCurrentImage = () => {
        if (!vehicle || isCustomVehicle) return '';
        const fullVehicle = vehicle as Vehicle;
        if (fullVehicle.availableColors && selectedColor) {
            const colorOption = fullVehicle.availableColors.find(c => c.color === selectedColor);
            if (colorOption) return colorOption.image;
        }
        return fullVehicle.image || '';
    };
    const currentVehicleImage = getCurrentImage();

    const finalPrice = price - discount;
    const modelDisplay = vehicle?.model || 'Vehicle';

    // Get Organization Details
    const orgBranding = {
        name: user?.orgName || LOCAL_PROFILE.dealerName,
        logo: user?.orgLogo || LOCAL_PROFILE.dealerLogo,
        address: user?.orgAddress || LOCAL_PROFILE.dealerAddress,
        phone: user?.orgPhone || LOCAL_PROFILE.dealerPhone,
        email: user?.orgEmail || user?.email || LOCAL_PROFILE.dealerEmail
    };

    // Generate the full quotation HTML matching original format
    const generateQuotationHTML = () => {
        const specsRows = customSpecs.map(spec =>
            `<tr><td style="padding: 10px 12px; border: 1px solid #ddd; font-weight: 600; background: #f9fafb; width: 40%;">${spec.label}</td><td style="padding: 10px 12px; border: 1px solid #ddd;">${spec.value}</td></tr>`
        ).join('');

        return `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 12pt; line-height: 1.6; color: #1e293b; max-width: 700px; margin: 0 auto; padding: 40px;">
                <!-- Header -->
                <div style="text-align: center; padding-bottom: 24px; margin-bottom: 30px; border-bottom: 3px solid #0B457F;">
                    <img src="${orgBranding.logo}" alt="${orgBranding.name}" style="height: 70px; margin: 0 auto 8px auto; display: block; object-fit: contain;" />
                    <p style="font-size: 11pt; color: #475569; margin: 0; font-weight: 500;">${orgBranding.address} | ${orgBranding.phone} | ${orgBranding.email}</p>
                </div>

                <!-- Recipient Info -->
                <div style="margin-bottom: 25px; font-size: 11pt;">
                    ${bankName ? `<p style="margin: 4px 0;"><strong>M/S Bank Name:</strong> ${bankName}</p>` : ''}
                    ${bankBranch ? `<p style="margin: 4px 0;"><strong>Branch:</strong> ${bankBranch}</p>` : ''}
                    <p style="margin: 4px 0;"><strong>C/O Customer Name:</strong> ${recipientName || 'Valued Customer'}</p>
                </div>

                <div style="margin-bottom: 25px;">
                    <p style="margin: 4px 0;"><strong>Re: Quotation for ${modelDisplay}</strong></p>
                    <p style="margin: 4px 0;"><strong>Issue Date:</strong> ${formatDate(new Date())}</p>
                </div>

                <!-- Greeting -->
                <div style="margin-bottom: 25px;">
                    <p style="margin: 8px 0;">Dear Sir/Ma'am,</p>
                    <p style="margin: 8px 0;">Namaste & Warm Greetings from ${orgBranding.name}.</p>
                    <p style="margin: 8px 0; text-align: justify;">First of all, thank you for taking interest in our product – <strong>${modelDisplay}</strong>, Touch the future! As per your desired model, we are pleased to share the quotation for your kind reference.</p>
                </div>

                <!-- Specifications Table -->
                <table style="width: 100%; border-collapse: collapse; margin: 25px 0; font-size: 11pt;">
                    <tbody>
                        <tr>
                            <td style="padding: 10px 12px; border: 1px solid #ddd; font-weight: 600; background: #f9fafb; width: 40%;">Model</td>
                            <td style="padding: 10px 12px; border: 1px solid #ddd; font-weight: 600;">${modelDisplay}${vehicle?.variant ? ` - ${vehicle.variant}` : ''}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 12px; border: 1px solid #ddd; font-weight: 600; background: #f9fafb; width: 40%;">Exterior Color</td>
                            <td style="padding: 10px 12px; border: 1px solid #ddd;">${selectedColor || 'As per availability'}</td>
                        </tr>
                        ${specsRows}
                        <tr>
                            <td style="padding: 10px 12px; border: 1px solid #ddd; font-weight: 600; background: #f9fafb;">Manufacturing Year</td>
                            <td style="padding: 10px 12px; border: 1px solid #ddd;">${vehicle?.year || new Date().getFullYear()}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 12px; border: 1px solid #ddd; font-weight: 600; background: #f9fafb;">Exclusive Showroom Price</td>
                            <td style="padding: 10px 12px; border: 1px solid #ddd;">NPR ${price.toLocaleString()}/-</td>
                        </tr>
                        ${discount > 0 ? `
                        <tr>
                            <td style="padding: 10px 12px; border: 1px solid #ddd; font-weight: 600; background: #f9fafb; color: #059669;">Less: Discount</td>
                            <td style="padding: 10px 12px; border: 1px solid #ddd; color: #059669; font-weight: 600;">- NPR ${discount.toLocaleString()}/-</td>
                        </tr>
                        ` : ''}
                        <tr style="background: #0B457F; color: white;">
                            <td style="padding: 12px; border: 1px solid #0B457F; font-weight: 700;">NET PRICE</td>
                            <td style="padding: 12px; border: 1px solid #0B457F; font-weight: 700;">NPR ${finalPrice.toLocaleString()}/-</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 12px; border: 1px solid #ddd; font-weight: 600; background: #f9fafb;">Quotation Validity</td>
                            <td style="padding: 10px 12px; border: 1px solid #ddd;">${validityDays} Days from the date of Issue</td>
                        </tr>
                    </tbody>
                </table>

                <!-- Terms and Conditions -->
                <div style="font-size: 10pt; line-height: 1.7; color: #475569;">
                    <p style="margin: 15px 0;"><em>Note: The above quoted price is subject to vary without any prior notice in case of any changes made by ${LOCAL_PROFILE.dealerName} or in the event of any government tax/policy variations.</em></p>
                    
                    <p style="margin: 10px 0;"><em>${LOCAL_PROFILE.dealerName} reserves the right to change specifications, models and discontinue the model without prior notice.</em></p>

                    <h4 style="font-weight: 700; margin: 20px 0 10px 0; color: #0f172a; text-transform: uppercase; font-size: 11pt;">DELIVERY</h4>
                    <ul style="margin: 0; padding-left: 20px;">
                        <li>Approximately within 90 days from the date of signing of order confirmation.</li>
                        <li>Delivery date can be extended up to 120 days due to non-availability of preferred colour.</li>
                    </ul>

                    <h4 style="font-weight: 700; margin: 20px 0 10px 0; color: #0f172a; text-transform: uppercase; font-size: 11pt;">FORCE MAJEURE CLAUSE</h4>
                    <ul style="margin: 0; padding-left: 20px;">
                        <li>The delivery clause is subject to "Force Majeure" circumstances.</li>
                        <li>${LOCAL_PROFILE.dealerName} shall not be liable for delay in execution of delivery in case of events such as riots, fire, flood, epidemics, quarantine restrictions, freight embargoes, accidents etc.</li>
                    </ul>

                    <h4 style="font-weight: 700; margin: 20px 0 10px 0; color: #0f172a; text-transform: uppercase; font-size: 11pt;">AFTER SALES SERVICE & WARRANTY</h4>
                    <ul style="margin: 0; padding-left: 20px;">
                        <li>We provide Pre-Delivery Inspection before the delivery.</li>
                        <li>6 Free Servicing up to 30,000 KMs or Twenty-Four Months whichever is earlier from the date of delivery. This is offered from Deepal service station only.</li>
                        <li>The vehicle will be covered under warranty for manufacturing defects for 3 years or 120,000 KMs and Battery and Motor will be covered 8 years or 1,50,000 KMs whichever is earlier from the date of delivery.</li>
                        <li>This warranty applies to the repair or replacement of manufacturing defects only as per the acceptance of MAW Vriddhi Autocorp warranty policy.</li>
                    </ul>

                    <h4 style="font-weight: 700; margin: 20px 0 10px 0; color: #0f172a; text-transform: uppercase; font-size: 11pt;">BOOKING AND CANCELLATION</h4>
                    <ul style="margin: 0; padding-left: 20px;">
                        <li>Total Booking Amount: 2 Lakhs or above. Non-refundable.</li>
                    </ul>

                    <p style="margin: 25px 0 10px 0;">Once again, we would like to take this opportunity to thank you for providing us the opportunity to serve you.</p>
                    <p style="margin: 10px 0 40px 0;">Assuring you the best of services as always!</p>
                </div>

                <!-- Signature -->
                <div style="margin-top: 60px;">
                    <div style="width: 200px; border-bottom: 1px solid #1e293b; height: 50px;"></div>
                    <p style="margin: 8px 0 2px 0; font-weight: 700;">${orgBranding.name}</p>
                    <p style="margin: 0; color: #64748b;">${orgBranding.phone}</p>
                </div>
            </div>
        `;
    };

    // Print Handler - Opens in new window with A4 pagination
    const handlePrint = () => {
        const printWindow = window.open('', '_blank', 'width=900,height=700');
        if (!printWindow) {
            addToast('Popup blocked! Please allow popups to print.', 'error');
            return;
        }

        addToast('Quotation generated successfully!', 'success');

        // Generate header HTML for repetition
        const headerHTML = `
            <div class="page-header">
                <img src="${orgBranding.logo}" alt="${orgBranding.name}" style="height: 60px; margin: 0 auto 6px auto; display: block; object-fit: contain;" />
                <p style="font-size: 10pt; color: #475569; margin: 0; font-weight: 500; text-align: center;">${orgBranding.address} | ${orgBranding.phone} | ${orgBranding.email}</p>
            </div>
        `;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Quotation - ${lead?.name || 'Customer'}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    
                    /* A4 Page Setup */
                    @page { 
                        size: A4; 
                        margin: 15mm 15mm 20mm 15mm;
                    }
                    
                    @media print {
                        body { 
                            -webkit-print-color-adjust: exact !important; 
                            print-color-adjust: exact !important; 
                        }
                        
                        /* Repeating header on each page */
                        thead { display: table-header-group; }
                        .page-header-wrapper { display: table-header-group; }
                        
                        /* Page break controls */
                        .page-break-before { page-break-before: always; }
                        .page-break-after { page-break-after: always; }
                        .avoid-break { page-break-inside: avoid; }
                        
                        /* Prevent orphaned sections */
                        h4 { page-break-after: avoid; }
                        ul, table { page-break-inside: avoid; }
                    }
                    
                    body { 
                        font-family: 'Segoe UI', Arial, sans-serif; 
                        font-size: 11pt; 
                        line-height: 1.5; 
                        color: #1e293b;
                        background: white;
                    }
                    
                    .print-container {
                        width: 100%;
                        max-width: 210mm;
                        margin: 0 auto;
                    }
                    
                    .page-header {
                        padding: 10px 0 15px 0;
                        margin-bottom: 20px;
                        border-bottom: 2px solid #0B457F;
                    }
                    
                    .content-section {
                        margin-bottom: 15px;
                    }
                    
                    .terms-section h4 {
                        font-weight: 700;
                        margin: 18px 0 8px 0;
                        color: #0f172a;
                        text-transform: uppercase;
                        font-size: 10pt;
                    }
                    
                    .terms-section ul {
                        margin: 0;
                        padding-left: 20px;
                        font-size: 9pt;
                        color: #475569;
                    }
                    
                    .terms-section li {
                        margin-bottom: 4px;
                    }
                    
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 15px 0;
                        font-size: 10pt;
                    }
                    
                    table td {
                        padding: 8px 10px;
                        border: 1px solid #ddd;
                    }
                    
                    .signature-block {
                        margin-top: 40px;
                        page-break-inside: avoid;
                    }
                </style>
            </head>
            <body>
                <div class="print-container">
                    <!-- Main Header -->
                    ${headerHTML}
                    
                    <!-- Recipient Info -->
                    <div class="content-section" style="font-size: 10pt;">
                        ${bankName ? `<p style="margin: 3px 0;"><strong>M/S Bank Name:</strong> ${bankName}</p>` : ''}
                        ${bankBranch ? `<p style="margin: 3px 0;"><strong>Branch:</strong> ${bankBranch}</p>` : ''}
                        <p style="margin: 3px 0;"><strong>C/O Customer Name:</strong> ${recipientName || 'Valued Customer'}</p>
                    </div>
                    
                    <div class="content-section" style="font-size: 10pt;">
                        <p style="margin: 3px 0;"><strong>Re: Quotation for ${modelDisplay}</strong></p>
                        <p style="margin: 3px 0;"><strong>Issue Date:</strong> ${formatDate(new Date())}</p>
                    </div>
                    
                    <!-- Greeting -->
                    <div class="content-section" style="font-size: 10pt;">
                        <p style="margin: 6px 0;">Dear Sir/Ma'am,</p>
                        <p style="margin: 6px 0;">Namaste & Warm Greetings from ${orgBranding.name}.</p>
                        <p style="margin: 6px 0; text-align: justify;">First of all, thank you for taking interest in our product – <strong>${modelDisplay}</strong>, Touch the future! As per your desired model, we are pleased to share the quotation for your kind reference.</p>
                    </div>
                    
                    <!-- Specifications Table -->
                    <table class="avoid-break">
                        <tbody>
                            <tr>
                                <td style="font-weight: 600; background: #f9fafb; width: 40%;">Model</td>
                                <td style="font-weight: 600;">${modelDisplay}${vehicle?.variant ? ` - ${vehicle.variant}` : ''}</td>
                            </tr>
                            <tr>
                                <td style="font-weight: 600; background: #f9fafb; width: 40%;">Exterior Color</td>
                                <td>${selectedColor || 'As per availability'}</td>
                            </tr>
                            ${customSpecs.map(spec => `
                                <tr>
                                    <td style="font-weight: 600; background: #f9fafb;">${spec.label}</td>
                                    <td>${spec.value}</td>
                                </tr>
                            `).join('')}
                            <tr>
                                <td style="font-weight: 600; background: #f9fafb;">Manufacturing Year</td>
                                <td>${new Date().getFullYear()}</td>
                            </tr>
                            <tr>
                                <td style="font-weight: 600; background: #f9fafb;">Exclusive Showroom Price</td>
                                <td>NPR ${price.toLocaleString('en-NP')}/-</td>
                            </tr>
                            ${discount > 0 ? `
                                <tr>
                                    <td style="font-weight: 600; background: #f9fafb;">Less: Discount</td>
                                    <td style="color: #16a34a;">- NPR ${discount.toLocaleString('en-NP')}/-</td>
                                </tr>
                            ` : ''}
                            <tr style="background: #0B457F; color: white;">
                                <td style="font-weight: 700; border-color: #0B457F;">NET PRICE</td>
                                <td style="font-weight: 700; border-color: #0B457F;">NPR ${finalPrice.toLocaleString('en-NP')}/-</td>
                            </tr>
                            <tr>
                                <td style="font-weight: 600; background: #f9fafb;">Quotation Validity</td>
                                <td>${validityDays} Days from the date of Issue</td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <!-- Terms and Conditions -->
                    <div class="terms-section">
                        <p style="margin: 12px 0; font-size: 9pt; font-style: italic; color: #475569;">Note: The above quoted price is subject to vary without any prior notice in case of any changes made by ${LOCAL_PROFILE.dealerName} or in the event of any government tax/policy variations.</p>
                        
                        <p style="margin: 8px 0; font-size: 9pt; font-style: italic; color: #475569;">${LOCAL_PROFILE.dealerName} reserves the right to change specifications, models and discontinue the model without prior notice.</p>
                        
                        <div class="avoid-break">
                            <h4>DELIVERY</h4>
                            <ul>
                                <li>Approximately within 90 days from the date of signing of order confirmation.</li>
                                <li>Delivery date can be extended up to 120 days due to non-availability of preferred colour.</li>
                            </ul>
                        </div>
                        
                        <div class="avoid-break">
                            <h4>FORCE MAJEURE CLAUSE</h4>
                            <ul>
                                <li>The delivery clause is subject to "Force Majeure" circumstances.</li>
                                <li>${LOCAL_PROFILE.dealerName} shall not be liable for delay in execution of delivery in case of events such as riots, fire, flood, epidemics, quarantine restrictions, freight embargoes, accidents etc.</li>
                            </ul>
                        </div>
                        
                        <div class="avoid-break">
                            <h4>AFTER SALES SERVICE & WARRANTY</h4>
                            <ul>
                                <li>We provide Pre-Delivery Inspection before the delivery.</li>
                                <li>6 Free Servicing up to 30,000 KMs or Twenty-Four Months whichever is earlier from the date of delivery.</li>
                                <li>The vehicle will be covered under warranty for manufacturing defects for 3 years or 120,000 KMs.</li>
                                <li>Battery and Motor will be covered 8 years or 1,50,000 KMs whichever is earlier from the date of delivery.</li>
                            </ul>
                        </div>
                        
                        <div class="avoid-break">
                            <h4>BOOKING AND CANCELLATION</h4>
                            <ul>
                                <li>Total Booking Amount: 2 Lakhs or above. Non-refundable.</li>
                            </ul>
                        </div>
                        
                        <p style="margin: 20px 0 8px 0; font-size: 10pt;">Once again, we would like to take this opportunity to thank you for providing us the opportunity to serve you.</p>
                        <p style="margin: 8px 0 30px 0; font-size: 10pt;">Assuring you the best of services as always!</p>
                    </div>
                    
                    <!-- Signature -->
                    <div class="signature-block">
                        <div style="width: 180px; border-bottom: 1px solid #1e293b; height: 40px;"></div>
                        <p style="margin: 6px 0 2px 0; font-weight: 700; font-size: 10pt;">${orgBranding.name}</p>
                        <p style="margin: 0; color: #64748b; font-size: 9pt;">${orgBranding.phone}</p>
                    </div>
                </div>
                <script>
                    window.onload = function() {
                        setTimeout(function() { window.print(); }, 300);
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    const addSpecRow = () => {
        setCustomSpecs([...customSpecs, { label: 'Feature', value: 'Value' }]);
    };

    const updateSpec = (index: number, field: 'label' | 'value', text: string) => {
        const newSpecs = [...customSpecs];
        newSpecs[index][field] = text;
        setCustomSpecs(newSpecs);
    };

    const removeSpec = (index: number) => {
        setCustomSpecs(customSpecs.filter((_, i) => i !== index));
    };

    // Modal content
    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="relative w-full h-full flex flex-col bg-white">
                {/* Top Bar */}
                <div className="flex-shrink-0 bg-gradient-to-r from-slate-900 to-slate-800 text-white px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-gradient-to-br from-teal-400 to-blue-500 rounded-xl">
                            <FileText size={22} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                Smart Quotation Engine
                            </h2>
                            <p className="text-sm text-slate-300">
                                Drafting for: <span className="font-semibold text-white">{lead?.name || 'Walk-in Customer'}</span>
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => setShowSettings(!showSettings)}
                            icon={Settings}
                            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                        >
                            {showSettings ? 'Back to Builder' : 'Template Settings'}
                        </Button>
                        <button
                            onClick={onClose}
                            className="p-2.5 hover:bg-white/10 rounded-xl transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex overflow-hidden">
                    {/* LEFT PANEL: Builder Controls */}
                    <div className="w-[400px] flex-shrink-0 bg-slate-50 border-r border-slate-200 overflow-y-auto p-6">
                        {showSettings ? (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-semibold text-lg text-slate-900">Template Settings</h3>
                                    <button
                                        onClick={() => setShowSettings(false)}
                                        className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-semibold"
                                    >
                                        <RotateCcw size={12} /> Back to Builder
                                    </button>
                                </div>
                                <p className="text-sm text-slate-500">
                                    The quotation template uses the standard {orgBranding.name} format with all terms and conditions pre-configured.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                {/* 1. Vehicle Selector */}
                                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                                            <span className="h-6 w-6 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 text-xs font-bold">1</span>
                                            Vehicle Details
                                        </h3>
                                        <button
                                            onClick={() => {
                                                setIsCustomVehicle(!isCustomVehicle);
                                                if (!isCustomVehicle) {
                                                    setCustomSpecs([]);
                                                    setPrice(0);
                                                }
                                            }}
                                            className="text-xs text-teal-600 hover:text-teal-700 font-semibold"
                                        >
                                            {isCustomVehicle ? 'Select from Inventory' : 'Add Custom Vehicle'}
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {isCustomVehicle ? (
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Model Name</label>
                                                    <input
                                                        type="text"
                                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-teal-200 focus:border-teal-400 outline-none"
                                                        placeholder="e.g. Deepal S07"
                                                        value={customModelName}
                                                        onChange={e => setCustomModelName(e.target.value)}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Variant</label>
                                                        <input
                                                            type="text"
                                                            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-200 focus:border-teal-400 outline-none"
                                                            placeholder="e.g. EV 500"
                                                            value={customModelVariant}
                                                            onChange={e => setCustomModelVariant(e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Price (NPR)</label>
                                                        <input
                                                            type="number"
                                                            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-200 focus:border-teal-400 outline-none"
                                                            value={price || ''}
                                                            onChange={e => setPrice(Number(e.target.value))}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div>
                                                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Select Stock</label>
                                                    <select
                                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 bg-white focus:ring-2 focus:ring-teal-200 focus:border-teal-400 outline-none cursor-pointer"
                                                        value={selectedVehicleId}
                                                        onChange={(e) => setSelectedVehicleId(e.target.value)}
                                                    >
                                                        <option value="">-- Choose Vehicle --</option>
                                                        {ENHANCED_VEHICLES.map(v => (
                                                            <option key={v.id} value={v.id}>{v.model} - {v.variant}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Color Selector */}
                                                {selectedVehicleId && vehicle && 'availableColors' in vehicle && (vehicle as Vehicle).availableColors && (vehicle as Vehicle).availableColors!.length > 0 && (
                                                    <div className="mt-3">
                                                        <label className="text-xs font-semibold text-slate-500 mb-2 block">Available Colors</label>
                                                        <div className="flex flex-wrap gap-2">
                                                            {(vehicle as Vehicle).availableColors!.map((colorOption) => {
                                                                const isSelected = selectedColor === colorOption.color;
                                                                // Color mapping for visual swatches
                                                                const colorMap: Record<string, string> = {
                                                                    'Quartz White': '#F5F5F5',
                                                                    'Hematite Grey': '#6B7280',
                                                                    'Obsidian Black': '#1F2937',
                                                                    'Lunar Gray': '#9CA3AF',
                                                                    'Comet White': '#FAFAFA',
                                                                    'Eclipse Black': '#111827',
                                                                    'Nebula Green': '#059669',
                                                                    'Sunset Orange': '#EA580C',
                                                                    'Stellar Blue': '#2563EB',
                                                                    'Mercury Silver': '#D1D5DB',
                                                                    'Deep Space Black': '#030712',
                                                                    'Andromeda Blue': '#1D4ED8',
                                                                    'Ganymede Grey': '#4B5563',
                                                                    'Moonlight White': '#FFFFFF',
                                                                };
                                                                const bgColor = colorMap[colorOption.color] || '#CBD5E1';
                                                                const isLight = ['Quartz White', 'Comet White', 'Mercury Silver', 'Moonlight White'].includes(colorOption.color);

                                                                return (
                                                                    <button
                                                                        key={colorOption.color}
                                                                        type="button"
                                                                        onClick={() => setSelectedColor(colorOption.color)}
                                                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${isSelected
                                                                            ? 'border-teal-500 bg-teal-50 shadow-md'
                                                                            : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                                                                            }`}
                                                                    >
                                                                        <span
                                                                            className={`w-5 h-5 rounded-full border ${isLight ? 'border-slate-300' : 'border-transparent'}`}
                                                                            style={{ backgroundColor: bgColor }}
                                                                        />
                                                                        <span className={`text-xs font-medium ${isSelected ? 'text-teal-700' : 'text-slate-600'}`}>
                                                                            {colorOption.color}
                                                                        </span>
                                                                        {isSelected && (
                                                                            <span className="text-teal-500">✓</span>
                                                                        )}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Showroom Price</label>
                                                        <div className="px-4 py-3 bg-slate-100 rounded-xl text-sm font-semibold text-slate-700">
                                                            ₹{price.toLocaleString()}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Less: Discount</label>
                                                        <input
                                                            type="number"
                                                            value={discount || ''}
                                                            onChange={(e) => setDiscount(Number(e.target.value))}
                                                            className="w-full px-4 py-3 border border-emerald-200 rounded-xl text-sm font-semibold text-emerald-600 bg-emerald-50 focus:ring-2 focus:ring-emerald-200 outline-none"
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* 2. Specs Manager */}
                                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                                            <span className="h-6 w-6 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 text-xs font-bold">2</span>
                                            Technical Specs
                                        </h3>
                                        <Button size="sm" variant="outline" onClick={addSpecRow} icon={Plus} className="text-xs">
                                            Add Row
                                        </Button>
                                    </div>

                                    <div className="space-y-2">
                                        {customSpecs.map((spec, idx) => (
                                            <div key={idx} className="flex gap-2 group">
                                                <input
                                                    type="text"
                                                    value={spec.label}
                                                    onChange={(e) => updateSpec(idx, 'label', e.target.value)}
                                                    className="w-2/5 px-3 py-2.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-200 outline-none"
                                                    placeholder="Label"
                                                />
                                                <input
                                                    type="text"
                                                    value={spec.value}
                                                    onChange={(e) => updateSpec(idx, 'value', e.target.value)}
                                                    className="flex-1 px-3 py-2.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-200 outline-none"
                                                    placeholder="Value"
                                                />
                                                <button
                                                    onClick={() => removeSpec(idx)}
                                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                        {customSpecs.length === 0 && (
                                            <div className="text-center py-6 text-xs text-slate-400 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                                                No specs added. Click "Add Row" to define vehicle features.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 3. Recipient Info */}
                                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                                    <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2 mb-4">
                                        <span className="h-6 w-6 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 text-xs font-bold">3</span>
                                        Recipient / Bank
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Customer Name</label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                <input
                                                    type="text"
                                                    value={recipientName}
                                                    onChange={(e) => setRecipientName(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-200 outline-none"
                                                    placeholder="Recipient Name"
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-2 border-t border-slate-100">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Bank / Financial Institution</label>
                                            <select
                                                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none cursor-pointer mb-3"
                                                value={selectedBankId}
                                                onChange={(e) => setSelectedBankId(e.target.value)}
                                            >
                                                <option value="">-- Manual Input / No Bank --</option>
                                                {LOCAL_BANKS.map(b => (
                                                    <option key={b.id} value={b.id}>{b.name}</option>
                                                ))}
                                                <option value="custom">-- Other Bank (Manual) --</option>
                                            </select>

                                            {(selectedBankId === 'custom' || selectedBankId === '') && (
                                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                                    <div className="relative">
                                                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                        <input
                                                            type="text"
                                                            value={bankName}
                                                            onChange={(e) => setBankName(e.target.value)}
                                                            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-200 outline-none"
                                                            placeholder="Bank Name (Leave empty for Direct Customer)"
                                                        />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={bankBranch}
                                                        onChange={(e) => setBankBranch(e.target.value)}
                                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-200 outline-none"
                                                        placeholder="Branch Name (Optional)"
                                                    />
                                                </div>
                                            )}

                                            {selectedBankId && selectedBankId !== 'custom' && (
                                                <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 space-y-2">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs font-bold text-blue-800 uppercase tracking-tighter">Bank Selected</span>
                                                        <button 
                                                            onClick={() => setSelectedBankId('custom')}
                                                            className="text-[10px] text-blue-600 hover:underline font-bold"
                                                        >
                                                            Edit manually
                                                        </button>
                                                    </div>
                                                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                                        {bankName} - {bankBranch}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Print Button */}
                                <Button
                                    className="w-full py-4 text-base bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 shadow-lg"
                                    size="lg"
                                    icon={Printer}
                                    onClick={handlePrint}
                                >
                                    Print / Download PDF
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* RIGHT PANEL: Live Preview */}
                    <div className="flex-1 bg-slate-700 p-6 overflow-auto">
                        <div className="flex flex-col items-center">
                            <p className="text-slate-400 text-xs uppercase tracking-wide mb-4 text-center">Live Preview (A4)</p>

                            {/* A4 Paper Preview - 210mm x 297mm ratio */}
                            <div
                                className="bg-white shadow-2xl overflow-auto"
                                style={{
                                    width: '210mm',
                                    minHeight: '297mm',
                                    maxWidth: '100%',
                                    transform: 'scale(0.65)',
                                    transformOrigin: 'top center',
                                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                                }}
                            >
                                <div
                                    ref={printRef}
                                    style={{ padding: '15mm' }}
                                    dangerouslySetInnerHTML={{ __html: generateQuotationHTML() }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // Use portal to render modal at document body level
    return createPortal(modalContent, document.body);
};

export default QuotationBuilder;
