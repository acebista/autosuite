import React, { useState } from 'react';
import { useProformaInvoices, useCreatePI, useCreateLC, useInventory, useUpdateVehicle, useTransitionState, supabase } from '../api';
import { PageHeader, Card, Badge, Button, MetricCard, Skeleton } from '../UI';
import { Package, ShieldCheck, Truck, ClipboardList, CheckCircle2, AlertTriangle, Calendar, Plus, ExternalLink, RefreshCw, Send, ArrowRight } from 'lucide-react';
import { STATE_METADATA } from '../lib/stateMachine';
import { PRODUCT_CATALOG } from '../constants';
import { useAuthStore } from '../lib/store';

const Procurement: React.FC = () => {
  const { data: pis = [], isLoading: isPisLoading, refetch: refetchPis } = useProformaInvoices();
  const { data: vehicles = [], isLoading: isVehiclesLoading, refetch: refetchVehicles } = useInventory();
  
  const createPIMutation = useCreatePI();
  const createLCMutation = useCreateLC();
  const updateVehicleMutation = useUpdateVehicle();
  const transitionMutation = useTransitionState();

  const [activeTab, setActiveTab] = useState<'pis' | 'lcs' | 'incoming'>('pis');
  const [showPIModal, setShowPIModal] = useState(false);
  const [showLCModal, setShowLCModal] = useState(false);
  const [selectedPI, setSelectedPI] = useState<any>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [showGRNModal, setShowGRNModal] = useState(false);

  // Form states
  const [piNumber, setPiNumber] = useState('');
  const [piDate, setPiDate] = useState('');
  const [piAmount, setPiAmount] = useState('');
  const [lcNumber, setLcNumber] = useState('');
  const [lcBank, setLcBank] = useState('');
  const [lcBranch, setLcBranch] = useState('');
  const [lcDate, setLcDate] = useState('');
  const [lcAmount, setLcAmount] = useState('');

  // GRN states
  const [grnNo, setGrnNo] = useState('');
  const [engineNo, setEngineNo] = useState('');
  const [chassisNo, setChassisNo] = useState('');

  // New vehicle fields (PO Issued)
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [vPIId, setVPIId] = useState('');
  const [vModel, setVModel] = useState('Nexon EV');
  const [vVariant, setVVariant] = useState('Empowered');
  const [vColor, setVColor] = useState('Intense Teal');
  const [vPrice, setVPrice] = useState('3899000');
  const [vCost, setVCost] = useState('3200000');
  const [vVin, setVVin] = useState('');

  // Computed metrics
  const activePIs = pis.length;
  const activeLCs = pis.filter(p => p.lc).length;
  const transitCount = vehicles.filter(v => v.vehicleState === 'IN_TRANSIT').length;
  
  const lcAgingHealth = (() => {
    const lcs = pis.map(p => p.lc).filter(Boolean);
    if (!lcs.length) return 100;
    const withinTarget = lcs.filter(lc => {
      const days = Math.floor((Date.now() - new Date(lc.openingDate).getTime()) / (1000 * 60 * 60 * 24));
      return days <= 95;
    }).length;
    return Math.round((withinTarget / lcs.length) * 100);
  })();

  const handleCreatePI = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPIMutation.mutateAsync({
        piNumber,
        supplier: 'MAW',
        issueDate: piDate,
        totalAmount: Number(piAmount),
        currency: 'NPR'
      });
      setShowPIModal(false);
      setPiNumber('');
      setPiDate('');
      setPiAmount('');
      refetchPis();
    } catch (err: any) {
      alert('Error creating PI: ' + err.message);
    }
  };

  const handleCreateLC = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createLCMutation.mutateAsync({
        lcNumber,
        piId: selectedPI.id,
        bankName: lcBank,
        bankBranch: lcBranch,
        openingDate: lcDate,
        amount: Number(lcAmount),
        currency: 'NPR',
        targetCycleDays: 90
      });
      setShowLCModal(false);
      setLcNumber('');
      setLcBank('');
      setLcBranch('');
      setLcDate('');
      setLcAmount('');
      refetchPis();
    } catch (err: any) {
      alert('Error creating LC: ' + err.message);
    }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 1. Create vehicle using standard supabase client or hooks with active orgId scope
      const orgId = useAuthStore.getState().user?.orgId;
      const pi = pis.find(p => p.id === vPIId);
      
      const { data: newV, error } = await supabase
        .from('vehicles')
        .insert([{
          model: vModel,
          variant: vVariant,
          color: vColor,
          price: Number(vPrice),
          cost: Number(vCost),
          vin: vVin || `TEMP-${Date.now()}`,
          status: 'Transit',
          vehicle_state: 'PO_ISSUED',
          pi_id: vPIId,
          lc_id: pi?.lc?.id || null,
          proforma_invoice_no: pi?.piNumber || '',
          lc_no: pi?.lc?.lcNumber || '',
          motor_no: engineNo || '',
          year: 2025,
          fuel_type: PRODUCT_CATALOG.find(c => c.model === vModel && c.variant === vVariant)?.fuelType || 'EV',
          image_url: (() => {
            const catalogItem = PRODUCT_CATALOG.find(c => c.model === vModel && c.variant === vVariant);
            const colorItem = catalogItem?.availableColors?.find(col => col.color === vColor);
            return colorItem?.image || catalogItem?.image || '';
          })(),
          org_id: orgId || null
        }])
        .select()
        .single();
      
      if (error) throw error;

      // 2. Transition state to track PO_ISSUED audit trail
      await transitionMutation.mutateAsync({
        entityId: newV.id,
        entityType: 'VEHICLE',
        fromState: 'PO_ISSUED',
        toState: 'PO_ISSUED',
        notes: `Vehicle added to PI ${pis.find(p => p.id === vPIId)?.piNumber}`
      });

      setShowVehicleModal(false);
      setVVin('');
      refetchVehicles();
    } catch (err: any) {
      alert('Error adding vehicle: ' + err.message);
    }
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

      refetchVehicles();
    } catch (err: any) {
      alert('Error shipping vehicle: ' + err.message);
    }
  };

  const handleOpenGRN = (v: any) => {
    setSelectedVehicle(v);
    setGrnNo(`GRN-${Date.now().toString().slice(-6)}`);
    setEngineNo('');
    setChassisNo('');
    setShowGRNModal(true);
  };

  const handleGRNSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 1. Update vehicle with GRN, Received dates, and Engine/Chassis numbers
      await updateVehicleMutation.mutateAsync({
        id: selectedVehicle.id,
        patch: {
          grnNumber: grnNo,
          receivedAt: new Date().toISOString(),
          chassisNo: chassisNo,
          vin: chassisNo, // Override temporary VIN with real chassis no
          motorNo: engineNo
        } as any
      });

      // 2. Transition state to RECEIVED
      await transitionMutation.mutateAsync({
        entityId: selectedVehicle.id,
        entityType: 'VEHICLE',
        fromState: 'IN_TRANSIT',
        toState: 'RECEIVED',
        notes: `Vehicle received. GRN Number: ${grnNo}`
      });

      setShowGRNModal(false);
      refetchVehicles();
    } catch (err: any) {
      alert('Error submitting GRN: ' + err.message);
    }
  };

  const handleMarkInStock = async (vId: string) => {
    try {
      // 1. Update status to 'In Stock'
      await updateVehicleMutation.mutateAsync({
        id: vId,
        patch: { status: 'In Stock' }
      });

      // 2. Transition state to IN_STOCK
      await transitionMutation.mutateAsync({
        entityId: vId,
        entityType: 'VEHICLE',
        fromState: 'RECEIVED',
        toState: 'IN_STOCK',
        notes: 'Vehicle inspection completed. Moved to In Stock.'
      });

      refetchVehicles();
    } catch (err: any) {
      alert('Error marking in stock: ' + err.message);
    }
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

  const isLoading = isPisLoading || isVehiclesLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Procurement & Inventory" subtitle="Manage PIs, Letters of Credit, and Incoming Stock" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <PageHeader
        title="Procurement & Inventory"
        subtitle="Standardized state machine tracking for vehicles"
        actions={
          <div className="flex gap-3">
            <Button onClick={() => setShowPIModal(true)} icon={Plus}>Log PI</Button>
          </div>
        }
      />

      {/* KPI Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard label="Total PIs Logged" value={activePIs} icon={ClipboardList} />
        <MetricCard label="Open LCs" value={activeLCs} icon={ShieldCheck} />
        <MetricCard label="Vehicles in Transit" value={transitCount} icon={Truck} />
        <MetricCard
          label="LC Cycle Compliance"
          value={`${lcAgingHealth}%`}
          trend={lcAgingHealth >= 90 ? 'up' : 'down'}
          trendValue={lcAgingHealth >= 90 ? 'Within 95d limit' : 'Overdue risk detected'}
          icon={CheckCircle2}
        />
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-surface-200 gap-6">
        <button
          onClick={() => setActiveTab('pis')}
          className={`py-3 px-1 text-sm font-semibold border-b-2 transition-all ${activeTab === 'pis' ? 'border-accent-teal text-accent-teal' : 'border-transparent text-surface-500 hover:text-surface-900'}`}
        >
          Proforma Invoices ({activePIs})
        </button>
        <button
          onClick={() => setActiveTab('lcs')}
          className={`py-3 px-1 text-sm font-semibold border-b-2 transition-all ${activeTab === 'lcs' ? 'border-accent-teal text-accent-teal' : 'border-transparent text-surface-500 hover:text-surface-900'}`}
        >
          Letters of Credit ({activeLCs})
        </button>
        <button
          onClick={() => setActiveTab('incoming')}
          className={`py-3 px-1 text-sm font-semibold border-b-2 transition-all ${activeTab === 'incoming' ? 'border-accent-teal text-accent-teal' : 'border-transparent text-surface-500 hover:text-surface-900'}`}
        >
          Incoming Fleet ({vehicles.filter(v => ['PO_ISSUED', 'LC_OPENED', 'IN_TRANSIT', 'RECEIVED'].includes(v.vehicleState)).length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'pis' && (
        <Card className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-surface-150 text-xs font-semibold uppercase tracking-wider text-surface-500">
                <th className="py-4 px-6">PI Number</th>
                <th className="py-4 px-6">Supplier</th>
                <th className="py-4 px-6">Issue Date</th>
                <th className="py-4 px-6">Total Amount</th>
                <th className="py-4 px-6">Linked LC</th>
                <th className="py-4 px-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 text-sm">
              {pis.map((pi) => {
                const linkedVehicles = vehicles.filter(v => v.piId === pi.id);
                return (
                  <React.Fragment key={pi.id}>
                    <tr className="hover:bg-surface-50/50 transition-colors border-b border-surface-150">
                      <td className="py-4 px-6 font-semibold text-surface-900">{pi.piNumber}</td>
                      <td className="py-4 px-6 text-surface-600">{pi.supplier}</td>
                      <td className="py-4 px-6 text-surface-600">{new Date(pi.issueDate).toLocaleDateString()}</td>
                      <td className="py-4 px-6 font-mono text-surface-900">₹{(pi.totalAmount).toLocaleString()}</td>
                      <td className="py-4 px-6">
                        {pi.lc ? (
                          <Badge variant="teal">{pi.lc.lcNumber}</Badge>
                        ) : (
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => {
                              setSelectedPI(pi);
                              setShowLCModal(true);
                            }}
                          >
                            Open LC
                          </Button>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => {
                            setVPIId(pi.id);
                            setShowVehicleModal(true);
                          }}
                          icon={Plus}
                        >
                          Add Vehicle
                        </Button>
                      </td>
                    </tr>
                    {linkedVehicles.length > 0 && (
                      <tr className="bg-surface-50/30">
                        <td colSpan={6} className="py-2 px-8">
                          <div className="flex flex-wrap gap-2">
                            {linkedVehicles.map(v => (
                              <div key={v.id} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-surface-200 text-xs shadow-sm">
                                <span className="font-semibold text-surface-800">{v.model}</span>
                                <span className="text-surface-400 font-mono">({v.color})</span>
                                <Badge size="sm" color={STATE_METADATA[v.vehicleState as any]?.color || 'slate'}>
                                  {STATE_METADATA[v.vehicleState as any]?.label || v.vehicleState}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {pis.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-surface-500">No PIs logged yet. Click "Log PI" to begin.</td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      {activeTab === 'lcs' && (
        <Card className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-surface-150 text-xs font-semibold uppercase tracking-wider text-surface-500">
                <th className="py-4 px-6">LC Number</th>
                <th className="py-4 px-6">PI Ref</th>
                <th className="py-4 px-6">Bank Name</th>
                <th className="py-4 px-6">Opening Date</th>
                <th className="py-4 px-6">Aging Status</th>
                <th className="py-4 px-6">LC Limit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 text-sm">
              {pis.filter(p => p.lc).map((pi) => {
                const lc = pi.lc!;
                const daysOpen = Math.floor((Date.now() - new Date(lc.openingDate).getTime()) / (1000 * 60 * 60 * 24));
                const cyclePercent = Math.min((daysOpen / lc.targetCycleDays) * 100, 100);
                
                let barColor = 'bg-green-500';
                let statusBadge = <Badge variant="success">Healthy ({daysOpen}d)</Badge>;

                if (daysOpen > 95) {
                  barColor = 'bg-red-500';
                  statusBadge = <Badge variant="error">Critical Breach ({daysOpen}d)</Badge>;
                } else if (daysOpen > 85) {
                  barColor = 'bg-orange-500';
                  statusBadge = <Badge variant="warning">Warning Cycle ({daysOpen}d)</Badge>;
                }

                return (
                  <tr key={lc.id} className="hover:bg-surface-50/50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-surface-900">{lc.lcNumber}</td>
                    <td className="py-4 px-6 text-surface-500">{pi.piNumber}</td>
                    <td className="py-4 px-6 text-surface-700">{lc.bankName}</td>
                    <td className="py-4 px-6 text-surface-600">{new Date(lc.openingDate).toLocaleDateString()}</td>
                    <td className="py-4 px-6 min-w-[200px]">
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-2 bg-surface-100 rounded-full overflow-hidden">
                          <div className={`h-full ${barColor} rounded-full`} style={{ width: `${cyclePercent}%` }}></div>
                        </div>
                        {statusBadge}
                      </div>
                    </td>
                    <td className="py-4 px-6 font-mono font-semibold text-surface-900">₹{(lc.amount).toLocaleString()}</td>
                  </tr>
                );
              })}
              {pis.filter(p => p.lc).length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-surface-500">No active Letters of Credit found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      {activeTab === 'incoming' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.filter(v => ['PO_ISSUED', 'LC_OPENED', 'IN_TRANSIT', 'RECEIVED'].includes(v.vehicleState)).map((v) => {
            const meta = STATE_METADATA[v.vehicleState as any] || { label: v.vehicleState, color: 'slate' };
            const pi = pis.find(p => p.id === v.piId);

            return (
              <Card key={v.id} className="hover-lift flex flex-col justify-between border border-surface-200">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-display font-semibold text-surface-900">{v.model}</h4>
                      <p className="text-xs text-surface-500 mt-0.5">{v.variant} • {v.color}</p>
                    </div>
                    <Badge color={meta.color}>{meta.label}</Badge>
                  </div>

                  <div className="space-y-2.5 text-xs text-surface-600 border-t border-surface-100 pt-3">
                    <div className="flex justify-between">
                      <span>PI Ref:</span>
                      <span className="font-semibold text-surface-800">{pi?.piNumber || 'N/A'}</span>
                    </div>
                    {pi?.lc && (
                      <div className="flex justify-between">
                        <span>LC Ref:</span>
                        <span className="font-semibold text-surface-800">{pi.lc.lcNumber}</span>
                      </div>
                    )}
                    {v.expectedDeliveryDate && (
                      <div className="flex justify-between">
                        <span>Exp Delivery:</span>
                        <span className="font-semibold text-surface-800">{new Date(v.expectedDeliveryDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {v.grnNumber && (
                      <div className="flex justify-between">
                        <span>GRN:</span>
                        <span className="font-mono font-semibold text-surface-800">{v.grnNumber}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-surface-100 flex justify-end gap-2">
                  {v.vehicleState === 'PO_ISSUED' && pi?.lc && (
                    <Button
                      size="xs"
                      onClick={() => {
                        // Open LC updates state to LC_OPENED
                        transitionMutation.mutate({
                          entityId: v.id,
                          entityType: 'VEHICLE',
                          fromState: 'PO_ISSUED',
                          toState: 'LC_OPENED',
                          notes: 'LC opened and linked. Ready to ship.'
                        });
                      }}
                      icon={ShieldCheck}
                    >
                      Link Opened LC
                    </Button>
                  )}
                  {v.vehicleState === 'LC_OPENED' && (
                    <Button
                      size="xs"
                      onClick={() => handleShipVehicle(v.id)}
                      icon={Truck}
                    >
                      Mark Shipped
                    </Button>
                  )}
                  {v.vehicleState === 'IN_TRANSIT' && (
                    <Button
                      size="xs"
                      variant="gradient"
                      onClick={() => handleOpenGRN(v)}
                      icon={ClipboardList}
                    >
                      Process GRN arrival
                    </Button>
                  )}
                  {v.vehicleState === 'RECEIVED' && (
                    <div className="flex gap-1.5 w-full">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => sendMawEmail('grn', {
                          piNumber: pi?.piNumber,
                          grnNumber: v.grnNumber,
                          chassisNo: v.chassisNo || v.vin,
                          motorNo: v.motorNo
                        })}
                        icon={Send}
                        className="flex-1"
                      >
                        Notify MAW
                      </Button>
                      <Button
                        size="xs"
                        variant="gradient"
                        onClick={() => handleMarkInStock(v.id)}
                        icon={CheckCircle2}
                        className="flex-1"
                      >
                        Approve Stock
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
          {vehicles.filter(v => ['PO_ISSUED', 'LC_OPENED', 'IN_TRANSIT', 'RECEIVED'].includes(v.vehicleState)).length === 0 && (
            <div className="col-span-3 text-center py-20 text-surface-500">
              No vehicles in procurement cycle. Log a PI to start the vehicle journey.
            </div>
          )}
        </div>
      )}

      {/* PI Log Modal */}
      {showPIModal && (
        <div className="fixed inset-0 bg-surface-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md animate-scale-up border border-surface-200">
            <h3 className="font-display font-semibold text-lg text-surface-900 mb-6">Log Proforma Invoice</h3>
            <form onSubmit={handleCreatePI} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-surface-600 mb-1.5 uppercase tracking-wide">PI Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MAW-2026-004"
                  value={piNumber}
                  onChange={e => setPiNumber(e.target.value)}
                  className="w-full bg-surface-50 border border-surface-200 rounded-xl px-4 py-3 text-sm focus-ring text-surface-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-surface-600 mb-1.5 uppercase tracking-wide">Issue Date</label>
                  <input
                    type="date"
                    required
                    value={piDate}
                    onChange={e => setPiDate(e.target.value)}
                    className="w-full bg-surface-50 border border-surface-200 rounded-xl px-4 py-3 text-sm focus-ring text-surface-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-600 mb-1.5 uppercase tracking-wide">Total Amount</label>
                  <input
                    type="number"
                    required
                    placeholder="Total in NPR"
                    value={piAmount}
                    onChange={e => setPiAmount(e.target.value)}
                    className="w-full bg-surface-50 border border-surface-200 rounded-xl px-4 py-3 text-sm focus-ring text-surface-900"
                  />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <Button variant="outline" type="button" onClick={() => setShowPIModal(false)}>Cancel</Button>
                <Button variant="gradient" type="submit">Submit PI</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* LC Open Modal */}
      {showLCModal && (
        <div className="fixed inset-0 bg-surface-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md animate-scale-up border border-surface-200">
            <h3 className="font-display font-semibold text-lg text-surface-900 mb-6">Open Letter of Credit</h3>
            <p className="text-xs text-surface-500 mb-4">Linking to PI: <span className="font-semibold">{selectedPI?.piNumber}</span></p>
            <form onSubmit={handleCreateLC} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-surface-600 mb-1.5 uppercase tracking-wide">LC Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. LC/DOM/2026/102"
                  value={lcNumber}
                  onChange={e => setLcNumber(e.target.value)}
                  className="w-full bg-surface-50 border border-surface-200 rounded-xl px-4 py-3 text-sm focus-ring text-surface-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-surface-600 mb-1.5 uppercase tracking-wide">Bank Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nabil Bank"
                    value={lcBank}
                    onChange={e => setLcBank(e.target.value)}
                    className="w-full bg-surface-50 border border-surface-200 rounded-xl px-4 py-3 text-sm focus-ring text-surface-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-600 mb-1.5 uppercase tracking-wide">Branch</label>
                  <input
                    type="text"
                    placeholder="e.g. Kathmandu"
                    value={lcBranch}
                    onChange={e => setLcBranch(e.target.value)}
                    className="w-full bg-surface-50 border border-surface-200 rounded-xl px-4 py-3 text-sm focus-ring text-surface-900"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-surface-600 mb-1.5 uppercase tracking-wide">Opening Date</label>
                  <input
                    type="date"
                    required
                    value={lcDate}
                    onChange={e => setLcDate(e.target.value)}
                    className="w-full bg-surface-50 border border-surface-200 rounded-xl px-4 py-3 text-sm focus-ring text-surface-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-600 mb-1.5 uppercase tracking-wide">Amount Limit</label>
                  <input
                    type="number"
                    required
                    value={lcAmount}
                    onChange={e => setLcAmount(e.target.value)}
                    className="w-full bg-surface-50 border border-surface-200 rounded-xl px-4 py-3 text-sm focus-ring text-surface-900"
                  />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <Button variant="outline" type="button" onClick={() => setShowLCModal(false)}>Cancel</Button>
                <Button variant="gradient" type="submit">Activate LC</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Vehicle Add Modal */}
      {showVehicleModal && (() => {
        const catalogModels = Array.from(new Set(PRODUCT_CATALOG.map(v => v.model)));
        const activeModels = catalogModels.length > 0 ? catalogModels : ['Deepal S07', 'Deepal L07', 'Deepal E07', 'Deepal S05'];
        const variantsForModel = PRODUCT_CATALOG.filter(v => v.model === vModel);

        const handleModelChangeLocal = (model: string) => {
          setVModel(model);
          setVVariant('');
          setVColor('');
        };

        const handleVariantChangeLocal = (variant: string) => {
          const selected = PRODUCT_CATALOG.find(v => v.model === vModel && v.variant === variant);
          if (selected) {
            setVVariant(variant);
            setVPrice(selected.price.toString());
            setVCost(selected.cost.toString());
          }
        };

        return (
          <div className="fixed inset-0 bg-surface-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl animate-scale-up border border-surface-200">
              <h3 className="font-display font-semibold text-lg text-surface-900 mb-6">Add Vehicle & Link to PI</h3>
              <form onSubmit={handleAddVehicle} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-xs font-semibold text-surface-600 mb-1.5 uppercase tracking-wide">Select Model *</label>
                    <select
                      value={vModel}
                      onChange={(e) => handleModelChangeLocal(e.target.value)}
                      className="w-full bg-surface-50 border border-surface-200 rounded-xl px-4 py-3 text-sm focus-ring text-surface-900"
                    >
                      <option value="">Select Model...</option>
                      {activeModels.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-xs font-semibold text-surface-600 mb-1.5 uppercase tracking-wide">Select Variant *</label>
                    <select
                      disabled={!vModel}
                      value={vVariant}
                      onChange={(e) => handleVariantChangeLocal(e.target.value)}
                      className="w-full bg-surface-50 border border-surface-200 rounded-xl px-4 py-3 text-sm focus-ring text-surface-900"
                    >
                      <option value="">Select Variant...</option>
                      {variantsForModel.map(v => <option key={v.variant} value={v.variant}>{v.variant}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-surface-600 mb-1.5 uppercase tracking-wide">VIN Number *</label>
                    <input 
                      required 
                      value={vVin}
                      onChange={(e) => setVVin(e.target.value)}
                      placeholder="VIN12345" 
                      className="w-full bg-surface-50 border border-surface-200 rounded-xl px-4 py-3 text-sm focus-ring text-surface-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-surface-600 mb-1.5 uppercase tracking-wide">Motor Number *</label>
                    <input 
                      required 
                      value={engineNo}
                      onChange={(e) => setEngineNo(e.target.value)}
                      placeholder="e.g. MOT-89302-A" 
                      className="w-full bg-surface-50 border border-surface-200 rounded-xl px-4 py-3 text-sm focus-ring text-surface-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-surface-600 mb-1.5 uppercase tracking-wide">Year *</label>
                    <input 
                      type="number" 
                      required 
                      placeholder="2025" 
                      defaultValue="2025"
                      className="w-full bg-surface-50 border border-surface-200 rounded-xl px-4 py-3 text-sm focus-ring text-surface-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-surface-600 mb-1.5 uppercase tracking-wide">Stock Color *</label>
                    <select
                      disabled={!vVariant}
                      value={vColor}
                      onChange={(e) => setVColor(e.target.value)}
                      className="w-full bg-surface-50 border border-surface-200 rounded-xl px-4 py-3 text-sm focus-ring text-surface-900"
                    >
                      <option value="">Select Color...</option>
                      {variantsForModel.find(v => v.variant === vVariant)?.availableColors?.map((c: any) => (
                        <option key={c.color} value={c.color}>{c.color}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-surface-600 mb-1.5 uppercase tracking-wide">Purchase Cost (NPR) *</label>
                    <input 
                      type="number" 
                      required 
                      value={vCost}
                      onChange={(e) => setVCost(e.target.value)}
                      placeholder="4800000" 
                      className="w-full bg-surface-50 border border-surface-200 rounded-xl px-4 py-3 text-sm focus-ring text-surface-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-surface-600 mb-1.5 uppercase tracking-wide">Selling Price (NPR) *</label>
                    <input 
                      type="number" 
                      required 
                      value={vPrice}
                      onChange={(e) => setVPrice(e.target.value)}
                      placeholder="5200000" 
                      className="w-full bg-surface-50 border border-surface-200 rounded-xl px-4 py-3 text-sm focus-ring text-surface-900"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6 pt-6 border-t">
                  <Button type="button" variant="outline" onClick={() => setShowVehicleModal(false)}>Cancel</Button>
                  <Button variant="gradient" type="submit">Link Vehicle</Button>
                </div>
              </form>
            </Card>
          </div>
        );
      })()}

      {/* GRN Processing Modal */}
      {showGRNModal && (
        <div className="fixed inset-0 bg-surface-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md animate-scale-up border border-surface-200">
            <h3 className="font-display font-semibold text-lg text-surface-900 mb-4">Process GRN Arrival</h3>
            <p className="text-xs text-surface-500 mb-6">Assigning official identifiers for: <span className="font-semibold text-surface-800">{selectedVehicle?.model} ({selectedVehicle?.color})</span></p>
            <form onSubmit={handleGRNSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-surface-600 mb-1.5 uppercase tracking-wide">GRN Number</label>
                <input
                  type="text"
                  required
                  value={grnNo}
                  onChange={e => setGrnNo(e.target.value)}
                  className="w-full bg-surface-50 border border-surface-200 rounded-xl px-4 py-3 text-sm focus-ring text-surface-900 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-600 mb-1.5 uppercase tracking-wide">Engine Number / Motor Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MTR-493202"
                  value={engineNo}
                  onChange={e => setEngineNo(e.target.value)}
                  className="w-full bg-surface-50 border border-surface-200 rounded-xl px-4 py-3 text-sm focus-ring text-surface-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-600 mb-1.5 uppercase tracking-wide">Chassis Number / VIN</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MAT2938202HN49302"
                  value={chassisNo}
                  onChange={e => setChassisNo(e.target.value)}
                  className="w-full bg-surface-50 border border-surface-200 rounded-xl px-4 py-3 text-sm focus-ring text-surface-900 font-mono"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <Button variant="outline" type="button" onClick={() => setShowGRNModal(false)}>Cancel</Button>
                <Button variant="gradient" type="submit">Verify & Log Arrival</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Procurement;
