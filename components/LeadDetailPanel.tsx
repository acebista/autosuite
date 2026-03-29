import React, { useState } from 'react';
import QuotationBuilder from './QuotationBuilder';
import { X, Phone, Mail, MapPin, Car, Calendar, FileText, RefreshCw, Clock, CheckCircle, User, DollarSign, Edit2, Save, MessageCircle, ChevronDown, Sparkles } from 'lucide-react';
import { Button, Badge } from '../UI';
import { Lead } from '../types';

// WhatsApp Message Templates
const WHATSAPP_TEMPLATES = [
    {
        id: 'intro',
        name: '👋 Initial Contact',
        getMessage: (lead: Lead) => `Namaste ${lead.name}! Thank you for your interest in ${lead.modelInterest || 'our vehicles'}. I'm here to help you find your perfect car. When would be a good time to discuss?`
    },
    {
        id: 'brochure',
        name: '📄 Send Brochure',
        getMessage: (lead: Lead) => `Hi ${lead.name}! Here's the detailed brochure for ${lead.modelInterest || 'the vehicle'}: [Link to be added]. Let me know if you have any questions!`
    },
    {
        id: 'testdrive',
        name: '🚗 Test Drive Invite',
        getMessage: (lead: Lead) => `Hello ${lead.name}! Would you like to schedule a test drive for the ${lead.modelInterest}? We have slots available tomorrow. What time works best for you?`
    },
    {
        id: 'followup',
        name: '🔔 Follow-up',
        getMessage: (lead: Lead) => `Hi ${lead.name}, just following up on your interest in the ${lead.modelInterest}. We have some exciting offers this week. Would you like to know more?`
    },
    {
        id: 'quote',
        name: '💰 Send Quotation',
        getMessage: (lead: Lead) => `Namaste ${lead.name}! I've prepared a detailed quotation for the ${lead.modelInterest} as discussed. Please check and let me know your thoughts.`
    }
];

interface LeadDetailPanelProps {
    lead: Lead | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (leadId: string, updates: Partial<Lead>) => void;
    onConvertToDeal: (leadId: string) => void;
}

