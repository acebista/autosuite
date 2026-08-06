import React from 'react';
import {
  Landmark, Truck, ClipboardList, CheckCircle2,
  User, CreditCard, ShieldCheck, FileText, Stamp,
  BanknoteIcon, Sparkles, ArrowRight, Upload, Loader2
} from 'lucide-react';
import { Button } from '../../../../UI';
import { EvidenceUploadZone, isStateEvidenceComplete, getMissingEvidenceLabels, isAllJourneyEvidenceComplete } from './EvidenceUploadZone';

type ActionForms = {
  transitDate: string; setTransitDate: (v: string) => void;
  grnNo: string; setGrnNo: (v: string) => void;
  engineNo: string; setEngineNo: (v: string) => void;
  chassisNo: string; setChassisNo: (v: string) => void;
  allocVehicleId: string; setAllocVehicleId: (v: string) => void;
  allocSaleId: string; setAllocSaleId: (v: string) => void;
  paymentType: string; setPaymentType: (v: any) => void;
  bookingAmount: string; setBookingAmount: (v: string) => void;
  salePrice: string; setSalePrice: (v: string) => void;
  bankName: string; setBankName: (v: string) => void;
  bankBranch: string; setBankBranch: (v: string) => void;
  rmName: string; setRmName: (v: string) => void;
  rmPhone: string; setRmPhone: (v: string) => void;
  approvedLoan: string; setApprovedLoan: (v: string) => void;
  deliveryOrderFile: File | null; setDeliveryOrderFile: (f: File | null) => void;
  deliveryOrderUrl: string;
  insuranceNo: string; setInsuranceNo: (v: string) => void;
  willUpdateInsuranceLater: boolean; setWillUpdateInsuranceLater: (v: boolean) => void;
  registrationNo: string; setRegistrationNo: (v: string) => void;
  disbursementAmt: string; setDisbursementAmt: (v: string) => void;
  actionNotes: string; setActionNotes: (v: string) => void;
  handleLinkLC: () => void;
  handleMarkShipped: () => void;
  handleGRNSubmit: (e?: React.FormEvent) => void;
  handleApproveStock: () => void;
  handleAllocateToBooking: () => void;
  handleAllocateVehicleToBooking: () => void;
  handleStructurePaymentSubmit: (e?: React.FormEvent) => void;
  handleReadyForDelivery: () => void;
  handleCompleteDelivery: () => void;
  handleInsuranceActivate: () => void;
  handleGenerateAllotment: () => void;
  handleRegisterDoTM: () => void;
  handleEndorseInsurance: () => void;
  handleDisbursementSubmit: () => void;
  isActionLoading: boolean;
};

interface ActionFormFactoryProps {
  selectedItem: any;
  deals: any[];
  vehicles: any[];
  forms: ActionForms;
}

const FieldGroup: React.FC<{ children: React.ReactNode; columns?: 1 | 2 }> = ({ children, columns = 2 }) => (
  <div className={`grid gap-3 ${columns === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>{children}</div>
);

const Field: React.FC<{
  label: string; required?: boolean;
  children: React.ReactNode;
  hint?: string;
  readOnly?: boolean;
  colSpan?: boolean;
}> = ({ label, required, children, hint, readOnly, colSpan }) => (
  <div className={colSpan ? 'col-span-2' : ''}>
    <label className="block text-xs font-bold text-surface-700 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
      {readOnly && <span className="ml-1 text-[9px] font-normal text-surface-400 border border-surface-200 px-1.5 py-0.5 rounded-full">Pre-filled</span>}
    </label>
    {children}
    {hint && <p className="mt-1 text-[10px] text-surface-400 leading-tight">{hint}</p>}
  </div>
);

const TextInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input
    {...props}
    className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-deepal-300 transition ${
      props.readOnly
        ? 'bg-surface-50 border-surface-200 text-surface-500 cursor-default'
        : 'bg-white border-surface-200 text-surface-800 hover:border-deepal-300'
    } ${props.className || ''}`}
  />
);

/**
 * CTA button with two modes:
 *  - `warnOnly=true` (default for intermediate steps): button stays active, shows amber warning banner
 *  - `warnOnly=false` (hard gate for final step): button disabled until missingLabels is empty
 */
