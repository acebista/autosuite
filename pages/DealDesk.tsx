import React, { useState } from 'react';
import { useSaleRecords, useCreateSaleRecord, useUpdateSaleRecord, useInventory, useCustomers, useCreateCustomer, useTransitionState, supabase } from '../api';
import { PageHeader, Card, Badge, Button, MetricCard, Skeleton } from '../UI';
import { Handshake, UserPlus, Car, CreditCard, ChevronRight, CheckCircle2, Search, Plus, Printer } from 'lucide-react';
import { STATE_METADATA } from '../lib/stateMachine';
import { AllotmentLetterModal } from '../components/AllotmentLetterModal';

const DealDesk: React.FC = () => {
  const { data: deals = [], isLoading: isDealsLoading, refetch: refetchDeals } = useSaleRecords();
  const { data: vehicles = [], isLoading: isVehiclesLoading, refetch: refetchVehicles } = useInventory();
  const { data: customers = [], isLoading: isCustomersLoading, refetch: refetchCustomers } = useCustomers();

  const createCustomerMutation = useCreateCustomer();
  const createSaleMutation = useCreateSaleRecord();
  const updateSaleMutation = useUpdateSaleRecord();
  const transitionMutation = useTransitionState();

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<any>(null);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAllotmentPrintModal, setShowAllotmentPrintModal] = useState(false);

  // New booking form
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custLocation, setCustLocation] = useState('Kathmandu');
  const [bookingAmount, setBookingAmount] = useState('50000');
  const [bookingPrice, setBookingPrice] = useState('3899000');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');

  // Payment structuring
  const [paymentType, setPaymentType] = useState<'FULL_PAYMENT' | 'FINANCED'>('FULL_PAYMENT');
  const [bankName, setBankName] = useState('');
  const [bankBranch, setBankBranch] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [rmName, setRmName] = useState('');
  const [rmPhone, setRmPhone] = useState('');

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 1. Create or retrieve customer by phone
      let customer = customers.find(c => c.phone === custPhone);
      if (!customer) {
        const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
        const branchId = selectedVehicle?.branchId || vehicles[0]?.branchId;
        customer = await createCustomerMutation.mutateAsync({
          name: custName,
          phone: custPhone,
          email: custEmail,
          location: custLocation,
          branchId: branchId || null,
          ltv: 0,
          carsOwned: [],
          referrals: 0
        });
      }

      // 2. Determine initial state based on whether a vehicle was selected
      const hasVehicle = !!selectedVehicleId;
      const initialState = hasVehicle ? 'ALLOCATED' : 'BOOKED';

      // 3. Create Sale Record
      const newSale = await createSaleMutation.mutateAsync({
        customerId: customer.id,
        vehicleId: hasVehicle ? selectedVehicleId : undefined,
        currentState: initialState,
        bookingAmount: Number(bookingAmount),
        salePrice: Number(bookingPrice)
      });

      // 4. If vehicle selected, mark it as reserved
      if (hasVehicle) {
        await supabase
          .from('vehicles')
          .update({ vehicle_state: 'ALLOCATED', status: 'Reserved' })
          .eq('id', selectedVehicleId);
      }

      // 5. Log the deal step
      await transitionMutation.mutateAsync({
        entityId: newSale.id,
        entityType: 'SALE',
        fromState: initialState,
        toState: initialState,
        notes: hasVehicle
          ? `Booking created with vehicle allocation. Token: NPR ${Number(bookingAmount).toLocaleString()}`
          : `Booking created — awaiting vehicle arrival. Token: NPR ${Number(bookingAmount).toLocaleString()}`
      });

      setShowBookingModal(false);
      setCustName('');
      setCustPhone('');
      setCustEmail('');
      setSelectedVehicleId('');
      refetchDeals();
      refetchVehicles();
    } catch (err: any) {
      alert('Error creating booking: ' + err.message);
    }
  };

  const handleAllocate = async (dealId: string, vehicleId: string) => {
    try {
      // 1. Link vehicle to SaleRecord
      await updateSaleMutation.mutateAsync({
        id: dealId,
        patch: {
          vehicleId,
          allocationDate: new Date().toISOString().split('T')[0]
        }
      });

      // 2. Update vehicle state in database
      const { error: vError } = await supabase
        .from('vehicles')
        .update({ vehicle_state: 'ALLOCATED', status: 'Reserved' })
        .eq('id', vehicleId);
      if (vError) throw vError;

      // 3. Transition SaleRecord state
      await transitionMutation.mutateAsync({
        entityId: dealId,
        entityType: 'SALE',
        fromState: 'BOOKED',
        toState: 'ALLOCATED',
        notes: `Vehicle allocated to customer. Registered Reservation.`
      });

      setShowAllocationModal(false);
      refetchDeals();
      refetchVehicles();
    } catch (err: any) {
      alert('Error allocating vehicle: ' + err.message);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 1. Update SaleRecord fields
      await updateSaleMutation.mutateAsync({
        id: selectedDeal.id,
        patch: {
          paymentType,
          bankName: paymentType === 'FINANCED' ? bankName : null,
          bankBranch: paymentType === 'FINANCED' ? bankBranch : null,
          approvedLoan: paymentType === 'FINANCED' ? Number(loanAmount) : null,
          rmName: paymentType === 'FINANCED' ? rmName : null,
          rmPhone: paymentType === 'FINANCED' ? rmPhone : null
        }
      });

      // 2. Transition SaleRecord state
      await transitionMutation.mutateAsync({
        entityId: selectedDeal.id,
        entityType: 'SALE',
        fromState: 'ALLOCATED',
        toState: 'PAYMENT_STRUCTURED',
        notes: `Structured payment as ${paymentType === 'FINANCED' ? 'Financed via ' + bankName : 'Full Cash Outright'}`
      });

      // 3. Also update vehicle state to match
      const { error: vError } = await supabase
        .from('vehicles')
        .update({ vehicle_state: 'PAYMENT_STRUCTURED' })
        .eq('id', selectedDeal.vehicleId);
      if (vError) throw vError;

      setShowPaymentModal(false);
      refetchDeals();
      refetchVehicles();
    } catch (err: any) {
      alert('Error saving payment structure: ' + err.message);
    }
  };

  const isLoading = isDealsLoading || isVehiclesLoading || isCustomersLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Sales & Deal Desk" subtitle="Book and Allocate Vehicle Deals" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Filter available stock for allocation
  const availableStock = vehicles.filter(v => v.vehicleState === 'IN_STOCK');

  return (
    <div className="space-y-8 pb-20">
      <PageHeader
        title="Sales & Deal Desk"
        subtitle="Standardized transaction workflow: Booking to Payments"
        actions={
          <Button onClick={() => setShowBookingModal(true)} icon={Plus}>Create Booking</Button>
        }
      />

      {/* KPI Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard label="Booked (No Vehicle)" value={deals.filter(d => d.currentState === 'BOOKED').length} icon={Handshake} />
        <MetricCard label="Vehicle Allocated" value={deals.filter(d => d.currentState === 'ALLOCATED').length} icon={Car} />
        <MetricCard label="Structured Deals" value={deals.filter(d => d.currentState === 'PAYMENT_STRUCTURED').length} icon={CreditCard} />
        <MetricCard label="Total Active" value={deals.filter(d => !['DELIVERED', 'CANCELLED'].includes(d.currentState)).length} icon={CheckCircle2} />
      </div>

      {/* Kanban / Cards view */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Booked Column — no vehicle linked yet */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-surface-900 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-pink-500"></span>
              Booked — Awaiting Vehicle
            </h3>
            <Badge variant="neutral" size="sm">{deals.filter(d => d.currentState === 'BOOKED').length}</Badge>
          </div>
          <div className="space-y-4">
            {deals.filter(d => d.currentState === 'BOOKED').map(d => (
              <Card key={d.id} className="border border-surface-200 hover-lift">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-surface-900 text-sm">{d.customer?.name}</h4>
                    <p className="text-xs text-surface-500">{d.customer?.phone}</p>
                  </div>
                  <Badge variant="teal">NPR {d.bookingAmount?.toLocaleString()}</Badge>
                </div>
                <p className="text-[11px] text-amber-600 bg-amber-50 rounded-lg px-2 py-1 mb-3">⏳ Vehicle not yet allocated — awaiting stock arrival</p>
                <div className="mt-2 pt-3 border-t border-surface-100 flex justify-end">
                  <Button
                    size="xs"
                    onClick={() => {
                      setSelectedDeal(d);
                      setShowAllocationModal(true);
                    }}
                    icon={ChevronRight}
                  >
                    Allocate Stock
                  </Button>
                </div>
              </Card>
            ))}
            {deals.filter(d => d.currentState === 'BOOKED').length === 0 && (
              <p className="text-xs text-surface-400 text-center py-8">No bookings awaiting vehicle allocation</p>
            )}
          </div>
        </div>

        {/* Allocated Column — vehicle linked, awaiting payment structure */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-surface-900 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-purple-500"></span>
              Allocated
            </h3>
            <Badge variant="neutral" size="sm">{deals.filter(d => d.currentState === 'ALLOCATED').length}</Badge>
          </div>
          <div className="space-y-4">
            {deals.filter(d => d.currentState === 'ALLOCATED').map(d => (
              <Card key={d.id} className="border border-surface-200 hover-lift">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-surface-900 text-sm">{d.customer?.name}</h4>
                    <p className="text-xs text-surface-500">VIN: {d.vehicle?.vin || '—'}</p>
                  </div>
                  <Badge variant="success">{d.vehicle?.model || 'Vehicle Set'}</Badge>
                </div>
                <p className="text-[11px] text-surface-500 mb-3">{d.vehicle?.color} • Reserved</p>
                <div className="mt-2 pt-3 border-t border-surface-100 flex justify-between items-center">
                  {(!d.paymentType || d.paymentType === 'FINANCED') ? (
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => {
                        setSelectedDeal(d);
                        setShowAllotmentPrintModal(true);
                      }}
                      icon={Printer}
                    >
                      Allotment Letter
                    </Button>
                  ) : <div></div>}
                  <Button
                    size="xs"
                    onClick={() => {
                      setSelectedDeal(d);
                      setShowPaymentModal(true);
                    }}
                    icon={ChevronRight}
                  >
                    Structure Payment
                  </Button>
                </div>
              </Card>
            ))}
            {deals.filter(d => d.currentState === 'ALLOCATED').length === 0 && (
              <p className="text-xs text-surface-400 text-center py-8">No allocated deals yet</p>
            )}
          </div>
        </div>

        {/* Structured Column */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-surface-900 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-500"></span>
              Structured
            </h3>
            <Badge variant="neutral" size="sm">{deals.filter(d => d.currentState === 'PAYMENT_STRUCTURED').length}</Badge>
          </div>
          <div className="space-y-4">
            {deals.filter(d => d.currentState === 'PAYMENT_STRUCTURED').map(d => (
              <Card key={d.id} className="border border-surface-200 hover-lift bg-surface-50/50">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-surface-900 text-sm">{d.customer?.name}</h4>
                    <p className="text-xs text-surface-500">{d.vehicle?.model} • {d.paymentType}</p>
                  </div>
                  <Badge variant="neutral">Ready for F&I</Badge>
                </div>
                <div className="mt-4 pt-3 border-t border-surface-100 flex items-center justify-between text-xs text-surface-600">
                  <span>Price: NPR {d.salePrice?.toLocaleString()}</span>
                  <div className="flex items-center gap-2">
                    {d.paymentType === 'FINANCED' && (
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => {
                          setSelectedDeal(d);
                          setShowAllotmentPrintModal(true);
                        }}
                        icon={Printer}
                      >
                        Allotment
                      </Button>
                    )}
                    <div className="flex items-center gap-1 text-accent-teal font-semibold">
                      <CheckCircle2 size={14} /> Structured
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            {deals.filter(d => d.currentState === 'PAYMENT_STRUCTURED').length === 0 && (
              <p className="text-xs text-surface-400 text-center py-8">No structured deals yet</p>
            )}
          </div>
        </div>
      </div>

      {/* New Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-surface-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg animate-scale-up border border-surface-200">
            <h3 className="font-display font-semibold text-lg text-surface-900 mb-1">Create New Booking</h3>
            <p className="text-xs text-surface-500 mb-6">Vehicle selection is optional — book now, allocate when stock arrives.</p>
            <form onSubmit={handleCreateBooking} className="space-y-4">
              {/* Customer Details */}
              <div className="pb-2">
                <p className="text-xs font-bold text-surface-500 uppercase tracking-widest mb-3">Customer Details</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-surface-600 mb-1.5 uppercase tracking-wide">Customer Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Om Bahadur Khadka"
                      value={custName}
                      onChange={e => setCustName(e.target.value)}
                      className="w-full bg-surface-50 border border-surface-200 rounded-xl px-4 py-3 text-sm focus-ring text-surface-900"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-surface-600 mb-1.5 uppercase tracking-wide">Phone Number</label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 9841000000"
                        value={custPhone}
                        onChange={e => setCustPhone(e.target.value)}
                        className="w-full bg-surface-50 border border-surface-200 rounded-xl px-4 py-3 text-sm focus-ring text-surface-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-surface-600 mb-1.5 uppercase tracking-wide">Email (Optional)</label>
                      <input
                        type="email"
                        value={custEmail}
                        onChange={e => setCustEmail(e.target.value)}
                        className="w-full bg-surface-50 border border-surface-200 rounded-xl px-4 py-3 text-sm focus-ring text-surface-900"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Vehicle Selection — Optional */}
              <div className="pb-2">
                <p className="text-xs font-bold text-surface-500 uppercase tracking-widest mb-1">Vehicle Allocation <span className="font-normal text-surface-400 normal-case">(optional)</span></p>
                <p className="text-[11px] text-surface-400 mb-3">Leave blank to take booking before vehicle arrives. You can allocate later from the Kanban.</p>
                <div>
                  <label className="block text-xs font-semibold text-surface-600 mb-1.5 uppercase tracking-wide">Select Vehicle Unit</label>
                  <select
                    value={selectedVehicleId}
                    onChange={e => setSelectedVehicleId(e.target.value)}
                    className="w-full bg-surface-50 border border-surface-200 rounded-xl px-4 py-3 text-sm focus-ring text-surface-900"
                  >
                    <option value="">— No vehicle yet (book without allocation) —</option>
                    {availableStock.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.model} {v.variant ? `(${v.variant})` : ''} • {v.color} • {v.vin}
                      </option>
                    ))}
                  </select>
                  {selectedVehicleId && (
                    <p className="text-[11px] text-emerald-600 mt-1.5">✓ Vehicle selected — deal will move directly to Allocated state</p>
                  )}
                  {!selectedVehicleId && (
                    <p className="text-[11px] text-amber-600 mt-1.5">⏳ No vehicle selected — deal will stay in Booked state until you allocate</p>
                  )}
                </div>
              </div>

              {/* Financial Details */}
              <div>
                <p className="text-xs font-bold text-surface-500 uppercase tracking-widest mb-3">Booking Financials</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-surface-600 mb-1.5 uppercase tracking-wide">Booking Token (NPR)</label>
                    <input
                      type="number"
                      required
                      value={bookingAmount}
                      onChange={e => setBookingAmount(e.target.value)}
                      className="w-full bg-surface-50 border border-surface-200 rounded-xl px-4 py-3 text-sm focus-ring text-surface-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-surface-600 mb-1.5 uppercase tracking-wide">Agreed Sale Price (NPR)</label>
                    <input
                      type="number"
                      required
                      value={bookingPrice}
                      onChange={e => setBookingPrice(e.target.value)}
                      className="w-full bg-surface-50 border border-surface-200 rounded-xl px-4 py-3 text-sm focus-ring text-surface-900"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button variant="outline" type="button" onClick={() => { setShowBookingModal(false); setSelectedVehicleId(''); }}>Cancel</Button>
                <Button variant="gradient" type="submit">Complete Booking</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Allocation Modal */}
      {showAllocationModal && (
        <div className="fixed inset-0 bg-surface-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg animate-scale-up border border-surface-200">
            <h3 className="font-display font-semibold text-lg text-surface-900 mb-4">Allocate Stock Vehicle</h3>
            <p className="text-xs text-surface-500 mb-6">Select from active In Stock inventory for: <span className="font-semibold text-surface-800">{selectedDeal?.customer?.name}</span></p>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {availableStock.map(v => (
                <div key={v.id} className="flex justify-between items-center p-4 bg-surface-50 rounded-xl border border-surface-200">
                  <div>
                    <span className="font-semibold text-surface-900 text-sm block">{v.model} ({v.color})</span>
                    <span className="text-[10px] text-surface-500 font-mono">Chassis: {v.vin}</span>
                  </div>
                  <Button
                    size="xs"
                    onClick={() => handleAllocate(selectedDeal.id, v.id)}
                    icon={CheckCircle2}
                  >
                    Select Unit
                  </Button>
                </div>
              ))}
              {availableStock.length === 0 && (
                <p className="text-center py-6 text-xs text-surface-500">No vehicles currently "In Stock". Verify arrival in Procurement first.</p>
              )}
            </div>
            <div className="pt-6 flex justify-end">
              <Button variant="outline" onClick={() => setShowAllocationModal(false)}>Close</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Payment Structuring Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-surface-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md animate-scale-up border border-surface-200">
            <h3 className="font-display font-semibold text-lg text-surface-900 mb-6">Payment Configuration</h3>
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-surface-600 mb-1.5 uppercase tracking-wide">Method</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-surface-800">
                    <input
                      type="radio"
                      checked={paymentType === 'FULL_PAYMENT'}
                      onChange={() => setPaymentType('FULL_PAYMENT')}
                    />
                    Full Outright Cash
                  </label>
                  <label className="flex items-center gap-2 text-sm text-surface-800">
                    <input
                      type="radio"
                      checked={paymentType === 'FINANCED'}
                      onChange={() => setPaymentType('FINANCED')}
                    />
                    Financed (Bank Loan)
                  </label>
                </div>
              </div>

              {paymentType === 'FINANCED' && (
                <div className="space-y-4 border-t border-surface-150 pt-4 animate-fade-in">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-surface-600 mb-1.5 uppercase tracking-wide">Bank Partner</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Nabil Bank"
                        value={bankName}
                        onChange={e => setBankName(e.target.value)}
                        className="w-full bg-surface-50 border border-surface-200 rounded-xl px-4 py-3 text-sm focus-ring text-surface-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-surface-600 mb-1.5 uppercase tracking-wide">Branch</label>
                      <input
                        type="text"
                        placeholder="e.g. Lalitpur"
                        value={bankBranch}
                        onChange={e => setBankBranch(e.target.value)}
                        className="w-full bg-surface-50 border border-surface-200 rounded-xl px-4 py-3 text-sm focus-ring text-surface-900"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-surface-600 mb-1.5 uppercase tracking-wide">Loan Officer Name</label>
                      <input
                        type="text"
                        placeholder="RM Name"
                        value={rmName}
                        onChange={e => setRmName(e.target.value)}
                        className="w-full bg-surface-50 border border-surface-200 rounded-xl px-4 py-3 text-sm focus-ring text-surface-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-surface-600 mb-1.5 uppercase tracking-wide">RM Phone</label>
                      <input
                        type="tel"
                        placeholder="RM Phone"
                        value={rmPhone}
                        onChange={e => setRmPhone(e.target.value)}
                        className="w-full bg-surface-50 border border-surface-200 rounded-xl px-4 py-3 text-sm focus-ring text-surface-900"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-surface-600 mb-1.5 uppercase tracking-wide">Approved Loan Amount</label>
                    <input
                      type="number"
                      required
                      placeholder="Approved limit"
                      value={loanAmount}
                      onChange={e => setLoanAmount(e.target.value)}
                      className="w-full bg-surface-50 border border-surface-200 rounded-xl px-4 py-3 text-sm focus-ring text-surface-900"
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3">
                <Button variant="outline" type="button" onClick={() => setShowPaymentModal(false)}>Cancel</Button>
                <Button variant="gradient" type="submit">Submit Structure</Button>
              </div>
            </form>
          </Card>
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

export default DealDesk;