const LeadDetailPanel: React.FC<LeadDetailPanelProps> = ({ lead, isOpen, onClose, onUpdate, onConvertToDeal }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<Partial<Lead>>({});
    const [isQuoteOpen, setIsQuoteOpen] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);

    if (!isOpen || !lead) return null;

    const handleEdit = () => {
        setEditData({
            remarks: lead.remarks,
            temperature: lead.temperature,
            vehicleColor: lead.vehicleColor,
            address: lead.address,
            budget: lead.budget,
            status: lead.status
        });
        setIsEditing(true);
    };

    const handleSave = () => {
        onUpdate(lead.id, editData);
        setIsEditing(false);
    };

    const handleConvert = () => {
        if (window.confirm(`Convert "${lead.name}" to a Deal? This will create a sale record and invoice.`)) {
            onConvertToDeal(lead.id);
        }
    };

    return (
        <div className="fixed inset-y-0 right-0 w-full md:w-[600px] glass-dark shadow-elevated z-50 transform transition-transform duration-300 animate-fade-in overflow-hidden flex flex-col">
            {/* Header - Updated with gradient */}
            <div className="bg-gradient-to-r from-deepal-600 to-deepal-500 text-white p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <div className={`h-14 w-14 rounded-2xl flex items-center justify-center text-xl font-display font-bold border-2 border-white/30 shadow-glow-teal ${lead.temperature === 'Hot' ? 'bg-gradient-to-br from-red-500 to-orange-500' : 'bg-gradient-to-br from-orange-400 to-amber-500'}`}>
                            {lead.name.charAt(0)}
                        </div>
                        <div>
                            <h2 className="font-display text-2xl font-bold">{lead.name}</h2>
                            <p className="text-deepal-200 text-sm mt-1">Lead ID: {lead.id}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex gap-2">
                    <Badge variant={lead.temperature === 'Hot' ? 'danger' : 'warning'} size="sm">{lead.temperature}</Badge>
                    <Badge variant={lead.status === 'Delivered' ? 'success' : 'neutral'} size="sm">{lead.status || 'Active'}</Badge>
                    {lead.quotationIssued && <Badge variant="blue" size="sm">Quote Sent</Badge>}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-surface-50">
                {/* Contact Information */}
                <div>
                    <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-widest mb-3">Contact Information</h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                            <Phone size={16} className="text-accent-teal" />
                            <span className="font-semibold text-surface-900">{lead.phone}</span>
                            <div className="ml-auto relative">
                                <button
                                    onClick={() => setShowTemplates(!showTemplates)}
                                    className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full font-semibold hover:bg-emerald-200 transition-colors flex items-center gap-1.5"
                                >
                                    <MessageCircle size={12} />
                                    WhatsApp
                                    <ChevronDown size={10} />
                                </button>

                                {showTemplates && (
                                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-elevated border border-surface-200 overflow-hidden z-50 animate-fade-in">
                                        <div className="p-2.5 bg-emerald-50 border-b border-emerald-100">
                                            <p className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wide">Quick Templates</p>
                                        </div>
                                        <div className="max-h-64 overflow-y-auto">
                                            {WHATSAPP_TEMPLATES.map(template => (
                                                <a
                                                    key={template.id}
                                                    href={`https://wa.me/977${lead.phone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(template.getMessage(lead))}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    onClick={() => setShowTemplates(false)}
                                                    className="block px-3 py-2.5 hover:bg-emerald-50 transition-colors border-b border-surface-50 last:border-0"
                                                >
                                                    <div className="text-xs font-semibold text-surface-800">{template.name}</div>
                                                    <div className="text-[10px] text-surface-500 mt-0.5 line-clamp-2">{template.getMessage(lead).substring(0, 60)}...</div>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        {lead.email && (
                            <div className="flex items-center gap-3 text-sm">
                                <Mail size={16} className="text-accent-teal" />
                                <span className="font-medium text-surface-600">{lead.email}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-3 text-sm">
                            <MapPin size={16} className="text-accent-teal" />
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editData.address || ''}
                                    onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                                    className="flex-1 px-3 py-2 border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-accent-teal/30 focus:border-accent-teal outline-none transition-all"
                                />
                            ) : (
                                <span className="font-medium text-surface-600">{lead.address || 'No address'}</span>
                            )}
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <User size={16} className="text-accent-teal" />
                            <span className="font-medium text-surface-600">Rep: {lead.ownerId}</span>
                        </div>
                    </div>
                </div>

                {/* Vehicle Interest */}
                <div>
                    <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-widest mb-3">Vehicle Interest</h3>
                    <div className="bg-white rounded-2xl p-4 border border-surface-100 shadow-card">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Car size={20} className="text-deepal-600" />
                                <span className="font-display font-bold text-surface-900 text-lg">{lead.modelInterest}</span>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-surface-500">Budget</p>
                                {isEditing ? (
                                    <input
                                        type="number"
                                        value={editData.budget || 0}
                                        onChange={(e) => setEditData({ ...editData, budget: parseFloat(e.target.value) })}
                                        className="w-32 px-2 py-1.5 border border-surface-200 rounded-xl text-sm font-bold text-right focus:ring-2 focus:ring-accent-teal/30 outline-none"
                                    />
                                ) : (
                                    <p className="font-bold text-surface-900">₹{lead.budget?.toLocaleString() || 'TBD'}</p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <div className="w-3 h-3 rounded-full bg-surface-300"></div>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editData.vehicleColor || ''}
                                    onChange={(e) => setEditData({ ...editData, vehicleColor: e.target.value })}
                                    className="flex-1 px-2 py-1.5 border border-surface-200 rounded-xl focus:ring-2 focus:ring-accent-teal/30 outline-none"
                                    placeholder="Color"
                                />
                            ) : (
                                <span className="text-surface-600">{lead.vehicleColor || 'Color not specified'}</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Exchange Details */}
                {lead.exchange?.hasExchange && (
                    <div>
                        <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-widest mb-3">Exchange Details</h3>
                        <div className="bg-gradient-to-r from-deepal-50 to-accent-teal/10 rounded-2xl p-4 border border-deepal-100">
                            <div className="flex items-center gap-2 mb-3">
                                <RefreshCw size={18} className="text-deepal-600" />
                                <span className="font-display font-bold text-deepal-900">{lead.exchange.vehicleModel}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-xs text-deepal-600 mb-1">Expected Value</p>
                                    <p className="font-bold text-deepal-900">₹{lead.exchange.expectedValue ? (lead.exchange.expectedValue / 100000).toFixed(1) : '0'}L</p>
                                </div>
                                <div>
                                    <p className="text-xs text-deepal-600 mb-1">Offered Value</p>
                                    <p className="font-bold text-deepal-900">₹{lead.exchange.offeredValue ? (lead.exchange.offeredValue / 100000).toFixed(1) : 'Pending'}L</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Timeline */}
                <div>
                    <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-widest mb-3">Timeline</h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                            <Calendar size={16} className="text-surface-400" />
                            <span className="text-surface-600">Enquiry: {new Date(lead.createdAt).toLocaleDateString()}</span>
                        </div>
                        {lead.testDriveDate && (
                            <div className="flex items-center gap-3 text-sm">
                                <CheckCircle size={16} className="text-emerald-500" />
                                <span className="text-surface-600">Test Drive: {lead.testDriveDate}</span>
                            </div>
                        )}
                        {lead.nextFollowUpDate && (
                            <div className="flex items-center gap-3 text-sm">
                                <Clock size={16} className="text-amber-500" />
                                <span className="text-surface-600">Next Follow-up: {lead.nextFollowUpDate}</span>
                            </div>
                        )}
                        {lead.bookingDate && (
                            <div className="flex items-center gap-3 text-sm">
                                <DollarSign size={16} className="text-accent-teal" />
                                <span className="text-surface-600">Booked: {lead.bookingDate}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Remarks */}
                <div>
                    <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-widest mb-3">Remarks</h3>
                    {isEditing ? (
                        <textarea
                            value={editData.remarks || ''}
                            onChange={(e) => setEditData({ ...editData, remarks: e.target.value })}
                            className="w-full px-4 py-3 border border-surface-200 rounded-2xl resize-none focus:ring-2 focus:ring-accent-teal/30 focus:border-accent-teal outline-none transition-all"
                            rows={4}
                        />
                    ) : (
                        <div className="bg-white rounded-2xl p-4 border border-surface-100 shadow-card">
                            <p className="text-sm text-surface-700 italic leading-relaxed">
                                "{lead.remarks || 'No remarks captured.'}"
                            </p>
                        </div>
                    )}
                </div>

                {/* AI Score */}
                <div>
                    <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                        <Sparkles size={12} className="text-accent-teal" />
                        AI Insights
                    </h3>
                    <div className="bg-gradient-to-r from-deepal-50 via-accent-teal/10 to-deepal-50 rounded-2xl p-4 border border-deepal-100">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-deepal-900">Conversion Probability</span>
                            <span className="text-2xl font-display font-bold text-accent-teal">{lead.aiScore}%</span>
                        </div>
                        <div className="h-2 bg-white rounded-full overflow-hidden shadow-inner">
                            <div
                                className={`h-full transition-all duration-500 ${lead.aiScore > 80 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : lead.aiScore > 50 ? 'bg-gradient-to-r from-amber-500 to-amber-400' : 'bg-gradient-to-r from-red-500 to-red-400'}`}
                                style={{ width: `${lead.aiScore}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions Footer */}
            <div className="border-t border-surface-200 p-4 bg-white">
                <div className="flex gap-3 mb-3">
                    {!isEditing && (
                        <Button
                            variant="secondary"
                            onClick={() => setIsQuoteOpen(true)}
                            icon={FileText}
                            className="flex-1"
                        >
                            Generate Quote
                        </Button>
                    )}
                </div>
                <div className="flex gap-3">
                    {isEditing ? (
                        <>
                            <Button variant="secondary" onClick={() => setIsEditing(false)} className="flex-1">
                                Cancel
                            </Button>
                            <Button onClick={handleSave} icon={Save} className="flex-1">
                                Save Changes
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="secondary" onClick={handleEdit} icon={Edit2} className="flex-1">
                                Edit Details
                            </Button>
                            <Button
                                onClick={handleConvert}
                                variant="gradient"
                                className="flex-1"
                            >
                                Convert to Deal
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <QuotationBuilder
                lead={lead}
                isOpen={isQuoteOpen}
                onClose={() => setIsQuoteOpen(false)}
            />
        </div>
    );
};

export default LeadDetailPanel;
