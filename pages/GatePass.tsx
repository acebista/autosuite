import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../AuthContext';
import { PageHeader, Card, Badge, Button, Modal } from '../UI';
import {
    QrCode, Car, Clock, CheckCircle, XCircle, AlertTriangle,
    Plus, Search, Filter, Scan, ArrowRight, ArrowLeft, User
} from 'lucide-react';
import { GatePass, GatePassType, GatePassStatus, Vehicle } from '../types';
import { AuditLogger } from '../lib/auditLogger';

// Helper to generate QR data
const generateQRData = (pass: Partial<GatePass>): string => {
    return JSON.stringify({
        code: pass.passCode,
        vehicle: pass.vehicleModel,
        reg: pass.vehicleRegNumber,
        customer: pass.customerName,
        type: pass.passType,
        validUntil: pass.validUntil
    });
};

// Status badge colors
const statusColors: Record<GatePassStatus, 'success' | 'warning' | 'danger' | 'neutral'> = {
    active: 'success',
    used: 'neutral',
    expired: 'danger',
    cancelled: 'warning'
};

const passTypeLabels: Record<GatePassType, string> = {
    test_drive: '🚗 Test Drive',
    delivery: '🎉 Delivery',
    service_return: '🔧 Service Return',
    internal_transfer: '🔄 Internal Transfer'
};

// API functions
// Note: gate_passes table type will be added after running migration 004
const fetchGatePasses = async (): Promise<GatePass[]> => {
    const isMockData = localStorage.getItem('useMockData') === 'true';
    if (isMockData) {
        const { MOCK_GATE_PASSES } = await import('../mockData');
        return MOCK_GATE_PASSES;
    }

    const { data, error } = await (supabase as any)
        .from('gate_passes')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((p: any) => ({
        id: p.id,
        passCode: p.pass_code,
        qrData: p.qr_data,
        vehicleId: p.vehicle_id,
        vehicleModel: p.vehicle_model,
        vehicleRegNumber: p.vehicle_reg_number,
        vehicleVin: p.vehicle_vin,
        customerId: p.customer_id,
        customerName: p.customer_name,
        customerPhone: p.customer_phone,
        leadId: p.lead_id,
        passType: p.pass_type,
        purpose: p.purpose,
        issuedBy: p.issued_by,
        issuedAt: p.issued_at,
        validUntil: p.valid_until,
        status: p.status,
        exitedAt: p.exited_at,
        exitScannedBy: p.exit_scanned_by,
        exitOdometer: p.exit_odometer,
        exitFuelLevel: p.exit_fuel_level,
        returnedAt: p.returned_at,
        returnScannedBy: p.return_scanned_by,
        returnOdometer: p.return_odometer,
        returnFuelLevel: p.return_fuel_level,
        returnCondition: p.return_condition,
        returnNotes: p.return_notes
    }));
};

