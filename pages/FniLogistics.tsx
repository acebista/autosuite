import React, { useState } from 'react';
import { useSaleRecords, useUpdateSaleRecord, useTransitionState, useInventory, supabase } from '../api';
import { PageHeader, Card, Badge, Button, MetricCard, Skeleton } from '../UI';
import { ShieldAlert, FileText, CheckCircle2, AlertTriangle, Send, User, ChevronRight, Printer } from 'lucide-react';
import { STATE_METADATA } from '../lib/stateMachine';
import { AllotmentLetterModal } from '../components/AllotmentLetterModal';

const FniLogistics: React.FC = () => {
  const { data: deals = [], isLoading: isDealsLoading, refetch: refetchDeals } = useSaleRecords();
  const { refetch: refetchVehicles } = useInventory();
  
  const updateSaleMutation = useUpdateSaleRecord();
  const transitionMutation = useTransitionState();

  const [selectedDeal, setSelectedDeal] = useState<any>(null);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [showAllotmentPrintModal, setShowAllotmentPrintModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'insurance' | 'dotm' | 'disbursement' | 'delivery'>('insurance');

  // Input states
  const [insuranceNo, setInsuranceNo] = useState('');
  const [regNo, setRegNo] = useState('');
  const [disbursementAmt, setDisbursementAmt] = useState('');

  const handleInsuranceActivate = async (deal: any) => {
    if (!insuranceNo) {
      alert('Please fill the Policy Number.');
      return;
    }
    try {
      await updateSaleMutation.mutateAsync({
        id: deal.id,
        patch: {
          insurancePolicyNo: insuranceNo,
          insuranceActivatedAt: new Date().toISOString(),
          currentState: 'INSURANCE_ACTIVATION'
        }
      });

      await transitionMutation.mutateAsync({
        entityId: deal.id,
        entityType: 'SALE',
        fromState: deal.currentState,
        toState: 'INSURANCE_ACTIVATION',
        notes: `Insurance activated under policy number ${insuranceNo}`
      });

      const { error: vError } = await supabase
        .from('vehicles')
        .update({ vehicle_state: 'INSURANCE_ACTIVATION' } as any)
        .eq('id', deal.vehicleId);
      if (vError) throw vError;

      setInsuranceNo('');
      refetchDeals();
    } catch (err: any) {
      alert('Error updating insurance: ' + err.message);
    }
  };

  const handleGenerateAllotment = async (deal: any) => {
    try {
      await transitionMutation.mutateAsync({
        entityId: deal.id,
        entityType: 'SALE',
        fromState: 'INSURANCE_ACTIVATION',
        toState: 'BANK_ALLOTMENT',
        notes: 'Allotment letter generated and sent to bank.'
      });

      const { error: vError } = await supabase
        .from('vehicles')
        .update({ vehicle_state: 'BANK_ALLOTMENT' } as any)
        .eq('id', deal.vehicleId);
      if (vError) throw vError;

      refetchDeals();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleRegisterDoTM = async (deal: any) => {
    if (!regNo) {
      alert('Please provide the registration number.');
      return;
    }
    try {
      await updateSaleMutation.mutateAsync({
        id: deal.id,
        patch: {
          registrationNo: regNo,
          registeredAt: new Date().toISOString(),
          registeredUnder: deal.paymentType === 'FINANCED' ? deal.bankName : 'CUSTOMER',
          currentState: 'DOTM_REGISTRATION'
        }
      });

      await transitionMutation.mutateAsync({
        entityId: deal.id,
        entityType: 'SALE',
        fromState: deal.currentState,
        toState: 'DOTM_REGISTRATION',
        notes: `DoTM registration completed by Ram Lakhan Sah. Reg No: ${regNo}`
      });

      const { error: vError } = await supabase
        .from('vehicles')
        .update({ vehicle_state: 'DOTM_REGISTRATION', registration_no: regNo } as any)
        .eq('id', deal.vehicleId);
      if (vError) throw vError;

      setRegNo('');
      refetchDeals();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleEndorseInsurance = async (deal: any) => {
    try {
      await updateSaleMutation.mutateAsync({
        id: deal.id,
        patch: {
          insuranceEndorsedAt: new Date().toISOString(),
          currentState: 'INSURANCE_ENDORSEMENT'
        }
      });

      await transitionMutation.mutateAsync({
        entityId: deal.id,
        entityType: 'SALE',
        fromState: 'DOTM_REGISTRATION',
        toState: 'INSURANCE_ENDORSEMENT',
        notes: `Insurance policy endorsed to ${deal.paymentType === 'FINANCED' ? deal.bankName + ' & Customer' : 'Customer'}`
      });

      const { error: vError } = await supabase
        .from('vehicles')
        .update({ vehicle_state: 'INSURANCE_ENDORSEMENT' } as any)
        .eq('id', deal.vehicleId);
      if (vError) throw vError;

      refetchDeals();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleDisbursementSubmit = async (deal: any) => {
    if (!disbursementAmt) {
      alert('Please input the disbursement amount.');
      return;
    }
    try {
      await updateSaleMutation.mutateAsync({
        id: deal.id,
        patch: {
          disbursementRequestedAt: new Date().toISOString(),
          disbursementReceivedAt: new Date().toISOString(),
          disbursementAmount: Number(disbursementAmt),
          currentState: 'BANK_DISBURSEMENT'
        }
      });

      await transitionMutation.mutateAsync({
        entityId: deal.id,
        entityType: 'SALE',
        fromState: 'INSURANCE_ENDORSEMENT',
        toState: 'BANK_DISBURSEMENT',
        notes: `Disbursement released by bank: ₹${Number(disbursementAmt).toLocaleString()}`
      });

      const { error: vError } = await supabase
        .from('vehicles')
        .update({ vehicle_state: 'BANK_DISBURSEMENT' } as any)
        .eq('id', deal.vehicleId);
      if (vError) throw vError;

      setDisbursementAmt('');
      refetchDeals();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleReadyForDelivery = async (deal: any) => {
    try {
      await updateSaleMutation.mutateAsync({
        id: deal.id,
        patch: {
          readyForDeliveryAt: new Date().toISOString(),
          currentState: 'READY_FOR_DELIVERY'
        }
      });

      await transitionMutation.mutateAsync({
        entityId: deal.id,
        entityType: 'SALE',
        fromState: deal.currentState,
        toState: 'READY_FOR_DELIVERY',
        notes: 'PDI checklist verified. Vehicle prepped and ready for handoff.'
      });

      const { error: vError } = await supabase
        .from('vehicles')
        .update({ vehicle_state: 'READY_FOR_DELIVERY' } as any)
        .eq('id', deal.vehicleId);
      if (vError) throw vError;

      refetchDeals();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleCompleteDelivery = async (deal: any) => {
    try {
      await updateSaleMutation.mutateAsync({
        id: deal.id,
        patch: {
          deliveredAt: new Date().toISOString(),
          currentState: 'DELIVERED'
        }
      });

      await transitionMutation.mutateAsync({
        entityId: deal.id,
        entityType: 'SALE',
        fromState: 'READY_FOR_DELIVERY',
        toState: 'DELIVERED',
        notes: 'Vehicle officially handed over to customer. Signed paperwork archived.'
      });

      // Update vehicle status in primary fleet view to Sold
      const { error: vError } = await supabase
        .from('vehicles')
        .update({ vehicle_state: 'DELIVERED', status: 'Sold' } as any)
        .eq('id', deal.vehicleId);
      if (vError) throw vError;

      refetchDeals();
      refetchVehicles();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const triggerEmailDraft = (subject: string, body: string) => {
    window.open(`mailto:compliance@maw.com.np?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const activeDeals = deals.filter(d => ['PAYMENT_STRUCTURED', 'READY_FOR_DELIVERY', 'DELIVERED', 'INSURANCE_ACTIVATION', 'BANK_ALLOTMENT', 'DOTM_REGISTRATION', 'INSURANCE_ENDORSEMENT', 'BANK_DISBURSEMENT'].includes(d.currentState));

  if (isDealsLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="F&I & Logistics" subtitle="Manage Insurance, Registrations, and Handover" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <PageHeader
        title="F&I & Logistics"
        subtitle="End-to-end compliance tracking for delivery and post-delivery operations"
      />

      {/* KPI Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard label="Ready for Delivery" value={activeDeals.filter(d => d.currentState === 'READY_FOR_DELIVERY' || d.currentState === 'PAYMENT_STRUCTURED').length} icon={User} />
        <MetricCard label="Post-Delivery Insurance" value={activeDeals.filter(d => d.currentState === 'DELIVERED').length} icon={ShieldAlert} />
        <MetricCard label="DoTM Registry Queue" value={activeDeals.filter(d => d.currentState === 'INSURANCE_ACTIVATION' || d.currentState === 'BANK_ALLOTMENT').length} icon={FileText} />
        <MetricCard label="Bank Disbursement" value={activeDeals.filter(d => d.currentState === 'INSURANCE_ENDORSEMENT' || d.currentState === 'DOTM_REGISTRATION').length} icon={CheckCircle2} />
      </div>

      {/* Section Switcher */}
      <div className="flex border-b border-surface-200 gap-6">
        <button
          onClick={() => setActiveTab('insurance')}
          className={`py-3 px-1 text-sm font-semibold border-b-2 transition-all ${activeTab === 'insurance' ? 'border-accent-teal text-accent-teal' : 'border-transparent text-surface-500 hover:text-surface-900'}`}
        >
          Insurance Desk
        </button>
        <button
          onClick={() => setActiveTab('dotm')}
          className={`py-3 px-1 text-sm font-semibold border-b-2 transition-all ${activeTab === 'dotm' ? 'border-accent-teal text-accent-teal' : 'border-transparent text-surface-500 hover:text-surface-900'}`}
        >
          DoTM Registration (Ram Lakhan Sah)
        </button>
        <button
          onClick={() => setActiveTab('disbursement')}
          className={`py-3 px-1 text-sm font-semibold border-b-2 transition-all ${activeTab === 'disbursement' ? 'border-accent-teal text-accent-teal' : 'border-transparent text-surface-500 hover:text-surface-900'}`}
        >
          Bank Disbursement
        </button>
        <button
          onClick={() => setActiveTab('delivery')}
          className={`py-3 px-1 text-sm font-semibold border-b-2 transition-all ${activeTab === 'delivery' ? 'border-accent-teal text-accent-teal' : 'border-transparent text-surface-500 hover:text-surface-900'}`}
        >
          Delivery Handoff
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'insurance' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deals.filter(d => d.currentState === 'PAYMENT_STRUCTURED').map(d => (
            <Card key={d.id} className="border border-surface-200 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-surface-900">{d.customer?.name}</h4>
                    <p className="text-xs text-surface-500">{d.vehicle?.model} • {d.paymentType}</p>
                  </div>
                  <Badge variant="teal">Awaiting Policy</Badge>
                </div>
                <div className="mt-4">
                  <label className="block text-[10px] font-semibold text-surface-500 uppercase tracking-wide mb-1">Policy Number</label>
                  <input
                    type="text"
                    placeholder="e.g. NIC-GI-98320"
                    onChange={e => setInsuranceNo(e.target.value)}
                    className="w-full bg-surface-50 border border-surface-200 rounded-xl px-3 py-2 text-xs text-surface-900 focus-ring"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button
                  size="xs"
                  onClick={() => handleInsuranceActivate(d)}
                >
                  Activate & Log Insurance
                </Button>
              </div>
            </Card>
          ))}
          {deals.filter(d => d.currentState === 'PAYMENT_STRUCTURED').length === 0 && (
            <div className="col-span-3 text-center py-20 text-surface-500">No deals awaiting insurance configuration.</div>
          )}
        </div>
      )}

      {activeTab === 'dotm' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deals.filter(d => ['INSURANCE_ACTIVATION', 'BANK_ALLOTMENT'].includes(d.currentState)).map(d => (
            <Card key={d.id} className="border border-surface-200 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-surface-900">{d.customer?.name}</h4>
                    <p className="text-xs text-surface-500">Chassis: {d.vehicle?.vin}</p>
                  </div>
                  <Badge variant="warning">DoTM Queue</Badge>
                </div>
                <div className="text-xs text-surface-600 bg-surface-50 p-3 rounded-xl border border-surface-150 my-4 space-y-1">
                  <div><span className="font-semibold">Assigned Rep:</span> Ram Lakhan Sah</div>
                  <div><span className="font-semibold">Register Under:</span> {d.paymentType === 'FINANCED' ? `${d.bankName} (Hynothecation)` : 'Customer Private'}</div>
                </div>
                {d.currentState === 'INSURANCE_ACTIVATION' && d.paymentType === 'FINANCED' ? (
                  <p className="text-xs text-red-500 flex items-center gap-1.5"><AlertTriangle size={14} /> Generate Allotment letter to authorize bank hypothecation.</p>
                ) : (
                  <div>
                    <label className="block text-[10px] font-semibold text-surface-500 uppercase tracking-wide mb-1">Registration No</label>
                    <input
                      type="text"
                      placeholder="e.g. BA 3 CHA 9832"
                      onChange={e => setRegNo(e.target.value)}
                      className="w-full bg-surface-50 border border-surface-200 rounded-xl px-3 py-2 text-xs text-surface-900 focus-ring"
                    />
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-between items-center">
                {d.currentState === 'BANK_ALLOTMENT' && (
                  <Button 
                    size="xs" 
                    variant="outline" 
                    icon={Printer}
                    onClick={() => {
                      setSelectedDeal(d);
                      setShowAllotmentPrintModal(true);
                    }}
                  >
                    Print Allotment
                  </Button>
                )}
                {d.currentState === 'INSURANCE_ACTIVATION' && d.paymentType === 'FINANCED' ? (
                  <Button size="xs" className="ml-auto" onClick={() => handleGenerateAllotment(d)}>Generate Allotment</Button>
                ) : (
                  <Button size="xs" className={d.currentState !== 'BANK_ALLOTMENT' ? "ml-auto" : ""} variant="gradient" onClick={() => handleRegisterDoTM(d)}>Save Registration</Button>
                )}
              </div>
            </Card>
          ))}
          {deals.filter(d => ['INSURANCE_ACTIVATION', 'BANK_ALLOTMENT'].includes(d.currentState)).length === 0 && (
            <div className="col-span-3 text-center py-20 text-surface-500">DoTM registry is empty.</div>
          )}
        </div>
      )}

      {activeTab === 'disbursement' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deals.filter(d => ['DOTM_REGISTRATION', 'INSURANCE_ENDORSEMENT'].includes(d.currentState)).map(d => (
            <Card key={d.id} className="border border-surface-200 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-surface-900">{d.customer?.name}</h4>
                    <p className="text-xs text-surface-500">Bank: {d.bankName || 'Direct Outright'}</p>
                  </div>
                  <Badge variant="indigo">{d.currentState}</Badge>
                </div>
                
                {d.currentState === 'DOTM_REGISTRATION' ? (
                  <p className="text-xs text-amber-600 flex items-center gap-1.5 my-4">
                    <AlertTriangle size={14} /> Endorse insurance policy to Bank & Customer first.
                  </p>
                ) : d.paymentType === 'FULL_PAYMENT' ? (
                  <p className="text-xs text-emerald-600 flex items-center gap-1.5 my-4">
                    <CheckCircle2 size={14} /> Cash deals skip bank disbursement step.
                  </p>
                ) : (
                  <div className="my-4">
                    <label className="block text-[10px] font-semibold text-surface-500 uppercase tracking-wide mb-1">Disbursement Received Amount</label>
                    <input
                      type="number"
                      placeholder={`Max approved: ₹${d.approvedLoan?.toLocaleString()}`}
                      onChange={e => setDisbursementAmt(e.target.value)}
                      className="w-full bg-surface-50 border border-surface-200 rounded-xl px-3 py-2 text-xs text-surface-900 focus-ring"
                    />
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end gap-2">
                {d.currentState === 'DOTM_REGISTRATION' ? (
                  <Button size="xs" onClick={() => handleEndorseInsurance(d)}>Endorse Insurance</Button>
                ) : d.paymentType === 'FULL_PAYMENT' ? (
                  <Button size="xs" variant="gradient" onClick={() => handleReadyForDelivery(d)}>Mark Ready for Delivery</Button>
                ) : (
                  <Button size="xs" variant="gradient" onClick={() => handleDisbursementSubmit(d)}>Process Payment</Button>
                )}
              </div>
            </Card>
          ))}
          {deals.filter(d => ['DOTM_REGISTRATION', 'INSURANCE_ENDORSEMENT'].includes(d.currentState)).length === 0 && (
            <div className="col-span-3 text-center py-20 text-surface-500">No deals pending disbursement.</div>
          )}
        </div>
      )}

      {activeTab === 'delivery' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deals.filter(d => ['BANK_DISBURSEMENT', 'READY_FOR_DELIVERY'].includes(d.currentState)).map(d => (
            <Card key={d.id} className="border border-surface-200 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-surface-900">{d.customer?.name}</h4>
                    <p className="text-xs text-surface-500">{d.vehicle?.model} • Reg: {d.registrationNo || 'Pending'}</p>
                  </div>
                  <Badge variant="success">{d.currentState}</Badge>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                {d.currentState === 'BANK_DISBURSEMENT' ? (
                  <Button size="xs" onClick={() => handleReadyForDelivery(d)}>Ready for Delivery</Button>
                ) : (
                  <Button size="xs" variant="gradient" onClick={() => handleCompleteDelivery(d)}>Handover keys (Deliver)</Button>
                )}
              </div>
            </Card>
          ))}
          {deals.filter(d => ['BANK_DISBURSEMENT', 'READY_FOR_DELIVERY'].includes(d.currentState)).length === 0 && (
            <div className="col-span-3 text-center py-20 text-surface-500">No vehicles prepped for handover.</div>
          )}
        </div>
      )}

      <AllotmentLetterModal
        isOpen={showAllotmentPrintModal}
        onClose={() => setShowAllotmentPrintModal(false)}
        deal={selectedDeal}
      />
    </div>
  );
};

export default FniLogistics;