const CTA: React.FC<{
  label: string;
  icon?: React.ElementType;
  onClick?: () => void;
  isLoading?: boolean;
  missingLabels?: string[];
  warnOnly?: boolean;
  variant?: 'primary' | 'secondary' | 'success';
}> = ({ label, icon: Icon, onClick, isLoading, missingLabels = [], warnOnly = true, variant = 'primary' }) => {
  const hasMissing = missingLabels.length > 0;
  const isHardBlocked = !warnOnly && hasMissing;

  const styles = {
    primary: 'bg-deepal-500 hover:bg-deepal-600 text-white',
    secondary: 'bg-purple-500 hover:bg-purple-600 text-white',
    success: 'bg-emerald-500 hover:bg-emerald-600 text-white',
  };

  return (
    <div className="space-y-2">
      {/* Amber warning banner — shown only when missing docs, for warn-only mode */}
      {hasMissing && warnOnly && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
          <p className="text-xs font-bold text-amber-700 mb-1">⚠️ Missing proof documents for this step:</p>
          <ul className="space-y-0.5">
            {missingLabels.map(label => (
              <li key={label} className="text-xs text-amber-600 flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-amber-400 flex-shrink-0" />
                {label}
              </li>
            ))}
          </ul>
          <p className="text-[10px] text-amber-500 mt-1.5 font-medium">You can still proceed — upload them anytime before closing the journey.</p>
        </div>
      )}

      {/* Hard block banner — only on final disbursement step */}
      {isHardBlocked && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
          <p className="text-xs font-bold text-red-700 mb-1">🔒 Cannot close journey — missing required documents:</p>
          <ul className="space-y-0.5">
            {missingLabels.map(label => (
              <li key={label} className="text-xs text-red-600 flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />
                {label}
              </li>
            ))}
          </ul>
          <p className="text-[10px] text-red-500 mt-1.5 font-medium">Upload all required proof documents to complete the vehicle journey.</p>
        </div>
      )}

      <button
        onClick={onClick}
        disabled={isLoading || isHardBlocked}
        className={`w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm shadow-md transition-all duration-200 active:scale-[0.98] ${
          isHardBlocked
            ? 'bg-surface-200 text-surface-400 cursor-not-allowed shadow-none border border-surface-300'
            : styles[variant]
        }`}
      >
        {isLoading ? <Loader2 size={16} className="animate-spin" /> : Icon ? <Icon size={16} /> : null}
        {label}
        {!isLoading && !isHardBlocked && <ArrowRight size={14} className="ml-auto opacity-60" />}
      </button>
    </div>
  );
};