const GatePassPage: React.FC = () => {
    const queryClient = useQueryClient();
    const { user, orgId } = useAuth();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showScanModal, setShowScanModal] = useState(false);
    const [scanCode, setScanCode] = useState('');
    const [filterStatus, setFilterStatus] = useState<GatePassStatus | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const { data: passes = [], isLoading } = useQuery({
        queryKey: ['gate-passes'],
        queryFn: fetchGatePasses
    });

    // Create gate pass mutation
    const createPassMutation = useMutation({
        mutationFn: async (data: {
            vehicleId: string;
            vehicleModel: string;
            vehicleRegNumber?: string;
            customerName?: string;
            customerPhone?: string;
            passType: GatePassType;
            purpose?: string;
            validHours: number;
        }) => {
            const isMockData = localStorage.getItem('useMockData') === 'true';
            const passCode = `GP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
            const validUntil = new Date(Date.now() + data.validHours * 60 * 60 * 1000).toISOString();

            if (isMockData) {
                const { MOCK_GATE_PASSES } = await import('../mockData');
                const newPass: GatePass = {
                    id: `GP-${Date.now()}`,
                    passCode,
                    qrData: generateQRData({
                        passCode,
                        vehicleModel: data.vehicleModel,
                        vehicleRegNumber: data.vehicleRegNumber,
                        customerName: data.customerName,
                        passType: data.passType,
                        validUntil
                    }),
                    vehicleId: data.vehicleId,
                    vehicleModel: data.vehicleModel,
                    vehicleRegNumber: data.vehicleRegNumber || undefined,
                    customerName: data.customerName || undefined,
                    customerPhone: data.customerPhone || undefined,
                    passType: data.passType,
                    purpose: data.purpose || undefined,
                    issuedBy: user?.id || 'demo-user',
                    issuedAt: new Date().toISOString(),
                    validUntil,
                    status: 'active'
                };
                MOCK_GATE_PASSES.unshift(newPass);
                return newPass;
            }

            const newPass = {
                pass_code: passCode,
                qr_data: generateQRData({
                    passCode,
                    vehicleModel: data.vehicleModel,
                    vehicleRegNumber: data.vehicleRegNumber,
                    customerName: data.customerName,
                    passType: data.passType,
                    validUntil
                }),
                vehicle_id: data.vehicleId,
                vehicle_model: data.vehicleModel,
                vehicle_reg_number: data.vehicleRegNumber || null,
                customer_name: data.customerName || null,
                customer_phone: data.customerPhone || null,
                pass_type: data.passType,
                purpose: data.purpose || null,
                issued_by: user?.id,
                valid_until: validUntil,
                status: 'active',
                org_id: orgId
            };

            const { data: result, error } = await (supabase as any)
                .from('gate_passes')
                .insert([newPass])
                .select()
                .single();

            if (error) throw error;

            await AuditLogger.logGatePassIssued(data.vehicleId, passCode, data.passType as any);

            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gate-passes'] });
            setShowCreateModal(false);
        }
    });

    // Scan/update gate pass mutation
    const scanPassMutation = useMutation({
        mutationFn: async ({ passCode, action }: { passCode: string; action: 'exit' | 'return' }) => {
            const isMockData = localStorage.getItem('useMockData') === 'true';

            if (isMockData) {
                const { MOCK_GATE_PASSES } = await import('../mockData');
                const pass = MOCK_GATE_PASSES.find((p: any) => p.passCode === passCode);
                if (pass) {
                    if (action === 'exit') {
                        pass.exitedAt = new Date().toISOString();
                        pass.exitScannedBy = user?.id || 'demo-user';
                    } else {
                        pass.returnedAt = new Date().toISOString();
                        pass.returnScannedBy = user?.id || 'demo-user';
                        pass.status = 'used';
                    }
                }
                return;
            }

            const updateData: any = {};

            if (action === 'exit') {
                updateData.exited_at = new Date().toISOString();
                updateData.exit_scanned_by = user?.id;
            } else {
                updateData.returned_at = new Date().toISOString();
                updateData.return_scanned_by = user?.id;
                updateData.status = 'used';
            }

            const { error } = await (supabase as any)
                .from('gate_passes')
                .update(updateData)
                .eq('pass_code', passCode);

            if (error) throw error;

            await AuditLogger.logGatePassScanned(passCode, action);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gate-passes'] });
            setShowScanModal(false);
            setScanCode('');
        }
    });

    // Filter passes
    const filteredPasses = useMemo(() => {
        return passes.filter(p => {
            if (filterStatus !== 'all' && p.status !== filterStatus) return false;
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return (
                    p.passCode.toLowerCase().includes(query) ||
                    p.vehicleModel.toLowerCase().includes(query) ||
                    p.customerName?.toLowerCase().includes(query) ||
                    p.vehicleRegNumber?.toLowerCase().includes(query)
                );
            }
            return true;
        });
    }, [passes, filterStatus, searchQuery]);

    // Stats
    const stats = useMemo(() => ({
        active: passes.filter(p => p.status === 'active').length,
        outNow: passes.filter(p => p.status === 'active' && p.exitedAt && !p.returnedAt).length,
        todayIssued: passes.filter(p =>
            new Date(p.issuedAt).toDateString() === new Date().toDateString()
        ).length
    }), [passes]);

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <PageHeader
                title="Gate Pass Control"
                subtitle="Phase 1: Trust & Control — No vehicle moves without authorization"
                actions={
                    <div className="flex gap-3">
                        <Button variant="secondary" icon={Scan} onClick={() => setShowScanModal(true)}>
                            Scan Pass
                        </Button>
                        <Button icon={Plus} onClick={() => setShowCreateModal(true)}>
                            Issue Pass
                        </Button>
                    </div>
                }
            />

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-none">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <QrCode size={24} />
                        </div>
                        <div>
                            <p className="text-green-100 text-xs font-bold uppercase">Active Passes</p>
                            <p className="text-3xl font-black">{stats.active}</p>
                        </div>
                    </div>
                </Card>

                <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white border-none">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <ArrowRight size={24} />
                        </div>
                        <div>
                            <p className="text-orange-100 text-xs font-bold uppercase">Vehicles Out Now</p>
                            <p className="text-3xl font-black">{stats.outNow}</p>
                        </div>
                    </div>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-none">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <Clock size={24} />
                        </div>
                        <div>
                            <p className="text-blue-100 text-xs font-bold uppercase">Issued Today</p>
                            <p className="text-3xl font-black">{stats.todayIssued}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by code, vehicle, customer..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                </div>
                <div className="flex gap-2">
                    {(['all', 'active', 'used', 'expired', 'cancelled'] as const).map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${filterStatus === status
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Passes List */}
            <div className="space-y-4">
                {isLoading ? (
                    <Card>
                        <div className="text-center py-12 text-slate-500">Loading passes...</div>
                    </Card>
                ) : filteredPasses.length === 0 ? (
                    <Card>
                        <div className="text-center py-12">
                            <QrCode size={48} className="text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500 font-medium">No gate passes found</p>
                            <p className="text-slate-400 text-sm">Issue a new pass to track vehicle movements</p>
                        </div>
                    </Card>
                ) : (
                    filteredPasses.map(pass => (
                        <Card
                            key={pass.id}
                            className={`border-l-4 ${pass.status === 'active'
                                ? pass.exitedAt && !pass.returnedAt
                                    ? 'border-l-orange-500 bg-orange-50/30'
                                    : 'border-l-green-500'
                                : 'border-l-slate-300'
                                }`}
                        >
                            <div className="flex flex-wrap gap-4 items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 bg-slate-100 rounded-xl flex items-center justify-center">
                                        <QrCode size={28} className="text-slate-600" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-black text-slate-900">{pass.passCode}</span>
                                            <Badge variant={statusColors[pass.status]} size="sm">
                                                {pass.status.toUpperCase()}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-slate-600 font-medium">{pass.vehicleModel}</p>
                                        {pass.vehicleRegNumber && (
                                            <p className="text-xs text-slate-400">{pass.vehicleRegNumber}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-6 text-sm">
                                    <div>
                                        <p className="text-slate-400 text-xs font-bold uppercase">Type</p>
                                        <p className="font-medium">{passTypeLabels[pass.passType]}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 text-xs font-bold uppercase">Customer</p>
                                        <p className="font-medium">{pass.customerName || '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 text-xs font-bold uppercase">Valid Until</p>
                                        <p className="font-medium">
                                            {new Date(pass.validUntil).toLocaleString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: 'numeric',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 text-xs font-bold uppercase">Status</p>
                                        <div className="flex items-center gap-2">
                                            {pass.exitedAt && !pass.returnedAt ? (
                                                <span className="text-orange-600 font-bold flex items-center gap-1">
                                                    <ArrowRight size={14} /> Out
                                                </span>
                                            ) : pass.returnedAt ? (
                                                <span className="text-green-600 font-bold flex items-center gap-1">
                                                    <ArrowLeft size={14} /> Returned
                                                </span>
                                            ) : (
                                                <span className="text-blue-600 font-bold">Ready</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {pass.status === 'active' && (
                                    <div className="flex gap-2">
                                        {!pass.exitedAt && (
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                icon={ArrowRight}
                                                onClick={() => scanPassMutation.mutate({ passCode: pass.passCode, action: 'exit' })}
                                            >
                                                Mark Exit
                                            </Button>
                                        )}
                                        {pass.exitedAt && !pass.returnedAt && (
                                            <Button
                                                size="sm"
                                                icon={ArrowLeft}
                                                onClick={() => scanPassMutation.mutate({ passCode: pass.passCode, action: 'return' })}
                                            >
                                                Mark Return
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* Create Modal - Simplified for now */}
            {showCreateModal && (
                <Modal
                    title="Issue New Gate Pass"
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                >
                    <CreateGatePassForm
                        onSubmit={(data) => createPassMutation.mutate(data)}
                        onCancel={() => setShowCreateModal(false)}
                        isLoading={createPassMutation.isPending}
                    />
                </Modal>
            )}

            {/* Scan Modal */}
            {showScanModal && (
                <Modal
                    title="Scan Gate Pass"
                    isOpen={showScanModal}
                    onClose={() => setShowScanModal(false)}
                >
                    <div className="space-y-4">
                        <input
                            type="text"
                            placeholder="Enter or scan pass code (e.g., GP-2026-123456)"
                            value={scanCode}
                            onChange={(e) => setScanCode(e.target.value.toUpperCase())}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-center font-mono text-lg"
                            autoFocus
                        />
                        <div className="flex gap-3">
                            <Button
                                variant="secondary"
                                className="flex-1"
                                icon={ArrowRight}
                                onClick={() => scanPassMutation.mutate({ passCode: scanCode, action: 'exit' })}
                                disabled={!scanCode}
                            >
                                Record Exit
                            </Button>
                            <Button
                                className="flex-1"
                                icon={ArrowLeft}
                                onClick={() => scanPassMutation.mutate({ passCode: scanCode, action: 'return' })}
                                disabled={!scanCode}
                            >
                                Record Return
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

// Create Form Component
interface CreateFormProps {
    onSubmit: (data: any) => void;
    onCancel: () => void;
    isLoading: boolean;
}

const CreateGatePassForm: React.FC<CreateFormProps> = ({ onSubmit, onCancel, isLoading }) => {
    const [formData, setFormData] = useState({
        vehicleId: '',
        vehicleModel: '',
        vehicleRegNumber: '',
        customerName: '',
        customerPhone: '',
        passType: 'test_drive' as GatePassType,
        purpose: '',
        validHours: 4
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Vehicle Model *</label>
                <input
                    type="text"
                    required
                    value={formData.vehicleModel}
                    onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g., Honda City ZX CVT"
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Registration Number</label>
                <input
                    type="text"
                    value={formData.vehicleRegNumber}
                    onChange={(e) => setFormData({ ...formData, vehicleRegNumber: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g., BA 1 PA 1234"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Customer Name</label>
                    <input
                        type="text"
                        value={formData.customerName}
                        onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Customer Phone</label>
                    <input
                        type="tel"
                        value={formData.customerPhone}
                        onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Pass Type *</label>
                <select
                    value={formData.passType}
                    onChange={(e) => setFormData({ ...formData, passType: e.target.value as GatePassType })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                    <option value="test_drive">🚗 Test Drive</option>
                    <option value="delivery">🎉 Delivery</option>
                    <option value="service_return">🔧 Service Return</option>
                    <option value="internal_transfer">🔄 Internal Transfer</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Valid For</label>
                <select
                    value={formData.validHours}
                    onChange={(e) => setFormData({ ...formData, validHours: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                    <option value={2}>2 Hours</option>
                    <option value={4}>4 Hours</option>
                    <option value={8}>8 Hours</option>
                    <option value={24}>24 Hours</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Purpose/Notes</label>
                <textarea
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                    rows={2}
                />
            </div>

            <div className="flex gap-3 pt-4">
                <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={isLoading || !formData.vehicleModel}>
                    {isLoading ? 'Issuing...' : 'Issue Gate Pass'}
                </Button>
            </div>
        </form>
    );
};

export default GatePassPage;
