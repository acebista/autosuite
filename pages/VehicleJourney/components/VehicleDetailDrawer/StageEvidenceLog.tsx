import React from 'react';
import { CheckCircle2, Lock } from 'lucide-react';
import { STATE_METADATA } from '../../../../lib/stateMachine';

const EVIDENCE_FIELDS: Partial<Record<string, { label: string; field: string; format?: (v: any) => string }[]>> = {
  IN_TRANSIT: [
    { label: 'Transit Date', field: 'expectedDeliveryDate' }
  ],
  RECEIVED: [
    { label: 'GRN Number', field: 'grnNumber' },
    { label: 'Engine No.', field: 'motorNo' },
    { label: 'VIN / Chassis No.', field: 'vin' },
  ],
  PAYMENT_STRUCTURED: [
    { label: 'Payment Type', field: 'paymentType' },
    { label: 'Sale Price', field: 'salePrice', format: v => v ? `NPR ${Number(v).toLocaleString()}` : '—' },
    { label: 'Booking Amount', field: 'bookingAmount', format: v => v ? `NPR ${Number(v).toLocaleString()}` : '—' },
    { label: 'Bank Name', field: 'bankName' },
    { label: 'RM Contact', field: 'rmName' },
    { label: 'Approved Loan', field: 'approvedLoan', format: v => v ? `NPR ${Number(v).toLocaleString()}` : '—' },
  ],
  INSURANCE_ACTIVATION: [
    { label: 'Insurance Policy No.', field: 'insurancePolicyNo' },
  ],
  DOTM_REGISTRATION: [
    { label: 'Registration No.', field: 'registrationNo' },
    { label: 'Registered Under', field: 'registeredUnder' },
  ],
  BANK_DISBURSEMENT: [
    { label: 'Disbursement Amount', field: 'disbursementAmount', format: v => v ? `NPR ${Number(v).toLocaleString()}` : '—' },
  ],
};

const STAGE_ORDER = [
  'PO_ISSUED', 'LC_OPENED', 'IN_TRANSIT', 'RECEIVED', 'IN_STOCK',
  'BOOKED', 'ALLOCATED', 'PAYMENT_STRUCTURED', 'BANK_ALLOTMENT',
  'READY_FOR_DELIVERY', 'DELIVERED', 'INSURANCE_ACTIVATION',
  'DOTM_REGISTRATION', 'INSURANCE_ENDORSEMENT', 'BANK_DISBURSEMENT'
];

interface StageEvidenceLogProps {
  selectedItem: any;
  pis: any[];
}

export const StageEvidenceLog: React.FC<StageEvidenceLogProps> = ({ selectedItem, pis }) => {
  const currentIdx = STAGE_ORDER.indexOf(selectedItem.state);
  const completedStages = STAGE_ORDER.slice(0, currentIdx + 1).filter(s => EVIDENCE_FIELDS[s]);

  const linkedPI = pis.find((p: any) => p.id === selectedItem.rawVehicle?.piId);
  const vehicle = selectedItem.rawVehicle || {};
  const deal = selectedItem.rawDeal || {};

  // Merge both sources for evidence lookup
  const evidenceSource: Record<string, any> = {
    ...vehicle,
    ...deal,
    vin: vehicle.vin || deal.vin,
    motorNo: vehicle.motorNo,
    grnNumber: vehicle.grnNumber,
    expectedDeliveryDate: vehicle.expectedDeliveryDate,
  };

  if (completedStages.length === 0 && !linkedPI) {
    return null;
  }

  return (
    <div className="px-6 py-4">
      <h4 className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-3">Stage Evidence Log</h4>

      {/* PI information at top */}
      {linkedPI && (
        <div className="bg-deepal-50 border border-deepal-100 rounded-xl p-3 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <Lock size={12} className="text-deepal-500" />
            <p className="text-xs font-bold text-deepal-700">Proforma Invoice</p>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div>
              <p className="text-[10px] text-surface-400 font-semibold">PI Number</p>
              <p className="text-xs font-mono text-surface-700">{linkedPI.piNumber}</p>
            </div>
            <div>
              <p className="text-[10px] text-surface-400 font-semibold">Issue Date</p>
              <p className="text-xs text-surface-700">{linkedPI.issueDate ? new Date(linkedPI.issueDate).toLocaleDateString() : '—'}</p>
            </div>
            {linkedPI.lc && (
              <>
                <div>
                  <p className="text-[10px] text-surface-400 font-semibold">LC Number</p>
                  <p className="text-xs font-mono text-surface-700">{linkedPI.lc.lcNumber}</p>
                </div>
                <div>
                  <p className="text-[10px] text-surface-400 font-semibold">LC Bank</p>
                  <p className="text-xs text-surface-700">{linkedPI.lc.bankName}</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Completed stage evidence */}
      <div className="space-y-2">
        {completedStages.map(stage => {
          const fields = EVIDENCE_FIELDS[stage]!;
          const stageMeta = STATE_METADATA[stage as keyof typeof STATE_METADATA];
          const hasData = fields.some(f => evidenceSource[f.field]);

          if (!hasData) return null;

          return (
            <div key={stage} className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={12} className="text-emerald-500 flex-shrink-0" />
                <p className="text-xs font-bold text-emerald-700">{stageMeta?.label ?? stage}</p>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {fields.map(({ label, field, format }) => {
                  const raw = evidenceSource[field];
                  if (!raw) return null;
                  const display = format ? format(raw) : (field.includes('Date') || field.includes('At') ? new Date(raw).toLocaleDateString() : String(raw));
                  return (
                    <div key={field}>
                      <p className="text-[10px] text-surface-400 font-semibold uppercase tracking-wide">{label}</p>
                      <p className="text-xs font-mono text-surface-700 break-all">{display}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