export const ActionFormFactory: React.FC<ActionFormFactoryProps> = ({ selectedItem, deals, vehicles, forms }) => {
  const state = selectedItem.state;
  const { isActionLoading } = forms;
  // Per-step missing labels (for amber warnings on intermediate steps)
  const stepMissingLabels = getMissingEvidenceLabels(state, selectedItem.id);
  // Journey-wide missing (for hard gate at BANK_DISBURSEMENT final step)
  const journeyCheck = isAllJourneyEvidenceComplete(state, selectedItem.id);
  const journeyMissingLabels = journeyCheck.missing.flatMap(m => m.labels.map(l => `[${m.stage.replace(/_/g, ' ')}] ${l}`));

  const notesField = (
    <Field label="Transition Notes" colSpan>
      <textarea
        rows={2}
        value={forms.actionNotes}
        onChange={e => forms.setActionNotes(e.target.value)}
        placeholder="Optional notes to record with this state change…"
        className="w-full border border-surface-200 rounded-xl px-3 py-2.5 text-sm text-surface-700 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-deepal-300 resize-none hover:border-deepal-300 transition"
      />
    </Field>
  );

  // ─── PO_ISSUED: Confirm LC ──────────────────────────────────────────────
  if (state === 'PO_ISSUED') {
    return (
      <div className="space-y-4">
        <div className="bg-deepal-50 border border-deepal-100 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Landmark size={16} className="text-deepal-600" />
            <p className="text-sm font-bold text-deepal-800">Confirm LC is Active</p>
          </div>
          <p className="text-xs text-deepal-600">Verify that the Letter of Credit has been opened and confirmed by the bank before proceeding.</p>
          {selectedItem.lcNo && (
            <p className="text-xs font-mono bg-white border border-deepal-200 rounded-lg px-2.5 py-1.5 text-deepal-700">
              LC: {selectedItem.lcNo}
            </p>
          )}
        </div>
        <FieldGroup columns={1}>
          {notesField}
        </FieldGroup>
        <EvidenceUploadZone state={state} dealId={selectedItem.id} />
        <CTA
          label="Confirm LC Opened"
          icon={Landmark}
          onClick={forms.handleLinkLC}
          isLoading={isActionLoading}
          missingLabels={stepMissingLabels}
        />
      </div>
    );
  }

  // ─── LC_OPENED: Mark Shipped ────────────────────────────────────────────
  if (state === 'LC_OPENED') {
    return (
      <div className="space-y-4">
        <FieldGroup>
          <Field label="Expected Delivery Date" required colSpan>
            <TextInput
              type="date"
              value={forms.transitDate}
              onChange={e => forms.setTransitDate(e.target.value)}
            />
          </Field>
          {notesField}
        </FieldGroup>
        <EvidenceUploadZone state={state} dealId={selectedItem.id} />
        <CTA
          label="Mark as Shipped / In Transit"
          icon={Truck}
          onClick={forms.handleMarkShipped}
          isLoading={isActionLoading}
          missingLabels={stepMissingLabels}
        />
      </div>
    );
  }

  // ─── IN_TRANSIT: Log GRN ───────────────────────────────────────────────
  if (state === 'IN_TRANSIT') {
    return (
      <form onSubmit={forms.handleGRNSubmit} className="space-y-4">
        <FieldGroup>
          <Field label="GRN Number" required colSpan>
            <TextInput
              value={forms.grnNo}
              onChange={e => forms.setGrnNo(e.target.value)}
              placeholder="e.g. GRN-2025-001"
            />
          </Field>
          <Field label="Engine / Motor No." required>
            <TextInput
              value={forms.engineNo}
              onChange={e => forms.setEngineNo(e.target.value)}
              placeholder="Engine No."
            />
          </Field>
          <Field label="Chassis / VIN No." required>
            <TextInput
              value={forms.chassisNo}
              onChange={e => forms.setChassisNo(e.target.value)}
              placeholder="Chassis No."
              readOnly={!!(selectedItem.vin && !selectedItem.vin.startsWith('CAT-'))}
            />
          </Field>
          {notesField}
        </FieldGroup>
        <EvidenceUploadZone state={state} dealId={selectedItem.id} />
        <CTA
          label="Submit GRN & Mark Received"
          icon={ClipboardList}
          isLoading={isActionLoading}
          missingLabels={stepMissingLabels}
        />
      </form>
    );
  }

  // ─── RECEIVED: Approve to Stock ────────────────────────────────────────
  if (state === 'RECEIVED') {
    return (
      <div className="space-y-4">
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <p className="text-sm font-bold text-emerald-800">Physical Inspection Checklist</p>
          </div>
          <ul className="text-xs text-emerald-700 space-y-1 mt-2">
            {['Body & paintwork clear of transit damage', 'All accessories & keys present', 'Odometer reading documented', 'Service book present', 'Battery state-of-charge (EV) verified'].map(item => (
              <li key={item} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full border-2 border-emerald-400 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <FieldGroup columns={1}>{notesField}</FieldGroup>
        <EvidenceUploadZone state={state} dealId={selectedItem.id} />
        <CTA
          label="Approve — Move to In Stock"
          icon={CheckCircle2}
          variant="success"
          onClick={forms.handleApproveStock}
          isLoading={isActionLoading}
          missingLabels={stepMissingLabels}
        />
      </div>
    );
  }

  // ─── IN_STOCK: Allocate to Booking ─────────────────────────────────────
  if (state === 'IN_STOCK') {
    const unallocatedDeals = deals.filter(d => d.currentState === 'BOOKED' && !d.vehicleId);
    return (
      <div className="space-y-4">
        <Field label="Select Booking to Allocate" required colSpan>
          <select
            value={forms.allocSaleId}
            onChange={e => forms.setAllocSaleId(e.target.value)}
            className="w-full border border-surface-200 rounded-xl px-3 py-2.5 text-sm bg-white text-surface-700 focus:outline-none focus:ring-2 focus:ring-deepal-300"
          >
            <option value="">— Choose a booking —</option>
            {unallocatedDeals.map((d: any) => (
              <option key={d.id} value={d.id}>
                {d.customer?.name} — {d.bookingDate} — NPR {Number(d.bookingAmount || 0).toLocaleString()}
              </option>
            ))}
          </select>
          {unallocatedDeals.length === 0 && (
            <p className="text-xs text-amber-600 mt-1.5 font-semibold">⚠ No unallocated bookings found. Create a booking first via the Operations Hub.</p>
          )}
        </Field>
        <FieldGroup columns={1}>{notesField}</FieldGroup>
        <EvidenceUploadZone state={state} dealId={selectedItem.id} />
        <CTA label="Allocate Vehicle to Booking" icon={User} onClick={forms.handleAllocateToBooking} isLoading={isActionLoading} />
      </div>
    );
  }

  // ─── BOOKED: Link Vehicle ──────────────────────────────────────────────
  if (state === 'BOOKED') {
    const availableVehicles = vehicles.filter(v => v.vehicleState === 'IN_STOCK' || v.status === 'In Stock');
    return (
      <div className="space-y-4">
        <Field label="Select Vehicle to Assign" required colSpan>
          <select
            value={forms.allocVehicleId}
            onChange={e => forms.setAllocVehicleId(e.target.value)}
            className="w-full border border-surface-200 rounded-xl px-3 py-2.5 text-sm bg-white text-surface-700 focus:outline-none focus:ring-2 focus:ring-deepal-300"
          >
            <option value="">— Choose a vehicle —</option>
            {availableVehicles.map((v: any) => (
              <option key={v.id} value={v.id}>
                {v.model} {v.variant} — {v.color} — VIN: {v.vin || 'N/A'}
              </option>
            ))}
          </select>
        </Field>
        <FieldGroup columns={1}>{notesField}</FieldGroup>
        <EvidenceUploadZone state={state} dealId={selectedItem.id} />
        <CTA
          label="Assign Vehicle & Allocate"
          icon={User}
          onClick={forms.handleAllocateVehicleToBooking}
          isLoading={isActionLoading}
          missingLabels={stepMissingLabels}
        />
      </div>
    );
  }

  // ─── ALLOCATED: Structure Payment ──────────────────────────────────────
  if (state === 'ALLOCATED') {
    return (
      <form onSubmit={forms.handleStructurePaymentSubmit} className="space-y-4">
        {/* Payment type toggle */}
        <div>
          <label className="block text-xs font-bold text-surface-700 mb-2">Payment Type <span className="text-red-500">*</span></label>
          <div className="flex rounded-xl border border-surface-200 overflow-hidden">
            {(['FULL_PAYMENT', 'FINANCED'] as const).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => forms.setPaymentType(type)}
                className={`flex-1 py-2.5 text-sm font-bold transition-all duration-200 ${
                  forms.paymentType === type
                    ? 'bg-deepal-500 text-white'
                    : 'bg-white text-surface-500 hover:bg-surface-50'
                }`}
              >
                {type === 'FULL_PAYMENT' ? '💵 Full Cash' : '🏦 Bank Finance'}
              </button>
            ))}
          </div>
        </div>

        <FieldGroup>
          <Field label="Final Sale Price" required>
            <TextInput type="number" value={forms.salePrice} onChange={e => forms.setSalePrice(e.target.value)} placeholder="NPR" />
          </Field>
          <Field label="Booking Deposit">
            <TextInput type="number" value={forms.bookingAmount} onChange={e => forms.setBookingAmount(e.target.value)} placeholder="NPR" />
          </Field>
        </FieldGroup>

        {forms.paymentType === 'FINANCED' && (
          <div className="space-y-3 border border-deepal-100 bg-deepal-50 rounded-xl p-3">
            <p className="text-xs font-bold text-deepal-700 flex items-center gap-1.5">
              <Landmark size={12} /> Bank Finance Details
            </p>
            <FieldGroup>
              <Field label="Bank Name" required>
                <TextInput value={forms.bankName} onChange={e => forms.setBankName(e.target.value)} placeholder="e.g. NMB Bank" />
              </Field>
              <Field label="Branch">
                <TextInput value={forms.bankBranch} onChange={e => forms.setBankBranch(e.target.value)} placeholder="Branch" />
              </Field>
              <Field label="RM Name">
                <TextInput value={forms.rmName} onChange={e => forms.setRmName(e.target.value)} placeholder="Relationship Manager" />
              </Field>
              <Field label="RM Phone">
                <TextInput value={forms.rmPhone} onChange={e => forms.setRmPhone(e.target.value)} placeholder="98XXXXXXXX" />
              </Field>
              <Field label="Approved Loan Amount" colSpan>
                <TextInput type="number" value={forms.approvedLoan} onChange={e => forms.setApprovedLoan(e.target.value)} placeholder="NPR" />
              </Field>
            </FieldGroup>

            <Field label="Bank Delivery Order (DO)" hint="Upload the Bank DO document">
              <label className="flex items-center gap-2 cursor-pointer border border-dashed border-deepal-300 rounded-xl px-4 py-3 bg-white hover:bg-deepal-50 transition">
                <Upload size={14} className="text-deepal-500" />
                <span className="text-xs font-semibold text-deepal-600">
                  {forms.deliveryOrderFile ? forms.deliveryOrderFile.name : 'Upload Bank DO'}
                </span>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => forms.setDeliveryOrderFile(e.target.files?.[0] ?? null)} />
              </label>
              {forms.deliveryOrderUrl && <a href={forms.deliveryOrderUrl} target="_blank" rel="noreferrer" className="text-[10px] text-deepal-500 mt-1 block hover:underline">View existing DO</a>}
            </Field>
          </div>
        )}

        <FieldGroup columns={1}>{notesField}</FieldGroup>
        <EvidenceUploadZone state={state} dealId={selectedItem.id} />
        <CTA
          label="Structure Payment & Proceed"
          icon={CreditCard}
          isLoading={isActionLoading}
          missingLabels={stepMissingLabels}
        />
      </form>
    );
  }

  // ─── PAYMENT_STRUCTURED / BANK_ALLOTMENT: Mark Ready ──────────────────
  if (state === 'PAYMENT_STRUCTURED' || state === 'BANK_ALLOTMENT') {
    return (
      <div className="space-y-4">
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
          <p className="text-sm font-bold text-emerald-800 mb-2">Pre-Delivery Inspection Checklist</p>
          <ul className="text-xs text-emerald-700 space-y-1">
            {['Bank DO verified & signed', 'Down payment deposited', 'PDI wash & detailing complete', 'Gate pass prepared', 'Allotment letter printed (if financed)'].map(item => (
              <li key={item} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full border-2 border-emerald-400 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <FieldGroup columns={1}>{notesField}</FieldGroup>
        <EvidenceUploadZone state={state} dealId={selectedItem.id} />
        <CTA
          label="Mark Ready for Delivery"
          icon={CheckCircle2}
          variant="success"
          onClick={forms.handleReadyForDelivery}
          isLoading={isActionLoading}
          missingLabels={stepMissingLabels}
        />
      </div>
    );
  }

  // ─── READY_FOR_DELIVERY: Complete Delivery ─────────────────────────────
  if (state === 'READY_FOR_DELIVERY') {
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-br from-deepal-50 to-purple-50 border border-deepal-100 rounded-xl p-4 text-center">
          <Sparkles className="mx-auto text-deepal-500 mb-2" size={28} />
          <p className="text-sm font-bold text-deepal-800">Vehicle Ready for Delivery</p>
          <p className="text-xs text-surface-500 mt-1">Confirm handover form is signed and keys have been released to the customer.</p>
        </div>
        <FieldGroup columns={1}>{notesField}</FieldGroup>
        <EvidenceUploadZone state={state} dealId={selectedItem.id} />
        <CTA
          label="Complete Delivery 🎉"
          variant="success"
          onClick={forms.handleCompleteDelivery}
          isLoading={isActionLoading}
          missingLabels={stepMissingLabels}
        />
      </div>
    );
  }

  // ─── DELIVERED: Activate Insurance ────────────────────────────────────
  if (state === 'DELIVERED') {
    return (
      <div className="space-y-4">
        <Field label="Insurance Policy No." colSpan hint="Enter the policy number after receiving confirmation from the insurer.">
          <TextInput
            value={forms.insuranceNo}
            onChange={e => forms.setInsuranceNo(e.target.value)}
            placeholder="INS-XXXX-XXXX"
            disabled={forms.willUpdateInsuranceLater}
          />
        </Field>
        <label className="flex items-center gap-2 text-xs font-semibold text-surface-600 cursor-pointer">
          <input
            type="checkbox"
            checked={forms.willUpdateInsuranceLater}
            onChange={e => forms.setWillUpdateInsuranceLater(e.target.checked)}
            className="w-4 h-4 rounded accent-deepal-500"
          />
          I've sent the activation email — will update policy number later
        </label>
        <FieldGroup columns={1}>{notesField}</FieldGroup>
        <EvidenceUploadZone state={state} dealId={selectedItem.id} />
        <CTA
          label="Activate Insurance"
          icon={ShieldCheck}
          onClick={forms.handleInsuranceActivate}
          isLoading={isActionLoading}
          missingLabels={stepMissingLabels}
        />
      </div>
    );
  }

  // ─── INSURANCE_ACTIVATION: Generate Allotment Letter ──────────────────
  if (state === 'INSURANCE_ACTIVATION') {
    return (
      <div className="space-y-4">
        <div className="bg-violet-50 border border-violet-100 rounded-xl p-4">
          <p className="text-sm font-bold text-violet-800 mb-1 flex items-center gap-2">
            <FileText size={14} /> Bank Allotment Letter
          </p>
          <p className="text-xs text-violet-600">Generate and send the allotment letter to the financing bank. This progresses the deal into the bank's processing queue.</p>
        </div>
        <FieldGroup columns={1}>{notesField}</FieldGroup>
        <EvidenceUploadZone state={state} dealId={selectedItem.id} />
        <CTA
          label="Generate & Send Allotment Letter"
          icon={FileText}
          onClick={forms.handleGenerateAllotment}
          isLoading={isActionLoading}
          missingLabels={stepMissingLabels}
        />
      </div>
    );
  }

  // ─── INSURANCE_ACTIVATION / BANK_ALLOTMENT: DoTM Registration ─────────
  if (state === 'BANK_ALLOTMENT') {
    return (
      <div className="space-y-4">
        <Field label="Registration Plate No." required hint="The plate number issued by DoTM after vehicle registration." colSpan>
          <TextInput value={forms.registrationNo} onChange={e => forms.setRegistrationNo(e.target.value)} placeholder="e.g. BA 1 JA 1234" />
        </Field>
        <FieldGroup columns={1}>{notesField}</FieldGroup>
        <EvidenceUploadZone state={state} dealId={selectedItem.id} />
        <CTA
          label="Submit DoTM Registration"
          icon={Stamp}
          onClick={forms.handleRegisterDoTM}
          isLoading={isActionLoading}
          missingLabels={stepMissingLabels}
        />
      </div>
    );
  }

  // ─── DOTM_REGISTRATION: Endorse Insurance ─────────────────────────────
  if (state === 'DOTM_REGISTRATION') {
    return (
      <div className="space-y-4">
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
          <p className="text-sm font-bold text-indigo-800 flex items-center gap-2">
            <ShieldCheck size={14} /> Insurance Endorsement
          </p>
          <p className="text-xs text-indigo-600 mt-1">
            Confirm the insurance policy has been endorsed to include the financing bank
            {selectedItem.bankName ? ` (${selectedItem.bankName})` : ''} and the customer.
          </p>
          {selectedItem.registrationNo && (
            <p className="mt-2 text-xs font-mono bg-white border border-indigo-200 rounded-lg px-2.5 py-1.5 text-indigo-700">
              Plate: {selectedItem.registrationNo}
            </p>
          )}
        </div>
        <FieldGroup columns={1}>{notesField}</FieldGroup>
        <EvidenceUploadZone state={state} dealId={selectedItem.id} />
        <CTA
          label="Confirm Insurance Endorsed"
          icon={ShieldCheck}
          onClick={forms.handleEndorseInsurance}
          isLoading={isActionLoading}
          missingLabels={stepMissingLabels}
        />
      </div>
    );
  }

  // ─── INSURANCE_ENDORSEMENT: Bank Disbursement ──────────────────────────
  if (state === 'INSURANCE_ENDORSEMENT') {
    return (
      <div className="space-y-4">
        <Field label="Disbursement Amount Released by Bank" required colSpan>
          <TextInput type="number" value={forms.disbursementAmt} onChange={e => forms.setDisbursementAmt(e.target.value)} placeholder="NPR" />
        </Field>
        <FieldGroup columns={1}>{notesField}</FieldGroup>
        <EvidenceUploadZone state={state} dealId={selectedItem.id} />
        <CTA
          label="Confirm Disbursement Received"
          icon={BanknoteIcon}
          variant="success"
          onClick={forms.handleDisbursementSubmit}
          isLoading={isActionLoading}
          missingLabels={journeyMissingLabels}
          warnOnly={false}
        />
      </div>
    );
  }

  // ─── BANK_DISBURSEMENT / terminal ─────────────────────────────────────
  if (state === 'BANK_DISBURSEMENT') {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center">
          <CheckCircle2 size={28} className="text-emerald-500" />
        </div>
        <p className="text-base font-bold text-surface-800">Journey Complete</p>
        <p className="text-sm text-surface-500 max-w-[240px] leading-relaxed">
          All milestones achieved. Bank disbursement confirmed. Deal fully closed.
        </p>
      </div>
    );
  }

  return (
    <div className="text-center py-8 text-surface-400 text-sm">
      No available action for state: <code>{state}</code>
    </div>
  );
};
